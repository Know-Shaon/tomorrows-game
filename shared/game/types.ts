export const GAME_PHASES = [
  'loading',
  'instructions',
  'countdown',
  'active',
  'paused',
  'game-over',
  'result',
  'error',
  'unsupported',
] as const;

export type GamePhase = (typeof GAME_PHASES)[number];
export type SimulationPhase = 'active' | 'game-over';
export type GameEngineId =
  'defense-v1' | 'dodge-v1' | 'tap-v1' | 'classify-v1' | 'timing-v1' | 'sequence-v1' | 'sort-v1';
export type PaletteName = 'cyan' | 'coral' | 'yellow' | 'violet' | 'green';
export type PosterTheme =
  | 'samosa-pigeons'
  | 'mosquito-night'
  | 'microwave-timer'
  | 'laundry-piles'
  | 'pothole-street'
  | 'inbox-storm'
  | 'elevator-notes';

interface BaseDailyGameConfig {
  id: string;
  engine: GameEngineId;
  title: string;
  summary: string;
  instruction: string;
  controlHint: string;
  interaction: string;
  creator: string;
  durationSeconds: number;
  seed: number;
  palette: PaletteName;
  poster: PosterTheme;
}

export interface DefenseConfig extends BaseDailyGameConfig {
  engine: 'defense-v1';
  spawnIntervalMin: number;
  spawnIntervalMax: number;
  approachSecondsMin: number;
  approachSecondsMax: number;
  maxHealth: number;
  pointsPerShoo: number;
}

export type DefenseThreatVariant = 'glide' | 'dart' | 'wobble';

export interface DefenseThreat {
  id: number;
  angle: number;
  distance: number;
  approachRate: number;
  variant: DefenseThreatVariant;
  radius: number;
}

export type LaneIndex = 0 | 1 | 2;

export interface DodgeConfig extends BaseDailyGameConfig {
  engine: 'dodge-v1';
  laneCount: 3;
  laneSwitchSeconds: number;
  reactionBufferSeconds: number;
  waveIntervalStart: number;
  waveIntervalEnd: number;
  waveTravelStart: number;
  waveTravelEnd: number;
  metersPerSecond: number;
  pointsPerAvoided: number;
  coinPoints: number;
}

export interface LaneWave {
  id: number;
  safeLane: LaneIndex;
  hazards: readonly [boolean, boolean, boolean];
  bonusLane: LaneIndex | null;
  progress: number;
  travelSeconds: number;
  resolved: boolean;
}

export type TapToken = 'mosquito' | 'notification' | 'coffee' | 'cursor';

export interface TapConfig extends BaseDailyGameConfig {
  engine: 'tap-v1';
  targetToken: 'mosquito';
  decoyTokens: readonly Exclude<TapToken, 'mosquito'>[];
  targetChance: number;
  targetLifetimeSeconds: number;
  spawnDelaySeconds: number;
  pointsPerHit: number;
  missPenalty: number;
}

export interface TapTarget {
  id: number;
  kind: 'target' | 'decoy';
  token: TapToken;
  x: number;
  y: number;
  radius: number;
  spawnedAtTick: number;
  expiresAtTick: number;
}

export type MessageChoice = 'keep' | 'trash';
export type MessageIcon = 'calendar' | 'friend' | 'receipt' | 'prize' | 'robot' | 'newsletter';

export interface MessageDefinition {
  sender: string;
  subject: string;
  icon: MessageIcon;
  correctChoice: MessageChoice;
}

export interface ClassifyConfig extends BaseDailyGameConfig {
  engine: 'classify-v1';
  cards: readonly MessageDefinition[];
  decisionSeconds: number;
  spawnDelaySeconds: number;
  pointsPerCorrect: number;
  missPenalty: number;
}

export interface TimingConfig extends BaseDailyGameConfig {
  engine: 'timing-v1';
  targetsSeconds: readonly number[];
  roundGraceSeconds: number;
}

export type TimingRating = 'perfect' | 'great' | 'ok' | 'miss';

export interface SequenceConfig extends BaseDailyGameConfig {
  engine: 'sequence-v1';
  minFloor: number;
  maxFloor: number;
  sequenceLength: number;
  travelFloorsPerSecond: number;
  speedRamp: number;
  hitWindowFloors: number;
  pointsPerHit: number;
}

export type SortSide = 'left' | 'right';
export type SortToken =
  'white-sock' | 'yellow-shirt' | 'white-towel' | 'navy-sock' | 'red-shirt' | 'black-towel';

export interface SortItemDefinition {
  token: SortToken;
  correctSide: SortSide;
}

export interface SortConfig extends BaseDailyGameConfig {
  engine: 'sort-v1';
  leftLabel: string;
  rightLabel: string;
  items: readonly SortItemDefinition[];
  itemFallSeconds: number;
  spawnDelaySeconds: number;
  pointsPerSort: number;
  missPenalty: number;
}

export type DailyGameConfig =
  | DefenseConfig
  | DodgeConfig
  | TapConfig
  | ClassifyConfig
  | TimingConfig
  | SequenceConfig
  | SortConfig;

interface BaseSimulationState {
  engine: GameEngineId;
  configId: string;
  phase: SimulationPhase;
  seed: number;
  randomState: number;
  tick: number;
  elapsedSeconds: number;
  score: number;
  feedback: 'good' | 'bad' | null;
  feedbackTicks: number;
  endedReason: 'complete' | 'collision' | null;
}

export interface DefenseState extends BaseSimulationState {
  engine: 'defense-v1';
  health: number;
  shooed: number;
  escaped: number;
  threats: DefenseThreat[];
  nextThreatId: number;
  nextSpawnTick: number;
}

export interface GameInput {
  laneChange: -1 | 0 | 1;
  directLane: LaneIndex | null;
}

export interface DodgeState extends BaseSimulationState {
  engine: 'dodge-v1';
  health: number;
  playerLanePosition: number;
  targetLane: LaneIndex;
  waves: LaneWave[];
  nextWaveId: number;
  nextWaveTick: number;
  safeLane: LaneIndex;
  avoided: number;
  coins: number;
  distanceMeters: number;
}

export type GameState = DodgeState;

export interface TapState extends BaseSimulationState {
  engine: 'tap-v1';
  hits: number;
  misses: number;
  combo: number;
  bestCombo: number;
  totalReactionTicks: number;
  target: TapTarget | null;
  nextTargetId: number;
  nextSpawnTick: number;
}

export interface ClassifyState extends BaseSimulationState {
  engine: 'classify-v1';
  currentCardIndex: number | null;
  cardNumber: number;
  cardExpiresAtTick: number;
  nextCardTick: number;
  correct: number;
  mistakes: number;
  combo: number;
  bestCombo: number;
  lastChoice: MessageChoice | null;
}

export interface TimingState extends BaseSimulationState {
  engine: 'timing-v1';
  round: number;
  timerSeconds: number;
  targetSeconds: number;
  lastOffsetMilliseconds: number | null;
  lastRating: TimingRating | null;
  waitingTicks: number;
}

export interface SequenceState extends BaseSimulationState {
  engine: 'sequence-v1';
  currentFloor: number;
  direction: -1 | 1;
  requests: readonly number[];
  requestIndex: number;
  hits: number;
  misses: number;
  combo: number;
  bestCombo: number;
  lastFloorDifference: number | null;
}

export interface SortState extends BaseSimulationState {
  engine: 'sort-v1';
  correct: number;
  mistakes: number;
  combo: number;
  bestCombo: number;
  currentItemIndex: number | null;
  itemProgress: number;
  nextSpawnTick: number;
}

export type DailyGameState =
  DefenseState | DodgeState | TapState | ClassifyState | TimingState | SequenceState | SortState;

export type DailyGameInput =
  | { engine: 'defense-v1'; tap: { x: number; y: number } | null }
  | { engine: 'dodge-v1'; laneChange: -1 | 0 | 1; directLane: LaneIndex | null }
  | { engine: 'tap-v1'; tap: { x: number; y: number } | null }
  | { engine: 'classify-v1'; choice: MessageChoice | null }
  | { engine: 'timing-v1'; stop: boolean }
  | { engine: 'sequence-v1'; hit: boolean }
  | { engine: 'sort-v1'; choice: SortSide | null };
