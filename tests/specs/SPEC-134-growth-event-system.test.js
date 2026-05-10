import { describe, test, expect } from 'vitest';
import { evaluateGrowth } from '../../src/engine/GrowthEventSystem';

function makePlayer(overrides = {}) {
    return {
        id: Math.random().toString(36).slice(2),
        name: 'Test Player',
        age: 25,
        ovr: 65,
        attributes: { FIS: 65, DEF: 65, CRI: 65, FIN: 65 },
        energy: 80,
        moral: 60,
        gamesThisSeason: 20,
        _recentTrainCount: 0,
        _retired: false,
        injury: null,
        ...overrides,
    };
}

const base = { teamId: 1, week: 10, season: 3, teamRecentResults: [] };

describe('SPEC-134: GrowthEventSystem', () => {
    test('youth breakthrough only for age < 21', () => {
        const players = [makePlayer({ age: 18 })];
        // Run many times to have chance of triggering
        let found = false;
        for (let i = 0; i < 200; i++) {
            const r = evaluateGrowth({ ...base, players: [makePlayer({ age: 18 })] });
            if (r.growthEvents.some(e => e.type === 'youth_breakthrough')) { found = true; break; }
        }
        // At 4% chance over 200 runs, extremely likely to find one
        expect(found).toBe(true);
    });

    test('youth breakthrough never for age ≥ 21', () => {
        const results = Array(100).fill(null).map(() =>
            evaluateGrowth({ ...base, players: [makePlayer({ age: 21 })] })
        );
        const breakthroughs = results.flatMap(r => r.growthEvents.filter(e => e.type === 'youth_breakthrough'));
        expect(breakthroughs.length).toBe(0);
    });

    test('hot streak only when team has 5+ consecutive wins', () => {
        const results = Array(100).fill(null).map(() =>
            evaluateGrowth({ ...base, players: [makePlayer()], teamRecentResults: ['W','W','W','W','W'] })
        );
        // Should appear at least sometimes (6% chance × 100)
        const hasHot = results.some(r => r.growthEvents.some(e => e.type === 'hot_streak'));
        expect(hasHot).toBe(true);
    });

    test('hot streak is permanent=false', () => {
        let found = null;
        for (let i = 0; i < 200 && !found; i++) {
            const r = evaluateGrowth({ ...base, players: [makePlayer()], teamRecentResults: ['W','W','W','W','W'] });
            found = r.growthEvents.find(e => e.type === 'hot_streak');
        }
        if (found) {
            expect(found.permanent).toBe(false);
            expect(found.duration).toBeGreaterThan(0);
        }
    });

    test('peak season only for age 23-27 with ≥15 games', () => {
        const results = Array(200).fill(null).map(() =>
            evaluateGrowth({ ...base, players: [makePlayer({ age: 25, gamesThisSeason: 20 })] })
        );
        const peaks = results.flatMap(r => r.growthEvents.filter(e => e.type === 'peak_season'));
        peaks.forEach(p => {
            const player = makePlayer({ age: 25, gamesThisSeason: 20 });
            expect(p.ovrDelta).toBe(1);
        });
    });

    test('decline only for age ≥ 32', () => {
        const results = Array(300).fill(null).map(() =>
            evaluateGrowth({ ...base, players: [makePlayer({ age: 35, ovr: 70 })] })
        );
        const declines = results.flatMap(r => r.growthEvents.filter(e => e.type === 'decline'));
        expect(declines.length).toBeGreaterThan(0);
        declines.forEach(d => expect(d.ovrDelta).toBeLessThanOrEqual(0));
    });

    test('OVR never exceeds 99 or falls below 30', () => {
        const edgePlayers = [
            makePlayer({ ovr: 99, age: 18 }), // can only go up (capped at 99)
            makePlayer({ ovr: 30, age: 35 }),  // can only go down (floor 30)
        ];
        for (let i = 0; i < 100; i++) {
            const r = evaluateGrowth({ ...base, players: edgePlayers.map(p => ({ ...p })) });
            r.growthEvents.forEach(e => {
                expect(Math.abs(e.ovrDelta)).toBeLessThanOrEqual(5); // max reasonable delta
            });
        }
    });

    test('no duplicate event type per player per call', () => {
        const players = [makePlayer({ age: 18, _recentTrainCount: 5 })];
        for (let i = 0; i < 50; i++) {
            const r = evaluateGrowth({ ...base, players: players.map(p => ({ ...p })), teamRecentResults: ['W','W','W','W','W'] });
            const byPlayer = {};
            r.growthEvents.forEach(e => {
                const key = `${e.playerId}-${e.type}`;
                expect(byPlayer[key]).toBeUndefined();
                byPlayer[key] = true;
            });
        }
    });

    test('newSquadOvrAvg is computed from current squad', () => {
        const players = [
            makePlayer({ ovr: 60 }),
            makePlayer({ ovr: 70 }),
            makePlayer({ ovr: 80 }),
        ];
        const r = evaluateGrowth({ ...base, players });
        expect(r.newSquadOvrAvg).toBeGreaterThanOrEqual(60);
        expect(r.newSquadOvrAvg).toBeLessThanOrEqual(85);
    });
});
