export type SoundName = "coin" | "jump" | "slide" | "crash" | "power" | "dash" | "stage";

export class AudioManager {
  private context: AudioContext | null = null;
  private enabled = true;
  private master: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private musicGain: GainNode | null = null;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.master) this.master.gain.setTargetAtTime(enabled ? 0.7 : 0, this.context?.currentTime ?? 0, 0.04);
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined" || !("AudioContext" in window)) return null;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") void this.context.resume();
      if (!this.master) {
        this.master = this.context.createGain();
        this.master.gain.value = this.enabled ? 0.7 : 0;
        this.master.connect(this.context.destination);
      }
      return this.context;
    } catch {
      return null;
    }
  }

  play(name: SoundName): void {
    if (!this.enabled) return;
    const context = this.getContext();
    if (!context || !this.master) return;

    const presets: Record<SoundName, { start: number; end: number; duration: number; type: OscillatorType }> = {
      coin: { start: 740, end: 1180, duration: 0.12, type: "sine" },
      jump: { start: 250, end: 520, duration: 0.18, type: "triangle" },
      slide: { start: 190, end: 120, duration: 0.12, type: "sawtooth" },
      crash: { start: 130, end: 42, duration: 0.34, type: "sawtooth" },
      power: { start: 420, end: 920, duration: 0.28, type: "sine" },
      dash: { start: 330, end: 1050, duration: 0.2, type: "triangle" },
      stage: { start: 520, end: 1040, duration: 0.38, type: "sine" }
    };

    const preset = presets[name];
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = preset.type;
    oscillator.frequency.setValueAtTime(preset.start, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(preset.end, context.currentTime + preset.duration);
    gain.gain.setValueAtTime(name === "crash" ? 0.18 : 0.09, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + preset.duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start();
    oscillator.stop(context.currentTime + preset.duration);
  }

  startMusic(): void {
    const context = this.getContext();
    if (!context || !this.master || this.musicOscillators.length > 0) return;
    this.musicGain = context.createGain();
    this.musicGain.gain.value = this.enabled ? 0.018 : 0;
    this.musicGain.connect(this.master);
    for (const frequency of [55, 82.41, 110]) {
      const oscillator = context.createOscillator();
      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      oscillator.connect(this.musicGain);
      oscillator.start();
      this.musicOscillators.push(oscillator);
    }
  }

  stopMusic(): void {
    for (const oscillator of this.musicOscillators) {
      try { oscillator.stop(); } catch { /* já encerrado */ }
    }
    this.musicOscillators = [];
    this.musicGain?.disconnect();
    this.musicGain = null;
  }

  dispose(): void {
    this.stopMusic();
    if (this.context) void this.context.close();
    this.context = null;
    this.master = null;
  }
}