import { FIXED_TIMESTEP_SECONDS } from './engine';
import { gameDifficulty } from './difficulty';
import { nextSeededRandom } from './rng';
import type { DefenseConfig, DefenseState, DefenseThreat } from './types';

const CENTER_X = 500;
const CENTER_Y = 525;
const START_DISTANCE = 650;
const SAMOSA_DISTANCE = 100;

export function getDefenseThreatPosition(
  threat: DefenseThreat,
  tick: number,
): { x: number; y: number } {
  const wobble = threat.variant === 'wobble' ? Math.sin(tick * 0.11 + threat.id) * 24 : 0;
  return {
    x:
      CENTER_X +
      Math.cos(threat.angle) * threat.distance +
      Math.cos(threat.angle + Math.PI / 2) * wobble,
    y:
      CENTER_Y +
      Math.sin(threat.angle) * threat.distance +
      Math.sin(threat.angle + Math.PI / 2) * wobble,
  };
}

function spawnThreat(state: DefenseState, config: DefenseConfig): DefenseState {
  const angleRandom = nextSeededRandom(state.randomState);
  const speedRandom = nextSeededRandom(angleRandom.state);
  const variantRandom = nextSeededRandom(speedRandom.state);
  const delayRandom = nextSeededRandom(variantRandom.state);
  const difficulty = gameDifficulty(state.elapsedSeconds, config.durationSeconds);
  const speedRange = config.approachSecondsMax - config.approachSecondsMin;
  const approachSeconds =
    config.approachSecondsMax -
    speedRandom.value * speedRange * (0.25 + difficulty.intensity * 0.75);
  const variants = ['glide', 'dart', 'wobble'] as const;
  const availableVariants = difficulty.phase === 'learn' ? 1 : difficulty.phase === 'focus' ? 2 : 3;
  const threat: DefenseThreat = {
    id: state.nextThreatId,
    angle: state.nextThreatId === 1 ? -Math.PI / 2 : angleRandom.value * Math.PI * 2,
    distance: START_DISTANCE,
    approachRate: (START_DISTANCE - SAMOSA_DISTANCE) / approachSeconds,
    variant:
      variants[
        Math.min(availableVariants - 1, Math.floor(variantRandom.value * availableVariants))
      ] ?? 'glide',
    radius: difficulty.phase === 'finale' && variantRandom.value < 0.28 ? 42 : 50,
  };
  const interval =
    config.spawnIntervalMax +
    (config.spawnIntervalMin - config.spawnIntervalMax) * difficulty.intensity +
    delayRandom.value * 0.12;
  return {
    ...state,
    randomState: delayRandom.state,
    threats: [...state.threats, threat],
    nextThreatId: state.nextThreatId + 1,
    nextSpawnTick: state.tick + Math.round(interval / FIXED_TIMESTEP_SECONDS),
  };
}

export function createDefenseState(config: DefenseConfig): DefenseState {
  return {
    engine: 'defense-v1',
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
    health: config.maxHealth,
    shooed: 0,
    escaped: 0,
    threats: [],
    nextThreatId: 1,
    nextSpawnTick: Math.round(0.65 / FIXED_TIMESTEP_SECONDS),
  };
}

export function stepDefenseGame(
  previous: DefenseState,
  tap: { x: number; y: number } | null,
  config: DefenseConfig,
): DefenseState {
  if (previous.phase !== 'active') return previous;
  const tick = previous.tick + 1;
  const elapsedSeconds = tick * FIXED_TIMESTEP_SECONDS;
  let shooed = previous.shooed;
  let escaped = previous.escaped;
  let health = previous.health;
  let feedback = previous.feedbackTicks > 1 ? previous.feedback : null;
  let feedbackTicks = Math.max(0, previous.feedbackTicks - 1);
  let nextSpawnTick = previous.nextSpawnTick;
  let tappedId: number | null = null;

  if (tap) {
    let closest = Number.POSITIVE_INFINITY;
    for (const threat of previous.threats) {
      const position = getDefenseThreatPosition(threat, previous.tick);
      const distance = Math.hypot(tap.x - position.x, tap.y - position.y);
      if (distance <= threat.radius + 18 && distance < closest) {
        closest = distance;
        tappedId = threat.id;
      }
    }
    if (tappedId !== null) {
      shooed += 1;
      feedback = 'good';
      nextSpawnTick = Math.max(nextSpawnTick, tick + Math.round(0.24 / FIXED_TIMESTEP_SECONDS));
    } else {
      feedback = 'bad';
    }
    feedbackTicks = 14;
  }

  const threats: DefenseThreat[] = [];
  for (const threat of previous.threats) {
    if (threat.id === tappedId) continue;
    const multiplier = threat.variant === 'dart' ? 1.18 : 1;
    const moved = {
      ...threat,
      distance: threat.distance - threat.approachRate * multiplier * FIXED_TIMESTEP_SECONDS,
    };
    if (moved.distance <= SAMOSA_DISTANCE) {
      health -= 1;
      escaped += 1;
      feedback = 'bad';
      feedbackTicks = 20;
    } else {
      threats.push(moved);
    }
  }

  let state: DefenseState = {
    ...previous,
    tick,
    elapsedSeconds: Math.min(elapsedSeconds, config.durationSeconds),
    score: shooed * config.pointsPerShoo + Math.floor(elapsedSeconds * 5),
    feedback,
    feedbackTicks,
    health,
    shooed,
    escaped,
    threats,
    nextSpawnTick,
    phase: elapsedSeconds >= config.durationSeconds || health <= 0 ? 'game-over' : 'active',
    endedReason:
      health <= 0 ? 'collision' : elapsedSeconds >= config.durationSeconds ? 'complete' : null,
  };
  if (state.phase === 'active' && tick >= state.nextSpawnTick) {
    const difficulty = gameDifficulty(state.elapsedSeconds, config.durationSeconds);
    const maximumThreats = difficulty.phase === 'learn' ? 1 : difficulty.phase === 'focus' ? 2 : 3;
    state =
      state.threats.length < maximumThreats
        ? spawnThreat(state, config)
        : {
            ...state,
            nextSpawnTick: tick + Math.round(0.18 / FIXED_TIMESTEP_SECONDS),
          };
  }
  return state;
}
