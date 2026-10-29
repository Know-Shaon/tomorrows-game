import { nextSeededRandom } from './rng';
import { difficultyFromProgress } from './difficulty';
import type { DodgeConfig, DodgeState, GameInput, LaneIndex, LaneWave } from './types';

export const FIXED_TIMESTEP_SECONDS = 1 / 60;
export const WORLD_WIDTH = 1_000;
export const WORLD_HEIGHT = 1_000;

function lane(value: number): LaneIndex {
  return Math.max(0, Math.min(2, Math.round(value))) as LaneIndex;
}

export function canReachLane(
  fromLane: LaneIndex,
  toLane: LaneIndex,
  availableSeconds: number,
  config: DodgeConfig,
): boolean {
  const travelSeconds = Math.abs(toLane - fromLane) * config.laneSwitchSeconds;
  return travelSeconds + config.reactionBufferSeconds <= availableSeconds;
}

export interface GeneratedLaneWave {
  randomState: number;
  wave: LaneWave;
  nextWaveSeconds: number;
  decisionSeconds: number;
}

export function generateLaneWave(
  randomState: number,
  previousSafeLane: LaneIndex,
  waveIndex: number,
  config: DodgeConfig,
): GeneratedLaneWave {
  const difficulty = difficultyFromProgress(waveIndex / 26);
  const previousDifficulty = difficultyFromProgress(Math.max(0, waveIndex - 1) / 26);
  const interval =
    config.waveIntervalStart +
    (config.waveIntervalEnd - config.waveIntervalStart) * difficulty.intensity;
  const previousInterval =
    config.waveIntervalStart +
    (config.waveIntervalEnd - config.waveIntervalStart) * previousDifficulty.intensity;
  const travelSeconds =
    config.waveTravelStart + (config.waveTravelEnd - config.waveTravelStart) * difficulty.intensity;
  const previousTravelSeconds =
    config.waveTravelStart +
    (config.waveTravelEnd - config.waveTravelStart) * previousDifficulty.intensity;
  const decisionSeconds =
    waveIndex === 0
      ? travelSeconds * 0.9
      : previousInterval + (travelSeconds - previousTravelSeconds) * 0.9;
  const safeRandom = nextSeededRandom(randomState);
  const options = ([previousSafeLane - 1, previousSafeLane, previousSafeLane + 1] as number[])
    .filter((candidate) => candidate >= 0 && candidate < config.laneCount)
    .map(lane);
  let safeLane = options[Math.floor(safeRandom.value * options.length)] ?? previousSafeLane;
  if (!canReachLane(previousSafeLane, safeLane, decisionSeconds, config)) {
    safeLane = previousSafeLane;
  }

  const densityRandom = nextSeededRandom(safeRandom.state);
  const secondHazard =
    difficulty.phase !== 'learn' && densityRandom.value < 0.35 + difficulty.intensity * 0.5;
  const hazards: [boolean, boolean, boolean] = [false, false, false];
  const blocked = ([0, 1, 2] as const).filter((candidate) => candidate !== safeLane);
  const firstIndex = densityRandom.value < 0.5 ? 0 : 1;
  const firstBlocked = blocked[firstIndex];
  if (firstBlocked !== undefined) hazards[firstBlocked] = true;
  if (secondHazard) {
    const otherBlocked = blocked[1 - firstIndex];
    if (otherBlocked !== undefined) hazards[otherBlocked] = true;
  }

  const bonusRandom = nextSeededRandom(densityRandom.state);
  const bonusChoiceRandom = nextSeededRandom(bonusRandom.state);
  const openLanes = ([0, 1, 2] as const).filter((candidate) => !hazards[candidate]);
  const bonusLane =
    bonusRandom.value < 0.38
      ? (openLanes[Math.floor(bonusChoiceRandom.value * openLanes.length)] ?? null)
      : null;
  return {
    randomState: bonusChoiceRandom.state,
    wave: {
      id: waveIndex + 1,
      safeLane,
      hazards,
      bonusLane,
      progress: 0,
      travelSeconds,
      resolved: false,
    },
    nextWaveSeconds: interval,
    decisionSeconds,
  };
}

export function createInitialGameState(config: DodgeConfig): DodgeState {
  return {
    engine: 'dodge-v1',
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
    health: 3,
    playerLanePosition: 1,
    targetLane: 1,
    waves: [],
    nextWaveId: 0,
    nextWaveTick: 1,
    safeLane: 1,
    avoided: 0,
    coins: 0,
    distanceMeters: 0,
  };
}

export function stepGame(previous: DodgeState, input: GameInput, config: DodgeConfig): DodgeState {
  if (previous.phase !== 'active') return previous;

  const tick = previous.tick + 1;
  const elapsedSeconds = tick * FIXED_TIMESTEP_SECONDS;
  const requestedLane = input.directLane ?? lane(previous.targetLane + input.laneChange);
  const maxTravel = FIXED_TIMESTEP_SECONDS / config.laneSwitchSeconds;
  const laneDifference = requestedLane - previous.playerLanePosition;
  const playerLanePosition =
    Math.abs(laneDifference) <= maxTravel
      ? requestedLane
      : previous.playerLanePosition + Math.sign(laneDifference) * maxTravel;
  let health = previous.health;
  let avoided = previous.avoided;
  let coins = previous.coins;
  let feedback = previous.feedbackTicks > 1 ? previous.feedback : null;
  let feedbackTicks = Math.max(0, previous.feedbackTicks - 1);

  const waves = previous.waves
    .map((wave): LaneWave => {
      const progress = wave.progress + FIXED_TIMESTEP_SECONDS / wave.travelSeconds;
      if (!wave.resolved && progress >= 0.9) {
        const occupiedLane = lane(playerLanePosition);
        const centered = Math.abs(playerLanePosition - occupiedLane) < 0.34;
        if (centered && wave.hazards[occupiedLane]) {
          health -= 1;
          feedback = 'bad';
        } else {
          avoided += wave.hazards.filter(Boolean).length;
          if (centered && wave.bonusLane === occupiedLane) coins += 1;
          feedback = 'good';
        }
        feedbackTicks = 18;
        return { ...wave, progress, resolved: true };
      }
      return { ...wave, progress };
    })
    .filter((wave) => wave.progress < 1.14);

  let randomState = previous.randomState;
  let nextWaveId = previous.nextWaveId;
  let nextWaveTick = previous.nextWaveTick;
  let safeLane = previous.safeLane;
  if (tick >= nextWaveTick) {
    const generated = generateLaneWave(randomState, safeLane, nextWaveId, config);
    waves.push(generated.wave);
    randomState = generated.randomState;
    safeLane = generated.wave.safeLane;
    nextWaveId += 1;
    nextWaveTick = tick + Math.round(generated.nextWaveSeconds / FIXED_TIMESTEP_SECONDS);
  }

  const distanceMeters = Math.floor(elapsedSeconds * config.metersPerSecond);
  const score = distanceMeters + avoided * config.pointsPerAvoided + coins * config.coinPoints;
  const completed = elapsedSeconds >= config.durationSeconds;
  const collidedOut = health <= 0;
  return {
    ...previous,
    phase: completed || collidedOut ? 'game-over' : 'active',
    tick,
    elapsedSeconds: Math.min(elapsedSeconds, config.durationSeconds),
    score,
    feedback,
    feedbackTicks,
    endedReason: collidedOut ? 'collision' : completed ? 'complete' : null,
    health,
    playerLanePosition,
    targetLane: requestedLane,
    waves,
    randomState,
    nextWaveId,
    nextWaveTick,
    safeLane,
    avoided,
    coins,
    distanceMeters,
  };
}

export function runFixedSteps(
  state: DodgeState,
  inputs: readonly GameInput[],
  config: DodgeConfig,
): DodgeState {
  return inputs.reduce((current, input) => stepGame(current, input, config), state);
}
