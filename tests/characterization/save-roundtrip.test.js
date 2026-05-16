/**
 * Save Round-trip Tests — AKITA-RFCT-002
 *
 * Garante que future refactors não quebrem serialização.
 * BUG-021 regression test embedded.
 *
 * Strategy:
 * 1. Initialize engine + simulate weeks
 * 2. Serialize via GameContext serializeEngine logic
 * 3. JSON.stringify + JSON.parse round-trip
 * 4. Restore via restoreEngine logic
 * 5. Verify state preserved (deep equal subset)
 * 6. Verify tournament prototypes restored (BUG-021)
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { createEngine } from '../../src/engine/engineFactory.js';
import { Tournament } from '../../src/engine/tournaments/Tournament.js';
import { League } from '../../src/engine/tournaments/League.js';
import { KnockoutCup } from '../../src/engine/tournaments/KnockoutCup.js';
import { ContinentalCup } from '../../src/engine/tournaments/ContinentalCup.js';
import { StateChampionship } from '../../src/engine/tournaments/StateChampionship.js';
import { WorldClubCup } from '../../src/engine/tournaments/WorldClubCup.js';

function createSeededRng(seed) {
    let state = seed >>> 0;
    return function () {
        state = (state + 0x6D2B79F5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const ENGINE_CLASS_FIELDS = ['staff', 'board', 'legacy'];
const TOURNAMENT_CLASSES = { Tournament, League, KnockoutCup, ContinentalCup, StateChampionship, WorldClubCup };

function tournamentClassFromShape(t) {
    if (!t || typeof t !== 'object') return Tournament;
    if (t.__class && TOURNAMENT_CLASSES[t.__class]) return TOURNAMENT_CLASSES[t.__class];
    // SPEC-168: state championships têm `state` (UF) e `phase`
    if (typeof t.state === 'string' && typeof t.phase === 'string') return StateChampionship;
    if (typeof t.level === 'number') return League;
    if (Array.isArray(t.groupWeeks)) return ContinentalCup;
    if (Array.isArray(t.roundWeeks)) return KnockoutCup;
    return Tournament;
}

function serializeEngine(engine) {
    const safe = {};
    for (const key of Object.keys(engine)) {
        if (ENGINE_CLASS_FIELDS.includes(key)) continue;
        try {
            const v = engine[key];
            if (typeof v === 'function') continue;
            if (v instanceof Map || v instanceof Set) continue;
            JSON.stringify(v);
            safe[key] = v;
        } catch {
            // Skip non-serializable
        }
    }
    if (engine.staff && Array.isArray(engine.staff.hired)) {
        safe._staffHired = engine.staff.hired;
    }
    if (Array.isArray(engine.tournaments)) {
        safe.tournaments = engine.tournaments.map(t => ({
            ...t,
            __class: t?.constructor?.name || 'Tournament'
        }));
    }
    return safe;
}

function restoreEngine(engine, snapshot) {
    if (!snapshot) return;
    for (const [key, val] of Object.entries(snapshot)) {
        if (key === '_staffHired') continue;
        if (ENGINE_CLASS_FIELDS.includes(key)) continue;
        try {
            engine[key] = val;
        } catch {
            // Skip
        }
    }
    if (Array.isArray(engine.tournaments)) {
        engine.tournaments = engine.tournaments.map(rawT => {
            if (!rawT) return rawT;
            const ClassConstructor = tournamentClassFromShape(rawT);
            const restored = Object.create(ClassConstructor.prototype);
            for (const [k, v] of Object.entries(rawT)) {
                if (k === '__class') continue;
                restored[k] = v;
            }
            return restored;
        });
    }
    if (snapshot._staffHired && engine.staff) {
        engine.staff.hired = [...snapshot._staffHired];
    }
}

describe('Save round-trip preservation (RFCT-002)', () => {
    let originalRandom;

    beforeEach(() => {
        originalRandom = Math.random;
        Math.random = createSeededRng(42);
    });

    afterEach(() => {
        Math.random = originalRandom;
    });

    test('baseline fixture matches expected shape', async () => {
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const fixturePath = path.resolve(__dirname, '../__fixtures__/save-baseline-v2.json');

        // Generate baseline from current engine
        const engine = createEngine();
        engine.initGame('Dudu', 1, 'manager', 'livre', 'ATA');
        for (let i = 0; i < 10; i++) engine.advanceWeek();

        const payload = {
            version: 2,
            schemaVersion: 2,
            timestamp: 0, // fixed for reproducibility
            gameState: {
                started: true,
                view: 'dashboard',
                manager: 'Dudu',
                teamId: 1,
                mode: 'manager'
            },
            engine: serializeEngine(engine)
        };

        // Write fixture (regenerable on each run)
        try {
            fs.writeFileSync(fixturePath, JSON.stringify(payload, null, 2));
        } catch { /* read-only env, skip */ }

        // Verify shape
        expect(payload.version).toBe(2);
        expect(payload.schemaVersion).toBe(2);
        expect(payload.gameState.mode).toBe('manager');
        expect(payload.engine.teams).toBeDefined();
        expect(payload.engine.tournaments).toBeDefined();
        expect(Array.isArray(payload.engine.tournaments)).toBe(true);
    });

    test('engine state survives JSON round-trip', () => {
        const engine = createEngine();
        engine.initGame('Dudu', 1, 'manager', 'livre', 'ATA');
        for (let i = 0; i < 10; i++) engine.advanceWeek();

        const serialized = serializeEngine(engine);
        const json = JSON.stringify(serialized);
        const parsed = JSON.parse(json);

        const newEngine = createEngine();
        restoreEngine(newEngine, parsed);

        expect(newEngine.currentWeek).toBe(engine.currentWeek);
        expect(newEngine.seasonNumber).toBe(engine.seasonNumber);
        expect(newEngine.teams.length).toBe(engine.teams.length);
        expect(newEngine.manager.teamId).toBe(engine.manager.teamId);
        expect(newEngine.tournaments.length).toBe(engine.tournaments.length);
    });

    test('BUG-021: Tournament prototypes restored after round-trip', () => {
        const engine = createEngine();
        engine.initGame('Dudu', 1, 'manager', 'livre', 'ATA');
        for (let i = 0; i < 5; i++) engine.advanceWeek();

        const json = JSON.stringify(serializeEngine(engine));
        const parsed = JSON.parse(json);

        const restored = createEngine();
        restoreEngine(restored, parsed);

        for (const t of restored.tournaments) {
            expect(typeof t.advanceWeek).toBe('function');
        }
    });

    test('Tournament classes preserved via __class tag', () => {
        const engine = createEngine();
        engine.initGame('Dudu', 1, 'manager', 'livre', 'ATA');

        const serialized = serializeEngine(engine);

        // All tournaments have __class tag
        for (const t of serialized.tournaments) {
            expect(t.__class).toBeDefined();
            // SPEC-168: StateChampionship, SPEC-180: WorldClubCup
            expect(['Tournament', 'League', 'KnockoutCup', 'ContinentalCup', 'StateChampionship', 'WorldClubCup']).toContain(t.__class);
        }
    });

    test('class instance fields skipped (staff/board/legacy)', () => {
        const engine = createEngine();
        engine.initGame('Dudu', 1, 'manager', 'livre', 'ATA');

        const serialized = serializeEngine(engine);

        expect(serialized.board).toBeUndefined();
        expect(serialized.legacy).toBeUndefined();
        expect(serialized.staff).toBeUndefined();
        // _staffHired array preserved separately
        expect(Array.isArray(serialized._staffHired)).toBe(true);
    });

    test('round-trip preserves teams structure (deep)', () => {
        const engine = createEngine();
        engine.initGame('Dudu', 1, 'manager', 'livre', 'ATA');
        for (let i = 0; i < 3; i++) engine.advanceWeek();

        const json = JSON.stringify(serializeEngine(engine));
        const parsed = JSON.parse(json);
        const restored = createEngine();
        restoreEngine(restored, parsed);

        // Compare team[0] structure
        const original0 = engine.teams[0];
        const restored0 = restored.teams[0];

        expect(restored0.id).toBe(original0.id);
        expect(restored0.name).toBe(original0.name);
        expect(restored0.zone).toBe(original0.zone);
        expect(restored0.division).toBe(original0.division);
        expect(restored0.squad.length).toBe(original0.squad.length);
    });
});
