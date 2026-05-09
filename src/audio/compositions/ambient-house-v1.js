/**
 * ambient-house-v1.js
 * Ambient house per manual seção 3.5 (Floating Points, Four Tet).
 *
 * - 105 BPM, Minor or Lydian
 * - Drums: soft kicks, brushed hats, wide reverb
 * - Bass: sub or omitted
 * - Harmony: sustained pads, slow movement, rich 7th/9th
 * - Atmosphere over groove — quiet, contemplative
 */

import { Kick909 } from '../synth/Kick909.js';
import { HiHats909 } from '../synth/HiHats909.js';
import { mulberry32 } from '../utils/mulberry32.js';

// Lydian on C — bright atmospheric mode (raised 4)
// I9 - II9 - V/iii - i (modal)
export const AMBIENT_PROGRESSION = [
  ['C3', 'E3', 'G3', 'B3', 'D4'],     // Cmaj9
  ['D3', 'F#3', 'A3', 'C4', 'E4'],    // D9 (Lydian II)
  ['G3', 'B3', 'D4', 'F4'],           // G7
  ['A2', 'C3', 'E3', 'G3', 'B3'],     // Am9
];

export function buildAmbientHouseStem(Tone, transport, seed, stemName, destination) {
  const rng = mulberry32(seed.rngSeed);

  transport.bpm.value = seed.bpm;
  transport.swing = 0.05;             // straight-ish, organic
  transport.swingSubdivision = '16n';
  transport.timeSignature = 4;

  const beatDuration = 60 / seed.bpm;
  const totalBars = seed.length;

  if (stemName === 'drums') return buildAmbientDrums(Tone, totalBars, beatDuration, rng, destination);
  if (stemName === 'bass') return buildAmbientBass(Tone, totalBars, beatDuration, destination);
  if (stemName === 'harmony') return buildAmbientHarmony(Tone, totalBars, beatDuration, destination);
  if (stemName === 'melody') return buildAmbientMelody(Tone, totalBars, beatDuration, rng, destination);
}

function buildAmbientDrums(Tone, totalBars, beatDuration, rng, destination) {
  const kick = new Kick909(Tone, destination);
  const hats = new HiHats909(Tone, destination);

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;

    // Soft kick on 1 and 3 only (deep ambient pulse)
    kick.trigger(barStart, 0.6);
    kick.trigger(barStart + beatDuration * 2, 0.55);

    // Brushed hats — sparse, only on off-beats
    for (let beat = 0; beat < 4; beat++) {
      const t = barStart + beat * beatDuration + beatDuration * 0.5;
      if (rng() > 0.4) hats.triggerClosed(t, 0.25 + rng() * 0.15);
    }
  }

  return { kick, hats };
}

function buildAmbientBass(Tone, totalBars, beatDuration, destination) {
  // Pure sub bass — no distortion
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.5, decay: 0.5, sustain: 0.7, release: 2.0 },
    filter: { type: 'lowpass', frequency: 200, rolloff: -12 },
    portamento: 0.1,
  });

  const out = new Tone.Gain(0.5);
  synth.connect(out);
  out.connect(destination);

  // Bass drones — sustained 4 bars per note
  const drones = ['C2', 'D2', 'G1', 'A1'];
  for (let bar = 0; bar < totalBars; bar += 4) {
    const barStart = bar * beatDuration * 4;
    const note = drones[(bar / 4) % drones.length];
    synth.triggerAttackRelease(note, '4m', barStart, 0.7);
  }

  return { synth, out };
}

function buildAmbientHarmony(Tone, totalBars, beatDuration, destination) {
  // Big lush pad — slow attack, very long release
  const synth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 10,
    oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
    envelope: { attack: 3.0, decay: 1.0, sustain: 0.8, release: 5.0 },
  });

  const filter = new Tone.Filter({ frequency: 1800, type: 'lowpass' });
  const chorus = new Tone.Chorus({ frequency: 0.2, depth: 0.6, wet: 0.6 }).start();
  const out = new Tone.Gain(0.4);
  synth.chain(filter, chorus, out);
  out.connect(destination);

  // 1 chord per 4 bars — slow harmonic motion
  for (let bar = 0; bar < totalBars; bar += 4) {
    const barStart = bar * beatDuration * 4;
    const chordIdx = (bar / 4) % AMBIENT_PROGRESSION.length;
    const chord = AMBIENT_PROGRESSION[chordIdx];
    synth.triggerAttackRelease(chord, '4m', barStart, 0.5);
  }

  return { synth, filter, chorus, out };
}

function buildAmbientMelody(Tone, totalBars, beatDuration, rng, destination) {
  // Sparse atmospheric tones — sine + reverb tail
  const synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.5, decay: 1.0, sustain: 0.3, release: 3.0 },
  });

  const out = new Tone.Gain(0.3);
  synth.connect(out);
  out.connect(destination);

  // Floating melodic tones — random notes from Lydian scale
  const lydianNotes = ['C5', 'D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'C6'];
  for (let bar = 4; bar < totalBars; bar += 6) {
    const barStart = bar * beatDuration * 4;
    const note = lydianNotes[Math.floor(rng() * lydianNotes.length)];
    synth.triggerAttackRelease(note, '2n', barStart + rng() * beatDuration * 2, 0.4);
  }

  return { synth, out };
}
