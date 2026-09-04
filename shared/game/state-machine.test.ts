import { describe, expect, it } from 'vitest';
import { canTransition, transitionGamePhase } from './state-machine';

describe('game state machine', () => {
  it('allows the complete play and retry route', () => {
    const route = [
      'loading',
      'instructions',
      'countdown',
      'active',
      'paused',
      'active',
      'game-over',
      'result',
      'countdown',
    ] as const;
    for (let index = 0; index < route.length - 1; index += 1) {
      expect(canTransition(route[index]!, route[index + 1]!)).toBe(true);
    }
  });

  it('rejects impossible transitions', () => {
    expect(() => transitionGamePhase('instructions', 'result')).toThrow('Invalid game transition');
  });
});
