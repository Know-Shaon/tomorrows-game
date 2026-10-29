import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DAILY_CONFIGS, createDailyGameState } from '@shared/game';
import { RunResult } from './RunResult';
afterEach(cleanup);
it('orders grade, performance, PB, Retry and Encore, with truthful gaps', () => {
  const config = DAILY_CONFIGS[0]!;
  const game = {
    ...createDailyGameState(config),
    phase: 'game-over' as const,
    endedReason: 'collision' as const,
    score: 977,
  };
  const retry = vi.fn(),
    encore = vi.fn();
  const { container, rerender } = render(
    <RunResult
      config={config}
      game={game}
      best={1000}
      mode="daily"
      unlocked
      day={302}
      onRetry={retry}
      onEncore={encore}
      onDaily={vi.fn()}
      onShare={vi.fn()}
      onSave={vi.fn()}
      onExit={vi.fn()}
    />,
  );
  const selectors = [
    '.result-grade',
    '.result-score',
    '.personal-best-result',
    '.retry-button',
    '.encore-button',
  ];
  for (let i = 0; i < selectors.length - 1; i++)
    expect(
      container
        .querySelector(selectors[i]!)!
        .compareDocumentPosition(container.querySelector(selectors[i + 1]!)!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  expect(screen.getByText('23 points from your best')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(retry).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: /Encore/ }));
  expect(encore).toHaveBeenCalledOnce();
  rerender(
    <RunResult
      config={config}
      game={game}
      best={null}
      mode="daily"
      unlocked={false}
      day={302}
      onRetry={retry}
      onEncore={encore}
      onDaily={vi.fn()}
      onShare={vi.fn()}
      onSave={vi.fn()}
      onExit={vi.fn()}
    />,
  );
  expect(screen.queryByRole('button', { name: /Encore/ })).not.toBeInTheDocument();
});
