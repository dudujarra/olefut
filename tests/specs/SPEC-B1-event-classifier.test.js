/**
 * SPEC-B1: MatchEventClassifier harness
 */

import { describe, it, expect } from 'vitest';
import {
    getEventTier,
    filterHighlights,
    groupByTier,
    VALID_TIERS,
    TIER_MAP,
} from '../../src/engine/MatchEventClassifier.js';

describe('SPEC-B1: MatchEventClassifier', () => {

    describe('rule 1: tier mapping', () => {
        it('goal → highlight', () => {
            expect(getEventTier('goal')).toBe('highlight');
        });

        it('red → highlight', () => {
            expect(getEventTier('red')).toBe('highlight');
            expect(getEventTier('red-card')).toBe('highlight');
        });

        it('substitution → tactical', () => {
            expect(getEventTier('substitution')).toBe('tactical');
            expect(getEventTier('sub')).toBe('tactical');
        });

        it('injury → tactical', () => {
            expect(getEventTier('injury')).toBe('tactical');
        });

        it('yellow → minor', () => {
            expect(getEventTier('yellow')).toBe('minor');
            expect(getEventTier('yellow-card')).toBe('minor');
        });

        it('chance/corner/free-kick → minor', () => {
            expect(getEventTier('chance')).toBe('minor');
            expect(getEventTier('corner')).toBe('minor');
            expect(getEventTier('free-kick')).toBe('minor');
        });

        it('narration → minor', () => {
            expect(getEventTier('narration')).toBe('minor');
        });
    });

    describe('rule 2: default safe', () => {
        it('unknown type → minor', () => {
            expect(getEventTier('exploded')).toBe('minor');
        });

        it('null/undefined → minor', () => {
            expect(getEventTier(null)).toBe('minor');
            expect(getEventTier(undefined)).toBe('minor');
        });

        it('non-string → minor', () => {
            expect(getEventTier(42)).toBe('minor');
            expect(getEventTier({})).toBe('minor');
        });
    });

    describe('filterHighlights', () => {
        it('returns only highlight events', () => {
            const events = [
                { type: 'goal' }, { type: 'yellow' }, { type: 'goal' }, { type: 'corner' },
            ];
            expect(filterHighlights(events).length).toBe(2);
        });

        it('empty input → empty array', () => {
            expect(filterHighlights([])).toEqual([]);
            expect(filterHighlights(null)).toEqual([]);
        });
    });

    describe('groupByTier', () => {
        it('groups events by tier correctly', () => {
            const events = [
                { type: 'goal' },
                { type: 'substitution' },
                { type: 'corner' },
                { type: 'red' },
                { type: 'yellow' },
            ];
            const groups = groupByTier(events);
            expect(groups.highlight.length).toBe(2);
            expect(groups.tactical.length).toBe(1);
            expect(groups.minor.length).toBe(2);
        });

        it('non-array input returns empty groups', () => {
            const g = groupByTier(null);
            expect(g.highlight).toEqual([]);
            expect(g.tactical).toEqual([]);
            expect(g.minor).toEqual([]);
        });
    });

    describe('rule 3: determinism', () => {
        it('same input → same output', () => {
            expect(getEventTier('goal')).toBe(getEventTier('goal'));
        });
    });

    describe('constants integrity', () => {
        it('VALID_TIERS has 3 values', () => {
            expect(VALID_TIERS.length).toBe(3);
            expect(VALID_TIERS).toContain('highlight');
            expect(VALID_TIERS).toContain('tactical');
            expect(VALID_TIERS).toContain('minor');
        });

        it('TIER_MAP values são todos válidos', () => {
            Object.values(TIER_MAP).forEach(v => {
                expect(VALID_TIERS).toContain(v);
            });
        });
    });

});
