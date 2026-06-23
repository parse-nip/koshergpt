import * as tf from '@tensorflow/tfjs';

import {
  HEBREW_LETTERS,
  IMAGE_SIZE,
  LETTER_STYLE_FONTS,
  type LetterStyle,
} from './letters';
import { canvasToGrayscaleArray } from './imagePreprocess';

export interface RecognitionResult {
  letterId: string;
  confidence: number;
  topPredictions: Array<{ letterId: string; confidence: number }>;
}

let model: tf.LayersModel | null = null;
let initPromise: Promise<void> | null = null;

function renderLetterToPixels(
  char: string,
  style: LetterStyle,
  size: number,
  options?: { rotation?: number; scale?: number; offsetX?: number; offsetY?: number; lineWidth?: number },
): Float32Array {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Float32Array(size * size);

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
  const pixels = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    pixels[i] = 1 - data[i * 4] / 255;
  }
  return pixels;
}

function buildSyntheticDataset(samplesPerLetter = 28): { xs: Float32Array; ys: number[] } {
  const xsChunks: Float32Array[] = [];
  const ys: number[] = [];

  for (let letterIndex = 0; letterIndex < HEBREW_LETTERS.length; letterIndex++) {
    const letter = HEBREW_LETTERS[letterIndex];
    const styles: LetterStyle[] = ['block', 'script'];

    for (let sample = 0; sample < samplesPerLetter; sample++) {
      const style = styles[sample % styles.length];
      const pixels = renderLetterToPixels(letter.char, style, IMAGE_SIZE, {
        rotation: (Math.random() - 0.5) * 18,
        scale: 0.82 + Math.random() * 0.28,
        offsetX: (Math.random() - 0.5) * 8,
        offsetY: (Math.random() - 0.5) * 8,
      });
      xsChunks.push(pixels);
      ys.push(letterIndex);
    }
  }

  const total = xsChunks.length;
  const xs = new Float32Array(total * IMAGE_SIZE * IMAGE_SIZE);
  xsChunks.forEach((chunk, i) => {
    xs.set(chunk, i * IMAGE_SIZE * IMAGE_SIZE);
  });

  return { xs, ys };
}

function createModel(): tf.LayersModel {
  const input = tf.input({ shape: [IMAGE_SIZE, IMAGE_SIZE, 1] });

  let x = tf.layers
    .conv2d({ filters: 16, kernelSize: 3, activation: 'relu', padding: 'same' })
    .apply(input) as tf.SymbolicTensor;
  x = tf.layers.maxPooling2d({ poolSize: 2 }).apply(x) as tf.SymbolicTensor;

  x = tf.layers
    .conv2d({ filters: 32, kernelSize: 3, activation: 'relu', padding: 'same' })
    .apply(x) as tf.SymbolicTensor;
  x = tf.layers.maxPooling2d({ poolSize: 2 }).apply(x) as tf.SymbolicTensor;

  x = tf.layers
    .conv2d({ filters: 48, kernelSize: 3, activation: 'relu', padding: 'same' })
    .apply(x) as tf.SymbolicTensor;
  x = tf.layers.maxPooling2d({ poolSize: 2 }).apply(x) as tf.SymbolicTensor;

  x = tf.layers.flatten().apply(x) as tf.SymbolicTensor;
  x = tf.layers.dense({ units: 96, activation: 'relu' }).apply(x) as tf.SymbolicTensor;
  x = tf.layers.dropout({ rate: 0.15 }).apply(x) as tf.SymbolicTensor;
  const output = tf.layers
    .dense({ units: HEBREW_LETTERS.length, activation: 'softmax' })
    .apply(x) as tf.SymbolicTensor;

  const net = tf.model({ inputs: input, outputs: output });
  net.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  return net;
}

async function trainModel(net: tf.LayersModel): Promise<void> {
  const { xs, ys } = buildSyntheticDataset();
  const numSamples = ys.length;

  const xTensor = tf.tensor4d(xs, [numSamples, IMAGE_SIZE, IMAGE_SIZE, 1]);
  const yTensor = tf.oneHot(tf.tensor1d(ys, 'int32'), HEBREW_LETTERS.length);

  await net.fit(xTensor, yTensor, {
    epochs: 12,
    batchSize: 64,
    shuffle: true,
    verbose: 0,
  });

  xTensor.dispose();
  yTensor.dispose();
}

export async function initHebrewLetterRecognizer(): Promise<void> {
  if (model) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const net = createModel();
    await trainModel(net);
    model = net;
  })();

  return initPromise;
}

export function isRecognizerReady(): boolean {
  return model !== null;
}

export async function recognizeHebrewLetter(canvas: HTMLCanvasElement): Promise<RecognitionResult> {
  await initHebrewLetterRecognizer();
  if (!model) {
    throw new Error('Recognizer failed to initialize');
  }

  const pixels = canvasToGrayscaleArray(canvas, IMAGE_SIZE);
  const input = tf.tensor4d(pixels, [1, IMAGE_SIZE, IMAGE_SIZE, 1]);

  const prediction = model.predict(input) as tf.Tensor;
  const probs = await prediction.data();
  input.dispose();
  prediction.dispose();

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
  model?.dispose();
  model = null;
  initPromise = null;
}
