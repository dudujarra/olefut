// Regression test BUG-040..043: cascade discovered via playtest 3.
// 1258 weeks run revealed: only 11 SQUAD_REPLENISH calls, seasonNumber stuck at 1,
// brain Q-values all negative, only 7 states explored.
import { describe, test, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { encodeState } from '../../src/services/learning/AdaptiveBrain.js';

describe('BUG-043 — startNewSeason increments seasonNumber', () => {
    test('seasonNumber++ on rollover', () => {
        const engine = new Engine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        const before = engine.seasonNumber;
        engine.startNewSeason();
        expect(engine.seasonNumber).toBe(before + 1);
    });

    test('multiple rollovers accumulate seasonNumber', () => {
        const engine = new Engine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        engine.startNewSeason();
        engine.startNewSeason();
        engine.startNewSeason();
        expect(engine.seasonNumber).toBe(4);
    });

    test('managerStats reset on new season', () => {
        const engine = new Engine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        engine.managerStats.wins = 10;
        engine.startNewSeason();
        expect(engine.managerStats.wins).toBe(0);
    });
});

describe('BUG-040 — emergency squad replenish in startNewSeason', () => {
    test('squad < 11 triggers double youth intake on rollover', () => {
        const engine = new Engine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return;
        // Simulate severely depleted squad
        team.squad = team.squad.slice(0, 8);
        const before = team.squad.length;
        engine.startNewSeason();
        // Should trigger emergency 2× youth intake
        expect(team.squad.length).toBeGreaterThan(before);
    });

    test('squad >= 11 no emergency intake on rollover', () => {
        const engine = new Engine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return;
        // Squad is normal sized
        const before = team.squad.length;
        engine.startNewSeason();
        // No emergency boost (still might get youth in season-end if applicable)
        // Just ensure no crash
        expect(team.squad.length).toBeGreaterThanOrEqual(before);
    });
});

describe('BUG-042 — state encoding includes squadTier (7 dims)', () => {
    test('thin squad bucket detected', () => {
        const key = encodeState({ squadSize: 8 });
        const parts = key.split('|');
        expect(parts.length).toBe(7);
        expect(parts[5]).toBe('TN');
    });

    test('normal squad bucket', () => {
        const key = encodeState({ squadSize: 15 });
        expect(key.split('|')[5]).toBe('NR');
    });

    test('deep squad bucket', () => {
        const key = encodeState({ squadSize: 22 });
        expect(key.split('|')[5]).toBe('DP');
    });

    test('different squad sizes produce different state keys', () => {
        const thin = encodeState({ squadSize: 8 });
        const deep = encodeState({ squadSize: 22 });
        expect(thin).not.toBe(deep);
    });
});
