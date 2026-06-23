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
import type { RecognitionResult } from './recognizeApi';

interface LetterTemplate {
  letterId: string;
  style: LetterStyle;
  mask: Uint8Array;
}

const TEMPLATE_VARIANTS = [
  { rotation: 0, scale: 1, offsetX: 0, offsetY: 0, mode: 'stroke' as const },
  { rotation: -6, scale: 0.94, offsetX: -1, offsetY: 0, mode: 'stroke' as const },
  { rotation: 6, scale: 0.94, offsetX: 1, offsetY: 0, mode: 'stroke' as const },
];

let templates: LetterTemplate[] | null = null;

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
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(size * 0.68)}px ${LETTER_STYLE_FONTS[style]}`;
  ctx.lineWidth = Math.max(2, size * 0.1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeText(char, 0, size * 0.02);
  ctx.restore();

  const { data } = ctx.getImageData(0, 0, size, size);
  const grayscale = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    grayscale[i] = 1 - data[i * 4] / 255;
  }
  return binarizePixels(grayscale, 0.2);
}

function ensureTemplates(): LetterTemplate[] {
  if (templates) return templates;

  const built: LetterTemplate[] = [];
  for (const letter of HEBREW_LETTERS) {
    for (const style of ['block', 'script'] as const) {
      for (const variant of TEMPLATE_VARIANTS) {
        built.push({
          letterId: letter.id,
          style,
          mask: renderTemplateMask(letter.char, style, variant),
        });
      }
    }
  }
  templates = built;
  return built;
}

function bestScoreForLetter(
  drawingMask: Uint8Array,
  letterId: string,
  style: LetterStyle,
  allTemplates: LetterTemplate[],
): number {
  let best = 0;
  for (const template of allTemplates) {
    if (template.letterId !== letterId || template.style !== style) continue;
    best = Math.max(best, diceCoefficient(drawingMask, template.mask));
  }
  return best;
}

/** Offline fallback when the vision API is unavailable. */
export function recognizeDrawingLocally(
  canvas: HTMLCanvasElement,
  expectedLetterId: string,
  targetStyle: LetterStyle,
): RecognitionResult {
  const allTemplates = ensureTemplates();
  const grayscale = canvasToGrayscaleArray(canvas, IMAGE_SIZE);
  let drawingMask = binarizePixels(grayscale, 0.16);
  drawingMask = dilateBinary(drawingMask, IMAGE_SIZE, 2);

  const expectedScore = bestScoreForLetter(drawingMask, expectedLetterId, targetStyle, allTemplates);

  let predictedLetterId = expectedLetterId;
  let bestScore = 0;

  for (const letter of HEBREW_LETTERS) {
    const score = bestScoreForLetter(drawingMask, letter.id, targetStyle, allTemplates);
    if (score > bestScore) {
      bestScore = score;
      predictedLetterId = letter.id;
    }
  }

  let bestWrongScore = 0;
  for (const letter of HEBREW_LETTERS) {
    if (letter.id === expectedLetterId) continue;
    bestWrongScore = Math.max(
      bestWrongScore,
      bestScoreForLetter(drawingMask, letter.id, targetStyle, allTemplates),
    );
  }

  const margin = expectedScore - bestWrongScore;
  const correct = predictedLetterId === expectedLetterId && expectedScore >= 0.08 && margin >= -0.01;

  const confidence = Math.max(0.05, Math.min(0.95, expectedScore + Math.max(0, margin)));

  return {
    correct,
    confidence,
    predictedLetterId,
    detectedStyle: targetStyle,
    feedback: correct
      ? 'Local fallback: shape looks close enough.'
      : 'Local fallback: try again with clearer strokes (vision API unavailable).',
    source: 'local',
  };
}
