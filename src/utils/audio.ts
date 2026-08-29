/**
 * Procedural Web Audio synthesizer for dark atmospheric sounds and effects
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private fireGain: GainNode | null = null;
  private isInitialized: boolean = false;
  private lastFootstepTime: number = 0;
  private lastHeartbeatTime: number = 0;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startAmbientLayers();
      this.isInitialized = true;
    } catch {
      // Audio context might fail on restricted environments
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime, 0.1);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private startAmbientLayers() {
    if (!this.ctx || !this.masterGain) return;

    // 1. Cold howling wind generator (Pink/Brown noise with modulated bandpass)
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      const windNoise = this.ctx.createBufferSource();
      windNoise.buffer = noiseBuffer;
      windNoise.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
      windFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      windNoise.connect(windFilter);
      windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);
      windNoise.start();

      // Slow wind modulation
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(windFilter.frequency);
      lfo.start();

      // 2. Fire crackle ambient layer
      this.fireGain = this.ctx.createGain();
      this.fireGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.fireGain.connect(this.masterGain);
    } catch {
      // Ignore background audio failures
    }
  }

  public updateCampfireProximity(distance: number, campfireRadius: number) {
    if (!this.ctx || !this.fireGain || this.isMuted) return;
    const maxAudibleDist = campfireRadius * 2.5 + 200;
    const norm = Math.max(0, Math.min(1, 1 - distance / maxAudibleDist));
    const targetGain = norm * norm * 0.35;
    this.fireGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);

    // Random crackle pop when near fire
    if (norm > 0.15 && Math.random() < 0.08) {
      this.playFirePop(norm);
    }
  }

  private playFirePop(intensity: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120 + Math.random() * 400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08 * intensity, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Ignore
    }
  }

  public playFootstep() {
    const now = performance.now();
    if (now - this.lastFootstepTime < 280) return;
    this.lastFootstepTime = now;
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(70 + Math.random() * 25, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {
      // Ignore
    }
  }

  public playAttackSwing() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Ignore
    }
  }

  public playEnemyHit() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {
      // Ignore
    }
  }

  public playMonsterScreech() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.28);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // Ignore
    }
  }

  public playChopWood() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.09);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      // Ignore
    }
  }

  public playFeedFire() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      // Sizzle and warm flare chord
      [220, 277, 330, 440].forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.03);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime + idx * 0.03);
        osc.stop(this.ctx.currentTime + 0.42);
      });
    } catch {
      // Ignore
    }
  }

  public playTorchRecharge() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch {
      // Ignore
    }
  }

  public playTorchHalfWarning(urgency: number = 0.5) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      // Urgency factor from 0.0 (near dead) to 1.0 (50% fuel)
      // As fuel gets lower (urgency goes lower), frequency gets slightly higher and shorter
      const pitchMod = urgency <= 0.2 ? 1.25 : urgency <= 0.35 ? 1.1 : 1.0;
      const volMod = urgency <= 0.2 ? 0.28 : 0.2;

      // 1. Two-tone warm, resonant warning chime
      const tones = [
        { freq: 520 * pitchMod, start: 0, dur: 0.14, vol: volMod },
        { freq: 390 * pitchMod, start: 0.09, dur: 0.2, vol: volMod * 1.1 },
      ];

      tones.forEach((t) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(t.freq, this.ctx.currentTime + t.start);
        osc.frequency.exponentialRampToValueAtTime(t.freq * 0.95, this.ctx.currentTime + t.start + t.dur);

        gain.gain.setValueAtTime(t.vol, this.ctx.currentTime + t.start);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + t.start + t.dur);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime + t.start);
        osc.stop(this.ctx.currentTime + t.start + t.dur + 0.04);
      });

      // 2. Torch flame sputter / hiss crackle
      const oscNoise = this.ctx.createOscillator();
      const gainNoise = this.ctx.createGain();
      oscNoise.type = 'sawtooth';
      oscNoise.frequency.setValueAtTime(220 * pitchMod, this.ctx.currentTime);
      oscNoise.frequency.exponentialRampToValueAtTime(70 * pitchMod, this.ctx.currentTime + 0.15);

      gainNoise.gain.setValueAtTime(0.14, this.ctx.currentTime);
      gainNoise.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      oscNoise.connect(gainNoise);
      gainNoise.connect(this.masterGain);
      oscNoise.start();
      oscNoise.stop(this.ctx.currentTime + 0.18);
    } catch {
      // Ignore
    }
  }

  public playPlayerDamage() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // Ignore
    }
  }

  public playHeartbeat() {
    const now = performance.now();
    if (now - this.lastHeartbeatTime < 700) return;
    this.lastHeartbeatTime = now;
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      // Double thud (lub-dub)
      [0, 0.14].forEach((delay) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(65, this.ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + delay + 0.1);

        gain.gain.setValueAtTime(0.28, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + 0.12);
      });
    } catch {
      // Ignore
    }
  }

  public playEmberPickup() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {
      // Ignore
    }
  }

  public playGameOver() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      // Melancholic descending minor drone
      [220, 185, 147, 110, 55].forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.25);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.25 + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime + idx * 0.25);
        osc.stop(this.ctx.currentTime + idx * 0.25 + 1.3);
      });
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundSystem();
