/**
 * Acid303.js
 * TB-303 acid bass autêntico per manual seção 2.5.
 *
 * - MonoSynth saw oscillator
 * - Filter lowpass rolloff: -24, Q: 8
 * - FilterEnvelope: baseFrequency 200, octaves 4
 * - Distortion 0.4 oversample 2x APÓS filter
 * - Slide via setNote() (NÃO retrigger envelope)
 * - Accent: boost simultâneo Q + octaves + velocity
 */

export class Acid303 {
  constructor(Tone, destination) {
    this.Tone = Tone;
    this.lastNote = null;

    this.synth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.05 },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0,
        release: 0.1,
        baseFrequency: 200,
        octaves: 4,
        exponent: 2,
      },
      filter: {
        type: 'lowpass',
        rolloff: -24,
        Q: 8,
      },
      portamento: 0,
    });

    // Distortion APÓS filter (essencial pro screaming acid)
    this.dist = new Tone.Distortion({ distortion: 0.4, oversample: '2x' });
    this.out = new Tone.Gain(0.7);

    this.synth.chain(this.dist, this.out);

    if (destination) {
      this.out.connect(destination);
    }
  }

  /**
   * Play one step of acid pattern.
   * @param {string} note - e.g. 'A1', 'C2'
   * @param {number} time - schedule time
   * @param {string} dur - e.g. '16n'
   * @param {boolean} accent - boost Q + env mod + vel
   * @param {boolean} slide - portamento glide (NO env retrigger)
   */
  playStep(note, time, dur, accent, slide) {
    if (slide && this.lastNote) {
      // Slide: mantém envelope state, só altera frequency via portamento
      this.synth.portamento = 0.06;
      this.synth.setNote(note, time);
    } else {
      this.synth.portamento = 0;

      if (accent) {
        this.synth.filter.Q.setValueAtTime(14, time);
        this.synth.filterEnvelope.octaves = 5.5;
      } else {
        this.synth.filter.Q.setValueAtTime(8, time);
        this.synth.filterEnvelope.octaves = 4;
      }

      const vel = accent ? 1.0 : 0.7;
      this.synth.triggerAttackRelease(note, dur, time, vel);
    }
    this.lastNote = note;
  }

  connect(node) {
    this.out.connect(node);
    return this;
  }

  dispose() {
    this.synth.dispose();
    this.dist.dispose();
    this.out.dispose();
  }
}
