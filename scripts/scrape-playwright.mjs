#!/usr/bin/env node
/**
 * scrape-playwright.mjs — SPEC-080 Sprint S
 *
 * Playwright-based scraper para SofaScore (bypassa bot detection HTTP 403).
 * Headless Chromium browser fetches API endpoints com cookies/JS context.
 *
 * Usage:
 *   node scripts/scrape-playwright.mjs --discover           # find IDs all clubs
 *   node scripts/scrape-playwright.mjs --club=flamengo      # single club
 *   node scripts/scrape-playwright.mjs --batch=big          # 12 big clubs
 *   node scripts/scrape-playwright.mjs                       # full 170
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/data/squads');
const IDS_FILE = path.join(ROOT, 'src/data/clubsSofascoreIds.json');
const RATE_MS = 1500;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function slugify(str) {
    return String(str)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function fetchJSONInPage(page, url) {
    // Use page.context().request which inherits browser cookies + bypasses CORS
    const ctx = page.context();
    const res = await ctx.request.get(url, {
        headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.sofascore.com/'
        }
    });
    if (!res.ok()) throw new Error(`HTTP ${res.status()}`);
    return res.json();
}

// Name variants: original, no accents, "-MG"→"Mineiro", "-PR"→"Paranaense", etc
function nameVariants(name) {
    const variants = new Set([name]);
    // Strip accents
    const noAccents = name.normalize('NFD').replace(/[̀-ͯ]/g, '');
    variants.add(noAccents);
    // Suffix expansions
    const suffixMap = {
        '-MG': ' Mineiro',
        '-PR': ' Paranaense',
        '-RS': ' Gaúcho',
        '-SP': ' Paulista',
        '-RJ': '',
        '-CE': ' Cearense',
        '-PE': ' Pernambucano',
        '-BA': ' Bahia',
        '-CHI': '',
        '-ARG': '',
    };
    for (const [suf, repl] of Object.entries(suffixMap)) {
        if (name.endsWith(suf)) {
            const expanded = name.slice(0, -suf.length) + repl;
            variants.add(expanded.trim());
            variants.add(expanded.normalize('NFD').replace(/[̀-ͯ]/g, '').trim());
        }
    }
    // Without "FC" / "EC" / "AC" prefixes
    variants.add(name.replace(/^(FC|EC|AC|CR|SC)\s+/, ''));
    return [...variants].filter(v => v && v.length > 1);
}

async function searchClubId(page, name) {
    const variants = nameVariants(name);
    for (const variant of variants) {
        try {
            const data = await fetchJSONInPage(page, `https://api.sofascore.com/api/v1/search/teams/${encodeURIComponent(variant)}`);
            const teams = data.teams || [];
            if (teams.length === 0) continue;
            // Prefer Brazilian, then any
            const br = teams.find(t => t.team?.country?.alpha2 === 'BR');
            const result = (br || teams[0])?.team?.id;
            if (result) return result;
        } catch {
            // Try next variant
        }
        await sleep(300);
    }
    return null;
}

async function fetchSquad(page, teamId) {
    const data = await fetchJSONInPage(page, `https://api.sofascore.com/api/v1/team/${teamId}/players`);
    return data.players || [];
}

async function fetchPlayerAttrs(page, playerId) {
    try {
        const data = await fetchJSONInPage(page, `https://api.sofascore.com/api/v1/player/${playerId}/attribute-overviews`);
        return (data.averageAttributeOverviews || [])[0] || null;
    } catch {
        return null;
    }
}

async function enrichSquad(page, squad) {
    const out = [];
    for (let i = 0; i < squad.length; i++) {
        const entry = squad[i];
        const p = entry.player || entry;
        const pentagon = await fetchPlayerAttrs(page, p.id);
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
        process.stdout.write('.');
        await sleep(RATE_MS);
    }
    process.stdout.write('\n');
    return out;
}

async function loadClubsList() {
    const colorsRaw = fs.readFileSync(path.join(ROOT, 'src/data/clubColors.js'), 'utf-8');
    // Extract club names from "ClubName": { ... } pattern (double quotes)
    const matches = colorsRaw.match(/"([^"]+)":\s*\{[^}]*sheet:/g) || [];
    const names = matches.map(m => m.match(/"([^"]+)":/)[1]).filter((v, i, a) => a.indexOf(v) === i);
    return names;
}

async function main() {
    const args = process.argv.slice(2);
    const single = args.find(a => a.startsWith('--club='))?.split('=')[1];
    const batchType = args.find(a => a.startsWith('--batch='))?.split('=')[1];
    const discover = args.includes('--discover');

    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    // Warm up cookies via SofaScore homepage
    await page.goto('https://www.sofascore.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);

    try {
        if (discover) {
            const clubs = await loadClubsList();
            const ids = fs.existsSync(IDS_FILE) ? JSON.parse(fs.readFileSync(IDS_FILE, 'utf-8')) : {};
            console.log(`Discovering IDs for ${clubs.length} clubs...`);
            for (const name of clubs) {
                if (ids[name]) {
                    console.log(`Skip (have): ${name} = ${ids[name]}`);
                    continue;
                }
                const id = await searchClubId(page, name);
                if (id) {
                    ids[name] = id;
                    console.log(`Found: ${name} = ${id}`);
                } else {
                    console.log(`NOT FOUND: ${name}`);
                }
                fs.writeFileSync(IDS_FILE, JSON.stringify(ids, null, 2));
                await sleep(RATE_MS);
            }
            console.log(`Saved ${Object.keys(ids).length} IDs to ${IDS_FILE}`);
            return;
        }

        let ids = {};
        if (fs.existsSync(IDS_FILE)) ids = JSON.parse(fs.readFileSync(IDS_FILE, 'utf-8'));

        let targets;
        if (single) {
            targets = Object.entries(ids).filter(([name]) => slugify(name) === single);
        } else if (batchType === 'big') {
            const bigClubNames = ['Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo', 'Santos', 'Grêmio', 'Internacional', 'Atlético Mineiro', 'Cruzeiro', 'Fluminense', 'Vasco', 'Botafogo'];
            targets = bigClubNames.filter(n => ids[n]).map(n => [n, ids[n]]);
        } else {
            targets = Object.entries(ids);
        }

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
                const rawSquad = await fetchSquad(page, teamId);
                console.log(`  ${rawSquad.length} players, enriching...`);
                const enriched = await enrichSquad(page, rawSquad);
                fs.writeFileSync(outFile, JSON.stringify(enriched, null, 2));
                console.log(`  Saved ${outFile}`);
            } catch (e) {
                console.error(`  ERROR ${name}: ${e.message}`);
            }
            await sleep(RATE_MS);
        }

        console.log('Done.');
    } finally {
        await browser.close();
    }
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
