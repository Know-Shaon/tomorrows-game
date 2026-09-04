import type { GamePhase } from './types';

const TRANSITIONS: Readonly<Record<GamePhase, readonly GamePhase[]>> = {
  loading: ['instructions', 'error', 'unsupported'],
  instructions: ['countdown', 'error', 'unsupported'],
  countdown: ['active', 'instructions', 'error'],
  active: ['paused', 'game-over', 'error'],
  paused: ['active', 'game-over', 'error'],
  'game-over': ['result'],
  result: ['countdown', 'instructions'],
  error: ['loading', 'instructions'],
  unsupported: ['loading'],
};

export function canTransition(from: GamePhase, to: GamePhase): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transitionGamePhase(from: GamePhase, to: GamePhase): GamePhase {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid game transition: ${from} -> ${to}.`);
  }
  return to;
}
