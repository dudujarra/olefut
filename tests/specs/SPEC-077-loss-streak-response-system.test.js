import { describe, test, expect } from 'vitest';
import { evaluate, recordResult, getCurrentStreak } from '../../src/engine/LossStreakResponseSystem.js';

const defaults = { teamId: 999, managerId: 1, currentTension: 50, squadMorale: 50, week: 10 };

describe('SPEC-077: Loss Streak Response System', () => {

    test('streak 3-4 → mild, no force', () => {
        const result = evaluate({ ...defaults, streakLength: 4, isPlayerManager: true });
        expect(result.streakSeverity).toBe('mild');
        expect(result.forcedEvent).toBe(false);
    });

    test('streak 5+ gives response options for player', () => {
        const result = evaluate({ ...defaults, streakLength: 5, isPlayerManager: true });
        expect(result.responseOptions).toBeDefined();
        expect(result.responseOptions.length).toBeGreaterThan(0);
    });

    test('streak 8+ → forcedEvent=true for player', () => {
        const result = evaluate({ ...defaults, streakLength: 8, isPlayerManager: true });
        expect(result.forcedEvent).toBe(true);
        expect(result.streakSeverity).toBe('crisis');
    });

    test('streak 11+ → tensionApplied -40', () => {
        const result = evaluate({ ...defaults, streakLength: 11, isPlayerManager: true });
        expect(result.tensionApplied).toBe(-40);
        expect(result.streakSeverity).toBe('collapse');
    });

    test('NPC gets npcResponse, no responseOptions', () => {
        const result = evaluate({ ...defaults, streakLength: 7, isPlayerManager: false });
        expect(result.npcResponse).toBeDefined();
        expect(result.npcResponse.action).toBeTruthy();
        expect(result.responseOptions).toBeUndefined();
    });

    test('resign always available in crisis', () => {
        const result = evaluate({ ...defaults, streakLength: 9, isPlayerManager: true });
        expect(result.responseOptions.some(o => o.id === 'resign')).toBe(true);
    });

    test('morale floor at 5', () => {
        const result = evaluate({ ...defaults, streakLength: 15, squadMorale: 3, isPlayerManager: true });
        expect(result.moraleFloorApplied).toBe(true);
        expect(result.newMorale).toBeGreaterThanOrEqual(5);
    });

    test('recordResult W resets streak to 0', () => {
        const tid = 77777;
        recordResult({ teamId: tid, result: 'L' });
        recordResult({ teamId: tid, result: 'L' });
        recordResult({ teamId: tid, result: 'W' });
        expect(getCurrentStreak(tid)).toBe(0);
    });

    test('recordResult L increments streak', () => {
        const tid = 88888;
        recordResult({ teamId: tid, result: 'L' });
        recordResult({ teamId: tid, result: 'L' });
        expect(getCurrentStreak(tid)).toBe(2);
    });

    test('draw does not change streak', () => {
        const tid = 99999;
        recordResult({ teamId: tid, result: 'L' });
        recordResult({ teamId: tid, result: 'D' });
        expect(getCurrentStreak(tid)).toBe(1);
    });

    test('streak 0-2 → no severity (none)', () => {
        const result = evaluate({ ...defaults, streakLength: 2, isPlayerManager: true });
        expect(result.streakSeverity).toBe('none');
    });
});
