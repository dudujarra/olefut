/**
 * Tests for LearnedGoalRelevance — Contextual Bandit for Goal-Action Relevance
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LearnedGoalRelevance } from '../../src/services/learning/LearnedGoalRelevance.js';

// Mock localStorage
const mockStorage = {};
vi.stubGlobal('localStorage', {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = val; },
    removeItem: (key) => { delete mockStorage[key]; }
});

describe('LearnedGoalRelevance', () => {
    let lgr;

    beforeEach(() => {
        Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
        lgr = new LearnedGoalRelevance();
    });

    describe('Initialization', () => {
        it('warm-starts from hardcoded priors', () => {
            expect(Object.keys(lgr.relevance).length).toBeGreaterThan(0);
            expect(lgr.relevance['AVOID_RELEGATION']).toBeDefined();
            expect(lgr.relevance['FINANCIAL_HEALTH']).toBeDefined();
            expect(lgr.relevance['CLIMB_POSITION']).toBeDefined();
        });

        it('has alpha/beta for each goal-action pair', () => {
            const pair = lgr.relevance['AVOID_RELEGATION']['TACTIC_defensive'];
            expect(pair).toBeDefined();
            expect(pair.alpha).toBeGreaterThan(0);
            expect(pair.beta).toBeGreaterThan(0);
        });
    });

    describe('getRelevance', () => {
        it('returns a value in [-1, 1] range', () => {
            for (let i = 0; i < 50; i++) {
                const r = lgr.getRelevance('TACTIC_defensive', 'AVOID_RELEGATION');
                expect(r).toBeGreaterThanOrEqual(-1);
                expect(r).toBeLessThanOrEqual(1);
            }
        });

        it('returns near-zero for unknown pairs', () => {
            const values = [];
            for (let i = 0; i < 50; i++) {
                values.push(lgr.getRelevance('UNKNOWN_ACTION', 'UNKNOWN_GOAL'));
            }
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            expect(Math.abs(avg)).toBeLessThan(0.5);
        });
    });

    describe('getMeanRelevance', () => {
        it('returns expected mean for warm-started pairs', () => {
            // TACTIC_defensive for AVOID_RELEGATION: hardcoded = 0.7
            // Mapped: prob = (0.7 + 1) / 2 = 0.85, alpha=8.5, beta=1.5
            // Mean = 8.5/(8.5+1.5) = 0.85, mapped back = 0.85*2-1 = 0.7
            const mean = lgr.getMeanRelevance('TACTIC_defensive', 'AVOID_RELEGATION');
            expect(mean).toBeCloseTo(0.7, 1);
        });

        it('returns 0 for unknown pairs', () => {
            expect(lgr.getMeanRelevance('UNKNOWN', 'UNKNOWN')).toBe(0);
        });
    });

    describe('update', () => {
        it('increases alpha on positive outcome', () => {
            const before = { ...lgr.relevance['AVOID_RELEGATION']['TACTIC_defensive'] };
            lgr.update('AVOID_RELEGATION', 'TACTIC_defensive', true);
            const after = lgr.relevance['AVOID_RELEGATION']['TACTIC_defensive'];
            expect(after.alpha).toBeGreaterThan(before.alpha);
            expect(after.beta).toBe(before.beta);
        });

        it('increases beta on negative outcome', () => {
            const before = { ...lgr.relevance['AVOID_RELEGATION']['TACTIC_defensive'] };
            lgr.update('AVOID_RELEGATION', 'TACTIC_defensive', false);
            const after = lgr.relevance['AVOID_RELEGATION']['TACTIC_defensive'];
            expect(after.alpha).toBe(before.alpha);
            expect(after.beta).toBeGreaterThan(before.beta);
        });

        it('handles continuous rewards', () => {
            const before = { ...lgr.relevance['AVOID_RELEGATION']['TACTIC_defensive'] };
            lgr.update('AVOID_RELEGATION', 'TACTIC_defensive', 3.5);
            const after = lgr.relevance['AVOID_RELEGATION']['TACTIC_defensive'];
            expect(after.alpha).toBeGreaterThan(before.alpha);
        });

        it('creates new pairs for unknown goal-action', () => {
            lgr.update('NEW_GOAL', 'NEW_ACTION', true);
            expect(lgr.relevance['NEW_GOAL']['NEW_ACTION']).toBeDefined();
        });

        it('decays distribution when too concentrated', () => {
            // Force many updates to trigger decay
            for (let i = 0; i < 200; i++) {
                lgr.update('AVOID_RELEGATION', 'TACTIC_defensive', true);
            }
            const params = lgr.relevance['AVOID_RELEGATION']['TACTIC_defensive'];
            // After decay, total should be bounded
            expect(params.alpha + params.beta).toBeLessThanOrEqual(105);
        });
    });

    describe('Convergence', () => {
        it('learns that positive actions are more relevant over time', () => {
            // Create a fresh pair
            lgr.relevance['TEST_GOAL'] = {
                'GOOD_ACTION': { alpha: 1, beta: 1 },
                'BAD_ACTION': { alpha: 1, beta: 1 }
            };

            // GOOD_ACTION consistently succeeds
            for (let i = 0; i < 30; i++) {
                lgr.update('TEST_GOAL', 'GOOD_ACTION', true);
                lgr.update('TEST_GOAL', 'BAD_ACTION', false);
            }

            const goodMean = lgr.getMeanRelevance('GOOD_ACTION', 'TEST_GOAL');
            const badMean = lgr.getMeanRelevance('BAD_ACTION', 'TEST_GOAL');
            expect(goodMean).toBeGreaterThan(badMean);
        });
    });

    describe('Persistence', () => {
        it('saves and restores state', () => {
            lgr.update('AVOID_RELEGATION', 'TACTIC_defensive', true);
            lgr.update('AVOID_RELEGATION', 'TACTIC_defensive', true);
            lgr.save();

            const lgr2 = new LearnedGoalRelevance();
            expect(lgr2.relevance['AVOID_RELEGATION']['TACTIC_defensive'].alpha)
                .toBe(lgr.relevance['AVOID_RELEGATION']['TACTIC_defensive'].alpha);
        });
    });

    describe('reset', () => {
        it('clears and re-initializes from priors', () => {
            lgr.update('AVOID_RELEGATION', 'TACTIC_defensive', true);
            lgr.update('AVOID_RELEGATION', 'TACTIC_defensive', true);
            lgr.reset();

            // Should be back to warm-start values
            expect(lgr.totalUpdates).toBe(0);
            expect(Object.keys(lgr.relevance).length).toBeGreaterThan(0);
        });
    });

    describe('summary', () => {
        it('returns structured summary', () => {
            const s = lgr.summary();
            expect(s.totalPairs).toBeGreaterThan(0);
            expect(s.goals['AVOID_RELEGATION']).toBeDefined();
            expect(s.goals['AVOID_RELEGATION'].topAction).toBeDefined();
        });
    });
});
