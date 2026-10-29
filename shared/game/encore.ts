import { validateGameConfig } from './config';
import type { DailyGameConfig } from './types';

export const ENCORE_NAMES = {
  'defense-v1': 'Hungry Hour',
  'dodge-v1': 'Rush Hour',
  'tap-v1': 'Lights Out',
  'classify-v1': 'Inbox Storm',
  'timing-v1': 'Blind Finish',
  'sequence-v1': 'Express',
  'sort-v1': 'Spin Cycle',
} as const;
export function isEncore(config: DailyGameConfig): boolean {
  return config.id.endsWith('-encore');
}

/** A configuration variation of the same engine, seed and fairness rules. */
export function createEncoreConfig(config: DailyGameConfig): DailyGameConfig {
  if (isEncore(config)) return config;
  const base = { ...config, id: `${config.id}-encore`, durationSeconds: 20 };
  switch (base.engine) {
    case 'defense-v1':
      return validateGameConfig({
        ...base,
        approachSecondsMin: base.approachSecondsMin * 0.9,
        approachSecondsMax: base.approachSecondsMax * 0.9,
      });
    case 'dodge-v1':
      return validateGameConfig({
        ...base,
        waveIntervalStart: base.waveIntervalStart * 0.88,
        waveIntervalEnd: Math.max(
          base.laneSwitchSeconds + base.reactionBufferSeconds,
          base.waveIntervalEnd * 0.88,
        ),
      });
    case 'classify-v1':
      return validateGameConfig({ ...base, decisionSeconds: base.decisionSeconds * 0.82 });
    case 'sequence-v1':
      return validateGameConfig({
        ...base,
        travelFloorsPerSecond: base.travelFloorsPerSecond * 1.15,
        sequenceLength: 8,
      });
    case 'sort-v1':
      return validateGameConfig({ ...base, itemFallSeconds: base.itemFallSeconds * 0.85 });
    // Lighting and clock concealment are presentation-only. Timing keeps enough time for all rounds.
    case 'timing-v1':
      return validateGameConfig({ ...base, durationSeconds: config.durationSeconds });
    default:
      return validateGameConfig(base);
  }
}

export function concealedTimer(
  config: DailyGameConfig,
  timer: number,
  target: number,
  waiting: number,
): boolean {
  return (
    isEncore(config) && config.engine === 'timing-v1' && waiting === 0 && timer >= target - 0.4
  );
}
