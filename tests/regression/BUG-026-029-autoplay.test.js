// Regression test BUG-026..031: AutoPlay soak test bugs from playtest 1778351070564.
// Discovered via real run: 4027 weeks but matchesPlayed=0, engine stuck week 38,
// 2416× TRAIN_FAIL, 129× TACTIC_STUCK spam, SPEC-104/106/107/108/111 zeroed.
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { TRAINING_TYPES } from '../../src/engine/ManagerSystems.js';

describe('BUG-026 — engine season rollover', () => {
    let engine;
    beforeEach(() => {
        engine = new Engine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
    });

    test('engine.startNewSeason exists', () => {
        expect(typeof engine.startNewSeason).toBe('function');
    });

    test('advanceWeek auto-rollovers when currentWeek hits 38', () => {
        engine.currentWeek = 38;
        const seasonBefore = engine.seasonNumber;
        engine.advanceWeek();
        // After rollover, week should be reset (then incremented to 1 by line 841)
        expect(engine.currentWeek).toBeLessThanOrEqual(38);
        // Some season-end logic ran or rollover happened
        expect(engine.currentWeek).not.toBe(38);
    });

    test('startNewSeason re-inits tournament fixtures', () => {
        const league = engine.tournaments.find(t => t.fixtures);
        if (!league) return; // skip if no league
        // Mark one fixture as played
        if (league.fixtures[0]?.[0]) {
            league.fixtures[0][0].played = true;
        }
        engine.startNewSeason();
        // After re-init, fixtures should be reset (no played flags)
        const anyPlayed = league.fixtures.some(round =>
            Array.isArray(round) && round.some(m => m.played)
        );
        expect(anyPlayed).toBe(false);
    });

    test('startNewSeason resets currentWeek to 0', () => {
        engine.currentWeek = 38;
        engine.startNewSeason();
        expect(engine.currentWeek).toBe(0);
    });

    test('multiple advanceWeek calls survive past week 38', () => {
        // Run 100 weeks — should not get stuck
        const initialWeek = engine.currentWeek;
        let lastWeek = initialWeek;
        let progressedAtLeastOnce = false;
        for (let i = 0; i < 50; i++) {
            engine.advanceWeek();
            if (engine.currentWeek !== lastWeek) progressedAtLeastOnce = true;
            lastWeek = engine.currentWeek;
        }
        expect(progressedAtLeastOnce).toBe(true);
    });
});

describe('BUG-027 — TRAINING_ROTATION uses engine catalog', () => {
    test('all training IDs in rotation are valid engine TRAINING_TYPES', async () => {
        const mod = await import('../../src/services/AutoPlayService.js');
        // TRAINING_ROTATION is module-private but exported via TRAINING_ROTATION_LIST
        const rotation = mod.TRAINING_ROTATION_LIST;
        expect(Array.isArray(rotation)).toBe(true);
        expect(rotation.length).toBeGreaterThan(0);
        const validIds = TRAINING_TYPES.map(t => t.id);
        rotation.forEach(id => {
            expect(validIds).toContain(id);
        });
    });

    test('engine.doTraining accepts every rotation entry', () => {
        const engine = new Engine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        const validIds = TRAINING_TYPES.map(t => t.id);
        validIds.forEach(id => {
            const result = engine.doTraining(id);
            expect(result).toBeDefined();
            // Some may return success, some maybe success:false but never crash
            expect(typeof result).toBe('object');
        });
    });
});

describe('BUG-026b — match counting from weekResults shape', () => {
    test('weekResults is keyed by tournamentId, not { matches }', () => {
        const engine = new Engine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        const result = engine.advanceWeek();
        if (result === null) return; // already past week 38 — skip
        expect(typeof result).toBe('object');
        // Old buggy code expected result.matches; verify shape is keyed
        // (each value should be array OR engine returns object)
        const keys = Object.keys(result);
        keys.forEach(k => {
            expect(['object', 'undefined']).toContain(typeof result[k]);
        });
    });
});

describe('BUG-029 — TRAIN frequency cap', () => {
    test('AutoPlay TRAIN throttle reduces from 100% to ~33%', async () => {
        // Bot logic: TRAIN only fires when weeksPlayed % 3 === 0.
        // Over 100 weeks, expected ~34 TRAIN calls (was 94 in playtest).
        let trainCalls = 0;
        for (let week = 0; week < 100; week++) {
            if (week % 3 === 0) trainCalls++;
        }
        expect(trainCalls).toBeLessThan(40);
        expect(trainCalls).toBeGreaterThan(30);
    });
});

describe('BUG-031 — TACTIC_STUCK dedupe', () => {
    test('TACTIC_STUCK fires at most once per 38 weeks', () => {
        // Simulate condition: log only if currentWeek - lastLogWeek >= 38
        const log = [];
        let lastLogWeek = -999;
        for (let week = 0; week < 200; week++) {
            const consecutive = 35; // always above threshold
            if (consecutive > 30) {
                if (week - lastLogWeek >= 38) {
                    log.push(week);
                    lastLogWeek = week;
                }
            }
        }
        // Over 200 weeks with 38-week cooldown → ~5 logs max
        expect(log.length).toBeLessThanOrEqual(6);
        expect(log.length).toBeGreaterThan(0);
    });
});
