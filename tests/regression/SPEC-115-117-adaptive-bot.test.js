// Regression test SPEC-115/116/117: AdaptiveBrain Q-learning + goal hierarchy.
// Validates state encoding, action selection, Bellman update, goal modulation.
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
    AdaptiveBrain,
    encodeState,
    detectGoals,
    actionRelevance,
    computeReward
} from '../../src/services/learning/AdaptiveBrain.js';

describe('SPEC-115/116 — encodeState', () => {
    test('encodes all 5 dimensions', () => {
        const key = encodeState({
            position: 1,
            totalTeams: 20,
            balance: 100_000_000,
            formAvg: 80,
            week: 5,
            lastResult: 'W'
        });
        expect(typeof key).toBe('string');
        expect(key.split('|').length).toBe(5);
    });

    test('top4 vs bottom positioning', () => {
        const top = encodeState({ position: 2, totalTeams: 20 });
        const bot = encodeState({ position: 19, totalTeams: 20 });
        expect(top.startsWith('avg|top4')).toBe(true);
        expect(bot.startsWith('avg|bottom')).toBe(true);
    });

    test('balance tiers', () => {
        expect(encodeState({ balance: -100 }).split('|')[2]).toBe('red');
        expect(encodeState({ balance: 1_000_000 }).split('|')[2]).toBe('low');
        expect(encodeState({ balance: 30_000_000 }).split('|')[2]).toBe('mid');
        expect(encodeState({ balance: 200_000_000 }).split('|')[2]).toBe('rich');
    });

    test('week phase early/mid/late', () => {
        expect(encodeState({ week: 5 }).split('|')[3]).toBe('early');
        expect(encodeState({ week: 20 }).split('|')[3]).toBe('mid');
        expect(encodeState({ week: 35 }).split('|')[3]).toBe('late');
    });
});

describe('SPEC-117 — detectGoals + actionRelevance', () => {
    test('AVOID_RELEGATION fires when posTier=bottom', () => {
        const goals = detectGoals({ position: 19, totalTeams: 20 });
        expect(goals.find(g => g.goal === 'AVOID_RELEGATION')).toBeDefined();
    });

    test('FINANCIAL_HEALTH fires when balance<0', () => {
        const goals = detectGoals({ balance: -1000 });
        expect(goals.find(g => g.goal === 'FINANCIAL_HEALTH')).toBeDefined();
    });

    test('SQUAD_DEPTH fires when squad<18', () => {
        const goals = detectGoals({ squadSize: 12 });
        expect(goals.find(g => g.goal === 'SQUAD_DEPTH')).toBeDefined();
    });

    test('actionRelevance returns numeric in [-1, 1] for known mappings', () => {
        const r = actionRelevance('TACTIC_defensive', 'AVOID_RELEGATION');
        expect(r).toBeGreaterThan(0);
        expect(r).toBeLessThanOrEqual(1);
    });

    test('actionRelevance returns 0 for unknown action', () => {
        expect(actionRelevance('UNKNOWN_ACTION', 'AVOID_RELEGATION')).toBe(0);
    });
});

describe('SPEC-115/116 — computeReward', () => {
    test('match win = +10', () => {
        expect(computeReward({ matchResult: 'W' })).toBe(10);
    });
    test('match draw = +2', () => {
        expect(computeReward({ matchResult: 'D' })).toBe(2);
    });
    test('match loss = -5', () => {
        expect(computeReward({ matchResult: 'L' })).toBe(-5);
    });
    test('balance delta caps at +/-10', () => {
        const r = computeReward({ matchResult: '-', balanceDelta: 50_000_000 });
        expect(r).toBeLessThanOrEqual(10);
    });
    test('promotion = +50', () => {
        expect(computeReward({ matchResult: '-', promoted: true })).toBe(50);
    });
    test('relegation = -100', () => {
        expect(computeReward({ matchResult: '-', relegated: true })).toBe(-100);
    });
});

describe('SPEC-115/116 — AdaptiveBrain Q-learning', () => {
    let brain;
    beforeEach(() => {
        // Always replace localStorage with fresh mock so tests are isolated
        const store = {};
        global.localStorage = {
            getItem: (k) => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: (k) => { delete store[k]; }
        };
        brain = new AdaptiveBrain();
        brain.reset();
    });
    afterEach(() => {
        brain.reset();
    });

    test('cold-start picks random action', () => {
        const actions = ['A', 'B', 'C'];
        const picked = brain.pickAction('s1', actions);
        expect(actions).toContain(picked);
    });

    test('observe + getQ updates Bellman', () => {
        brain.observe('s1', 'A', 10, 's2', []);
        const q = brain.getQ('s1', 'A');
        expect(q).toBeGreaterThan(0); // 0.1 * 10 = 1.0
    });

    test('repeated reward grows Q monotonically', () => {
        for (let i = 0; i < 10; i++) {
            brain.observe('s1', 'A', 10, 's1', ['A']);
        }
        const q = brain.getQ('s1', 'A');
        expect(q).toBeGreaterThan(5);
    });

    test('preferred action is exploited after enough visits', () => {
        // Make A reward = 100, B reward = -10, train both
        for (let i = 0; i < 50; i++) {
            brain.observe('s1', 'A', 100, 's1', ['A', 'B']);
            brain.observe('s1', 'B', -10, 's1', ['A', 'B']);
        }
        // Pick many times — A should dominate (epsilon-greedy 15% explore)
        let picksA = 0;
        for (let i = 0; i < 100; i++) {
            if (brain.pickAction('s1', ['A', 'B']) === 'A') picksA++;
        }
        expect(picksA).toBeGreaterThan(70); // ≥85% expected, allow noise
    });

    test('table size capped via LRU eviction', () => {
        // Fill > MAX_BUCKETS
        for (let i = 0; i < 600; i++) {
            brain.observe(`state_${i}`, 'A', 1, `state_${i + 1}`, ['A']);
        }
        const states = Object.keys(brain.qTable).length;
        expect(states).toBeLessThanOrEqual(500);
    });

    test('reset clears state', () => {
        brain.observe('s1', 'A', 10, 's2', []);
        expect(Object.keys(brain.qTable).length).toBe(1);
        brain.reset();
        expect(Object.keys(brain.qTable).length).toBe(0);
    });

    test('summary returns counts + top actions', () => {
        brain.observe('s1', 'A', 10, 's2', []);
        brain.observe('s2', 'B', 5, 's3', []);
        const sum = brain.summary();
        expect(sum.states).toBeGreaterThan(0);
        expect(sum.totalUpdates).toBeGreaterThan(0);
        expect(Array.isArray(sum.topActions)).toBe(true);
    });

    test('save + restore roundtrip', () => {
        brain.observe('s1', 'A', 50, 's2', []);
        brain.save();
        const fresh = new AdaptiveBrain();
        expect(fresh.getQ('s1', 'A')).toBeGreaterThan(0);
    });
});
