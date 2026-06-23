import * as tf from '@tensorflow/tfjs';

import { normalizeDrawingToCanvas } from './imagePreprocess';
import {
  bestLetterFromProbabilities,
  MODEL_INPUT_SIZE,
  MODEL_URL,
  probabilityForLetterId,
} from './modelLabels';

let model: tf.LayersModel | null = null;
let loadPromise: Promise<void> | null = null;

export async function loadManuscriptModel(onProgress?: (percent: number) => void): Promise<void> {
  if (model) {
    onProgress?.(100);
    return;
  }
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    onProgress?.(20);
    const loaded = await tf.loadLayersModel(MODEL_URL);
    onProgress?.(100);
    model = loaded;
  })().catch((error) => {
    loadPromise = null;
    throw error;
  });

  return loadPromise;
}

export function isManuscriptModelReady(): boolean {
  return model !== null;
}

/** White background, dark ink → 64×64×3 tensor scaled 0–1 (matches Keras training). */
export function canvasToModelTensor(canvas: HTMLCanvasElement): tf.Tensor4D {
  const normalized = normalizeDrawingToCanvas(canvas, MODEL_INPUT_SIZE);
  const ctx = normalized.getContext('2d');
  if (!ctx) {
    return tf.zeros([1, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 3]);
  }

  const { data } = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  const pixels = new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3);

  for (let i = 0; i < MODEL_INPUT_SIZE * MODEL_INPUT_SIZE; i++) {
    const value = data[i * 4] / 255;
    const offset = i * 3;
    pixels[offset] = value;
    pixels[offset + 1] = value;
    pixels[offset + 2] = value;
  }

  return tf.tensor4d(pixels, [1, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 3]);
}

export async function predictLetterFromCanvas(
  canvas: HTMLCanvasElement,
  expectedLetterId: string,
): Promise<{ predictedLetterId: string; confidence: number; expectedConfidence: number }> {
  await loadManuscriptModel();
  if (!model) throw new Error('Hebrew letter model failed to load');

  const input = canvasToModelTensor(canvas);
  const output = model.predict(input) as tf.Tensor;
  const probs = await output.data();
  input.dispose();
  output.dispose();

  const probsArray = probs instanceof Float32Array ? probs : new Float32Array(probs);
  const best = bestLetterFromProbabilities(probsArray);

  return {
    predictedLetterId: best.letterId,
    confidence: best.confidence,
    expectedConfidence: probabilityForLetterId(probsArray, expectedLetterId),
  };
}

export function disposeManuscriptModel(): void {
  model?.dispose();
  model = null;
  loadPromise = null;
}
