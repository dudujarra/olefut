#!/usr/bin/env node

/**
 * test-render.js
 * Render 4 test stems via local HTTP server + Puppeteer
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function renderTestStems() {
  console.log('🎵 ELIFOOT Audio Test Render (4 stems)');

  let browser;
  let server;
  const testStemsDir = path.join(path.dirname(__dirname), 'public', 'audio', 'test-stems');

  try {
    // Create output directory
    if (!fs.existsSync(testStemsDir)) {
      fs.mkdirSync(testStemsDir, { recursive: true });
    }

    // Start local HTTP server
    console.log('\n🌐 Starting local HTTP server...');
    const testHtml = createTestRendererHTML();

    await new Promise((resolve) => {
      server = http.createServer((req, res) => {
        if (req.url === '/test-render.html' || req.url === '/') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(testHtml);
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      });

      server.listen(9876, () => {
        console.log('   Server ready: http://localhost:9876/test-render.html');
        resolve();
      });
    });

    // Launch headless Chrome
    console.log('\n🚀 Launching headless Chrome...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Expose save function to browser
    await page.exposeFunction('saveWavFile', async (id, wavBase64) => {
      const filePath = path.join(testStemsDir, `${id}.wav`);
      const buffer = Buffer.from(wavBase64, 'base64');
      fs.writeFileSync(filePath, buffer);
      console.log(`   💾 Saved: ${id}.wav (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Intercept console logs
    page.on('console', msg => {
      console.log(`   [browser] ${msg.text()}`);
    });

    console.log('\n📄 Loading test renderer...');
    await page.goto('http://localhost:9876/', { waitUntil: 'networkidle0', timeout: 60000 });

    // Wait for rendering to complete
    console.log('\n⏳ Rendering 4 test stems...');
    let renderComplete = false;

    for (let i = 0; i < 180; i++) {
      const status = await page.evaluate(() => {
        const statusDiv = document.getElementById('status');
        return statusDiv?.textContent || '';
      });

      if (status.includes('✅ Done') || status.includes('❌ Error')) {
        renderComplete = true;
        console.log(`\n${status}`);
        break;
      }

      if (i % 10 === 0) {
        console.log(`   ${status}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!renderComplete) {
      console.warn('⚠️ Rendering timeout (took >3 min)');
    }

    await browser.close();
    server.close();

    console.log('\n✅ Test render complete!');
    console.log(`📁 Files saved: ${testStemsDir}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (browser) await browser.close();
    if (server) server.close();
    process.exit(1);
  }
}

/**
 * Generate inline HTML for test rendering
 */
function createTestRendererHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>ELIFOOT Test Render</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.9.17/Tone.js"></script>
</head>
<body>
  <h1>🎵 Test Stem Renderer</h1>
  <div id="status">Loading...</div>
  <div id="progress">0 / 4</div>

  <script>
    const TEST_STEMS = [
      { id: 'test_deep', vertente: 'deep', bpm: 115, name: 'Deep House' },
      { id: 'test_tech', vertente: 'tech', bpm: 128, name: 'Tech House' },
      { id: 'test_progressive', vertente: 'progressive', bpm: 122, name: 'Progressive' },
      { id: 'test_funky', vertente: 'funky', bpm: 124, name: 'Funky House' }
    ];

    async function renderTestStems() {
      const statusDiv = document.getElementById('status');
      const progressDiv = document.getElementById('progress');

      try {
        statusDiv.textContent = '📝 Initializing Tone.js...';

        // Synthesize 4 stems
        const results = [];

        for (let idx = 0; idx < TEST_STEMS.length; idx++) {
          const stem = TEST_STEMS[idx];
          progressDiv.textContent = \`\${idx + 1} / 4\`;
          statusDiv.textContent = \`🎼 Rendering \${stem.name}...\`;

          try {
            const buffer = await renderStem(stem);
            results.push({ ...stem, buffer });
            console.log(\`✅ Rendered: \${stem.id}\`);
          } catch (err) {
            console.error(\`❌ Failed: \${stem.id}\`, err);
          }
        }

        // Save via Puppeteer-exposed function
        statusDiv.textContent = \`💾 Saving \${results.length} stems...\`;

        for (const result of results) {
          const wav = audioBufferToWav(result.buffer);
          // Convert ArrayBuffer to base64
          const bytes = new Uint8Array(wav);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const wavBase64 = btoa(binary);
          // Send base64 to Node via exposed function
          await window.saveWavFile(result.id, wavBase64);
        }

        statusDiv.textContent = \`✅ Done! 4 test stems rendered.\`;
        progressDiv.textContent = \`4 / 4\`;

      } catch (err) {
        statusDiv.textContent = \`❌ Error: \${err.message}\`;
        console.error('Render error:', err);
      }
    }

    async function renderStem(stemData) {
      const duration = 30; // 30 seconds per test stem
      const sampleRate = 44100;
      const numSamples = sampleRate * duration;

      const offlineContext = new OfflineAudioContext(2, numSamples, sampleRate);
      const originalContext = Tone.getContext();
      Tone.setContext(new Tone.Context(offlineContext));

      try {
        const master = new Tone.Gain().toDestination();
        const now = Tone.now();
        const beatDuration = 60 / stemData.bpm;

        // Factory synth based on vertente
        const synths = createSynthForVertente(stemData.vertente, master);

        // Play groove
        playGroove(stemData.vertente, now, beatDuration, duration, synths);

        const buffer = await offlineContext.startRendering();
        Tone.setContext(originalContext);

        return buffer;
      } catch (err) {
        Tone.setContext(originalContext);
        throw err;
      }
    }

    function createSynthForVertente(vertente, master) {
      const synths = {};

      switch (vertente) {
        case 'deep':
          synths.kick = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0 }
          }).connect(master);

          synths.bass = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sawtooth', count: 3 },
            envelope: { attack: 0.05, decay: 0.3, sustain: 0.15, release: 0.2 }
          }).connect(master);

          synths.pad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle', partials: [1, 3, 5, 7] },
            envelope: { attack: 0.15, decay: 0.5, sustain: 0.4, release: 0.8 }
          }).connect(master);
          break;

        case 'tech':
          synths.kick = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.0005, decay: 0.08, sustain: 0, release: 0 }
          }).connect(master);

          synths.bass = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'square', width: 0.6 },
            envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.15 }
          }).connect(master);

          synths.stab = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.15, sustain: 0.05, release: 0.1 }
          }).connect(master);
          break;

        case 'progressive':
          synths.kick = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0 }
          }).connect(master);

          synths.bass = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sawtooth', count: 2 },
            envelope: { attack: 0.03, decay: 0.3, sustain: 0.2, release: 0.2 }
          }).connect(master);

          synths.pad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle', partials: [1, 2, 4, 8] },
            envelope: { attack: 0.2, decay: 0.6, sustain: 0.5, release: 1.0 }
          }).connect(master);

          synths.melody = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'square', width: 0.75 },
            envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.15 }
          }).connect(master);
          break;

        case 'funky':
          synths.kick = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0 }
          }).connect(master);

          synths.bass = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.15, release: 0.15 }
          }).connect(master);

          synths.melody = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'square', width: 0.6 },
            envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.1 }
          }).connect(master);
          break;
      }

      return synths;
    }

    function playGroove(vertente, now, beatDuration, duration, synths) {
      const totalBeats = Math.floor(duration / beatDuration);

      switch (vertente) {
        case 'deep':
          // Straight kick
          for (let i = 0; i < totalBeats / 4; i++) {
            synths.kick.triggerAttackRelease('C1', '0.1', now + i * beatDuration * 4);
          }
          // Bass pattern
          const deepBass = ['C2', 'C2', 'D#2', 'C2'];
          for (let i = 0; i < totalBeats / 2; i++) {
            synths.bass.triggerAttackRelease(deepBass[i % 4], beatDuration * 0.45, now + i * beatDuration);
          }
          // Pad
          synths.pad.triggerAttackRelease('C3', totalBeats * beatDuration * 0.9, now);
          break;

        case 'tech':
          // Tight kick (8ths)
          for (let i = 0; i < totalBeats * 2; i++) {
            synths.kick.triggerAttackRelease('C1', '0.08', now + i * beatDuration * 0.5);
          }
          // Bass
          const techBass = ['C2', 'C2', 'C2', 'A#1'];
          for (let i = 0; i < totalBeats; i++) {
            synths.bass.triggerAttackRelease(techBass[i % 4], beatDuration * 0.4, now + i * beatDuration);
          }
          // Stabs
          synths.stab.triggerAttackRelease(['C3', 'E3', 'G3'], beatDuration * 0.12, now + beatDuration * 2);
          break;

        case 'progressive':
          // Building kick
          for (let i = 0; i < totalBeats / 4; i++) {
            const decay = 0.08 + (i * 0.005);
            synths.kick.triggerAttackRelease('C1', Math.min(decay, 0.2), now + i * beatDuration * 4);
          }
          // Bass sustained
          synths.bass.triggerAttackRelease('C2', totalBeats * beatDuration * 0.9, now);
          // Pad swelling
          synths.pad.triggerAttackRelease('C3', totalBeats * beatDuration * 0.9, now);
          // Melody (last third)
          const progMelody = ['C4', 'E4', 'G4', 'C5'];
          const start = Math.floor(totalBeats * 2 / 3);
          progMelody.forEach((note, idx) => {
            const time = now + (start + idx * 2) * beatDuration;
            if (time < now + totalBeats * beatDuration) {
              synths.melody.triggerAttackRelease(note, beatDuration * 3, time);
            }
          });
          break;

        case 'funky':
          // Syncopated kick
          const kickPattern = [0, 0.75, 2, 2.5, 3, 3.75];
          for (let beat = 0; beat < totalBeats; beat += 4) {
            kickPattern.forEach(offset => {
              const time = now + (beat + offset) * beatDuration * 0.5;
              if (time < now + totalBeats * beatDuration) {
                synths.kick.triggerAttackRelease('C1', '0.12', time);
              }
            });
          }
          // Bouncy bass
          const funkyBass = ['C2', 'D#2', 'F2', 'D#2', 'C2', 'C2'];
          for (let i = 0; i < totalBeats; i++) {
            synths.bass.triggerAttackRelease(funkyBass[i % 6], beatDuration * 0.5, now + i * beatDuration * (2 / 3));
          }
          // Melody
          const funkyMelody = ['C4', 'E4', 'G4', 'A#4', 'G4', 'E4'];
          for (let i = 0; i < totalBeats; i++) {
            synths.melody.triggerAttackRelease(funkyMelody[i % 6], beatDuration * 0.4, now + i * beatDuration * (2 / 3));
          }
          break;
      }
    }

    function audioBufferToWav(audioBuffer) {
      const rawData = mergeBuffers([audioBuffer]);
      const wavFile = encodeWAV(rawData, audioBuffer.sampleRate);
      return wavFile;
    }

    function mergeBuffers(buffers) {
      let offset = 0;
      const merged = new Float32Array(buffers.reduce((a, b) => a + b.length, 0));
      for (let i = 0; i < buffers.length; i++) {
        merged.set(buffers[i], offset);
        offset += buffers[i].length;
      }
      return merged;
    }

    function encodeWAV(samples, sampleRate) {
      const buffer = new ArrayBuffer(44 + samples.length * 2);
      const view = new DataView(buffer);

      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      const floatTo16BitPCM = (output, offset, input) => {
        for (let i = 0; i < input.length; i++, offset += 2) {
          const s = Math.max(-1, Math.min(1, input[i]));
          output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + samples.length * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, samples.length * 2, true);
      floatTo16BitPCM(view, 44, samples);

      return buffer;
    }

    renderTestStems();
  </script>
</body>
</html>
  `;
}

// Run
renderTestStems().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
