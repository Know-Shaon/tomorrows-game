import { FIXED_TIMESTEP_SECONDS } from './engine';
import { nextSeededRandom } from './rng';
import type { SortConfig, SortSide, SortState } from './types';

function spawnItem(state: SortState, config: SortConfig): SortState {
  const random = nextSeededRandom(state.randomState);
  return {
    ...state,
    randomState: random.state,
    currentItemIndex: Math.min(
      config.items.length - 1,
      Math.floor(random.value * config.items.length),
    ),
    itemProgress: 0,
  };
}

export function createSortState(config: SortConfig): SortState {
  return {
    engine: 'sort-v1',
    configId: config.id,
    phase: 'active',
    seed: config.seed,
    randomState: config.seed,
    tick: 0,
    elapsedSeconds: 0,
    score: 0,
    feedback: null,
    feedbackTicks: 0,
    endedReason: null,
    correct: 0,
    mistakes: 0,
    combo: 0,
    bestCombo: 0,
    currentItemIndex: null,
    itemProgress: 0,
    nextSpawnTick: 1,
  };
}

export function stepSortGame(
  previous: SortState,
  choice: SortSide | null,
  config: SortConfig,
): SortState {
  if (previous.phase !== 'active') return previous;

  const tick = previous.tick + 1;
  const elapsedSeconds = tick * FIXED_TIMESTEP_SECONDS;
  let currentItemIndex = previous.currentItemIndex;
  let itemProgress = previous.itemProgress;
  let nextSpawnTick = previous.nextSpawnTick;
  let score = previous.score;
  let correct = previous.correct;
  let mistakes = previous.mistakes;
  let combo = previous.combo;
  let bestCombo = previous.bestCombo;
  let feedback = previous.feedbackTicks > 1 ? previous.feedback : null;
  let feedbackTicks = Math.max(0, previous.feedbackTicks - 1);

  if (currentItemIndex !== null) {
    itemProgress += FIXED_TIMESTEP_SECONDS / config.itemFallSeconds;
    if (choice) {
      const item = config.items[currentItemIndex];
      if (!item) throw new Error('Sort item index is outside the validated configuration.');
      if (item.correctSide === choice) {
        correct += 1;
        combo += 1;
        bestCombo = Math.max(bestCombo, combo);
        score += config.pointsPerSort + Math.min(50, combo * 5);
        feedback = 'good';
      } else {
        mistakes += 1;
        combo = 0;
        score = Math.max(0, score - config.missPenalty);
        feedback = 'bad';
      }
      feedbackTicks = 16;
      currentItemIndex = null;
      nextSpawnTick = tick + Math.round(config.spawnDelaySeconds / FIXED_TIMESTEP_SECONDS);
    } else if (itemProgress >= 1) {
      mistakes += 1;
      combo = 0;
      score = Math.max(0, score - config.missPenalty);
      feedback = 'bad';
      feedbackTicks = 16;
      currentItemIndex = null;
      nextSpawnTick = tick + Math.round(config.spawnDelaySeconds / FIXED_TIMESTEP_SECONDS);
    }
  }

  let state: SortState = {
    ...previous,
    phase: elapsedSeconds >= config.durationSeconds ? 'game-over' : 'active',
    tick,
    elapsedSeconds: Math.min(elapsedSeconds, config.durationSeconds),
    score,
    feedback,
    feedbackTicks,
    endedReason: elapsedSeconds >= config.durationSeconds ? 'complete' : null,
    correct,
    mistakes,
    combo,
    bestCombo,
    currentItemIndex,
    itemProgress,
    nextSpawnTick,
  };
  if (state.phase === 'active' && state.currentItemIndex === null && tick >= state.nextSpawnTick) {
    state = spawnItem(state, config);
  }
  return state;
}
