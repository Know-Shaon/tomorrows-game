import { FIXED_TIMESTEP_SECONDS } from './engine';
import { nextSeededRandom } from './rng';
import type { ClassifyConfig, ClassifyState, MessageChoice } from './types';

function spawnCard(state: ClassifyState, config: ClassifyConfig): ClassifyState {
  const random = nextSeededRandom(state.randomState);
  return {
    ...state,
    randomState: random.state,
    currentCardIndex: Math.min(
      config.cards.length - 1,
      Math.floor(random.value * config.cards.length),
    ),
    cardNumber: state.cardNumber + 1,
    cardExpiresAtTick: state.tick + Math.round(config.decisionSeconds / FIXED_TIMESTEP_SECONDS),
  };
}

export function createClassifyState(config: ClassifyConfig): ClassifyState {
  return {
    engine: 'classify-v1',
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
    currentCardIndex: null,
    cardNumber: 0,
    cardExpiresAtTick: 0,
    nextCardTick: 1,
    correct: 0,
    mistakes: 0,
    combo: 0,
    bestCombo: 0,
    lastChoice: null,
  };
}

export function stepClassifyGame(
  previous: ClassifyState,
  choice: MessageChoice | null,
  config: ClassifyConfig,
): ClassifyState {
  if (previous.phase !== 'active') return previous;
  const tick = previous.tick + 1;
  const elapsedSeconds = tick * FIXED_TIMESTEP_SECONDS;
  let currentCardIndex = previous.currentCardIndex;
  let correct = previous.correct;
  let mistakes = previous.mistakes;
  let combo = previous.combo;
  let bestCombo = previous.bestCombo;
  let score = previous.score;
  let feedback = previous.feedbackTicks > 1 ? previous.feedback : null;
  let feedbackTicks = Math.max(0, previous.feedbackTicks - 1);
  let nextCardTick = previous.nextCardTick;
  let lastChoice = previous.lastChoice;

  if (currentCardIndex !== null && (choice || tick >= previous.cardExpiresAtTick)) {
    const card = config.cards[currentCardIndex];
    if (!card) throw new Error('Message index is outside the validated configuration.');
    const isCorrect = choice === card.correctChoice;
    if (isCorrect) {
      correct += 1;
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      score += config.pointsPerCorrect + Math.min(50, combo * 5);
      feedback = 'good';
    } else {
      mistakes += 1;
      combo = 0;
      score = Math.max(0, score - config.missPenalty);
      feedback = 'bad';
    }
    feedbackTicks = 16;
    lastChoice = choice;
    currentCardIndex = null;
    nextCardTick = tick + Math.round(config.spawnDelaySeconds / FIXED_TIMESTEP_SECONDS);
  }

  let state: ClassifyState = {
    ...previous,
    tick,
    elapsedSeconds: Math.min(elapsedSeconds, config.durationSeconds),
    score,
    feedback,
    feedbackTicks,
    phase: elapsedSeconds >= config.durationSeconds ? 'game-over' : 'active',
    endedReason: elapsedSeconds >= config.durationSeconds ? 'complete' : null,
    currentCardIndex,
    correct,
    mistakes,
    combo,
    bestCombo,
    nextCardTick,
    lastChoice,
  };
  if (state.phase === 'active' && state.currentCardIndex === null && tick >= state.nextCardTick) {
    state = spawnCard(state, config);
  }
  return state;
}
