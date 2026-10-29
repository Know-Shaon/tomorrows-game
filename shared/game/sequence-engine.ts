import { FIXED_TIMESTEP_SECONDS } from './engine';
import { difficultyFromProgress } from './difficulty';
import { nextSeededRandom } from './rng';
import type { SequenceConfig, SequenceState } from './types';

function createRequests(config: SequenceConfig): { randomState: number; requests: number[] } {
  const requests: number[] = [];
  let randomState = config.seed;
  let previous = config.minFloor;
  for (let index = 0; index < config.sequenceLength; index += 1) {
    const distanceRandom = nextSeededRandom(randomState);
    const directionRandom = nextSeededRandom(distanceRandom.state);
    randomState = directionRandom.state;
    const distance = 2 + Math.floor(distanceRandom.value * 3);
    const requestedDirection = directionRandom.value < 0.5 ? -1 : 1;
    let floor = previous + requestedDirection * distance;
    if (floor < config.minFloor || floor > config.maxFloor) {
      floor = previous - requestedDirection * distance;
    }
    floor = Math.max(config.minFloor, Math.min(config.maxFloor, floor));
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
  const difficulty = difficultyFromProgress(
    previous.requestIndex / Math.max(1, previous.requests.length - 1),
  );
  const requestedFloor = previous.requests[previous.requestIndex];
  const direction: -1 | 1 =
    requestedFloor === undefined
      ? previous.direction
      : requestedFloor >= previous.currentFloor
        ? 1
        : -1;
  const speed = config.travelFloorsPerSecond + difficulty.intensity * config.speedRamp * 3;
  const currentFloor = previous.currentFloor + direction * speed * FIXED_TIMESTEP_SECONDS;
  const hitWindow = config.hitWindowFloors * (1.25 - difficulty.intensity * 0.35);

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
    if (requestedFloor === undefined) throw new Error('Missing generated elevator request.');
    const difference = Math.abs(currentFloor - requestedFloor);
    const accurate = difference <= hitWindow;
    lastFloorDifference = difference;
    if (accurate) {
      hits += 1;
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      const precision = 1 - difference / hitWindow;
      score += Math.round(config.pointsPerHit * (0.7 + precision * 0.3));
      feedback = 'good';
    } else {
      misses += 1;
      combo = 0;
      feedback = 'bad';
    }
    feedbackTicks = 22;
    if (accurate) requestIndex += 1;
  } else if (
    requestedFloor !== undefined &&
    (direction === 1
      ? currentFloor > requestedFloor + hitWindow
      : currentFloor < requestedFloor - hitWindow)
  ) {
    misses += 1;
    combo = 0;
    lastFloorDifference = Math.abs(currentFloor - requestedFloor);
    feedback = 'bad';
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
