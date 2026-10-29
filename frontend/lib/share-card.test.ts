import { expect, it, vi } from 'vitest';
import { DAILY_CONFIGS, createDailyGameState } from '@shared/game';
import { drawShareCard, shareCardModel } from './share-card';
it('exports a fixed public result model and never paints solutions', () => {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  const text = vi.spyOn(ctx, 'fillText');
  for (const config of DAILY_CONFIGS) {
    const state = createDailyGameState(config);
    const model = shareCardModel(config, state, { day: 302, streak: 4, mode: 'daily' });
    expect(Object.keys(model).sort()).toEqual([
      'day',
      'grade',
      'medal',
      'mode',
      'performance',
      'streak',
      'title',
      'unit',
    ]);
    text.mockClear();
    drawShareCard(c, config, state, { day: 302, streak: 4, mode: 'daily', scale: 2 });
    expect(c.width).toBe(2400);
    expect(c.height).toBe(1260);
    const words = text.mock.calls.map((call) => call[0]).join(' ');
    expect(words).toContain('DAY 302');
    expect(words).not.toMatch(
      /safeLane|correctSide|correctChoice|seed|Mum|Dentist|LIGHTS|DARKS|TARGET/,
    );
  }
});
