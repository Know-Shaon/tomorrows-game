import type { DailyGameState } from '@shared/game';

export type SoundCue =
  | 'start'
  | 'result'
  | 'best'
  | 'soft-step'
  | 'success'
  | 'failure'
  | 'coin'
  | 'perfect'
  | 'elevator-note';

type AudioContextFactory = () => AudioContext | null;

interface Tone {
  frequency: number;
  duration: number;
  delay?: number;
  gain?: number;
  type?: OscillatorType;
}

function defaultAudioContext(): AudioContext | null {
  const AudioContextConstructor = window.AudioContext;
  return AudioContextConstructor ? new AudioContextConstructor() : null;
}

const CUES: Readonly<Record<SoundCue, readonly Tone[]>> = {
  start: [
    { frequency: 330, duration: 0.06, gain: 0.035 },
    { frequency: 495, duration: 0.08, delay: 0.07, gain: 0.04 },
  ],
  result: [{ frequency: 262, duration: 0.13, gain: 0.035, type: 'triangle' }],
  best: [
    { frequency: 523, duration: 0.08, gain: 0.04 },
    { frequency: 659, duration: 0.08, delay: 0.08, gain: 0.04 },
    { frequency: 784, duration: 0.14, delay: 0.16, gain: 0.045 },
  ],
  'soft-step': [{ frequency: 190, duration: 0.035, gain: 0.018, type: 'triangle' }],
  success: [
    { frequency: 440, duration: 0.045, gain: 0.03 },
    { frequency: 660, duration: 0.06, delay: 0.04, gain: 0.032 },
  ],
  failure: [{ frequency: 145, duration: 0.09, gain: 0.03, type: 'sawtooth' }],
  coin: [
    { frequency: 740, duration: 0.04, gain: 0.03 },
    { frequency: 980, duration: 0.07, delay: 0.045, gain: 0.03 },
  ],
  perfect: [
    { frequency: 660, duration: 0.06, gain: 0.04 },
    { frequency: 880, duration: 0.12, delay: 0.055, gain: 0.04 },
  ],
  'elevator-note': [{ frequency: 520, duration: 0.1, gain: 0.028, type: 'sine' }],
};

export class SynthAudio {
  private context: AudioContext | null = null;
  private enabled = false;

  constructor(private readonly createContext: AudioContextFactory = defaultAudioContext) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  play(cue: SoundCue): void {
    if (!this.enabled) return;
    this.context ??= this.createContext();
    const context = this.context;
    if (!context) return;
    if (context.state === 'suspended') void context.resume().catch(() => undefined);
    const start = context.currentTime + 0.005;
    for (const tone of CUES[cue]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const begins = start + (tone.delay ?? 0);
      const ends = begins + tone.duration;
      oscillator.type = tone.type ?? 'sine';
      oscillator.frequency.setValueAtTime(tone.frequency, begins);
      gain.gain.setValueAtTime(tone.gain ?? 0.03, begins);
      gain.gain.exponentialRampToValueAtTime(0.0001, ends);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(begins);
      oscillator.stop(ends);
    }
  }

  close(): void {
    if (this.context) void this.context.close().catch(() => undefined);
    this.context = null;
  }
}

export function soundCueForTransition(
  previous: DailyGameState,
  next: DailyGameState,
): SoundCue | null {
  if (previous.engine !== next.engine) return null;
  if (next.engine === 'defense-v1' && previous.engine === 'defense-v1') {
    if (next.shooed > previous.shooed) return 'success';
    if (next.health < previous.health) return 'failure';
  }
  if (next.engine === 'dodge-v1' && previous.engine === 'dodge-v1') {
    if (next.health < previous.health) return 'failure';
    if (next.coins > previous.coins) return 'coin';
    if (next.avoided > previous.avoided) return 'soft-step';
  }
  if (next.engine === 'tap-v1' && previous.engine === 'tap-v1') {
    if (next.hits > previous.hits) return 'success';
    if (next.misses > previous.misses) return 'failure';
  }
  if (next.engine === 'classify-v1' && previous.engine === 'classify-v1') {
    if (next.correct > previous.correct) return 'success';
    if (next.mistakes > previous.mistakes) return 'failure';
  }
  if (next.engine === 'timing-v1' && previous.engine === 'timing-v1') {
    if (next.roundResults.length > previous.roundResults.length) {
      return next.lastRating === 'perfect'
        ? 'perfect'
        : next.lastRating === 'miss'
          ? 'failure'
          : 'success';
    }
  }
  if (next.engine === 'sequence-v1' && previous.engine === 'sequence-v1') {
    if (next.hits > previous.hits) return 'elevator-note';
    if (next.misses > previous.misses) return 'failure';
  }
  if (next.engine === 'sort-v1' && previous.engine === 'sort-v1') {
    if (next.correct > previous.correct) return 'success';
    if (next.mistakes > previous.mistakes) return 'failure';
  }
  return null;
}
