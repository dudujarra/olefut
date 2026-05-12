#!/usr/bin/env node
// SPEC-177: split src/data/realPlayers.json into 4 regional JSON files
// for code-splitting in Vite (loaded via dynamic import in src/engine/data.js).
//
// Source-of-truth file: src/data/realPlayers.json (produced by scrape_sofifa.py).
// Derived files (committed): realPlayers_BRA.json, realPlayers_EUR.json,
// realPlayers_SAM.json, realPlayers_pool.json.
//
// Run this script whenever realPlayers.json is regenerated. The split is
// derived from team→region membership in src/engine/db/{brazil,europe,south_america}.js.
// Any player whose team is NOT in those DBs lands in the `pool` bucket
// (used for procedural name generation + getRandomRealPlayer fallback).
//
// Usage: node scripts/split-real-players.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { BrazilDB } from '../src/engine/db/brazil.js';
import { EuropeDB } from '../src/engine/db/europe.js';
import { SouthAmericaDB } from '../src/engine/db/south_america.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');
const dataDir = join(root, 'src', 'data');

const rawText = readFileSync(join(dataDir, 'realPlayers.json'), 'utf-8');
const data = JSON.parse(rawText);

const braTeams = new Set();
Object.values(BrazilDB).flat().forEach((c) => braTeams.add(c.name));
const euTeams = new Set();
Object.values(EuropeDB).forEach((z) => Object.values(z).flat().forEach((c) => euTeams.add(c.name)));
const samTeams = new Set();
Object.values(SouthAmericaDB).forEach((z) => Object.values(z).flat().forEach((c) => samTeams.add(c.name)));

const buckets = { BRA: [], EUR: [], SAM: [], pool: [] };
for (const p of data) {
    if (braTeams.has(p.team)) buckets.BRA.push(p);
    else if (euTeams.has(p.team)) buckets.EUR.push(p);
    else if (samTeams.has(p.team)) buckets.SAM.push(p);
    else buckets.pool.push(p);
}

writeFileSync(join(dataDir, 'realPlayers_BRA.json'), JSON.stringify(buckets.BRA));
writeFileSync(join(dataDir, 'realPlayers_EUR.json'), JSON.stringify(buckets.EUR));
writeFileSync(join(dataDir, 'realPlayers_SAM.json'), JSON.stringify(buckets.SAM));
writeFileSync(join(dataDir, 'realPlayers_pool.json'), JSON.stringify(buckets.pool));

const sum = buckets.BRA.length + buckets.EUR.length + buckets.SAM.length + buckets.pool.length;
console.log('[split-real-players] wrote 4 regional files');
console.log(`  BRA:  ${buckets.BRA.length} players`);
console.log(`  EUR:  ${buckets.EUR.length} players`);
console.log(`  SAM:  ${buckets.SAM.length} players`);
console.log(`  pool: ${buckets.pool.length} players (no DB team match)`);
console.log(`  total: ${sum} (source: ${data.length})`);
if (sum !== data.length) {
    console.error('[split-real-players] BUG: regional sum ≠ source length');
    process.exit(1);
}
