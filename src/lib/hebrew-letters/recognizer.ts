import {
  HEBREW_LETTERS,
  IMAGE_SIZE,
  LETTER_STYLE_FONTS,
  type LetterStyle,
} from './letters';
import {
  binarizePixels,
  canvasToGrayscaleArray,
  diceCoefficient,
  dilateBinary,
} from './imagePreprocess';

export interface RecognitionResult {
  letterId: string;
  confidence: number;
  topPredictions: Array<{ letterId: string; confidence: number }>;
}

export interface RecognizerLoadProgress {
  stage: 'fonts' | 'templates' | 'model' | 'ready';
  percent: number;
  message: string;
  detail?: string;
}

interface LetterTemplate {
  letterId: string;
  style: LetterStyle;
  mask: Uint8Array;
}

type ProgressCallback = (progress: RecognizerLoadProgress) => void;

const INPUT_DIM = IMAGE_SIZE * IMAGE_SIZE;
const STYLE_MATCH_WEIGHT = 1;
const OTHER_STYLE_WEIGHT = 0.45;

const TEMPLATE_VARIANTS: Array<{
  rotation: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  mode: 'stroke' | 'fill';
}> = [
  { rotation: 0, scale: 1, offsetX: 0, offsetY: 0, mode: 'stroke' },
  { rotation: -7, scale: 0.94, offsetX: -1, offsetY: 0, mode: 'stroke' },
  { rotation: 7, scale: 0.94, offsetX: 1, offsetY: 0, mode: 'stroke' },
  { rotation: 0, scale: 0.9, offsetX: 0, offsetY: 1, mode: 'fill' },
];

let templates: LetterTemplate[] = [];
let initPromise: Promise<void> | null = null;

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

function renderTemplateMask(
  char: string,
  style: LetterStyle,
  variant: (typeof TEMPLATE_VARIANTS)[number],
): Uint8Array {
  const size = IMAGE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Uint8Array(INPUT_DIM);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(size / 2 + variant.offsetX, size / 2 + variant.offsetY);
  ctx.rotate((variant.rotation * Math.PI) / 180);
  ctx.scale(variant.scale, variant.scale);
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(size * 0.68)}px ${LETTER_STYLE_FONTS[style]}`;

  if (variant.mode === 'stroke') {
    ctx.lineWidth = Math.max(2, size * 0.1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeText(char, 0, size * 0.02);
  } else {
    ctx.fillText(char, 0, size * 0.02);
  }
  ctx.restore();

  const { data } = ctx.getImageData(0, 0, size, size);
  const grayscale = new Float32Array(INPUT_DIM);
  for (let i = 0; i < INPUT_DIM; i++) {
    grayscale[i] = 1 - data[i * 4] / 255;
  }

  return binarizePixels(grayscale, 0.2);
}

function scoreTemplates(
  drawingMask: Uint8Array,
  style: LetterStyle,
): Array<{ letterId: string; score: number }> {
  const bestByLetter = new Map<string, number>();

  for (const template of templates) {
    const dice = diceCoefficient(drawingMask, template.mask);
    const weight = template.style === style ? STYLE_MATCH_WEIGHT : OTHER_STYLE_WEIGHT;
    const weighted = dice * weight;
    const prev = bestByLetter.get(template.letterId) ?? 0;
    if (weighted > prev) {
      bestByLetter.set(template.letterId, weighted);
    }
  }

  return HEBREW_LETTERS.map((letter) => ({
    letterId: letter.id,
    score: bestByLetter.get(letter.id) ?? 0,
  }));
}

function scoresToConfidence(scores: Array<{ letterId: string; score: number }>): Array<{
  letterId: string;
  confidence: number;
}> {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const best = sorted[0]?.score ?? 0;
  const second = sorted[1]?.score ?? 0;
  const margin = Math.max(0, best - second);

  const temperature = 14;
  const logits = scores.map((entry) => entry.score * temperature);
  const maxLogit = Math.max(...logits);
  const exps = logits.map((logit) => Math.exp(logit - maxLogit));
  const sum = exps.reduce((acc, value) => acc + value, 0) || 1;

  return scores
    .map((entry, index) => {
      const softmax = exps[index] / sum;
      const marginBoost = best > 0 ? margin / best : 0;
      const confidence = Math.min(0.99, softmax * 0.65 + best * 0.25 + marginBoost * 0.1);
      return {
        letterId: entry.letterId,
        confidence,
      };
    })
    .sort((a, b) => b.confidence - a.confidence);
}

async function buildRecognizer(onProgress?: ProgressCallback): Promise<void> {
  onProgress?.({
    stage: 'fonts',
    percent: 4,
    message: 'Loading Hebrew fonts…',
    detail: 'Frank Ruhl Libre & Gveret Levin',
  });
  await document.fonts.ready;
  await document.fonts.load('48px "Frank Ruhl Libre"');
  await document.fonts.load('48px "Gveret Levin"');
  await yieldToMain();

  const built: LetterTemplate[] = [];

  for (let letterIndex = 0; letterIndex < HEBREW_LETTERS.length; letterIndex++) {
    const letter = HEBREW_LETTERS[letterIndex];
    const styles: LetterStyle[] = ['block', 'script'];

    for (const style of styles) {
      for (const variant of TEMPLATE_VARIANTS) {
        built.push({
          letterId: letter.id,
          style,
          mask: renderTemplateMask(letter.char, style, variant),
        });
      }
    }

    const percent = 8 + Math.round(((letterIndex + 1) / HEBREW_LETTERS.length) * 82);
    onProgress?.({
      stage: 'templates',
      percent,
      message: `Building letter templates (${letterIndex + 1}/${HEBREW_LETTERS.length})`,
      detail: `${letter.name} · ${letter.char}`,
    });

    if (letterIndex % 2 === 1) {
      await yieldToMain();
    }
  }

  onProgress?.({
    stage: 'model',
    percent: 96,
    message: 'Finalizing shape matcher…',
    detail: 'Tuning stroke comparison',
  });
  await yieldToMain();

  templates = built;

  onProgress?.({
    stage: 'ready',
    percent: 100,
    message: 'Ready to practice!',
  });
}

export async function initHebrewLetterRecognizer(onProgress?: ProgressCallback): Promise<void> {
  if (templates.length > 0) {
    onProgress?.({
      stage: 'ready',
      percent: 100,
      message: 'Ready to practice!',
    });
    return;
  }
  if (initPromise) return initPromise;

  initPromise = buildRecognizer(onProgress).catch((error) => {
    initPromise = null;
    throw error;
  });

  return initPromise;
}

export function isRecognizerReady(): boolean {
  return templates.length > 0;
}

export async function recognizeHebrewLetter(
  canvas: HTMLCanvasElement,
  shownStyle: LetterStyle,
): Promise<RecognitionResult> {
  await initHebrewLetterRecognizer();
  if (templates.length === 0) {
    throw new Error('Recognizer failed to initialize');
  }

  const grayscale = canvasToGrayscaleArray(canvas, IMAGE_SIZE);
  let drawingMask = binarizePixels(grayscale, 0.18);
  drawingMask = dilateBinary(drawingMask, IMAGE_SIZE, 2);

  const scores = scoreTemplates(drawingMask, shownStyle);
  const ranked = scoresToConfidence(scores);

  return {
    letterId: ranked[0].letterId,
    confidence: ranked[0].confidence,
    topPredictions: ranked.slice(0, 3),
  };
}

export function disposeRecognizer(): void {
  templates = [];
  initPromise = null;
}
