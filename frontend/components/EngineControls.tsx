import type { DailyGameConfig, DailyGameInput, DailyGameState } from '@shared/game';

interface EngineControlsProps {
  config: DailyGameConfig;
  state: DailyGameState;
  onAction: (input: DailyGameInput) => void;
}

export function EngineControls({ config, state, onAction }: EngineControlsProps) {
  if (config.engine === 'dodge-v1') {
    return (
      <div
        className="touch-controls controls-dodge-v1"
        data-control="lane"
        aria-label="Lane controls"
      >
        <button
          type="button"
          aria-label="Move left"
          onClick={() => onAction({ engine: 'dodge-v1', laneChange: -1, directLane: null })}
        >
          ← LANE
        </button>
        <button
          type="button"
          aria-label="Move right"
          onClick={() => onAction({ engine: 'dodge-v1', laneChange: 1, directLane: null })}
        >
          LANE →
        </button>
      </div>
    );
  }
  if (config.engine === 'defense-v1') {
    return (
      <div
        className="touch-controls direct-control"
        data-control="tap-defense"
        aria-label="Defense controls"
      >
        <p>Tap pigeons on the rooftop · Space shoos the nearest</p>
      </div>
    );
  }
  if (config.engine === 'tap-v1') {
    return (
      <div
        className="touch-controls direct-control"
        data-control="tap-target"
        aria-label="Target controls"
      >
        <p>Tap mosquitoes directly · Leave desk objects alone</p>
      </div>
    );
  }
  if (config.engine === 'classify-v1') {
    return (
      <div
        className="touch-controls decision-controls"
        data-control="classify"
        aria-label="Message controls"
      >
        <button
          className="good-control"
          type="button"
          onClick={() => onAction({ engine: 'classify-v1', choice: 'keep' })}
        >
          KEEP <small>K</small>
        </button>
        <button
          className="bad-control"
          type="button"
          onClick={() => onAction({ engine: 'classify-v1', choice: 'trash' })}
        >
          TRASH <small>T</small>
        </button>
      </div>
    );
  }
  if (config.engine === 'timing-v1') {
    return (
      <div
        className="touch-controls single-control"
        data-control="precision-stop"
        aria-label="Timer control"
      >
        <button
          className="stop-button"
          type="button"
          onClick={() => onAction({ engine: 'timing-v1', stop: true })}
        >
          STOP <small>SPACE</small>
        </button>
      </div>
    );
  }
  if (config.engine === 'sequence-v1') {
    const floor = state.engine === 'sequence-v1' ? state.requests[state.requestIndex] : undefined;
    return (
      <div
        className="touch-controls single-control"
        data-control="sequence-hit"
        aria-label="Elevator control"
      >
        <button
          className="hit-button"
          type="button"
          onClick={() => onAction({ engine: 'sequence-v1', hit: true })}
        >
          HIT FLOOR {floor ?? '—'} <small>SPACE</small>
        </button>
      </div>
    );
  }
  return (
    <div
      className="touch-controls decision-controls"
      data-control="sort"
      aria-label="Laundry controls"
    >
      <button
        className="light-control"
        type="button"
        onClick={() => onAction({ engine: 'sort-v1', choice: 'left' })}
      >
        {config.leftLabel} <small>L</small>
      </button>
      <button
        className="dark-control"
        type="button"
        onClick={() => onAction({ engine: 'sort-v1', choice: 'right' })}
      >
        {config.rightLabel} <small>D</small>
      </button>
    </div>
  );
}
