export const STORAGE_KEY = 'tomorrows-game:prototype';
export const STORAGE_VERSION = 1;

export interface PrototypeState {
  version: 1;
  bestScores: Record<string, number>;
  preferences: {
    soundEnabled: boolean;
  };
  votes: Record<string, string>;
  suggestions: Array<{
    text: string;
    savedAt: string;
  }>;
  stats: {
    streak: number;
    lastPlayedDate: string | null;
  };
}

type StorageReporter = (message: string, error: unknown) => void;
type LocalStoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const defaultReporter: StorageReporter = (message, error) => {
  console.warn(message, error);
};

export function createDefaultPrototypeState(): PrototypeState {
  return {
    version: STORAGE_VERSION,
    bestScores: {},
    preferences: { soundEnabled: false },
    votes: {},
    suggestions: [],
    stats: { streak: 0, lastPlayedDate: null },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeScoreRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] >= 0,
    ),
  );
}

function parseCurrentState(value: unknown): PrototypeState | null {
  if (!isRecord(value) || value.version !== STORAGE_VERSION) {
    return null;
  }
  const preferences = isRecord(value.preferences) ? value.preferences : {};
  const suggestions = Array.isArray(value.suggestions)
    ? value.suggestions.flatMap((suggestion) => {
        if (
          !isRecord(suggestion) ||
          typeof suggestion.text !== 'string' ||
          typeof suggestion.savedAt !== 'string'
        ) {
          return [];
        }
        return [{ text: suggestion.text.slice(0, 240), savedAt: suggestion.savedAt }];
      })
    : [];

  return {
    version: STORAGE_VERSION,
    bestScores: safeScoreRecord(value.bestScores),
    preferences: { soundEnabled: preferences.soundEnabled === true },
    votes: isRecord(value.votes)
      ? Object.fromEntries(
          Object.entries(value.votes).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : {},
    suggestions,
    stats:
      isRecord(value.stats) &&
      typeof value.stats.streak === 'number' &&
      Number.isInteger(value.stats.streak) &&
      value.stats.streak >= 0 &&
      (typeof value.stats.lastPlayedDate === 'string' || value.stats.lastPlayedDate === null)
        ? { streak: value.stats.streak, lastPlayedDate: value.stats.lastPlayedDate }
        : { streak: 0, lastPlayedDate: null },
  };
}

function migrateLegacyState(value: unknown): PrototypeState | null {
  if (!isRecord(value) || value.version !== 0) {
    return null;
  }
  return {
    ...createDefaultPrototypeState(),
    bestScores: safeScoreRecord(value.bestScores),
  };
}

export function loadPrototypeState(
  storage: LocalStoragePort,
  report: StorageReporter = defaultReporter,
): PrototypeState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) {
      return createDefaultPrototypeState();
    }
    const parsed: unknown = JSON.parse(raw);
    const state = parseCurrentState(parsed) ?? migrateLegacyState(parsed);
    if (state) {
      return state;
    }
    storage.removeItem(STORAGE_KEY);
    report('Discarded unsupported local prototype data.', parsed);
  } catch (error) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch (removeError) {
      report('Could not clear corrupt local prototype data.', removeError);
    }
    report('Recovered from unreadable local prototype data.', error);
  }
  return createDefaultPrototypeState();
}

export function savePrototypeState(
  storage: LocalStoragePort,
  state: PrototypeState,
  report: StorageReporter = defaultReporter,
): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    report('Could not save local prototype data.', error);
    return false;
  }
}
