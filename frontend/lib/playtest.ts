export const PLAYTEST_STORAGE_KEY = 'tomorrows-game:dev-playtest-v1';

export interface PlaytestGameSummary {
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
  return loadStore(storage).games[gameId] ?? { ...EMPTY_SUMMARY };
}

export function recordPlaytestStart(
  storage: PlaytestStorage,
  gameId: string,
  retry: boolean,
): void {
  const store = loadStore(storage);
  const summary = store.games[gameId] ?? { ...EMPTY_SUMMARY };
  store.games[gameId] = {
    ...summary,
    runsStarted: summary.runsStarted + 1,
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
): void {
  const store = loadStore(storage);
  const summary = store.games[gameId] ?? { ...EMPTY_SUMMARY };
  store.games[gameId] = {
    ...summary,
    runsCompleted: summary.runsCompleted + 1,
    totalScore: summary.totalScore + Math.max(0, score),
    bestScore: Math.max(summary.bestScore, score),
    totalMistakes: summary.totalMistakes + Math.max(0, mistakes),
    totalDurationSeconds: summary.totalDurationSeconds + Math.max(0, durationSeconds),
  };
  saveStore(storage, store);
}

export function resetPlaytestData(storage: PlaytestStorage): void {
  storage.removeItem(PLAYTEST_STORAGE_KEY);
}
