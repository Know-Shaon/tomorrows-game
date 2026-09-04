import { describe, expect, it } from 'vitest';
import { DAILY_CONFIGS } from './configs';
import {
  FIXED_TIMESTEP_SECONDS,
  canReachLane,
  createInitialGameState,
  generateLaneWave,
  runFixedSteps,
} from './engine';
import type { DodgeConfig, GameInput, LaneIndex } from './types';

const config = DAILY_CONFIGS.find(
  (candidate): candidate is DodgeConfig => candidate.engine === 'dodge-v1',
);
if (!config) throw new Error('Expected the Pothole Patrol configuration.');

const neutral: GameInput = { laneChange: 0, directLane: null };

describe('Pothole Patrol lane engine', () => {
  it('is deterministic for identical configuration, seed, and lane inputs', () => {
    const inputs: GameInput[] = Array.from({ length: 2_400 }, (_, tick) => ({
      laneChange: tick % 180 === 0 ? -1 : tick % 180 === 90 ? 1 : 0,
      directLane: null,
    }));
    expect(runFixedSteps(createInitialGameState(config), inputs, config)).toEqual(
      runFixedSteps(createInitialGameState(config), inputs, config),
    );
  });

  it('advances a fixed-step distance score', () => {
    const result = runFixedSteps(
      createInitialGameState(config),
      Array.from({ length: 60 }, () => neutral),
      config,
    );
    expect(result.tick).toBe(60);
    expect(result.elapsedSeconds).toBe(1);
    expect(result.distanceMeters).toBe(config.metersPerSecond);
  });

  it('keeps a reachable safe path for 5,000 seeds and 200,000 waves', () => {
    for (let seed = 1; seed <= 5_000; seed += 1) {
      let randomState = seed;
      let previousSafeLane: LaneIndex = 1;
      for (let waveIndex = 0; waveIndex < 40; waveIndex += 1) {
        const generated = generateLaneWave(randomState, previousSafeLane, waveIndex, config);
        expect(generated.wave.hazards[generated.wave.safeLane]).toBe(false);
        expect(
          canReachLane(
            previousSafeLane,
            generated.wave.safeLane,
            generated.decisionSeconds,
            config,
          ),
        ).toBe(true);
        expect(generated.wave.hazards.some(Boolean)).toBe(true);
        randomState = generated.randomState;
        previousSafeLane = generated.wave.safeLane;
      }
    }
  });

  it('caps lane movement at the configured switch speed', () => {
    const start = createInitialGameState(config);
    const result = runFixedSteps(start, [{ laneChange: -1, directLane: null }], config);
    expect(start.playerLanePosition - result.playerLanePosition).toBeCloseTo(
      FIXED_TIMESTEP_SECONDS / config.laneSwitchSeconds,
    );
  });
});
