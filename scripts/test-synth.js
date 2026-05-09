#!/usr/bin/env node

/**
 * test-synth.js
 * Direct audio synthesis in Node.js (no Tone.js, no browser needed)
 * Generate 4 WAV stems with oscillator synthesis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testStemsDir = path.join(path.dirname(__dirname), 'public', 'audio', 'test-stems');

// Ensure output dir exists
if (!fs.existsSync(testStemsDir)) {
  fs.mkdirSync(testStemsDir, { recursive: true });
}

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 30;
const TOTAL_SAMPLES = SAMPLE_RATE * DURATION_SECONDS;

// Oscillator functions (sample-based)
function sine(frequency, sampleRate, time) {
  return Math.sin(2 * Math.PI * frequency * time);
}

function square(frequency, sampleRate, time) {
  return sine(frequency, sampleRate, time) >= 0 ? 1 : -1;
}

function sawtooth(frequency, sampleRate, time) {
  const phase = (frequency * time) % 1;
  return 2 * phase - 1;
}

function triangle(frequency, sampleRate, time) {
  const phase = (frequency * time) % 1;
  return phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
}

/**
 * Generate test stem with oscillator-based groove
 */
function generateStem(vertente, bpm) {
  console.log(`  🎼 Synthesizing ${vertente}...`);

  const samples = new Float32Array(TOTAL_SAMPLES);
  const beatDuration = 60 / bpm;

  // Osc configs per vertente
  let grooveGen;
  switch (vertente) {
    case 'deep':
      grooveGen = generateDeepGroove(beatDuration, samples);
      break;
    case 'tech':
      grooveGen = generateTechGroove(beatDuration, samples);
      break;
    case 'progressive':
      grooveGen = generateProgressiveGroove(beatDuration, samples);
      break;
    case 'funky':
      grooveGen = generateFunkyGroove(beatDuration, samples);
      break;
  }

  // Normalize and reduce clipping
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    max = Math.max(max, Math.abs(samples[i]));
  }
  const gain = max > 0 ? 0.95 / max : 1;
  for (let i = 0; i < samples.length; i++) {
    samples[i] *= gain;
  }

  return samples;
}

function generateDeepGroove(beatDuration, samples) {
  const sampleRate = SAMPLE_RATE;
  let pos = 0;

  // Kick (quarter notes)
  for (let beat = 0; beat < samples.length / sampleRate / (beatDuration * 4); beat++) {
    const kickStart = beat * beatDuration * 4 * sampleRate;
    const kickDur = 0.12 * sampleRate;
    for (let i = 0; i < kickDur && kickStart + i < samples.length; i++) {
      const sample = sine(120, sampleRate, (kickStart + i) / sampleRate) * Math.exp(-i / (0.05 * sampleRate));
      samples[kickStart + i] += sample * 0.6;
    }
  }

  // Bass pad
  const bassFreq = 65;
  const bassStart = 0;
  const bassDur = samples.length;
  for (let i = bassStart; i < bassDur; i++) {
    samples[i] += sawtooth(bassFreq, sampleRate, i / sampleRate) * 0.2;
  }

  // Pad (triangle wave, slow)
  const padFreq = 130;
  for (let i = 0; i < samples.length; i++) {
    samples[i] += triangle(padFreq, sampleRate, i / sampleRate) * 0.15 * (0.5 + 0.5 * Math.sin(i / (0.5 * sampleRate)));
  }
}

function generateTechGroove(beatDuration, samples) {
  const sampleRate = SAMPLE_RATE;

  // Tight kick (8th notes)
  for (let beat = 0; beat < samples.length / sampleRate / (beatDuration * 0.5); beat++) {
    const kickStart = beat * beatDuration * 0.5 * sampleRate;
    const kickDur = 0.08 * sampleRate;
    for (let i = 0; i < kickDur && kickStart + i < samples.length; i++) {
      const sample = sine(100, sampleRate, (kickStart + i) / sampleRate) * Math.exp(-i / (0.04 * sampleRate));
      samples[kickStart + i] += sample * 0.7;
    }
  }

  // Bass (square, driving)
  const bassFreq = 110;
  for (let i = 0; i < samples.length; i++) {
    samples[i] += square(bassFreq, sampleRate, i / sampleRate) * 0.25;
  }

  // Stabs (sawtooth, percussive)
  for (let beat = 0; beat < samples.length / sampleRate / (beatDuration * 2); beat++) {
    const stabStart = beat * beatDuration * 2 * sampleRate + beatDuration * sampleRate;
    const stabDur = 0.15 * sampleRate;
    for (let i = 0; i < stabDur && stabStart + i < samples.length; i++) {
      const sample = sawtooth(330, sampleRate, (stabStart + i) / sampleRate) * Math.exp(-i / (0.08 * sampleRate));
      samples[stabStart + i] += sample * 0.3;
    }
  }
}

function generateProgressiveGroove(beatDuration, samples) {
  const sampleRate = SAMPLE_RATE;

  // Building kick (starts slow, gets tighter)
  for (let beat = 0; beat < samples.length / sampleRate / (beatDuration * 4); beat++) {
    const kickStart = beat * beatDuration * 4 * sampleRate;
    const decay = 0.08 + (beat * 0.0001);
    const kickDur = decay * sampleRate;
    for (let i = 0; i < kickDur && kickStart + i < samples.length; i++) {
      const sample = sine(100, sampleRate, (kickStart + i) / sampleRate) * Math.exp(-i / (decay * sampleRate));
      samples[kickStart + i] += sample * 0.65;
    }
  }

  // Bass (minimal, sustained C2)
  const bassFreq = 65;
  for (let i = 0; i < samples.length; i++) {
    samples[i] += sawtooth(bassFreq, sampleRate, i / sampleRate) * 0.15;
  }

  // Swelling pad (triangle, long envelope)
  const padFreq = 130;
  for (let i = 0; i < samples.length; i++) {
    const envelope = 0.3 + 0.5 * Math.sin(i / (1 * sampleRate));
    samples[i] += triangle(padFreq, sampleRate, i / sampleRate) * envelope * 0.12;
  }

  // Melody (last third, rising)
  const melodyStart = (2 * samples.length) / 3;
  const melodyFreqs = [262, 330, 392, 523]; // C4, E4, G4, C5
  let melodyIdx = 0;
  for (let beat = 0; beat < samples.length / sampleRate / (beatDuration * 3); beat++) {
    const noteStart = melodyStart + beat * beatDuration * 3 * sampleRate;
    const noteDur = beatDuration * 3 * sampleRate;
    const freq = melodyFreqs[melodyIdx % melodyFreqs.length];
    for (let i = 0; i < noteDur && noteStart + i < samples.length; i++) {
      const sample = square(freq, sampleRate, (noteStart + i) / sampleRate) * Math.exp(-i / (0.5 * sampleRate));
      samples[noteStart + i] += sample * 0.18;
    }
    melodyIdx++;
  }
}

function generateFunkyGroove(beatDuration, samples) {
  const sampleRate = SAMPLE_RATE;

  // Syncopated kick pattern
  const kickPattern = [0, 0.75, 2, 2.5, 3, 3.75];
  for (let beat = 0; beat < samples.length / sampleRate / (beatDuration * 4); beat++) {
    kickPattern.forEach((offset) => {
      const kickStart = (beat * 4 + offset) * beatDuration * 0.5 * sampleRate;
      if (kickStart < samples.length) {
        const kickDur = 0.12 * sampleRate;
        for (let i = 0; i < kickDur && kickStart + i < samples.length; i++) {
          const sample = sine(110, sampleRate, (kickStart + i) / sampleRate) * Math.exp(-i / (0.06 * sampleRate));
          samples[kickStart + i] += sample * 0.6;
        }
      }
    });
  }

  // Bouncy bass (6-note pattern)
  const bassBeat = beatDuration * (2 / 3);
  const bassFreqs = [65, 82.41, 97.99, 82.41, 65, 65]; // C2, D#2, F2, D#2, C2, C2
  for (let beat = 0; beat < samples.length / sampleRate / bassBeat; beat++) {
    const bassStart = beat * bassBeat * sampleRate;
    const freq = bassFreqs[beat % bassFreqs.length];
    const bassDur = 0.5 * sampleRate;
    for (let i = 0; i < bassDur && bassStart + i < samples.length; i++) {
      const sample = square(freq, sampleRate, (bassStart + i) / sampleRate) * Math.exp(-i / (0.1 * sampleRate));
      samples[bassStart + i] += sample * 0.2;
    }
  }

  // Melody (6-note pattern, retro square)
  const melodyBeat = beatDuration * (2 / 3);
  const melodyFreqs = [262, 330, 392, 466.16, 392, 330]; // C4, E4, G4, A#4, G4, E4
  for (let beat = 0; beat < samples.length / sampleRate / melodyBeat; beat++) {
    const noteStart = beat * melodyBeat * sampleRate;
    const freq = melodyFreqs[beat % melodyFreqs.length];
    const noteDur = 0.4 * sampleRate;
    for (let i = 0; i < noteDur && noteStart + i < samples.length; i++) {
      const sample = square(freq, sampleRate, (noteStart + i) / sampleRate) * Math.exp(-i / (0.08 * sampleRate));
      samples[noteStart + i] += sample * 0.15;
    }
  }
}

/**
 * Convert float samples to PCM 16-bit and write WAV file
 */
function writeStemToWav(stemName, samples) {
  const numChannels = 1;
  const sampleRate = SAMPLE_RATE;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;

  // WAV header
  const header = Buffer.alloc(44);
  let offset = 0;

  // RIFF chunk descriptor
  header.write('RIFF', offset); offset += 4;
  header.writeUInt32LE(36 + dataSize, offset); offset += 4;
  header.write('WAVE', offset); offset += 4;

  // fmt sub-chunk
  header.write('fmt ', offset); offset += 4;
  header.writeUInt32LE(16, offset); offset += 4; // Subchunk1Size
  header.writeUInt16LE(1, offset); offset += 2;  // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, offset); offset += 2;
  header.writeUInt32LE(sampleRate, offset); offset += 4;
  header.writeUInt32LE(byteRate, offset); offset += 4;
  header.writeUInt16LE(blockAlign, offset); offset += 2;
  header.writeUInt16LE(16, offset); offset += 2; // BitsPerSample

  // data sub-chunk
  header.write('data', offset); offset += 4;
  header.writeUInt32LE(dataSize, offset); offset += 4;

  // Convert float samples to PCM 16-bit
  const pcmData = Buffer.alloc(dataSize);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const pcm = s < 0 ? s * 0x8000 : s * 0x7fff;
    pcmData.writeInt16LE(pcm, i * 2);
  }

  // Write file
  const filePath = path.join(testStemsDir, `${stemName}.wav`);
  fs.writeFileSync(filePath, Buffer.concat([header, pcmData]));
  console.log(`   💾 Saved: ${stemName}.wav (${(header.length + dataSize) / 1024 / 1024}.toFixed(2)} MB)`);
}

// Main
async function main() {
  console.log('🎵 ELIFOOT Audio Test Synth (Node.js)');
  console.log('\n🔊 Rendering 4 test stems (30s each)...');

  const stems = [
    { id: 'test_deep', vertente: 'deep', bpm: 115 },
    { id: 'test_tech', vertente: 'tech', bpm: 128 },
    { id: 'test_progressive', vertente: 'progressive', bpm: 122 },
    { id: 'test_funky', vertente: 'funky', bpm: 124 }
  ];

  for (const stem of stems) {
    const samples = generateStem(stem.vertente, stem.bpm);
    writeStemToWav(stem.id, samples);
  }

  console.log('\n✅ Done! 4 test stems synthesized');
  console.log(`📁 Files: ${testStemsDir}`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
