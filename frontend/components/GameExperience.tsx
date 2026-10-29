import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  FIXED_TIMESTEP_SECONDS,
  createDailyGameState,
  getDefenseThreatPosition,
  getTapTargetPosition,
  stepDailyGame,
  transitionGamePhase,
  type DailyGameConfig,
  type DailyGameInput,
  type DailyGameState,
  type GamePhase,
} from '@shared/game';
import { canvasToBlob, drawShareCard } from '@frontend/lib/share-card';
import { describeResult } from '@frontend/lib/game-result';
import { soundCueForTransition, SynthAudio } from '@frontend/lib/audio';
import { EngineControls } from './EngineControls';
import { actionVerbFor, accessibleGameStatus } from '@frontend/lib/player-presentation';
import { GameCanvas } from './GameCanvas';

interface GameExperienceProps {
  config: DailyGameConfig;
  bestScore: number;
  reducedMotion: boolean;
  nextGameCountdown: string;
  soundEnabled: boolean;
  onSoundEnabledChange: (enabled: boolean) => void;
  onFinish: (score: number) => void;
  onExit: (target?: 'vote') => void;
}

const MAX_CATCH_UP_STEPS = 8;
const DevPlaytestPanel = import.meta.env.DEV
  ? lazy(() =>
      import('./DevPlaytestPanel').then(({ DevPlaytestPanel: Panel }) => ({ default: Panel })),
    )
  : null;

function neutralInput(config: DailyGameConfig): DailyGameInput {
  if (config.engine === 'defense-v1') return { engine: 'defense-v1', tap: null };
  if (config.engine === 'dodge-v1') return { engine: 'dodge-v1', laneChange: 0, directLane: null };
  if (config.engine === 'tap-v1') return { engine: 'tap-v1', tap: null };
  if (config.engine === 'classify-v1') return { engine: 'classify-v1', choice: null };
  if (config.engine === 'timing-v1') return { engine: 'timing-v1', stopAtSeconds: null };
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

function mistakeCount(state: DailyGameState): number {
  if (state.engine === 'defense-v1') return state.escaped;
  if (state.engine === 'dodge-v1') return 3 - state.health;
  if (state.engine === 'tap-v1') return state.misses;
  if (state.engine === 'classify-v1') return state.mistakes;
  if (state.engine === 'timing-v1')
    return state.roundResults.filter((result) => result.rating === 'miss').length;
  if (state.engine === 'sequence-v1') return state.misses;
  return state.mistakes;
}

function feedbackAnnouncement(state: DailyGameState): string {
  if (!state.feedback || state.feedbackTicks <= 0) return '';
  if (state.engine === 'timing-v1' && state.lastRating) return state.lastRating;
  return state.feedback === 'good' ? 'Successful action' : 'Mistake';
}

function SoundToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      className="sound-toggle"
      type="button"
      aria-label={enabled ? 'Mute game sounds' : 'Turn on game sounds'}
      aria-pressed={enabled}
      onClick={onToggle}
    >
      <span aria-hidden="true">{enabled ? '♪' : '♪̸'}</span> {enabled ? 'Sound on' : 'Sound off'}
    </button>
  );
}

export function GameExperience({
  config,
  bestScore,
  reducedMotion,
  nextGameCountdown,
  soundEnabled,
  onSoundEnabledChange,
  onFinish,
  onExit,
}: GameExperienceProps) {
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [countdown, setCountdown] = useState(3);
  const [game, setGame] = useState(() => createDailyGameState(config));
  const [message, setMessage] = useState('');
  const [actionCount, setActionCount] = useState(0);
  const [repeatRun, setRepeatRun] = useState(false);
  const [runBest, setRunBest] = useState(bestScore);
  const gameRef = useRef(game);
  const actionQueueRef = useRef<DailyGameInput[]>([]);
  const shareCanvasRef = useRef<HTMLCanvasElement>(null);
  const finishedRef = useRef(false);
  const frameTimeRef = useRef(0);
  const audioRef = useRef<SynthAudio | null>(null);

  useEffect(() => {
    audioRef.current ??= new SynthAudio();
    audioRef.current.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(
    () => () => {
      audioRef.current?.close();
    },
    [],
  );

  const toggleSound = useCallback(() => {
    const enabled = !soundEnabled;
    audioRef.current ??= new SynthAudio();
    audioRef.current.setEnabled(enabled);
    if (enabled) audioRef.current.play('start');
    onSoundEnabledChange(enabled);
  }, [onSoundEnabledChange, soundEnabled]);

  const moveTo = useCallback((next: GamePhase) => {
    setPhase((current) => (current === next ? current : transitionGamePhase(current, next)));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const probe = document.createElement('canvas');
      try {
        const next = probe.getContext('2d') ? 'instructions' : 'unsupported';
        setPhase((current) =>
          current === 'loading' ? transitionGamePhase(current, next) : current,
        );
      } catch (error) {
        console.warn('Canvas capability check failed.', error);
        moveTo('unsupported');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [moveTo]);

  const startRun = useCallback(
    (retry: boolean) => {
      setCountdown(retry ? 0 : 3);
      setRepeatRun(retry);
      const next = createDailyGameState(config);
      gameRef.current = next;
      setGame(next);
      finishedRef.current = false;
      actionQueueRef.current = [];
      setRunBest(bestScore);
      setActionCount(0);
      setMessage('');
      audioRef.current?.play('start');
      if (import.meta.env.DEV) {
        void import('@frontend/lib/playtest').then(({ recordPlaytestStart }) => {
          recordPlaytestStart(window.localStorage, config.id, retry);
        });
      }
      moveTo('countdown');
    },
    [bestScore, config, moveTo],
  );

  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    const timer = window.setTimeout(
      () => {
        if (countdown === 0) moveTo('active');
        else setCountdown((value) => value - 1);
      },
      repeatRun ? 140 : 360,
    );
    return () => window.clearTimeout(timer);
  }, [countdown, moveTo, phase, repeatRun]);

  useEffect(() => {
    if (phase !== 'active') return undefined;
    let frame = 0;
    let previousTime = performance.now();
    frameTimeRef.current = previousTime;
    let accumulator = 0;
    const update = (time: number) => {
      accumulator += Math.min(0.25, (time - previousTime) / 1_000);
      previousTime = time;
      frameTimeRef.current = time;
      let steps = 0;
      let next = gameRef.current;
      try {
        while (accumulator >= FIXED_TIMESTEP_SECONDS && steps < MAX_CATCH_UP_STEPS) {
          const previous = next;
          next = stepDailyGame(
            next,
            actionQueueRef.current.shift() ?? neutralInput(config),
            config,
          );
          const cue = soundCueForTransition(previous, next);
          if (cue) audioRef.current?.play(cue);
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
      const finishedGame = gameRef.current;
      audioRef.current?.play(finishedGame.score > runBest ? 'best' : 'result');
      if (import.meta.env.DEV) {
        void import('@frontend/lib/playtest').then(({ recordPlaytestFinish }) => {
          recordPlaytestFinish(
            window.localStorage,
            config.id,
            finishedGame.score,
            mistakeCount(finishedGame),
            finishedGame.elapsedSeconds,
          );
        });
      }
      onFinish(finishedGame.score);
    }
    const timer = window.setTimeout(() => moveTo('result'), reducedMotion ? 0 : 260);
    return () => window.clearTimeout(timer);
  }, [config.id, moveTo, onFinish, phase, reducedMotion, runBest]);

  const pause = useCallback(() => {
    if (phase === 'active') moveTo('paused');
  }, [moveTo, phase]);
  const resume = useCallback(() => {
    if (phase === 'paused') moveTo('active');
  }, [moveTo, phase]);
  const queueAction = useCallback((input: DailyGameInput) => {
    let queued = input;
    const current = gameRef.current;
    if (
      input.engine === 'timing-v1' &&
      input.stopAtSeconds !== null &&
      current.engine === 'timing-v1'
    ) {
      const sinceFrameSeconds = Math.max(
        0,
        Math.min(0.05, (performance.now() - frameTimeRef.current) / 1_000),
      );
      queued = {
        engine: 'timing-v1',
        stopAtSeconds: current.timerSeconds + sinceFrameSeconds,
      };
    }
    actionQueueRef.current.push(queued);
    if (actionQueueRef.current.length > 8) actionQueueRef.current.shift();
    setActionCount((count) => count + 1);
    if (input.engine === 'dodge-v1') audioRef.current?.play('soft-step');
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
        if (current.target) {
          event.preventDefault();
          const position = getTapTargetPosition(current.target, current.tick);
          queueAction({
            engine: 'tap-v1',
            tap: position,
          });
        }
      } else if (config.engine === 'classify-v1' && (key === 'k' || key === 't')) {
        event.preventDefault();
        queueAction({ engine: 'classify-v1', choice: key === 'k' ? 'keep' : 'trash' });
      } else if (config.engine === 'timing-v1' && (key === ' ' || key === 'enter')) {
        event.preventDefault();
        queueAction({
          engine: 'timing-v1',
          stopAtSeconds: current.engine === 'timing-v1' ? current.timerSeconds : null,
        });
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
      setMessage('Copy is unavailable on this device.');
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
      setMessage('Sharing is unavailable on this device.');
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
          <div className="instruction-toolbar">
            <p className="eyebrow">{config.durationSeconds} SEC</p>
            <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
          </div>
          <h1 id="game-title">{config.title}</h1>
          <p className="control-hint">{config.controlHint}</p>
          <button
            className="play-button game-start-button"
            type="button"
            onClick={() => startRun(false)}
          >
            {actionVerbFor(config)} <span aria-hidden="true">→</span>
          </button>
        </section>
      </main>
    );
  if (phase === 'countdown' || phase === 'game-over')
    return (
      <main className="game-shell countdown-screen" aria-live="assertive">
        <p>{phase === 'countdown' ? config.title : 'THAT’S THE RUN'}</p>
        <strong>{phase === 'countdown' ? countdown || actionVerbFor(config) : game.score}</strong>
      </main>
    );

  if (phase === 'result') {
    const personalBest = Math.max(runBest, game.score);
    const isNewBest = game.score > runBest;
    const result = describeResult(game, personalBest);
    return (
      <main className="game-shell result-screen">
        <section
          className={`result-card${isNewBest ? ' new-best' : ''}`}
          aria-labelledby="result-title"
        >
          <p className="eyebrow">{config.title}</p>
          <h2 className="result-explanation" id="result-title">
            {result.headline}
          </h2>
          <p className="result-verdict">{result.verdict}</p>
          <p className="score-kicker">SCORE</p>
          <p className="result-score">{game.score.toLocaleString()}</p>
          <p className="result-why">{result.explanation}</p>
          <div className="result-stats">
            {result.metrics.map((metric) => (
              <div key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
          <div className="personal-best-result" data-new-best={isNewBest ? 'true' : 'false'}>
            <span>{isNewBest ? '★ NEW PERSONAL BEST' : 'PERSONAL BEST'}</span>
            <strong>{result.personalBest}</strong>
          </div>
          <div className="result-actions">
            <button className="play-button" type="button" onClick={() => startRun(true)}>
              Retry <span aria-hidden="true">↻</span>
            </button>
            <button className="secondary-button" type="button" onClick={() => void shareResult()}>
              Share result
            </button>
            <button className="secondary-button" type="button" onClick={() => onExit('vote')}>
              Vote for tomorrow
            </button>
            <button className="secondary-button" type="button" onClick={() => onExit()}>
              Back to today
            </button>
          </div>
          <p className="tomorrow-countdown">
            Next tiny game in <strong>{nextGameCountdown}</strong>
          </p>
          <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
          <p className="share-message" aria-live="polite">
            {message}
          </p>
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
        <h1 className="active-game-title">{config.title}</h1>
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
        <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
        <button className="hud-button" type="button" onClick={phase === 'paused' ? resume : pause}>
          {phase === 'paused' ? 'Resume' : 'Pause'}
        </button>
      </header>
      <p className="sr-only">{accessibleGameStatus(config, game)}</p>
      <p className="sr-only" aria-live="assertive">
        {feedbackAnnouncement(game)}
      </p>
      <div className="game-stage">
        <div className="game-world">
          <GameCanvas
            config={config}
            state={game}
            reducedMotion={reducedMotion}
            onAction={queueAction}
            onUnsupported={unsupported}
          />
          <EngineControls
            config={config}
            state={game}
            onAction={queueAction}
            showHint={actionCount === 0}
          />
          {phase === 'paused' && (
            <div
              className="pause-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pause-title"
            >
              <h2 id="pause-title">Take a breath</h2>
              <button className="play-button" type="button" onClick={resume}>
                Resume <span aria-hidden="true">→</span>
              </button>
              <button className="text-button" type="button" onClick={() => onExit()}>
                End run
              </button>
            </div>
          )}
        </div>
      </div>
      {DevPlaytestPanel ? (
        <Suspense fallback={null}>
          <DevPlaytestPanel actionCount={actionCount} config={config} state={game} />
        </Suspense>
      ) : null}
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
