let ctx: AudioContext | null = null;
let soundEnabled = false;

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(on: boolean): void {
  soundEnabled = on;
  if (on && !ctx && typeof window !== 'undefined') {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      ctx = new AudioCtx();
    }
  }
  if (on && ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

export function playBlip(freq = 520, duration = 0.045, type: OscillatorType = 'square', gainVal = 0.035): void {
  if (!soundEnabled) return;
  try {
    if (!ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // Ignore audio context errors on restricted devices
  }
}

export function playChord(freqs: number[], duration = 0.09): void {
  freqs.forEach((f, idx) => {
    window.setTimeout(() => playBlip(f, duration, 'triangle', 0.03), idx * 28);
  });
}
