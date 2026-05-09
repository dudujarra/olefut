/**
 * progressive-house-v1.js
 * Progressive house per manual seção 3.5 (Solomun, Anyma).
 *
 * - 122 BPM, Minor + bIII modulation
 * - Chord progression: i-bVI-bIII-bVII (Am - Fmaj - Cmaj - Gmaj)
 * - Drums: layered 909 + tom rolls + big claps
 * - Bass: Reese-style detuned saws (fatsawtooth count: 3 spread: 30)
 * - Lead: portamento 80ms (Solomun-style emotional)
 */

import { Kick909 } from '../synth/Kick909.js';
import { Snare909 } from '../synth/Snare909.js';
import { HiHats909 } from '../synth/HiHats909.js';
import { mulberry32 } from '../utils/mulberry32.js';

// i-bVI-bIII-bVII in Am
export const PROG_PROGRESSION = [
  ['A2', 'C3', 'E3', 'G3'],     // Am7 (i)
  ['F2', 'A2', 'C3', 'E3'],     // Fmaj7 (bVI)
  ['C3', 'E3', 'G3', 'B3'],     // Cmaj7 (bIII)
  ['G2', 'B2', 'D3', 'F3'],     // G7 (bVII)
];

export const PROG_BASS_NOTES = ['A1', 'F1', 'C2', 'G1'];

// Solomun-style melodic lead — minor pentatonic with passing tones
export const PROG_MELODY = ['A4', 'C5', 'E5', 'D5', 'C5', 'A4', 'G4', 'A4'];

export function buildProgressiveHouseStem(Tone, transport, seed, stemName, destination) {
  const rng = mulberry32(seed.rngSeed);

  transport.bpm.value = seed.bpm;
  transport.swing = 0.10;
  transport.swingSubdivision = '16n';
  transport.timeSignature = 4;

  const beatDuration = 60 / seed.bpm;
  const totalBars = seed.length;

  if (stemName === 'drums') return buildProgDrums(Tone, totalBars, beatDuration, rng, destination);
  if (stemName === 'bass') return buildProgBass(Tone, totalBars, beatDuration, destination);
  if (stemName === 'harmony') return buildProgHarmony(Tone, totalBars, beatDuration, destination);
  if (stemName === 'melody') return buildProgMelody(Tone, totalBars, beatDuration, rng, destination);
}

function buildProgDrums(Tone, totalBars, beatDuration, rng, destination) {
  const kick = new Kick909(Tone, destination);
  const clap = new Snare909(Tone, destination);
  const hats = new HiHats909(Tone, destination);

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;

    // 4-on-floor kick + extra layer on beat 1
    for (let beat = 0; beat < 4; beat++) {
      kick.trigger(barStart + beat * beatDuration, beat === 0 ? 1.0 : 0.92);
    }

    // Big claps on 2 and 4
    clap.trigger(barStart + beatDuration * 1, 0.9);
    clap.trigger(barStart + beatDuration * 3, 0.9);

    // 16th hats with shuffle
    for (let step = 0; step < 16; step++) {
      const t = barStart + step * (beatDuration / 4);
      const vel = step % 4 === 0 ? 0.35 : (step % 2 === 1 ? 0.6 : 0.45);
      if (step !== 6 && step !== 14) hats.triggerClosed(t, vel);
    }
    hats.triggerOpen(barStart + 6 * (beatDuration / 4), 0.65);
    hats.triggerOpen(barStart + 14 * (beatDuration / 4), 0.65);

    // Tom roll fill every 8 bars on last 2 beats
    if (bar > 0 && bar % 8 === 7) {
      for (let i = 0; i < 8; i++) {
        const t = barStart + beatDuration * 2 + i * (beatDuration / 4);
        clap.trigger(t, 0.3 + (i * 0.05));
      }
    }
  }

  return { kick, clap, hats };
}

function buildProgBass(Tone, totalBars, beatDuration, destination) {
  // Reese bass — fatsawtooth count 3 spread 30
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.3 },
    filter: { frequency: 800, type: 'lowpass', Q: 2 },
    portamento: 0.02,
  });

  const chorus = new Tone.Chorus({ frequency: 0.5, depth: 0.3, wet: 0.4 }).start();
  const out = new Tone.Gain(0.6);
  synth.chain(chorus, out);
  out.connect(destination);

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;
    const noteIdx = bar % PROG_BASS_NOTES.length;
    const note = PROG_BASS_NOTES[noteIdx];
    // Bass plays root for 1 bar
    synth.triggerAttackRelease(note, '1n', barStart, 0.85);
  }

  return { synth, chorus, out };
}

function buildProgHarmony(Tone, totalBars, beatDuration, destination) {
  // Spread 2 oitavas — Solomun signature pad
  const synth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 8,
    oscillator: { type: 'fatsawtooth', count: 2, spread: 25 },
    envelope: { attack: 1.5, decay: 0.5, sustain: 0.7, release: 3.0 },
  });

  const filter = new Tone.Filter({ frequency: 2500, type: 'lowpass' });
  const chorus = new Tone.Chorus({ frequency: 0.3, depth: 0.5, wet: 0.5 }).start();
  const out = new Tone.Gain(0.45);
  synth.chain(filter, chorus, out);
  out.connect(destination);

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;
    const chordIdx = bar % PROG_PROGRESSION.length;
    const chord = PROG_PROGRESSION[chordIdx];
    synth.triggerAttackRelease(chord, '1n', barStart, 0.55);
  }

  return { synth, filter, chorus, out };
}

function buildProgMelody(Tone, totalBars, beatDuration, rng, destination) {
  // Lead with portamento 80ms (Solomun emotional)
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.5 },
    filter: { type: 'lowpass', frequency: 3000, Q: 2 },
    filterEnvelope: {
      attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.5,
      baseFrequency: 800, octaves: 2,
    },
    portamento: 0.08,
  });

  const vibrato = new Tone.Vibrato({ frequency: 5, depth: 0.05 });
  const out = new Tone.Gain(0.4);
  synth.chain(vibrato, out);
  out.connect(destination);

  // Lead enters last third (build-up arc)
  const leadStart = Math.floor(totalBars / 3);
  for (let bar = leadStart; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;
    for (let i = 0; i < 4; i++) {
      const noteIdx = ((bar - leadStart) * 4 + i) % PROG_MELODY.length;
      const note = PROG_MELODY[noteIdx];
      const t = barStart + i * beatDuration;
      synth.triggerAttackRelease(note, '4n', t, 0.5 + rng() * 0.3);
    }
  }

  return { synth, vibrato, out };
}
