import { FIXED_TIMESTEP_SECONDS } from './engine';
import { gameDifficulty } from './difficulty';
import { nextSeededRandom } from './rng';
import type { TapConfig, TapState, TapTarget } from './types';

function spawnTarget(state: TapState, config: TapConfig): TapState {
  const xRandom = nextSeededRandom(state.randomState);
  const yRandom = nextSeededRandom(xRandom.state);
  const kindRandom = nextSeededRandom(yRandom.state);
  const tokenRandom = nextSeededRandom(kindRandom.state);
  const motionRandom = nextSeededRandom(tokenRandom.state);
  const difficulty = gameDifficulty(state.elapsedSeconds, config.durationSeconds);
  const lifetime = config.targetLifetimeSeconds + 0.35 - difficulty.intensity * 0.5;
  const targetChance = 0.88 + (config.targetChance - 0.88) * difficulty.intensity;
  const isTarget = kindRandom.value < targetChance;
  const motionOptions =
    difficulty.phase === 'learn'
      ? (['hover'] as const)
      : difficulty.phase === 'focus'
        ? (['hover', 'zigzag'] as const)
        : (['hover', 'zigzag', 'orbit'] as const);
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
    x: 150 + xRandom.value * 700,
    y: 170 + yRandom.value * 500,
    radius: 70 - difficulty.intensity * 16,
    motion:
      motionOptions[Math.floor(motionRandom.value * motionOptions.length)] ?? motionOptions[0],
    motionAmplitude: 8 + difficulty.intensity * 34,
    motionRate: 0.045 + difficulty.intensity * 0.035,
    spawnedAtTick: state.tick,
    expiresAtTick: state.tick + Math.round(lifetime / FIXED_TIMESTEP_SECONDS),
  };
  return {
    ...state,
    randomState: motionRandom.state,
    target,
    nextTargetId: state.nextTargetId + 1,
  };
}

export function getTapTargetPosition(target: TapTarget, tick: number): { x: number; y: number } {
  const age = Math.max(0, tick - target.spawnedAtTick);
  const phase = age * target.motionRate + target.id * 0.73;
  const horizontal = Math.sin(phase) * target.motionAmplitude;
  const vertical =
    target.motion === 'orbit'
      ? Math.cos(phase) * target.motionAmplitude
      : target.motion === 'zigzag'
        ? Math.sin(phase * 2) * target.motionAmplitude * 0.48
        : Math.cos(phase * 0.7) * target.motionAmplitude * 0.28;
  return {
    x: Math.max(90, Math.min(910, target.x + horizontal)),
    y: Math.max(120, Math.min(700, target.y + vertical)),
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
    const position = target ? getTapTargetPosition(target, previous.tick) : null;
    const distance = position
      ? Math.hypot(tap.x - position.x, tap.y - position.y)
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
    const difficulty = gameDifficulty(elapsedSeconds, config.durationSeconds);
    const spawnDelay = config.spawnDelaySeconds + (1 - difficulty.intensity) * 0.14;
    nextSpawnTick = tick + Math.round(spawnDelay / FIXED_TIMESTEP_SECONDS);
  } else if (target && tick >= target.expiresAtTick) {
    if (target.kind === 'target') {
      combo = 0;
      misses += 1;
      score = Math.max(0, score - config.missPenalty);
      feedback = 'bad';
      feedbackTicks = 16;
    }
    target = null;
    const difficulty = gameDifficulty(elapsedSeconds, config.durationSeconds);
    const spawnDelay = config.spawnDelaySeconds + (1 - difficulty.intensity) * 0.14;
    nextSpawnTick = tick + Math.round(spawnDelay / FIXED_TIMESTEP_SECONDS);
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
