import type { Point } from './geometry';
import { recognizeHebrewDrawing, type RecognitionResult } from './shapeMatcher';
import type { LetterStyle } from './letters';

export type { RecognitionResult };

export async function recognizeDrawing(params: {
  canvas: HTMLCanvasElement;
  strokes: Point[][];
  expectedLetterId: string;
  shownStyle: LetterStyle;
  targetStyle: LetterStyle;
}): Promise<RecognitionResult> {
  return recognizeHebrewDrawing({
    canvas: params.canvas,
    strokes: params.strokes,
    expectedLetterId: params.expectedLetterId,
    targetStyle: params.targetStyle,
  });
}

export { preloadHebrewMatcher } from './shapeMatcher';
