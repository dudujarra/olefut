/**
 * acid-house-v1.js
 * Acid house per manual seção 3.5 (Phuture, DJ Pierre).
 *
 * - 124 BPM, Pedal Phrygian (single root)
 * - Drums: 606/909 cru
 * - Bass: TB-303 com slide+accent variando (já tenho Acid303)
 * - Harmony: drone single note (pedal harmonic)
 * - Lead: secondary 303 acid line (harmonização)
 */

import { Kick909 } from '../synth/Kick909.js';
import { Snare909 } from '../synth/Snare909.js';
import { HiHats909 } from '../synth/HiHats909.js';
import { Acid303 } from '../synth/Acid303.js';
import { mulberry32 } from '../utils/mulberry32.js';

// Acid bass pattern — main 16-step (varies octaves + accents + slides)
export const ACID_PATTERN_MAIN = [
  { note: 'A1', accent: true,  slide: false },
  { note: 'A2', accent: false, slide: true  },
  { note: 'A1', accent: false, slide: false },
  { note: 'A1', accent: true,  slide: false },
  { note: 'C2', accent: false, slide: true  },
  { note: 'A1', accent: false, slide: false },
  { note: 'E2', accent: true,  slide: false },
  { note: 'A1', accent: false, slide: false },
  { note: 'A2', accent: false, slide: true  },
  { note: 'G1', accent: true,  slide: false },
  { note: 'A1', accent: false, slide: false },
  { note: 'A1', accent: false, slide: true  },
  { note: 'Bb1', accent: true, slide: false },
  { note: 'A1', accent: false, slide: false },
  { note: 'C2', accent: false, slide: true  },
  { note: 'A1', accent: true,  slide: false },
];

// Lead 303 — higher octave, more sparse
export const ACID_PATTERN_LEAD = [
  { note: 'A2', accent: true,  slide: false },
  { note: '_',  accent: false, slide: false },
  { note: 'C3', accent: false, slide: true  },
  { note: '_',  accent: false, slide: false },
  { note: 'E3', accent: true,  slide: false },
  { note: 'A2', accent: false, slide: true  },
  { note: '_',  accent: false, slide: false },
  { note: 'G2', accent: false, slide: false },
  { note: 'A2', accent: true,  slide: false },
  { note: '_',  accent: false, slide: false },
  { note: 'Bb2', accent: false, slide: true },
  { note: 'A2', accent: false, slide: false },
  { note: '_',  accent: false, slide: false },
  { note: 'E3', accent: true,  slide: false },
  { note: '_',  accent: false, slide: false },
  { note: 'A2', accent: false, slide: false },
];

export function buildAcidHouseStem(Tone, transport, seed, stemName, destination) {
  const rng = mulberry32(seed.rngSeed);

  transport.bpm.value = seed.bpm;
  transport.swing = 0.05;             // Straight — driving acid
  transport.swingSubdivision = '16n';
  transport.timeSignature = 4;

  const beatDuration = 60 / seed.bpm;
  const totalBars = seed.length;

  if (stemName === 'drums') return buildAcidDrums(Tone, totalBars, beatDuration, rng, destination);
  if (stemName === 'bass') return buildAcidBass(Tone, totalBars, beatDuration, destination);
  if (stemName === 'harmony') return buildAcidDrone(Tone, totalBars, beatDuration, destination);
  if (stemName === 'melody') return buildAcidLead(Tone, totalBars, beatDuration, destination);
}

function buildAcidDrums(Tone, totalBars, beatDuration, rng, destination) {
  const kick = new Kick909(Tone, destination);
  const clap = new Snare909(Tone, destination);
  const hats = new HiHats909(Tone, destination);

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;

    // Raw 4-on-floor (606/909 hybrid feel)
    for (let beat = 0; beat < 4; beat++) {
      kick.trigger(barStart + beat * beatDuration, 1.0);
    }

    // Sparse claps on 2 and 4
    clap.trigger(barStart + beatDuration * 1, 0.75);
    clap.trigger(barStart + beatDuration * 3, 0.75);

    // 16th hats (606-style cru, no shuffle)
    for (let step = 0; step < 16; step++) {
      const t = barStart + step * (beatDuration / 4);
      const vel = step % 4 === 0 ? 0.4 : 0.6;
      if (step !== 6 && step !== 14) hats.triggerClosed(t, vel);
    }
    hats.triggerOpen(barStart + 6 * (beatDuration / 4), 0.7);
    hats.triggerOpen(barStart + 14 * (beatDuration / 4), 0.7);
  }

  return { kick, clap, hats };
}

function buildAcidBass(Tone, totalBars, beatDuration, destination) {
  const acid = new Acid303(Tone, destination);
  const stepDur = beatDuration / 4;

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;

    for (let step = 0; step < 16; step++) {
      const patternStep = ACID_PATTERN_MAIN[step];
      const t = barStart + step * stepDur;
      acid.playStep(patternStep.note, t, '16n', patternStep.accent, patternStep.slide);
    }
  }

  return { acid };
}

function buildAcidDrone(Tone, totalBars, beatDuration, destination) {
  // Single-note drone — sustained low pad
  const synth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 4,
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 4.0, decay: 1.0, sustain: 0.6, release: 4.0 },
  });

  const filter = new Tone.Filter({ frequency: 600, type: 'lowpass', Q: 4 });
  const out = new Tone.Gain(0.3);
  synth.chain(filter, out);
  out.connect(destination);

  // Single A pedal note sustained throughout
  synth.triggerAttackRelease(['A2', 'A3'], totalBars * beatDuration * 4, 0, 0.4);

  return { synth, filter, out };
}

function buildAcidLead(Tone, totalBars, beatDuration, destination) {
  // Secondary 303 — different filter settings, more open
  const lead = new Acid303(Tone, destination);
  const stepDur = beatDuration / 4;

  // Lead enters second half (build-up)
  const leadStart = Math.floor(totalBars / 2);

  for (let bar = leadStart; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;

    for (let step = 0; step < 16; step++) {
      const patternStep = ACID_PATTERN_LEAD[step];
      if (patternStep.note === '_') continue;
      const t = barStart + step * stepDur;
      lead.playStep(patternStep.note, t, '16n', patternStep.accent, patternStep.slide);
    }
  }

  return { lead };
}
