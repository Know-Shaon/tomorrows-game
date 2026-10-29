import { describe, expect, it } from 'vitest';
import { createClassifyState, stepClassifyGame } from './classify-engine';
import { DAILY_CONFIGS } from './configs';
import { createDefenseState, stepDefenseGame } from './defense-engine';
import { FIXED_TIMESTEP_SECONDS } from './engine';
import { createDailyGameState, runDailyGameSteps, stepDailyGame } from './platform';
import { stepSequenceGame } from './sequence-engine';
import { createSortState, stepSortGame } from './sort-engine';
import { createTapState, getTapTargetPosition, stepTapGame } from './tap-engine';
import { createTimingState, stepTimingGame, timingRating } from './timing-engine';
import type { DailyGameConfig, DailyGameInput } from './types';

function configFor<T extends DailyGameConfig['engine']>(
  engine: T,
): Extract<DailyGameConfig, { engine: T }> {
  const found = DAILY_CONFIGS.find(
    (candidate): candidate is Extract<DailyGameConfig, { engine: T }> =>
      candidate.engine === engine,
  );
  if (!found) throw new Error(`Missing ${engine}.`);
  return found;
}

function neutralInput(config: DailyGameConfig): DailyGameInput {
  if (config.engine === 'defense-v1') return { engine: 'defense-v1', tap: null };
  if (config.engine === 'dodge-v1') return { engine: 'dodge-v1', laneChange: 0, directLane: null };
  if (config.engine === 'tap-v1') return { engine: 'tap-v1', tap: null };
  if (config.engine === 'classify-v1') return { engine: 'classify-v1', choice: null };
  if (config.engine === 'timing-v1') return { engine: 'timing-v1', stopAtSeconds: null };
  if (config.engine === 'sequence-v1') return { engine: 'sequence-v1', hit: false };
  return { engine: 'sort-v1', choice: null };
}

describe('seven deterministic daily mechanics', () => {
  it('creates and dispatches every distinct engine', () => {
    for (const config of DAILY_CONFIGS) {
      const next = stepDailyGame(createDailyGameState(config), neutralInput(config), config);
      expect(next.engine).toBe(config.engine);
      expect(next.elapsedSeconds).toBe(FIXED_TIMESTEP_SECONDS);
    }
  });

  it('replays every engine identically', () => {
    for (const config of DAILY_CONFIGS) {
      const inputs = Array.from({ length: 600 }, () => neutralInput(config));
      expect(runDailyGameSteps(createDailyGameState(config), inputs, config)).toEqual(
        runDailyGameSteps(createDailyGameState(config), inputs, config),
      );
    }
  });

  it('scores Samosa taps, Mosquito targets, and Inbox decisions', () => {
    const defenseConfig = configFor('defense-v1');
    const defense = createDailyGameState(defenseConfig);
    if (defense.engine !== 'defense-v1') throw new Error('Defense state mismatch.');
    const threat = {
      id: 1,
      angle: 0,
      distance: 100,
      approachRate: 0,
      variant: 'glide' as const,
      radius: 48,
    };
    expect(
      stepDefenseGame({ ...defense, threats: [threat] }, { x: 600, y: 525 }, defenseConfig).shooed,
    ).toBe(1);

    const tapConfig = configFor('tap-v1');
    const tap = createDailyGameState(tapConfig);
    if (tap.engine !== 'tap-v1') throw new Error('Tap state mismatch.');
    const target = {
      id: 1,
      kind: 'target' as const,
      token: 'mosquito' as const,
      x: 400,
      y: 400,
      radius: 50,
      motion: 'hover' as const,
      motionAmplitude: 0,
      motionRate: 0,
      spawnedAtTick: 0,
      expiresAtTick: 90,
    };
    expect(stepTapGame({ ...tap, target }, { x: 400, y: 400 }, tapConfig).hits).toBe(1);

    const classifyConfig = configFor('classify-v1');
    const classify = createDailyGameState(classifyConfig);
    if (classify.engine !== 'classify-v1') throw new Error('Classify state mismatch.');
    const currentCardIndex = 0;
    const choice = classifyConfig.cards[currentCardIndex]?.correctChoice ?? 'keep';
    expect(
      stepClassifyGame({ ...classify, currentCardIndex }, choice, classifyConfig).correct,
    ).toBe(1);
  });

  it('makes Microwave precision, Elevator rhythm, and Laundry sorting independent', () => {
    expect(timingRating(25)).toBe('perfect');
    expect(timingRating(75)).toBe('excellent');
    expect(timingRating(49)).toBe('excellent');
    expect(timingRating(151)).toBe('good');
    const timingConfig = configFor('timing-v1');
    const timing = createDailyGameState(timingConfig);
    if (timing.engine !== 'timing-v1') throw new Error('Timing state mismatch.');
    const stopped = stepTimingGame(
      { ...timing, timerSeconds: timing.targetSeconds - FIXED_TIMESTEP_SECONDS },
      timing.targetSeconds,
      timingConfig,
    );
    expect(stopped.lastRating).toBe('perfect');
    expect(stopped.score).toBe(1_200);
    expect(stopped.roundResults).toEqual([{ offsetMilliseconds: 0, rating: 'perfect' }]);

    const sequenceConfig = configFor('sequence-v1');
    const sequence = createDailyGameState(sequenceConfig);
    if (sequence.engine !== 'sequence-v1') throw new Error('Sequence state mismatch.');
    expect(sequence.requests).toHaveLength(12);
    const requested = sequence.requests[0] ?? sequenceConfig.minFloor;
    expect(
      stepSequenceGame({ ...sequence, currentFloor: requested }, true, sequenceConfig).hits,
    ).toBe(1);

    const sortConfig = configFor('sort-v1');
    const sort = createDailyGameState(sortConfig);
    if (sort.engine !== 'sort-v1') throw new Error('Sort state mismatch.');
    const item = sortConfig.items[0];
    if (!item) throw new Error('Missing laundry item.');
    expect(
      stepSortGame({ ...sort, currentItemIndex: 0 }, item.correctSide, sortConfig).correct,
    ).toBe(1);
  });

  it('uses the captured Microwave clock value consistently', () => {
    const config = configFor('timing-v1');
    const state = createTimingState(config);
    const stopped = stepTimingGame(state, state.targetSeconds + 0.074, config);
    expect(stopped.lastOffsetMilliseconds).toBe(74);
    expect(stopped.lastRating).toBe('excellent');
    expect(stopped.score).toBe(950);
  });

  it('eases early targets and tightens later deterministic pacing', () => {
    const defenseConfig = configFor('defense-v1');
    const earlyDefense = stepDefenseGame(
      { ...createDefenseState(defenseConfig), nextSpawnTick: 0 },
      null,
      defenseConfig,
    );
    const lateDefense = stepDefenseGame(
      {
        ...createDefenseState(defenseConfig),
        tick: 1_800,
        elapsedSeconds: 30,
        nextSpawnTick: 0,
      },
      null,
      defenseConfig,
    );
    expect(lateDefense.threats[0]?.approachRate ?? 0).toBeGreaterThan(
      earlyDefense.threats[0]?.approachRate ?? 0,
    );

    const tapConfig = configFor('tap-v1');
    const earlyTap = stepTapGame(
      { ...createTapState(tapConfig), nextSpawnTick: 0 },
      null,
      tapConfig,
    );
    const lateTap = stepTapGame(
      { ...createTapState(tapConfig), tick: 1_500, elapsedSeconds: 25, nextSpawnTick: 0 },
      null,
      tapConfig,
    );
    expect(lateTap.target?.radius ?? 100).toBeLessThan(earlyTap.target?.radius ?? 0);
    expect(lateTap.target?.radius ?? 0).toBeGreaterThanOrEqual(52);
    if (lateTap.target) {
      expect(getTapTargetPosition(lateTap.target, lateTap.tick)).toEqual(
        getTapTargetPosition(lateTap.target, lateTap.tick),
      );
    }

    const classifyConfig = configFor('classify-v1');
    const earlyCard = stepClassifyGame(
      { ...createClassifyState(classifyConfig), nextCardTick: 0 },
      null,
      classifyConfig,
    );
    expect(classifyConfig.cards[earlyCard.currentCardIndex ?? -1]?.difficulty).toBe('easy');

    const sortConfig = configFor('sort-v1');
    const itemIndex = 0;
    const earlySort = stepSortGame(
      { ...createSortState(sortConfig), currentItemIndex: itemIndex },
      null,
      sortConfig,
    );
    const lateSort = stepSortGame(
      {
        ...createSortState(sortConfig),
        tick: 1_500,
        elapsedSeconds: 25,
        currentItemIndex: itemIndex,
      },
      null,
      sortConfig,
    );
    expect(lateSort.itemProgress).toBeGreaterThan(earlySort.itemProgress);
  });

  it('rejects stale cross-engine actions', () => {
    const config = configFor('tap-v1');
    expect(() =>
      stepDailyGame(
        createDailyGameState(config),
        { engine: 'timing-v1', stopAtSeconds: null },
        config,
      ),
    ).toThrow('same engine');
  });
});
