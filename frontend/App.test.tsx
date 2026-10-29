import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DAILY_CONFIGS } from '@shared/game';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { getDailyInfo } from './lib/date';
import { STORAGE_KEY } from './lib/storage';

async function openDefenseInstructions() {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Dev game launcher'), {
    target: { value: 'samosa-shield' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^play$/i }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(screen.getByRole('heading', { name: 'Samosa Shield' })).toBeInTheDocument();
}

async function startActiveDefenseGame() {
  await openDefenseInstructions();
  fireEvent.click(screen.getByRole('button', { name: 'SHOO' }));
  for (let step = 0; step < 4; step += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
  }
  expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
}

describe('Tomorrow’s Game interface', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/?e2e=1');
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('moves from Today to instructions and active defense gameplay', async () => {
    await startActiveDefenseGame();

    expect(screen.getByRole('img', { name: /game field/i })).toBeInTheDocument();
    expect(screen.getByText(/Tap a pigeon/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move left' })).not.toBeInTheDocument();
  });

  it('moves from the game to a result and play-again flow', async () => {
    await startActiveDefenseGame();
    fireEvent.click(screen.getByRole('button', { name: 'Finish demo run' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(screen.getByRole('heading', { name: /pigeons shooed/i })).toBeInTheDocument();
    expect(screen.getByText('SCORE')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^retry/i }));
    expect(screen.getByText('SHOO')).toBeInTheDocument();
    expect(screen.queryByText('Tap pigeons before they reach the samosa.')).not.toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(160);
    });
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('supports keyboard pause and resume', async () => {
    await startActiveDefenseGame();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.getByRole('dialog', { name: 'Take a breath' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'p' });
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('exposes reduced-motion state from the user preference', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
    const { container } = render(<App />);
    expect(container.firstElementChild).toHaveAttribute('data-reduced-motion', 'true');
  });

  it('persists an explicit sound preference while keeping sound off by default', async () => {
    await openDefenseInstructions();
    const sound = screen.getByRole('button', { name: 'Turn on game sounds' });
    expect(sound).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(sound);
    expect(screen.getByRole('button', { name: 'Mute game sounds' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as {
      preferences?: { soundEnabled?: boolean };
    };
    expect(stored.preferences?.soundEnabled).toBe(true);
  });

  it('switches through every development config and all seven engines', () => {
    render(<App />);
    const selector = screen.getByLabelText('Dev game launcher');

    for (const config of DAILY_CONFIGS) {
      fireEvent.change(selector, { target: { value: config.id } });
      expect(screen.getByRole('heading', { level: 1, name: config.title })).toBeInTheDocument();
      expect(selector).toHaveValue(config.id);
    }

    expect(new Set(DAILY_CONFIGS.map((config) => config.engine))).toEqual(
      new Set([
        'defense-v1',
        'dodge-v1',
        'tap-v1',
        'classify-v1',
        'timing-v1',
        'sequence-v1',
        'sort-v1',
      ]),
    );
  });

  it('reveals local community only after a run, then stores a vote and suggestion', async () => {
    await startActiveDefenseGame();
    expect(screen.queryByRole('heading', { name: 'Pick tomorrow.' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Finish demo run' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Back to today' }));
    fireEvent.click(screen.getByLabelText(/One-Minute Museum/i));
    fireEvent.click(screen.getByRole('button', { name: /^vote/i }));
    expect(screen.getByText('Vote saved on this device.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('One-sentence game idea'), {
      target: { value: 'Catch runaway teacups before breakfast.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save idea/i }));
    expect(screen.getByText(/kept on this device/i)).toBeInTheDocument();

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as {
      votes?: Record<string, string>;
      suggestions?: Array<{ text: string }>;
    };
    expect(Object.values(stored.votes ?? {})).toContain('museum-minute');
    expect(stored.suggestions?.[0]?.text).toBe('Catch runaway teacups before breakfast.');
  });

  it('restores local best score and streak in the personal ribbon', () => {
    const currentGame =
      DAILY_CONFIGS[(getDailyInfo(new Date()).challengeNumber - 1) % DAILY_CONFIGS.length];
    if (!currentGame) throw new Error('Missing current game configuration.');
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        bestScores: { [currentGame.id]: 730 },
        preferences: { soundEnabled: false },
        votes: {},
        suggestions: [],
        stats: { streak: 3, lastPlayedDate: null },
      }),
    );
    render(<App />);

    const ribbon = screen.getByRole('region', { name: 'Your local result' });
    expect(ribbon).toHaveTextContent('730');
    expect(ribbon).toHaveTextContent('3 days');
  });
});
