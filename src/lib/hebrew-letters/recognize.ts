import type { LetterStyle } from './letters';
import { predictLetterFromCanvas, loadManuscriptModel } from './manuscriptModel';
import { ensureStyleFonts, scoreTargetStyle } from './styleCheck';

export interface RecognitionResult {
  correct: boolean;
  confidence: number;
  predictedLetterId: string;
  feedback: string;
}

export async function recognizeDrawing(params: {
  canvas: HTMLCanvasElement;
  expectedLetterId: string;
  shownStyle: LetterStyle;
  targetStyle: LetterStyle;
}): Promise<RecognitionResult> {
  await ensureStyleFonts();
  await loadManuscriptModel();

  const prediction = await predictLetterFromCanvas(params.canvas, params.expectedLetterId);
  const style = scoreTargetStyle(
    params.canvas,
    params.expectedLetterId,
    params.targetStyle,
    params.shownStyle,
  );

  const letterMatches = prediction.predictedLetterId === params.expectedLetterId;
  const letterConfident = prediction.expectedConfidence >= 0.2;
  const correct = letterMatches && letterConfident && style.passes;

  const confidence = Math.min(
    0.98,
    prediction.expectedConfidence * 0.75 + (style.passes ? 0.15 : 0) + (letterMatches ? 0.1 : 0),
  );

  let feedback: string;
  if (correct) {
    feedback = 'Nice work — correct letter and style.';
  } else if (!letterMatches) {
    feedback = `The model read that as a different letter (${Math.round(prediction.confidence * 100)}% sure). Compare with the answer shown.`;
  } else if (!style.passes) {
    feedback = 'Right letter, but it still looks closer to the shown style. Try making your cursive/block forms more distinct.';
  } else {
    feedback = 'Almost — try writing the letter a bit larger and clearer.';
  }

  return {
    correct,
    confidence,
    predictedLetterId: prediction.predictedLetterId,
    feedback,
  };
}

export async function preloadHebrewMatcher(onProgress?: (percent: number) => void): Promise<void> {
  await ensureStyleFonts();
  await loadManuscriptModel(onProgress);
}
