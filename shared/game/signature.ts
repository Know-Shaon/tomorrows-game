import { getDefenseThreatPosition } from './defense-engine';
import { getTapTargetPosition } from './tap-engine';
import type { DailyGameConfig, DailyGameInput, DailyGameState } from './types';

export interface SignatureEvent {
  kind: 'shoo' | 'save' | 'near-miss' | 'swat' | 'file' | 'precision' | 'note' | 'basket';
  tick: number;
  x: number;
  y: number;
  power: number;
  side?: number;
  token?: import('./types').SortToken;
}

/** Events are derived once per fixed simulation step, never from render-frame timing. */
export function signatureForTransition(
  previous: DailyGameState,
  next: DailyGameState,
  config: DailyGameConfig,
  input?: DailyGameInput,
): SignatureEvent | null {
  const base = { tick: next.tick, x: 500, y: 500, power: 1 };
  if (
    previous.engine === 'defense-v1' &&
    next.engine === 'defense-v1' &&
    next.shooed > previous.shooed
  ) {
    const tap = input?.engine === 'defense-v1' ? input.tap : null;
    const bird = previous.threats.find((t) => {
      const p = getDefenseThreatPosition(t, previous.tick);
      return (
        !next.threats.some((n) => n.id === t.id) &&
        (!tap || Math.hypot(tap.x - p.x, tap.y - p.y) <= t.radius + 18)
      );
    });
    if (bird)
      return {
        ...base,
        ...getDefenseThreatPosition(bird, previous.tick),
        kind: bird.distance < 200 ? 'save' : 'shoo',
        power: bird.distance < 200 ? 3 : 1,
      };
  }
  if (
    previous.engine === 'dodge-v1' &&
    next.engine === 'dodge-v1' &&
    next.health === previous.health
  ) {
    const resolved = next.waves.find(
      (w) => w.resolved && previous.waves.some((p) => p.id === w.id && !p.resolved),
    );
    if (
      resolved?.hazards.some(
        (hazard, lane) =>
          hazard &&
          Math.abs(next.playerLanePosition - lane) >= 0.34 &&
          Math.abs(next.playerLanePosition - lane) <= 0.55,
      )
    )
      return { ...base, kind: 'near-miss', y: 790, power: 2 };
  }
  if (
    previous.engine === 'tap-v1' &&
    next.engine === 'tap-v1' &&
    next.hits > previous.hits &&
    previous.target
  )
    return {
      ...base,
      ...getTapTargetPosition(previous.target, previous.tick),
      kind: 'swat',
      power: Math.min(4, 1 + Math.floor(next.combo / 4)),
    };
  if (
    previous.engine === 'classify-v1' &&
    next.engine === 'classify-v1' &&
    next.correct > previous.correct
  )
    return {
      ...base,
      kind: 'file',
      side: next.lastChoice === 'keep' ? -1 : 1,
      power: Math.min(4, 1 + Math.floor(next.combo / 4)),
    };
  if (
    previous.engine === 'timing-v1' &&
    next.engine === 'timing-v1' &&
    next.roundResults.length > previous.roundResults.length &&
    next.lastRating === 'perfect'
  )
    return { ...base, kind: 'precision', x: 405, y: 430, power: 3 };
  if (
    previous.engine === 'sequence-v1' &&
    next.engine === 'sequence-v1' &&
    next.hits > previous.hits
  )
    return { ...base, kind: 'note', x: 370, y: 470, power: next.combo };
  if (
    previous.engine === 'sort-v1' &&
    next.engine === 'sort-v1' &&
    config.engine === 'sort-v1' &&
    next.correct > previous.correct
  )
    return {
      ...base,
      kind: 'basket',
      y: 710,
      token: config.items[previous.currentItemIndex ?? -1]?.token ?? 'white-sock',
      side: config.items[previous.currentItemIndex ?? -1]?.correctSide === 'left' ? -1 : 1,
      power: Math.min(4, 1 + Math.floor(next.combo / 4)),
    };
  return null;
}
