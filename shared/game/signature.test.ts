import { expect, it } from 'vitest';
import { DAILY_CONFIGS, createDailyGameState } from './index';
import { signatureForTransition } from './signature';
it('recognizes a measured near miss but never an ordinary clear or collision', () => {
  const c = DAILY_CONFIGS.find((c) => c.engine === 'dodge-v1')!;
  const s = createDailyGameState(c);
  if (s.engine !== 'dodge-v1') throw Error();
  const wave = {
    id: 1,
    safeLane: 1 as const,
    hazards: [true, false, false] as const,
    bonusLane: null,
    progress: 0.89,
    travelSeconds: 2,
    resolved: false,
  };
  const previous = { ...s, waves: [wave] };
  const next = {
    ...previous,
    tick: 1,
    waves: [{ ...wave, resolved: true }],
    playerLanePosition: 0.4,
  };
  expect(signatureForTransition(previous, next, c)?.kind).toBe('near-miss');
  expect(signatureForTransition(previous, { ...next, playerLanePosition: 1 }, c)).toBeNull();
  expect(signatureForTransition(previous, { ...next, health: 2 }, c)).toBeNull();
});
