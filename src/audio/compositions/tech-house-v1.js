/**
 * tech-house-v1.js
 * Tech house composition per manual seção 3.5 + 3.10 (Carl Cox / Adam Beyer).
 *
 * - 128 BPM (tech house range 125-128)
 * - Phrygian mode (i-bII vamp pedaling — dark tech)
 * - Drums: 909 kick 4-on-floor + claps 2/4 + 16th hi-hats shuffle
 * - Bass: TB-303 acid with slide+accent (Phuture-style)
 * - Stabs: PolySynth saw single chord pedal
 * - Swing: 0.08 (Carl Cox driving, near straight)
 *
 * Each stem rendered separately (vertical layering).
 */

import { Kick909 } from '../synth/Kick909.js';
import { Snare909 } from '../synth/Snare909.js';
import { HiHats909 } from '../synth/HiHats909.js';
import { Acid303 } from '../synth/Acid303.js';
import { mulberry32 } from '../utils/mulberry32.js';

// Phrygian on A: A Bb C D E F G (i = Am, bII = Bb major)
// Tech house pedal — root A1 with occasional octave jumps + slides
// Phuture/DJ Pierre acid pattern: tonic + 5th + octave + slide
export const TECH_BASS_PATTERN = [
  { note: 'A1', accent: true,  slide: false },  // beat 1
  { note: 'A2', accent: false, slide: true  },  // octave jump + slide
  { note: 'A1', accent: false, slide: false },
  { note: 'C2', accent: true,  slide: false },  // bIII flavor
  { note: 'A1', accent: false, slide: true  },
  { note: 'E2', accent: false, slide: false },  // 5th
  { note: 'A1', accent: true,  slide: false },
  { note: 'Bb1', accent: false, slide: true },  // bII Phrygian flavor
  { note: 'A1', accent: false, slide: false },
  { note: 'A2', accent: true,  slide: false },
  { note: 'G1', accent: false, slide: false },  // bVII
  { note: 'A1', accent: false, slide: true  },
  { note: 'C2', accent: false, slide: false },
  { note: 'A1', accent: true,  slide: false },
  { note: 'E2', accent: false, slide: true  },
  { note: 'A1', accent: false, slide: false },
];

// Stab chord: i (Am) and bII (Bb) — Phrygian vamp
export const TECH_STAB_CHORDS = {
  i:  ['A3', 'C4', 'E4'],     // Am
  bII: ['Bb3', 'D4', 'F4'],   // Bb major (Phrygian flavor)
};

export function buildTechHouseStem(Tone, transport, seed, stemName, destination) {
  const rng = mulberry32(seed.rngSeed);

  // Setup transport
  transport.bpm.value = seed.bpm;
  transport.swing = 0.08;             // Carl Cox driving — near straight
  transport.swingSubdivision = '16n';
  transport.timeSignature = 4;

  const beatDuration = 60 / seed.bpm;
  const totalBars = seed.length;

  if (stemName === 'drums') {
    return buildTechDrums(Tone, transport, totalBars, beatDuration, rng, destination);
  } else if (stemName === 'bass') {
    return buildTechBass(Tone, transport, totalBars, beatDuration, destination);
  } else if (stemName === 'harmony') {
    return buildTechStabs(Tone, transport, totalBars, beatDuration, destination);
  } else if (stemName === 'melody') {
    return buildTechFx(Tone, transport, totalBars, beatDuration, rng, destination);
  }
}

function buildTechDrums(Tone, transport, totalBars, beatDuration, rng, destination) {
  const kick = new Kick909(Tone, destination);
  const clap = new Snare909(Tone, destination);
  const hats = new HiHats909(Tone, destination);

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;

    // 4-ON-THE-FLOOR KICK — every quarter (tech house signature)
    for (let beat = 0; beat < 4; beat++) {
      kick.trigger(barStart + beat * beatDuration, beat === 0 ? 1.0 : 0.95);
    }

    // CLAP on beats 2 and 4 (snare backbeat)
    clap.trigger(barStart + beatDuration * 1, 0.85);
    clap.trigger(barStart + beatDuration * 3, 0.85);

    // 16TH HI-HATS — closed on every 16th, velocity shuffle 0.5/0.8
    for (let step = 0; step < 16; step++) {
      const t = barStart + step * (beatDuration / 4);
      // Shuffle velocity pattern: emphasize off-beats (Carl Cox style)
      const isOffBeat = step % 2 === 1;
      const vel = isOffBeat ? 0.65 : 0.45;
      // Skip step where open hat plays (avoid muddy overlap)
      if (step !== 6 && step !== 14) {
        hats.triggerClosed(t, vel);
      }
    }

    // OPEN HAT on the "and" of 2 and 4 (16th step 6 and 14) — driving energy
    hats.triggerOpen(barStart + 6 * (beatDuration / 4), 0.7);
    hats.triggerOpen(barStart + 14 * (beatDuration / 4), 0.7);
  }

  return { kick, clap, hats };
}

function buildTechBass(Tone, transport, totalBars, beatDuration, destination) {
  const acid = new Acid303(Tone, destination);

  // 16-step pattern, 1 step = 16th note. 16 steps per bar.
  const stepDur = beatDuration / 4;

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;

    for (let step = 0; step < 16; step++) {
      const patternStep = TECH_BASS_PATTERN[step];
      const t = barStart + step * stepDur;
      acid.playStep(patternStep.note, t, '16n', patternStep.accent, patternStep.slide);
    }
  }

  return { acid };
}

function buildTechStabs(Tone, transport, totalBars, beatDuration, destination) {
  // Stab chord: short percussive saw with filter envelope
  const synth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 6,
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
  });

  const filter = new Tone.Filter({ frequency: 3000, type: 'lowpass', Q: 0.7 });
  const out = new Tone.Gain(0.4);
  synth.chain(filter, out);
  out.connect(destination);

  // Stabs syncopated — beat 1 + "and" of 2 + beat 3 (classic tech house pattern)
  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;

    // i-bII vamp: alternate every 2 bars
    const chord = (bar % 4 < 2) ? TECH_STAB_CHORDS.i : TECH_STAB_CHORDS.bII;

    // Stabs on off-beats (& of 1, & of 3) for syncopation
    synth.triggerAttackRelease(chord, '8n', barStart + beatDuration * 0.5, 0.6);
    synth.triggerAttackRelease(chord, '8n', barStart + beatDuration * 2.5, 0.6);
  }

  return { synth, filter, out };
}

function buildTechFx(Tone, transport, totalBars, beatDuration, rng, destination) {
  // Riser/sweep FX — noise filtered with sweeping bandpass
  // Adds tension every 8 bars
  const noise = new Tone.Noise('white').start();
  const filter = new Tone.Filter({ type: 'bandpass', frequency: 200, Q: 2 });
  const env = new Tone.AmplitudeEnvelope({ attack: 4, decay: 0.5, sustain: 0, release: 0.3 });
  const out = new Tone.Gain(0.15);
  noise.chain(filter, env, out);
  out.connect(destination);

  // Sweep up every 8 bars (tension build before drop)
  for (let bar = 0; bar < totalBars; bar += 8) {
    const sweepStart = bar * beatDuration * 4;
    const sweepEnd = sweepStart + 4 * beatDuration * 4; // 4 bars sweep

    filter.frequency.cancelScheduledValues(sweepStart);
    filter.frequency.setValueAtTime(200, sweepStart);
    filter.frequency.exponentialRampToValueAtTime(8000, sweepEnd);
    env.triggerAttackRelease(4 * beatDuration * 4, sweepStart, 0.5);
  }

  return { noise, filter, env, out };
}
