import { IMAGE_SIZE } from './letters';

export function canvasHasInk(canvas: HTMLCanvasElement, threshold = 12): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 255 - threshold) return true;
  }
  return false;
}

export function normalizeDrawingToCanvas(source: HTMLCanvasElement, size = IMAGE_SIZE): HTMLCanvasElement {
  const output = document.createElement('canvas');
  output.width = size;
  output.height = size;

  const srcCtx = source.getContext('2d');
  const outCtx = output.getContext('2d');
  if (!srcCtx || !outCtx) return output;

  const imageData = srcCtx.getImageData(0, 0, source.width, source.height);
  const { data, width, height } = imageData;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      const r = data[(y * width + x) * 4];
      if (alpha > 0 && r < 250) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  outCtx.fillStyle = '#ffffff';
  outCtx.fillRect(0, 0, size, size);

  if (maxX <= minX || maxY <= minY) {
    return output;
  }

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  const padding = size * 0.12;
  const scale = Math.min((size - padding * 2) / boxW, (size - padding * 2) / boxH);
  const drawW = boxW * scale;
  const drawH = boxH * scale;
  const offsetX = (size - drawW) / 2;
  const offsetY = (size - drawH) / 2;

  outCtx.drawImage(
    source,
    minX,
    minY,
    boxW,
    boxH,
    offsetX,
    offsetY,
    drawW,
    drawH,
  );

  return output;
}

export function canvasToGrayscaleArray(canvas: HTMLCanvasElement, size = IMAGE_SIZE): Float32Array {
  const normalized = normalizeDrawingToCanvas(canvas, size);
  const ctx = normalized.getContext('2d');
  if (!ctx) return new Float32Array(size * size);

  const { data } = ctx.getImageData(0, 0, size, size);
  const pixels = new Float32Array(size * size);

  for (let i = 0; i < size * size; i++) {
    const r = data[i * 4];
    pixels[i] = 1 - r / 255;
  }

  return pixels;
}

export function normalizeVector(vector: Float32Array): void {
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  for (let i = 0; i < vector.length; i++) {
    vector[i] /= norm;
  }
}
