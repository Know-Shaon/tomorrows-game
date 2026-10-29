import { cleanup, render, screen } from '@testing-library/react';
import { DAILY_CONFIGS, createDailyGameState } from '@shared/game';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EngineControls } from '@frontend/components/EngineControls';
import { rendererIdFor, renderGameScene } from '@frontend/components/game-renderers';
import { accessibleGameStatus, actionVerbFor } from './player-presentation';
import { GameCanvas } from '@frontend/components/GameCanvas';
import { fireEvent } from '@testing-library/react';
import { prepareHiDpiCanvas } from './canvas';
import { describeResult } from './game-result';

afterEach(cleanup);

describe('player-facing game contracts', () => {
  it('presents intrinsic garments without their destination, in speech or canvas text', () => {
    const config = DAILY_CONFIGS.find((c) => c.engine === 'sort-v1');
    if (!config) throw new Error('Missing laundry');
    const initial = createDailyGameState(config);
    if (initial.engine !== 'sort-v1') throw new Error('Wrong state');
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) throw new Error('Missing canvas');
    const fillText = vi.spyOn(ctx, 'fillText');
    for (const [index, item] of config.items.entries()) {
      const state = { ...initial, currentItemIndex: index };
      expect(accessibleGameStatus(config, state)).toBe(`${item.token.replaceAll('-', ' ')}.`);
      fillText.mockClear();
      renderGameScene(ctx, config, state, false);
      const labels = fillText.mock.calls.map(([text]) => text).join(' ');
      expect(labels).not.toMatch(/LIGHT|DARK|CATEGORY|CHOOSE/i);
    }
  });

  it('never paints a duplicate title, solution lane, or HIT NOW prompt', () => {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) throw new Error('Missing canvas');
    const fillText = vi.spyOn(ctx, 'fillText');
    for (const config of DAILY_CONFIGS) {
      const state = createDailyGameState(config);
      if (state.engine === 'sequence-v1') state.currentFloor = state.requests[0] ?? 5;
      fillText.mockClear();
      renderGameScene(ctx, config, state, false);
      const labels = fillText.mock.calls.map(([text]) => text).join(' ');
      expect(labels.toUpperCase()).not.toContain(config.title.toUpperCase());
      expect(labels).not.toMatch(/UPCOMING|HIT.*NOW|SAFE LANE|CORRECT CATEGORY/i);
      expect(accessibleGameStatus(config, state)).not.toMatch(
        /safe lane|choose|decoy|correct category/i,
      );
    }
    expect(DAILY_CONFIGS.map(actionVerbFor)).toEqual([
      'SHOO',
      'SWAT',
      'STOP',
      'SORT',
      'DODGE',
      'DECIDE',
      'HIT',
    ]);
  });

  it('dispatches an inside-scene basket tap without revealing its answer', () => {
    const config = DAILY_CONFIGS.find((c) => c.engine === 'sort-v1');
    if (!config) throw new Error('Missing laundry');
    const onAction = vi.fn();
    render(
      <GameCanvas
        config={config}
        state={createDailyGameState(config)}
        reducedMotion
        onAction={onAction}
        onUnsupported={vi.fn()}
      />,
    );
    const canvas = screen.getByRole('img');
    canvas.setPointerCapture = vi.fn();
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 420, pointerId: 1 });
    expect(onAction).toHaveBeenCalledWith({ engine: 'sort-v1', choice: 'left' });
  });

  it('maps every game to a unique renderer and human result explanation', () => {
    const renderers = DAILY_CONFIGS.map((config) => rendererIdFor(config));
    expect(new Set(renderers).size).toBe(7);
    for (const config of DAILY_CONFIGS) {
      const result = describeResult(createDailyGameState(config), 123);
      expect(result.headline.length).toBeGreaterThan(12);
      expect(result.verdict.length).toBeGreaterThan(3);
      expect(result.explanation.length).toBeGreaterThan(20);
      expect(result.personalBest).toBe('123');
      expect(result.metrics).toHaveLength(3);
    }
  });

  it('dispatches semantic controls and identifies Laundry without color alone', () => {
    const laundry = DAILY_CONFIGS.find((config) => config.engine === 'sort-v1');
    if (!laundry) throw new Error('Missing Laundry Logic config.');
    const onAction = vi.fn();
    render(
      <EngineControls config={laundry} state={createDailyGameState(laundry)} onAction={onAction} />,
    );
    expect(
      screen.getByRole('button', { name: /lights basket, pale dot pattern/i }),
    ).toHaveTextContent('•••');
    expect(
      screen.getByRole('button', { name: /darks basket, deep stripe pattern/i }),
    ).toHaveTextContent('///');
    screen.getByRole('button', { name: /lights basket/i }).click();
    expect(onAction).toHaveBeenCalledWith({ engine: 'sort-v1', choice: 'left' });
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
