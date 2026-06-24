import {
  GEMATRIA_ENTRIES,
  pickPrompt,
  pickRandomEntry,
  type GematriaEntry,
  type GematriaMode,
  type GematriaPrompt,
} from './values';

export interface GematriaQuizRound {
  entry: GematriaEntry;
  prompt: GematriaPrompt;
  choices: GematriaEntry[];
  startedAt: number;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildGematriaQuizRound(mode: GematriaMode): GematriaQuizRound {
  const entry = pickRandomEntry();
  const prompt = pickPrompt(mode);
  const distractors = shuffle(GEMATRIA_ENTRIES.filter((item) => item.id !== entry.id)).slice(0, 3);
  const choices = shuffle([entry, ...distractors]);

  return {
    entry,
    prompt,
    choices,
    startedAt: Date.now(),
  };
}
