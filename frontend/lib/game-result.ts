import type { DailyGameState } from '@shared/game';

export interface ResultMetric {
  label: string;
  value: string;
}

export interface ResultDescription {
  headline: string;
  verdict: string;
  explanation: string;
  personalBest: string;
  metrics: readonly [ResultMetric, ResultMetric, ResultMetric];
}

function accuracy(correct: number, attempts: number): string {
  return attempts > 0 ? `${Math.round((correct / attempts) * 100)}%` : '—';
}

export function describeResult(state: DailyGameState, personalBest: number): ResultDescription {
  if (state.engine === 'defense-v1') {
    return {
      headline: `${state.shooed} pigeons shooed · ${state.escaped} reached the snack`,
      verdict:
        state.health === 3
          ? 'Snack secured!'
          : state.health > 0
            ? 'Close save!'
            : 'Pigeons win this one',
      explanation: `Each shoo and every survived second built the score; ${state.escaped} pigeons reached the plate.`,
      personalBest: personalBest.toString(),
      metrics: [
        { label: 'Samosa', value: `${state.health}/3` },
        { label: 'Survived', value: `${Math.round(state.elapsedSeconds)}s` },
        { label: 'Shoos', value: state.shooed.toString() },
      ],
    };
  }
  if (state.engine === 'dodge-v1') {
    return {
      headline: `${state.distanceMeters} m driven · ${state.avoided} potholes avoided`,
      verdict:
        state.health === 3
          ? 'Clean commute!'
          : state.health > 0
            ? 'Still rolling!'
            : 'Road wins this round',
      explanation: `Distance, ${state.avoided} avoided potholes, and ${state.coins} coins built this score.`,
      personalBest: personalBest.toString(),
      metrics: [
        { label: 'Coins', value: state.coins.toString() },
        { label: 'Road health', value: `${state.health}/3` },
        { label: 'Avoided', value: state.avoided.toString() },
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
      verdict:
        state.bestCombo >= 8
          ? 'Swat streak!'
          : state.hits > state.misses
            ? 'Meeting rescued!'
            : 'They got away',
      explanation: `Hits and combo bonuses raised the score; ${state.misses} misses reduced it.`,
      personalBest: personalBest.toString(),
      metrics: [
        { label: 'Best combo', value: `×${state.bestCombo}` },
        { label: 'Avg reaction', value: reaction },
        { label: 'Misses', value: state.misses.toString() },
      ],
    };
  }
  if (state.engine === 'classify-v1') {
    const attempts = state.correct + state.mistakes;
    return {
      headline: `${state.correct}/${attempts} messages classified correctly`,
      verdict: state.correct > state.mistakes ? 'Inbox under control!' : 'Inbox still plotting',
      explanation: `Correct calls and combo bonuses added points; ${state.mistakes} mistakes cost points.`,
      personalBest: personalBest.toString(),
      metrics: [
        { label: 'Accuracy', value: accuracy(state.correct, attempts) },
        { label: 'Best combo', value: `×${state.bestCombo}` },
        { label: 'Mistakes', value: state.mistakes.toString() },
      ],
    };
  }
  if (state.engine === 'timing-v1') {
    const closest = state.roundResults.reduce<(typeof state.roundResults)[number] | null>(
      (best, result) =>
        best === null || Math.abs(result.offsetMilliseconds) < Math.abs(best.offsetMilliseconds)
          ? result
          : best,
      null,
    );
    const averageOffset = state.roundResults.length
      ? Math.round(
          state.roundResults.reduce(
            (total, result) => total + Math.abs(result.offsetMilliseconds),
            0,
          ) / state.roundResults.length,
        )
      : null;
    return {
      headline: closest
        ? `${(Math.abs(closest.offsetMilliseconds) / 1_000).toFixed(3)}s away`
        : 'No timer stop recorded',
      verdict: closest?.rating.toUpperCase() ?? 'MISS',
      explanation: `${state.roundResults.length} stops used the same clock as the display; closer bands earned more points.`,
      personalBest: personalBest.toString(),
      metrics: [
        { label: 'Rounds', value: state.roundResults.length.toString() },
        { label: 'Closest', value: closest ? `${Math.abs(closest.offsetMilliseconds)} ms` : '—' },
        { label: 'Average', value: averageOffset === null ? '—' : `${averageOffset} ms` },
      ],
    };
  }
  if (state.engine === 'sequence-v1') {
    const attempts = state.hits + state.misses;
    return {
      headline: `${state.hits}/${attempts} floor notes hit`,
      verdict:
        state.bestCombo >= 4
          ? 'Lift concert!'
          : state.hits > 0
            ? 'A tune is forming!'
            : 'Missed the cue',
      explanation:
        state.misses === 0
          ? 'Every requested floor landed; tighter hits earned more precision points.'
          : `Accurate floor hits earned precision points; ${state.misses} missed cues broke the combo.`,
      personalBest: personalBest.toString(),
      metrics: [
        { label: 'Accuracy', value: accuracy(state.hits, attempts) },
        { label: 'Best combo', value: `×${state.bestCombo}` },
        { label: 'Misses', value: state.misses.toString() },
      ],
    };
  }
  const attempts = state.correct + state.mistakes;
  return {
    headline: `${state.correct}/${attempts} clothes sorted correctly`,
    verdict: state.correct > state.mistakes ? 'Laundry tamed!' : 'Another spin?',
    explanation: `Correct baskets and combo bonuses added points; ${state.mistakes} wrong or dropped items cost points.`,
    personalBest: personalBest.toString(),
    metrics: [
      { label: 'Accuracy', value: accuracy(state.correct, attempts) },
      { label: 'Best combo', value: `×${state.bestCombo}` },
      { label: 'Mistakes', value: state.mistakes.toString() },
    ],
  };
}
