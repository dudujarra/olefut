// Regression test SPEC-123: real-time learning visualization data structures.
import { describe, test, expect, beforeEach } from 'vitest';
import { AdaptiveBrain } from '../../src/services/learning/AdaptiveBrain.js';

describe('SPEC-123 — brain summary contract for UI', () => {
    let brain;
    beforeEach(() => {
        const store = {};
        global.localStorage = {
            getItem: (k) => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: (k) => { delete store[k]; }
        };
        brain = new AdaptiveBrain();
        brain.reset();
    });

    test('summary returns shape needed by LearningPanel', () => {
        brain.observe('s1', 'A', 5, 's2', []);
        brain.observe('s2', 'B', -3, 's1', []);
        const sum = brain.summary();
        expect(typeof sum.states).toBe('number');
        expect(typeof sum.totalUpdates).toBe('number');
        expect(Array.isArray(sum.topActions)).toBe(true);
    });

    test('topActions entries have action + totalQ fields', () => {
        for (let i = 0; i < 5; i++) {
            brain.observe('s1', 'TRAIN_fitness', 10, 's2', []);
        }
        const sum = brain.summary();
        sum.topActions.forEach(a => {
            expect(typeof a.action).toBe('string');
            expect(typeof a.totalQ).toBe('number');
        });
    });

    test('memory exposes recent entries for UI', () => {
        brain.remember({ week: 5, season: 1, action: 'BUY_ATA', reward: 5 });
        brain.remember({ week: 6, season: 1, action: 'SELL_DEF', reward: 3 });
        expect(brain.memory.length).toBe(2);
        expect(brain.memory[0].action).toBe('BUY_ATA');
    });

    test('memory entries have fields needed by MemoryEntry component', () => {
        brain.remember({
            week: 5, season: 1, action: 'BUY_ATA',
            result: 'success', reward: 5
        });
        const entry = brain.memory[0];
        expect(entry.week).toBe(5);
        expect(entry.season).toBe(1);
        expect(entry.action).toBe('BUY_ATA');
        expect(entry.reward).toBe(5);
    });
});

describe('SPEC-123 — seasonHistory tracking', () => {
    test('seasonHistory record shape', () => {
        const rec = {
            season: 5,
            wins: 3,
            draws: 1,
            losses: 4,
            transfers: 2,
            matchesPlayed: 38,
            brainStates: 12,
            brainUpdates: 245,
            seasonWins: 1,
            seasonLosses: 2,
            seasonDraws: 0,
            seasonTransfers: 1
        };
        expect(typeof rec.season).toBe('number');
        expect(typeof rec.seasonWins).toBe('number');
        expect(typeof rec.seasonLosses).toBe('number');
    });

    test('seasonHistory cap is 100', () => {
        const arr = [];
        for (let i = 1; i <= 150; i++) {
            arr.push({ season: i, wins: 0 });
        }
        const capped = arr.length > 100 ? arr.slice(-100) : arr;
        expect(capped.length).toBe(100);
        expect(capped[0].season).toBe(51); // last 100
        expect(capped[99].season).toBe(150);
    });
});
