/**
 * ToneOfflineRenderer.js
 * Batch pre-render 72+ stems via Tone.Offline() (browser context)
 * Coordina renderização, quantização, master chain
 */

export class ToneOfflineRenderer {
  constructor(config = {}) {
    this.config = {
      sampleRate: config.sampleRate || 44100,
      channels: config.channels || 2,
      ...config
    };
  }

  /**
   * Renderiza um stem individual usando Tone.Offline()
   * Espera Tone estar carregado no contexto (browser)
   */
  async renderStem(trackMetadata, Tone) {
    const { id, vertente, bpm, duration } = trackMetadata;

    // Duração em samples
    const durationSeconds = duration;
    const numSamples = this.config.sampleRate * durationSeconds;

    // Renderiza offline
    const offlineContext = new OfflineAudioContext(
      this.config.channels,
      numSamples,
      this.config.sampleRate
    );

    // Reconecta Tone pra contexto offline
    const originalContext = Tone.getContext();
    Tone.setContext(new Tone.Context(offlineContext));

    try {
      // Sintetiza groove
      const synth = await this.synthesizeVertente(vertente, bpm, Tone);
      await this.playGroove(vertente, bpm, durationSeconds, synth, Tone);

      // Renderiza buffer
      const buffer = await offlineContext.startRendering();

      return {
        id,
        buffer,
        vertente,
        bpm,
        duration: durationSeconds,
        sampleRate: this.config.sampleRate,
        channels: this.config.channels
      };
    } finally {
      // Restaura contexto original
      Tone.setContext(originalContext);
    }
  }

  /**
   * Factory synth per-vertente dentro de contexto offline
   */
  async synthesizeVertente(vertente, bpm, Tone) {
    const synths = {};

    switch (vertente) {
      case 'deep':
        synths.bass = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sawtooth', count: 3, partials: [1, 2, 3] },
          envelope: { attack: 0.05, decay: 0.3, sustain: 0.15, release: 0.2 }
        });

        synths.pad = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle', partials: [1, 3, 5, 7] },
          envelope: { attack: 0.15, decay: 0.5, sustain: 0.4, release: 0.8 }
        });

        synths.kick = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0 }
        });

        synths.hihat = new Tone.MetalSynth({
          frequency: 200,
          envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
          harmonicity: 12,
          resonance: 800,
          octaves: 1
        });
        break;

      case 'tech':
        synths.kick = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.0005, decay: 0.08, sustain: 0, release: 0 }
        });

        synths.bass = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'square', width: 0.6 },
          envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.15 }
        });

        synths.stab = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.15, sustain: 0.05, release: 0.1 }
        });

        synths.hihat = new Tone.MetalSynth({
          frequency: 250,
          envelope: { attack: 0.0005, decay: 0.06, release: 0.005 },
          harmonicity: 15,
          resonance: 900,
          octaves: 1
        });
        break;

      case 'progressive':
        synths.kick = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0 }
        });

        synths.bass = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sawtooth', count: 2 },
          envelope: { attack: 0.03, decay: 0.3, sustain: 0.2, release: 0.2 }
        });

        synths.pad = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle', partials: [1, 2, 4, 8] },
          envelope: { attack: 0.2, decay: 0.6, sustain: 0.5, release: 1.0 }
        });

        synths.melody = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'square', width: 0.75 },
          envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.15 }
        });
        break;

      case 'funky':
        synths.kick = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0 }
        });

        synths.bass = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'square' },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.15, release: 0.15 }
        });

        synths.melody = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'square', width: 0.6 },
          envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.1 }
        });

        synths.clave = new Tone.MetalSynth({
          frequency: 150,
          envelope: { attack: 0.001, decay: 0.05, release: 0.02 },
          harmonicity: 8,
          resonance: 600
        });
        break;

      case 'ambient':
        synths.pad1 = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle', partials: [1, 3, 5, 7, 9] },
          envelope: { attack: 0.3, decay: 0.8, sustain: 0.6, release: 1.5 }
        });

        synths.pad2 = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.5, decay: 1.0, sustain: 0.5, release: 2.0 }
        });

        synths.kick = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0 }
        });

        synths.hihat = new Tone.MetalSynth({
          frequency: 120,
          envelope: { attack: 0.001, decay: 0.1, release: 0.05 },
          harmonicity: 6,
          resonance: 400,
          octaves: 1
        });
        break;

      default:
        synths.kick = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0 }
        });
    }

    return synths;
  }

  /**
   * Executa groove pattern (scheduled via Tone)
   */
  async playGroove(vertente, bpm, durationSeconds, synths, Tone) {
    const beatDuration = 60 / bpm;
    const totalBeats = Math.floor(durationSeconds / beatDuration);
    const now = Tone.now();

    // Rota pra método específico
    const method = `${vertente}Groove`;
    if (typeof this[method] === 'function') {
      this[method](now, beatDuration, totalBeats, synths);
    }

    // Aguarda renderização completar
    await new Promise(resolve => {
      setTimeout(resolve, durationSeconds * 1000);
    });
  }

  /**
   * Groove patterns per-vertente
   */
  deepGroove(now, beatDuration, totalBeats, synths) {
    // Kick: straight 4/4
    for (let i = 0; i < totalBeats / 4; i++) {
      synths.kick.triggerAttackRelease('C1', '0.1', now + i * beatDuration * 4);
    }

    // Bass: syncopated
    const bassNotes = ['C2', 'C2', 'D#2', 'C2'];
    for (let i = 0; i < totalBeats / 2; i++) {
      synths.bass.triggerAttackRelease(bassNotes[i % 4], beatDuration * 0.45, now + i * beatDuration);
    }

    // Pad: long chords
    if (synths.pad) {
      const chords = [['C3', 'E3', 'G3'], ['D#3', 'F#3', 'A#3']];
      chords.forEach((chord, idx) => {
        const time = now + idx * 8 * beatDuration;
        if (time < now + totalBeats * beatDuration) {
          chord.forEach(note => {
            synths.pad.triggerAttackRelease(note, 8 * beatDuration * 0.9, time);
          });
        }
      });
    }
  }

  techGroove(now, beatDuration, totalBeats, synths) {
    // Kick: tight 8th notes
    for (let i = 0; i < totalBeats * 2; i++) {
      synths.kick.triggerAttackRelease('C1', '0.08', now + i * beatDuration * 0.5);
    }

    // Bass: driving quarter notes
    const bassLine = ['C2', 'C2', 'C2', 'A#1'];
    for (let i = 0; i < totalBeats; i++) {
      synths.bass.triggerAttackRelease(bassLine[i % 4], beatDuration * 0.4, now + i * beatDuration);
    }

    // Stab: percussive
    if (synths.stab) {
      const stabs = [['C3', 'E3', 'G3'], ['G#3', 'B3', 'D#4']];
      stabs.forEach((chord, idx) => {
        const time = now + idx * 8 * beatDuration;
        if (time < now + totalBeats * beatDuration) {
          chord.forEach(note => {
            synths.stab.triggerAttackRelease(note, beatDuration * 0.12, time);
          });
        }
      });
    }
  }

  progressiveGroove(now, beatDuration, totalBeats, synths) {
    // Kick: building decay
    for (let i = 0; i < totalBeats / 4; i++) {
      const decay = 0.08 + (i * 0.005);
      synths.kick.triggerAttackRelease('C1', Math.min(decay, 0.2), now + i * beatDuration * 4);
    }

    // Bass: minimal, sustained
    synths.bass.triggerAttackRelease('C2', 8 * beatDuration, now);

    // Pad: swelling
    if (synths.pad) {
      ['C3', 'E3', 'G3'].forEach(note => {
        synths.pad.triggerAttackRelease(note, totalBeats * beatDuration, now);
      });
    }

    // Melody: building last third
    if (synths.melody) {
      const melodyNotes = ['C4', 'E4', 'G4', 'C5'];
      const start = Math.floor(totalBeats * 2 / 3);
      melodyNotes.forEach((note, idx) => {
        const time = now + (start + idx * 2) * beatDuration;
        if (time < now + totalBeats * beatDuration) {
          synths.melody.triggerAttackRelease(note, beatDuration * 3, time);
        }
      });
    }
  }

  funkyGroove(now, beatDuration, totalBeats, synths) {
    // Kick: syncopated
    const kickPattern = [0, 0.75, 2, 2.5, 3, 3.75];
    for (let beat = 0; beat < totalBeats; beat += 4) {
      kickPattern.forEach(offset => {
        const time = now + (beat + offset) * beatDuration * 0.5;
        if (time < now + totalBeats * beatDuration) {
          synths.kick.triggerAttackRelease('C1', '0.12', time);
        }
      });
    }

    // Bass: bouncy 6-note pattern
    const bassLine = ['C2', 'D#2', 'F2', 'D#2', 'C2', 'C2'];
    for (let i = 0; i < totalBeats; i++) {
      synths.bass.triggerAttackRelease(bassLine[i % 6], beatDuration * 0.5, now + i * beatDuration * (2 / 3));
    }

    // Melody: retro arpeggio
    if (synths.melody) {
      const melody = ['C4', 'E4', 'G4', 'A#4', 'G4', 'E4'];
      for (let i = 0; i < totalBeats; i++) {
        synths.melody.triggerAttackRelease(melody[i % 6], beatDuration * 0.4, now + i * beatDuration * (2 / 3));
      }
    }
  }

  ambientGroove(now, beatDuration, totalBeats, synths) {
    // Kick: breathing every 4 beats
    for (let i = 0; i < totalBeats / 4; i += 4) {
      synths.kick.triggerAttackRelease('C1', '0.1', now + i * beatDuration);
    }

    // Pads: long, ambient
    if (synths.pad1) {
      ['C2', 'E2', 'G2'].forEach(note => {
        synths.pad1.triggerAttackRelease(note, totalBeats * beatDuration * 0.95, now);
      });
    }

    if (synths.pad2) {
      ['C3', 'E3', 'G3'].forEach(note => {
        synths.pad2.triggerAttackRelease(note, totalBeats * beatDuration * 0.95, now);
      });
    }

    // Sparse hihat every 2 beats
    if (synths.hihat) {
      for (let i = 0; i < totalBeats; i += 8) {
        synths.hihat.triggerAttackRelease('32n', now + i * beatDuration);
      }
    }
  }
}
