import { FIXED_TIMESTEP_SECONDS } from './engine';
import type { TimingConfig, TimingRating, TimingState } from './types';

export function timingRating(offsetMilliseconds: number): TimingRating {
  const absolute = Math.abs(offsetMilliseconds);
  if (absolute <= 25) return 'perfect';
  if (absolute <= 75) return 'excellent';
  if (absolute <= 150) return 'great';
  if (absolute <= 300) return 'good';
  return 'miss';
}

function ratingPoints(rating: TimingRating): number {
  if (rating === 'perfect') return 1_200;
  if (rating === 'excellent') return 950;
  if (rating === 'great') return 700;
  if (rating === 'good') return 400;
  return 0;
}

export function createTimingState(config: TimingConfig): TimingState {
  return {
    engine: 'timing-v1',
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
    round: 1,
    timerSeconds: 0,
    targetSeconds: config.targetsSeconds[0] ?? 7,
    lastOffsetMilliseconds: null,
    lastRating: null,
    roundResults: [],
    waitingTicks: 0,
  };
}

export function stepTimingGame(
  previous: TimingState,
  stopAtSeconds: number | null,
  config: TimingConfig,
): TimingState {
  if (previous.phase !== 'active') return previous;
  const tick = previous.tick + 1;
  const elapsedSeconds = tick * FIXED_TIMESTEP_SECONDS;
  let timerSeconds = previous.timerSeconds;
  let waitingTicks = Math.max(0, previous.waitingTicks - 1);
  let round = previous.round;
  let targetSeconds = previous.targetSeconds;
  let score = previous.score;
  let lastOffsetMilliseconds = previous.lastOffsetMilliseconds;
  let lastRating = previous.lastRating;
  let roundResults = previous.roundResults;
  let feedback = previous.feedbackTicks > 1 ? previous.feedback : null;
  let feedbackTicks = Math.max(0, previous.feedbackTicks - 1);

  if (previous.waitingTicks === 0) timerSeconds += FIXED_TIMESTEP_SECONDS;
  if (stopAtSeconds !== null && previous.waitingTicks === 0) {
    timerSeconds = Math.max(previous.timerSeconds, stopAtSeconds);
  }
  const timedOut = timerSeconds >= targetSeconds + config.roundGraceSeconds;
  if ((stopAtSeconds !== null || timedOut) && previous.waitingTicks === 0) {
    lastOffsetMilliseconds = Math.round((timerSeconds - targetSeconds) * 1_000);
    lastRating = timingRating(lastOffsetMilliseconds);
    score += ratingPoints(lastRating);
    roundResults = [
      ...roundResults,
      { offsetMilliseconds: lastOffsetMilliseconds, rating: lastRating },
    ];
    feedback = lastRating === 'miss' ? 'bad' : 'good';
    feedbackTicks = 28;
    round += 1;
    if (round <= config.targetsSeconds.length) {
      targetSeconds = config.targetsSeconds[round - 1] ?? targetSeconds;
      timerSeconds = 0;
      waitingTicks = 36;
    }
  }

  const completed =
    round > config.targetsSeconds.length || elapsedSeconds >= config.durationSeconds;
  return {
    ...previous,
    phase: completed ? 'game-over' : 'active',
    tick,
    elapsedSeconds: Math.min(elapsedSeconds, config.durationSeconds),
    score,
    feedback,
    feedbackTicks,
    endedReason: completed ? 'complete' : null,
    round,
    timerSeconds,
    targetSeconds,
    lastOffsetMilliseconds,
    lastRating,
    roundResults,
    waitingTicks,
  };
}
