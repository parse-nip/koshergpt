import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DrawingCanvas, type DrawingCanvasHandle } from './DrawingCanvas';

import {
  LETTER_STYLE_FONTS,
  LETTER_STYLE_LABELS,
  oppositeStyle,
  pickRandomLetter,
  pickShownStyle,
  type HebrewLetter,
  type LetterStyle,
  type TrainerMode,
} from '@/lib/hebrew-letters/letters';
import { recordAttempt, type HebrewLetterStats } from '@/lib/hebrew-letters/stats';

interface DrawRound {
  letter: HebrewLetter;
  shownStyle: LetterStyle;
  targetStyle: LetterStyle;
  startedAt: number;
}

interface DrawPracticeProps {
  mode: TrainerMode;
  stats: HebrewLetterStats;
  onStatsUpdate: (stats: HebrewLetterStats) => void;
  onSessionUpdate: (correct: boolean, elapsedMs: number) => void;
}

function formatElapsed(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function HebrewLetterDrawPractice({
  mode,
  stats,
  onStatsUpdate,
  onSessionUpdate,
}: DrawPracticeProps) {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const timerRef = useRef<number | null>(null);

  const [round, setRound] = useState<DrawRound | null>(null);
  const [phase, setPhase] = useState<'drawing' | 'review'>('drawing');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [drawingPreview, setDrawingPreview] = useState<string | null>(null);

  const startRound = useCallback((trainerMode: TrainerMode) => {
    const letter = pickRandomLetter();
    const shownStyle = pickShownStyle(trainerMode);
    setRound({
      letter,
      shownStyle,
      targetStyle: oppositeStyle(shownStyle),
      startedAt: Date.now(),
    });
    setPhase('drawing');
    setElapsedMs(0);
    setDrawingPreview(null);
    canvasRef.current?.clear();
  }, []);

  useEffect(() => {
    startRound(mode);
  }, [mode, startRound]);

  useEffect(() => {
    if (phase !== 'drawing' || !round) return;
    timerRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - round.startedAt);
    }, 100);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [phase, round]);

  const handleReveal = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!round || !canvas || !canvasRef.current?.hasInk()) return;
    setDrawingPreview(canvas.toDataURL('image/png'));
    setPhase('review');
  };

  const handleSelfGrade = (correct: boolean) => {
    if (!round) return;
    const elapsed = Date.now() - round.startedAt;
    const attempt = {
      activity: 'draw' as const,
      letterId: round.letter.id,
      shownStyle: round.shownStyle,
      targetStyle: round.targetStyle,
      correct,
      elapsedMs: elapsed,
    };
    onStatsUpdate(recordAttempt(stats, attempt));
    onSessionUpdate(correct, elapsed);
    startRound(mode);
  };

  if (!round) return null;

  return (
    <div className="space-y-4">
      <div className="sketch-card bg-white p-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-gold-muted px-3 py-1 font-body text-xs uppercase tracking-wide text-gold">
            Shown: {LETTER_STYLE_LABELS[round.shownStyle]}
          </span>
          <span className="rounded-full border border-parchment-dark px-3 py-1 font-body text-xs uppercase tracking-wide text-ink/55">
            Draw: {LETTER_STYLE_LABELS[round.targetStyle]}
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
        <p className="mt-3 font-body text-sm text-ink/55">
          Draw this letter in{' '}
          <span className="font-medium text-gold">{LETTER_STYLE_LABELS[round.targetStyle]}</span>
        </p>
      </div>

      <DrawingCanvas
        ref={canvasRef}
        className="h-64 w-full min-h-[16rem] touch-none sm:h-72"
        disabled={phase === 'review'}
      />

      {phase === 'drawing' ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="w-full touch-manipulation sm:w-auto"
            onClick={() => canvasRef.current?.clear()}
          >
            Clear
          </Button>
          <Button type="button" className="w-full touch-manipulation sm:w-auto" onClick={handleReveal}>
            Compare with answer
          </Button>
        </div>
      ) : (
        <div className="sketch-card space-y-4 bg-white p-5">
          <p className="text-center font-heading text-lg text-ink">Compare your drawing</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-parchment-dark p-3 text-center">
              <p className="font-body text-[11px] uppercase tracking-wide text-ink/40">Your drawing</p>
              {drawingPreview ? (
                <img src={drawingPreview} alt="Your drawing" className="mx-auto mt-2 h-28 w-28 object-contain" />
              ) : null}
            </div>
            <div className="rounded-md border border-gold/30 bg-gold-muted/30 p-3 text-center">
              <p className="font-body text-[11px] uppercase tracking-wide text-ink/40">
                {LETTER_STYLE_LABELS[round.targetStyle]}
              </p>
              <p
                className="mt-2 text-6xl leading-none text-ink"
                style={{ fontFamily: LETTER_STYLE_FONTS[round.targetStyle] }}
                dir="rtl"
                lang="he"
              >
                {round.letter.char}
              </p>
            </div>
          </div>
          <p className="text-center font-body text-sm text-ink/55">Be honest — did you get it right?</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button
              type="button"
              variant="outline"
              className="w-full touch-manipulation sm:w-auto"
              onClick={() => handleSelfGrade(false)}
            >
              Still learning
            </Button>
            <Button
              type="button"
              className="w-full touch-manipulation sm:w-auto"
              onClick={() => handleSelfGrade(true)}
            >
              I got it right
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
