export type BlackoutSoundCue =
  | "arm"
  | "choice-good"
  | "choice-risk"
  | "copy"
  | "win"
  | "partial"
  | "blackout"
  | "easter";

type ToneStep = {
  frequency: number;
  at: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
};

const cuePatterns: Record<BlackoutSoundCue, ToneStep[]> = {
  arm: [
    { frequency: 196, at: 0, duration: 0.06, gain: 0.05, type: "sine" },
    { frequency: 392, at: 0.055, duration: 0.12, gain: 0.075, type: "triangle" },
  ],
  "choice-good": [
    { frequency: 440, at: 0, duration: 0.055, gain: 0.055, type: "triangle" },
    { frequency: 660, at: 0.052, duration: 0.09, gain: 0.07, type: "sine" },
  ],
  "choice-risk": [
    { frequency: 220, at: 0, duration: 0.08, gain: 0.06, type: "sawtooth" },
    { frequency: 165, at: 0.07, duration: 0.11, gain: 0.052, type: "triangle" },
  ],
  copy: [
    { frequency: 523.25, at: 0, duration: 0.05, gain: 0.05, type: "sine" },
    { frequency: 783.99, at: 0.045, duration: 0.08, gain: 0.06, type: "sine" },
  ],
  win: [
    { frequency: 392, at: 0, duration: 0.08, gain: 0.06, type: "triangle" },
    { frequency: 587.33, at: 0.07, duration: 0.1, gain: 0.07, type: "triangle" },
    { frequency: 783.99, at: 0.16, duration: 0.22, gain: 0.075, type: "sine" },
  ],
  partial: [
    { frequency: 330, at: 0, duration: 0.11, gain: 0.06, type: "triangle" },
    { frequency: 440, at: 0.1, duration: 0.12, gain: 0.052, type: "sine" },
    { frequency: 370, at: 0.21, duration: 0.16, gain: 0.04, type: "triangle" },
  ],
  blackout: [
    { frequency: 196, at: 0, duration: 0.13, gain: 0.065, type: "sawtooth" },
    { frequency: 130.81, at: 0.12, duration: 0.22, gain: 0.055, type: "triangle" },
  ],
  easter: [
    { frequency: 493.88, at: 0, duration: 0.07, gain: 0.05, type: "sine" },
    { frequency: 659.25, at: 0.06, duration: 0.09, gain: 0.06, type: "sine" },
    { frequency: 987.77, at: 0.15, duration: 0.16, gain: 0.05, type: "triangle" },
  ],
};

export class BlackoutAudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private lastCueAt = 0;

  async play(cue: BlackoutSoundCue, volume = 0.55) {
    const context = this.getContext();
    if (!context) return;

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return;
      }
    }

    const now = context.currentTime;
    if (now - this.lastCueAt < 0.035) return;
    this.lastCueAt = now;

    const master = this.getMaster(context);
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(Math.min(Math.max(volume, 0), 0.8), now, 0.01);

    for (const step of cuePatterns[cue]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startAt = now + step.at;
      const endAt = startAt + step.duration;

      oscillator.type = step.type ?? "sine";
      oscillator.frequency.setValueAtTime(step.frequency, startAt);
      if (cue === "blackout") {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, step.frequency * 0.72), endAt);
      }

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, step.gain), startAt + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(startAt);
      oscillator.stop(endAt + 0.025);
    }
  }

  close() {
    if (!this.context) return;
    void this.context.close();
    this.context = null;
    this.master = null;
  }

  private getContext() {
    if (typeof window === "undefined") return null;
    if (this.context) return this.context;

    const AudioContextCtor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;

    this.context = new AudioContextCtor();
    return this.context;
  }

  private getMaster(context: AudioContext) {
    if (this.master) return this.master;
    this.master = context.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(context.destination);
    return this.master;
  }
}
