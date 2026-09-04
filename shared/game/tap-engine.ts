import { FIXED_TIMESTEP_SECONDS } from './engine';
import { nextSeededRandom } from './rng';
import type { TapConfig, TapState, TapTarget } from './types';

function spawnTarget(state: TapState, config: TapConfig): TapState {
  const xRandom = nextSeededRandom(state.randomState);
  const yRandom = nextSeededRandom(xRandom.state);
  const kindRandom = nextSeededRandom(yRandom.state);
  const tokenRandom = nextSeededRandom(kindRandom.state);
  const progress = Math.min(1, state.elapsedSeconds / config.durationSeconds);
  const lifetime = Math.max(0.55, config.targetLifetimeSeconds - progress * 0.45);
  const isTarget = kindRandom.value < config.targetChance;
  const target: TapTarget = {
    id: state.nextTargetId,
    kind: isTarget ? 'target' : 'decoy',
    token: isTarget
      ? config.targetToken
      : (config.decoyTokens[
          Math.min(
            config.decoyTokens.length - 1,
            Math.floor(tokenRandom.value * config.decoyTokens.length),
          )
        ] ?? 'cursor'),
    x: 120 + xRandom.value * 760,
    y: 150 + yRandom.value * 610,
    radius: Math.max(42, 66 - progress * 16),
    spawnedAtTick: state.tick,
    expiresAtTick: state.tick + Math.round(lifetime / FIXED_TIMESTEP_SECONDS),
  };
  return {
    ...state,
    randomState: tokenRandom.state,
    target,
    nextTargetId: state.nextTargetId + 1,
  };
}

export function createTapState(config: TapConfig): TapState {
  return {
    engine: 'tap-v1',
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
    hits: 0,
    misses: 0,
    combo: 0,
    bestCombo: 0,
    totalReactionTicks: 0,
    target: null,
    nextTargetId: 1,
    nextSpawnTick: 1,
  };
}

export function stepTapGame(
  previous: TapState,
  tap: { x: number; y: number } | null,
  config: TapConfig,
): TapState {
  if (previous.phase !== 'active') return previous;

  const tick = previous.tick + 1;
  const elapsedSeconds = tick * FIXED_TIMESTEP_SECONDS;
  let score = previous.score;
  let hits = previous.hits;
  let misses = previous.misses;
  let combo = previous.combo;
  let bestCombo = previous.bestCombo;
  let totalReactionTicks = previous.totalReactionTicks;
  let target = previous.target;
  let nextSpawnTick = previous.nextSpawnTick;
  let feedback = previous.feedbackTicks > 1 ? previous.feedback : null;
  let feedbackTicks = Math.max(0, previous.feedbackTicks - 1);

  if (tap) {
    const distance = target
      ? Math.hypot(tap.x - target.x, tap.y - target.y)
      : Number.POSITIVE_INFINITY;
    if (target && distance <= target.radius && target.kind === 'target') {
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      hits += 1;
      totalReactionTicks += tick - target.spawnedAtTick;
      score += config.pointsPerHit + Math.floor(combo / 3) * 10;
      feedback = 'good';
    } else {
      combo = 0;
      misses += 1;
      score = Math.max(0, score - config.missPenalty);
      feedback = 'bad';
    }
    feedbackTicks = 16;
    target = null;
    nextSpawnTick = tick + Math.round(config.spawnDelaySeconds / FIXED_TIMESTEP_SECONDS);
  } else if (target && tick >= target.expiresAtTick) {
    if (target.kind === 'target') {
      combo = 0;
      misses += 1;
      score = Math.max(0, score - config.missPenalty);
      feedback = 'bad';
      feedbackTicks = 16;
    }
    target = null;
    nextSpawnTick = tick + Math.round(config.spawnDelaySeconds / FIXED_TIMESTEP_SECONDS);
  }

  let state: TapState = {
    ...previous,
    tick,
    elapsedSeconds: Math.min(elapsedSeconds, config.durationSeconds),
    score,
    hits,
    misses,
    combo,
    bestCombo,
    totalReactionTicks,
    target,
    nextSpawnTick,
    feedback,
    feedbackTicks,
    phase: elapsedSeconds >= config.durationSeconds ? 'game-over' : 'active',
    endedReason: elapsedSeconds >= config.durationSeconds ? 'complete' : null,
  };
  if (state.phase === 'active' && !state.target && tick >= state.nextSpawnTick) {
    state = spawnTarget(state, config);
  }
  return state;
}
