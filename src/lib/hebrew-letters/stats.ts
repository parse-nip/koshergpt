import type { LetterStyle } from './letters';

const STORAGE_KEY = 'koshergpt-hebrew-letter-stats-v2';

export interface AttemptRecord {
  letterId: string;
  shownStyle: LetterStyle;
  targetStyle: LetterStyle;
  correct: boolean;
  elapsedMs: number;
  confidence: number;
  predictedLetterId: string;
  timestamp: number;
}

export interface HebrewLetterStats {
  totalAttempts: number;
  correctCount: number;
  currentStreak: number;
  bestStreak: number;
  totalTimeMs: number;
  blockAttempts: number;
  blockCorrect: number;
  scriptAttempts: number;
  scriptCorrect: number;
  recentAttempts: AttemptRecord[];
}

const EMPTY_STATS: HebrewLetterStats = {
  totalAttempts: 0,
  correctCount: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalTimeMs: 0,
  blockAttempts: 0,
  blockCorrect: 0,
  scriptAttempts: 0,
  scriptCorrect: 0,
  recentAttempts: [],
};

export function loadHebrewLetterStats(): HebrewLetterStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STATS, recentAttempts: [] };
    const parsed = JSON.parse(raw) as HebrewLetterStats;
    return {
      ...EMPTY_STATS,
      ...parsed,
      recentAttempts: Array.isArray(parsed.recentAttempts) ? parsed.recentAttempts.slice(0, 30) : [],
    };
  } catch {
    return { ...EMPTY_STATS, recentAttempts: [] };
  }
}

export function saveHebrewLetterStats(stats: HebrewLetterStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function recordAttempt(
  stats: HebrewLetterStats,
  attempt: Omit<AttemptRecord, 'timestamp'>,
): HebrewLetterStats {
  const correct = attempt.correct;
  const currentStreak = correct ? stats.currentStreak + 1 : 0;
  const bestStreak = Math.max(stats.bestStreak, currentStreak);

  const next: HebrewLetterStats = {
    totalAttempts: stats.totalAttempts + 1,
    correctCount: stats.correctCount + (correct ? 1 : 0),
    currentStreak,
    bestStreak,
    totalTimeMs: stats.totalTimeMs + attempt.elapsedMs,
    blockAttempts: stats.blockAttempts + (attempt.targetStyle === 'block' ? 1 : 0),
    blockCorrect: stats.blockCorrect + (attempt.targetStyle === 'block' && correct ? 1 : 0),
    scriptAttempts: stats.scriptAttempts + (attempt.targetStyle === 'script' ? 1 : 0),
    scriptCorrect: stats.scriptCorrect + (attempt.targetStyle === 'script' && correct ? 1 : 0),
    recentAttempts: [
      { ...attempt, timestamp: Date.now() },
      ...stats.recentAttempts,
    ].slice(0, 30),
  };

  saveHebrewLetterStats(next);
  return next;
}

export function resetHebrewLetterStats(): HebrewLetterStats {
  const empty = { ...EMPTY_STATS, recentAttempts: [] };
  saveHebrewLetterStats(empty);
  return empty;
}

export function accuracyPercent(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function averageTimeMs(stats: HebrewLetterStats): number {
  if (stats.totalAttempts === 0) return 0;
  return Math.round(stats.totalTimeMs / stats.totalAttempts);
}
