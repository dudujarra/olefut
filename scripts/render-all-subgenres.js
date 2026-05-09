#!/usr/bin/env node
/* eslint-disable no-useless-escape, no-prototype-builtins, no-unused-vars */

/**
 * render-all-subgenres.js
 * SPEC-051 Fase 1+ — Render ALL 8 subgêneros do manual.
 *
 * Output structure:
 *   public/audio/fase1/
 *     deep/        ├── master.wav, drums.wav, bass.wav, harmony.wav, melody.wav
 *     tech/        ├── ...
 *     progressive/ ├── ...
 *     funky/       ├── ...
 *     ambient/     ├── ...
 *     tribal/      ├── ...
 *     acid/        ├── ...
 *     disco/       └── ...
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);
const baseOutputDir = path.join(projectRoot, 'public', 'audio', 'fase1');

// 8 subgêneros do manual seção 3.5
const SUBGENRES = [
  { id: 'deep',        bpm: 118, mode: 'minor',     key: 'Am', length: 32, seed: 12345, builder: 'buildDeepHouseStem',        compFile: 'deep-house-v1.js' },
  { id: 'tech',        bpm: 128, mode: 'phrygian',  key: 'Am', length: 32, seed: 67890, builder: 'buildTechHouseStem',        compFile: 'tech-house-v1.js' },
  { id: 'progressive', bpm: 122, mode: 'minor',     key: 'Am', length: 32, seed: 24680, builder: 'buildProgressiveHouseStem', compFile: 'progressive-house-v1.js' },
  { id: 'funky',       bpm: 124, mode: 'major',     key: 'C',  length: 32, seed: 13579, builder: 'buildFunkyHouseStem',       compFile: 'funky-house-v1.js' },
  { id: 'ambient',     bpm: 105, mode: 'lydian',    key: 'C',  length: 32, seed: 11111, builder: 'buildAmbientHouseStem',     compFile: 'ambient-house-v1.js' },
  { id: 'tribal',      bpm: 122, mode: 'aeolian',   key: 'Em', length: 32, seed: 22222, builder: 'buildTribalHouseStem',      compFile: 'tribal-house-v1.js' },
  { id: 'acid',        bpm: 124, mode: 'phrygian',  key: 'Am', length: 32, seed: 33333, builder: 'buildAcidHouseStem',        compFile: 'acid-house-v1.js' },
  { id: 'disco',       bpm: 122, mode: 'major',     key: 'C',  length: 32, seed: 44444, builder: 'buildDiscoHouseStem',       compFile: 'disco-house-v1.js' },
];

// Read source files (shared for all)
function readSources() {
  return {
    mulberry32: fs.readFileSync(path.join(projectRoot, 'src/audio/utils/mulberry32.js'), 'utf8'),
    tapeCurve: fs.readFileSync(path.join(projectRoot, 'src/audio/utils/tape-curve.js'), 'utf8'),
    kick909: fs.readFileSync(path.join(projectRoot, 'src/audio/synth/Kick909.js'), 'utf8'),
    snare909: fs.readFileSync(path.join(projectRoot, 'src/audio/synth/Snare909.js'), 'utf8'),
    hihats909: fs.readFileSync(path.join(projectRoot, 'src/audio/synth/HiHats909.js'), 'utf8'),
    acid303: fs.readFileSync(path.join(projectRoot, 'src/audio/synth/Acid303.js'), 'utf8'),
    pad: fs.readFileSync(path.join(projectRoot, 'src/audio/synth/Pad.js'), 'utf8'),
    sidechain: fs.readFileSync(path.join(projectRoot, 'src/audio/buses/SidechainBus.js'), 'utf8'),
    mastering: fs.readFileSync(path.join(projectRoot, 'src/audio/buses/MasteringChain.js'), 'utf8'),
  };
}

const stripModule = (src) =>
  src
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^export\s+/gm, '');

async function renderOne(subgenre, sources, browser) {
  const compSource = fs.readFileSync(
    path.join(projectRoot, 'src/audio/compositions', subgenre.compFile),
    'utf8'
  );

  const trackSeed = {
    id: `${subgenre.id}_house_v1`,
    subgenre: subgenre.id,
    bpm: subgenre.bpm,
    key: subgenre.key,
    mode: subgenre.mode,
    length: subgenre.length,
    rngSeed: subgenre.seed,
    stems: ['drums', 'bass', 'harmony', 'melody'],
  };

  const html = buildHTML(sources, compSource, trackSeed, subgenre.builder);

  // Start unique HTTP server per subgenre on different port
  const port = 9900 + SUBGENRES.indexOf(subgenre);
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  await new Promise((r) => server.listen(port, r));

  const subgenreDir = path.join(baseOutputDir, subgenre.id);
  if (!fs.existsSync(subgenreDir)) fs.mkdirSync(subgenreDir, { recursive: true });

  const page = await browser.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (!text.includes('AudioContext is "suspended"') && !text.includes('%c')) {
      console.log(`     [${subgenre.id}] ${text}`);
    }
  });
  page.on('pageerror', (err) => console.error(`     [${subgenre.id} ERR] ${err.message}`));

  await page.exposeFunction('saveWavFile', async (filename, wavBase64) => {
    const filePath = path.join(subgenreDir, filename);
    const buffer = Buffer.from(wavBase64, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`     💾 ${subgenre.id}/${filename} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
  });

  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle0', timeout: 60000 });

  let done = false;
  for (let i = 0; i < 240; i++) {
    const status = await page.evaluate(() => document.getElementById('status')?.textContent || '');
    if (status.includes('✅ DONE')) { done = true; break; }
    if (status.includes('❌ ERROR')) {
      console.error(`     ❌ [${subgenre.id}] ${status}`);
      break;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  await page.close();
  server.close();

  return done;
}

async function main() {
  console.log('🎵 SPEC-051 — Rendering ALL 8 subgêneros');
  console.log(`   Output: ${baseOutputDir}/<subgenre>/{master,drums,bass,harmony,melody}.wav`);
  console.log('');

  if (!fs.existsSync(baseOutputDir)) fs.mkdirSync(baseOutputDir, { recursive: true });

  const sources = readSources();

  console.log('🚀 Launching headless Chrome...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const results = {};
  for (const subgenre of SUBGENRES) {
    console.log(`\n🎼 Rendering ${subgenre.id} (${subgenre.bpm} BPM ${subgenre.mode})...`);
    const ok = await renderOne(subgenre, sources, browser);
    results[subgenre.id] = ok;
  }

  await browser.close();

  // Validation
  console.log('\n📊 Final validation:');
  let allOk = true;
  for (const subgenre of SUBGENRES) {
    const dir = path.join(baseOutputDir, subgenre.id);
    const expected = ['master.wav', 'drums.wav', 'bass.wav', 'harmony.wav', 'melody.wav'];
    let subOk = true;
    for (const file of expected) {
      const p = path.join(dir, file);
      if (!fs.existsSync(p)) { subOk = false; break; }
      const stat = fs.statSync(p);
      if (stat.size < 1_000_000) { subOk = false; break; }
    }
    console.log(`   ${subOk ? '✅' : '❌'} ${subgenre.id}/`);
    if (!subOk) allOk = false;
  }

  if (allOk) {
    console.log('\n✅ All 8 subgêneros rendered. Pasta separada por subgênero.');
    console.log(`📁 ${baseOutputDir}`);
  } else {
    console.error('\n❌ Some subgêneros failed validation');
    process.exit(1);
  }
}

function buildHTML(sources, compSource, trackSeed, builderName) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SPEC-051 — ${trackSeed.subgenre}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.9.17/Tone.js"><\/script>
</head>
<body>
  <h1>🎵 ${trackSeed.subgenre} house</h1>
  <div id="status">Loading…</div>
  <script>
    const TRACK_SEED = ${JSON.stringify(trackSeed)};

    ${stripModule(sources.mulberry32)}
    ${stripModule(sources.tapeCurve)}
    ${stripModule(sources.kick909)}
    ${stripModule(sources.snare909)}
    ${stripModule(sources.hihats909)}
    ${stripModule(sources.acid303)}
    ${stripModule(sources.pad)}
    ${stripModule(sources.sidechain)}
    ${stripModule(sources.mastering)}
    ${stripModule(compSource)}

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
        const builder = ${builderName};

        // Render stems separately
        for (const stemName of TRACK_SEED.stems) {
          setStatus(\`🎼 \${stemName} (\${totalSec.toFixed(1)}s)…\`);

          const buffer = await Tone.Offline(({ transport, destination }) => {
            const stemBus = new Tone.Gain(1).connect(destination);
            builder(Tone, transport, TRACK_SEED, stemName, stemBus);
            transport.start(0);
          }, totalSec, 2, 44100);

          const wav = audioBufferToWav(buffer);
          const b64 = arrayBufferToBase64(wav);
          await window.saveWavFile(\`\${stemName}.wav\`, b64);
        }

        // Master mix with sidechain + mastering
        setStatus('🎚️ master mix…');

        const masterBuffer = await Tone.Offline(({ transport, destination }) => {
          const mastering = new MasteringChain(Tone);

          const drumsBus = new Tone.Gain(1).connect(mastering.input);
          const drumsParts = builder(Tone, transport, TRACK_SEED, 'drums', drumsBus);

          // Sidechain works only if kick is exposed (has .out)
          const kickRef = drumsParts && drumsParts.kick && drumsParts.kick.out;

          if (kickRef) {
            const sidechain = new SidechainBus(Tone, kickRef, { depth: 0.6 });
            sidechain.output.connect(mastering.input);
            builder(Tone, transport, TRACK_SEED, 'bass', sidechain.input);
            builder(Tone, transport, TRACK_SEED, 'harmony', sidechain.input);
          } else {
            // Fallback: no sidechain (e.g., ambient with no kick output)
            const bassBus = new Tone.Gain(1).connect(mastering.input);
            builder(Tone, transport, TRACK_SEED, 'bass', bassBus);
            const harmBus = new Tone.Gain(1).connect(mastering.input);
            builder(Tone, transport, TRACK_SEED, 'harmony', harmBus);
          }

          const melodyBus = new Tone.Gain(0.8).connect(mastering.input);
          builder(Tone, transport, TRACK_SEED, 'melody', melodyBus);

          transport.start(0);
        }, totalSec, 2, 44100);

        const masterWav = audioBufferToWav(masterBuffer);
        const masterB64 = arrayBufferToBase64(masterWav);
        await window.saveWavFile('master.wav', masterB64);

        setStatus('✅ DONE');
      } catch (err) {
        console.error('Render error:', err);
        setStatus('❌ ERROR: ' + err.message);
      }
    }

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
      view.setUint16(offset, 1, true); offset += 2;
      view.setUint16(offset, numChannels, true); offset += 2;
      view.setUint32(offset, sampleRate, true); offset += 4;
      view.setUint32(offset, sampleRate * numChannels * 2, true); offset += 4;
      view.setUint16(offset, numChannels * 2, true); offset += 2;
      view.setUint16(offset, 16, true); offset += 2;
      writeStr('data');
      view.setUint32(offset, buffer.length * numChannels * 2, true); offset += 4;

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
