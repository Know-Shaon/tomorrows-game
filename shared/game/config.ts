import type {
  DailyGameConfig,
  GameEngineId,
  MessageChoice,
  MessageIcon,
  PaletteName,
  PosterTheme,
  SortSide,
  SortToken,
  TapToken,
} from './types';

const COMMON_KEYS = [
  'id',
  'engine',
  'title',
  'summary',
  'instruction',
  'controlHint',
  'interaction',
  'creator',
  'durationSeconds',
  'seed',
  'palette',
  'poster',
] as const;
const ENGINE_KEYS: Readonly<Record<GameEngineId, readonly string[]>> = {
  'defense-v1': [
    'spawnIntervalMin',
    'spawnIntervalMax',
    'approachSecondsMin',
    'approachSecondsMax',
    'maxHealth',
    'pointsPerShoo',
  ],
  'dodge-v1': [
    'laneCount',
    'laneSwitchSeconds',
    'reactionBufferSeconds',
    'waveIntervalStart',
    'waveIntervalEnd',
    'waveTravelStart',
    'waveTravelEnd',
    'metersPerSecond',
    'pointsPerAvoided',
    'coinPoints',
  ],
  'tap-v1': [
    'targetToken',
    'decoyTokens',
    'targetChance',
    'targetLifetimeSeconds',
    'spawnDelaySeconds',
    'pointsPerHit',
    'missPenalty',
  ],
  'classify-v1': [
    'cards',
    'decisionSeconds',
    'spawnDelaySeconds',
    'pointsPerCorrect',
    'missPenalty',
  ],
  'timing-v1': ['targetsSeconds', 'roundGraceSeconds'],
  'sequence-v1': [
    'minFloor',
    'maxFloor',
    'sequenceLength',
    'travelFloorsPerSecond',
    'speedRamp',
    'hitWindowFloors',
    'pointsPerHit',
  ],
  'sort-v1': [
    'leftLabel',
    'rightLabel',
    'items',
    'itemFallSeconds',
    'spawnDelaySeconds',
    'pointsPerSort',
    'missPenalty',
  ],
};

const ENGINES = new Set<GameEngineId>([
  'defense-v1',
  'dodge-v1',
  'tap-v1',
  'classify-v1',
  'timing-v1',
  'sequence-v1',
  'sort-v1',
]);
const PALETTES = new Set<PaletteName>(['cyan', 'coral', 'yellow', 'violet', 'green']);
const POSTERS = new Set<PosterTheme>([
  'samosa-pigeons',
  'mosquito-night',
  'microwave-timer',
  'laundry-piles',
  'pothole-street',
  'inbox-storm',
  'elevator-notes',
]);
const TAP_TOKENS = new Set<TapToken>(['mosquito', 'notification', 'coffee', 'cursor']);
const MESSAGE_ICONS = new Set<MessageIcon>([
  'calendar',
  'friend',
  'receipt',
  'prize',
  'robot',
  'newsletter',
]);
const MESSAGE_CHOICES = new Set<MessageChoice>(['keep', 'trash']);
const SORT_TOKENS = new Set<SortToken>([
  'white-sock',
  'yellow-shirt',
  'white-towel',
  'navy-sock',
  'red-shirt',
  'black-towel',
]);
const SORT_SIDES = new Set<SortSide>(['left', 'right']);
const SAFE_ID = /^[a-z0-9-]+$/;
const FORBIDDEN_TEXT = /[<>]|(?:https?:)?\/\//i;

export class InvalidGameConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGameConfigError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireSafeText(value: unknown, field: string, maximum: number): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.length > maximum ||
    FORBIDDEN_TEXT.test(value)
  ) {
    throw new InvalidGameConfigError(`${field} must be safe plain text.`);
  }
}

function requireNumber(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new InvalidGameConfigError(`${field} must be between ${minimum} and ${maximum}.`);
  }
}

function requireInteger(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): asserts value is number {
  requireNumber(value, field, minimum, maximum);
  if (!Number.isInteger(value)) throw new InvalidGameConfigError(`${field} must be an integer.`);
}

function validateCommon(value: Record<string, unknown>): GameEngineId {
  if (!ENGINES.has(value.engine as GameEngineId)) {
    throw new InvalidGameConfigError('engine is not allowlisted.');
  }
  const engine = value.engine as GameEngineId;
  const allowed = new Set<string>([...COMMON_KEYS, ...ENGINE_KEYS[engine]]);
  const unexpected = Object.keys(value).find((key) => !allowed.has(key));
  if (unexpected)
    throw new InvalidGameConfigError(`Unexpected configuration field: ${unexpected}.`);

  requireSafeText(value.id, 'id', 48);
  if (!SAFE_ID.test(value.id))
    throw new InvalidGameConfigError('id contains unsupported characters.');
  requireSafeText(value.title, 'title', 48);
  requireSafeText(value.summary, 'summary', 120);
  requireSafeText(value.instruction, 'instruction', 120);
  requireSafeText(value.controlHint, 'controlHint', 100);
  requireSafeText(value.interaction, 'interaction', 40);
  requireSafeText(value.creator, 'creator', 48);
  requireNumber(value.durationSeconds, 'durationSeconds', 20, 45);
  requireNumber(value.seed, 'seed', 1, 4_294_967_295);
  if (!PALETTES.has(value.palette as PaletteName)) {
    throw new InvalidGameConfigError('palette is not allowlisted.');
  }
  if (!POSTERS.has(value.poster as PosterTheme)) {
    throw new InvalidGameConfigError('poster is not allowlisted.');
  }
  return engine;
}

function validateDefense(value: Record<string, unknown>): void {
  requireNumber(value.spawnIntervalMin, 'spawnIntervalMin', 0.35, 1.5);
  requireNumber(value.spawnIntervalMax, 'spawnIntervalMax', 0.5, 2);
  requireNumber(value.approachSecondsMin, 'approachSecondsMin', 1.8, 5);
  requireNumber(value.approachSecondsMax, 'approachSecondsMax', 2.2, 6);
  if (value.spawnIntervalMin > value.spawnIntervalMax) {
    throw new InvalidGameConfigError('spawn intervals are reversed.');
  }
  if (value.approachSecondsMin > value.approachSecondsMax) {
    throw new InvalidGameConfigError('approach durations are reversed.');
  }
  requireInteger(value.maxHealth, 'maxHealth', 2, 5);
  requireNumber(value.pointsPerShoo, 'pointsPerShoo', 10, 200);
}

function validateDodge(value: Record<string, unknown>): void {
  if (value.laneCount !== 3) throw new InvalidGameConfigError('laneCount must be 3.');
  requireNumber(value.laneSwitchSeconds, 'laneSwitchSeconds', 0.18, 0.7);
  requireNumber(value.reactionBufferSeconds, 'reactionBufferSeconds', 0.15, 0.6);
  requireNumber(value.waveIntervalStart, 'waveIntervalStart', 0.7, 2);
  requireNumber(value.waveIntervalEnd, 'waveIntervalEnd', 0.6, 1.5);
  requireNumber(value.waveTravelStart, 'waveTravelStart', 1.2, 3);
  requireNumber(value.waveTravelEnd, 'waveTravelEnd', 1, 2.5);
  if (value.waveIntervalEnd < value.laneSwitchSeconds + value.reactionBufferSeconds) {
    throw new InvalidGameConfigError(
      'fastest wave interval must preserve a reachable lane change.',
    );
  }
  requireNumber(value.metersPerSecond, 'metersPerSecond', 8, 30);
  requireNumber(value.pointsPerAvoided, 'pointsPerAvoided', 10, 100);
  requireNumber(value.coinPoints, 'coinPoints', 20, 300);
}

function validateTap(value: Record<string, unknown>): void {
  if (value.targetToken !== 'mosquito') {
    throw new InvalidGameConfigError('tap target must be the allowlisted mosquito.');
  }
  if (
    !Array.isArray(value.decoyTokens) ||
    value.decoyTokens.length < 2 ||
    value.decoyTokens.length > 3 ||
    value.decoyTokens.some(
      (token) => !TAP_TOKENS.has(token as TapToken) || token === value.targetToken,
    )
  ) {
    throw new InvalidGameConfigError('tap decoy tokens must be allowlisted.');
  }
  requireNumber(value.targetChance, 'targetChance', 0.55, 0.9);
  requireNumber(value.targetLifetimeSeconds, 'targetLifetimeSeconds', 0.7, 2.5);
  requireNumber(value.spawnDelaySeconds, 'spawnDelaySeconds', 0.05, 0.8);
  requireNumber(value.pointsPerHit, 'pointsPerHit', 10, 500);
  requireNumber(value.missPenalty, 'missPenalty', 0, 200);
}

function validateClassify(value: Record<string, unknown>): void {
  if (!Array.isArray(value.cards) || value.cards.length < 5 || value.cards.length > 12) {
    throw new InvalidGameConfigError('cards must contain 5 to 12 allowlisted entries.');
  }
  for (const card of value.cards) {
    if (
      !isRecord(card) ||
      Object.keys(card).some(
        (key) => key !== 'sender' && key !== 'subject' && key !== 'icon' && key !== 'correctChoice',
      )
    ) {
      throw new InvalidGameConfigError('message card fields are not allowlisted.');
    }
    requireSafeText(card.sender, 'sender', 28);
    requireSafeText(card.subject, 'subject', 52);
    if (!MESSAGE_ICONS.has(card.icon as MessageIcon)) {
      throw new InvalidGameConfigError('message icon is not allowlisted.');
    }
    if (!MESSAGE_CHOICES.has(card.correctChoice as MessageChoice)) {
      throw new InvalidGameConfigError('message choice is not allowlisted.');
    }
  }
  requireNumber(value.decisionSeconds, 'decisionSeconds', 1.5, 5);
  requireNumber(value.spawnDelaySeconds, 'spawnDelaySeconds', 0.05, 0.8);
  requireNumber(value.pointsPerCorrect, 'pointsPerCorrect', 10, 500);
  requireNumber(value.missPenalty, 'missPenalty', 0, 200);
}

function validateTiming(value: Record<string, unknown>): void {
  if (
    !Array.isArray(value.targetsSeconds) ||
    value.targetsSeconds.length < 2 ||
    value.targetsSeconds.length > 5
  ) {
    throw new InvalidGameConfigError('targetsSeconds must contain 2 to 5 rounds.');
  }
  for (const target of value.targetsSeconds) {
    requireNumber(target, 'targetSeconds', 2, 10);
  }
  requireNumber(value.roundGraceSeconds, 'roundGraceSeconds', 0.5, 2);
}

function validateSequence(value: Record<string, unknown>): void {
  requireInteger(value.minFloor, 'minFloor', 1, 4);
  requireInteger(value.maxFloor, 'maxFloor', 6, 20);
  if (value.minFloor >= value.maxFloor) {
    throw new InvalidGameConfigError('elevator floor bounds are reversed.');
  }
  requireInteger(value.sequenceLength, 'sequenceLength', 5, 12);
  requireNumber(value.travelFloorsPerSecond, 'travelFloorsPerSecond', 1, 5);
  requireNumber(value.speedRamp, 'speedRamp', 0, 0.4);
  requireNumber(value.hitWindowFloors, 'hitWindowFloors', 0.18, 0.65);
  requireNumber(value.pointsPerHit, 'pointsPerHit', 50, 500);
}

function validateSort(value: Record<string, unknown>): void {
  requireSafeText(value.leftLabel, 'leftLabel', 24);
  requireSafeText(value.rightLabel, 'rightLabel', 24);
  if (!Array.isArray(value.items) || value.items.length < 4 || value.items.length > 12) {
    throw new InvalidGameConfigError('items must contain 4 to 12 allowlisted entries.');
  }
  for (const item of value.items) {
    if (
      !isRecord(item) ||
      Object.keys(item).some((key) => key !== 'token' && key !== 'correctSide')
    ) {
      throw new InvalidGameConfigError('sort item fields are not allowlisted.');
    }
    if (
      !SORT_TOKENS.has(item.token as SortToken) ||
      !SORT_SIDES.has(item.correctSide as SortSide)
    ) {
      throw new InvalidGameConfigError('sort item values are not allowlisted.');
    }
  }
  requireNumber(value.itemFallSeconds, 'itemFallSeconds', 1.5, 5);
  requireNumber(value.spawnDelaySeconds, 'spawnDelaySeconds', 0.05, 1);
  requireNumber(value.pointsPerSort, 'pointsPerSort', 10, 500);
  requireNumber(value.missPenalty, 'missPenalty', 0, 200);
}

export function validateGameConfig(value: unknown): DailyGameConfig {
  if (!isRecord(value)) throw new InvalidGameConfigError('Configuration must be an object.');
  const engine = validateCommon(value);
  if (engine === 'defense-v1') validateDefense(value);
  else if (engine === 'dodge-v1') validateDodge(value);
  else if (engine === 'tap-v1') validateTap(value);
  else if (engine === 'classify-v1') validateClassify(value);
  else if (engine === 'timing-v1') validateTiming(value);
  else if (engine === 'sequence-v1') validateSequence(value);
  else validateSort(value);
  return value as unknown as DailyGameConfig;
}
