import { HEBREW_LETTERS } from '@/lib/hebrew-letters/letters';
import {
  accuracyPercent,
  averageTimeMs,
  type HebrewLetterStats,
} from '@/lib/hebrew-letters/stats';
import { Button } from '@/components/ui/button';

interface HebrewLetterStatsPanelProps {
  stats: HebrewLetterStats;
  sessionCorrect: number;
  sessionAttempts: number;
  sessionElapsedMs: number;
  onReset: () => void;
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

export function HebrewLetterStatsPanel({
  stats,
  sessionCorrect,
  sessionAttempts,
  sessionElapsedMs,
  onReset,
}: HebrewLetterStatsPanelProps) {
  const overallAccuracy = accuracyPercent(stats.correctCount, stats.totalAttempts);
  const sessionAccuracy = accuracyPercent(sessionCorrect, sessionAttempts);
  const blockAccuracy = accuracyPercent(stats.blockCorrect, stats.blockAttempts);
  const scriptAccuracy = accuracyPercent(stats.scriptCorrect, stats.scriptAttempts);

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
        <StatCard label="Avg time" value={`${(averageTimeMs(stats) / 1000).toFixed(1)}s`} hint="Per attempt" />
        <StatCard
          label="This session"
          value={`${sessionAccuracy}%`}
          hint={`${sessionCorrect}/${sessionAttempts} · ${(sessionElapsedMs / 1000).toFixed(0)}s total`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Drawn in block" value={`${blockAccuracy}%`} hint={`${stats.blockCorrect}/${stats.blockAttempts}`} />
        <StatCard label="Drawn in script" value={`${scriptAccuracy}%`} hint={`${stats.scriptCorrect}/${stats.scriptAttempts}`} />
      </div>

      {stats.recentAttempts.length > 0 ? (
        <div className="sketch-card bg-white p-3">
          <p className="mb-2 font-body text-[11px] uppercase tracking-wide text-ink/40">Recent attempts</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {stats.recentAttempts.slice(0, 10).map((attempt) => {
              const letter = HEBREW_LETTERS.find((l) => l.id === attempt.letterId);
              const predicted = HEBREW_LETTERS.find((l) => l.id === attempt.predictedLetterId);
              return (
                <li
                  key={`${attempt.timestamp}-${attempt.letterId}`}
                  className="flex items-center justify-between gap-2 font-body text-xs text-ink/65"
                >
                  <span>
                    {letter?.char} ({letter?.name}) · saw {attempt.shownStyle} → drew {attempt.targetStyle}
                  </span>
                  <span className={attempt.correct ? 'text-gold' : 'text-destructive'}>
                    {attempt.correct ? '✓' : `✗ ${predicted?.name ?? '?'}`} · {(attempt.elapsedMs / 1000).toFixed(1)}s
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
