import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DAILY_CONFIGS } from '@shared/game';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
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
  fireEvent.click(screen.getByRole('button', { name: /^play/i }));
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
    expect(screen.getByText(/Tap pigeons on the rooftop/i)).toBeInTheDocument();
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
    expect(screen.getByText(/no public friend link yet/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /play again/i }));
    expect(screen.getByText('READY')).toBeInTheDocument();
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

  it('stores a disclosed local vote and suggestion', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText(/One-Minute Museum/i));
    fireEvent.click(screen.getByRole('button', { name: /lock my local vote/i }));
    expect(screen.getByText('Vote saved on this device.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('One-sentence game idea'), {
      target: { value: 'Catch runaway teacups before breakfast.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /keep idea locally/i }));
    expect(screen.getByText(/kept on this device/i)).toBeInTheDocument();

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as {
      votes?: Record<string, string>;
      suggestions?: Array<{ text: string }>;
    };
    expect(Object.values(stored.votes ?? {})).toContain('museum-minute');
    expect(stored.suggestions?.[0]?.text).toBe('Catch runaway teacups before breakfast.');
  });

  it('restores local best score and streak in the personal ribbon', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        bestScores: { 'mosquito-meeting': 730 },
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
