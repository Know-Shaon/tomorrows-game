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
});
