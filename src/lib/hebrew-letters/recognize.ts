import type { LetterStyle } from './letters';
import { recognizeDrawingLocally } from './localRecognizer';
import { recognizeDrawingViaVision, type RecognitionResult } from './recognizeApi';

export type { RecognitionResult };

export async function recognizeHebrewDrawing(params: {
  canvas: HTMLCanvasElement;
  expectedLetterId: string;
  shownStyle: LetterStyle;
  targetStyle: LetterStyle;
}): Promise<RecognitionResult> {
  try {
    return await recognizeDrawingViaVision(params);
  } catch {
    return recognizeDrawingLocally(params.canvas, params.expectedLetterId, params.targetStyle);
  }
}
