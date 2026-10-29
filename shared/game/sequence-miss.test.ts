import { expect, it } from 'vitest';
import { DAILY_CONFIGS, createSequenceState, stepSequenceGame } from './index';

it('passes an unanswered floor and advances instead of oscillating forever in its hit window', () => {
  const config = DAILY_CONFIGS.find((c) => c.engine === 'sequence-v1');
  if (!config) throw new Error('Missing elevator');
  let state = createSequenceState(config);
  for (let tick = 0; tick < 600 && state.requestIndex === 0; tick++)
    state = stepSequenceGame(state, false, config);
  expect(state.requestIndex).toBeGreaterThan(0);
  expect(state.misses).toBeGreaterThan(0);
  expect(state.hits).toBe(0);
});
