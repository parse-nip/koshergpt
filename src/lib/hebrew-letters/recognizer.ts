import {
  HEBREW_LETTERS,
  IMAGE_SIZE,
  LETTER_STYLE_FONTS,
  type LetterStyle,
} from './letters';
import { canvasToGrayscaleArray, normalizeVector } from './imagePreprocess';

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

type ProgressCallback = (progress: RecognizerLoadProgress) => void;

const INPUT_DIM = IMAGE_SIZE * IMAGE_SIZE;
const AUGMENTATIONS_PER_STYLE = 3;

let classWeights: Float32Array | null = null;
let initPromise: Promise<void> | null = null;

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

function renderLetterToPixels(
  char: string,
  style: LetterStyle,
  options?: { rotation?: number; scale?: number; offsetX?: number; offsetY?: number },
): Float32Array {
  const size = IMAGE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Float32Array(INPUT_DIM);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const rotation = options?.rotation ?? 0;
  const scale = options?.scale ?? 1;
  const offsetX = options?.offsetX ?? 0;
  const offsetY = options?.offsetY ?? 0;

  ctx.save();
  ctx.translate(size / 2 + offsetX, size / 2 + offsetY);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(size * 0.72)}px ${LETTER_STYLE_FONTS[style]}`;
  ctx.fillText(char, 0, size * 0.02);
  ctx.restore();

  const { data } = ctx.getImageData(0, 0, size, size);
  const pixels = new Float32Array(INPUT_DIM);
  for (let i = 0; i < INPUT_DIM; i++) {
    pixels[i] = 1 - data[i * 4] / 255;
  }
  return pixels;
}

function softmax(logits: Float32Array): Float32Array {
  const max = Math.max(...logits);
  const exps = new Float32Array(logits.length);
  let sum = 0;

  for (let i = 0; i < logits.length; i++) {
    exps[i] = Math.exp(logits[i] - max);
    sum += exps[i];
  }

  for (let i = 0; i < exps.length; i++) {
    exps[i] /= sum || 1;
  }

  return exps;
}

function buildLetterCentroid(char: string): Float32Array {
  const sum = new Float32Array(INPUT_DIM);
  let count = 0;
  const styles: LetterStyle[] = ['block', 'script'];

  for (const style of styles) {
    for (let sample = 0; sample < AUGMENTATIONS_PER_STYLE; sample++) {
      const pixels = renderLetterToPixels(char, style, {
        rotation: (Math.random() - 0.5) * 14,
        scale: 0.85 + Math.random() * 0.2,
        offsetX: (Math.random() - 0.5) * 4,
        offsetY: (Math.random() - 0.5) * 4,
      });

      for (let i = 0; i < INPUT_DIM; i++) {
        sum[i] += pixels[i];
      }
      count += 1;
    }
  }

  const centroid = new Float32Array(INPUT_DIM);
  for (let i = 0; i < INPUT_DIM; i++) {
    centroid[i] = sum[i] / count;
  }

  normalizeVector(centroid);
  return centroid;
}

async function buildRecognizer(onProgress?: ProgressCallback): Promise<void> {
  onProgress?.({
    stage: 'fonts',
    percent: 4,
    message: 'Loading Hebrew fonts…',
    detail: 'Frank Ruhl Libre & Gveret Levin',
  });
  await document.fonts.ready;
  await yieldToMain();

  const weights = new Float32Array(HEBREW_LETTERS.length * INPUT_DIM);

  for (let letterIndex = 0; letterIndex < HEBREW_LETTERS.length; letterIndex++) {
    const letter = HEBREW_LETTERS[letterIndex];
    const centroid = buildLetterCentroid(letter.char);
    weights.set(centroid, letterIndex * INPUT_DIM);

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
    message: 'Finalizing recognition model…',
    detail: 'Preparing lightweight classifier',
  });
  await yieldToMain();

  classWeights = weights;

  onProgress?.({
    stage: 'ready',
    percent: 100,
    message: 'Ready to practice!',
  });
}

export async function initHebrewLetterRecognizer(onProgress?: ProgressCallback): Promise<void> {
  if (classWeights) {
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
  return classWeights !== null;
}

export async function recognizeHebrewLetter(canvas: HTMLCanvasElement): Promise<RecognitionResult> {
  await initHebrewLetterRecognizer();
  if (!classWeights) {
    throw new Error('Recognizer failed to initialize');
  }

  const input = canvasToGrayscaleArray(canvas, IMAGE_SIZE);
  normalizeVector(input);

  const logits = new Float32Array(HEBREW_LETTERS.length);
  for (let classIndex = 0; classIndex < HEBREW_LETTERS.length; classIndex++) {
    const offset = classIndex * INPUT_DIM;
    let dot = 0;
    for (let i = 0; i < INPUT_DIM; i++) {
      dot += classWeights[offset + i] * input[i];
    }
    logits[classIndex] = dot;
  }

  const probs = softmax(logits);
  const ranked = Array.from(probs)
    .map((confidence, index) => ({
      letterId: HEBREW_LETTERS[index].id,
      confidence,
    }))
    .sort((a, b) => b.confidence - a.confidence);

  return {
    letterId: ranked[0].letterId,
    confidence: ranked[0].confidence,
    topPredictions: ranked.slice(0, 3),
  };
}

export function disposeRecognizer(): void {
  classWeights = null;
  initPromise = null;
}
