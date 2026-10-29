import { useEffect, useRef, useState } from 'react';
import {
  WORLD_HEIGHT,
  WORLD_WIDTH,
  getTapTargetPosition,
  getDefenseThreatPosition,
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
  const pilotHostRef = useRef<HTMLDivElement>(null);
  const [pilot, setPilot] = useState<Awaited<
    ReturnType<typeof import('./laundry-pixi-pilot').createLaundryPilot>
  > | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (
      !(import.meta.env.DEV || import.meta.env.MODE === 'renderer-pilot') ||
      config.engine !== 'sort-v1' ||
      !new URLSearchParams(location.search).has('pixi')
    )
      return;
    const host = pilotHostRef.current;
    if (!host) return;
    let cancelled = false;
    let renderer: typeof pilot = null;
    void import('./laundry-pixi-pilot')
      .then(({ createLaundryPilot }) => createLaundryPilot(host, () => setPilot(null)))
      .then((created) => {
        renderer = created;
        if (cancelled) created.destroy();
        else setPilot(created);
      })
      .catch(() => setPilot(null));
    return () => {
      cancelled = true;
      renderer?.destroy();
    };
  }, [config.engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (pilot && config.engine === 'sort-v1' && state.engine === 'sort-v1') {
      pilot.render(config, state, reducedMotion);
      return;
    }
    const prepared = prepareHiDpiCanvas(canvas, WORLD_WIDTH, WORLD_HEIGHT);
    if (!prepared) {
      onUnsupported();
      return;
    }
    renderGameScene(prepared.context, config, state, reducedMotion);
  }, [config, onUnsupported, pilot, reducedMotion, state]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        data-engine={config.engine}
        data-renderer={
          import.meta.env.DEV ? (pilot ? 'pixi-laundry-pilot' : rendererIdFor(config)) : undefined
        }
        tabIndex={0}
        role="img"
        aria-label={`Interactive game field. ${config.controlHint}.`}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          let point = canvasPoint(event.currentTarget, event.clientX, event.clientY);
          const thumbRadius =
            (22 * WORLD_WIDTH) / event.currentTarget.getBoundingClientRect().width;
          if (state.engine === 'tap-v1' && state.target) {
            const target = getTapTargetPosition(state.target, state.tick);
            if (
              Math.hypot(point.x - target.x, point.y - target.y) <=
              Math.max(thumbRadius, state.target.radius)
            )
              point = target;
          } else if (state.engine === 'defense-v1') {
            const nearby = state.threats
              .map((threat) => ({
                position: getDefenseThreatPosition(threat, state.tick),
                radius: threat.radius + 18,
              }))
              .map((threat) => ({
                ...threat,
                distance: Math.hypot(point.x - threat.position.x, point.y - threat.position.y),
              }))
              .filter((threat) => threat.distance <= Math.max(thumbRadius, threat.radius))
              .sort((a, b) => a.distance - b.distance)[0];
            if (nearby) point = nearby.position;
          }
          pointerStartRef.current = point;
          if (config.engine === 'defense-v1') onAction({ engine: 'defense-v1', tap: point });
          else if (config.engine === 'tap-v1') onAction({ engine: 'tap-v1', tap: point });
          else if (config.engine === 'timing-v1')
            onAction({
              engine: 'timing-v1',
              stopAtSeconds: state.engine === 'timing-v1' ? state.timerSeconds : null,
            });
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
        onDoubleClick={(event) => event.preventDefault()}
        onContextMenu={(event) => event.preventDefault()}
      />
      {(import.meta.env.DEV || import.meta.env.MODE === 'renderer-pilot') && (
        <div
          ref={pilotHostRef}
          className="pixi-pilot-layer"
          style={{ visibility: pilot ? 'visible' : 'hidden' }}
        />
      )}
    </>
  );
}
