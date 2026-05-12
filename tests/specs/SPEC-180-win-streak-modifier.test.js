/**
 * SPEC-180: WinStreakModifierSystem harness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    computeSeverity,
    recordResult,
    getCurrentStreak,
    evaluate,
    getModifiersForMatch,
    reset,
    resetAll,
    SEVERITY_THRESHOLDS,
    FEATURE_FLAG,
    isFeatureEnabled,
} from '../../src/engine/WinStreakModifierSystem.js';

describe('SPEC-180: WinStreakModifierSystem', () => {

    beforeEach(() => {
        resetAll();
        if (typeof globalThis !== 'undefined') {
            globalThis[FEATURE_FLAG] = false;
        }
    });

    describe('computeSeverity (revised thresholds)', () => {
        it('streak 0 → none', () => {
            expect(computeSeverity(0)).toBe('none');
        });

        it('streak 2 → none', () => {
            expect(computeSeverity(2)).toBe('none');
        });

        it('streak 3 → mild', () => {
            expect(computeSeverity(3)).toBe('mild');
        });

        it('streak 5 → strong', () => {
            expect(computeSeverity(5)).toBe('strong');
        });

        it('streak 7 → phenom (revised from 8)', () => {
            expect(computeSeverity(7)).toBe('phenom');
        });

        it('streak 10 → phenom', () => {
            expect(computeSeverity(10)).toBe('phenom');
        });
    });

    describe('recordResult', () => {
        it('W increments streak', () => {
            recordResult({ teamId: 1, result: 'W' });
            expect(getCurrentStreak(1)).toBe(1);
            recordResult({ teamId: 1, result: 'W' });
            expect(getCurrentStreak(1)).toBe(2);
        });

        it('D resets streak', () => {
            recordResult({ teamId: 1, result: 'W' });
            recordResult({ teamId: 1, result: 'W' });
            recordResult({ teamId: 1, result: 'D' });
            expect(getCurrentStreak(1)).toBe(0);
        });

        it('L resets streak', () => {
            recordResult({ teamId: 1, result: 'W' });
            recordResult({ teamId: 1, result: 'L' });
            expect(getCurrentStreak(1)).toBe(0);
        });

        it('streaks isolated per teamId', () => {
            recordResult({ teamId: 1, result: 'W' });
            recordResult({ teamId: 2, result: 'L' });
            expect(getCurrentStreak(1)).toBe(1);
            expect(getCurrentStreak(2)).toBe(0);
        });

        it('invalid teamId → no-op', () => {
            recordResult({ teamId: 'x', result: 'W' });
            expect(getCurrentStreak('x')).toBe(0);
        });
    });

    describe('evaluate', () => {
        it('strong streak returns full modifier set', () => {
            for (let i = 0; i < 5; i++) recordResult({ teamId: 1, result: 'W' });
            const r = evaluate({ teamId: 1 });
            expect(r.severity).toBe('strong');
            expect(r.attrBoost).toBe(4);
            expect(r.moraleDelta).toBe(10);
            expect(r.tensionDelta).toBe(-3);
            expect(r.mediaEvent).toBe(false);
        });

        it('phenom streak triggers mediaEvent + positive tensionDelta', () => {
            for (let i = 0; i < 7; i++) recordResult({ teamId: 1, result: 'W' });
            const r = evaluate({ teamId: 1 });
            expect(r.severity).toBe('phenom');
            expect(r.attrBoost).toBe(6);
            expect(r.moraleDelta).toBe(15);
            expect(r.tensionDelta).toBe(5); // positive = expectativa sobe
            expect(r.mediaEvent).toBe(true);
        });

        it('streakLength override usado se passado', () => {
            const r = evaluate({ teamId: 99, streakLength: 7 });
            expect(r.severity).toBe('phenom');
        });

        it('none yields zero modifiers', () => {
            const r = evaluate({ teamId: 99 });
            expect(r.attrBoost).toBe(0);
            expect(r.moraleDelta).toBe(0);
        });
    });

    describe('getModifiersForMatch (feature flag)', () => {
        it('feature OFF → zero modifiers', () => {
            globalThis[FEATURE_FLAG] = false;
            for (let i = 0; i < 5; i++) recordResult({ teamId: 1, result: 'W' });
            const r = getModifiersForMatch(1);
            expect(r.attrBonus).toBe(0);
            expect(r.severity).toBe('none');
        });

        it('feature ON → returns active modifier', () => {
            globalThis[FEATURE_FLAG] = true;
            for (let i = 0; i < 5; i++) recordResult({ teamId: 1, result: 'W' });
            const r = getModifiersForMatch(1);
            expect(r.attrBonus).toBe(4);
            expect(r.severity).toBe('strong');
        });
    });

    describe('reset functions', () => {
        it('reset(teamId) clears specific', () => {
            recordResult({ teamId: 1, result: 'W' });
            recordResult({ teamId: 2, result: 'W' });
            reset(1);
            expect(getCurrentStreak(1)).toBe(0);
            expect(getCurrentStreak(2)).toBe(1);
        });

        it('resetAll clears everything', () => {
            recordResult({ teamId: 1, result: 'W' });
            recordResult({ teamId: 2, result: 'W' });
            resetAll();
            expect(getCurrentStreak(1)).toBe(0);
            expect(getCurrentStreak(2)).toBe(0);
        });
    });

    describe('determinism', () => {
        it('same sequence → same state', () => {
            const seq = ['W', 'W', 'D', 'W', 'L', 'W'];
            seq.forEach(r => recordResult({ teamId: 1, result: r }));
            const stateA = getCurrentStreak(1);
            resetAll();
            seq.forEach(r => recordResult({ teamId: 1, result: r }));
            expect(getCurrentStreak(1)).toBe(stateA);
        });
    });

    describe('constants integrity', () => {
        it('SEVERITY_THRESHOLDS revised values', () => {
            expect(SEVERITY_THRESHOLDS.mild).toBe(3);
            expect(SEVERITY_THRESHOLDS.strong).toBe(5);
            expect(SEVERITY_THRESHOLDS.phenom).toBe(7);
        });

        it('isFeatureEnabled default false', () => {
            globalThis[FEATURE_FLAG] = false;
            expect(isFeatureEnabled()).toBe(false);
        });

        it('isFeatureEnabled true when global flag set', () => {
            globalThis[FEATURE_FLAG] = true;
            expect(isFeatureEnabled()).toBe(true);
        });
    });

});
