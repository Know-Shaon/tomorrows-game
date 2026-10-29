import type { DailyGameConfig, DailyGameState } from './types';

export type RunMode = 'daily' | 'encore';
export type Grade = 'S' | 'A' | 'B' | 'C';
export type Medal = 'played' | 'clear' | 'great' | 'perfect';
export interface MasteryResult {
  grade: Grade;
  medal: Medal;
  performance: number;
  lowerIsBetter: boolean;
  target: string;
}
export const MEDAL_ORDER: readonly Medal[] = ['played', 'clear', 'great', 'perfect'];

export function timingError(state: DailyGameState): number | null {
  if (state.engine !== 'timing-v1' || !state.roundResults.length) return null;
  return Math.round(
    state.roundResults.reduce((sum, r) => sum + Math.abs(r.offsetMilliseconds), 0) /
      state.roundResults.length,
  );
}

/** Rewards use simulation outcomes only. An unfinished/no-input snapshot cannot earn Perfect. */
export function assessMastery(config: DailyGameConfig, state: DailyGameState): MasteryResult {
  const completed = state.phase === 'game-over' && state.endedReason === 'complete';
  const survived = completed && state.elapsedSeconds >= config.durationSeconds;
  let clear = completed;
  let great = false;
  let perfect = false;
  let good = false;
  let target = 'Finish the run';
  if (state.engine === 'defense-v1') {
    clear = survived && state.health > 0;
    great = clear && state.escaped <= 1 && state.shooed > 0;
    perfect = great && state.escaped === 0;
    good = clear;
    target = 'Perfect: protect the snack without an escape';
  } else if (state.engine === 'dodge-v1') {
    clear = survived && state.health > 0;
    great = clear && state.health >= 2;
    perfect = great && state.health === 3 && state.avoided > 0;
    good = clear;
    target = 'Perfect: finish with no bumps';
  } else if (state.engine === 'timing-v1' && config.engine === 'timing-v1') {
    clear = completed && state.roundResults.length === config.targetsSeconds.length;
    const worst = Math.max(...state.roundResults.map((r) => Math.abs(r.offsetMilliseconds)));
    great = clear && worst <= 75;
    perfect = clear && worst <= 25;
    good = clear && (timingError(state) ?? Infinity) <= 150 && worst <= 300;
    target =
      clear && worst > 25 && worst <= 100
        ? `${worst - 25} ms off the widest S-rank stop`
        : 'S rank: every stop within 25 ms';
  } else if (state.engine === 'sequence-v1' && config.engine === 'sequence-v1') {
    const total = config.sequenceLength;
    clear = completed && state.hits > 0;
    great = clear && state.hits >= Math.ceil(total * 0.85) && state.misses <= 1;
    perfect =
      clear &&
      state.hits === total &&
      state.misses === 0 &&
      state.score >= total * config.pointsPerHit * 0.9;
    good = clear && state.hits >= Math.ceil(total * 0.5);
    target = 'Perfect: every note, no misses, 90% precision points';
  } else if (state.engine === 'tap-v1') {
    const accuracy = state.hits / Math.max(1, state.hits + state.misses);
    clear = survived && state.hits > 0;
    great = clear && state.hits >= 8 && accuracy >= 0.9;
    perfect =
      clear &&
      state.hits >= 10 &&
      state.misses === 0 &&
      state.totalReactionTicks / state.hits <= 30;
    good = clear && state.hits >= 3 && accuracy >= 0.6;
    target = 'Perfect: 10+ hits, no misses, average reaction ≤500 ms';
  } else if (state.engine === 'classify-v1' || state.engine === 'sort-v1') {
    const accuracy = state.correct / Math.max(1, state.correct + state.mistakes);
    clear = survived && state.correct > 0;
    great = clear && state.correct >= Math.ceil(config.durationSeconds * 0.4) && accuracy >= 0.9;
    perfect =
      clear && state.correct >= Math.ceil(config.durationSeconds * 0.6) && state.mistakes === 0;
    good = clear && state.correct >= 5 && accuracy >= 0.6;
    target =
      state.mistakes === 1 && state.correct >= Math.ceil(config.durationSeconds * 0.6)
        ? 'One mistake from Perfect'
        : `Perfect: ${Math.ceil(config.durationSeconds * 0.6)}+ correct, no mistakes`;
  }
  return {
    grade: perfect ? 'S' : great ? 'A' : good ? 'B' : 'C',
    medal: perfect ? 'perfect' : great ? 'great' : clear ? 'clear' : 'played',
    performance: state.engine === 'timing-v1' ? (timingError(state) ?? 0) : state.score,
    lowerIsBetter: state.engine === 'timing-v1',
    target,
  };
}

export function comparePersonalBest(value: number, best: number | null, lowerIsBetter = false) {
  const improvement = best === null ? null : lowerIsBetter ? best - value : value - best;
  return {
    isNewBest: best === null || (improvement !== null && improvement > 0),
    best: best === null ? value : lowerIsBetter ? Math.min(value, best) : Math.max(value, best),
    message:
      improvement === null
        ? 'First personal best'
        : improvement > 0
          ? 'New personal best'
          : improvement === 0
            ? 'Personal best matched'
            : `${Math.abs(improvement).toLocaleString()} ${lowerIsBetter ? 'ms' : 'points'} from your best`,
  };
}
