/**
 * funky-house-v1.js
 * Funky house per manual seção 3.5 (MK, Disclosure).
 *
 * - 124 BPM, Major 7th / Mixolydian
 * - Chord progression: ii7-V7-Imaj7 (Dm7 - G7 - Cmaj7) MK turnaround
 * - Drums: MK-style swung 16th hat shuffle, cowbell, swing 0.20
 * - Bass: MPC-bouncy plucked (saw + short envelope)
 * - Vocal-chop simulado via PolySynth saw filter automation
 */

import { Kick909 } from '../synth/Kick909.js';
import { Snare909 } from '../synth/Snare909.js';
import { HiHats909 } from '../synth/HiHats909.js';
import { mulberry32 } from '../utils/mulberry32.js';

// ii7-V7-Imaj7 in C
export const FUNKY_PROGRESSION = [
  ['D3', 'F3', 'A3', 'C4'],     // Dm7 (ii7)
  ['G2', 'B2', 'D3', 'F3'],     // G7 (V7)
  ['C3', 'E3', 'G3', 'B3'],     // Cmaj7 (Imaj7)
  ['C3', 'E3', 'G3', 'B3'],     // Cmaj7 (extended)
];

export const FUNKY_BASS_NOTES = ['D2', 'G1', 'C2', 'C2'];

export function buildFunkyHouseStem(Tone, transport, seed, stemName, destination) {
  const rng = mulberry32(seed.rngSeed);

  transport.bpm.value = seed.bpm;
  transport.swing = 0.20;             // MK funky swing
  transport.swingSubdivision = '16n';
  transport.timeSignature = 4;

  const beatDuration = 60 / seed.bpm;
  const totalBars = seed.length;

  if (stemName === 'drums') return buildFunkyDrums(Tone, totalBars, beatDuration, rng, destination);
  if (stemName === 'bass') return buildFunkyBass(Tone, totalBars, beatDuration, destination);
  if (stemName === 'harmony') return buildFunkyHarmony(Tone, totalBars, beatDuration, destination);
  if (stemName === 'melody') return buildFunkyVocalChop(Tone, totalBars, beatDuration, rng, destination);
}

function buildFunkyDrums(Tone, totalBars, beatDuration, rng, destination) {
  const kick = new Kick909(Tone, destination);
  const clap = new Snare909(Tone, destination);
  const hats = new HiHats909(Tone, destination);

  // Cowbell synth (sine + short env at 800Hz)
  const cowbell = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
  }).connect(destination);

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;

    // 4-on-floor
    for (let beat = 0; beat < 4; beat++) {
      kick.trigger(barStart + beat * beatDuration, beat === 0 ? 1.0 : 0.92);
    }

    // Clap on 2 and 4
    clap.trigger(barStart + beatDuration * 1, 0.85);
    clap.trigger(barStart + beatDuration * 3, 0.85);

    // 16th hats with strong MK shuffle (alternate accent)
    for (let step = 0; step < 16; step++) {
      const t = barStart + step * (beatDuration / 4);
      const vel = step % 2 === 1 ? 0.7 : 0.3;
      if (step !== 6 && step !== 14) hats.triggerClosed(t, vel);
    }
    hats.triggerOpen(barStart + 6 * (beatDuration / 4), 0.7);
    hats.triggerOpen(barStart + 14 * (beatDuration / 4), 0.7);

    // Cowbell on the "and" of 2 (16th step 6) — funky house signature
    cowbell.triggerAttackRelease('C5', '32n', barStart + beatDuration * 1.5, 0.4);
    cowbell.triggerAttackRelease('C5', '32n', barStart + beatDuration * 3.5, 0.4);
  }

  return { kick, clap, hats, cowbell };
}

function buildFunkyBass(Tone, totalBars, beatDuration, destination) {
  // MPC-bouncy plucked bass — saw + short envelope
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
    filterEnvelope: {
      attack: 0.001, decay: 0.08, sustain: 0,
      baseFrequency: 200, octaves: 3,
    },
    filter: { type: 'lowpass', rolloff: -24, Q: 3 },
  });

  const out = new Tone.Gain(0.65);
  synth.connect(out);
  out.connect(destination);

  // Bouncy 8th note pattern with octave jumps (MK-style)
  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;
    const noteIdx = bar % FUNKY_BASS_NOTES.length;
    const root = FUNKY_BASS_NOTES[noteIdx];
    const octaveUp = Tone.Frequency(root).transpose(12).toNote();

    // 8 8th notes per bar, alternating root/octave
    for (let i = 0; i < 8; i++) {
      const t = barStart + i * (beatDuration / 2);
      const note = i % 2 === 0 ? root : octaveUp;
      synth.triggerAttackRelease(note, '16n', t, 0.7);
    }
  }

  return { synth, out };
}

function buildFunkyHarmony(Tone, totalBars, beatDuration, destination) {
  // Stab piano-style chord
  const synth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 6,
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.002, decay: 0.4, sustain: 0.1, release: 0.2 },
  });

  const filter = new Tone.Filter({ frequency: 2500, type: 'lowpass', Q: 1 });
  const out = new Tone.Gain(0.45);
  synth.chain(filter, out);
  out.connect(destination);

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;
    const chordIdx = bar % FUNKY_PROGRESSION.length;
    const chord = FUNKY_PROGRESSION[chordIdx];

    // Stabs on off-beats — funky house piano pattern
    synth.triggerAttackRelease(chord, '8n', barStart + beatDuration * 0.5, 0.6);
    synth.triggerAttackRelease(chord, '8n', barStart + beatDuration * 1.5, 0.55);
    synth.triggerAttackRelease(chord, '8n', barStart + beatDuration * 2.5, 0.6);
    synth.triggerAttackRelease(chord, '8n', barStart + beatDuration * 3.5, 0.55);
  }

  return { synth, filter, out };
}

function buildFunkyVocalChop(Tone, totalBars, beatDuration, rng, destination) {
  // Vocal chop simulado — saw + filter automation + chorus
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.2 },
    filter: { type: 'lowpass', frequency: 1500, Q: 4 },
    filterEnvelope: {
      attack: 0.05, decay: 0.3, sustain: 0.3,
      baseFrequency: 600, octaves: 2.5,
    },
  });

  const chorus = new Tone.Chorus({ frequency: 1.5, depth: 0.4, wet: 0.5 }).start();
  const out = new Tone.Gain(0.4);
  synth.chain(chorus, out);
  out.connect(destination);

  // Vocal chop pattern — sparse stabs with pitch variation
  const chopNotes = ['C5', 'E5', 'G5', 'C5', 'A4', 'E5'];
  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;
    // Plays on beats 1 and 3 with variation
    if (bar % 2 === 0) {
      synth.triggerAttackRelease(chopNotes[bar % chopNotes.length], '8n', barStart, 0.6);
      synth.triggerAttackRelease(chopNotes[(bar + 2) % chopNotes.length], '16n', barStart + beatDuration * 2, 0.5);
    }
  }

  return { synth, chorus, out };
}
