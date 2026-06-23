export type LetterStyle = 'block' | 'script';

export type TrainerMode = 'mixed' | 'show-block' | 'show-script';

export interface HebrewLetter {
  id: string;
  char: string;
  name: string;
  transliteration: string;
}

export const HEBREW_LETTERS: HebrewLetter[] = [
  { id: 'alef', char: 'א', name: 'Alef', transliteration: 'a' },
  { id: 'bet', char: 'ב', name: 'Bet', transliteration: 'b' },
  { id: 'gimel', char: 'ג', name: 'Gimel', transliteration: 'g' },
  { id: 'dalet', char: 'ד', name: 'Dalet', transliteration: 'd' },
  { id: 'he', char: 'ה', name: 'He', transliteration: 'h' },
  { id: 'vav', char: 'ו', name: 'Vav', transliteration: 'v' },
  { id: 'zayin', char: 'ז', name: 'Zayin', transliteration: 'z' },
  { id: 'chet', char: 'ח', name: 'Chet', transliteration: 'ch' },
  { id: 'tet', char: 'ט', name: 'Tet', transliteration: 't' },
  { id: 'yod', char: 'י', name: 'Yod', transliteration: 'y' },
  { id: 'kaf', char: 'כ', name: 'Kaf', transliteration: 'k' },
  { id: 'lamed', char: 'ל', name: 'Lamed', transliteration: 'l' },
  { id: 'mem', char: 'מ', name: 'Mem', transliteration: 'm' },
  { id: 'nun', char: 'נ', name: 'Nun', transliteration: 'n' },
  { id: 'samekh', char: 'ס', name: 'Samekh', transliteration: 's' },
  { id: 'ayin', char: 'ע', name: 'Ayin', transliteration: 'ʿ' },
  { id: 'pe', char: 'פ', name: 'Pe', transliteration: 'p' },
  { id: 'tsadi', char: 'צ', name: 'Tsadi', transliteration: 'ts' },
  { id: 'qof', char: 'ק', name: 'Qof', transliteration: 'q' },
  { id: 'resh', char: 'ר', name: 'Resh', transliteration: 'r' },
  { id: 'shin', char: 'ש', name: 'Shin', transliteration: 'sh' },
  { id: 'tav', char: 'ת', name: 'Tav', transliteration: 't' },
];

export const LETTER_STYLE_FONTS: Record<LetterStyle, string> = {
  block: '"Frank Ruhl Libre", serif',
  script: '"Gveret Levin", cursive',
};

export const LETTER_STYLE_LABELS: Record<LetterStyle, string> = {
  block: 'block print',
  script: 'script (cursive)',
};

export const IMAGE_SIZE = 64;

const LETTER_NAME_TO_ID = new Map(
  HEBREW_LETTERS.flatMap((letter) => [
    [letter.name.toLowerCase(), letter.id],
    [letter.id, letter.id],
    [letter.char, letter.id],
  ]),
);

export function pickRandomLetter(): HebrewLetter {
  return HEBREW_LETTERS[Math.floor(Math.random() * HEBREW_LETTERS.length)];
}

export function pickShownStyle(mode: TrainerMode): LetterStyle {
  if (mode === 'show-block') return 'block';
  if (mode === 'show-script') return 'script';
  return Math.random() < 0.5 ? 'block' : 'script';
}

export function oppositeStyle(style: LetterStyle): LetterStyle {
  return style === 'block' ? 'script' : 'block';
}

export function letterIdFromName(value: string): string | null {
  const key = value.trim().toLowerCase();
  return LETTER_NAME_TO_ID.get(key) ?? null;
}

export function getLetterById(id: string): HebrewLetter | undefined {
  return HEBREW_LETTERS.find((letter) => letter.id === id);
}
