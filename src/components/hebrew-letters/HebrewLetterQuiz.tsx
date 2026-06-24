import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import {
  LETTER_STYLE_FONTS,
  LETTER_STYLE_LABELS,
  type TrainerMode,
} from '@/lib/hebrew-letters/letters';
import { buildQuizRound, type QuizRound } from '@/lib/hebrew-letters/quiz';
import { recordAttempt, type HebrewLetterStats } from '@/lib/hebrew-letters/stats';
import { cn } from '@/lib/utils';

interface HebrewLetterQuizProps {
  mode: TrainerMode;
  stats: HebrewLetterStats;
  onStatsUpdate: (stats: HebrewLetterStats) => void;
  onSessionUpdate: (correct: boolean, elapsedMs: number) => void;
}

function formatElapsed(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function HebrewLetterQuiz({ mode, stats, onStatsUpdate, onSessionUpdate }: HebrewLetterQuizProps) {
  const [round, setRound] = useState<QuizRound | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<number | null>(null);

  const startRound = useCallback((trainerMode: TrainerMode) => {
    setRound(buildQuizRound(trainerMode));
    setPickedId(null);
    setElapsedMs(0);
  }, []);

  useEffect(() => {
    startRound(mode);
  }, [mode, startRound]);

  useEffect(() => {
    if (!round || pickedId) return;
    timerRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - round.startedAt);
    }, 100);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [round, pickedId]);

  const handlePick = (letterId: string) => {
    if (!round || pickedId) return;
    const elapsed = Date.now() - round.startedAt;
    const correct = letterId === round.letter.id;
    setPickedId(letterId);

    const attempt = {
      activity: 'quiz' as const,
      letterId: round.letter.id,
      shownStyle: round.shownStyle,
      targetStyle: round.targetStyle,
      correct,
      elapsedMs: elapsed,
    };
    onStatsUpdate(recordAttempt(stats, attempt));
    onSessionUpdate(correct, elapsed);
  };

  if (!round) return null;

  const answered = pickedId !== null;
  const wasCorrect = pickedId === round.letter.id;

  return (
    <div className="space-y-4">
      <div className="sketch-card bg-white p-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-gold-muted px-3 py-1 font-body text-xs uppercase tracking-wide text-gold">
            Shown: {LETTER_STYLE_LABELS[round.shownStyle]}
          </span>
          <span className="rounded-full border border-parchment-dark px-3 py-1 font-body text-xs uppercase tracking-wide text-ink/55">
            Pick: {LETTER_STYLE_LABELS[round.targetStyle]}
          </span>
          <span className="font-body text-sm text-ink/45">{formatElapsed(elapsedMs)}</span>
        </div>

        <p
          className="mt-4 text-7xl leading-none text-ink sm:text-8xl"
          style={{ fontFamily: LETTER_STYLE_FONTS[round.shownStyle] }}
          dir="rtl"
          lang="he"
        >
          {round.letter.char}
        </p>
        <p className="mt-3 font-body text-sm text-ink/70">
          Which is the same letter in{' '}
          <span className="font-medium text-gold">{LETTER_STYLE_LABELS[round.targetStyle]}</span>?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {round.choices.map((choice) => {
          const isCorrect = choice.id === round.letter.id;
          const isPicked = pickedId === choice.id;
          return (
            <Button
              key={`${round.letter.id}-${choice.id}`}
              type="button"
              variant="outline"
              disabled={answered}
              className={cn(
                'h-auto min-h-[5.5rem] touch-manipulation border-parchment-dark py-5 sm:min-h-24',
                answered && isCorrect && 'border-gold/50 bg-gold-muted/50',
                answered && isPicked && !isCorrect && 'border-destructive/40 bg-destructive/10',
              )}
              onClick={() => handlePick(choice.id)}
            >
              <span
                className="text-5xl leading-none sm:text-4xl"
                style={{ fontFamily: LETTER_STYLE_FONTS[round.targetStyle] }}
                dir="rtl"
                lang="he"
              >
                {choice.char}
              </span>
            </Button>
          );
        })}
      </div>

      {answered ? (
        <div
          className={cn(
            'sketch-card p-4 text-center',
            wasCorrect ? 'border-gold/40 bg-gold-muted/40' : 'border-destructive/25 bg-destructive/5',
          )}
        >
          <p className="font-heading text-lg text-ink">{wasCorrect ? 'Correct!' : 'Not quite'}</p>
          {!wasCorrect ? (
            <p className="mt-1 font-body text-sm text-ink/60">
              The answer was{' '}
              <span
                className="text-2xl font-medium leading-none"
                style={{ fontFamily: LETTER_STYLE_FONTS[round.targetStyle] }}
                dir="rtl"
              >
                {round.letter.char}
              </span>
              .
            </p>
          ) : null}
          <Button type="button" className="mt-3" onClick={() => startRound(mode)}>
            Next letter
          </Button>
        </div>
      ) : null}
    </div>
  );
}
