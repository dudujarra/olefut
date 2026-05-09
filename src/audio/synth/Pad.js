/**
 * Pad.js
 * Analog warm pad per manual seção 2.7.
 *
 * - PolySynth fatsawtooth count: 2 spread: 20
 * - Long envelope (attack 1.2s, release 2.5s)
 * - Chorus 0.3Hz depth 0.5 wet 0.5
 * - Reverb decay 6, wet 0.4 (Larry Heard "Mystery of Love" template)
 *
 * Sub bass pluck — MonoSynth sine + Distortion 0.08 + portamento 0.02.
 */

export class Pad {
  constructor(Tone, destination) {
    this.Tone = Tone;
    this.out = new Tone.Gain(0.6);

    this.synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 6,
      oscillator: { type: 'fatsawtooth', count: 2, spread: 20 },
      envelope: { attack: 1.2, decay: 0.4, sustain: 0.7, release: 2.5 },
    });

    this.filter = new Tone.Filter({ frequency: 2000, type: 'lowpass' });
    this.chorus = new Tone.Chorus({
      frequency: 0.3,
      depth: 0.5,
      wet: 0.5,
    }).start();

    // Reverb is async — caller must await pad.ready before using
    this.reverb = new Tone.Reverb({ decay: 6, wet: 0.4 });
    this.ready = this.reverb.generate();

    this.synth.chain(this.filter, this.chorus, this.reverb, this.out);

    if (destination) {
      this.out.connect(destination);
    }
  }

  /**
   * Trigger chord notes for duration.
   * @param {string[]} notes - e.g. ['D3','F3','A3','C4','E4'] for Dm9
   * @param {string} dur - e.g. '4m'
   * @param {number} time
   */
  triggerChord(notes, dur, time) {
    this.synth.triggerAttackRelease(notes, dur, time);
  }

  connect(node) {
    this.out.connect(node);
    return this;
  }

  dispose() {
    this.synth.dispose();
    this.filter.dispose();
    this.chorus.dispose();
    this.reverb.dispose();
    this.out.dispose();
  }
}

/**
 * Sub bass pluck — for deep house bass line.
 */
export class SubPluck {
  constructor(Tone, destination) {
    this.Tone = Tone;
    this.out = new Tone.Gain(0.7);

    this.synth = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.2 },
      filter: { type: 'lowpass', frequency: 200, rolloff: -12 },
      portamento: 0.02,
    });

    this.subSat = new Tone.Distortion({ distortion: 0.08, wet: 0.3 });

    this.synth.chain(this.subSat, this.out);

    if (destination) {
      this.out.connect(destination);
    }
  }

  triggerNote(note, dur, time, velocity = 0.8) {
    this.synth.triggerAttackRelease(note, dur, time, velocity);
  }

  connect(node) {
    this.out.connect(node);
    return this;
  }

  dispose() {
    this.synth.dispose();
    this.subSat.dispose();
    this.out.dispose();
  }
}
