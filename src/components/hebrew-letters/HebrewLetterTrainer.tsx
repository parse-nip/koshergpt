import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DrawingCanvas, type DrawingCanvasHandle } from './DrawingCanvas';
import { HebrewLetterStatsPanel } from './HebrewLetterStatsPanel';
import { RecognizerLoadingPanel } from './RecognizerLoadingPanel';

import {
  HEBREW_LETTERS,
  LETTER_STYLE_FONTS,
  pickRandomLetter,
  pickRandomStyle,
  type HebrewLetter,
  type LetterStyle,
} from '@/lib/hebrew-letters/letters';
import {
  initHebrewLetterRecognizer,
  recognizeHebrewLetter,
  type RecognizerLoadProgress,
} from '@/lib/hebrew-letters/recognizer';
import {
  loadHebrewLetterStats,
  recordAttempt,
  resetHebrewLetterStats,
  type HebrewLetterStats,
} from '@/lib/hebrew-letters/stats';
import { cn } from '@/lib/utils';

type TrainerMode = 'mixed' | LetterStyle;
type RoundPhase = 'drawing' | 'result';

interface RoundState {
  letter: HebrewLetter;
  style: LetterStyle;
  startedAt: number;
}

interface RoundResult {
  correct: boolean;
  confidence: number;
  predictedLetterId: string;
  elapsedMs: number;
}

const INITIAL_LOAD_PROGRESS: RecognizerLoadProgress = {
  stage: 'fonts',
  percent: 0,
  message: 'Starting up…',
};

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
  const loadStartedAtRef = useRef(Date.now());

  const [mode, setMode] = useState<TrainerMode>('mixed');
  const [stats, setStats] = useState<HebrewLetterStats>(() => loadHebrewLetterStats());
  const [round, setRound] = useState<RoundState | null>(null);
  const [phase, setPhase] = useState<RoundPhase>('drawing');
  const [result, setResult] = useState<RoundResult | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState<RecognizerLoadProgress>(INITIAL_LOAD_PROGRESS);
  const [loadElapsedMs, setLoadElapsedMs] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [sessionElapsedMs, setSessionElapsedMs] = useState(0);

  const startRound = useCallback((trainerMode: TrainerMode) => {
    const letter = pickRandomLetter();
    const style = pickRandomStyle(trainerMode);
    setRound({ letter, style, startedAt: Date.now() });
    setPhase('drawing');
    setResult(null);
    setElapsedMs(0);
    canvasRef.current?.clear();
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadStartedAtRef.current = Date.now();

    initHebrewLetterRecognizer((progress) => {
      if (!cancelled) {
        setLoadProgress(progress);
      }
    })
      .then(() => {
        if (!cancelled) {
          setIsModelLoading(false);
          startRound('mixed');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setModelError('Could not load the handwriting recognition model. Please refresh and try again.');
          setIsModelLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [startRound]);

  useEffect(() => {
    if (!isModelLoading) return;

    const tick = window.setInterval(() => {
      setLoadElapsedMs(Date.now() - loadStartedAtRef.current);
    }, 120);

    return () => window.clearInterval(tick);
  }, [isModelLoading]);

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
    if (!canvas || !canvasRef.current?.hasInk()) return;

    setIsSubmitting(true);
    try {
      const recognition = await recognizeHebrewLetter(canvas, round.style);
      const elapsed = Date.now() - round.startedAt;
      const correct = recognition.letterId === round.letter.id;

      const attempt = {
        letterId: round.letter.id,
        style: round.style,
        correct,
        elapsedMs: elapsed,
        confidence: recognition.confidence,
        predictedLetterId: recognition.letterId,
      };

      setStats((prev) => recordAttempt(prev, attempt));
      setSessionCorrect((c) => c + (correct ? 1 : 0));
      setSessionAttempts((a) => a + 1);
      setSessionElapsedMs((t) => t + elapsed);

      setResult({
        correct,
        confidence: recognition.confidence,
        predictedLetterId: recognition.letterId,
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
        <h2 className="mt-1 font-heading text-2xl text-ink">Draw the letter you see</h2>
        <p className="mt-2 font-body text-sm text-ink/50">
          Practice block print and script (cursive). Shape matching compares your drawing to reference letter templates.
        </p>
      </div>

      {!isModelLoading ? (
        <div className="flex flex-wrap justify-center gap-2">
          {(['mixed', 'block', 'script'] as const).map((option) => (
            <Button
              key={option}
              type="button"
              variant={mode === option ? 'default' : 'outline'}
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleModeChange(option)}
            >
              {option === 'mixed' ? 'Mixed' : option === 'block' ? 'Block only' : 'Script only'}
            </Button>
          ))}
        </div>
      ) : null}

      {isModelLoading ? (
        <RecognizerLoadingPanel progress={loadProgress} elapsedMs={loadElapsedMs} />
      ) : null}

      {modelError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 font-body text-sm text-destructive">
          {modelError}
        </div>
      ) : null}

      {round && !isModelLoading ? (
        <>
          <div className="sketch-card bg-white p-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="rounded-full bg-gold-muted px-3 py-1 font-body text-xs uppercase tracking-wide text-gold">
                {round.style === 'block' ? 'Block' : 'Script'}
              </span>
              <span className="font-body text-sm text-ink/45">
                {phase === 'drawing' ? formatElapsed(elapsedMs) : formatElapsed(result?.elapsedMs ?? 0)}
              </span>
            </div>

            <p
              className="mt-4 text-7xl leading-none text-ink sm:text-8xl"
              style={{ fontFamily: LETTER_STYLE_FONTS[round.style] }}
              dir="rtl"
              lang="he"
            >
              {round.letter.char}
            </p>

            <p className="mt-3 font-body text-sm text-ink/55">
              Draw <span className="font-medium text-ink">{round.letter.name}</span> ({round.letter.transliteration})
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
              <p className="mt-2 font-body text-sm text-ink/60">
                Matcher guessed{' '}
                <span className="font-medium text-ink">{predictedLetter?.name ?? 'unknown'}</span> with{' '}
                {confidenceLabel(result?.confidence ?? 0)} confidence in {formatElapsed(result?.elapsedMs ?? 0)}.
              </p>
              <Button type="button" className="mt-4" onClick={() => startRound(mode)}>
                Next letter
              </Button>
            </div>
          )}
        </>
      ) : null}

      {!isModelLoading ? (
        <HebrewLetterStatsPanel
          stats={stats}
          sessionCorrect={sessionCorrect}
          sessionAttempts={sessionAttempts}
          sessionElapsedMs={sessionElapsedMs}
          onReset={handleResetStats}
        />
      ) : null}
    </div>
  );
}
