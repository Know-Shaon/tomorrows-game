import type { DailyGameState } from '@shared/game';

export interface ResultMetric {
  label: string;
  value: string;
}

export interface ResultDescription {
  headline: string;
  metrics: readonly [ResultMetric, ResultMetric, ResultMetric];
}

function accuracy(correct: number, attempts: number): string {
  return attempts > 0 ? `${Math.round((correct / attempts) * 100)}%` : '—';
}

export function describeResult(state: DailyGameState, personalBest: number): ResultDescription {
  if (state.engine === 'defense-v1') {
    return {
      headline: `${state.shooed} pigeons shooed · ${state.escaped} reached the snack`,
      metrics: [
        { label: 'Samosa', value: `${state.health}/3` },
        { label: 'Survived', value: `${Math.round(state.elapsedSeconds)}s` },
        { label: 'Best', value: personalBest.toString() },
      ],
    };
  }
  if (state.engine === 'dodge-v1') {
    return {
      headline: `${state.distanceMeters} m driven · ${state.avoided} potholes avoided`,
      metrics: [
        { label: 'Coins', value: state.coins.toString() },
        { label: 'Road health', value: `${state.health}/3` },
        { label: 'Best', value: personalBest.toString() },
      ],
    };
  }
  if (state.engine === 'tap-v1') {
    const attempts = state.hits + state.misses;
    const reaction =
      state.hits > 0
        ? `${Math.round((state.totalReactionTicks / state.hits / 60) * 1_000)} ms`
        : '—';
    return {
      headline: `${state.hits} mosquitoes hit · ${accuracy(state.hits, attempts)} accuracy`,
      metrics: [
        { label: 'Best combo', value: `×${state.bestCombo}` },
        { label: 'Avg reaction', value: reaction },
        { label: 'Best', value: personalBest.toString() },
      ],
    };
  }
  if (state.engine === 'classify-v1') {
    const attempts = state.correct + state.mistakes;
    return {
      headline: `${state.correct}/${attempts} messages classified correctly`,
      metrics: [
        { label: 'Accuracy', value: accuracy(state.correct, attempts) },
        { label: 'Best combo', value: `×${state.bestCombo}` },
        { label: 'Best', value: personalBest.toString() },
      ],
    };
  }
  if (state.engine === 'timing-v1') {
    const offset = state.lastOffsetMilliseconds;
    return {
      headline:
        offset === null
          ? 'No timer stop recorded'
          : `${offset >= 0 ? '+' : ''}${offset} ms · ${state.lastRating?.toUpperCase() ?? 'MISS'}`,
      metrics: [
        { label: 'Rounds', value: Math.max(0, state.round - 1).toString() },
        { label: 'Last target', value: `${state.targetSeconds.toFixed(2)}s` },
        { label: 'Best', value: personalBest.toString() },
      ],
    };
  }
  if (state.engine === 'sequence-v1') {
    const attempts = state.hits + state.misses;
    return {
      headline: `${state.hits}/${attempts} floor notes hit`,
      metrics: [
        { label: 'Accuracy', value: accuracy(state.hits, attempts) },
        { label: 'Best combo', value: `×${state.bestCombo}` },
        { label: 'Best', value: personalBest.toString() },
      ],
    };
  }
  const attempts = state.correct + state.mistakes;
  return {
    headline: `${state.correct}/${attempts} clothes sorted correctly`,
    metrics: [
      { label: 'Accuracy', value: accuracy(state.correct, attempts) },
      { label: 'Best combo', value: `×${state.bestCombo}` },
      { label: 'Best', value: personalBest.toString() },
    ],
  };
}
