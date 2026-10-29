import { expect, it } from 'vitest';
import { DAILY_CONFIGS, createDailyGameState } from '@shared/game';
import { emptyMastery, recordMastery, parseMastery, encoreUnlocked } from './mastery-storage';

it('versions the collection, gates Encore and keeps Encore out of daily records', () => {
  const config = DAILY_CONFIGS[0]!;
  const initial = createDailyGameState(config);
  const date = new Date(2026, 9, 29);
  let store = emptyMastery();
  expect(encoreUnlocked(store, 302, config.id)).toBe(false);
  expect(recordMastery(store, config, initial, 'daily', date)).toBe(store);
  const state = { ...initial, phase: 'game-over' as const, endedReason: 'collision' as const };
  store = recordMastery(store, config, state, 'daily', date);
  expect(encoreUnlocked(store, 302, config.id)).toBe(true);
  expect(encoreUnlocked(store, 303, config.id)).toBe(false);
  expect(encoreUnlocked(store, 302, 'laundry-logic')).toBe(false);
  const normal = store.records;
  store = recordMastery(store, config, { ...state, score: 5000 }, 'encore', date);
  expect(store.deck).toHaveLength(1);
  expect(store.records[`302:${config.id}:daily`]).toEqual(normal[`302:${config.id}:daily`]);
  expect(parseMastery(JSON.parse(JSON.stringify(store)))).toEqual(store);
  expect(parseMastery({ version: 99, deck: store.deck })).toEqual(emptyMastery());
});

it('keeps earned mastery when later play is worse and discards malformed data', () => {
  const c = DAILY_CONFIGS[0]!;
  const s = createDailyGameState(c);
  if (s.engine !== 'defense-v1') throw Error();
  const good = {
    ...s,
    phase: 'game-over' as const,
    endedReason: 'complete' as const,
    elapsedSeconds: 36,
    shooed: 20,
    score: 1580,
  };
  const date = new Date(2026, 9, 29);
  let store = recordMastery(emptyMastery(), c, good, 'daily', date);
  store = recordMastery(store, c, { ...good, score: 10, escaped: 2, health: 1 }, 'daily', date);
  expect(store.deck[0]?.medal).toBe('perfect');
  expect(store.records[`302:${c.id}:daily`]?.best).toBe(1580);
  expect(
    parseMastery({ version: 1, records: { x: { best: NaN } }, deck: [{ day: 'wrong' }] }),
  ).toEqual(emptyMastery());
});
