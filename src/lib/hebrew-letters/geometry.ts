export interface Point {
  x: number;
  y: number;
}

export function extractEdgePoints(mask: Uint8Array, size: number): Point[] {
  const points: Point[] = [];

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      if (!mask[y * size + x]) continue;

      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (mask[(y + dy) * size + (x + dx)]) neighbors += 1;
        }
      }

      if (neighbors < 8) {
        points.push({ x, y });
      }
    }
  }

  return points;
}

function dist2(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** Lower is better. Symmetric average nearest-neighbor distance. */
export function chamferDistance(a: Point[], b: Point[]): number {
  if (a.length === 0 || b.length === 0) return Number.POSITIVE_INFINITY;

  let ab = 0;
  for (const p of a) {
    let best = Number.POSITIVE_INFINITY;
    for (const q of b) {
      best = Math.min(best, dist2(p, q));
    }
    ab += best;
  }

  let ba = 0;
  for (const q of b) {
    let best = Number.POSITIVE_INFINITY;
    for (const p of a) {
      best = Math.min(best, dist2(p, q));
    }
    ba += best;
  }

  return (ab / a.length + ba / b.length) / 2;
}

export function chamferSimilarity(a: Point[], b: Point[]): number {
  const distance = chamferDistance(a, b);
  if (!Number.isFinite(distance)) return 0;
  return 1 / (1 + Math.sqrt(distance));
}

export function normalizeStrokes(
  strokes: Point[][],
  canvasWidth: number,
  canvasHeight: number,
  targetSize = 48,
): Point[][] {
  const flat = strokes.flat();
  if (flat.length === 0) return [];

  let minX = canvasWidth;
  let minY = canvasHeight;
  let maxX = 0;
  let maxY = 0;

  for (const point of flat) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const boxW = Math.max(maxX - minX, 1);
  const boxH = Math.max(maxY - minY, 1);
  const padding = targetSize * 0.1;
  const scale = Math.min((targetSize - padding * 2) / boxW, (targetSize - padding * 2) / boxH);
  const offsetX = (targetSize - boxW * scale) / 2;
  const offsetY = (targetSize - boxH * scale) / 2;

  return strokes
    .map((stroke) =>
      stroke.map((point) => ({
        x: (point.x - minX) * scale + offsetX,
        y: (point.y - minY) * scale + offsetY,
      })),
    )
    .filter((stroke) => stroke.length > 1);
}

export function resampleStroke(stroke: Point[], count: number): Point[] {
  if (stroke.length === 0) return [];
  if (stroke.length === 1) return Array.from({ length: count }, () => ({ ...stroke[0] }));

  const lengths: number[] = [0];
  for (let i = 1; i < stroke.length; i++) {
    lengths.push(lengths[i - 1] + Math.sqrt(dist2(stroke[i - 1], stroke[i])));
  }

  const total = lengths[lengths.length - 1] || 1;
  const out: Point[] = [];

  for (let i = 0; i < count; i++) {
    const target = (total * i) / (count - 1);
    let idx = 1;
    while (idx < lengths.length && lengths[idx] < target) idx += 1;
    const prev = stroke[idx - 1];
    const next = stroke[Math.min(idx, stroke.length - 1)];
    const span = lengths[idx] - lengths[idx - 1] || 1;
    const t = (target - lengths[idx - 1]) / span;
    out.push({
      x: prev.x + (next.x - prev.x) * t,
      y: prev.y + (next.y - prev.y) * t,
    });
  }

  return out;
}

export function strokesToPointCloud(strokes: Point[][], samplesPerStroke = 16): Point[] {
  return strokes.flatMap((stroke) => resampleStroke(stroke, samplesPerStroke));
}
