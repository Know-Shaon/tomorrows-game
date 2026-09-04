import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FIXED_TIMESTEP_SECONDS,
  createDailyGameState,
  getDefenseThreatPosition,
  stepDailyGame,
  transitionGamePhase,
  type DailyGameConfig,
  type DailyGameInput,
  type DailyGameState,
  type GamePhase,
} from '@shared/game';
import { canvasToBlob, drawShareCard } from '@frontend/lib/share-card';
import { describeResult } from '@frontend/lib/game-result';
import { EngineControls } from './EngineControls';
import { GameCanvas } from './GameCanvas';

interface GameExperienceProps {
  config: DailyGameConfig;
  bestScore: number;
  reducedMotion: boolean;
  nextGameCountdown: string;
  onFinish: (score: number) => void;
  onExit: (target?: 'vote') => void;
}

const MAX_CATCH_UP_STEPS = 8;

function neutralInput(config: DailyGameConfig): DailyGameInput {
  if (config.engine === 'defense-v1') return { engine: 'defense-v1', tap: null };
  if (config.engine === 'dodge-v1') return { engine: 'dodge-v1', laneChange: 0, directLane: null };
  if (config.engine === 'tap-v1') return { engine: 'tap-v1', tap: null };
  if (config.engine === 'classify-v1') return { engine: 'classify-v1', choice: null };
  if (config.engine === 'timing-v1') return { engine: 'timing-v1', stop: false };
  if (config.engine === 'sequence-v1') return { engine: 'sequence-v1', hit: false };
  return { engine: 'sort-v1', choice: null };
}

function hudMetric(state: DailyGameState): { label: string; value: string } {
  if (state.engine === 'defense-v1') return { label: 'Samosa', value: `${state.health}/3` };
  if (state.engine === 'dodge-v1') return { label: 'Distance', value: `${state.distanceMeters}m` };
  if (state.engine === 'tap-v1') return { label: 'Combo', value: `×${state.combo}` };
  if (state.engine === 'classify-v1') return { label: 'Correct', value: state.correct.toString() };
  if (state.engine === 'timing-v1')
    return { label: 'Target', value: `${state.targetSeconds.toFixed(2)}s` };
  if (state.engine === 'sequence-v1')
    return { label: 'Next floor', value: state.requests[state.requestIndex]?.toString() ?? '—' };
  return { label: 'Combo', value: `×${state.combo}` };
}

function isE2eMode(): boolean {
  return new URLSearchParams(window.location.search).has('e2e');
}

export function GameExperience({
  config,
  bestScore,
  reducedMotion,
  nextGameCountdown,
  onFinish,
  onExit,
}: GameExperienceProps) {
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [countdown, setCountdown] = useState(3);
  const [game, setGame] = useState(() => createDailyGameState(config));
  const [message, setMessage] = useState('');
  const gameRef = useRef(game);
  const actionRef = useRef<DailyGameInput | null>(null);
  const shareCanvasRef = useRef<HTMLCanvasElement>(null);
  const finishedRef = useRef(false);

  const moveTo = useCallback((next: GamePhase) => {
    setPhase((current) => (current === next ? current : transitionGamePhase(current, next)));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const probe = document.createElement('canvas');
      try {
        moveTo(probe.getContext('2d') ? 'instructions' : 'unsupported');
      } catch (error) {
        console.warn('Canvas capability check failed.', error);
        moveTo('unsupported');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [moveTo]);

  const startCountdown = useCallback(() => {
    setCountdown(3);
    const next = createDailyGameState(config);
    gameRef.current = next;
    setGame(next);
    finishedRef.current = false;
    actionRef.current = null;
    setMessage('');
    moveTo('countdown');
  }, [config, moveTo]);

  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    const timer = window.setTimeout(() => {
      if (countdown === 0) moveTo('active');
      else setCountdown((value) => value - 1);
    }, 360);
    return () => window.clearTimeout(timer);
  }, [countdown, moveTo, phase]);

  useEffect(() => {
    if (phase !== 'active') return undefined;
    let frame = 0;
    let previousTime = performance.now();
    let accumulator = 0;
    const update = (time: number) => {
      accumulator += Math.min(0.25, (time - previousTime) / 1_000);
      previousTime = time;
      let steps = 0;
      let next = gameRef.current;
      try {
        while (accumulator >= FIXED_TIMESTEP_SECONDS && steps < MAX_CATCH_UP_STEPS) {
          next = stepDailyGame(next, actionRef.current ?? neutralInput(config), config);
          actionRef.current = null;
          accumulator -= FIXED_TIMESTEP_SECONDS;
          steps += 1;
        }
      } catch (error) {
        console.error('The deterministic simulation stopped.', error);
        setMessage('The simulation could not continue. Your device score was not changed.');
        moveTo('error');
        return;
      }
      gameRef.current = next;
      setGame(next);
      if (next.phase === 'game-over') {
        moveTo('game-over');
        return;
      }
      frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [config, moveTo, phase]);

  useEffect(() => {
    if (phase !== 'game-over') return undefined;
    if (!finishedRef.current) {
      finishedRef.current = true;
      onFinish(gameRef.current.score);
    }
    const timer = window.setTimeout(() => moveTo('result'), reducedMotion ? 0 : 260);
    return () => window.clearTimeout(timer);
  }, [moveTo, onFinish, phase, reducedMotion]);

  const pause = useCallback(() => {
    if (phase === 'active') moveTo('paused');
  }, [moveTo, phase]);
  const resume = useCallback(() => {
    if (phase === 'paused') moveTo('active');
  }, [moveTo, phase]);
  const queueAction = useCallback((input: DailyGameInput) => {
    actionRef.current = input;
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((key === 'escape' || key === 'p') && !event.repeat) {
        event.preventDefault();
        if (phase === 'active') pause();
        else if (phase === 'paused') resume();
        return;
      }
      if (phase !== 'active' || event.repeat) return;
      const current = gameRef.current;
      if (config.engine === 'defense-v1' && current.engine === 'defense-v1' && key === ' ') {
        const nearest = [...current.threats].sort((a, b) => a.distance - b.distance)[0];
        if (nearest) {
          event.preventDefault();
          queueAction({
            engine: 'defense-v1',
            tap: getDefenseThreatPosition(nearest, current.tick),
          });
        }
      } else if (
        config.engine === 'dodge-v1' &&
        ['arrowleft', 'a', 'arrowright', 'd'].includes(key)
      ) {
        event.preventDefault();
        queueAction({
          engine: 'dodge-v1',
          laneChange: key === 'arrowleft' || key === 'a' ? -1 : 1,
          directLane: null,
        });
      } else if (config.engine === 'tap-v1' && current.engine === 'tap-v1' && key === ' ') {
        if (current.target?.kind === 'target') {
          event.preventDefault();
          queueAction({
            engine: 'tap-v1',
            tap: { x: current.target.x, y: current.target.y },
          });
        }
      } else if (config.engine === 'classify-v1' && (key === 'k' || key === 't')) {
        event.preventDefault();
        queueAction({ engine: 'classify-v1', choice: key === 'k' ? 'keep' : 'trash' });
      } else if (config.engine === 'timing-v1' && (key === ' ' || key === 'enter')) {
        event.preventDefault();
        queueAction({ engine: 'timing-v1', stop: true });
      } else if (config.engine === 'sequence-v1' && (key === ' ' || key === 'enter')) {
        event.preventDefault();
        queueAction({ engine: 'sequence-v1', hit: true });
      } else if (config.engine === 'sort-v1' && (key === 'l' || key === 'd')) {
        event.preventDefault();
        queueAction({ engine: 'sort-v1', choice: key === 'l' ? 'left' : 'right' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [config.engine, pause, phase, queueAction, resume]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && phase === 'active') pause();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [pause, phase]);

  const unsupported = useCallback(() => {
    if (phase === 'loading' || phase === 'instructions') moveTo('unsupported');
    else {
      setMessage('Canvas stopped responding in this browser.');
      moveTo('error');
    }
  }, [moveTo, phase]);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(
        `I scored ${game.score} in ${config.title} — Tomorrow’s Game local preview.`,
      );
      setMessage('Result copied. This preview is not a public challenge link.');
    } catch (error) {
      console.warn('Clipboard copy failed.', error);
      setMessage('Copy is unavailable. You can download the result card instead.');
    }
  };

  const createResultBlob = async (): Promise<Blob> => {
    const canvas = shareCanvasRef.current;
    if (!canvas) throw new Error('The result canvas is not ready.');
    drawShareCard(canvas, config, game);
    return canvasToBlob(canvas);
  };

  const shareResult = async () => {
    try {
      const blob = await createResultBlob();
      const file = new File([blob], 'tomorrows-game-result.png', { type: 'image/png' });
      const payload = {
        title: `Tomorrow’s Game — ${config.title}`,
        text: `I scored ${game.score} in ${config.title}.`,
        files: [file],
      };
      if (navigator.share && (!navigator.canShare || navigator.canShare(payload))) {
        await navigator.share(payload);
        setMessage('Share sheet opened.');
      } else await copyResult();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setMessage('Share cancelled.');
        return;
      }
      console.warn('Result sharing failed.', error);
      setMessage('Sharing is unavailable. Try copying or downloading the card.');
    }
  };

  const downloadResult = async () => {
    try {
      const blob = await createResultBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tomorrows-game-result.png';
      link.click();
      URL.revokeObjectURL(url);
      setMessage('Result card downloaded.');
    } catch (error) {
      console.warn('Result card download failed.', error);
      setMessage('The result card could not be downloaded.');
    }
  };

  if (phase === 'loading')
    return (
      <main className="game-shell status-screen" aria-live="polite">
        <div className="loading-orbit" aria-hidden="true" />
        <h1 className="status-title">Loading today’s game</h1>
      </main>
    );
  if (phase === 'unsupported' || phase === 'error')
    return (
      <main className="game-shell status-screen" role={phase === 'error' ? 'alert' : undefined}>
        <p className="eyebrow">{phase === 'error' ? 'GAME ERROR' : 'UNSUPPORTED BROWSER'}</p>
        <h1 className="status-title">
          {phase === 'error' ? 'The run hit a snag' : 'Canvas needs an update'}
        </h1>
        <p>{message || 'This game needs a browser with HTML Canvas support.'}</p>
        <button className="secondary-button" type="button" onClick={() => onExit()}>
          Back to today
        </button>
      </main>
    );
  if (phase === 'instructions')
    return (
      <main className={`game-shell instruction-screen theme-${config.palette}`}>
        <button className="text-button back-button" type="button" onClick={() => onExit()}>
          ← Today
        </button>
        <section className="instruction-card compact-instructions" aria-labelledby="game-title">
          <p className="eyebrow">
            {config.interaction} · {config.durationSeconds} sec
          </p>
          <h1 id="game-title">{config.title}</h1>
          <p className="instruction-lede">{config.instruction}</p>
          <p className="control-hint">{config.controlHint}</p>
          <button className="play-button game-start-button" type="button" onClick={startCountdown}>
            Play <span aria-hidden="true">→</span>
          </button>
        </section>
      </main>
    );
  if (phase === 'countdown' || phase === 'game-over')
    return (
      <main className="game-shell countdown-screen" aria-live="assertive">
        <p>{phase === 'countdown' ? 'READY' : 'THAT’S THE RUN'}</p>
        <strong>{phase === 'countdown' ? countdown || 'GO' : game.score}</strong>
      </main>
    );

  if (phase === 'result') {
    const personalBest = Math.max(bestScore, game.score);
    const isNewBest = game.score > bestScore;
    const result = describeResult(game, personalBest);
    return (
      <main className="game-shell result-screen">
        <section
          className={`result-card${isNewBest ? ' new-best' : ''}`}
          aria-labelledby="result-title"
        >
          <p className="eyebrow">{isNewBest ? '★ NEW PERSONAL BEST' : 'RUN COMPLETE'}</p>
          <h2 className="result-explanation" id="result-title">
            {result.headline}
          </h2>
          <p className="score-kicker">SCORE</p>
          <p className="result-score">{game.score.toLocaleString()}</p>
          <div className="result-stats">
            {result.metrics.map((metric) => (
              <div key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
          <div className="result-actions">
            <button className="play-button" type="button" onClick={startCountdown}>
              Play again <span aria-hidden="true">↻</span>
            </button>
            <button className="secondary-button" type="button" onClick={() => void shareResult()}>
              Share result
            </button>
            <button className="secondary-button" type="button" onClick={() => onExit('vote')}>
              Vote for tomorrow
            </button>
            <button className="secondary-button" type="button" onClick={() => void copyResult()}>
              Copy score
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void downloadResult()}
            >
              Download card
            </button>
          </div>
          <p className="tomorrow-countdown">
            Next tiny game in <strong>{nextGameCountdown}</strong>
          </p>
          <p className="prototype-note">Local preview only — no public friend link yet.</p>
          <p className="share-message" aria-live="polite">
            {message}
          </p>
          <button className="text-button" type="button" onClick={() => onExit()}>
            Back to today
          </button>
          <canvas ref={shareCanvasRef} className="share-canvas" aria-hidden="true" />
        </section>
      </main>
    );
  }

  const metric = hudMetric(game);
  return (
    <main
      className={`game-shell play-screen game-${config.engine}`}
      data-phase={phase}
      data-engine={config.engine}
    >
      <header className="game-hud">
        <div>
          <span>TIME</span>
          <strong>{Math.max(0, Math.ceil(config.durationSeconds - game.elapsedSeconds))}</strong>
        </div>
        <div>
          <span>SCORE</span>
          <strong>{game.score.toLocaleString()}</strong>
        </div>
        <div>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
        <button className="hud-button" type="button" onClick={phase === 'paused' ? resume : pause}>
          {phase === 'paused' ? 'Resume' : 'Pause'}
        </button>
      </header>
      <div className="game-stage">
        <GameCanvas
          config={config}
          state={game}
          reducedMotion={reducedMotion}
          onAction={queueAction}
          onUnsupported={unsupported}
        />
        {phase === 'paused' && (
          <div
            className="pause-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-title"
          >
            <p className="eyebrow">SAFE PAUSE</p>
            <h2 id="pause-title">Take a breath</h2>
            <p>The game is frozen. Your run is safe.</p>
            <button className="play-button" type="button" onClick={resume}>
              Resume <span aria-hidden="true">→</span>
            </button>
            <button className="text-button" type="button" onClick={() => onExit()}>
              End run
            </button>
          </div>
        )}
      </div>
      <EngineControls config={config} state={game} onAction={queueAction} />
      {import.meta.env.DEV && isE2eMode() && (
        <button
          className="e2e-finish"
          type="button"
          onClick={() => {
            gameRef.current = { ...gameRef.current, phase: 'game-over', endedReason: 'complete' };
            setGame(gameRef.current);
            moveTo('game-over');
          }}
        >
          Finish demo run
        </button>
      )}
    </main>
  );
}
