import { createClassifyState, stepClassifyGame } from './classify-engine';
import { createDefenseState, stepDefenseGame } from './defense-engine';
import { createInitialGameState, stepGame } from './engine';
import { createSequenceState, stepSequenceGame } from './sequence-engine';
import { createSortState, stepSortGame } from './sort-engine';
import { createTapState, stepTapGame } from './tap-engine';
import { createTimingState, stepTimingGame } from './timing-engine';
import type { DailyGameConfig, DailyGameInput, DailyGameState } from './types';

export function createDailyGameState(config: DailyGameConfig): DailyGameState {
  switch (config.engine) {
    case 'defense-v1':
      return createDefenseState(config);
    case 'dodge-v1':
      return createInitialGameState(config);
    case 'tap-v1':
      return createTapState(config);
    case 'classify-v1':
      return createClassifyState(config);
    case 'timing-v1':
      return createTimingState(config);
    case 'sequence-v1':
      return createSequenceState(config);
    case 'sort-v1':
      return createSortState(config);
  }
}

export function stepDailyGame(
  state: DailyGameState,
  input: DailyGameInput,
  config: DailyGameConfig,
): DailyGameState {
  if (state.engine !== config.engine || input.engine !== config.engine) {
    throw new Error('Engine state, input, and configuration must use the same engine.');
  }
  switch (config.engine) {
    case 'defense-v1':
      if (state.engine !== 'defense-v1' || input.engine !== 'defense-v1')
        throw new Error('Invalid defense dispatch.');
      return stepDefenseGame(state, input.tap, config);
    case 'dodge-v1':
      if (state.engine !== 'dodge-v1' || input.engine !== 'dodge-v1')
        throw new Error('Invalid dodge dispatch.');
      return stepGame(
        state,
        { laneChange: input.laneChange, directLane: input.directLane },
        config,
      );
    case 'tap-v1':
      if (state.engine !== 'tap-v1' || input.engine !== 'tap-v1')
        throw new Error('Invalid tap dispatch.');
      return stepTapGame(state, input.tap, config);
    case 'classify-v1':
      if (state.engine !== 'classify-v1' || input.engine !== 'classify-v1')
        throw new Error('Invalid classify dispatch.');
      return stepClassifyGame(state, input.choice, config);
    case 'timing-v1':
      if (state.engine !== 'timing-v1' || input.engine !== 'timing-v1')
        throw new Error('Invalid timing dispatch.');
      return stepTimingGame(state, input.stop, config);
    case 'sequence-v1':
      if (state.engine !== 'sequence-v1' || input.engine !== 'sequence-v1')
        throw new Error('Invalid sequence dispatch.');
      return stepSequenceGame(state, input.hit, config);
    case 'sort-v1':
      if (state.engine !== 'sort-v1' || input.engine !== 'sort-v1')
        throw new Error('Invalid sort dispatch.');
      return stepSortGame(state, input.choice, config);
  }
}

export function runDailyGameSteps(
  state: DailyGameState,
  inputs: readonly DailyGameInput[],
  config: DailyGameConfig,
): DailyGameState {
  return inputs.reduce((current, input) => stepDailyGame(current, input, config), state);
}
