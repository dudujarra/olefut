/**
 * Kick909.js
 * TR-909 kick autêntico per manual seção 2.1.
 *
 * 3 camadas paralelas:
 * (a) BODY: triangle 50Hz + Chebyshev order 3 + amp env exponential
 *     + pitch env 150Hz→50Hz em 30ms (THE 909 thump)
 * (b) CLICK: white noise → bandpass 3kHz Q=1.2 → very short env (5-10ms)
 * (c) Optional sub puro senoidal (não usado na versão atual)
 *
 * NÃO usa Tone.MembraneSynth — manual confirma que é insuficiente.
 */

export class Kick909 {
  constructor(Tone, destination) {
    this.Tone = Tone;
    this.out = new Tone.Gain(0.9);

    // === BODY: triangle → pitch env → Chebyshev → amp env ===
    this.body = new Tone.Oscillator({
      type: 'triangle',
      frequency: 50,
    }).start();

    // Pitch env: 50 * 2^1.6 ≈ 152Hz peak → 50Hz em 30ms
    this.pitchEnv = new Tone.FrequencyEnvelope({
      attack: 0.001,
      decay: 0.03,
      sustain: 0,
      release: 0.001,
      baseFrequency: 50,
      octaves: 1.6,
      exponent: 2.5,
    });
    this.pitchEnv.connect(this.body.frequency);

    // Saturação Chebyshev ímpar — "Roland dirt" (4x³+3x order 3)
    this.saturator = new Tone.Chebyshev(3);

    this.bodyEnv = new Tone.AmplitudeEnvelope({
      attack: 0.001,
      decay: 0.45,
      sustain: 0,
      release: 0.05,
      attackCurve: 'exponential',
      releaseCurve: 'exponential',
    });

    this.body.chain(this.saturator, this.bodyEnv, this.out);

    // === CLICK: white noise → bandpass 3kHz Q=1.2 → short env ===
    this.clickNoise = new Tone.Noise('white').start();
    this.clickFilter = new Tone.Filter({
      type: 'bandpass',
      frequency: 3000,
      Q: 1.2,
    });
    this.clickEnv = new Tone.AmplitudeEnvelope({
      attack: 0.0005,
      decay: 0.008,
      sustain: 0,
      release: 0.005,
    });
    this.clickGain = new Tone.Gain(0.4);

    this.clickNoise.chain(
      this.clickFilter,
      this.clickEnv,
      this.clickGain,
      this.out
    );

    if (destination) {
      this.out.connect(destination);
    }
  }

  /**
   * Trigger kick at scheduled time.
   * @param {number} time - Tone.js time
   * @param {number} velocity - 0..1
   */
  trigger(time, velocity = 1) {
    this.pitchEnv.triggerAttackRelease(0.05, time);
    this.bodyEnv.triggerAttackRelease(0.3, time, velocity);
    this.clickEnv.triggerAttackRelease(0.01, time, velocity * 0.8);
  }

  connect(node) {
    this.out.connect(node);
    return this;
  }

  dispose() {
    this.body.dispose();
    this.pitchEnv.dispose();
    this.saturator.dispose();
    this.bodyEnv.dispose();
    this.clickNoise.dispose();
    this.clickFilter.dispose();
    this.clickEnv.dispose();
    this.clickGain.dispose();
    this.out.dispose();
  }
}
