import type { DailyGameConfig, DailyGameState } from '@shared/game';
import {
  assessMastery,
  comparePersonalBest,
  MEDAL_ORDER,
  type RunMode,
} from '@shared/game/mastery';
import { ENCORE_NAMES } from '@shared/game/encore';
import { describeResult } from '@frontend/lib/game-result';
import { GameIcon } from './GameIcon';

interface Props {
  config: DailyGameConfig;
  game: DailyGameState;
  best: number | null;
  mode: RunMode;
  unlocked: boolean;
  day: number;
  onRetry: () => void;
  onEncore: () => void;
  onDaily: () => void;
  onShare: () => void;
  onSave: () => void;
  onExit: (target?: 'vote') => void;
}

export function RunResult({
  config,
  game,
  best,
  mode,
  unlocked,
  day,
  onRetry,
  onEncore,
  onDaily,
  onShare,
  onSave,
  onExit,
}: Props) {
  const mastery = assessMastery(config, game);
  const pb = comparePersonalBest(mastery.performance, best, mastery.lowerIsBetter);
  const result = describeResult(game, game.score);
  return (
    <section
      className={`result-card signature-result${pb.isNewBest ? ' new-best' : ''}`}
      aria-labelledby="result-title"
    >
      <p className="eyebrow">
        <span className="result-icon">
          <GameIcon engine={config.engine} />
        </span>{' '}
        #{day} · {config.title}
        {mode === 'encore' ? ' · ENCORE' : ''}
      </p>
      <p className="result-grade" data-grade={mastery.grade} aria-label={`Grade ${mastery.grade}`}>
        {mastery.grade}
        <span>RANK</span>
      </p>
      <h2 className="result-explanation sr-only" id="result-title">
        {result.headline}
      </h2>
      <p className="score-kicker">{mastery.lowerIsBetter ? 'AVERAGE ERROR' : 'SCORE'}</p>
      <p className="result-score">
        {mastery.performance.toLocaleString()}
        {mastery.lowerIsBetter && <small> ms</small>}
      </p>
      <p className="result-verdict">{result.headline}</p>
      <div className="personal-best-result" data-new-best={pb.isNewBest ? 'true' : 'false'}>
        <span>{pb.isNewBest ? '★ NEW PERSONAL BEST' : 'PERSONAL BEST'}</span>
        <strong>
          {pb.best.toLocaleString()}
          {mastery.lowerIsBetter ? ' ms' : ''}
        </strong>
      </div>
      <p className="chase-message">
        {best !== null && !pb.isNewBest
          ? pb.message
          : mastery.grade === 'S'
            ? 'A run to keep.'
            : mastery.target}
      </p>
      <ol className="medal-strip" aria-label="Run mastery medals">
        {(['clear', 'great', 'perfect'] as const).map((medal) => (
          <li
            key={medal}
            data-earned={MEDAL_ORDER.indexOf(mastery.medal) >= MEDAL_ORDER.indexOf(medal)}
          >
            <span aria-hidden="true">
              {MEDAL_ORDER.indexOf(mastery.medal) >= MEDAL_ORDER.indexOf(medal) ? '◆' : '◇'}
            </span>{' '}
            {medal}
          </li>
        ))}
      </ol>
      <div className="result-actions">
        <button className="play-button retry-button" type="button" onClick={onRetry} autoFocus>
          Retry <span aria-hidden="true">↻</span>
        </button>
        {unlocked && mode === 'daily' && (
          <button className="secondary-button encore-button" type="button" onClick={onEncore}>
            Encore <span>{ENCORE_NAMES[config.engine]} ↗</span>
          </button>
        )}
        {mode === 'encore' && (
          <button className="secondary-button" type="button" onClick={onDaily}>
            Daily game
          </button>
        )}
      </div>
      <details className="run-details">
        <summary>Run details</summary>
        <p className="result-why">{result.explanation}</p>
        <p>{mastery.target}</p>
        <div className="result-stats">
          {result.metrics.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </details>
      <div className="result-secondary">
        <button className="text-button" type="button" onClick={onShare}>
          Share result
        </button>
        <button className="text-button" type="button" onClick={onSave}>
          Save card
        </button>
        <button className="text-button" type="button" onClick={() => onExit('vote')}>
          Vote for tomorrow
        </button>
        <button className="text-button" type="button" onClick={() => onExit()}>
          Back to today
        </button>
      </div>
    </section>
  );
}
