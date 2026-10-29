import { useState, type FormEvent } from 'react';
import { DAILY_CONFIGS, type DailyGameConfig } from '@shared/game';
import { GameIcon } from './GameIcon';
import type { DailyCard } from '@frontend/lib/mastery-storage';
import { DailyPoster } from './DailyPoster';

interface TodayPageProps {
  hasPlayedToday: boolean;
  config: DailyGameConfig;
  challengeNumber: number;
  countdown: string;
  bestScore: number;
  streak: number;
  longestStreak: number;
  deck: DailyCard[];
  selectedVote: string | undefined;
  onPlay: () => void;
  onVote: (candidateId: string) => boolean;
  onSuggestion: (text: string) => boolean;
  onSelectDevelopmentConfig: (config: DailyGameConfig) => void;
}

const LEADERBOARD = [
  { rank: 1, name: 'Riya_Runs', score: 1_460 },
  { rank: 2, name: 'pixel_paan', score: 1_325 },
  { rank: 3, name: 'NoSleepNico', score: 1_190 },
  { rank: 4, name: 'mango_byte', score: 1_075 },
];
const VOTE_CANDIDATES = [
  {
    id: 'museum-minute',
    title: 'One-Minute Museum',
    pitch: 'Match odd artefacts before closing time.',
    demoPercent: 41,
  },
  {
    id: 'cloud-catcher',
    title: 'Cloud Catcher',
    pitch: 'Catch rainclouds. Avoid suspiciously dry ones.',
    demoPercent: 34,
  },
  {
    id: 'tiny-train',
    title: 'Tiny Train Panic',
    pitch: 'Switch tracks before the snacks arrive.',
    demoPercent: 25,
  },
];

export function TodayPage(props: TodayPageProps) {
  const {
    config,
    challengeNumber,
    countdown,
    bestScore,
    streak,
    selectedVote,
    onPlay,
    onVote,
    onSuggestion,
    onSelectDevelopmentConfig,
  } = props;
  const [vote, setVote] = useState(selectedVote ?? '');
  const [voteMessage, setVoteMessage] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [suggestionMessage, setSuggestionMessage] = useState('');

  const submitVote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vote) {
      setVoteMessage('Choose one weird idea first.');
      return;
    }
    setVoteMessage(
      onVote(vote) ? 'Vote saved on this device.' : 'This browser could not save your local vote.',
    );
  };
  const submitSuggestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = suggestion.trim();
    if (cleaned.length < 8) {
      setSuggestionMessage('Give us at least eight characters of chaos.');
      return;
    }
    const saved = onSuggestion(cleaned);
    setSuggestionMessage(
      saved
        ? 'Kept on this device — not sent to the community.'
        : 'This browser could not save the idea.',
    );
    if (saved) setSuggestion('');
  };

  return (
    <main className={`app-shell theme-${config.palette}`} data-testid="today-page">
      <header className="ritual-header">
        <a className="brand" href="#today" aria-label="Tomorrow's Game home">
          <span className="brand-mark" aria-hidden="true">
            TG
          </span>
          <span>Tomorrow’s Game</span>
        </a>
        <div className="header-stats">
          <span>#{challengeNumber}</span>
          <span>
            <b>{countdown}</b> left
          </span>
          <span>
            ✦ {streak} day{streak === 1 ? '' : 's'}
          </span>
        </div>
      </header>

      <section className="daily-drop" id="today" aria-labelledby="challenge-title">
        <div className="drop-copy">
          <p className="eyebrow">TODAY’S DROP · #{challengeNumber}</p>
          <h1 id="challenge-title">{config.title}</h1>
          <div className="drop-facts">
            <span>{config.durationSeconds} seconds</span>
            <span>{config.interaction}</span>
          </div>
          <button className="play-button giant-play" type="button" onClick={onPlay}>
            PLAY <span aria-hidden="true">▶</span>
          </button>
        </div>
        <div className="poster-wrap">
          <DailyPoster config={config} />
        </div>
      </section>

      <section className="personal-ribbon" aria-label="Your local result">
        <span className="ribbon-label">ON THIS DEVICE</span>
        <div>
          <small>Personal best</small>
          <strong>{bestScore || '—'}</strong>
        </div>
        <div>
          <small>Streak</small>
          <strong>
            {streak} day{streak === 1 ? '' : 's'}
          </strong>
        </div>
      </section>

      <section className="daily-deck" aria-label="Daily Deck on this device">
        <div className="deck-heading">
          <strong>Daily Deck</strong>
          <span>Longest streak · {props.longestStreak} days</span>
        </div>
        {props.deck.length === 0 ? (
          <p>Your first card is one run away.</p>
        ) : (
          <ol>
            {props.deck.slice(-7).map((card) => {
              const game = DAILY_CONFIGS.find((c) => c.id === card.gameId);
              return game ? (
                <li
                  key={`${card.day}:${card.gameId}`}
                  data-medal={card.medal}
                  title={`${game.title} · ${card.date} · ${card.medal}`}
                >
                  <GameIcon engine={game.engine} />
                  <span>#{card.day}</span>
                  <b>{card.medal}</b>
                  <span className="sr-only">
                    {game.title}, {card.date}
                  </span>
                </li>
              ) : null;
            })}
          </ol>
        )}
      </section>

      {props.hasPlayedToday && (
        <>
          <section className="tomorrow-section" id="vote" aria-labelledby="vote-title">
            <div className="tomorrow-heading">
              <div>
                <h2 id="vote-title">Pick tomorrow.</h2>
                <p className="prototype-note">Votes and ideas stay on this device.</p>
              </div>
            </div>
            <form onSubmit={submitVote}>
              <fieldset className="vote-grid">
                <legend className="sr-only">Choose one future game idea</legend>
                {VOTE_CANDIDATES.map((candidate, index) => (
                  <label
                    className={`vote-ticket${vote === candidate.id ? ' selected' : ''}`}
                    key={candidate.id}
                  >
                    <input
                      type="radio"
                      name="future-game"
                      value={candidate.id}
                      checked={vote === candidate.id}
                      onChange={() => setVote(candidate.id)}
                    />
                    <span className="ticket-number">0{index + 1}</span>
                    <strong>{candidate.title}</strong>
                  </label>
                ))}
              </fieldset>
              <div className="vote-footer">
                <button className="vote-button" type="submit">
                  Vote →
                </button>
                <span className="form-message" aria-live="polite">
                  {voteMessage}
                </span>
              </div>
            </form>
          </section>

          <section className="suggestion-strip" aria-labelledby="suggestion-title">
            <div>
              <h2 id="suggestion-title">Suggest a game.</h2>
            </div>
            <form className="suggestion-form" onSubmit={submitSuggestion}>
              <label htmlFor="game-idea">One-sentence game idea</label>
              <textarea
                id="game-idea"
                value={suggestion}
                minLength={8}
                maxLength={240}
                rows={3}
                placeholder="Catch falling chai cups before the train arrives."
                onChange={(event) => setSuggestion(event.target.value)}
              />
              <div className="form-row">
                <small>{suggestion.length}/240 · No personal info.</small>
                <button className="suggest-button" type="submit">
                  Save idea ＋
                </button>
              </div>
              <p className="form-message" aria-live="polite">
                {suggestionMessage}
              </p>
            </form>
          </section>

          <details className="leaderboard-drawer">
            <summary>
              <span>
                <b>Leaderboard · demo</b>
              </span>
              <span>Open ↓</span>
            </summary>
            <ol>
              {LEADERBOARD.map((entry) => (
                <li key={entry.name}>
                  <span>{entry.rank.toString().padStart(2, '0')}</span>
                  <b>{entry.name}</b>
                  <strong>{entry.score.toLocaleString()}</strong>
                </li>
              ))}
            </ol>
          </details>
        </>
      )}

      {import.meta.env.DEV && (
        <aside className="dev-switcher" aria-label="Development tools">
          <label htmlFor="config-switcher">Dev game launcher</label>
          <select
            id="config-switcher"
            value={config.id}
            onChange={(event) => {
              const next = DAILY_CONFIGS.find((item) => item.id === event.target.value);
              if (next) onSelectDevelopmentConfig(next);
            }}
          >
            {DAILY_CONFIGS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} · {item.engine} · {item.interaction}
              </option>
            ))}
          </select>
          <button type="button" onClick={onPlay}>
            Launch selected
          </button>
        </aside>
      )}

      <footer className="site-footer">
        <div>
          <strong>Tomorrow’s Game</strong>
        </div>
        <nav aria-label="Footer">
          <a href="#rules">Rules</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <div className="footer-notes">
          <p id="rules">
            <strong>Rules:</strong> Play fair. Scores stay on this device.
          </p>
          <p id="privacy">
            <strong>Privacy:</strong> This prototype makes no gameplay, vote, or suggestion network
            requests.
          </p>
        </div>
      </footer>
    </main>
  );
}
