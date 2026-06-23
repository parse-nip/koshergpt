import {
  getLetterById,
  letterIdFromName,
  type LetterStyle,
} from './letters';
import { canvasToPngDataUrl } from './imagePreprocess';

export interface RecognitionResult {
  correct: boolean;
  confidence: number;
  predictedLetterId: string;
  detectedStyle: LetterStyle | 'unclear';
  feedback: string;
  source: 'vision' | 'local';
}

const API_URL = import.meta.env.VITE_CHAT_API_URL?.trim()
  ? import.meta.env.VITE_CHAT_API_URL.trim().replace(/\/chat$/, '/recognize-hebrew-letter')
  : '/api/recognize-hebrew-letter';
const API_BEARER = import.meta.env.VITE_CHAT_API_KEY?.trim() ?? '';

export async function recognizeDrawingViaVision(params: {
  canvas: HTMLCanvasElement;
  expectedLetterId: string;
  shownStyle: LetterStyle;
  targetStyle: LetterStyle;
}): Promise<RecognitionResult> {
  const expected = getLetterById(params.expectedLetterId);
  if (!expected) {
    throw new Error('Unknown expected letter');
  }

  const imageDataUrl = canvasToPngDataUrl(params.canvas, 256);
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_BEARER ? { Authorization: `Bearer ${API_BEARER}` } : {}),
    },
    body: JSON.stringify({
      imageDataUrl,
      expectedLetterName: expected.name,
      expectedLetterChar: expected.char,
      shownStyle: params.shownStyle,
      targetStyle: params.targetStyle,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `Recognition API failed (${response.status})`);
  }

  const payload = await response.json();
  const predictedLetterId = letterIdFromName(String(payload.detectedLetter ?? '')) ?? 'unknown';
  const detectedStyle =
    payload.detectedStyle === 'block' || payload.detectedStyle === 'script'
      ? payload.detectedStyle
      : 'unclear';

  return {
    correct: Boolean(payload.matchesExpected),
    confidence: Number(payload.confidence ?? 0),
    predictedLetterId,
    detectedStyle,
    feedback: String(payload.feedback ?? ''),
    source: 'vision',
  };
}
