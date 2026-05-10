/**
 * Tests for DAggerBootstrap — Imitation Learning Warm-Start Pipeline
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DAggerBootstrap } from '../../src/services/learning/DAggerBootstrap.js';
import { AdaptiveBrain } from '../../src/services/learning/AdaptiveBrain.js';
import { ThompsonBandit } from '../../src/services/learning/ThompsonBandit.js';
import { LearnedEmotionalModifiers } from '../../src/services/learning/LearnedEmotionalModifiers.js';

// Mock localStorage
const mockStorage = {};
vi.stubGlobal('localStorage', {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = val; },
    removeItem: (key) => { delete mockStorage[key]; }
});

describe('DAggerBootstrap', () => {
    beforeEach(() => {
        Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
    });

    describe('warmStartBrain', () => {
        it('pre-fills Q-table with teacher data', () => {
            const brain = new AdaptiveBrain();
            const initialKeys = Object.keys(brain.qTable).length;

            const result = DAggerBootstrap.warmStartBrain(brain);

            expect(result.tacticsLoaded).toBeGreaterThan(0);
            expect(result.marketLoaded).toBeGreaterThan(0);
            expect(result.trainingLoaded).toBeGreaterThan(0);
            expect(Object.keys(brain.qTable).length).toBeGreaterThan(initialKeys);
        });

        it('clears traces after bootstrap', () => {
            const brain = new AdaptiveBrain();
            DAggerBootstrap.warmStartBrain(brain);

            // Traces should be cleared (no teacher trace leakage)
            expect(Object.keys(brain.traces).length).toBe(0);
        });

        it('handles null brain gracefully', () => {
            const result = DAggerBootstrap.warmStartBrain(null);
            expect(result.tacticsLoaded).toBe(0);
        });

        it('Q-values reflect teacher priorities', () => {
            const brain = new AdaptiveBrain();
            DAggerBootstrap.warmStartBrain(brain);

            // There should be non-zero Q-values for tactical states
            let hasNonZero = false;
            for (const stateQ of Object.values(brain.qTable)) {
                for (const q of Object.values(stateQ)) {
                    if (q !== 0) hasNonZero = true;
                }
            }
            expect(hasNonZero).toBe(true);
        });
    });

    describe('warmStartBandits', () => {
        it('warms Thompson bandits with teacher data', () => {
            const bandits = {
                teamTalk: new ThompsonBandit('teamTalk', ['motivational', 'tactical', 'analytical', 'inspirational']),
            };

            const result = DAggerBootstrap.warmStartBandits(bandits);
            expect(result.teamTalkLoaded).toBeGreaterThan(0);
        });

        it('handles null bandits gracefully', () => {
            const result = DAggerBootstrap.warmStartBandits(null);
            expect(result.teamTalkLoaded).toBe(0);
        });
    });

    describe('warmStartEmotions', () => {
        it('pre-fills SARSA tables with teacher emotional responses', () => {
            const sarsa = new LearnedEmotionalModifiers();
            const result = DAggerBootstrap.warmStartEmotions(sarsa);

            expect(result.emotionsLoaded).toBeGreaterThan(0);
        });

        it('clears traces after bootstrap', () => {
            const sarsa = new LearnedEmotionalModifiers();
            DAggerBootstrap.warmStartEmotions(sarsa);

            expect(Object.keys(sarsa.traces).length).toBe(0);
        });

        it('handles null sarsa gracefully', () => {
            const result = DAggerBootstrap.warmStartEmotions(null);
            expect(result.emotionsLoaded).toBe(0);
        });
    });

    describe('warmStartAll', () => {
        it('runs full pipeline and returns total count', () => {
            const brain = new AdaptiveBrain();
            const bandits = {
                teamTalk: new ThompsonBandit('teamTalk', ['motivational', 'tactical', 'analytical']),
            };
            const sarsa = new LearnedEmotionalModifiers();

            const result = DAggerBootstrap.warmStartAll({
                brain,
                bandits,
                sarsaModifiers: sarsa
            });

            expect(result.total).toBeGreaterThan(0);
            expect(result.tacticsLoaded).toBeGreaterThan(0);
            expect(result.marketLoaded).toBeGreaterThan(0);
            expect(result.trainingLoaded).toBeGreaterThan(0);
            expect(result.emotionsLoaded).toBeGreaterThan(0);
        });

        it('handles partial args gracefully', () => {
            const result = DAggerBootstrap.warmStartAll({ brain: null });
            expect(typeof result.total).toBe('number');
        });

        it('is idempotent — running twice produces same state', () => {
            const brain = new AdaptiveBrain();
            DAggerBootstrap.warmStartBrain(brain);
            const keys1 = Object.keys(brain.qTable).length;

            DAggerBootstrap.warmStartBrain(brain);
            const keys2 = Object.keys(brain.qTable).length;

            // Second run might add same keys — state count should be same or similar
            expect(keys2).toBe(keys1);
        });
    });
});
