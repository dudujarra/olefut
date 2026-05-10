import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThompsonBandit, betaSample } from '../../src/services/learning/ThompsonBandit.js';

// ─── BETA SAMPLING ──────────────────────────────────────────

describe('betaSample', () => {
    it('returns values in (0, 1)', () => {
        for (let i = 0; i < 100; i++) {
            const v = betaSample(2, 3);
            expect(v).toBeGreaterThan(0);
            expect(v).toBeLessThan(1);
        }
    });

    it('high alpha → samples skew toward 1', () => {
        const samples = Array.from({ length: 500 }, () => betaSample(50, 2));
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        expect(mean).toBeGreaterThan(0.85);
    });

    it('high beta → samples skew toward 0', () => {
        const samples = Array.from({ length: 500 }, () => betaSample(2, 50));
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        expect(mean).toBeLessThan(0.15);
    });

    it('equal params → mean near 0.5', () => {
        const samples = Array.from({ length: 500 }, () => betaSample(5, 5));
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        expect(mean).toBeGreaterThan(0.35);
        expect(mean).toBeLessThan(0.65);
    });

    it('handles shape < 1 (Jöhnk boost)', () => {
        for (let i = 0; i < 50; i++) {
            const v = betaSample(0.5, 0.5);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
        }
    });
});

// ─── THOMPSON BANDIT ────────────────────────────────────────

describe('ThompsonBandit', () => {
    let bandit;

    beforeEach(() => {
        bandit = new ThompsonBandit('test', ['A', 'B', 'C']);
    });

    it('constructs with correct defaults', () => {
        expect(bandit.name).toBe('test');
        expect(bandit.defaultActions).toEqual(['A', 'B', 'C']);
        expect(bandit.totalPicks).toBe(0);
        expect(bandit.totalUpdates).toBe(0);
    });

    it('pick() returns one of the available actions', () => {
        for (let i = 0; i < 50; i++) {
            const action = bandit.pick('ctx1');
            expect(['A', 'B', 'C']).toContain(action);
        }
        expect(bandit.totalPicks).toBe(50);
    });

    it('pick() with single action returns it directly', () => {
        const b = new ThompsonBandit('single', ['X']);
        expect(b.pick('ctx')).toBe('X');
    });

    it('pick() with empty actions returns null', () => {
        const b = new ThompsonBandit('empty', []);
        expect(b.pick('ctx')).toBeNull();
    });

    it('pick() accepts overridden actions', () => {
        const action = bandit.pick('ctx', ['D', 'E']);
        expect(['D', 'E']).toContain(action);
    });

    it('update() creates arms for context', () => {
        bandit.update('ctx1', 'A', 1);
        expect(bandit.arms['ctx1']).toBeDefined();
        expect(bandit.arms['ctx1']['A']).toBeDefined();
        expect(bandit.arms['ctx1']['A'].alpha).toBeGreaterThan(1);
    });

    it('positive reward increases alpha', () => {
        bandit.update('ctx', 'A', 3);
        expect(bandit.arms['ctx']['A'].alpha).toBe(1 + 3); // PRIOR + reward
        expect(bandit.arms['ctx']['A'].beta).toBe(1); // unchanged
    });

    it('negative reward increases beta', () => {
        bandit.update('ctx', 'B', -2);
        expect(bandit.arms['ctx']['B'].alpha).toBe(1); // unchanged
        expect(bandit.arms['ctx']['B'].beta).toBe(1 + 2); // PRIOR + |reward|
    });

    it('zero reward does not change params', () => {
        bandit.update('ctx', 'C', 0);
        // Should not even create the arm (or if created, stays at prior)
        const arm = bandit.arms['ctx']?.['C'];
        if (arm) {
            expect(arm.alpha).toBe(1);
            expect(arm.beta).toBe(1);
        }
    });

    it('reward magnitude is capped at 5', () => {
        bandit.update('ctx', 'A', 100);
        expect(bandit.arms['ctx']['A'].alpha).toBe(1 + 5); // capped
    });

    it('alpha/beta are capped at 500', () => {
        for (let i = 0; i < 200; i++) {
            bandit.update('ctx', 'A', 5);
        }
        expect(bandit.arms['ctx']['A'].alpha).toBeLessThanOrEqual(500);
    });

    // ─── CONVERGENCE ────────────────────────────────────────

    it('converges: after many updates, picks best arm more often', () => {
        const b = new ThompsonBandit('converge', ['good', 'bad']);
        // Train: 'good' gets positive reward, 'bad' gets negative
        for (let i = 0; i < 50; i++) {
            b.update('ctx', 'good', 2);
            b.update('ctx', 'bad', -2);
        }
        // Now pick 100 times — 'good' should win most
        let goodCount = 0;
        for (let i = 0; i < 100; i++) {
            if (b.pick('ctx') === 'good') goodCount++;
        }
        expect(goodCount).toBeGreaterThan(80); // should be ~95%+
    });

    it('explores uncertain arms initially', () => {
        const b = new ThompsonBandit('explore', ['X', 'Y', 'Z']);
        // No updates — all at prior. Should explore all 3.
        const counts = { X: 0, Y: 0, Z: 0 };
        for (let i = 0; i < 300; i++) {
            counts[b.pick('ctx')]++;
        }
        // Each should be picked at least 30 times (expect ~100 each)
        expect(counts.X).toBeGreaterThan(30);
        expect(counts.Y).toBeGreaterThan(30);
        expect(counts.Z).toBeGreaterThan(30);
    });

    // ─── CONTEXT SENSITIVITY ────────────────────────────────

    it('different contexts have independent arms', () => {
        bandit.update('winning', 'A', 5);
        bandit.update('losing', 'B', 5);

        const rateWinA = bandit.getRate('winning', 'A');
        const rateLoseB = bandit.getRate('losing', 'B');

        // A should be preferred in 'winning', B in 'losing'
        expect(rateWinA).toBeGreaterThan(0.7);
        expect(rateLoseB).toBeGreaterThan(0.7);
        // Cross: A in 'losing' should be at prior (0.5)
        expect(bandit.getRate('losing', 'A')).toBeCloseTo(0.5, 1);
    });

    // ─── WARM START ─────────────────────────────────────────

    it('warmStart() sets prior correctly', () => {
        bandit.warmStart('ctx', 'A', 0.7, 20);
        const arm = bandit.arms['ctx']['A'];
        expect(arm.alpha).toBeCloseTo(1 + 0.7 * 20, 1); // 15
        expect(arm.beta).toBeCloseTo(1 + 0.3 * 20, 1);  // 7
    });

    it('warmStart() biases picks toward high-confidence arm', () => {
        bandit.warmStart('ctx', 'A', 0.9, 30);
        bandit.warmStart('ctx', 'B', 0.3, 30);
        bandit.warmStart('ctx', 'C', 0.5, 30);

        let aCount = 0;
        for (let i = 0; i < 200; i++) {
            if (bandit.pick('ctx') === 'A') aCount++;
        }
        expect(aCount).toBeGreaterThan(120); // A should dominate
    });

    // ─── ANALYTICS ──────────────────────────────────────────

    it('getRate() returns prior rate for unknown', () => {
        expect(bandit.getRate('unknown', 'X')).toBe(0.5);
    });

    it('getRanking() returns sorted arms', () => {
        bandit.update('ctx', 'A', 5);
        bandit.update('ctx', 'A', 5);
        bandit.update('ctx', 'B', -5);
        const ranking = bandit.getRanking('ctx');
        expect(ranking.length).toBe(2);
        expect(ranking[0].action).toBe('A');
        expect(ranking[0].rate).toBeGreaterThan(ranking[1].rate);
    });

    it('summary() returns correct structure', () => {
        bandit.update('ctx1', 'A', 1);
        bandit.update('ctx2', 'B', 1);
        const s = bandit.summary();
        expect(s.name).toBe('test');
        expect(s.contexts).toBe(2);
        expect(s.arms).toBe(2);
        expect(s.totalUpdates).toBe(2);
    });

    // ─── PERSISTENCE ────────────────────────────────────────

    it('reset() clears all state', () => {
        bandit.update('ctx', 'A', 5);
        bandit.reset();
        expect(bandit.arms).toEqual({});
        expect(bandit.totalPicks).toBe(0);
        expect(bandit.totalUpdates).toBe(0);
    });

    // ─── PRUNING ────────────────────────────────────────────

    it('prunes contexts when exceeding MAX_CONTEXTS', () => {
        // Create 120 contexts (max is 100)
        for (let i = 0; i < 120; i++) {
            bandit.update(`ctx_${i}`, 'A', 1);
        }
        const contextCount = Object.keys(bandit.arms).length;
        expect(contextCount).toBeLessThanOrEqual(100);
    });
});
