import { describe, expect, it, vi } from 'vitest';
import { SynthAudio } from './audio';

describe('synthesized game audio', () => {
  it('does not initialize WebAudio while muted', () => {
    const createContext = vi.fn(() => null);
    const audio = new SynthAudio(createContext);
    audio.play('success');
    expect(createContext).not.toHaveBeenCalled();
  });

  it('initializes only after sound is explicitly enabled', () => {
    const createContext = vi.fn(() => null);
    const audio = new SynthAudio(createContext);
    audio.setEnabled(true);
    audio.play('start');
    expect(createContext).toHaveBeenCalledOnce();
  });

  it('builds a musical phrase and combo pitch while honoring mute', () => {
    const frequencies: number[] = [];
    const voice = () => ({
      type: 'sine',
      frequency: { setValueAtTime: (frequency: number) => frequencies.push(frequency) },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    });
    const context = {
      currentTime: 0,
      state: 'running',
      createOscillator: voice,
      createGain: () => ({
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      }),
      destination: {},
      close: () => Promise.resolve(),
    } as unknown as AudioContext;
    const audio = new SynthAudio(() => context);
    audio.setEnabled(true);
    for (let combo = 1; combo <= 8; combo++) audio.play('elevator-note', combo);
    expect(new Set(frequencies).size).toBe(6);
    expect(frequencies[7]).toBeCloseTo(frequencies[0]! * 2);
    const count = frequencies.length;
    audio.setEnabled(false);
    audio.play('rank-s');
    expect(frequencies).toHaveLength(count);
  });
});
