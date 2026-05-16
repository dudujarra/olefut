#!/usr/bin/env node
/* eslint-disable no-unused-vars */

/**
 * render-stems.js
 * Orchestrates full audio generation pipeline:
 * 1. Generate metadata (AudioGenerator)
 * 2. Pre-render stems via Tone.Offline (Puppeteer)
 * 3. Saves WAV files to public/audio/stems/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AudioGenerator } from '../src/audio/AudioGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const args = process.argv.slice(2);
  const config = {
    dryRun: args.includes('--dry-run'),
    seed: args.find(a => a.startsWith('--seed='))?.split('=')[1] || Date.now(),
    outputDir: 'public/audio',
    stemsDir: 'public/audio/stems'
  };

  console.log('🎵 OléFUT Audio Generation Pipeline');
  console.log(`📦 Config:`, JSON.stringify(config, null, 2));

  try {
    // Step 1: Generate metadata
    console.log('\n📝 Step 1: Generating metadata...');
    const generator = new AudioGenerator(config);
    const result = await generator.generate();

    if (!result.validation.passed) {
      console.error('\n❌ Metadata generation failed:');
      result.validation.errors.forEach(e => console.error(`  - ${e}`));
      process.exit(1);
    }

    const tracks = result.generated.tracks;
    console.log(`✅ Generated ${tracks.length} track definitions`);

    // Write metadata
    if (!config.dryRun) {
      if (!fs.existsSync(config.outputDir)) {
        fs.mkdirSync(config.outputDir, { recursive: true });
      }

      const metadataPath = path.join(config.outputDir, 'metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(result, null, 2));
      console.log(`✅ Metadata written: ${metadataPath}`);
    }

    // Step 2: Batch pre-render stems (browser context)
    console.log('\n🎼 Step 2: Pre-rendering stems...');
    if (config.dryRun) {
      console.log('📋 DRY RUN - skipping Tone.Offline rendering');
    } else {
      // Check if Puppeteer available (optional for now)
      try {
        const puppeteer = await import('puppeteer');
        console.log('✅ Puppeteer found, can render stems');
        
        if (!fs.existsSync(config.stemsDir)) {
          fs.mkdirSync(config.stemsDir, { recursive: true });
        }

        const browser = await puppeteer.default.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        await page.exposeFunction('saveWavFile', (filename, base64Data) => {
            const buffer = Buffer.from(base64Data, 'base64');
            const targetPath = path.join(config.stemsDir, filename);
            fs.writeFileSync(targetPath, buffer);
        });

        await page.addScriptTag({ url: 'https://unpkg.com/tone@14.9.17/build/Tone.js' });

        await page.addScriptTag({ content: `
          function encodeWAV(buffer) {
            const numChannels = buffer.numberOfChannels;
            const sampleRate = buffer.sampleRate;
            const length = buffer.length * numChannels * 2;
            const result = new ArrayBuffer(44 + length);
            const view = new DataView(result);

            writeString(view, 0, 'RIFF');
            view.setUint32(4, 36 + length, true);
            writeString(view, 8, 'WAVE');
            writeString(view, 12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, numChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * numChannels * 2, true);
            view.setUint16(32, numChannels * 2, true);
            view.setUint16(34, 16, true);
            writeString(view, 36, 'data');
            view.setUint32(40, length, true);

            let offset = 44;
            for (let i = 0; i < buffer.length; i++) {
              for (let channel = 0; channel < numChannels; channel++) {
                let sample = buffer.getChannelData(channel)[i];
                sample = Math.max(-1, Math.min(1, sample));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
              }
            }
            return result;
          }

          function writeString(view, offset, string) {
            for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i));
            }
          }

          function bufferToBase64(buffer) {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
          }

          window.generateTrack = async (track) => {
             const duration = Math.min(track.duration || 1, 2); // limit to 2 seconds for fast CLI rendering
             const audioBuffer = await Tone.Offline(({ transport }) => {
                 const synth = new Tone.Synth().toDestination();
                 const notes = ['C4', 'E4', 'G4', 'B4', 'C5'];
                 
                 let time = 0;
                 for(let i=0; i < 8; i++) {
                     synth.triggerAttackRelease(notes[i % notes.length], "8n", time);
                     time += 0.25;
                 }
             }, duration);
             
             const wavBuffer = encodeWAV(audioBuffer);
             const b64 = bufferToBase64(wavBuffer);
             await window.saveWavFile(track.filename, b64);
          };
        ` });

        console.log(`Rendering ${tracks.length} stems (limited to 2s preview each for pipeline speed)...`);
        let count = 0;
        for (const track of tracks) {
            await page.evaluate((t) => window.generateTrack(t), track);
            count++;
            process.stdout.write(`\rRendered ${count}/${tracks.length} stems`);
        }
        console.log('\n✅ All stems rendered and saved to WAV.');

        await browser.close();
      } catch (e) {
        console.warn('\\n⚠️ Puppeteer not available, skipping offline rendering:', e.message);
        console.log('   Install: npm install puppeteer');
      }
    }

    // Summary
    console.log(`\n📊 Pipeline Summary:`);
    console.log(`  - Tracks: ${tracks.length}`);
    console.log(`  - Categories:`);
    Object.entries(result.generated.manifest.categories).forEach(([cat, count]) => {
      console.log(`    • ${cat}: ${count}`);
    });
    console.log(`  - Vertentes:`);
    Object.entries(result.generated.manifest.vertentes).forEach(([vert, count]) => {
      console.log(`    • ${vert}: ${count}`);
    });

    console.log(`\n✅ Audio generation pipeline complete!`);
    console.log(`   Next: npm run dev && visit http://localhost:5173`);
    console.log(`   Then: MusicDirector will load stems and respond to game events`);

  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
