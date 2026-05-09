/**
 * MidiBuilder.js
 * Generate MIDI files programmatically for each vertente + context
 */

export class MidiBuilder {
  static noteToNumber(note) {
    // C4 = 60, C1 = 24, etc
    const notes = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const match = note.match(/([A-G])#?(\d)/);
    if (!match) throw new Error(`Invalid note: ${note}`);
    const [, pitch, octave] = match;
    const pitchNum = notes[pitch] + (note.includes('#') ? 1 : 0);
    return 12 + (parseInt(octave) + 1) * 12 + pitchNum;
  }

  static buildMidi(vertente, bpm = 120, duration = 8) {
    // Simula estrutura MIDI (sem midiutil, generate em mem)
    // Retorna JSON que depois converte pra binary
    const bars = duration;
    const beatDuration = (60 / bpm);
    const ticksPerBeat = 480;
    const tickDuration = beatDuration / ticksPerBeat;

    const midi = {
      format: 0,
      tracks: [
        { name: 'Drums', channel: 9, events: [] },
        { name: 'Bass', channel: 0, events: [] },
        { name: 'Chords', channel: 1, events: [] },
        { name: 'Melody', channel: 2, events: [] }
      ]
    };

    const baseNote = {
      tick: 0,
      type: 'noteOn',
      channel: 0,
      pitch: 60,
      velocity: 100,
      duration: 480
    };

    // Generate patterns by vertente
    switch (vertente) {
      case 'deep':
        MidiBuilder.deepHousePattern(midi, bars, bpm);
        break;
      case 'tech':
        MidiBuilder.techHousePattern(midi, bars, bpm);
        break;
      case 'progressive':
        MidiBuilder.progressiveHousePattern(midi, bars, bpm);
        break;
      case 'funky':
        MidiBuilder.funkyHousePattern(midi, bars, bpm);
        break;
      case 'ambient':
        MidiBuilder.ambientHousePattern(midi, bars, bpm);
        break;
    }

    return midi;
  }

  static deepHousePattern(midi, bars, bpm) {
    const beatTick = 480; // quarter note
    const beatDuration = (60 / bpm);

    // Kick: straight 4/4
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        const tick = bar * beatTick * 4 + beat * beatTick;
        midi.tracks[0].events.push({
          tick,
          type: 'noteOn',
          pitch: 36, // C1 kick
          velocity: 100,
          duration: beatTick * 0.2
        });
      }
    }

    // Bass: syncopated (track 1)
    const bassNotes = [36, 36, 51, 36]; // C2, C2, D#2, C2
    for (let bar = 0; bar < bars; bar++) {
      for (let i = 0; i < bassNotes.length; i++) {
        const tick = bar * beatTick * 4 + i * beatTick * 0.5;
        midi.tracks[1].events.push({
          tick,
          type: 'noteOn',
          pitch: bassNotes[i] + 24, // offset to C2 range
          velocity: 90,
          duration: beatTick * 0.4
        });
      }
    }

    // Pad: long sparse (track 2)
    const padChords = [
      [60, 64, 67], // C3, E3, G3
      [63, 67, 70]  // D#3, F#3, A#3
    ];
    padChords.forEach((chord, idx) => {
      const tick = idx * beatTick * 8;
      chord.forEach(pitch => {
        midi.tracks[2].events.push({
          tick,
          type: 'noteOn',
          pitch: pitch + 12,
          velocity: 70,
          duration: beatTick * 8
        });
      });
    });
  }

  static techHousePattern(midi, bars, bpm) {
    const beatTick = 480;

    // Kick: tight 16ths
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 8; beat++) {
        const tick = bar * beatTick * 4 + beat * beatTick * 0.5;
        midi.tracks[0].events.push({
          tick,
          type: 'noteOn',
          pitch: 36,
          velocity: 100,
          duration: beatTick * 0.1
        });
      }
    }

    // Bass: driving (track 1)
    const bassLine = [36, 36, 36, 35]; // C2, C2, C2, A#1
    for (let bar = 0; bar < bars; bar++) {
      for (let i = 0; i < bassLine.length; i++) {
        const tick = bar * beatTick * 4 + i * beatTick * 0.5;
        midi.tracks[1].events.push({
          tick,
          type: 'noteOn',
          pitch: bassLine[i] + 24,
          velocity: 95,
          duration: beatTick * 0.35
        });
      }
    }

    // Stab chords (track 2)
    const stabs = [
      [60, 64, 67],      // C3, E3, G3
      [63, 67, 70]       // D#3, F#3, A#3
    ];
    stabs.forEach((chord, idx) => {
      const tick = idx * beatTick * 8;
      chord.forEach(pitch => {
        midi.tracks[2].events.push({
          tick,
          type: 'noteOn',
          pitch: pitch + 12,
          velocity: 100,
          duration: beatTick * 0.15
        });
      });
    });
  }

  static progressiveHousePattern(midi, bars, bpm) {
    const beatTick = 480;

    // Kick: building decay
    for (let i = 0; i < bars * 4; i++) {
      const tick = i * beatTick * 0.5;
      const decay = Math.min(beatTick * (0.1 + i * 0.01), beatTick * 0.3);
      midi.tracks[0].events.push({
        tick,
        type: 'noteOn',
        pitch: 36,
        velocity: 100,
        duration: decay
      });
    }

    // Bass: minimal (track 1)
    midi.tracks[1].events.push({
      tick: 0,
      type: 'noteOn',
      pitch: 36 + 24,
      velocity: 85,
      duration: beatTick * 8
    });
    midi.tracks[1].events.push({
      tick: beatTick * 8,
      type: 'noteOn',
      pitch: 43 + 24, // G1
      velocity: 85,
      duration: beatTick * 8
    });

    // Pad: swelling (track 2)
    [60, 64, 67].forEach(pitch => {
      midi.tracks[2].events.push({
        tick: 0,
        type: 'noteOn',
        pitch: pitch + 12,
        velocity: 70,
        duration: beatTick * 16
      });
    });

    // Melody: buildup last 4 bars (track 3)
    const melodyNotes = [60, 64, 67, 72]; // C4, E4, G4, C5
    melodyNotes.forEach((pitch, idx) => {
      const tick = (bars - 4 + idx) * beatTick * 4;
      midi.tracks[3].events.push({
        tick,
        type: 'noteOn',
        pitch,
        velocity: 90,
        duration: beatTick * 3
      });
    });
  }

  static funkyHousePattern(midi, bars, bpm) {
    const beatTick = 480;

    // Kick: syncopated
    const kickPattern = [0, 0.75, 2, 2.5, 3, 3.75];
    for (let bar = 0; bar < bars; bar++) {
      kickPattern.forEach(offset => {
        const tick = (bar * 4 + offset) * beatTick * 0.5;
        midi.tracks[0].events.push({
          tick,
          type: 'noteOn',
          pitch: 36,
          velocity: 100,
          duration: beatTick * 0.15
        });
      });
    }

    // Bass: bouncy (track 1)
    const bassLine = [36, 39, 41, 39, 36, 36]; // C2, D#2, F2, ...
    for (let bar = 0; bar < bars; bar++) {
      for (let i = 0; i < bassLine.length; i++) {
        const tick = (bar * 6 + i) * beatTick * (2 / 3) * 0.5;
        midi.tracks[1].events.push({
          tick,
          type: 'noteOn',
          pitch: bassLine[i] + 24,
          velocity: 90,
          duration: beatTick * 0.5
        });
      }
    }

    // Melody (track 3)
    const melody = [60, 64, 67, 70, 67, 64]; // C4, E4, G4, A#4, G4, E4
    for (let bar = 0; bar < bars; bar++) {
      for (let i = 0; i < melody.length; i++) {
        const tick = (bar * 6 + i) * beatTick * (2 / 3) * 0.5;
        midi.tracks[3].events.push({
          tick,
          type: 'noteOn',
          pitch: melody[i],
          velocity: 85,
          duration: beatTick * 0.4
        });
      }
    }
  }

  static ambientHousePattern(midi, bars, bpm) {
    const beatTick = 480;

    // Kick: breathing (sparse)
    for (let bar = 0; bar < bars; bar += 4) {
      midi.tracks[0].events.push({
        tick: bar * beatTick * 4,
        type: 'noteOn',
        pitch: 36,
        velocity: 70,
        duration: beatTick * 0.15
      });
    }

    // Pad 1 (track 1)
    [36, 40, 43].forEach(pitch => {
      midi.tracks[1].events.push({
        tick: 0,
        type: 'noteOn',
        pitch: pitch + 24,
        velocity: 65,
        duration: beatTick * bars * 4
      });
    });

    // Pad 2 (track 2)
    [60, 64, 67].forEach(pitch => {
      midi.tracks[2].events.push({
        tick: 0,
        type: 'noteOn',
        pitch: pitch + 12,
        velocity: 60,
        duration: beatTick * bars * 4
      });
    });

    // Sparse hihat (track 3)
    for (let bar = 0; bar < bars; bar += 2) {
      midi.tracks[3].events.push({
        tick: bar * beatTick * 4,
        type: 'noteOn',
        pitch: 42, // closed hihat
        velocity: 40,
        duration: beatTick * 0.5
      });
    }
  }

  static toBuffer(midi) {
    // Converts midi object to binary MIDI file format
    // Simplified: returns JSON string (later convert via external tool)
    return JSON.stringify(midi);
  }
}
