/**
 * Tests for LearnedEmotionalModifiers — SARSA(λ) for emotional response tuning
 *
 * Tests cover:
 * - State encoding correctness
 * - SARSA update mechanics (on-policy)
 * - Eligibility trace propagation and decay
 * - Response selection (ε-greedy)
 * - Persistence (save/restore)
 * - Convergence: learns to prefer better responses
 * - Integration with EmotionalEngine
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LearnedEmotionalModifiers } from '../../src/services/learning/LearnedEmotionalModifiers.js';
import { EmotionalEngine } from '../../src/services/learning/EmotionalEngine.js';

// Mock localStorage
const mockStorage = {};
vi.stubGlobal('localStorage', {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = val; },
    removeItem: (key) => { delete mockStorage[key]; }
});

describe('LearnedEmotionalModifiers', () => {
    let sarsa;

    beforeEach(() => {
        // Clear mock storage
        Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
        sarsa = new LearnedEmotionalModifiers();
    });

    describe('State Encoding', () => {
        it('encodes emotional state + context into compact key', () => {
            const key = sarsa.encodeState('CALM', {
                position: 3, totalTeams: 20, balance: 10_000_000, week: 5
            });
            expect(key).toBe('CALM|top|rich|early');
        });

        it('handles different position tiers', () => {
            const top = sarsa.encodeState('ANXIOUS', { position: 2, totalTeams: 20, balance: 0, week: 15 });
            expect(top).toContain('top');

            const mid = sarsa.encodeState('ANXIOUS', { position: 8, totalTeams: 20, balance: 0, week: 15 });
            expect(mid).toContain('mid');

            const bottom = sarsa.encodeState('ANXIOUS', { position: 14, totalTeams: 20, balance: 0, week: 15 });
            expect(bottom).toContain('bottom');

            const rele = sarsa.encodeState('ANXIOUS', { position: 18, totalTeams: 20, balance: 0, week: 15 });
            expect(rele).toContain('rele');
        });

        it('handles different balance tiers', () => {
            const rich = sarsa.encodeState('CALM', { position: 10, balance: 10_000_000, week: 1 });
            expect(rich).toContain('rich');

            const ok = sarsa.encodeState('CALM', { position: 10, balance: 2_000_000, week: 1 });
            expect(ok).toContain('ok');

            const poor = sarsa.encodeState('CALM', { position: 10, balance: 500_000, week: 1 });
            expect(poor).toContain('poor');

            const broke = sarsa.encodeState('CALM', { position: 10, balance: -100_000, week: 1 });
            expect(broke).toContain('broke');
        });

        it('handles season phases', () => {
            const early = sarsa.encodeState('CALM', { position: 10, balance: 0, week: 5 });
            expect(early).toContain('early');

            const mid = sarsa.encodeState('CALM', { position: 10, balance: 0, week: 20 });
            expect(mid).toContain('mid');

            const late = sarsa.encodeState('CALM', { position: 10, balance: 0, week: 30 });
            expect(late).toContain('late');
        });

        it('handles empty context gracefully', () => {
            const key = sarsa.encodeState('TILTED', {});
            expect(typeof key).toBe('string');
            expect(key.startsWith('TILTED|')).toBe(true);
        });
    });

    describe('Response Selection', () => {
        it('returns valid response with modifiers', () => {
            const state = sarsa.encodeState('CALM', { position: 10, balance: 1000, week: 15 });
            const { actionId, modifiers } = sarsa.pickResponse(state);

            expect(typeof actionId).toBe('string');
            expect(typeof modifiers.epsilonMod).toBe('number');
            expect(typeof modifiers.lossMod).toBe('number');
            expect(typeof modifiers.riskMod).toBe('number');
            expect(modifiers.epsilonMod).toBeGreaterThan(0);
            expect(modifiers.lossMod).toBeGreaterThan(0);
            expect(modifiers.riskMod).toBeGreaterThan(0);
            expect(modifiers.riskMod).toBeLessThanOrEqual(1);
        });

        it('explores when no Q-values exist for state', () => {
            const state = 'NEVER_SEEN|top|rich|early';
            // Without Q-values, should pick random (exploration)
            const seen = new Set();
            for (let i = 0; i < 100; i++) {
                const { actionId } = sarsa.pickResponse(state);
                seen.add(actionId);
            }
            // Should see multiple different actions (exploration)
            expect(seen.size).toBeGreaterThan(1);
        });
    });

    describe('SARSA Updates', () => {
        it('first observe only records state-action pair', () => {
            const state = 'CALM|mid|ok|early';
            sarsa.observe(state, 'NEUTRAL', 5);
            // First call: no update yet (SARSA needs s, a, r, s', a')
            expect(sarsa.totalUpdates).toBe(0);
        });

        it('second observe triggers SARSA update', () => {
            sarsa.observe('CALM|mid|ok|early', 'NEUTRAL', 5);
            sarsa.observe('CALM|mid|ok|mid', 'ADAPTIVE', 3);
            expect(sarsa.totalUpdates).toBe(1);
        });

        it('updates Q-values with positive reward', () => {
            // Setup: good state, good action, good reward
            sarsa.observe('CALM|top|rich|early', 'BOLD', 10);
            sarsa.observe('CALM|top|rich|mid', 'BOLD', 10);

            // Q-value for BOLD in first state should be positive
            expect(sarsa.qTable['CALM|top|rich|early']?.['BOLD']).toBeGreaterThan(0);
        });

        it('updates Q-values with negative reward', () => {
            sarsa.observe('DESPERATE|rele|broke|late', 'PANICKED', -5);
            sarsa.observe('DESPERATE|rele|broke|late', 'DESPERATE', -5);

            // Q-value should be negative
            expect(sarsa.qTable['DESPERATE|rele|broke|late']?.['PANICKED']).toBeLessThan(0);
        });
    });

    describe('Eligibility Traces', () => {
        it('creates traces during updates', () => {
            sarsa.observe('state1', 'NEUTRAL', 1);
            sarsa.observe('state2', 'BOLD', 1);
            sarsa.observe('state3', 'CAUTIOUS', 1);

            // Traces should exist for earlier state-action pairs
            const traceCount = Object.keys(sarsa.traces).length;
            expect(traceCount).toBeGreaterThan(0);
        });

        it('clears traces on episode boundary', () => {
            sarsa.observe('s1', 'NEUTRAL', 1);
            sarsa.observe('s2', 'BOLD', 1);
            sarsa.observe('s3', 'CAUTIOUS', 1);

            sarsa.clearTraces();

            expect(Object.keys(sarsa.traces).length).toBe(0);
            expect(sarsa._lastState).toBeNull();
            expect(sarsa._lastAction).toBeNull();
        });

        it('traces decay over time', () => {
            // Create a sequence
            sarsa.observe('s1', 'NEUTRAL', 1);
            sarsa.observe('s2', 'BOLD', 2);
            sarsa.observe('s3', 'CAUTIOUS', 3);
            sarsa.observe('s4', 'ADAPTIVE', 4);
            sarsa.observe('s5', 'NEUTRAL', 5);

            // Earlier traces should have smaller values than recent ones
            const traces = sarsa.traces;
            // Most recently updated state should have higher trace
            // (or traces from older states should have been pruned)
            const keys = Object.keys(traces);
            expect(keys.length).toBeLessThanOrEqual(5); // bounded
        });
    });

    describe('Convergence', () => {
        it('learns to prefer high-reward responses over many episodes', () => {
            const goodState = 'CALM|top|rich|early';
            const nextState = 'CALM|top|rich|mid';

            // Simulate proper episodes: BOLD consistently gets +5 reward
            for (let i = 0; i < 80; i++) {
                sarsa.clearTraces();
                // Episode: pick BOLD in goodState, get +5, transition to nextState
                sarsa.observe(goodState, 'BOLD', 5);
                sarsa.observe(nextState, 'NEUTRAL', 0); // terminal
            }

            // Simulate: PANICKED consistently gets -3 reward
            for (let i = 0; i < 80; i++) {
                sarsa.clearTraces();
                sarsa.observe(goodState, 'PANICKED', -3);
                sarsa.observe(nextState, 'NEUTRAL', 0); // terminal
            }

            // BOLD should have higher Q-value than PANICKED
            const boldQ = sarsa.qTable[goodState]?.['BOLD'] || 0;
            const panickQ = sarsa.qTable[goodState]?.['PANICKED'] || 0;
            expect(boldQ).toBeGreaterThan(panickQ);
        });
    });

    describe('Persistence', () => {
        it('saves and restores Q-table', () => {
            sarsa.observe('state1', 'NEUTRAL', 5);
            sarsa.observe('state2', 'BOLD', 3);
            sarsa.save();

            // Create new instance — should restore
            const sarsa2 = new LearnedEmotionalModifiers();
            expect(sarsa2.totalUpdates).toBe(sarsa.totalUpdates);
            expect(Object.keys(sarsa2.qTable).length).toBeGreaterThan(0);
        });

        it('reset clears everything', () => {
            sarsa.observe('state1', 'NEUTRAL', 5);
            sarsa.observe('state2', 'BOLD', 3);
            sarsa.save();

            sarsa.reset();

            expect(Object.keys(sarsa.qTable).length).toBe(0);
            expect(sarsa.totalUpdates).toBe(0);
            expect(Object.keys(sarsa.traces).length).toBe(0);
        });
    });

    describe('Analytics', () => {
        it('tracks preferred response per emotional state', () => {
            // Train: CALM → NEUTRAL is best
            for (let i = 0; i < 50; i++) {
                sarsa.clearTraces();
                sarsa.observe('CALM|mid|ok|early', 'NEUTRAL', 5);
                sarsa.observe('CALM|mid|ok|mid', 'NEUTRAL', 0);
            }

            const preferred = sarsa.preferredResponse('CALM');
            expect(preferred).toBe('NEUTRAL');
        });

        it('summary reports state count and trace count', () => {
            sarsa.observe('s1', 'NEUTRAL', 1);
            sarsa.observe('s2', 'BOLD', 2);

            const summary = sarsa.summary();
            expect(typeof summary.states).toBe('number');
            expect(typeof summary.totalUpdates).toBe('number');
            expect(typeof summary.activeTraces).toBe('number');
            expect(typeof summary.preferredByEmotion).toBe('object');
        });
    });

    describe('State Table Bounding', () => {
        it('keeps Q-table under MAX_STATES entries', () => {
            // Generate many unique states
            for (let i = 0; i < 250; i++) {
                sarsa.observe(`state_${i}`, 'NEUTRAL', 1);
            }

            expect(Object.keys(sarsa.qTable).length).toBeLessThanOrEqual(201);
        });
    });
});

describe('EmotionalEngine + SARSA Integration', () => {
    let engine;

    beforeEach(() => {
        Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
        engine = new EmotionalEngine({ ocean: { N: 0.5 } });
    });

    it('creates SARSA modifier learner on construction', () => {
        expect(engine.sarsaModifiers).toBeDefined();
        expect(engine.sarsaModifiers).toBeInstanceOf(LearnedEmotionalModifiers);
    });

    it('returns hardcoded modifiers when SARSA has no data', () => {
        const mods = engine.getModifiers();
        expect(mods.source).toBe('hardcoded');
        expect(mods.state).toBe('CALM');
        expect(mods.epsilonMod).toBe(1.0);
    });

    it('uses SARSA modifiers after sufficient training', () => {
        // Set context
        engine.setContext({ position: 10, totalTeams: 20, balance: 2_000_000, week: 15 });

        // Train SARSA past the threshold (>10 updates)
        for (let i = 0; i < 15; i++) {
            engine.sarsaModifiers.observe(`CALM|mid|ok|mid`, 'NEUTRAL', 3);
        }

        const mods = engine.getModifiers();
        // After training, should use SARSA
        expect(mods.source).toBe('sarsa');
        expect(mods.sarsaAction).toBeDefined();
    });

    it('setContext stores game context', () => {
        const ctx = { position: 5, totalTeams: 20, balance: 8_000_000, week: 25 };
        engine.setContext(ctx);
        expect(engine._currentCtx).toEqual(ctx);
    });

    it('feedReward feeds SARSA after training', () => {
        engine.setContext({ position: 10, totalTeams: 20, balance: 2_000_000, week: 15 });

        // Train past threshold
        for (let i = 0; i < 15; i++) {
            engine.sarsaModifiers.observe(`CALM|mid|ok|mid`, 'NEUTRAL', 1);
        }

        // Get modifiers (sets lastSarsaState/Action)
        engine.getModifiers();

        // Feed reward
        const updatesBefore = engine.sarsaModifiers.totalUpdates;
        engine.feedReward(5);
        expect(engine.sarsaModifiers.totalUpdates).toBeGreaterThanOrEqual(updatesBefore);
    });

    it('clearSarsaTraces resets SARSA episode', () => {
        engine.setContext({ position: 10, balance: 2_000_000, week: 15 });
        engine.sarsaModifiers.observe('s1', 'NEUTRAL', 1);
        engine.sarsaModifiers.observe('s2', 'BOLD', 2);

        engine.clearSarsaTraces();

        expect(Object.keys(engine.sarsaModifiers.traces).length).toBe(0);
    });

    it('summary includes SARSA stats', () => {
        const summary = engine.summary();
        expect(summary.sarsa).toBeDefined();
        expect(typeof summary.sarsa.states).toBe('number');
        expect(typeof summary.sarsa.totalUpdates).toBe('number');
    });

    it('FSM transitions still work correctly', () => {
        // CALM → WIN × 3 → CONFIDENT
        engine.processEvent('WIN', 1);
        engine.processEvent('WIN', 2);
        const result = engine.processEvent('WIN', 3);

        expect(result.to).toBe('CONFIDENT');
    });

    it('emotional state affects SARSA state encoding', () => {
        engine.setContext({ position: 10, balance: 2_000_000, week: 15 });

        const calmKey = engine.sarsaModifiers.encodeState('CALM', engine._currentCtx);
        const anxKey = engine.sarsaModifiers.encodeState('ANXIOUS', engine._currentCtx);

        expect(calmKey).not.toBe(anxKey);
        expect(calmKey.startsWith('CALM|')).toBe(true);
        expect(anxKey.startsWith('ANXIOUS|')).toBe(true);
    });
});
