import type { DailyGameConfig, DailyGameInput, DailyGameState } from '@shared/game';

interface EngineControlsProps {
  config: DailyGameConfig;
  state: DailyGameState;
  onAction: (input: DailyGameInput) => void;
  showHint?: boolean;
}

export function EngineControls({ config, state, onAction, showHint = true }: EngineControlsProps) {
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
        {showHint && <p>Tap a pigeon · Space</p>}
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
        {showHint && <p>Tap the mosquito · Space</p>}
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
          aria-label="Keep message, keyboard K"
          onClick={() => onAction({ engine: 'classify-v1', choice: 'keep' })}
        >
          <span aria-hidden="true">✓</span> KEEP <small>K</small>
        </button>
        <button
          className="bad-control"
          type="button"
          aria-label="Trash message, keyboard T"
          onClick={() => onAction({ engine: 'classify-v1', choice: 'trash' })}
        >
          <span aria-hidden="true">×</span> TRASH <small>T</small>
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
          onClick={() =>
            onAction({
              engine: 'timing-v1',
              stopAtSeconds: state.engine === 'timing-v1' ? state.timerSeconds : null,
            })
          }
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
        aria-label={`${config.leftLabel} basket, pale dot pattern, keyboard L`}
        onClick={() => onAction({ engine: 'sort-v1', choice: 'left' })}
      >
        <span aria-hidden="true">☀ •••</span> {config.leftLabel} <small>L</small>
      </button>
      <button
        className="dark-control"
        type="button"
        aria-label={`${config.rightLabel} basket, deep stripe pattern, keyboard D`}
        onClick={() => onAction({ engine: 'sort-v1', choice: 'right' })}
      >
        <span aria-hidden="true">☾ ///</span> {config.rightLabel} <small>D</small>
      </button>
    </div>
  );
}
