#!/usr/bin/env node
/**
 * scrape-squads.mjs — SPEC-080 Sprint S
 *
 * Scrapes SofaScore API for 170 clubs, saves JSON to public/data/squads/.
 *
 * Usage:
 *   node scripts/scrape-squads.mjs                    # full scrape
 *   node scripts/scrape-squads.mjs --club=flamengo    # single club
 *   node scripts/scrape-squads.mjs --discover         # find SofaScore IDs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/data/squads');
const IDS_FILE = path.join(ROOT, 'src/data/clubsSofascoreIds.json');

const SOFASCORE_API = 'https://api.sofascore.com/api/v1';
const RATE_LIMIT_MS = 1000;

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function fetchJSON(url) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9,pt;q=0.8',
            'Referer': 'https://www.sofascore.com/',
            'Origin': 'https://www.sofascore.com'
        }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
    return res.json();
}

async function searchClub(name) {
    const q = encodeURIComponent(name);
    try {
        const data = await fetchJSON(`${SOFASCORE_API}/search/teams/${q}`);
        const teams = data.teams || [];
        // Prefer Brazilian clubs
        const br = teams.find(t => t.team?.country?.alpha2 === 'BR');
        return (br || teams[0])?.team?.id || null;
    } catch (e) {
        console.warn(`Search failed for ${name}: ${e.message}`);
        return null;
    }
}

async function fetchSquad(teamId) {
    const data = await fetchJSON(`${SOFASCORE_API}/team/${teamId}/players`);
    return data.players || [];
}

async function fetchPlayerAttrs(playerId) {
    try {
        const data = await fetchJSON(`${SOFASCORE_API}/player/${playerId}/attribute-overviews`);
        const overviews = data.averageAttributeOverviews || [];
        return overviews[0] || null;
    } catch (e) {
        return null;
    }
}

async function enrichSquad(squad) {
    const out = [];
    for (const entry of squad) {
        const p = entry.player || entry;
        const pentagon = await fetchPlayerAttrs(p.id);
        out.push({
            id: p.id,
            name: p.name,
            firstName: p.firstName,
            lastName: p.lastName,
            shortName: p.shortName,
            position: p.position,
            positionsDetailed: p.positionsDetailed || [],
            jerseyNumber: p.jerseyNumber,
            shirtNumber: p.shirtNumber,
            height: p.height,
            weight: p.weight,
            dateOfBirth: p.dateOfBirth,
            preferredFoot: p.preferredFoot,
            country: p.country,
            proposedMarketValue: p.proposedMarketValue,
            currency: p.currency,
            pentagon
        });
        await sleep(RATE_LIMIT_MS);
    }
    return out;
}

function slugify(str) {
    return String(str)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function main() {
    const args = process.argv.slice(2);
    const single = args.find(a => a.startsWith('--club='))?.split('=')[1];
    const discover = args.includes('--discover');

    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }

    if (discover) {
        // Discover SofaScore IDs for all clubs
        const clubs = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/clubColors.js'), 'utf-8')
            .match(/CLUB_COLORS = (\{[\s\S]+?\n\})/)[1]
            .replace(/(\w+):/g, '"$1":')
            .replace(/'/g, '"'));
        const ids = {};
        const names = Object.keys(clubs);
        for (const name of names) {
            console.log(`Searching: ${name}`);
            const id = await searchClub(name);
            if (id) ids[name] = id;
            await sleep(RATE_LIMIT_MS);
        }
        fs.writeFileSync(IDS_FILE, JSON.stringify(ids, null, 2));
        console.log(`Saved ${Object.keys(ids).length} IDs to ${IDS_FILE}`);
        return;
    }

    let ids = {};
    if (fs.existsSync(IDS_FILE)) {
        ids = JSON.parse(fs.readFileSync(IDS_FILE, 'utf-8'));
    }

    const targets = single
        ? Object.entries(ids).filter(([name]) => slugify(name) === single)
        : Object.entries(ids);

    console.log(`Scraping ${targets.length} clubs...`);

    for (const [name, teamId] of targets) {
        const slug = slugify(name);
        const outFile = path.join(OUT_DIR, `${slug}.json`);
        if (fs.existsSync(outFile) && !single) {
            console.log(`Skip (exists): ${name}`);
            continue;
        }

        try {
            console.log(`Fetching ${name} (id=${teamId})...`);
            const rawSquad = await fetchSquad(teamId);
            console.log(`  ${rawSquad.length} players, enriching attrs...`);
            const enriched = await enrichSquad(rawSquad);
            fs.writeFileSync(outFile, JSON.stringify(enriched, null, 2));
            console.log(`  Saved ${outFile} (${enriched.length} players)`);
        } catch (e) {
            console.error(`  ERROR: ${e.message}`);
        }
        await sleep(RATE_LIMIT_MS);
    }

    console.log('Done.');
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
