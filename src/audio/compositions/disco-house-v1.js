/**
 * disco-house-v1.js
 * Disco/French Touch house per manual seção 3.5 + 3.10 (Daft Punk, Stardust).
 *
 * - 122 BPM, Major
 * - Chord progression: I-vi-ii-V (Cmaj - Amin - Dmin - Gmaj) — disco loops
 * - Drums: tight 909 + filtered loops
 * - Bass: filter bass (saw + filter automation aggressive)
 * - Filter sweeps 4-bar loops (French Touch signature)
 */

import { Kick909 } from '../synth/Kick909.js';
import { Snare909 } from '../synth/Snare909.js';
import { HiHats909 } from '../synth/HiHats909.js';
import { mulberry32 } from '../utils/mulberry32.js';

// I-vi-ii-V in C major — classic disco turnaround
export const DISCO_PROGRESSION = [
  ['C3', 'E3', 'G3', 'B3'],     // Cmaj7 (I)
  ['A2', 'C3', 'E3', 'G3'],     // Am7 (vi)
  ['D3', 'F3', 'A3', 'C4'],     // Dm7 (ii)
  ['G2', 'B2', 'D3', 'F3'],     // G7 (V)
];

export const DISCO_BASS_NOTES = ['C2', 'A1', 'D2', 'G1'];

export function buildDiscoHouseStem(Tone, transport, seed, stemName, destination) {
  const rng = mulberry32(seed.rngSeed);

  transport.bpm.value = seed.bpm;
  transport.swing = 0.10;
  transport.swingSubdivision = '16n';
  transport.timeSignature = 4;

  const beatDuration = 60 / seed.bpm;
  const totalBars = seed.length;

  if (stemName === 'drums') return buildDiscoDrums(Tone, totalBars, beatDuration, rng, destination);
  if (stemName === 'bass') return buildDiscoBass(Tone, totalBars, beatDuration, destination);
  if (stemName === 'harmony') return buildDiscoHarmony(Tone, totalBars, beatDuration, destination);
  if (stemName === 'melody') return buildDiscoLead(Tone, totalBars, beatDuration, rng, destination);
}

function buildDiscoDrums(Tone, totalBars, beatDuration, rng, destination) {
  const kick = new Kick909(Tone, destination);
  const clap = new Snare909(Tone, destination);
  const hats = new HiHats909(Tone, destination);

  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;

    // Tight 4-on-floor (909 dry)
    for (let beat = 0; beat < 4; beat++) {
      kick.trigger(barStart + beat * beatDuration, beat === 0 ? 1.0 : 0.95);
    }

    // Clap 2 and 4
    clap.trigger(barStart + beatDuration * 1, 0.85);
    clap.trigger(barStart + beatDuration * 3, 0.85);

    // 16th closed hats — disco straight feel
    for (let step = 0; step < 16; step++) {
      const t = barStart + step * (beatDuration / 4);
      const vel = step % 2 === 0 ? 0.4 : 0.6;
      if (step !== 6 && step !== 14) hats.triggerClosed(t, vel);
    }
    hats.triggerOpen(barStart + 6 * (beatDuration / 4), 0.7);
    hats.triggerOpen(barStart + 14 * (beatDuration / 4), 0.7);
  }

  return { kick, clap, hats };
}

function buildDiscoBass(Tone, totalBars, beatDuration, destination) {
  // Filter bass — saw with aggressive filter automation (French Touch)
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0.3, release: 0.1 },
    filterEnvelope: {
      attack: 0.001, decay: 0.1, sustain: 0,
      baseFrequency: 250, octaves: 3,
    },
    filter: { type: 'lowpass', rolloff: -24, Q: 2 },
  });

  // Filter LFO — French Touch 4-bar sweep
  const filterLFO = new Tone.LFO({
    frequency: '4m',
    type: 'sine',
    min: 400,
    max: 4000,
  });
  filterLFO.connect(synth.filter.frequency);
  filterLFO.sync().start(0);

  const out = new Tone.Gain(0.6);
  synth.connect(out);
  out.connect(destination);

  // 8th note disco bass — root + octave bouncing
  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;
    const root = DISCO_BASS_NOTES[bar % DISCO_BASS_NOTES.length];
    const octaveUp = Tone.Frequency(root).transpose(12).toNote();

    for (let i = 0; i < 8; i++) {
      const t = barStart + i * (beatDuration / 2);
      const note = i % 2 === 0 ? root : octaveUp;
      synth.triggerAttackRelease(note, '16n', t, 0.75);
    }
  }

  return { synth, filterLFO, out };
}

function buildDiscoHarmony(Tone, totalBars, beatDuration, destination) {
  // Disco strings — saw with chorus + filter sweep
  const synth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 8,
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.05, decay: 0.4, sustain: 0.6, release: 0.5 },
  });

  const filter = new Tone.Filter({ frequency: 1500, type: 'lowpass', Q: 2 });
  const chorus = new Tone.Chorus({ frequency: 0.4, depth: 0.4, wet: 0.5 }).start();
  const out = new Tone.Gain(0.45);

  // Filter LFO sweeps — French Touch 4-bar loops
  const filterLFO = new Tone.LFO({
    frequency: '4m',
    type: 'sine',
    min: 800,
    max: 5000,
  });
  filterLFO.connect(filter.frequency);
  filterLFO.sync().start(0);

  synth.chain(filter, chorus, out);
  out.connect(destination);

  // Strum pattern — chord on every quarter note (disco-style)
  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * beatDuration * 4;
    const chordIdx = bar % DISCO_PROGRESSION.length;
    const chord = DISCO_PROGRESSION[chordIdx];
    for (let beat = 0; beat < 4; beat++) {
      synth.triggerAttackRelease(chord, '8n', barStart + beat * beatDuration, 0.5);
    }
  }

  return { synth, filter, chorus, out, filterLFO };
}

function buildDiscoLead(Tone, totalBars, beatDuration, rng, destination) {
  // Disco lead — square + portamento (Daft Punk vocoder feel)
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.5, release: 0.3 },
    filter: { type: 'lowpass', frequency: 2500, Q: 2 },
    portamento: 0.05,
  });

  const out = new Tone.Gain(0.35);
  synth.connect(out);
  out.connect(destination);

  // Disco riff — major pentatonic
  const riff = ['C5', 'E5', 'G5', 'C6', 'A5', 'G5', 'E5', 'C5'];
  const leadStart = Math.floor(totalBars / 4);

  for (let bar = leadStart; bar < totalBars; bar += 2) {
    const barStart = bar * beatDuration * 4;
    for (let i = 0; i < 8; i++) {
      const note = riff[(i + bar) % riff.length];
      const t = barStart + i * (beatDuration / 2);
      synth.triggerAttackRelease(note, '16n', t, 0.5 + rng() * 0.2);
    }
  }

  return { synth, out };
}
