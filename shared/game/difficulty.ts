export type DifficultyPhase = 'learn' | 'focus' | 'finale';

export interface DifficultySnapshot {
  intensity: number;
  phase: DifficultyPhase;
  progress: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
}

export function difficultyFromProgress(value: number): DifficultySnapshot {
  const progress = clamp01(value);
  if (progress < 0.24) {
    return {
      progress,
      phase: 'learn',
      intensity: 0.18 * smoothstep(progress / 0.24),
    };
  }
  if (progress < 0.72) {
    return {
      progress,
      phase: 'focus',
      intensity: 0.18 + 0.52 * smoothstep((progress - 0.24) / 0.48),
    };
  }
  return {
    progress,
    phase: 'finale',
    intensity: 0.7 + 0.3 * smoothstep((progress - 0.72) / 0.28),
  };
}

export function gameDifficulty(
  elapsedSeconds: number,
  durationSeconds: number,
): DifficultySnapshot {
  return difficultyFromProgress(elapsedSeconds / Math.max(1, durationSeconds));
}
