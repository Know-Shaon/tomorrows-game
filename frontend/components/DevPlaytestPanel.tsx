import { useState } from 'react';
import { gameDifficulty, type DailyGameConfig, type DailyGameState } from '@shared/game';
import {
  loadPlaytestSummary,
  resetPlaytestData,
  type PlaytestGameSummary,
} from '@frontend/lib/playtest';
import './DevPlaytestPanel.css';

interface DevPlaytestPanelProps {
  actionCount: number;
  config: DailyGameConfig;
  state: DailyGameState;
}

function mistakes(state: DailyGameState): number {
  if (state.engine === 'defense-v1') return state.escaped;
  if (state.engine === 'dodge-v1') return 3 - state.health;
  if (state.engine === 'tap-v1') return state.misses;
  if (state.engine === 'classify-v1') return state.mistakes;
  if (state.engine === 'timing-v1')
    return state.roundResults.filter((result) => result.rating === 'miss').length;
  if (state.engine === 'sequence-v1') return state.misses;
  return state.mistakes;
}

function combo(state: DailyGameState): number {
  if (
    state.engine === 'tap-v1' ||
    state.engine === 'classify-v1' ||
    state.engine === 'sequence-v1' ||
    state.engine === 'sort-v1'
  ) {
    return state.combo;
  }
  return 0;
}

function tuning(config: DailyGameConfig, state: DailyGameState): string {
  if (config.engine === 'defense-v1')
    return `${state.engine === 'defense-v1' ? state.threats.length : 0} threats · ${config.spawnIntervalMin.toFixed(2)}–${config.spawnIntervalMax.toFixed(2)}s spawn`;
  if (config.engine === 'dodge-v1') {
    const upcoming =
      state.engine === 'dodge-v1' ? state.waves.find((wave) => !wave.resolved) : null;
    return `wave ${state.engine === 'dodge-v1' ? state.nextWaveId : 0} · safe lane ${upcoming ? upcoming.safeLane + 1 : '—'}`;
  }
  if (config.engine === 'tap-v1')
    return `${config.targetLifetimeSeconds.toFixed(2)}s base life · radius ${state.engine === 'tap-v1' ? Math.round(state.target?.radius ?? 0) : 0}`;
  if (config.engine === 'classify-v1')
    return `card ${state.engine === 'classify-v1' ? state.cardNumber : 0} · ${config.decisionSeconds.toFixed(1)}s base`;
  if (config.engine === 'timing-v1')
    return `offset ${state.engine === 'timing-v1' ? (state.lastOffsetMilliseconds ?? '—') : '—'} ms`;
  if (config.engine === 'sequence-v1')
    return `floor ${state.engine === 'sequence-v1' ? state.currentFloor.toFixed(2) : '—'} · ${config.hitWindowFloors.toFixed(2)} window`;
  return `item ${state.engine === 'sort-v1' ? (state.currentItemIndex ?? '—') : '—'} · ${config.itemFallSeconds.toFixed(1)}s base fall`;
}

export function DevPlaytestPanel({ actionCount, config, state }: DevPlaytestPanelProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<PlaytestGameSummary>(() =>
    loadPlaytestSummary(window.localStorage, config.id),
  );
  const difficulty = gameDifficulty(state.elapsedSeconds, config.durationSeconds);

  return (
    <aside className="dev-playtest" aria-label="Development playtest panel">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setSummary(loadPlaytestSummary(window.localStorage, config.id));
          setOpen((current) => !current);
        }}
      >
        {open ? 'Hide tuning' : 'Show tuning'}
      </button>
      {open ? (
        <div className="dev-playtest-grid">
          <span>
            {config.id} · {config.engine}
          </span>
          <span>
            {state.elapsedSeconds.toFixed(1)}s · {difficulty.phase}{' '}
            {Math.round(difficulty.intensity * 100)}%
          </span>
          <span>
            score {state.score} · combo {combo(state)} · mistakes {mistakes(state)} · actions{' '}
            {actionCount}
          </span>
          <span>
            seed {state.seed} · {tuning(config, state)}
          </span>
          <span>
            runs {summary.runsCompleted}/{summary.runsStarted} · retries {summary.retries} · avg{' '}
            {summary.runsCompleted ? Math.round(summary.totalScore / summary.runsCompleted) : 0} ·
            best {summary.bestScore}
          </span>
          <span>
            First complete {summary.runsCompleted > 0 ? 'yes' : 'no'} · session runs{' '}
            {summary.runsThisSession} · Encore {summary.encoreCompleted}/{summary.encoreStarted}
          </span>
          <span>
            S/A/B/C {summary.gradeS}/{summary.gradeA}/{summary.gradeB}/{summary.gradeC} · Perfect{' '}
            {summary.perfects} · PB improvements {summary.pbImprovements}
          </span>
          <span>
            Result → Retry{' '}
            {summary.retryDelaySamples
              ? Math.round(summary.retryDelayTotalMs / summary.retryDelaySamples)
              : '—'}{' '}
            ms average
          </span>
          <button
            type="button"
            onClick={() => {
              resetPlaytestData(window.localStorage);
              setSummary(loadPlaytestSummary(window.localStorage, config.id));
            }}
          >
            Reset playtest data
          </button>
        </div>
      ) : null}
    </aside>
  );
}
