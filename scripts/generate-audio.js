#!/usr/bin/env node

/**
 * generate-audio.js
 * CLI entry point for full 72-track audio generation
 * Usage: npm run generate:audio [--dry-run] [--seed 12345] [--vertente tech]
 */

import fs from 'fs';
import path from 'path';
import { AudioGenerator } from '../src/audio/AudioGenerator.js';

async function main() {
  const args = process.argv.slice(2);
  const config = {
    dryRun: args.includes('--dry-run'),
    seed: args.find(a => a.startsWith('--seed='))?.split('=')[1] || Date.now(),
    outputDir: 'public/audio'
  };

  console.log('🎵 ELIFOOT Audio Generation System');
  console.log(`📦 Config: ${JSON.stringify(config, null, 2)}`);

  const generator = new AudioGenerator(config);
  const result = await generator.generate();

  // Write metadata
  if (!config.dryRun) {
    const outputDir = config.outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const metadataPath = path.join(outputDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(result, null, 2));
    console.log(`\n✅ Metadata written: ${metadataPath}`);

    // Write SUNO prompts
    const promptsPath = path.join(outputDir, 'suno-prompts.json');
    fs.writeFileSync(promptsPath, JSON.stringify(result.sunoPrompts, null, 2));
    console.log(`✅ SUNO prompts written: ${promptsPath}`);
  } else {
    console.log('\n📋 DRY RUN - no files written');
  }

  // Validation
  if (!result.validation.passed) {
    console.error('\n❌ Validation failed:');
    result.validation.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('\n✅ All validations passed!');
  console.log(`📊 Generated: ${result.generated.tracks.length} tracks`);
  console.log(`  - Context: ${result.generated.manifest.categories.context}`);
  console.log(`  - Pre-Match: ${result.generated.manifest.categories.preMatch}`);
  console.log(`  - Match: ${result.generated.manifest.categories.match}`);
  console.log(`  - Post-Match: ${result.generated.manifest.categories.postMatch}`);
  console.log(`  - Narrative: ${result.generated.manifest.categories.narrative}`);
  console.log(`  - Admin: ${result.generated.manifest.categories.admin}`);

  console.log(`\n🎵 Vertentes:`);
  Object.entries(result.generated.manifest.vertentes).forEach(([v, count]) => {
    console.log(`  - ${v}: ${count}`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
