import { describe, expect, it } from 'vitest';
import { formatCountdown, getDailyInfo } from './date';

describe('daily countdown', () => {
  it('calculates the next local day without a layout-time guess', () => {
    const now = new Date(2026, 8, 4, 23, 59, 30, 0);
    const info = getDailyInfo(now);

    expect(info.challengeNumber).toBe(247);
    expect(info.millisecondsRemaining).toBe(30_000);
    expect(info.nextGameAt.getDate()).toBe(5);
  });

  it('formats a stable digital countdown', () => {
    expect(formatCountdown(8 * 3_600_000 + 42 * 60_000 + 17_000)).toBe('08:42:17');
    expect(formatCountdown(-1)).toBe('00:00:00');
  });
});
