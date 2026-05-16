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
    test('encodes all 9 dimensions (BUG-042 squadTier, divTier + opponent scouting)', () => {
        const key = encodeState({
            position: 1,
            totalTeams: 20,
            balance: 100_000_000,
            formAvg: 80,
            week: 5,
            lastResult: 'W',
            squadSize: 22
        });
        expect(typeof key).toBe('string');
        expect(key.split('|').length).toBe(9);
    });

    test('top4 vs bottom positioning', () => {
        const top = encodeState({ position: 2, totalTeams: 20 });
        const bot = encodeState({ position: 19, totalTeams: 20 });
        expect(top.split('|')[1]).toBe('T4');
        expect(bot.split('|')[1]).toBe('BT');
    });

    test('balance tiers', () => {
        expect(encodeState({ balance: -100 }).split('|')[2]).toBe('NEG');
        expect(encodeState({ balance: 1_000_000 }).split('|')[2]).toBe('LOW');
        expect(encodeState({ balance: 30_000_000 }).split('|')[2]).toBe('MID');
        expect(encodeState({ balance: 200_000_000 }).split('|')[2]).toBe('RCH');
    });

    test('week phase early/mid/late', () => {
        expect(encodeState({ week: 5 }).split('|')[3]).toBe('E');
        expect(encodeState({ week: 20 }).split('|')[3]).toBe('M');
        expect(encodeState({ week: 35 }).split('|')[3]).toBe('L');
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

describe('SPEC-115/116 — computeReward (BUG-041 reshape)', () => {
    test('match win base = +10 + clean sheet +3 = 13', () => {
        // default goalsAllowed=0 + W → clean sheet bonus
        expect(computeReward({ matchResult: 'W' })).toBe(13);
    });
    test('match win with goals against still positive', () => {
        expect(computeReward({ matchResult: 'W', goalsScored: 2, goalsAllowed: 1 })).toBeGreaterThan(10);
    });
    test('match draw base = +2', () => {
        // draw with clean sheet
        expect(computeReward({ matchResult: 'D' })).toBe(5);
    });
    test('match narrow loss = -1 (BUG-041 soft)', () => {
        expect(computeReward({ matchResult: 'L', scoreDiff: -1 })).toBe(-1);
    });
    test('match big loss = -5', () => {
        expect(computeReward({ matchResult: 'L', scoreDiff: -5 })).toBe(-5);
    });
    test('balance delta caps at +/-10 (excluding bonuses)', () => {
        // Big balance delta caps at +10. With clean sheet +3, expect ~13.
        const r = computeReward({ matchResult: '-', balanceDelta: 50_000_000 });
        expect(r).toBeLessThanOrEqual(13);
        expect(r).toBeGreaterThanOrEqual(10);
    });
    test('promotion = +60 (BUG-RC1 symmetric, + clean sheet 3)', () => {
        expect(computeReward({ matchResult: '-', promoted: true })).toBe(63);
    });
    test('relegation = -60 (BUG-RC1 symmetric, + clean sheet 3)', () => {
        expect(computeReward({ matchResult: '-', relegated: true })).toBe(-57);
    });
    test('own scoring rewards even on loss', () => {
        // Loss but scored 2 goals → -1 + 3 (1.5*2) = 2
        const r = computeReward({ matchResult: 'L', scoreDiff: -1, goalsScored: 2 });
        expect(r).toBeGreaterThan(0);
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
        // Fill > MAX_BUCKETS (now 800)
        for (let i = 0; i < 900; i++) {
            brain.observe(`state_${i}`, 'A', 1, `state_${i + 1}`, ['A']);
        }
        const states = Object.keys(brain.qTable).length;
        expect(states).toBeLessThanOrEqual(800);
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

// ─── NEW GAME+ REGRESSION ────────────────────────────────────
describe('New Game+ — Brain persists, gameplay resets', () => {
    test('newGamePlus() saves brain and zeroes stats', async () => {
        // Setup: mock localStorage consistently (same as brain uses)
        const store = {};
        global.localStorage = {
            getItem: (k) => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: (k) => { delete store[k]; },
            get length() { return Object.keys(store).length; },
            key: (i) => Object.keys(store)[i] || null,
        };

        const { createEngine } = await import('../../src/engine/engineFactory.js');
        const { AutoPlayController } = await import('../../src/services/AutoPlayService.js');

        const engine = createEngine();
        engine.initGame('NGP-Test', 1, 'manager', 'livre');
        const bot = new AutoPlayController(engine);

        // Run 2 seasons to build up ML + stats
        bot.running = true;
        for (let w = 0; w < 80; w++) {
            try { bot._tick(); } catch { /* ok */ }
        }
        bot.running = false;

        // Verify we have data BEFORE New Game+
        const brainUpdatesBefore = bot.brain.totalUpdates;
        const qStatesBefore = Object.keys(bot.brain.qTable).length;
        const weeksBefore = bot.stats.weeksPlayed;
        expect(brainUpdatesBefore).toBeGreaterThan(0);
        expect(weeksBefore).toBeGreaterThan(0);

        // ACT: New Game+
        const snapshot = bot.newGamePlus();

        // ASSERT: brain snapshot returned correctly
        expect(snapshot.states).toBe(qStatesBefore);
        expect(snapshot.totalUpdates).toBe(brainUpdatesBefore);
        expect(snapshot.savedAt).toBeGreaterThan(0);

        // ASSERT: stats are zeroed
        expect(bot.stats.weeksPlayed).toBe(0);
        expect(bot.stats.seasonsPlayed).toBe(0);
        expect(bot.stats.wins).toBe(0);
        expect(bot.stats.losses).toBe(0);
        expect(bot.stats.transfers).toBe(0);
        expect(bot.stats.decisions.length).toBe(0);
        expect(bot.stats.anomalies.length).toBe(0);

        // ASSERT: brain is STILL intact in memory
        expect(bot.brain.totalUpdates).toBe(brainUpdatesBefore);
        expect(Object.keys(bot.brain.qTable).length).toBe(qStatesBefore);

        // ASSERT: brain was saved to localStorage
        const savedBrain = JSON.parse(store['olefut_autoplay_brain'] || 'null');
        expect(savedBrain).not.toBeNull();
        expect(savedBrain.totalUpdates).toBe(brainUpdatesBefore);

        // ASSERT: gameplay state was removed from localStorage
        expect(store['olefut_autoplay_state']).toBeUndefined();
    });
});
