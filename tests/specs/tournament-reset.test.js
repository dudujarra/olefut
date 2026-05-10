/**
 * Tournament Reset Tests
 * Validates: KnockoutCup and ContinentalCup properly reset state on init()
 */
import { describe, it, expect } from 'vitest';
import { KnockoutCup } from '../../src/engine/tournaments/KnockoutCup.js';
import { ContinentalCup } from '../../src/engine/tournaments/ContinentalCup.js';

describe('Tournament State Reset', () => {
    it('KnockoutCup.init resets phase index and winner', () => {
        const cup = new KnockoutCup('TEST_CUP', 'Test Cup', [4, 8, 12]);
        cup.init([1, 2, 3, 4]);

        // Simulate advancing
        cup.currentPhaseIndex = 3;
        cup.winner = 1;
        cup.isActive = false;

        // Re-init for new season
        cup.init([5, 6, 7, 8]);
        expect(cup.currentPhaseIndex).toBe(0);
        expect(cup.winner).toBeNull();
        expect(cup.isActive).toBe(true);
        expect(cup.participants).toEqual([5, 6, 7, 8]);
    });

    it('ContinentalCup.init resets groups, phase, and knockout state', () => {
        const cup = new ContinentalCup('TEST_CONT', 'Test Continental', [5, 9, 13], [17, 21, 25]);
        cup.init([1, 2, 3, 4, 5, 6, 7, 8]);

        // Simulate advancing through groups
        cup.phase = 'KNOCKOUT';
        cup.currentRoundGroup = 3;
        cup.knockoutPhaseIndex = 2;
        cup.winner = 1;
        cup.isActive = false;

        // Re-init for new season
        cup.init([10, 11, 12, 13, 14, 15, 16, 17]);
        expect(cup.phase).toBe('GROUPS');
        expect(cup.currentRoundGroup).toBe(0);
        expect(cup.knockoutPhaseIndex).toBe(0);
        expect(cup.knockoutMatches).toEqual([]);
        expect(cup.winner).toBeNull();
        expect(cup.isActive).toBe(true);
        expect(cup.groups.length).toBeGreaterThan(0);
    });
});
