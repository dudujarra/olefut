/**
 * Unit tests for AutoPlayDecisions
 * AKITA-411: Top 10 unit test coverage
 *
 * AutoPlayDecisions is a 643L monolith (makeDecisions + _evaluateJobProposals).
 * Tests validate structural contracts, not every decision branch (covered by integration).
 */
import { describe, it, expect } from 'vitest';
import { AutoPlayDecisions } from '../../src/services/AutoPlayDecisions.js';

describe('AutoPlayDecisions', () => {
    describe('constructor', () => {
        it('stores parent reference', () => {
            const parent = { engine: {} };
            const d = new AutoPlayDecisions(parent);
            expect(d.parent).toBe(parent);
        });
    });

    describe('makeDecisions()', () => {
        it('returns early when no teamId', () => {
            const parent = {
                engine: { manager: { teamId: null } },
            };
            const d = new AutoPlayDecisions(parent);
            // Should not throw — early return on no teamId
            expect(() => d.makeDecisions()).not.toThrow();
        });
    });
});
