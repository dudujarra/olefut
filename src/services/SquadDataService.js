/* eslint-disable no-unused-vars */
/**
 * SquadDataService — SPEC-080
 *
 * Loads pre-baked squad JSON from /public/data/squads/{slug}.json.
 * Lazy-load per-club, cache in-memory.
 */

import { mapSofaScorePosition, calculateRatingForPosition, getMacroPosition } from '../engine/Positions';

import { rng as systemRng } from '../engine/rng.js';

const cache = new Map();

/**
 * Slugify club name for filename.
 */
export function clubSlug(clubName) {
    return clubName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Load squad JSON for a club. Returns array of mapped players or null if unavailable.
 */
export async function loadSquad(clubName) {
    const slug = clubSlug(clubName);
    if (cache.has(slug)) return cache.get(slug);

    try {
        // Use relative path that respects Vite base
        const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
        const url = `${base}data/squads/${slug}.json`.replace(/\/+/g, '/');
        const res = await fetch(url);
        if (!res.ok) {
            cache.set(slug, null);
            return null;
        }
        const raw = await res.json();
        // Support both old format (array) and new format ({manager, players})
        const playersRaw = Array.isArray(raw) ? raw : (raw.players || []);
        const manager = Array.isArray(raw) ? null : raw.manager;
        const mapped = playersRaw.map(mapPlayer);
        const result = { players: mapped, manager };
        cache.set(slug, result);
        return result;
    } catch (e) {
        console.warn(`[SquadData] No squad for ${clubName}:`, e.message);
        cache.set(slug, null);
        return null;
    }
}

/**
 * Map raw SofaScore-style JSON → ELIFOOT player schema.
 */
export function mapPlayer(raw) {
    const naturalPos = raw.positionsDetailed?.length
        ? mapSofaScorePosition(raw.positionsDetailed[0])
        : mapSofaScorePosition(raw.position);

    const pentagon = raw.pentagon || {};
    const attacking = pentagon.attacking ?? 50;
    const technical = pentagon.technical ?? 50;
    const tactical = pentagon.tactical ?? 50;
    const defending = pentagon.defending ?? 50;
    const creativity = pentagon.creativity ?? 50;

    return {
        // Identity
        id: raw.id,
        sofascoreId: raw.id,
        name: raw.shortName || raw.name,
        firstName: raw.firstName,
        lastName: raw.lastName,
        nationality: raw.country?.name || 'Brazil',
        nationalityCode: raw.country?.alpha2 || 'BR',
        dateOfBirth: raw.dateOfBirth,
        age: raw.dateOfBirth ? computeAge(raw.dateOfBirth) : 25,

        // Physical
        height: raw.height || 178,
        weight: raw.weight || 75,
        preferredFoot: raw.preferredFoot || 'Right',
        jerseyNumber: raw.jerseyNumber,

        // Positions (NEW 18-pos)
        naturalPosition: naturalPos,
        secondaryPositions: (raw.positionsDetailed || []).slice(1).map(mapSofaScorePosition),

        // Pentagon
        attacking,
        technical,
        tactical,
        defending,
        creativity,

        // Legacy compat (macro)
        position: getMacroPosition(naturalPos),

        // Legacy attrs derived (engine.js compatibility)
        attrs: {
            atk: attacking,
            mid: (technical + tactical + creativity) / 3 | 0,
            def: defending
        },

        // Hidden attrs (random for now, refined later)
        pressure: 10 + Math.floor(systemRng() * 11),
        bigMatch: 10 + Math.floor(systemRng() * 11),
        loyalty: 10 + Math.floor(systemRng() * 11),
        consistency: 10 + Math.floor(systemRng() * 11),
        injuryProneness: 5 + Math.floor(systemRng() * 11),

        // Game state
        energy: 100,
        moral: 70,
        fitness: 100,
        form: 0,
        isTitular: false,
        isInjured: false,
        injury: null,
        suspension: 0,

        // Career
        seasonGoals: 0,
        seasonAssists: 0,
        seasonAppearances: 0,
        careerGoals: 0,
        careerAppearances: 0,

        // Contract
        contract: {
            weeklyWage: estimateWeeklyWage(raw.proposedMarketValue || 1000000),
            duration: 104,
            weeksRemaining: 104,
            signingBonus: 0,
            releaseClause: (raw.proposedMarketValue || 1000000) * 1.5
        },

        // Market value (EUR converted to BRL ~5.5x)
        marketValue: Math.round((raw.proposedMarketValue || 0) * 5.5),
        marketValueRaw: raw.proposedMarketValue || 0
    };
}

function computeAge(isoDate) {
    const dob = new Date(isoDate);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
}

function estimateWeeklyWage(marketValueEur) {
    // Rough: weekly wage ≈ 0.001 of market value EUR converted to BRL
    return Math.max(500, Math.round(marketValueEur * 5.5 / 1000));
}

/**
 * Inject loaded squad into engine team (replaces current squad).
 */
export async function injectSquadIntoTeam(engine, teamId, clubName) {
    const team = engine.getTeam(teamId);
    if (!team) return { success: false, msg: 'Time não encontrado' };

    const data = await loadSquad(clubName);
    if (!data || !data.players || data.players.length === 0) return { success: false, msg: 'Squad indisponível' };

    team.squad = data.players;
    if (data.manager) {
        team.manager = data.manager;
    }
    return { success: true, count: data.players.length, manager: data.manager?.name };
}
