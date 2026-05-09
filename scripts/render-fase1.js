#!/usr/bin/env node
/* eslint-disable no-useless-escape, no-prototype-builtins, no-unused-vars */

/**
 * render-fase1.js
 * AKITA-103 / SPEC-051 Fase 1 renderer.
 *
 * Renders 1 deep house track (4 stems separados + master mix) using:
 * - Puppeteer headless Chrome (real AudioContext per manual caveat 1)
 * - Local HTTP server (NÃO data URL, falha sem)
 * - Tone.Offline com Tone.start() FORA do offline callback
 * - Synth classes (Kick909, SubPluck, Pad, etc.) via inline ES module
 *
 * Output: public/audio/fase1/deep_house_v1_{drums,bass,harmony,melody,master}.wav
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);
const outputDir = path.join(projectRoot, 'public', 'audio', 'fase1');

const TRACK_SEED = {
  id: 'deep_house_v1',
  subgenre: 'deep',
  bpm: 118,
  key: 'Am',
  mode: 'minor',
  length: 32,
  rngSeed: 12345,
  stems: ['drums', 'bass', 'harmony', 'melody'],
};

async function main() {
  console.log('🎵 AKITA-103 / SPEC-051 — Music Engine Fase 1 Renderer');
  console.log(`   Track: ${TRACK_SEED.id} (${TRACK_SEED.bpm} BPM, ${TRACK_SEED.length} bars)`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read all source files (browser bundles inline since no build step)
  const sources = {
    mulberry32: fs.readFileSync(path.join(projectRoot, 'src/audio/utils/mulberry32.js'), 'utf8'),
    tapeCurve: fs.readFileSync(path.join(projectRoot, 'src/audio/utils/tape-curve.js'), 'utf8'),
    kick909: fs.readFileSync(path.join(projectRoot, 'src/audio/synth/Kick909.js'), 'utf8'),
    snare909: fs.readFileSync(path.join(projectRoot, 'src/audio/synth/Snare909.js'), 'utf8'),
    hihats909: fs.readFileSync(path.join(projectRoot, 'src/audio/synth/HiHats909.js'), 'utf8'),
    pad: fs.readFileSync(path.join(projectRoot, 'src/audio/synth/Pad.js'), 'utf8'),
    sidechain: fs.readFileSync(path.join(projectRoot, 'src/audio/buses/SidechainBus.js'), 'utf8'),
    mastering: fs.readFileSync(path.join(projectRoot, 'src/audio/buses/MasteringChain.js'), 'utf8'),
    composition: fs.readFileSync(path.join(projectRoot, 'src/audio/compositions/deep-house-v1.js'), 'utf8'),
  };

  // Strip ES module imports/exports — convert to globals
  const stripModule = (src) =>
    src
      .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
      .replace(/^export\s+/gm, '');

  const html = buildRendererHTML(sources, TRACK_SEED, stripModule);

  // Start local HTTP server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  await new Promise((resolve) => server.listen(9877, resolve));
  console.log('   🌐 HTTP server: http://localhost:9877/');

  // Launch Puppeteer
  console.log('   🚀 Launching headless Chrome...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const page = await browser.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (!text.includes('AudioContext is "suspended"')) {
      console.log(`   [browser ${msg.type()}] ${text}`);
    }
  });
  page.on('pageerror', (err) => console.error(`   [browser ERROR] ${err.message}`));

  // Expose Node-side save function
  await page.exposeFunction('saveWavFile', async (filename, wavBase64) => {
    const filePath = path.join(outputDir, filename);
    const buffer = Buffer.from(wavBase64, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`   💾 ${filename} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
  });

  await page.goto('http://localhost:9877/', { waitUntil: 'networkidle0', timeout: 60000 });

  // Wait for render completion
  console.log('   ⏳ Rendering 4 stems + master (may take 1-2 min)...');
  let done = false;
  for (let i = 0; i < 240; i++) {
    const status = await page.evaluate(() => document.getElementById('status')?.textContent || '');
    if (status.includes('✅ DONE')) {
      done = true;
      console.log(`   ${status}`);
      break;
    }
    if (status.includes('❌ ERROR')) {
      console.error(`   ${status}`);
      break;
    }
    if (i % 10 === 0) console.log(`   ${status}`);
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (!done) console.warn('   ⚠️ Timeout');

  await browser.close();
  server.close();

  // Validate
  const expected = ['drums', 'bass', 'harmony', 'melody', 'master'];
  console.log('\n📊 Validating output:');
  let allPassed = true;
  for (const stem of expected) {
    const filePath = path.join(outputDir, `deep_house_v1_${stem}.wav`);
    if (!fs.existsSync(filePath)) {
      console.error(`   ❌ Missing: ${stem}.wav`);
      allPassed = false;
      continue;
    }
    const stat = fs.statSync(filePath);
    const sizeMB = stat.size / 1024 / 1024;
    const ok = sizeMB > 4;
    console.log(`   ${ok ? '✅' : '⚠️'} deep_house_v1_${stem}.wav: ${sizeMB.toFixed(2)} MB`);
    if (!ok) allPassed = false;
  }

  if (allPassed) {
    console.log('\n✅ SPEC-051 Fase 1 render complete — Larry Heard vibe ready');
    console.log(`📁 Files: ${outputDir}`);
  } else {
    console.error('\n❌ Validation failed — check stems above');
    process.exit(1);
  }
}

function buildRendererHTML(sources, trackSeed, strip) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SPEC-051 Fase 1 Renderer</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.9.17/Tone.js"><\/script>
</head>
<body>
  <h1>🎵 SPEC-051 Fase 1 — Deep House V1</h1>
  <div id="status">Loading…</div>
  <script>
    const TRACK_SEED = ${JSON.stringify(trackSeed)};

    // Inject all module sources as globals (strip imports/exports)
    ${strip(sources.mulberry32)}
    ${strip(sources.tapeCurve)}
    ${strip(sources.kick909)}
    ${strip(sources.snare909)}
    ${strip(sources.hihats909)}
    ${strip(sources.pad)}
    ${strip(sources.sidechain)}
    ${strip(sources.mastering)}
    ${strip(sources.composition)}

    const statusEl = document.getElementById('status');
    function setStatus(msg) {
      statusEl.textContent = msg;
      console.log('[status] ' + msg);
    }

    async function main() {
      try {
        setStatus('🔊 Starting AudioContext…');
        await Tone.start();

        const beatDur = 60 / TRACK_SEED.bpm;
        const totalSec = TRACK_SEED.length * beatDur * 4;

        const stemBuffers = {};

        // === Render each stem separately (vertical layering enabled) ===
        for (const stemName of TRACK_SEED.stems) {
          setStatus(\`🎼 Rendering \${stemName} (\${totalSec.toFixed(1)}s)…\`);
          console.log('Starting offline render for', stemName);

          const buffer = await Tone.Offline(({ transport, destination }) => {
            // Sidechain bus (only for bass/harmony — drums go direct)
            // For Fase 1 simplicity, we apply sidechain INTERNALLY when bass/harmony rendered
            // But since we render stems separately, we add light ducking via simulated kick gate

            const stemBus = new Tone.Gain(1).connect(destination);

            buildDeepHouseStem(Tone, transport, TRACK_SEED, stemName, stemBus);

            transport.start(0);
          }, totalSec, 2, 44100);

          stemBuffers[stemName] = buffer;
          console.log('Rendered', stemName, 'duration:', buffer.duration);

          // Save individual stem
          const wavData = audioBufferToWav(buffer);
          const base64 = arrayBufferToBase64(wavData);
          await window.saveWavFile(\`deep_house_v1_\${stemName}.wav\`, base64);
        }

        // === Render MASTER MIX with sidechain + mastering chain ===
        setStatus('🎚️ Rendering MASTER MIX with sidechain + mastering…');

        const masterBuffer = await Tone.Offline(({ transport, destination }) => {
          // Mastering chain at master output
          const mastering = new MasteringChain(Tone);

          // Sidechain bus pra bass + harmony
          // Need a shared kick reference for follower

          // Drums bus (direct, no sidechain)
          const drumsBus = new Tone.Gain(1).connect(mastering.input);

          // Build drums to extract kick reference
          const drumsParts = buildDeepHouseStem(Tone, transport, TRACK_SEED, 'drums', drumsBus);

          // Sidechain on bass and harmony, fed by kick output
          const sidechain = new SidechainBus(Tone, drumsParts.kick.out);
          sidechain.output.connect(mastering.input);

          // Bass through sidechain
          buildDeepHouseStem(Tone, transport, TRACK_SEED, 'bass', sidechain.input);
          buildDeepHouseStem(Tone, transport, TRACK_SEED, 'harmony', sidechain.input);

          // Melody direct (no sidechain)
          const melodyBus = new Tone.Gain(0.6).connect(mastering.input);
          buildDeepHouseStem(Tone, transport, TRACK_SEED, 'melody', melodyBus);

          transport.start(0);
        }, totalSec, 2, 44100);

        const masterWav = audioBufferToWav(masterBuffer);
        const masterB64 = arrayBufferToBase64(masterWav);
        await window.saveWavFile('deep_house_v1_master.wav', masterB64);

        setStatus('✅ DONE — 5 files saved');
      } catch (err) {
        console.error('Render error:', err);
        setStatus('❌ ERROR: ' + err.message);
      }
    }

    // === WAV encoding (stereo 16-bit PCM) ===
    function audioBufferToWav(buffer) {
      const numChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const length = buffer.length * numChannels * 2 + 44;
      const out = new ArrayBuffer(length);
      const view = new DataView(out);

      let offset = 0;
      const writeStr = (s) => { for (let i=0;i<s.length;i++) view.setUint8(offset++, s.charCodeAt(i)); };

      writeStr('RIFF');
      view.setUint32(offset, length - 8, true); offset += 4;
      writeStr('WAVE');
      writeStr('fmt ');
      view.setUint32(offset, 16, true); offset += 4;
      view.setUint16(offset, 1, true); offset += 2;          // PCM
      view.setUint16(offset, numChannels, true); offset += 2;
      view.setUint32(offset, sampleRate, true); offset += 4;
      view.setUint32(offset, sampleRate * numChannels * 2, true); offset += 4;
      view.setUint16(offset, numChannels * 2, true); offset += 2;
      view.setUint16(offset, 16, true); offset += 2;         // bit depth
      writeStr('data');
      view.setUint32(offset, buffer.length * numChannels * 2, true); offset += 4;

      // Interleave channels
      const channels = [];
      for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));

      for (let i = 0; i < buffer.length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
          let s = Math.max(-1, Math.min(1, channels[ch][i]));
          s = s < 0 ? s * 0x8000 : s * 0x7fff;
          view.setInt16(offset, s, true);
          offset += 2;
        }
      }

      return out;
    }

    function arrayBufferToBase64(ab) {
      const bytes = new Uint8Array(ab);
      let bin = '';
      const chunk = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      }
      return btoa(bin);
    }

    main();
  <\/script>
</body>
</html>`;
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
