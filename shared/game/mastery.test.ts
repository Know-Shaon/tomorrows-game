import { describe, expect, it } from 'vitest';
import {
  DAILY_CONFIGS,
  createDailyGameState,
  generateLaneWave,
  canReachLane,
  stepDailyGame,
  getDefenseThreatPosition,
  getTapTargetPosition,
} from './index';
import { assessMastery, comparePersonalBest } from './mastery';
import { createEncoreConfig, concealedTimer } from './encore';
import type { DailyGameConfig, DailyGameInput, DailyGameState } from './types';

function input(c: DailyGameConfig, s: DailyGameState): DailyGameInput {
  switch (c.engine) {
    case 'defense-v1':
      return { engine: c.engine, tap: null };
    case 'dodge-v1':
      return { engine: c.engine, laneChange: 0, directLane: null };
    case 'tap-v1':
      return { engine: c.engine, tap: null };
    case 'classify-v1':
      return { engine: c.engine, choice: null };
    case 'timing-v1':
      return {
        engine: c.engine,
        stopAtSeconds:
          s.engine === 'timing-v1' && s.timerSeconds >= s.targetSeconds ? s.timerSeconds : null,
      };
    case 'sequence-v1':
      return { engine: c.engine, hit: false };
    default:
      return { engine: c.engine, choice: null };
  }
}
describe('mastery and Encore', () => {
  it('never awards S or Perfect to initial or idle outcomes', () => {
    for (const c of DAILY_CONFIGS) {
      const s = createDailyGameState(c);
      expect(assessMastery(c, s).grade).toBe('C');
      expect(
        assessMastery(c, {
          ...s,
          phase: 'game-over',
          endedReason: 'complete',
          elapsedSeconds: c.durationSeconds,
        }).medal,
      ).not.toBe('perfect');
    }
  });
  it('grades survival damage explicitly', () => {
    const c = DAILY_CONFIGS[0]!;
    const s = createDailyGameState(c);
    if (s.engine !== 'defense-v1') throw Error();
    const finished = {
      ...s,
      phase: 'game-over' as const,
      endedReason: 'complete' as const,
      elapsedSeconds: c.durationSeconds,
      shooed: 20,
    };
    for (const [escaped, grade] of [
      [0, 'S'],
      [1, 'A'],
      [2, 'B'],
    ] as const)
      expect(assessMastery(c, { ...finished, escaped, health: 3 - escaped }).grade).toBe(grade);
    expect(assessMastery(c, { ...finished, health: 0, endedReason: 'collision' }).grade).toBe('C');
  });
  it('requires every microwave round within the boundary, not one lucky stop', () => {
    const c = DAILY_CONFIGS.find((c) => c.engine === 'timing-v1')!;
    const s = createDailyGameState(c);
    if (s.engine !== 'timing-v1') throw Error();
    for (const [offset, grade] of [
      [25, 'S'],
      [26, 'A'],
      [75, 'A'],
      [76, 'B'],
      [301, 'C'],
    ] as const) {
      const state = {
        ...s,
        phase: 'game-over' as const,
        endedReason: 'complete' as const,
        roundResults: [0, 0, offset].map((offsetMilliseconds) => ({
          offsetMilliseconds,
          rating: 'great' as const,
        })),
      };
      expect(assessMastery(c, state).grade).toBe(grade);
    }
  });
  it('requires throughput for sorting and clean fast reactions for swatting', () => {
    for (const c of DAILY_CONFIGS.filter((c) =>
      ['sort-v1', 'classify-v1', 'tap-v1'].includes(c.engine),
    )) {
      const s = createDailyGameState(c);
      const finish = {
        ...s,
        phase: 'game-over' as const,
        endedReason: 'complete' as const,
        elapsedSeconds: c.durationSeconds,
      };
      if (finish.engine === 'tap-v1') {
        expect(assessMastery(c, { ...finish, hits: 10, totalReactionTicks: 300 }).grade).toBe('S');
        expect(assessMastery(c, { ...finish, hits: 10, totalReactionTicks: 301 }).grade).toBe('A');
      } else if (finish.engine === 'sort-v1' || finish.engine === 'classify-v1') {
        expect(assessMastery(c, { ...finish, correct: 1 }).grade).toBe('C');
        expect(assessMastery(c, { ...finish, correct: 18 }).medal).toBe('perfect');
        expect(assessMastery(c, { ...finish, correct: 18, mistakes: 1 }).target).toBe(
          'One mistake from Perfect',
        );
      }
    }
  });
  it('reports exact PB gaps and ties, in both directions', () => {
    expect(comparePersonalBest(977, 1000).message).toBe('23 points from your best');
    expect(comparePersonalBest(35, 31, true).message).toBe('4 ms from your best');
    expect(comparePersonalBest(31, 31, true).isNewBest).toBe(false);
    expect(comparePersonalBest(25, 31, true).isNewBest).toBe(true);
    expect(comparePersonalBest(0, null).message).toBe('First personal best');
  });
  it('keeps all Encore outcomes deterministic and does not mutate daily configs', () => {
    for (const original of DAILY_CONFIGS) {
      const saved = JSON.stringify(original);
      const c = createEncoreConfig(original);
      let a = createDailyGameState(c),
        b = createDailyGameState(c);
      for (let i = 0; i < 2800; i++) {
        a = stepDailyGame(a, input(c, a), c);
        b = stepDailyGame(b, input(c, b), c);
      }
      expect(a).toEqual(b);
      expect(a.phase).toBe('game-over');
      expect(JSON.stringify(original)).toBe(saved);
      expect(createEncoreConfig(c)).toBe(c);
    }
  });
  it('preserves reachable Rush Hour lanes for 1000 seeds and 40000 waves', () => {
    const original = DAILY_CONFIGS.find((c) => c.engine === 'dodge-v1')!;
    const c = createEncoreConfig(original);
    if (c.engine !== 'dodge-v1') throw Error();
    for (let seed = 1; seed <= 1000; seed++) {
      let random = seed;
      let lane: 0 | 1 | 2 = 1;
      for (let i = 0; i < 40; i++) {
        const g = generateLaneWave(random, lane, i, c);
        expect(canReachLane(lane, g.wave.safeLane, g.decisionSeconds, c)).toBe(true);
        expect(g.wave.hazards[g.wave.safeLane]).toBe(false);
        random = g.randomState;
        lane = g.wave.safeLane;
      }
    }
  }, 30000);
  it('conceals only the final clock portion and preserves daily visibility', () => {
    const c = DAILY_CONFIGS.find((c) => c.engine === 'timing-v1')!;
    const encore = createEncoreConfig(c);
    expect(concealedTimer(encore, 4.59, 5, 0)).toBe(false);
    expect(concealedTimer(encore, 4.6, 5, 0)).toBe(true);
    expect(concealedTimer(c, 4.8, 5, 0)).toBe(false);
    expect(concealedTimer(encore, 4.8, 5, 5)).toBe(false);
  });
  it('allows a clean S-rank run in every daily and Encore simulation', () => {
    for (const original of DAILY_CONFIGS)
      for (const c of [original, createEncoreConfig(original)]) {
        let s = createDailyGameState(c);
        for (let tick = 0; tick < 2800 && s.phase === 'active'; tick++) {
          let action = input(c, s);
          if (s.engine === 'defense-v1') {
            const bird = s.threats.find((t) => t.distance < 450);
            if (bird) action = { engine: s.engine, tap: getDefenseThreatPosition(bird, s.tick) };
          } else if (
            s.engine === 'tap-v1' &&
            s.target?.kind === 'target' &&
            s.tick - s.target.spawnedAtTick >= 12
          )
            action = { engine: s.engine, tap: getTapTargetPosition(s.target, s.tick) };
          else if (s.engine === 'dodge-v1') {
            const wave = s.waves.find((w) => !w.resolved);
            if (wave) action = { engine: s.engine, laneChange: 0, directLane: wave.safeLane };
          } else if (
            s.engine === 'classify-v1' &&
            c.engine === 'classify-v1' &&
            s.currentCardIndex !== null &&
            s.tick - s.cardStartedAtTick >= 12
          )
            action = { engine: s.engine, choice: c.cards[s.currentCardIndex]!.correctChoice };
          else if (
            s.engine === 'sort-v1' &&
            c.engine === 'sort-v1' &&
            s.currentItemIndex !== null &&
            s.itemProgress > 0.1
          )
            action = { engine: s.engine, choice: c.items[s.currentItemIndex]!.correctSide };
          else if (
            s.engine === 'sequence-v1' &&
            Math.abs(s.currentFloor - (s.requests[s.requestIndex] ?? 100)) < 0.045
          )
            action = { engine: s.engine, hit: true };
          s = stepDailyGame(s, action, c);
        }
        expect(s.phase, c.id).toBe('game-over');
        expect(assessMastery(c, s).grade, c.id).toBe('S');
      }
  });
});
