import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import { buildGematriaQuizRound, type GematriaQuizRound } from '@/lib/gematria/quiz';
import {
  accuracyPercent,
  averageTimeMs,
  loadGematriaStats,
  recordGematriaAttempt,
  resetGematriaStats,
  type GematriaStats,
} from '@/lib/gematria/stats';
import {
  BLOCK_FONT,
  formatGematriaValue,
  getEntryById,
  type GematriaMode,
} from '@/lib/gematria/values';
import { cn } from '@/lib/utils';

interface GematriaQuizProps {
  mode: GematriaMode;
  stats: GematriaStats;
  onStatsUpdate: (stats: GematriaStats) => void;
  onSessionUpdate: (correct: boolean, elapsedMs: number) => void;
}

function formatElapsed(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="sketch-card bg-white p-3">
      <p className="font-body text-[11px] uppercase tracking-wide text-ink/40">{label}</p>
      <p className="mt-1 font-heading text-xl text-ink">{value}</p>
      {hint ? <p className="mt-0.5 font-body text-[11px] text-ink/35">{hint}</p> : null}
    </div>
  );
}

interface GematriaStatsPanelProps {
  stats: GematriaStats;
  sessionCorrect: number;
  sessionAttempts: number;
  sessionElapsedMs: number;
  onReset: () => void;
}

function GematriaStatsPanel({
  stats,
  sessionCorrect,
  sessionAttempts,
  sessionElapsedMs,
  onReset,
}: GematriaStatsPanelProps) {
  const overallAccuracy = accuracyPercent(stats.correctCount, stats.totalAttempts);
  const sessionAccuracy = accuracyPercent(sessionCorrect, sessionAttempts);
  const letterAccuracy = accuracyPercent(stats.letterPromptCorrect, stats.letterPromptAttempts);
  const valueAccuracy = accuracyPercent(stats.valuePromptCorrect, stats.valuePromptAttempts);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-sketch text-xl text-gold">Your stats</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Reset all
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Accuracy" value={`${overallAccuracy}%`} hint={`${stats.correctCount}/${stats.totalAttempts} correct`} />
        <StatCard label="Streak" value={`${stats.currentStreak}`} hint={`Best: ${stats.bestStreak}`} />
        <StatCard label="Avg time" value={`${(averageTimeMs(stats) / 1000).toFixed(1)}s`} hint="Per round" />
        <StatCard
          label="This session"
          value={`${sessionAccuracy}%`}
          hint={`${sessionCorrect}/${sessionAttempts} · ${(sessionElapsedMs / 1000).toFixed(0)}s total`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Letter → value"
          value={`${letterAccuracy}%`}
          hint={`${stats.letterPromptCorrect}/${stats.letterPromptAttempts}`}
        />
        <StatCard
          label="Value → letter"
          value={`${valueAccuracy}%`}
          hint={`${stats.valuePromptCorrect}/${stats.valuePromptAttempts}`}
        />
      </div>

      {stats.recentAttempts.length > 0 ? (
        <div className="sketch-card bg-white p-3">
          <p className="mb-2 font-body text-[11px] uppercase tracking-wide text-ink/40">Recent rounds</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {stats.recentAttempts.slice(0, 10).map((attempt) => {
              const entry = getEntryById(attempt.letterId);
              return (
                <li
                  key={`${attempt.timestamp}-${attempt.letterId}`}
                  className="flex items-center justify-between gap-2 font-body text-xs text-ink/65"
                >
                  <span>
                    {attempt.prompt === 'letter' ? 'Letter → value' : 'Value → letter'} · {entry?.char} ={' '}
                    {entry ? formatGematriaValue(entry.value) : '?'}
                  </span>
                  <span className={attempt.correct ? 'text-gold' : 'text-destructive'}>
                    {attempt.correct ? '✓' : '✗'} · {(attempt.elapsedMs / 1000).toFixed(1)}s
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function GematriaTrainer() {
  const [mode, setMode] = useState<GematriaMode>('mixed');
  const [stats, setStats] = useState<GematriaStats>(() => loadGematriaStats());
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [sessionElapsedMs, setSessionElapsedMs] = useState(0);

  const handleSessionUpdate = (correct: boolean, elapsedMs: number) => {
    setSessionCorrect((value) => value + (correct ? 1 : 0));
    setSessionAttempts((value) => value + 1);
    setSessionElapsedMs((value) => value + elapsedMs);
  };

  const handleResetStats = () => {
    setStats(resetGematriaStats());
    setSessionCorrect(0);
    setSessionAttempts(0);
    setSessionElapsedMs(0);
  };

  return (
    <div className="mx-auto max-w-chat space-y-6 overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="text-center">
        <p className="font-sketch text-xl text-gold">Gematria</p>
        <h2 className="mt-1 font-heading text-2xl text-ink">Letter ↔ number</h2>
        <p className="mt-2 font-body text-sm text-ink/50">
          Learn the classic values used in Torah study — א = 1 through ת = 400.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {(
          [
            ['mixed', 'Mixed'],
            ['letter-to-value', 'Letter → value'],
            ['value-to-letter', 'Value → letter'],
          ] as const
        ).map(([option, label]) => (
          <Button
            key={option}
            type="button"
            variant={mode === option ? 'secondary' : 'ghost'}
            size="sm"
            className="min-h-10 touch-manipulation px-3"
            onClick={() => setMode(option)}
          >
            {label}
          </Button>
        ))}
      </div>

      <GematriaQuiz
        key={mode}
        mode={mode}
        stats={stats}
        onStatsUpdate={setStats}
        onSessionUpdate={handleSessionUpdate}
      />

      <GematriaStatsPanel
        stats={stats}
        sessionCorrect={sessionCorrect}
        sessionAttempts={sessionAttempts}
        sessionElapsedMs={sessionElapsedMs}
        onReset={handleResetStats}
      />
    </div>
  );
}

export function GematriaQuiz({ mode, stats, onStatsUpdate, onSessionUpdate }: GematriaQuizProps) {
  const [round, setRound] = useState<GematriaQuizRound | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<number | null>(null);

  const startRound = useCallback((trainerMode: GematriaMode) => {
    setRound(buildGematriaQuizRound(trainerMode));
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
    const correct = letterId === round.entry.id;
    setPickedId(letterId);

    onStatsUpdate(
      recordGematriaAttempt(stats, {
        letterId: round.entry.id,
        prompt: round.prompt,
        correct,
        elapsedMs: elapsed,
      }),
    );
    onSessionUpdate(correct, elapsed);
  };

  if (!round) return null;

  const answered = pickedId !== null;
  const wasCorrect = pickedId === round.entry.id;
  const showLetter = round.prompt === 'letter';

  return (
    <div className="space-y-4">
      <div className="sketch-card bg-white p-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-gold-muted px-3 py-1 font-body text-xs uppercase tracking-wide text-gold">
            {showLetter ? 'Shown: letter' : 'Shown: value'}
          </span>
          <span className="rounded-full border border-parchment-dark px-3 py-1 font-body text-xs uppercase tracking-wide text-ink/55">
            {showLetter ? 'Pick: value' : 'Pick: letter'}
          </span>
          <span className="font-body text-sm text-ink/45">{formatElapsed(elapsedMs)}</span>
        </div>

        {showLetter ? (
          <p
            className="mt-4 text-7xl leading-none text-ink sm:text-8xl"
            style={{ fontFamily: BLOCK_FONT }}
            dir="rtl"
            lang="he"
          >
            {round.entry.char}
          </p>
        ) : (
          <p className="mt-4 font-heading text-6xl leading-none text-ink sm:text-7xl">
            {formatGematriaValue(round.entry.value)}
          </p>
        )}

        <p className="mt-3 font-body text-sm text-ink/70">
          {showLetter ? 'What is this letter worth?' : 'Which letter has this value?'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {round.choices.map((choice) => {
          const isCorrect = choice.id === round.entry.id;
          const isPicked = pickedId === choice.id;

          return (
            <Button
              key={`${round.entry.id}-${choice.id}-${round.prompt}`}
              type="button"
              variant="outline"
              disabled={answered}
              className={cn(
                'h-auto min-h-[5.5rem] touch-manipulation border-parchment-dark py-5',
                answered && isCorrect && 'border-gold/50 bg-gold-muted/50',
                answered && isPicked && !isCorrect && 'border-destructive/40 bg-destructive/10',
              )}
              onClick={() => handlePick(choice.id)}
            >
              {showLetter ? (
                <span className="font-heading text-3xl leading-none text-ink sm:text-4xl">
                  {formatGematriaValue(choice.value)}
                </span>
              ) : (
                <span
                  className="text-5xl leading-none sm:text-4xl"
                  style={{ fontFamily: BLOCK_FONT }}
                  dir="rtl"
                  lang="he"
                >
                  {choice.char}
                </span>
              )}
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
              <span
                className="text-2xl font-medium leading-none"
                style={{ fontFamily: BLOCK_FONT }}
                dir="rtl"
              >
                {round.entry.char}
              </span>{' '}
              = {formatGematriaValue(round.entry.value)}
            </p>
          ) : null}
          <Button type="button" className="mt-3 touch-manipulation" onClick={() => startRound(mode)}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
