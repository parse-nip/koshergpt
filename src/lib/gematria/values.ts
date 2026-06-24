import { HEBREW_LETTERS } from '@/lib/hebrew-letters/letters';

export type GematriaMode = 'mixed' | 'letter-to-value' | 'value-to-letter';

export type GematriaPrompt = 'letter' | 'value';

export interface GematriaEntry {
  id: string;
  char: string;
  value: number;
}

export const GEMATRIA_ENTRIES: GematriaEntry[] = HEBREW_LETTERS.map((letter, index) => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400];
  return {
    id: letter.id,
    char: letter.char,
    value: values[index],
  };
});

export const BLOCK_FONT = '"Frank Ruhl Libre", serif';

export function pickRandomEntry(): GematriaEntry {
  return GEMATRIA_ENTRIES[Math.floor(Math.random() * GEMATRIA_ENTRIES.length)];
}

export function pickPrompt(mode: GematriaMode): GematriaPrompt {
  if (mode === 'letter-to-value') return 'letter';
  if (mode === 'value-to-letter') return 'value';
  return Math.random() < 0.5 ? 'letter' : 'value';
}

export function getEntryById(id: string): GematriaEntry | undefined {
  return GEMATRIA_ENTRIES.find((entry) => entry.id === id);
}

export function formatGematriaValue(value: number): string {
  return value.toLocaleString('en-US');
}
