import { describe, test, expect } from 'vitest';
import { adviseTactic, initNpcTacticState, recordNpcResult, applyNpcTacticAdvice } from '../../src/engine/NpcTacticAdvisor';

const defaults = { squadOvr: 65, opponentOvr: 65 };

describe('SPEC-131: NpcTacticAdvisor', () => {
    test('3 losses → pivot triggered ≥70% of time', () => {
        const results = Array(100).fill(null).map((_, i) =>
            adviseTactic({ currentTactic: 'offensive', recentResults: ['L','L','L'], ...defaults, seed: i })
        );
        const changes = results.filter(r => r.changed).length;
        expect(changes).toBeGreaterThanOrEqual(70);
    });

    test('5 losses → pivot triggered ≥95% of time', () => {
        const results = Array(100).fill(null).map((_, i) =>
            adviseTactic({ currentTactic: 'offensive', recentResults: ['L','L','L','L','L'], ...defaults, seed: i })
        );
        expect(results.filter(r => r.changed).length).toBeGreaterThanOrEqual(95);
    });

    test('new tactic ≠ current losing tactic', () => {
        for (let i = 0; i < 50; i++) {
            const result = adviseTactic({ currentTactic: 'defensive', recentResults: ['L','L','L','L','L'], ...defaults, seed: i });
            if (result.changed) expect(result.tactic).not.toBe('defensive');
        }
    });

    test('stabilizes after 2 wins — no change', () => {
        const result = adviseTactic({ currentTactic: 'pressing', recentResults: ['W','W'], tacticAge: 3, ...defaults });
        expect(result.changed).toBe(false);
    });

    test('OVR underdog (-10) → prefers defensive or counter', () => {
        const results = Array(30).fill(null).map((_, i) =>
            adviseTactic({ currentTactic: 'offensive', recentResults: ['L','L','L'], squadOvr: 60, opponentOvr: 75, seed: i })
        );
        const changed = results.filter(r => r.changed);
        changed.forEach(r => expect(['defensive','counter']).toContain(r.tactic));
    });

    test('OVR dominant (+10) → prefers offensive or pressing', () => {
        const results = Array(30).fill(null).map((_, i) =>
            adviseTactic({ currentTactic: 'defensive', recentResults: ['L','L','L'], squadOvr: 80, opponentOvr: 65, seed: i })
        );
        const changed = results.filter(r => r.changed);
        changed.forEach(r => expect(['offensive','pressing']).toContain(r.tactic));
    });

    test('determinism: same input + seed → same output', () => {
        const input = { currentTactic: 'normal', recentResults: ['L','L','L','L'], ...defaults, seed: 42 };
        const r1 = adviseTactic(input);
        const r2 = adviseTactic(input);
        expect(r1.tactic).toBe(r2.tactic);
        expect(r1.changed).toBe(r2.changed);
    });

    test('recordNpcResult + applyNpcTacticAdvice update state correctly', () => {
        let state = initNpcTacticState();
        expect(state.currentTactic).toBe('normal');
        state = recordNpcResult(state, 'L');
        state = recordNpcResult(state, 'L');
        state = recordNpcResult(state, 'L');
        const advice = adviseTactic({ currentTactic: state.currentTactic, recentResults: state.recentResults, ...defaults, seed: 1 });
        const newState = applyNpcTacticAdvice(state, advice);
        if (advice.changed) {
            expect(newState.currentTactic).toBe(advice.tactic);
            expect(newState.tacticAge).toBe(0);
        } else {
            expect(newState.currentTactic).toBe(state.currentTactic);
        }
    });

    test('no changes when 0 losses', () => {
        const result = adviseTactic({ currentTactic: 'normal', recentResults: ['W','W','D'], ...defaults });
        expect(result.changed).toBe(false);
    });
});
