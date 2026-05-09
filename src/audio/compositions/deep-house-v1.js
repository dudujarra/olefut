/**
 * deep-house-v1.js
 * Deep house composition orchestrator per manual seção 3.5 + 3.7.
 *
 * - 118 BPM (deep house range 116-120)
 * - Aeolian/minor key
 * - Chord progression: i7-iv7-VII7-III7 (Larry Heard "Mystery of Love")
 * - Swing 0.20 (~56% MPC, deep house slot 0.18-0.22)
 * - Drums: 909 kick on 1/3 + closed hat 8ths swung + open hat off-beats
 * - Bass: SubPluck on root + 5th
 * - Pads: Dm9-Gm7-Cmaj7-Fmaj7 sustained chords
 * - Sidechain pumping no bass + harmony
 *
 * Each stem rendered separately via Tone.Offline (vertical layering).
 */

import { Kick909 } from '../synth/Kick909.js';
import { Snare909 } from '../synth/Snare909.js';
import { HiHats909 } from '../synth/HiHats909.js';
import { Pad, SubPluck } from '../synth/Pad.js';
import { SidechainBus } from '../buses/SidechainBus.js';
import { MasteringChain } from '../buses/MasteringChain.js';
import { mulberry32 } from '../utils/mulberry32.js';

// Aeolian (natural minor) chord progression in Am
// i7 = Am7 (A C E G), iv7 = Dm7 (D F A C), VII7 = G7 (G B D F), III7 = Cmaj7 (C E G B)
export const DEEP_HOUSE_PROGRESSION = [
  ['A2', 'C3', 'E3', 'G3'],     // Am7
  ['D3', 'F3', 'A3', 'C4'],     // Dm7
  ['G2', 'B2', 'D3', 'F3'],     // G7
  ['C3', 'E3', 'G3', 'B3'],     // Cmaj7
];

// Bass line — root notes following progression
export const DEEP_HOUSE_BASS_NOTES = ['A1', 'D2', 'G1', 'C2'];

// Melody — simple Aeolian motif (A minor pentatonic)
export const DEEP_HOUSE_MELODY = ['A4', 'C5', 'E5', 'G4', 'A4', 'E5', 'C5', 'A4'];

/**
 * Build entire deep house track inside Tone.Offline callback.
 * @param {object} Tone - Tone.js global
 * @param {object} transport - Tone.Transport from Offline context
 * @param {object} seed - track seed config
 * @param {string} stemName - 'drums' | 'bass' | 'harmony' | 'melody'
 * @param {Tone.InputNode} destination - mastering chain input
 */
export function buildDeepHouseStem(Tone, transport, seed, stemName, destination) {
  const rng = mulberry32(seed.rngSeed);

  // Setup transport
  transport.bpm.value = seed.bpm;
  transport.swing = 0.20;
  transport.swingSubdivision = '16n';
  transport.timeSignature = 4;

  const beatDuration = 60 / seed.bpm;
  const barDuration = beatDuration * 4;
  const totalBars = seed.length;

  if (stemName === 'drums') {
    return buildDrumsStem(Tone, transport, totalBars, beatDuration, rng, destination);
  } else if (stemName === 'bass') {
    return buildBassStem(Tone, transport, totalBars, beatDuration, destination);
  } else if (stemName === 'harmony') {
    return buildHarmonyStem(Tone, transport, totalBars, beatDuration, destination);
  } else if (stemName === 'melody') {
    return buildMelodyStem(Tone, transport, totalBars, beatDuration, rng, destination);
  }
}

function buildDrumsStem(Tone, transport, totalBars, beatDuration, rng, destination) {
  const kick = new Kick909(Tone, destination);
  const hats = new HiHats909(Tone, destination);
  // Snare optional in deep house — minimal, only on bar 4 every 4 bars
  const snare = new Snare909(Tone, destination);

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;

    // Kick on beats 1 and 3 (deep house pattern, not 4-on-floor)
    kick.trigger(barStart, 1.0);
    kick.trigger(barStart + beatDuration * 2, 0.95);

    // Closed hi-hat on every 8th note with swung accent
    for (let step = 0; step < 8; step++) {
      const t = barStart + step * (beatDuration / 2);
      const vel = step % 2 === 0 ? 0.5 : 0.7; // off-beat slightly louder = MPC swing feel
      hats.triggerClosed(t, vel);
    }

    // Open hat on the "and" of 4 (last 16th of bar) — classic deep house "tssss"
    hats.triggerOpen(barStart + beatDuration * 3.5, 0.6);

    // Subtle snare ghost on bar 4 each 4-bar phrase
    if (bar % 4 === 3) {
      snare.trigger(barStart + beatDuration * 3, 0.5);
    }
  }

  return { kick, hats, snare };
}

function buildBassStem(Tone, transport, totalBars, beatDuration, destination) {
  const sub = new SubPluck(Tone, destination);

  // Bass plays root note of each chord, 1 note per bar
  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;
    const noteIdx = bar % DEEP_HOUSE_BASS_NOTES.length;
    const note = DEEP_HOUSE_BASS_NOTES[noteIdx];
    sub.triggerNote(note, '1n', barStart, 0.85);
  }

  return { sub };
}

function buildHarmonyStem(Tone, transport, totalBars, beatDuration, destination) {
  // Pads need async reverb generation
  // Use Tone.PolySynth directly without convolver (Reverb async issues in Offline)
  const synth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 8,
    oscillator: { type: 'fatsawtooth', count: 2, spread: 20 },
    envelope: { attack: 1.2, decay: 0.4, sustain: 0.7, release: 2.5 },
  });

  const filter = new Tone.Filter({ frequency: 2000, type: 'lowpass' });
  const chorus = new Tone.Chorus({ frequency: 0.3, depth: 0.5, wet: 0.5 }).start();
  const out = new Tone.Gain(0.5);

  synth.chain(filter, chorus, out);
  out.connect(destination);

  // 1 chord per bar, hold 1 bar each
  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;
    const chordIdx = bar % DEEP_HOUSE_PROGRESSION.length;
    const chord = DEEP_HOUSE_PROGRESSION[chordIdx];
    synth.triggerAttackRelease(chord, '1n', barStart, 0.6);
  }

  return { synth, filter, chorus, out };
}

function buildMelodyStem(Tone, transport, totalBars, beatDuration, rng, destination) {
  // Plucked synth lead — sparse melodic phrases
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.4, sustain: 0.2, release: 0.3 },
    filterEnvelope: {
      attack: 0.01, decay: 0.2, sustain: 0,
      baseFrequency: 800, octaves: 2,
    },
    filter: { type: 'lowpass', rolloff: -12, Q: 2 },
  });
  const out = new Tone.Gain(0.4);
  synth.chain(out);
  out.connect(destination);

  // Sparse melody — only every 2 bars, 4 notes
  for (let bar = 0; bar < totalBars; bar += 2) {
    const barStart = bar * beatDuration * 4;
    for (let i = 0; i < 4; i++) {
      const noteIdx = (bar / 2 * 4 + i) % DEEP_HOUSE_MELODY.length;
      const note = DEEP_HOUSE_MELODY[noteIdx];
      const t = barStart + i * beatDuration;
      synth.triggerAttackRelease(note, '8n', t, 0.5 + rng() * 0.3);
    }
  }

  return { synth, out };
}
