/** Class order for bsesic/HebrewManuscriptsMNIST (28 classes). Index 0 = stop symbol. */
export const MODEL_CLASS_CHARS = [
  'stop', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'ך', 'כ', 'ל', 'ם', 'מ', 'ן', 'נ', 'ס', 'ע', 'ף', 'פ', 'ץ', 'צ', 'ק', 'ר', 'ש', 'ת',
] as const;

const CHAR_TO_LETTER_ID: Record<string, string> = {
  א: 'alef',
  ב: 'bet',
  ג: 'gimel',
  ד: 'dalet',
  ה: 'he',
  ו: 'vav',
  ז: 'zayin',
  ח: 'chet',
  ט: 'tet',
  י: 'yod',
  כ: 'kaf',
  ך: 'kaf',
  ל: 'lamed',
  מ: 'mem',
  ם: 'mem',
  נ: 'nun',
  ן: 'nun',
  ס: 'samekh',
  ע: 'ayin',
  פ: 'pe',
  ף: 'pe',
  צ: 'tsadi',
  ץ: 'tsadi',
  ק: 'qof',
  ר: 'resh',
  ש: 'shin',
  ת: 'tav',
};

export const MODEL_INPUT_SIZE = 64;
export const MODEL_URL = '/hebrew-letter-model/model.json';

export function letterIdFromModelChar(char: string): string | null {
  if (char === 'stop') return null;
  return CHAR_TO_LETTER_ID[char] ?? null;
}

export function probabilityForLetterId(probs: Float32Array, letterId: string): number {
  let total = 0;
  for (let i = 0; i < MODEL_CLASS_CHARS.length; i++) {
    if (letterIdFromModelChar(MODEL_CLASS_CHARS[i]) === letterId) {
      total += probs[i];
    }
  }
  return total;
}

export function bestLetterFromProbabilities(probs: Float32Array): { letterId: string; confidence: number } {
  const byLetter = new Map<string, number>();

  for (let i = 0; i < MODEL_CLASS_CHARS.length; i++) {
    const letterId = letterIdFromModelChar(MODEL_CLASS_CHARS[i]);
    if (!letterId) continue;
    byLetter.set(letterId, (byLetter.get(letterId) ?? 0) + probs[i]);
  }

  let bestLetterId = 'alef';
  let bestConfidence = 0;
  for (const [letterId, confidence] of byLetter) {
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestLetterId = letterId;
    }
  }

  return { letterId: bestLetterId, confidence: bestConfidence };
}
