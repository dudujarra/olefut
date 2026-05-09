// Regression test SPEC-122: makeBuyOffer + scoutLeague + brain memory.
import { describe, test, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { AdaptiveBrain } from '../../src/services/learning/AdaptiveBrain.js';

describe('SPEC-122 — Engine.makeBuyOffer', () => {
    let engine;
    beforeEach(() => {
        engine = new Engine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
    });

    test('makeBuyOffer exists', () => {
        expect(typeof engine.makeBuyOffer).toBe('function');
    });

    test('rejects when target team not found', () => {
        const result = engine.makeBuyOffer(99999, 'fake-id', 1_000_000);
        expect(result.success).toBe(false);
    });

    test('rejects when same team', () => {
        const myId = engine.manager.teamId;
        const result = engine.makeBuyOffer(myId, 'any', 1_000_000);
        expect(result.success).toBe(false);
    });

    test('rejects when balance insufficient', () => {
        const myTeam = engine.getTeam(engine.manager.teamId);
        myTeam.balance = 1000;
        const otherTeam = engine.teams.find(t => t.id !== myTeam.id);
        const player = otherTeam.squad[0];
        const result = engine.makeBuyOffer(otherTeam.id, player.id, 100_000_000);
        expect(result.success).toBe(false);
        expect(result.msg).toMatch(/Saldo/);
    });

    test('high offer (>1.5×value) usually accepted', () => {
        const myTeam = engine.getTeam(engine.manager.teamId);
        myTeam.balance = 100_000_000_000;
        const otherTeam = engine.teams.find(t => t.id !== myTeam.id);
        const player = otherTeam.squad[0];
        const sizeBefore = myTeam.squad.length;
        const otherSizeBefore = otherTeam.squad.length;
        // Try multiple times — probability ~100%
        let anyAccepted = false;
        for (let i = 0; i < 5; i++) {
            const result = engine.makeBuyOffer(
                otherTeam.id,
                otherTeam.squad[0]?.id,
                (otherTeam.squad[0]?.value || 1_000_000) * 2
            );
            if (result.accepted) {
                anyAccepted = true;
                break;
            }
        }
        expect(anyAccepted).toBe(true);
    });

    test('low offer (<0.8×value) always rejected', () => {
        const myTeam = engine.getTeam(engine.manager.teamId);
        myTeam.balance = 1_000_000_000;
        const otherTeam = engine.teams.find(t => t.id !== myTeam.id);
        const player = otherTeam.squad[0];
        const lowOffer = (player.value || 1_000_000) * 0.5;
        const result = engine.makeBuyOffer(otherTeam.id, player.id, lowOffer);
        expect(result.accepted).toBe(false);
    });
});

describe('SPEC-122 — Engine.scoutLeague', () => {
    let engine;
    beforeEach(() => {
        engine = new Engine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
    });

    test('returns array of candidates', () => {
        const candidates = engine.scoutLeague();
        expect(Array.isArray(candidates)).toBe(true);
    });

    test('filters by position', () => {
        const candidates = engine.scoutLeague('ATA');
        candidates.forEach(c => {
            expect(c.position).toBe('ATA');
        });
    });

    test('respects minOVR filter', () => {
        const candidates = engine.scoutLeague(null, 70);
        candidates.forEach(c => {
            expect(c.ovr).toBeGreaterThanOrEqual(70);
        });
    });

    test('excludes own team', () => {
        const myId = engine.manager.teamId;
        const candidates = engine.scoutLeague();
        candidates.forEach(c => {
            expect(c.teamId).not.toBe(myId);
        });
    });

    test('sorted by OVR descending', () => {
        const candidates = engine.scoutLeague(null, 60);
        for (let i = 1; i < candidates.length; i++) {
            expect(candidates[i].ovr).toBeLessThanOrEqual(candidates[i - 1].ovr);
        }
    });
});

describe('SPEC-122 — AdaptiveBrain memory layer', () => {
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

    test('memory starts empty', () => {
        expect(brain.memory).toEqual([]);
    });

    test('remember() adds entry', () => {
        brain.remember({ week: 5, action: 'BUY_ATA_OVR75', result: 'success', reward: 5 });
        expect(brain.memory.length).toBe(1);
        expect(brain.memory[0].action).toBe('BUY_ATA_OVR75');
    });

    test('memory caps at memoryMax', () => {
        for (let i = 0; i < 50; i++) {
            brain.remember({ week: i, action: `A${i}`, reward: 1 });
        }
        expect(brain.memory.length).toBe(brain.memoryMax);
    });

    test('recallContext returns formatted string', () => {
        brain.remember({ week: 5, action: 'BUY_ATA', result: 'success', reward: 5 });
        brain.remember({ week: 6, action: 'SELL_DEF', result: 'success', reward: 3 });
        const context = brain.recallContext(5);
        expect(typeof context).toBe('string');
        expect(context).toContain('BUY_ATA');
        expect(context).toContain('SELL_DEF');
    });

    test('memory persists across save/restore', () => {
        brain.remember({ week: 5, action: 'BUY_ATA', reward: 5 });
        brain.save();
        const fresh = new AdaptiveBrain();
        expect(fresh.memory.length).toBe(1);
        expect(fresh.memory[0].action).toBe('BUY_ATA');
    });

    test('reset clears memory too', () => {
        brain.remember({ week: 5, action: 'BUY_ATA', reward: 5 });
        brain.reset();
        expect(brain.memory.length).toBe(0);
    });
});
