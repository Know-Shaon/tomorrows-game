import { describe, expect, it } from 'vitest';
import { difficultyFromProgress, gameDifficulty } from './difficulty';

describe('deterministic difficulty curve', () => {
  it('moves through learn, focus, and finale without linear jumps', () => {
    expect(difficultyFromProgress(0).phase).toBe('learn');
    expect(difficultyFromProgress(0.5).phase).toBe('focus');
    expect(difficultyFromProgress(0.9).phase).toBe('finale');
    expect(difficultyFromProgress(0.12).intensity).not.toBeCloseTo(0.12);
    expect(difficultyFromProgress(1).intensity).toBe(1);
  });

  it('clamps progress and derives it from session time', () => {
    expect(difficultyFromProgress(-1).progress).toBe(0);
    expect(difficultyFromProgress(4).progress).toBe(1);
    expect(gameDifficulty(15, 30).progress).toBe(0.5);
  });
});
