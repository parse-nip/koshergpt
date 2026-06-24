import type { GematriaPrompt } from './values';

const STORAGE_KEY = 'koshergpt-gematria-stats-v1';

export interface GematriaAttemptRecord {
  letterId: string;
  prompt: GematriaPrompt;
  correct: boolean;
  elapsedMs: number;
  timestamp: number;
}

export interface GematriaStats {
  totalAttempts: number;
  correctCount: number;
  currentStreak: number;
  bestStreak: number;
  totalTimeMs: number;
  letterPromptAttempts: number;
  letterPromptCorrect: number;
  valuePromptAttempts: number;
  valuePromptCorrect: number;
  recentAttempts: GematriaAttemptRecord[];
}

const EMPTY_STATS: GematriaStats = {
  totalAttempts: 0,
  correctCount: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalTimeMs: 0,
  letterPromptAttempts: 0,
  letterPromptCorrect: 0,
  valuePromptAttempts: 0,
  valuePromptCorrect: 0,
  recentAttempts: [],
};

export function loadGematriaStats(): GematriaStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STATS, recentAttempts: [] };
    const parsed = JSON.parse(raw) as GematriaStats;
    return {
      ...EMPTY_STATS,
      ...parsed,
      recentAttempts: Array.isArray(parsed.recentAttempts) ? parsed.recentAttempts.slice(0, 30) : [],
    };
  } catch {
    return { ...EMPTY_STATS, recentAttempts: [] };
  }
}

export function saveGematriaStats(stats: GematriaStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function recordGematriaAttempt(
  stats: GematriaStats,
  attempt: Omit<GematriaAttemptRecord, 'timestamp'>,
): GematriaStats {
  const correct = attempt.correct;
  const currentStreak = correct ? stats.currentStreak + 1 : 0;
  const bestStreak = Math.max(stats.bestStreak, currentStreak);

  const next: GematriaStats = {
    totalAttempts: stats.totalAttempts + 1,
    correctCount: stats.correctCount + (correct ? 1 : 0),
    currentStreak,
    bestStreak,
    totalTimeMs: stats.totalTimeMs + attempt.elapsedMs,
    letterPromptAttempts: stats.letterPromptAttempts + (attempt.prompt === 'letter' ? 1 : 0),
    letterPromptCorrect:
      stats.letterPromptCorrect + (attempt.prompt === 'letter' && correct ? 1 : 0),
    valuePromptAttempts: stats.valuePromptAttempts + (attempt.prompt === 'value' ? 1 : 0),
    valuePromptCorrect: stats.valuePromptCorrect + (attempt.prompt === 'value' && correct ? 1 : 0),
    recentAttempts: [{ ...attempt, timestamp: Date.now() }, ...stats.recentAttempts].slice(0, 30),
  };

  saveGematriaStats(next);
  return next;
}

export function resetGematriaStats(): GematriaStats {
  const empty = { ...EMPTY_STATS, recentAttempts: [] };
  saveGematriaStats(empty);
  return empty;
}

export function accuracyPercent(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function averageTimeMs(stats: GematriaStats): number {
  if (stats.totalAttempts === 0) return 0;
  return Math.round(stats.totalTimeMs / stats.totalAttempts);
}
