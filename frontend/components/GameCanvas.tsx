import { useEffect, useRef } from 'react';
import {
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type DailyGameConfig,
  type DailyGameInput,
  type DailyGameState,
  type LaneIndex,
} from '@shared/game';
import { prepareHiDpiCanvas } from '@frontend/lib/canvas';
import { rendererIdFor, renderGameScene } from './game-renderers';

interface GameCanvasProps {
  config: DailyGameConfig;
  state: DailyGameState;
  reducedMotion: boolean;
  onAction: (input: DailyGameInput) => void;
  onUnsupported: () => void;
}

function canvasPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: ((clientX - bounds.left) / bounds.width) * WORLD_WIDTH,
    y: ((clientY - bounds.top) / bounds.height) * WORLD_HEIGHT,
  };
}

function laneFromX(x: number): LaneIndex {
  return Math.max(0, Math.min(2, Math.floor(x / (WORLD_WIDTH / 3)))) as LaneIndex;
}

export function GameCanvas({
  config,
  state,
  reducedMotion,
  onAction,
  onUnsupported,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prepared = prepareHiDpiCanvas(canvas, WORLD_WIDTH, WORLD_HEIGHT);
    if (!prepared) {
      onUnsupported();
      return;
    }
    canvas.dataset.renderer = renderGameScene(prepared.context, config, state, reducedMotion);
  }, [config, onUnsupported, reducedMotion, state]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      data-engine={config.engine}
      data-renderer={rendererIdFor(config)}
      tabIndex={0}
      role="img"
      aria-label={`${config.title} game field. ${config.controlHint}.`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        const point = canvasPoint(event.currentTarget, event.clientX, event.clientY);
        pointerStartRef.current = point;
        if (config.engine === 'defense-v1') onAction({ engine: 'defense-v1', tap: point });
        else if (config.engine === 'tap-v1') onAction({ engine: 'tap-v1', tap: point });
        else if (config.engine === 'timing-v1') onAction({ engine: 'timing-v1', stop: true });
        else if (config.engine === 'sequence-v1') onAction({ engine: 'sequence-v1', hit: true });
        else if (config.engine === 'classify-v1' && point.y > 690)
          onAction({ engine: 'classify-v1', choice: point.x < 500 ? 'keep' : 'trash' });
        else if (config.engine === 'sort-v1' && point.y > 650)
          onAction({ engine: 'sort-v1', choice: point.x < 500 ? 'left' : 'right' });
      }}
      onPointerUp={(event) => {
        if (config.engine !== 'dodge-v1') return;
        const end = canvasPoint(event.currentTarget, event.clientX, event.clientY);
        const start = pointerStartRef.current ?? end;
        const delta = end.x - start.x;
        if (Math.abs(delta) >= 45) {
          onAction({
            engine: 'dodge-v1',
            laneChange: delta < 0 ? -1 : 1,
            directLane: null,
          });
        } else {
          onAction({ engine: 'dodge-v1', laneChange: 0, directLane: laneFromX(end.x) });
        }
        pointerStartRef.current = null;
      }}
      onPointerCancel={() => {
        pointerStartRef.current = null;
      }}
    />
  );
}
