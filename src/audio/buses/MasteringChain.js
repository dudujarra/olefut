/**
 * MasteringChain.js
 * Master bus glue per manual seção 2.13.
 *
 * Ordem fixa: EQ3 → MultibandCompressor → Tape (WaveShaper arctan) → Limiter -0.3 dBTP → Destination
 *
 * Target: -7 LUFS integrado pra club-ready.
 * Inter-sample peaks evitados via Limiter -0.3 dBTP.
 */

import { makeTapeCurve } from '../utils/tape-curve.js';

export class MasteringChain {
  constructor(Tone, options = {}) {
    this.Tone = Tone;
    this.input = new Tone.Gain(1);

    // EQ corretivo
    this.eq = new Tone.EQ3({
      low: options.eqLow ?? 0.5,
      mid: options.eqMid ?? -0.5,
      high: options.eqHigh ?? 1,
      lowFrequency: 200,
      highFrequency: 4000,
    });

    // 3-band multiband compressor (low/mid/high split @ 200/2500 Hz)
    this.mbComp = new Tone.MultibandCompressor({
      lowFrequency: 200,
      highFrequency: 2500,
      low: { threshold: -18, ratio: 3, attack: 0.03, release: 0.15 },
      mid: { threshold: -16, ratio: 2.5, attack: 0.015, release: 0.1 },
      high: { threshold: -14, ratio: 2, attack: 0.005, release: 0.05 },
    });

    // Tape saturation sutil — drive 1.4 (gentle warmth)
    this.tape = new Tone.WaveShaper(makeTapeCurve(1.4), 2048);
    this.tape.oversample = '2x';

    // Limiter final — -0.3 dBTP evita inter-sample peaks
    this.limiter = new Tone.Limiter(-0.3);

    // Chain: input → EQ → MBComp → Tape → Limiter → Destination
    this.input.chain(
      this.eq,
      this.mbComp,
      this.tape,
      this.limiter,
      Tone.getDestination()
    );
  }

  connect(node) {
    this.input.connect(node);
    return this;
  }

  dispose() {
    this.input.dispose();
    this.eq.dispose();
    this.mbComp.dispose();
    this.tape.dispose();
    this.limiter.dispose();
  }
}
