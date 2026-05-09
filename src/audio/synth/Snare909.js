/**
 * Snare909.js
 * TR-909 snare per manual seção 2.3.
 *
 * 2 layers paralelos:
 * - Tonal: 2× triangle 200Hz + 330Hz, env decay 0.1s
 * - Noise: white → highpass 1.5kHz Q=0.7, env decay 0.18s
 */

export class Snare909 {
  constructor(Tone, destination) {
    this.Tone = Tone;
    this.out = new Tone.Gain(0.7);

    // === TONAL LAYER ===
    this.tone1 = new Tone.Oscillator({ type: 'triangle', frequency: 200 }).start();
    this.tone2 = new Tone.Oscillator({ type: 'triangle', frequency: 330 }).start();
    this.toneEnv = new Tone.AmplitudeEnvelope({
      attack: 0.001,
      decay: 0.1,
      sustain: 0,
      release: 0.05,
    });
    this.toneMix = new Tone.Gain(0.5);
    this.tone1.connect(this.toneMix);
    this.tone2.connect(this.toneMix);
    this.toneMix.connect(this.toneEnv);
    this.toneEnv.connect(this.out);

    // === NOISE LAYER ===
    this.noise = new Tone.Noise('white').start();
    this.noiseFilter = new Tone.Filter({
      type: 'highpass',
      frequency: 1500,
      Q: 0.7,
    });
    this.noiseEnv = new Tone.AmplitudeEnvelope({
      attack: 0.001,
      decay: 0.18,
      sustain: 0,
      release: 0.1,
    });
    this.noise.chain(this.noiseFilter, this.noiseEnv, this.out);

    if (destination) {
      this.out.connect(destination);
    }
  }

  trigger(time, velocity = 1) {
    this.toneEnv.triggerAttackRelease(0.08, time, velocity);
    this.noiseEnv.triggerAttackRelease(0.15, time, velocity);
  }

  connect(node) {
    this.out.connect(node);
    return this;
  }

  dispose() {
    this.tone1.dispose();
    this.tone2.dispose();
    this.toneEnv.dispose();
    this.toneMix.dispose();
    this.noise.dispose();
    this.noiseFilter.dispose();
    this.noiseEnv.dispose();
    this.out.dispose();
  }
}
