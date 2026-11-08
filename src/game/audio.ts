type Effect = 'start' | 'count' | 'go' | 'lap' | 'finish' | 'crash' | 'boost';

export interface AudioFrame {
  active: boolean;
  speed: number;
  rpm: number;
  throttle: boolean;
  braking: boolean;
  drifting: boolean;
  offRoad: boolean;
  nitro: boolean;
  rain: boolean;
}

/** Original, synthesized race audio. All nodes are created only after a user gesture. */
export class RaceAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private engineLow?: OscillatorNode;
  private engineHigh?: OscillatorNode;
  private lowGain?: GainNode;
  private highGain?: GainNode;
  private lowFilter?: BiquadFilterNode;
  private roadGain?: GainNode;
  private roadFilter?: BiquadFilterNode;
  private tireGain?: GainNode;
  private tireFilter?: BiquadFilterNode;
  private windGain?: GainNode;
  private boostGain?: GainNode;
  private muted = false;
  private lastCrash = 0;
  private lastBoost = 0;

  get enabled(): boolean { return !this.muted; }

  setEnabled(enabled: boolean): void {
    this.muted = !enabled;
    if (this.context && this.master) this.master.gain.setTargetAtTime(enabled ? .7 : 0, this.context.currentTime, .04);
  }

  unlock(): void {
    if (this.context) { void this.context.resume(); return; }
    try {
      const context = new AudioContext();
      this.context = context;
      const master = context.createGain();
      master.gain.value = this.muted ? 0 : .7;
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -16;
      limiter.ratio.value = 8;
      limiter.attack.value = .003;
      limiter.release.value = .18;
      master.connect(limiter).connect(context.destination);
      this.master = master;

      const low = context.createOscillator();
      const lowFilter = context.createBiquadFilter();
      const lowGain = context.createGain();
      low.type = 'sawtooth';
      lowFilter.type = 'lowpass'; lowFilter.frequency.value = 180;
      lowGain.gain.value = 0;
      low.connect(lowFilter).connect(lowGain).connect(master); low.start();
      this.engineLow = low; this.lowFilter = lowFilter; this.lowGain = lowGain;

      const high = context.createOscillator();
      const highFilter = context.createBiquadFilter();
      const highGain = context.createGain();
      high.type = 'triangle';
      highFilter.type = 'bandpass'; highFilter.Q.value = .7; highFilter.frequency.value = 400;
      highGain.gain.value = 0;
      high.connect(highFilter).connect(highGain).connect(master); high.start();
      this.engineHigh = high; this.highGain = highGain;

      const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const samples = noiseBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      const noise = () => { const source = context.createBufferSource(); source.buffer = noiseBuffer; source.loop = true; return source; };
      const route = (type: BiquadFilterType, frequency: number) => {
        const source = noise(), filter = context.createBiquadFilter(), gain = context.createGain();
        filter.type = type; filter.frequency.value = frequency; gain.gain.value = 0;
        source.connect(filter).connect(gain).connect(master); source.start();
        return { filter, gain };
      };
      const road = route('lowpass', 270); this.roadFilter = road.filter; this.roadGain = road.gain;
      const tire = route('bandpass', 1300); tire.filter.Q.value = 1.2; this.tireFilter = tire.filter; this.tireGain = tire.gain;
      this.windGain = route('highpass', 1600).gain;
      this.boostGain = route('bandpass', 530).gain;
      void context.resume();
    } catch { /* Audio remains optional on browsers without Web Audio. */ }
  }

  update(frame: AudioFrame): void {
    const c = this.context;
    if (!c || !this.engineLow || !this.engineHigh) return;
    const now = c.currentTime;
    const rpm = Math.max(0, Math.min(1, frame.rpm || 0));
    const speed = Math.max(0, Math.min(1, frame.speed / 750));
    const on = frame.active && !this.muted;
    this.engineLow.frequency.setTargetAtTime(42 + rpm * 84 + speed * 15, now, .065);
    this.engineHigh.frequency.setTargetAtTime(85 + rpm * 245 + speed * 50, now, .05);
    this.lowFilter?.frequency.setTargetAtTime(160 + rpm * 620 + (frame.throttle ? 160 : 0), now, .08);
    this.lowGain?.gain.setTargetAtTime(on ? .055 + rpm * .038 + (frame.throttle ? .025 : 0) : 0, now, .11);
    this.highGain?.gain.setTargetAtTime(on ? .008 + rpm * .018 + (frame.throttle ? .016 : 0) : 0, now, .08);
    this.roadFilter?.frequency.setTargetAtTime(140 + speed * 950, now, .12);
    this.roadGain?.gain.setTargetAtTime(on ? .006 + speed * (frame.offRoad ? .14 : frame.rain ? .055 : .033) : 0, now, .09);
    this.tireFilter?.frequency.setTargetAtTime(frame.braking ? 1050 : 1500 + speed * 1400, now, .08);
    this.tireGain?.gain.setTargetAtTime(on && (frame.drifting || frame.braking && frame.speed > 90) ? .07 + speed * .15 : 0, now, .04);
    this.windGain?.gain.setTargetAtTime(on ? speed * speed * .032 : 0, now, .12);
    this.boostGain?.gain.setTargetAtTime(on && frame.nitro ? .12 : 0, now, .06);
  }

  effect(name: Effect, strength = 1): void {
    const c = this.context, master = this.master;
    if (!c || !master || this.muted) return;
    const now = c.currentTime;
    if (name === 'crash') { if (now - this.lastCrash < .25) return; this.lastCrash = now; }
    if (name === 'boost') { if (now - this.lastBoost < .5) return; this.lastBoost = now; }
    const tone = (from: number, to: number, duration: number, volume: number, type: OscillatorType, delay = 0) => {
      const oscillator = c.createOscillator(), gain = c.createGain(), start = now + delay;
      oscillator.type = type; oscillator.frequency.setValueAtTime(from, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, to), start + duration);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume * strength), start + Math.min(.025, duration * .2));
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain).connect(master); oscillator.start(start); oscillator.stop(start + duration + .02);
    };
    if (name === 'start') {
      tone(32, 135, .48, .17, 'sawtooth');
      tone(51, 93, .63, .08, 'triangle', .16);
    } else if (name === 'count') tone(440, 330, .13, .085, 'sine');
    else if (name === 'go') { tone(590, 930, .42, .13, 'triangle'); tone(295, 465, .45, .065, 'sine'); }
    else if (name === 'lap') { tone(520, 760, .18, .10, 'sine'); tone(760, 990, .28, .09, 'sine', .13); }
    else if (name === 'finish') {
      for (const [i, pitch] of [392, 494, 587, 784].entries()) tone(pitch, pitch * 1.03, .5, .085, 'triangle', i * .14);
    } else if (name === 'crash') { tone(125, 36, .28, .18, 'sawtooth'); tone(620, 75, .19, .07, 'square'); }
    else if (name === 'boost') tone(80, 310, .38, .075, 'sawtooth');
  }
}
