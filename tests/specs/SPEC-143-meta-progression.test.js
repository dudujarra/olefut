// SPEC-143: MetaProgression tests
import { describe, test, expect, beforeEach } from 'vitest';
import { evaluateAchievements, getAllAchievements, ACHIEVEMENTS } from '../../src/engine/MetaProgression.js';

// Mock localStorage for node/vitest
const store = {};
globalThis.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
};

describe('SPEC-143: Meta-Progression System', () => {
    beforeEach(() => {
        Object.keys(store).forEach(k => delete store[k]);
    });

    test('Achievements defined', () => {
        expect(Object.keys(ACHIEVEMENTS).length).toBeGreaterThanOrEqual(10);
    });

    test('No achievements unlocked initially', () => {
        const all = getAllAchievements();
        const unlocked = all.filter(a => a.unlocked);
        expect(unlocked.length).toBe(0);
    });

    test('First title achievement unlocks', () => {
        const result = evaluateAchievements({ titlesWon: 1 });
        expect(result.newlyUnlocked.length).toBeGreaterThanOrEqual(1);
        expect(result.newlyUnlocked.some(a => a.id === 'first_title')).toBe(true);
    });

    test('Achievement persists across evaluations', () => {
        evaluateAchievements({ titlesWon: 1 });
        const result2 = evaluateAchievements({ titlesWon: 2 });
        // first_title should NOT be in newlyUnlocked again
        expect(result2.newlyUnlocked.some(a => a.id === 'first_title')).toBe(false);
        expect(result2.allUnlocked).toContain('first_title');
    });

    test('Multiple achievements can unlock simultaneously', () => {
        const result = evaluateAchievements({
            titlesWon: 5,
            cupsWon: 3,
            youthPromoted: 10,
            giantKills: 5,
            crisisSaves: 1,
            consecutiveSeasons: 10,
            transferProfit: 60_000_000,
            longestUnbeaten: 20,
            consecutiveTitles: 3,
        });
        expect(result.newlyUnlocked.length).toBe(10);
    });

    test('getAllAchievements returns unlock status', () => {
        evaluateAchievements({ titlesWon: 1 });
        const all = getAllAchievements();
        const firstTitle = all.find(a => a.id === 'first_title');
        expect(firstTitle.unlocked).toBe(true);
    });
});
