import { DAILY_CONFIGS, type DailyGameConfig, type DailyGameState } from '@shared/game';
import {
  assessMastery,
  MEDAL_ORDER,
  type Grade,
  type Medal,
  type RunMode,
} from '@shared/game/mastery';
import { getDailyInfo } from './date';

export interface DailyCard {
  date: string;
  day: number;
  gameId: string;
  medal: Medal;
  grade: Grade;
}
export interface MasteryStore {
  version: 1;
  records: Record<string, { best: number; medal: Medal; grade: Grade }>;
  deck: DailyCard[];
}
export const emptyMastery = (): MasteryStore => ({ version: 1, records: {}, deck: [] });
export function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export const runKey = (day: number, id: string, mode: RunMode) => `${day}:${id}:${mode}`;
export function encoreUnlocked(store: MasteryStore, day: number, id: string): boolean {
  return store.records[runKey(day, id, 'daily')] !== undefined;
}

export function recordMastery(
  store: MasteryStore,
  config: DailyGameConfig,
  state: DailyGameState,
  mode: RunMode,
  date: Date,
): MasteryStore {
  if (state.phase !== 'game-over') return store;
  const gameId = config.id.replace(/-encore$/, '');
  const day = getDailyInfo(date).challengeNumber;
  const key = runKey(day, gameId, mode);
  const result = assessMastery(config, state);
  const old = store.records[key];
  const medal =
    old && MEDAL_ORDER.indexOf(old.medal) > MEDAL_ORDER.indexOf(result.medal)
      ? old.medal
      : result.medal;
  const grade =
    old && 'SABC'.indexOf(old.grade) < 'SABC'.indexOf(result.grade) ? old.grade : result.grade;
  const best = old
    ? result.lowerIsBetter
      ? Math.min(old.best, result.performance)
      : Math.max(old.best, result.performance)
    : result.performance;
  const card = { date: localDay(date), day, gameId, medal, grade };
  return {
    version: 1,
    records: { ...store.records, [key]: { best, medal, grade } },
    deck:
      mode === 'encore'
        ? store.deck
        : [...store.deck.filter((c) => !(c.day === day && c.gameId === gameId)), card]
            .sort((a, b) => a.day - b.day)
            .slice(-90),
  };
}

const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const validMedal = (v: unknown): v is Medal =>
  typeof v === 'string' && MEDAL_ORDER.includes(v as Medal);
const validGrade = (v: unknown): v is Grade =>
  typeof v === 'string' && ['S', 'A', 'B', 'C'].includes(v);
export function parseMastery(value: unknown): MasteryStore {
  if (!record(value) || value.version !== 1) return emptyMastery();
  const records: MasteryStore['records'] = {};
  if (record(value.records))
    for (const [key, v] of Object.entries(value.records)) {
      if (
        /^\d+:[a-z-]+:(daily|encore)$/.test(key) &&
        record(v) &&
        typeof v.best === 'number' &&
        Number.isFinite(v.best) &&
        v.best >= 0 &&
        validMedal(v.medal) &&
        validGrade(v.grade)
      )
        records[key] = { best: v.best, medal: v.medal, grade: v.grade };
    }
  const deck: DailyCard[] = Array.isArray(value.deck)
    ? value.deck
        .flatMap((v) => {
          if (
            !record(v) ||
            typeof v.date !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(v.date) ||
            typeof v.day !== 'number' ||
            !Number.isInteger(v.day) ||
            v.day < 1 ||
            typeof v.gameId !== 'string' ||
            !DAILY_CONFIGS.some((c) => c.id === v.gameId) ||
            !validMedal(v.medal) ||
            !validGrade(v.grade)
          )
            return [];
          return [{ date: v.date, day: v.day, gameId: v.gameId, medal: v.medal, grade: v.grade }];
        })
        .slice(-90)
    : [];
  return { version: 1, records, deck };
}
