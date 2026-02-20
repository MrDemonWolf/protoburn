import type { SoundTierConfig } from "./sound-tiers";

const CROSSFADE_MS = 500;

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private volume = 0.5;

  // Ambient layer nodes
  private crackleNodes: { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
  private rumbleNodes: { osc1: OscillatorNode; osc2: OscillatorNode; lfo: OscillatorNode; lfoGain: GainNode; gain: GainNode } | null = null;
  private hissNodes: { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null = null;
  private alarmNodes: { osc: OscillatorNode; gain: GainNode; sweepInterval: ReturnType<typeof setInterval> } | null = null;

  private crackleInterval: ReturnType<typeof setInterval> | null = null;
  private currentConfig: SoundTierConfig | null = null;

  ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx!.currentTime, 0.05);
    }
  }

  setTier(config: SoundTierConfig) {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const fadeTime = CROSSFADE_MS / 1000;

    this.currentConfig = config;

    // --- Crackling layer ---
    if (config.crackle) {
      if (!this.crackleNodes) {
        this.crackleNodes = this.createCrackleLayer(ctx);
      }
      this.crackleNodes.gain.gain.setTargetAtTime(config.crackle.volume, now, fadeTime);
      this.crackleNodes.filter.frequency.setTargetAtTime(
        2000 + config.crackle.rate * 100,
        now,
        fadeTime,
      );
      // Update crackle burst rate
      this.setupCrackleBursts(config.crackle.rate);
    } else {
      this.fadeCrackle(now, fadeTime);
    }

    // --- Rumble layer ---
    if (config.rumble) {
      if (!this.rumbleNodes) {
        this.rumbleNodes = this.createRumbleLayer(ctx);
      }
      this.rumbleNodes.gain.gain.setTargetAtTime(config.rumble.volume, now, fadeTime);
      this.rumbleNodes.osc1.frequency.setTargetAtTime(config.rumble.frequency, now, fadeTime);
      this.rumbleNodes.osc2.frequency.setTargetAtTime(config.rumble.frequency * 1.02, now, fadeTime);
    } else {
      this.fadeRumble(now, fadeTime);
    }

    // --- Hiss layer ---
    if (config.hiss) {
      if (!this.hissNodes) {
        this.hissNodes = this.createHissLayer(ctx);
      }
      this.hissNodes.gain.gain.setTargetAtTime(config.hiss.volume, now, fadeTime);
    } else {
      this.fadeHiss(now, fadeTime);
    }

    // --- Alarm layer (meltdown only) ---
    if (config.alarm) {
      if (!this.alarmNodes) {
        this.alarmNodes = this.createAlarmLayer(ctx);
      }
      this.alarmNodes.gain.gain.setTargetAtTime(config.alarm.volume, now, fadeTime);
    } else {
      this.fadeAlarm(now, fadeTime);
    }
  }

  stopAmbient() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const fadeTime = CROSSFADE_MS / 1000;
    this.fadeCrackle(now, fadeTime);
    this.fadeRumble(now, fadeTime);
    this.fadeHiss(now, fadeTime);
    this.fadeAlarm(now, fadeTime);
    this.currentConfig = null;
  }

  playClick() {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.master!);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  playKonamiExplosion() {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // Noise burst with LP sweep
    const bufferSize = ctx.sampleRate * 0.5;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = "lowpass";
    lpFilter.frequency.setValueAtTime(5000, now);
    lpFilter.frequency.exponentialRampToValueAtTime(200, now + 0.5);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    noiseSrc.connect(lpFilter);
    lpFilter.connect(noiseGain);
    noiseGain.connect(this.master!);
    noiseSrc.start(now);
    noiseSrc.stop(now + 0.5);

    // Sub-bass thud
    const subOsc = ctx.createOscillator();
    subOsc.type = "sine";
    subOsc.frequency.value = 50;
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    subOsc.connect(subGain);
    subGain.connect(this.master!);
    subOsc.start(now);
    subOsc.stop(now + 0.3);

    // Rising whoosh
    const whooshOsc = ctx.createOscillator();
    whooshOsc.type = "sawtooth";
    whooshOsc.frequency.setValueAtTime(100, now);
    whooshOsc.frequency.exponentialRampToValueAtTime(2000, now + 0.4);
    const whooshFilter = ctx.createBiquadFilter();
    whooshFilter.type = "bandpass";
    whooshFilter.frequency.value = 1000;
    whooshFilter.Q.value = 0.5;
    const whooshGain = ctx.createGain();
    whooshGain.gain.setValueAtTime(0.15, now);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    whooshOsc.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(this.master!);
    whooshOsc.start(now);
    whooshOsc.stop(now + 0.4);
  }

  playTierTransition(from: string, to: string) {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const tierOrder = ["cold", "spark", "warm", "burning", "blazing", "inferno", "meltdown"];
    const fromIdx = tierOrder.indexOf(from);
    const toIdx = tierOrder.indexOf(to);
    const rising = toIdx > fromIdx;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    const startFreq = rising ? 300 : 600;
    const endFreq = rising ? 600 : 300;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.master!);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  suspend() {
    this.ctx?.suspend();
  }

  resume() {
    if (this.ctx?.state === "suspended") {
      this.ctx.resume();
    }
  }

  dispose() {
    this.stopAmbient();
    if (this.crackleInterval) {
      clearInterval(this.crackleInterval);
      this.crackleInterval = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.master = null;
    }
  }

  // --- Private layer creation ---

  private createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const length = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private createCrackleLayer(ctx: AudioContext) {
    const buffer = this.createNoiseBuffer(ctx, 2);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 3000;
    filter.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master!);
    source.start();

    return { source, filter, gain };
  }

  private setupCrackleBursts(rate: number) {
    if (this.crackleInterval) {
      clearInterval(this.crackleInterval);
    }
    if (!this.crackleNodes || !this.ctx) return;

    const intervalMs = 1000 / rate;
    this.crackleInterval = setInterval(() => {
      if (!this.crackleNodes || !this.ctx) return;
      const now = this.ctx.currentTime;
      const burstDuration = 0.02 + Math.random() * 0.03;
      // Quick gain burst to simulate a crackle pop
      this.crackleNodes.gain.gain.setTargetAtTime(
        (this.currentConfig?.crackle?.volume ?? 0.15) * (1 + Math.random()),
        now,
        0.005,
      );
      this.crackleNodes.gain.gain.setTargetAtTime(
        this.currentConfig?.crackle?.volume ?? 0.15,
        now + burstDuration,
        0.01,
      );
    }, intervalMs);
  }

  private createRumbleLayer(ctx: AudioContext) {
    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.value = 50;

    const osc2 = ctx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.value = 51;

    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = "lowpass";
    lpFilter.frequency.value = 120;

    // LFO for breathing effect
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc1.connect(lpFilter);
    osc2.connect(lpFilter);
    lpFilter.connect(gain);
    gain.connect(this.master!);

    osc1.start();
    osc2.start();
    lfo.start();

    return { osc1, osc2, lfo, lfoGain, gain };
  }

  private createHissLayer(ctx: AudioContext) {
    const buffer = this.createNoiseBuffer(ctx, 2);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1500;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master!);
    source.start();

    return { source, filter, gain };
  }

  private createAlarmLayer(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 400;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(this.master!);
    osc.start();

    // Sweep 400-900Hz on 1.2s loop
    const sweepInterval = setInterval(() => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.6);
      osc.frequency.linearRampToValueAtTime(400, now + 1.2);
    }, 1200);

    return { osc, gain, sweepInterval };
  }

  // --- Fade helpers ---

  private fadeCrackle(now: number, fadeTime: number) {
    if (this.crackleNodes) {
      this.crackleNodes.gain.gain.setTargetAtTime(0, now, fadeTime);
      const nodes = this.crackleNodes;
      setTimeout(() => {
        try { nodes.source.stop(); } catch { /* already stopped */ }
      }, fadeTime * 3000);
      this.crackleNodes = null;
    }
    if (this.crackleInterval) {
      clearInterval(this.crackleInterval);
      this.crackleInterval = null;
    }
  }

  private fadeRumble(now: number, fadeTime: number) {
    if (this.rumbleNodes) {
      this.rumbleNodes.gain.gain.setTargetAtTime(0, now, fadeTime);
      const nodes = this.rumbleNodes;
      setTimeout(() => {
        try {
          nodes.osc1.stop();
          nodes.osc2.stop();
          nodes.lfo.stop();
        } catch { /* already stopped */ }
      }, fadeTime * 3000);
      this.rumbleNodes = null;
    }
  }

  private fadeHiss(now: number, fadeTime: number) {
    if (this.hissNodes) {
      this.hissNodes.gain.gain.setTargetAtTime(0, now, fadeTime);
      const nodes = this.hissNodes;
      setTimeout(() => {
        try { nodes.source.stop(); } catch { /* already stopped */ }
      }, fadeTime * 3000);
      this.hissNodes = null;
    }
  }

  private fadeAlarm(now: number, fadeTime: number) {
    if (this.alarmNodes) {
      this.alarmNodes.gain.gain.setTargetAtTime(0, now, fadeTime);
      const nodes = this.alarmNodes;
      setTimeout(() => {
        try {
          nodes.osc.stop();
          clearInterval(nodes.sweepInterval);
        } catch { /* already stopped */ }
      }, fadeTime * 3000);
      this.alarmNodes = null;
    }
  }
}
