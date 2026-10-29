import type { Grade, RunMode } from '@shared/game/mastery';
const sessionStartedAt = Date.now();
let runsThisSession = 0;
export const PLAYTEST_STORAGE_KEY = 'tomorrows-game:dev-playtest-v1';

export interface PlaytestGameSummary {
  encoreStarted: number;
  encoreCompleted: number;
  perfects: number;
  pbImprovements: number;
  gradeS: number;
  gradeA: number;
  gradeB: number;
  gradeC: number;
  retryDelayTotalMs: number;
  retryDelaySamples: number;
  sessionStartedAt: number;
  runsThisSession: number;
  runsStarted: number;
  runsCompleted: number;
  retries: number;
  totalScore: number;
  bestScore: number;
  totalMistakes: number;
  totalDurationSeconds: number;
}

interface PlaytestStore {
  version: 1;
  games: Record<string, PlaytestGameSummary>;
}

type PlaytestStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const EMPTY_SUMMARY: PlaytestGameSummary = {
  encoreStarted: 0,
  encoreCompleted: 0,
  perfects: 0,
  pbImprovements: 0,
  gradeS: 0,
  gradeA: 0,
  gradeB: 0,
  gradeC: 0,
  retryDelayTotalMs: 0,
  retryDelaySamples: 0,
  sessionStartedAt: 0,
  runsThisSession: 0,
  runsStarted: 0,
  runsCompleted: 0,
  retries: 0,
  totalScore: 0,
  bestScore: 0,
  totalMistakes: 0,
  totalDurationSeconds: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function parseSummary(value: unknown): PlaytestGameSummary {
  if (!isRecord(value)) return { ...EMPTY_SUMMARY };
  return {
    encoreStarted: safeCount(value.encoreStarted),
    encoreCompleted: safeCount(value.encoreCompleted),
    perfects: safeCount(value.perfects),
    pbImprovements: safeCount(value.pbImprovements),
    gradeS: safeCount(value.gradeS),
    gradeA: safeCount(value.gradeA),
    gradeB: safeCount(value.gradeB),
    gradeC: safeCount(value.gradeC),
    retryDelayTotalMs: safeCount(value.retryDelayTotalMs),
    retryDelaySamples: safeCount(value.retryDelaySamples),
    sessionStartedAt: safeCount(value.sessionStartedAt),
    runsThisSession: safeCount(value.runsThisSession),
    runsStarted: safeCount(value.runsStarted),
    runsCompleted: safeCount(value.runsCompleted),
    retries: safeCount(value.retries),
    totalScore: safeCount(value.totalScore),
    bestScore: safeCount(value.bestScore),
    totalMistakes: safeCount(value.totalMistakes),
    totalDurationSeconds: safeCount(value.totalDurationSeconds),
  };
}

function loadStore(storage: PlaytestStorage): PlaytestStore {
  try {
    const raw = storage.getItem(PLAYTEST_STORAGE_KEY);
    if (!raw) return { version: 1, games: {} };
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.games)) {
      return { version: 1, games: {} };
    }
    return {
      version: 1,
      games: Object.fromEntries(
        Object.entries(parsed.games).map(([gameId, summary]) => [gameId, parseSummary(summary)]),
      ),
    };
  } catch {
    return { version: 1, games: {} };
  }
}

function saveStore(storage: PlaytestStorage, store: PlaytestStore): void {
  try {
    storage.setItem(PLAYTEST_STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn('Could not save local development playtest data.', error);
  }
}

export function loadPlaytestSummary(storage: PlaytestStorage, gameId: string): PlaytestGameSummary {
  const summary = loadStore(storage).games[gameId] ?? { ...EMPTY_SUMMARY };
  return { ...summary, runsThisSession };
}

export function recordPlaytestStart(
  storage: PlaytestStorage,
  gameId: string,
  retry: boolean,
  mode: RunMode = 'daily',
  retryDelayMs: number | null = null,
): void {
  const store = loadStore(storage);
  const summary = store.games[gameId] ?? { ...EMPTY_SUMMARY };
  store.games[gameId] = {
    ...summary,
    runsStarted: summary.runsStarted + 1,
    encoreStarted: summary.encoreStarted + (mode === 'encore' ? 1 : 0),
    retryDelayTotalMs:
      summary.retryDelayTotalMs + (retry && retryDelayMs !== null ? Math.max(0, retryDelayMs) : 0),
    retryDelaySamples: summary.retryDelaySamples + (retry && retryDelayMs !== null ? 1 : 0),
    sessionStartedAt,
    runsThisSession: ++runsThisSession,
    retries: summary.retries + (retry ? 1 : 0),
  };
  saveStore(storage, store);
}

export function recordPlaytestFinish(
  storage: PlaytestStorage,
  gameId: string,
  score: number,
  mistakes: number,
  durationSeconds: number,
  outcome?: { mode: RunMode; grade: Grade; perfect: boolean; improved: boolean },
): void {
  const store = loadStore(storage);
  const summary = store.games[gameId] ?? { ...EMPTY_SUMMARY };
  store.games[gameId] = {
    ...summary,
    runsCompleted: summary.runsCompleted + 1,
    encoreCompleted: summary.encoreCompleted + (outcome?.mode === 'encore' ? 1 : 0),
    perfects: summary.perfects + (outcome?.perfect ? 1 : 0),
    pbImprovements: summary.pbImprovements + (outcome?.improved ? 1 : 0),
    gradeS: summary.gradeS + (outcome?.grade === 'S' ? 1 : 0),
    gradeA: summary.gradeA + (outcome?.grade === 'A' ? 1 : 0),
    gradeB: summary.gradeB + (outcome?.grade === 'B' ? 1 : 0),
    gradeC: summary.gradeC + (outcome?.grade === 'C' ? 1 : 0),
    totalScore: summary.totalScore + Math.max(0, score),
    bestScore: Math.max(summary.bestScore, score),
    totalMistakes: summary.totalMistakes + Math.max(0, mistakes),
    totalDurationSeconds: summary.totalDurationSeconds + Math.max(0, durationSeconds),
  };
  saveStore(storage, store);
}

export function resetPlaytestData(storage: PlaytestStorage): void {
  runsThisSession = 0;
  storage.removeItem(PLAYTEST_STORAGE_KEY);
}
