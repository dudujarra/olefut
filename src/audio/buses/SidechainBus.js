/**
 * SidechainBus.js
 * Real sidechain via Follower + WaveShaper inverter per manual seção 2.8 Opção A.
 *
 * NÃO usa Tone.Compressor (Web Audio DynamicsCompressorNode não tem sidechain key).
 *
 * Routing:
 *   kickSource → Follower(0.005, 0.15) → WaveShaper(invert+offset) → duckGain.gain
 *   input(bass/pads) → duckGain → output → master
 *
 * Ducking depth: 0.7 → -10dB pumping no kick hit.
 */

export class SidechainBus {
  constructor(Tone, kickSource, options = {}) {
    this.Tone = Tone;
    const duckDepth = options.depth ?? 0.7;
    const attack = options.attack ?? 0.005;
    const release = options.release ?? 0.15;

    this.input = new Tone.Gain(1);
    this.duckGain = new Tone.Gain(1);
    this.output = new Tone.Gain(1);

    this.input.connect(this.duckGain).connect(this.output);

    // Envelope follower com smoothing rápido
    this.follower = new Tone.Follower(attack, release);

    // WaveShaper inverte + escala: input 0..1 → output 1..0
    this.inverter = new Tone.WaveShaper((x) => {
      return Math.max(0, 1 - x * duckDepth);
    });

    // Cadeia: kick → follower → inverter → duckGain.gain
    kickSource.connect(this.follower);
    this.follower.connect(this.inverter);
    this.inverter.connect(this.duckGain.gain);
  }

  connect(node) {
    this.output.connect(node);
    return this;
  }

  dispose() {
    this.input.dispose();
    this.duckGain.dispose();
    this.output.dispose();
    this.follower.dispose();
    this.inverter.dispose();
  }
}
