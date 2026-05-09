/**
 * ToneSynthesis.js
 * High-end 16-bit SNES-style house music synthesis via Tone.js
 * Factories para cada vertente + master chain
 */

import * as Tone from 'tone';

export class ToneSynthesis {
  constructor(vertente = 'tech', bpm = 120) {
    this.vertente = vertente;
    this.bpm = bpm;
    this.synths = {};
    this.effects = {};
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await Tone.start();
    this.setupMasterChain();
    this.setupSynths();
    this.initialized = true;
  }

  setupMasterChain() {
    // Master: reverb → compressor → limiter → destination
    this.effects.reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.15
    }).toDestination();

    this.effects.compressor = new Tone.Compressor({
      threshold: -30,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    }).connect(this.effects.reverb);

    this.effects.limiter = new Tone.Limiter(-6).connect(this.effects.compressor);
    this.master = this.effects.limiter;
  }

  setupSynths() {
    // Deep house: fat bass + warm pad
    if (this.vertente === 'deep') {
      this.synths.bass = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth', count: 3, partials: [1, 2, 3] },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.15, release: 0.2 }
      }).connect(this.master);

      this.synths.pad = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle', partials: [1, 3, 5, 7] },
        envelope: { attack: 0.15, decay: 0.5, sustain: 0.4, release: 0.8 }
      }).connect(this.master);

      this.synths.kick = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0 }
      }).connect(this.master);

      this.synths.hihat = new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
        harmonicity: 12,
        resonance: 800,
        octaves: 1
      }).connect(this.master);
    }

    // Tech house: industrial kick + tight bass
    else if (this.vertente === 'tech') {
      this.synths.kick = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.0005, decay: 0.08, sustain: 0, release: 0 }
      }).connect(this.master);

      this.synths.bass = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square', width: 0.6 },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.15 }
      }).connect(this.master);

      this.synths.stab = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.05, release: 0.1 }
      }).connect(this.master);

      this.synths.hihat = new Tone.MetalSynth({
        frequency: 250,
        envelope: { attack: 0.0005, decay: 0.06, release: 0.005 },
        harmonicity: 15,
        resonance: 900,
        octaves: 1
      }).connect(this.master);
    }

    // Progressive: layered buildable
    else if (this.vertente === 'progressive') {
      this.synths.kick = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0 }
      }).connect(this.master);

      this.synths.bass = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth', count: 2 },
        envelope: { attack: 0.03, decay: 0.3, sustain: 0.2, release: 0.2 }
      }).connect(this.master);

      this.synths.pad = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle', partials: [1, 2, 4, 8] },
        envelope: { attack: 0.2, decay: 0.6, sustain: 0.5, release: 1.0 }
      }).connect(this.master);

      this.synths.melody = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square', width: 0.75 },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.15 }
      }).connect(this.master);
    }

    // Funky: bouncy grooves + latin percussion
    else if (this.vertente === 'funky') {
      this.synths.kick = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0 }
      }).connect(this.master);

      this.synths.bass = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.15, release: 0.15 }
      }).connect(this.master);

      this.synths.melody = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square', width: 0.6 },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.1 }
      }).connect(this.master);

      this.synths.clave = new Tone.MetalSynth({
        frequency: 150,
        envelope: { attack: 0.001, decay: 0.05, release: 0.02 },
        harmonicity: 8,
        resonance: 600
      }).connect(this.master);
    }

    // Ambient: atmospheric, minimal
    else if (this.vertente === 'ambient') {
      this.synths.pad1 = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle', partials: [1, 3, 5, 7, 9] },
        envelope: { attack: 0.3, decay: 0.8, sustain: 0.6, release: 1.5 }
      }).connect(this.master);

      this.synths.pad2 = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.5, decay: 1.0, sustain: 0.5, release: 2.0 }
      }).connect(this.master);

      this.synths.kick = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0 }
      }).connect(this.master);

      this.synths.hihat = new Tone.MetalSynth({
        frequency: 120,
        envelope: { attack: 0.001, decay: 0.1, release: 0.05 },
        harmonicity: 6,
        resonance: 400,
        octaves: 1
      }).connect(this.master);
    }
  }

  // Play groove pattern (returns Promise for WAV recording)
  async playGroove(duration = 8) {
    const now = Tone.now();
    const method = `${this.vertente}Groove`;

    if (typeof this[method] === 'function') {
      this[method](now, duration);
    }

    // Espera terminar
    await new Promise(resolve => setTimeout(resolve, duration * 1000 * (60 / this.bpm)));
  }

  deepHouseGroove(now, bars = 8) {
    const beatDuration = (60 / this.bpm);

    // Kick: straight 4/4
    for (let i = 0; i < bars * 4; i++) {
      this.synths.kick.triggerAttackRelease('C1', '0.1', now + i * beatDuration);
    }

    // Bass: syncopated
    const bassNotes = ['C2', 'C2', 'D#2', 'C2'];
    for (let bar = 0; bar < bars; bar++) {
      for (let i = 0; i < bassNotes.length; i++) {
        const time = now + (bar * 4 + i) * beatDuration * 0.5;
        this.synths.bass.triggerAttackRelease(bassNotes[i], beatDuration * 0.45, time);
      }
    }

    // Pad: long, sparse
    const chords = [['C3', 'E3', 'G3'], ['D#3', 'F#3', 'A#3']];
    for (let i = 0; i < chords.length; i++) {
      const time = now + i * 4 * beatDuration;
      chords[i].forEach(note => {
        this.synths.pad.triggerAttackRelease(note, 4 * beatDuration * 0.9, time);
      });
    }
  }

  techHouseGroove(now, bars = 8) {
    const beatDuration = (60 / this.bpm);

    // Kick: tight, every quarter
    for (let i = 0; i < bars * 4; i++) {
      this.synths.kick.triggerAttackRelease('C1', '0.08', now + i * beatDuration * 0.5);
    }

    // Bass: driving
    const bassLine = ['C2', 'C2', 'C2', 'A#1'];
    for (let bar = 0; bar < bars; bar++) {
      for (let i = 0; i < bassLine.length; i++) {
        const time = now + (bar * 4 + i) * beatDuration * 0.5;
        this.synths.bass.triggerAttackRelease(bassLine[i], beatDuration * 0.4, time);
      }
    }

    // Stab: percussive chords
    const stabs = [['C3', 'E3', 'G3'], ['G#3', 'B3', 'D#4']];
    for (let i = 0; i < stabs.length; i++) {
      const time = now + i * 4 * beatDuration;
      stabs[i].forEach(note => {
        this.synths.stab.triggerAttackRelease(note, beatDuration * 0.12, time);
      });
    }
  }

  progressiveHouseGroove(now, bars = 8) {
    const beatDuration = (60 / this.bpm);

    // Kick: building
    for (let i = 0; i < bars * 4; i++) {
      const decay = 0.08 + (i * 0.005);
      this.synths.kick.triggerAttackRelease('C1', decay, now + i * beatDuration * 0.5);
    }

    // Bass: minimal
    this.synths.bass.triggerAttackRelease('C2', 4 * beatDuration, now);
    this.synths.bass.triggerAttackRelease('G1', 4 * beatDuration, now + 2 * 4 * beatDuration);

    // Pad: swelling
    ['C3', 'E3', 'G3'].forEach(note => {
      this.synths.pad.triggerAttackRelease(note, 8 * beatDuration, now);
    });

    // Melody: buildup (last 4 bars)
    for (let i = 0; i < 4; i++) {
      const note = ['C4', 'E4', 'G4', 'C5'][i];
      const time = now + (bars - 4 + i) * beatDuration * 4;
      this.synths.melody.triggerAttackRelease(note, beatDuration * 3, time);
    }
  }

  funkyHouseGroove(now, bars = 8) {
    const beatDuration = (60 / this.bpm);

    // Kick: syncopated
    const kickPattern = [0, 0.75, 2, 2.5, 3, 3.75];
    for (let bar = 0; bar < bars; bar++) {
      kickPattern.forEach(offset => {
        const time = now + (bar * 4 + offset) * beatDuration * 0.5;
        this.synths.kick.triggerAttackRelease('C1', '0.12', time);
      });
    }

    // Bass: bouncy
    const bassLine = ['C2', 'D#2', 'F2', 'D#2', 'C2', 'C2'];
    for (let bar = 0; bar < bars; bar++) {
      for (let i = 0; i < bassLine.length; i++) {
        const time = now + (bar * 6 + i) * beatDuration * (2 / 3);
        this.synths.bass.triggerAttackRelease(bassLine[i], beatDuration * 0.5, time);
      }
    }

    // Melody: retrô
    const melody = ['C4', 'E4', 'G4', 'A#4', 'G4', 'E4'];
    for (let bar = 0; bar < bars; bar++) {
      for (let i = 0; i < melody.length; i++) {
        const time = now + (bar * 6 + i) * beatDuration * (2 / 3);
        this.synths.melody.triggerAttackRelease(melody[i], beatDuration * 0.4, time);
      }
    }
  }

  ambientHouseGroove(now, bars = 8) {
    const beatDuration = (60 / this.bpm);

    // Kick: breathing
    for (let bar = 0; bar < bars; bar += 4) {
      this.synths.kick.triggerAttackRelease('C1', '0.1', now + bar * beatDuration);
    }

    // Pad: long, ambient
    ['C2', 'E2', 'G2'].forEach(note => {
      this.synths.pad1.triggerAttackRelease(note, bars * 4 * beatDuration * 0.9, now);
    });
    ['C3', 'E3', 'G3'].forEach(note => {
      this.synths.pad2.triggerAttackRelease(note, bars * 4 * beatDuration * 0.9, now);
    });

    // Sparse hihat
    for (let i = 0; i < bars; i += 2) {
      this.synths.hihat.triggerAttackRelease('32n', now + i * 4 * beatDuration);
    }
  }

  dispose() {
    Object.values(this.synths).forEach(s => s.dispose?.());
    Object.values(this.effects).forEach(e => e.dispose?.());
  }
}
