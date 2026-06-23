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
import {
  chamferSimilarity,
  extractEdgePoints,
  normalizeStrokes,
  strokesToPointCloud,
  type Point,
} from './geometry';

export interface RecognitionResult {
  correct: boolean;
  confidence: number;
  predictedLetterId: string;
  feedback: string;
}

interface LetterTemplate {
  letterId: string;
  style: LetterStyle;
  mask: Uint8Array;
  edgePoints: Point[];
  strokePoints: Point[];
}

const TEMPLATE_VARIANTS = [
  { rotation: 0, scale: 1, offsetX: 0, offsetY: 0 },
  { rotation: -5, scale: 0.95, offsetX: -1, offsetY: 0 },
  { rotation: 5, scale: 0.95, offsetX: 1, offsetY: 0 },
];

let templates: LetterTemplate[] | null = null;
let fontsReady = false;

async function ensureFonts(): Promise<void> {
  if (fontsReady) return;
  await document.fonts.ready;
  await document.fonts.load('48px "Frank Ruhl Libre"');
  await document.fonts.load('48px "Gveret Levin"');
  fontsReady = true;
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
  if (!ctx) return new Uint8Array(size * size);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2 + variant.offsetX, size / 2 + variant.offsetY);
  ctx.rotate((variant.rotation * Math.PI) / 180);
  ctx.scale(variant.scale, variant.scale);
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(size * 0.68)}px ${LETTER_STYLE_FONTS[style]}`;
  ctx.lineWidth = Math.max(2, size * 0.1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeText(char, 0, size * 0.02);
  ctx.fillText(char, 0, size * 0.02);
  ctx.restore();

  const { data } = ctx.getImageData(0, 0, size, size);
  const grayscale = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    grayscale[i] = 1 - data[i * 4] / 255;
  }
  return binarizePixels(grayscale, 0.2);
}

function maskToPseudoStrokes(mask: Uint8Array, size: number): Point[][] {
  const ink: Point[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (mask[y * size + x]) ink.push({ x, y });
    }
  }
  if (ink.length === 0) return [];

  const cx = ink.reduce((sum, p) => sum + p.x, 0) / ink.length;
  const cy = ink.reduce((sum, p) => sum + p.y, 0) / ink.length;
  ink.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));

  const stride = Math.max(1, Math.floor(ink.length / 48));
  const polyline: Point[] = [];
  for (let i = 0; i < ink.length; i += stride) {
    polyline.push(ink[i]);
  }
  return [polyline];
}

function buildTemplates(): LetterTemplate[] {
  const built: LetterTemplate[] = [];

  for (const letter of HEBREW_LETTERS) {
    for (const style of ['block', 'script'] as const) {
      for (const variant of TEMPLATE_VARIANTS) {
        const mask = renderTemplateMask(letter.char, style, variant);
        const edgePoints = extractEdgePoints(mask, IMAGE_SIZE);
        const strokePoints = strokesToPointCloud(maskToPseudoStrokes(mask, IMAGE_SIZE), 24);
        built.push({
          letterId: letter.id,
          style,
          mask,
          edgePoints,
          strokePoints,
        });
      }
    }
  }

  return built;
}

function ensureTemplates(): LetterTemplate[] {
  if (!templates) {
    templates = buildTemplates();
  }
  return templates;
}

function scoreAgainstTemplate(
  drawingMask: Uint8Array,
  drawingEdgePoints: Point[],
  drawingStrokePoints: Point[],
  template: LetterTemplate,
): number {
  const dice = diceCoefficient(drawingMask, template.mask);
  const edge = chamferSimilarity(drawingEdgePoints, template.edgePoints);
  const stroke = chamferSimilarity(drawingStrokePoints, template.strokePoints);
  return dice * 0.35 + edge * 0.4 + stroke * 0.25;
}

function bestLetterScore(
  letterId: string,
  style: LetterStyle,
  drawingMask: Uint8Array,
  drawingEdgePoints: Point[],
  drawingStrokePoints: Point[],
  allTemplates: LetterTemplate[],
): number {
  let best = 0;
  for (const template of allTemplates) {
    if (template.letterId !== letterId || template.style !== style) continue;
    best = Math.max(
      best,
      scoreAgainstTemplate(drawingMask, drawingEdgePoints, drawingStrokePoints, template),
    );
  }
  return best;
}

export async function recognizeHebrewDrawing(params: {
  canvas: HTMLCanvasElement;
  strokes: Point[][];
  expectedLetterId: string;
  targetStyle: LetterStyle;
}): Promise<RecognitionResult> {
  await ensureFonts();
  const allTemplates = ensureTemplates();

  const grayscale = canvasToGrayscaleArray(params.canvas, IMAGE_SIZE);
  let drawingMask = binarizePixels(grayscale, 0.16);
  drawingMask = dilateBinary(drawingMask, IMAGE_SIZE, 2);
  const drawingEdgePoints = extractEdgePoints(drawingMask, IMAGE_SIZE);

  const rect = params.canvas.getBoundingClientRect();
  const normalizedStrokes = normalizeStrokes(
    params.strokes,
    rect.width || IMAGE_SIZE,
    rect.height || IMAGE_SIZE,
    IMAGE_SIZE,
  );
  const drawingStrokePoints = strokesToPointCloud(normalizedStrokes, 18);

  const expectedScore = bestLetterScore(
    params.expectedLetterId,
    params.targetStyle,
    drawingMask,
    drawingEdgePoints,
    drawingStrokePoints,
    allTemplates,
  );

  let predictedLetterId = params.expectedLetterId;
  let bestScore = 0;
  let bestWrongScore = 0;

  for (const letter of HEBREW_LETTERS) {
    const score = bestLetterScore(
      letter.id,
      params.targetStyle,
      drawingMask,
      drawingEdgePoints,
      drawingStrokePoints,
      allTemplates,
    );

    if (score > bestScore) {
      bestScore = score;
      predictedLetterId = letter.id;
    }

    if (letter.id !== params.expectedLetterId) {
      bestWrongScore = Math.max(bestWrongScore, score);
    }
  }

  const margin = expectedScore - bestWrongScore;
  const correct =
    predictedLetterId === params.expectedLetterId &&
    expectedScore >= 0.18 &&
    margin >= 0.01;

  const confidence = Math.max(
    0.08,
    Math.min(0.98, expectedScore * 0.7 + Math.max(0, margin) * 0.3),
  );

  return {
    correct,
    confidence,
    predictedLetterId,
    feedback: correct
      ? 'Nice — your strokes match the target letter shape.'
      : margin < 0.01
        ? 'Close, but another letter shape fits better. Compare with the answer shown.'
        : 'Try to match the overall shape and number of strokes more closely.',
  };
}

export function preloadHebrewMatcher(): void {
  void ensureFonts().then(() => {
    ensureTemplates();
  });
}
