import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DrawingCanvas, type DrawingCanvasHandle } from './DrawingCanvas';
import { HebrewLetterStatsPanel } from './HebrewLetterStatsPanel';

import {
  HEBREW_LETTERS,
  LETTER_STYLE_FONTS,
  LETTER_STYLE_LABELS,
  oppositeStyle,
  pickRandomLetter,
  pickShownStyle,
  type HebrewLetter,
  type LetterStyle,
  type TrainerMode,
} from '@/lib/hebrew-letters/letters';
import { recognizeDrawing, preloadHebrewMatcher } from '@/lib/hebrew-letters/recognize';
import {
  loadHebrewLetterStats,
  recordAttempt,
  resetHebrewLetterStats,
  type HebrewLetterStats,
} from '@/lib/hebrew-letters/stats';
import { cn } from '@/lib/utils';

type RoundPhase = 'drawing' | 'result';

interface RoundState {
  letter: HebrewLetter;
  shownStyle: LetterStyle;
  targetStyle: LetterStyle;
  startedAt: number;
}

interface RoundResult {
  correct: boolean;
  confidence: number;
  predictedLetterId: string;
  feedback: string;
  elapsedMs: number;
}

function formatElapsed(ms: number): string {
  const seconds = ms / 1000;
  return seconds < 60 ? `${seconds.toFixed(1)}s` : `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
}

function confidenceLabel(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function HebrewLetterTrainer() {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const timerRef = useRef<number | null>(null);

  const [mode, setMode] = useState<TrainerMode>('mixed');
  const [stats, setStats] = useState<HebrewLetterStats>(() => loadHebrewLetterStats());
  const [round, setRound] = useState<RoundState | null>(null);
  const [phase, setPhase] = useState<RoundPhase>('drawing');
  const [result, setResult] = useState<RoundResult | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [sessionElapsedMs, setSessionElapsedMs] = useState(0);

  const startRound = useCallback((trainerMode: TrainerMode) => {
    const letter = pickRandomLetter();
    const shownStyle = pickShownStyle(trainerMode);
    const targetStyle = oppositeStyle(shownStyle);
    setRound({ letter, shownStyle, targetStyle, startedAt: Date.now() });
    setPhase('drawing');
    setResult(null);
    setElapsedMs(0);
    setModelError(null);
    canvasRef.current?.clear();
  }, []);

  useEffect(() => {
    preloadHebrewMatcher();
    startRound('mixed');
  }, [startRound]);

  useEffect(() => {
    if (phase !== 'drawing' || !round) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - round.startedAt);
    }, 100);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, round]);

  const handleSubmit = async () => {
    if (!round || phase !== 'drawing' || isSubmitting) return;

    const canvas = canvasRef.current?.getCanvas();
    const strokes = canvasRef.current?.getStrokes() ?? [];
    if (!canvas || strokes.length === 0) return;

    setIsSubmitting(true);
    setModelError(null);
    try {
      const recognition = await recognizeDrawing({
        canvas,
        strokes,
        expectedLetterId: round.letter.id,
        shownStyle: round.shownStyle,
        targetStyle: round.targetStyle,
      });
      const elapsed = Date.now() - round.startedAt;

      const attempt = {
        letterId: round.letter.id,
        shownStyle: round.shownStyle,
        targetStyle: round.targetStyle,
        correct: recognition.correct,
        elapsedMs: elapsed,
        confidence: recognition.confidence,
        predictedLetterId: recognition.predictedLetterId,
      };

      setStats((prev) => recordAttempt(prev, attempt));
      setSessionCorrect((c) => c + (recognition.correct ? 1 : 0));
      setSessionAttempts((a) => a + 1);
      setSessionElapsedMs((t) => t + elapsed);

      setResult({
        correct: recognition.correct,
        confidence: recognition.confidence,
        predictedLetterId: recognition.predictedLetterId,
        feedback: recognition.feedback,
        elapsedMs: elapsed,
      });
      setPhase('result');
    } catch {
      setModelError('Recognition failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeChange = (nextMode: TrainerMode) => {
    setMode(nextMode);
    startRound(nextMode);
  };

  const handleResetStats = () => {
    setStats(resetHebrewLetterStats());
    setSessionCorrect(0);
    setSessionAttempts(0);
    setSessionElapsedMs(0);
  };

  const predictedLetter = result
    ? HEBREW_LETTERS.find((l) => l.id === result.predictedLetterId)
    : null;

  return (
    <div className="mx-auto max-w-chat space-y-6 overscroll-contain">
      <div className="text-center">
        <p className="font-sketch text-xl text-gold">Learn Hebrew Letters</p>
        <h2 className="mt-1 font-heading text-2xl text-ink">See one style, draw the other</h2>
        <p className="mt-2 font-body text-sm text-ink/50">
          See a letter in one style, draw it in the other. Stroke shape matching checks your work — no AI, all on-device.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {(
          [
            ['mixed', 'Mixed'],
            ['show-block', 'Show block → draw script'],
            ['show-script', 'Show script → draw block'],
          ] as const
        ).map(([option, label]) => (
          <Button
            key={option}
            type="button"
            variant={mode === option ? 'default' : 'outline'}
            size="sm"
            disabled={isSubmitting}
            onClick={() => handleModeChange(option)}
          >
            {label}
          </Button>
        ))}
      </div>

      {modelError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 font-body text-sm text-destructive">
          {modelError}
        </div>
      ) : null}

      {round ? (
        <>
          <div className="sketch-card bg-white p-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-gold-muted px-3 py-1 font-body text-xs uppercase tracking-wide text-gold">
                Shown: {LETTER_STYLE_LABELS[round.shownStyle]}
              </span>
              <span className="rounded-full border border-parchment-dark px-3 py-1 font-body text-xs uppercase tracking-wide text-ink/55">
                Draw: {LETTER_STYLE_LABELS[round.targetStyle]}
              </span>
              <span className="font-body text-sm text-ink/45">
                {phase === 'drawing' ? formatElapsed(elapsedMs) : formatElapsed(result?.elapsedMs ?? 0)}
              </span>
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
              This is <span className="font-medium text-ink">{round.letter.name}</span> in{' '}
              {LETTER_STYLE_LABELS[round.shownStyle]}.
            </p>
            <p className="mt-1 font-body text-sm text-ink/70">
              Now draw <span className="font-medium text-ink">{round.letter.name}</span> in{' '}
              <span className="font-medium text-gold">{LETTER_STYLE_LABELS[round.targetStyle]}</span> below.
            </p>
          </div>

          <DrawingCanvas
            ref={canvasRef}
            className="h-56 w-full min-h-[14rem] sm:h-72"
            disabled={phase === 'result' || isSubmitting}
          />

          {phase === 'drawing' ? (
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" onClick={() => canvasRef.current?.clear()} disabled={isSubmitting}>
                Clear
              </Button>
              <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Checking…
                  </span>
                ) : (
                  'Submit drawing'
                )}
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                'sketch-card p-5 text-center',
                result?.correct ? 'border-gold/40 bg-gold-muted/40' : 'border-destructive/25 bg-destructive/5',
              )}
            >
              <p className="font-heading text-xl text-ink">
                {result?.correct ? 'Correct!' : 'Not quite — keep practicing'}
              </p>

              {!result?.correct ? (
                <div className="mt-3">
                  <p className="font-body text-xs uppercase tracking-wide text-ink/40">Answer in {LETTER_STYLE_LABELS[round.targetStyle]}</p>
                  <p
                    className="mt-1 text-5xl leading-none text-ink"
                    style={{ fontFamily: LETTER_STYLE_FONTS[round.targetStyle] }}
                    dir="rtl"
                    lang="he"
                  >
                    {round.letter.char}
                  </p>
                </div>
              ) : null}

              <p className="mt-3 font-body text-sm text-ink/60">
                {result?.feedback ||
                  `Best match: ${predictedLetter?.name ?? 'unknown'} (${confidenceLabel(result?.confidence ?? 0)} fit).`}
              </p>
              <Button type="button" className="mt-4" onClick={() => startRound(mode)}>
                Next letter
              </Button>
            </div>
          )}
        </>
      ) : null}

      <HebrewLetterStatsPanel
        stats={stats}
        sessionCorrect={sessionCorrect}
        sessionAttempts={sessionAttempts}
        sessionElapsedMs={sessionElapsedMs}
        onReset={handleResetStats}
      />
    </div>
  );
}
