import { beforeEach, describe, expect, it } from 'vitest';
import {
  PLAYTEST_STORAGE_KEY,
  loadPlaytestSummary,
  recordPlaytestFinish,
  recordPlaytestStart,
  resetPlaytestData,
} from './playtest';

describe('development playtest telemetry', () => {
  it('records Encore, exact retry delay, grades, Perfect and PB improvements locally', () => {
    recordPlaytestStart(window.localStorage, 'signature', true, 'encore', 734);
    recordPlaytestFinish(window.localStorage, 'signature', 1000, 0, 20, {
      mode: 'encore',
      grade: 'S',
      perfect: true,
      improved: true,
    });
    expect(loadPlaytestSummary(window.localStorage, 'signature')).toMatchObject({
      encoreStarted: 1,
      encoreCompleted: 1,
      gradeS: 1,
      perfects: 1,
      pbImprovements: 1,
      retryDelayTotalMs: 734,
      retryDelaySamples: 1,
    });
  });
  beforeEach(() => window.localStorage.clear());

  it('records starts, retries, completions, scores, mistakes, and duration separately', () => {
    recordPlaytestStart(window.localStorage, 'test-game', false);
    recordPlaytestStart(window.localStorage, 'test-game', true);
    recordPlaytestFinish(window.localStorage, 'test-game', 420, 2, 18);
    const summary = loadPlaytestSummary(window.localStorage, 'test-game');
    expect(summary).toMatchObject({
      runsStarted: 2,
      runsCompleted: 1,
      retries: 1,
      totalScore: 420,
      bestScore: 420,
      totalMistakes: 2,
      totalDurationSeconds: 18,
    });
    expect(window.localStorage.getItem(PLAYTEST_STORAGE_KEY)).not.toBeNull();
  });

  it('resets only the separate development store', () => {
    window.localStorage.setItem('player-state', 'keep');
    recordPlaytestStart(window.localStorage, 'test-game', false);
    resetPlaytestData(window.localStorage);
    expect(window.localStorage.getItem(PLAYTEST_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem('player-state')).toBe('keep');
  });
});
