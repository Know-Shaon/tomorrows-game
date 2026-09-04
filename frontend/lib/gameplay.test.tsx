import { cleanup, render, screen } from '@testing-library/react';
import { DAILY_CONFIGS, createDailyGameState } from '@shared/game';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EngineControls } from '@frontend/components/EngineControls';
import { rendererIdFor } from '@frontend/components/game-renderers';
import { prepareHiDpiCanvas } from './canvas';
import { describeResult } from './game-result';

afterEach(cleanup);

describe('player-facing game contracts', () => {
  it('maps every game to a unique renderer and human result explanation', () => {
    const renderers = DAILY_CONFIGS.map((config) => rendererIdFor(config));
    expect(new Set(renderers).size).toBe(7);
    for (const config of DAILY_CONFIGS) {
      const result = describeResult(createDailyGameState(config), 123);
      expect(result.headline.length).toBeGreaterThan(12);
      expect(result.metrics).toHaveLength(3);
    }
  });

  it('reserves left and right arrow controls for Pothole Patrol', () => {
    for (const config of DAILY_CONFIGS) {
      const { unmount } = render(
        <EngineControls config={config} state={createDailyGameState(config)} onAction={vi.fn()} />,
      );
      if (config.engine === 'dodge-v1') {
        expect(screen.getByRole('button', { name: 'Move left' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Move right' })).toBeInTheDocument();
      } else {
        expect(screen.queryByRole('button', { name: 'Move left' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Move right' })).not.toBeInTheDocument();
      }
      unmount();
    }
  });

  it('caps a high-DPI backing store while preserving DPR 1', () => {
    const canvas = document.createElement('canvas');
    const standard = prepareHiDpiCanvas(canvas, 1_000, 1_000, 1);
    expect(standard?.devicePixelRatio).toBe(1);
    expect(canvas.width).toBe(500);
    const highDpi = prepareHiDpiCanvas(canvas, 1_000, 1_000, 3);
    expect(highDpi?.devicePixelRatio).toBe(2);
    expect(canvas.width).toBe(1_000);
    expect(canvas.dataset.dpr).toBe('2');
  });
});
