import {
  HEBREW_LETTERS,
  IMAGE_SIZE,
  LETTER_STYLE_FONTS,
  type LetterStyle,
} from './letters';
import { binarizePixels, canvasToGrayscaleArray, dilateBinary } from './imagePreprocess';
import { chamferSimilarity, extractEdgePoints } from './geometry';

interface StyleTemplate {
  style: LetterStyle;
  mask: Uint8Array;
  edgePoints: ReturnType<typeof extractEdgePoints>;
}

let styleTemplateCache: Map<string, StyleTemplate[]> | null = null;

function renderStyleMask(char: string, style: LetterStyle): Uint8Array {
  const size = IMAGE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Uint8Array(size * size);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(size * 0.68)}px ${LETTER_STYLE_FONTS[style]}`;
  ctx.lineWidth = Math.max(2, size * 0.1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeText(char, 0, size * 0.02);
  if (style === 'block') {
    ctx.fillText(char, 0, size * 0.02);
  }
  ctx.restore();

  const { data } = ctx.getImageData(0, 0, size, size);
  const grayscale = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    grayscale[i] = 1 - data[i * 4] / 255;
  }
  return binarizePixels(grayscale, 0.2);
}

function templatesForLetter(letterId: string): StyleTemplate[] {
  if (!styleTemplateCache) {
    styleTemplateCache = new Map();
  }
  if (styleTemplateCache.has(letterId)) {
    return styleTemplateCache.get(letterId)!;
  }

  const letter = HEBREW_LETTERS.find((entry) => entry.id === letterId);
  if (!letter) return [];

  const templates: StyleTemplate[] = (['block', 'script'] as const).map((style) => {
    const mask = renderStyleMask(letter.char, style);
    return { style, mask, edgePoints: extractEdgePoints(mask, IMAGE_SIZE) };
  });

  styleTemplateCache.set(letterId, templates);
  return templates;
}

/** Returns how well the drawing matches the requested style for a known letter. */
export function scoreTargetStyle(
  canvas: HTMLCanvasElement,
  letterId: string,
  targetStyle: LetterStyle,
  shownStyle: LetterStyle,
): { targetScore: number; shownScore: number; passes: boolean } {
  const templates = templatesForLetter(letterId);
  const targetTemplate = templates.find((entry) => entry.style === targetStyle);
  const shownTemplate = templates.find((entry) => entry.style === shownStyle);
  if (!targetTemplate || !shownTemplate) {
    return { targetScore: 0, shownScore: 0, passes: true };
  }

  const grayscale = canvasToGrayscaleArray(canvas, IMAGE_SIZE);
  let drawingMask = binarizePixels(grayscale, 0.16);
  drawingMask = dilateBinary(drawingMask, IMAGE_SIZE, 2);
  const drawingEdges = extractEdgePoints(drawingMask, IMAGE_SIZE);

  const targetScore = chamferSimilarity(drawingEdges, targetTemplate.edgePoints);
  const shownScore = chamferSimilarity(drawingEdges, shownTemplate.edgePoints);

  const passes = targetScore >= shownScore * 0.82 || targetScore >= 0.14;

  return { targetScore, shownScore, passes };
}

export async function ensureStyleFonts(): Promise<void> {
  await document.fonts.ready;
  await document.fonts.load('48px "Frank Ruhl Libre"');
  await document.fonts.load('48px "Gveret Levin"');
}
