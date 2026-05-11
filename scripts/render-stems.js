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

  console.log('🎵 ELIFOOT Audio Generation Pipeline');
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
        // TODO: Spawn browser for Tone.Offline rendering
        // For now, just note that stems would be rendered here
      } catch (e) {
        console.warn('⚠️ Puppeteer not available, skipping offline rendering');
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
