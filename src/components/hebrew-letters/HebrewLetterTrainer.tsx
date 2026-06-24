import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { HebrewLetterDrawPractice } from './HebrewLetterDrawPractice';
import { HebrewLetterQuiz } from './HebrewLetterQuiz';
import { HebrewLetterStatsPanel } from './HebrewLetterStatsPanel';

import { type TrainerMode } from '@/lib/hebrew-letters/letters';
import {
  loadHebrewLetterStats,
  resetHebrewLetterStats,
  type HebrewLetterStats,
} from '@/lib/hebrew-letters/stats';

type ActivityTab = 'quiz' | 'draw';

export function HebrewLetterTrainer() {
  const [activity, setActivity] = useState<ActivityTab>('quiz');
  const [mode, setMode] = useState<TrainerMode>('mixed');
  const [stats, setStats] = useState<HebrewLetterStats>(() => loadHebrewLetterStats());

  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [sessionElapsedMs, setSessionElapsedMs] = useState(0);

  const handleSessionUpdate = (correct: boolean, elapsedMs: number) => {
    setSessionCorrect((value) => value + (correct ? 1 : 0));
    setSessionAttempts((value) => value + 1);
    setSessionElapsedMs((value) => value + elapsedMs);
  };

  const handleResetStats = () => {
    setStats(resetHebrewLetterStats());
    setSessionCorrect(0);
    setSessionAttempts(0);
    setSessionElapsedMs(0);
  };

  return (
    <div className="mx-auto max-w-chat space-y-6 overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="text-center">
        <p className="font-sketch text-xl text-gold">Learn Hebrew Letters</p>
        <h2 className="mt-1 font-heading text-2xl text-ink">Block ↔ script</h2>
        <p className="mt-2 font-body text-sm text-ink/50">
          <strong className="font-medium text-ink">Quiz</strong> tests you reliably.{' '}
          <strong className="font-medium text-ink">Draw</strong> builds muscle memory — you compare and self-grade.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant={activity === 'quiz' ? 'default' : 'outline'}
          size="sm"
          className="min-h-10 touch-manipulation px-3"
          onClick={() => setActivity('quiz')}
        >
          Quiz
        </Button>
        <Button
          type="button"
          variant={activity === 'draw' ? 'default' : 'outline'}
          size="sm"
          className="min-h-10 touch-manipulation px-3"
          onClick={() => setActivity('draw')}
        >
          Draw
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {(
          [
            ['mixed', 'Mixed'],
            ['show-block', 'Block → script'],
            ['show-script', 'Script → block'],
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

      {activity === 'quiz' ? (
        <HebrewLetterQuiz
          key={`quiz-${mode}`}
          mode={mode}
          stats={stats}
          onStatsUpdate={setStats}
          onSessionUpdate={handleSessionUpdate}
        />
      ) : (
        <HebrewLetterDrawPractice
          key={`draw-${mode}`}
          mode={mode}
          stats={stats}
          onStatsUpdate={setStats}
          onSessionUpdate={handleSessionUpdate}
        />
      )}

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
