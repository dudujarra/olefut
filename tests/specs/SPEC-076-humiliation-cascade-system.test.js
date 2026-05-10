import { describe, test, expect } from 'vitest';
import { evaluate } from '../../src/engine/HumiliationCascadeSystem.js';

const defaults = { teamId: 1, managerId: 1, week: 10, season: 2, managerTension: 50, isPlayerManager: true };

describe('SPEC-076: Humiliation Cascade System', () => {

    test('scoreDiff < 4 → level 0, no cascade', () => {
        const result = evaluate({ ...defaults, scoreDiff: 3 });
        expect(result.humiliationLevel).toBe(0);
        expect(result.cascadeEvents.length).toBe(0);
    });

    test('scoreDiff=0 → level 0', () => {
        const result = evaluate({ ...defaults, scoreDiff: 0 });
        expect(result.humiliationLevel).toBe(0);
    });

    test('level 1: morale_collapse + press_hostility', () => {
        const result = evaluate({ ...defaults, scoreDiff: 4 });
        expect(result.humiliationLevel).toBe(1);
        const types = result.cascadeEvents.map(e => e.type);
        expect(types).toContain('morale_collapse');
        expect(types).toContain('press_hostility');
    });

    test('level 1: cascadeEvents not empty', () => {
        const result = evaluate({ ...defaults, scoreDiff: 5 });
        expect(result.cascadeEvents.length).toBeGreaterThan(0);
    });

    test('level 2: adds board_meeting with tensionDelta -15', () => {
        const result = evaluate({ ...defaults, scoreDiff: 6 });
        expect(result.humiliationLevel).toBe(2);
        const boardEvent = result.cascadeEvents.find(e => e.type === 'board_meeting');
        expect(boardEvent).toBeDefined();
        expect(boardEvent.tensionDelta).toBe(-15);
    });

    test('level 2: adds fan_protest', () => {
        const result = evaluate({ ...defaults, scoreDiff: 7 });
        expect(result.cascadeEvents.map(e => e.type)).toContain('fan_protest');
    });

    test('level 3: manager_ultimatum tensionDelta -30', () => {
        const result = evaluate({ ...defaults, scoreDiff: 8 });
        const ultimatum = result.cascadeEvents.find(e => e.type === 'manager_ultimatum');
        expect(ultimatum).toBeDefined();
        expect(ultimatum.tensionDelta).toBe(-30);
    });

    test('level 3: includes player_request_transfer', () => {
        const result = evaluate({ ...defaults, scoreDiff: 9 });
        expect(result.cascadeEvents.map(e => e.type)).toContain('player_request_transfer');
    });

    test('survival narrative active at level 3', () => {
        const result = evaluate({ ...defaults, scoreDiff: 8 });
        expect(result.survivalNarrative.active).toBe(true);
        expect(result.survivalNarrative.milestoneDescription).toBeTruthy();
    });

    test('survival narrative NOT active at level 1', () => {
        const result = evaluate({ ...defaults, scoreDiff: 4 });
        expect(result.survivalNarrative.active).toBe(false);
    });

    test('all tensionDelta values are negative', () => {
        const result = evaluate({ ...defaults, scoreDiff: 9 });
        result.cascadeEvents.filter(e => e.tensionDelta !== undefined).forEach(e => {
            expect(e.tensionDelta).toBeLessThan(0);
        });
    });
});
