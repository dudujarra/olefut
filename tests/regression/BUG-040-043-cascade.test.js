// Regression test BUG-040..043: cascade discovered via playtest 3.
// 1258 weeks run revealed: only 11 SQUAD_REPLENISH calls, seasonNumber stuck at 1,
// brain Q-values all negative, only 7 states explored.
import { describe, test, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { createEngine } from '../../src/engine/engineFactory.js';
import { encodeState } from '../../src/services/learning/AdaptiveBrain.js';

describe('BUG-043 — startNewSeason increments seasonNumber', () => {
    test('seasonNumber++ on rollover', () => {
        const engine = createEngine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        const before = engine.seasonNumber;
        engine.startNewSeason();
        expect(engine.seasonNumber).toBe(before + 1);
    });

    test('multiple rollovers accumulate seasonNumber', () => {
        const engine = createEngine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        engine.startNewSeason();
        engine.startNewSeason();
        engine.startNewSeason();
        expect(engine.seasonNumber).toBe(4);
    });

    test('managerStats reset on new season', () => {
        const engine = createEngine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        engine.managerStats.wins = 10;
        engine.startNewSeason();
        expect(engine.managerStats.wins).toBe(0);
    });
});

describe('BUG-040 — emergency squad replenish in startNewSeason', () => {
    test('NPC squad < 16 triggers emergency replenish on rollover', () => {
        const engine = createEngine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        const npcTeam = engine.teams.find(t => t.id !== engine.manager.teamId);
        if (!npcTeam) return;
        // Simulate severely depleted squad
        npcTeam.squad = npcTeam.squad.slice(0, 8);
        const before = npcTeam.squad.length;
        engine.startNewSeason();
        // Should trigger emergency replenish for NPC
        expect(npcTeam.squad.length).toBeGreaterThan(before);
        expect(npcTeam.squad.length).toBeGreaterThanOrEqual(16);
    });

    test('Manager squad is excluded from emergency replenish on rollover', () => {
        const engine = createEngine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return;
        // Squad is severely depleted
        team.squad = team.squad.slice(0, 8);
        const before = team.squad.length;
        engine.startNewSeason();
        // Manager must handle their own squad size; no bailouts in Sinistro
        expect(team.squad.length).toBe(before);
    });
});

describe('BUG-042 — state encoding includes squadTier (9 dims, incl opponent scouting)', () => {
    test('thin squad bucket detected', () => {
        const key = encodeState({ squadSize: 8 });
        const parts = key.split('|');
        expect(parts.length).toBe(9);
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
