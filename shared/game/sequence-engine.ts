import { FIXED_TIMESTEP_SECONDS } from './engine';
import { nextSeededRandom } from './rng';
import type { SequenceConfig, SequenceState } from './types';

function createRequests(config: SequenceConfig): { randomState: number; requests: number[] } {
  const requests: number[] = [];
  let randomState = config.seed;
  let previous = config.minFloor;
  for (let index = 0; index < config.sequenceLength; index += 1) {
    const random = nextSeededRandom(randomState);
    randomState = random.state;
    const span = config.maxFloor - config.minFloor + 1;
    let floor = config.minFloor + Math.min(span - 1, Math.floor(random.value * span));
    if (floor === previous) floor = floor === config.maxFloor ? floor - 1 : floor + 1;
    requests.push(floor);
    previous = floor;
  }
  return { randomState, requests };
}

export function createSequenceState(config: SequenceConfig): SequenceState {
  const generated = createRequests(config);
  return {
    engine: 'sequence-v1',
    configId: config.id,
    phase: 'active',
    seed: config.seed,
    randomState: generated.randomState,
    tick: 0,
    elapsedSeconds: 0,
    score: 0,
    feedback: null,
    feedbackTicks: 0,
    endedReason: null,
    currentFloor: config.minFloor,
    direction: 1,
    requests: generated.requests,
    requestIndex: 0,
    hits: 0,
    misses: 0,
    combo: 0,
    bestCombo: 0,
    lastFloorDifference: null,
  };
}

export function stepSequenceGame(
  previous: SequenceState,
  hit: boolean,
  config: SequenceConfig,
): SequenceState {
  if (previous.phase !== 'active') return previous;
  const tick = previous.tick + 1;
  const elapsedSeconds = tick * FIXED_TIMESTEP_SECONDS;
  const speed = config.travelFloorsPerSecond + previous.requestIndex * config.speedRamp;
  let currentFloor = previous.currentFloor + previous.direction * speed * FIXED_TIMESTEP_SECONDS;
  let direction = previous.direction;
  if (currentFloor >= config.maxFloor) {
    currentFloor = config.maxFloor - (currentFloor - config.maxFloor);
    direction = -1;
  } else if (currentFloor <= config.minFloor) {
    currentFloor = config.minFloor + (config.minFloor - currentFloor);
    direction = 1;
  }

  let requestIndex = previous.requestIndex;
  let hits = previous.hits;
  let misses = previous.misses;
  let combo = previous.combo;
  let bestCombo = previous.bestCombo;
  let score = previous.score;
  let lastFloorDifference = previous.lastFloorDifference;
  let feedback = previous.feedbackTicks > 1 ? previous.feedback : null;
  let feedbackTicks = Math.max(0, previous.feedbackTicks - 1);

  if (hit && requestIndex < previous.requests.length) {
    const requestedFloor = previous.requests[requestIndex];
    if (requestedFloor === undefined) throw new Error('Missing generated elevator request.');
    const difference = Math.abs(currentFloor - requestedFloor);
    const accurate = difference <= config.hitWindowFloors;
    lastFloorDifference = difference;
    if (accurate) {
      hits += 1;
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      const precision = 1 - difference / config.hitWindowFloors;
      score += Math.round(config.pointsPerHit * (0.7 + precision * 0.3));
      feedback = 'good';
    } else {
      misses += 1;
      combo = 0;
      feedback = 'bad';
    }
    feedbackTicks = 22;
    requestIndex += 1;
  }

  const completed =
    requestIndex >= previous.requests.length || elapsedSeconds >= config.durationSeconds;
  return {
    ...previous,
    phase: completed ? 'game-over' : 'active',
    tick,
    elapsedSeconds: Math.min(elapsedSeconds, config.durationSeconds),
    score,
    feedback,
    feedbackTicks,
    endedReason: completed ? 'complete' : null,
    currentFloor,
    direction,
    requestIndex,
    hits,
    misses,
    combo,
    bestCombo,
    lastFloorDifference,
  };
}
