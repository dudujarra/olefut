/**
 * tribal-house-v1.js
 * Tribal/Afro house per manual seção 3.5 + 3.6 (Black Coffee, Keinemusik).
 *
 * - 122 BPM, Modal Aeolian/Mixolydian
 * - Drums: tom loops + shaker + clave + Brazilian percussion (samba)
 * - Bass: sub + tom loop driving groove
 * - Harmony: E minor pedal + piano stabs (modal)
 * - Tamborim samba clave: . . X . . X . X X . X . X . . .
 */

import { Kick909 } from '../synth/Kick909.js';
import { mulberry32 } from '../utils/mulberry32.js';

// E minor pedal with modal piano stabs (Aeolian)
export const TRIBAL_PROGRESSION = [
  ['E3', 'G3', 'B3'],            // Em
  ['E3', 'G3', 'B3'],            // Em (pedal)
  ['D3', 'F#3', 'A3'],           // D (bVII Mixolydian)
  ['E3', 'G3', 'B3'],            // Em
];

// Tamborim samba clave (16th note grid)
export const TAMBORIM_PATTERN = [
  0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0,
];

export function buildTribalHouseStem(Tone, transport, seed, stemName, destination) {
  const rng = mulberry32(seed.rngSeed);

  transport.bpm.value = seed.bpm;
  transport.swing = 0.22;             // Brazilian samba swing
  transport.swingSubdivision = '16n';
  transport.timeSignature = 4;

  const beatDuration = 60 / seed.bpm;
  const totalBars = seed.length;

  if (stemName === 'drums') return buildTribalDrums(Tone, totalBars, beatDuration, rng, destination);
  if (stemName === 'bass') return buildTribalBass(Tone, totalBars, beatDuration, destination);
  if (stemName === 'harmony') return buildTribalHarmony(Tone, totalBars, beatDuration, destination);
  if (stemName === 'melody') return buildTribalPercussion(Tone, totalBars, beatDuration, rng, destination);
}

function buildTribalDrums(Tone, totalBars, beatDuration, rng, destination) {
  const kick = new Kick909(Tone, destination);

  // Tom loop synth — pitched membrane simulating surdo
  const tom = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
  });
  const tomFilter = new Tone.Filter({ type: 'lowpass', frequency: 600, Q: 2 });
  tom.chain(tomFilter, destination);

  // Surdo low/high
  const surdoLow = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 },
  }).connect(destination);

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;

    // Soft kick on 1 only (tribal — drums driven by toms not kick)
    kick.trigger(barStart, 0.7);

    // Surdo on beat 2 and 4 (samba heartbeat)
    surdoLow.triggerAttackRelease('A1', '4n', barStart + beatDuration * 1, 0.85);
    surdoLow.triggerAttackRelease('A1', '4n', barStart + beatDuration * 3, 0.85);

    // Tom rolls in 16th positions following samba clave
    for (let step = 0; step < 16; step++) {
      const t = barStart + step * (beatDuration / 4);
      // Tom hits on syncopated positions (Afro-Brazilian groove)
      if ([3, 6, 10, 13].includes(step)) {
        const pitch = step % 8 === 6 ? 'D3' : 'A2';
        tom.triggerAttackRelease(pitch, '16n', t, 0.6 + rng() * 0.2);
      }
    }
  }

  return { kick, tom, tomFilter, surdoLow };
}

function buildTribalBass(Tone, totalBars, beatDuration, destination) {
  // Sub bass + tom loop — driving rolling groove
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.15, sustain: 0.5, release: 0.2 },
    filter: { type: 'lowpass', frequency: 300, rolloff: -24 },
    portamento: 0.03,
  });

  const sat = new Tone.Distortion({ distortion: 0.1, wet: 0.4 });
  const out = new Tone.Gain(0.6);
  synth.chain(sat, out);
  out.connect(destination);

  // Rolling 8th note bass — E minor pedal with passing tone
  const bassPattern = ['E1', 'E1', 'E2', 'E1', 'D2', 'E1', 'B1', 'E1'];
  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;
    for (let i = 0; i < 8; i++) {
      const t = barStart + i * (beatDuration / 2);
      synth.triggerAttackRelease(bassPattern[i], '16n', t, 0.7);
    }
  }

  return { synth, sat, out };
}

function buildTribalHarmony(Tone, totalBars, beatDuration, destination) {
  // Piano stabs — modal Aeolian
  const synth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 6,
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.5, sustain: 0.2, release: 0.4 },
  });

  const filter = new Tone.Filter({ frequency: 3500, type: 'lowpass' });
  const out = new Tone.Gain(0.4);
  synth.chain(filter, out);
  out.connect(destination);

  // Sparse stabs on syncopated positions
  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;
    const chordIdx = bar % TRIBAL_PROGRESSION.length;
    const chord = TRIBAL_PROGRESSION[chordIdx];

    // Stabs on "and" of 2 and "and" of 4 — tribal house feel
    synth.triggerAttackRelease(chord, '8n', barStart + beatDuration * 1.5, 0.55);
    synth.triggerAttackRelease(chord, '8n', barStart + beatDuration * 3.5, 0.55);
  }

  return { synth, filter, out };
}

function buildTribalPercussion(Tone, totalBars, beatDuration, rng, destination) {
  // Tamborim — sharp percussive triangle
  const tamborim = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 },
  }).connect(destination);

  // Shaker — filtered noise with very short env
  const shakerNoise = new Tone.Noise('white').start();
  const shakerFilter = new Tone.Filter({ type: 'highpass', frequency: 5000 });
  const shakerEnv = new Tone.AmplitudeEnvelope({
    attack: 0.001, decay: 0.04, sustain: 0, release: 0.01,
  });
  shakerNoise.chain(shakerFilter, shakerEnv, destination);

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;

    // Tamborim follows samba clave pattern (16ths)
    for (let step = 0; step < 16; step++) {
      if (TAMBORIM_PATTERN[step]) {
        const t = barStart + step * (beatDuration / 4);
        tamborim.triggerAttackRelease('C5', '32n', t, 0.5);
      }
    }

    // Shaker on every 8th
    for (let step = 0; step < 8; step++) {
      const t = barStart + step * (beatDuration / 2);
      shakerEnv.triggerAttackRelease(0.04, t, 0.3 + rng() * 0.2);
    }
  }

  return { tamborim, shakerNoise, shakerFilter, shakerEnv };
}
