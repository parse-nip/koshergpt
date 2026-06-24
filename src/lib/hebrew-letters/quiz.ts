import {
  HEBREW_LETTERS,
  oppositeStyle,
  pickRandomLetter,
  pickShownStyle,
  type HebrewLetter,
  type LetterStyle,
  type TrainerMode,
} from './letters';

export interface QuizRound {
  letter: HebrewLetter;
  shownStyle: LetterStyle;
  targetStyle: LetterStyle;
  choices: HebrewLetter[];
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

export function buildQuizRound(trainerMode: TrainerMode): QuizRound {
  const letter = pickRandomLetter();
  const shownStyle = pickShownStyle(trainerMode);
  const targetStyle = oppositeStyle(shownStyle);

  const distractors = shuffle(HEBREW_LETTERS.filter((entry) => entry.id !== letter.id)).slice(0, 3);
  const choices = shuffle([letter, ...distractors]);

  return {
    letter,
    shownStyle,
    targetStyle,
    choices,
    startedAt: Date.now(),
  };
}
