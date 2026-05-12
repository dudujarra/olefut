/**
 * SPEC-F1.2 + F1.3: Reactive cards + Star Impact Toast helpers
 */

import { describe, it, expect } from 'vitest';
import { ReactiveCards, getReactiveCard } from '../../src/engine/MidMatchManagerDeck.js';
import { formatStarImpactText } from '../../src/components/StarImpactToast.jsx';

describe('SPEC-F1.2: Reactive Cards', () => {

    it('catalog has at least 3 reactive cards', () => {
        expect(ReactiveCards.length).toBeGreaterThanOrEqual(3);
    });

    it('covers injury, yellow, opponent_goal types', () => {
        const types = new Set(ReactiveCards.map(c => c.reactiveType));
        expect(types.has('injury')).toBe(true);
        expect(types.has('yellow')).toBe(true);
        expect(types.has('opponent_goal')).toBe(true);
    });

    it('every reactive card has options 2+', () => {
        ReactiveCards.forEach(c => {
            expect(c.options.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('getReactiveCard returns card by type', () => {
        const r = getReactiveCard('injury', 0);
        expect(r).not.toBe(null);
        expect(r.reactiveType).toBe('injury');
    });

    it('determinism via seed', () => {
        const a = getReactiveCard('yellow', 7);
        const b = getReactiveCard('yellow', 7);
        expect(a?.id).toBe(b?.id);
    });

    it('unknown type returns null', () => {
        expect(getReactiveCard('nonexistent', 0)).toBe(null);
    });
});

describe('SPEC-F1.3: formatStarImpactText', () => {

    it('moral delta positive shows +N', () => {
        const r = formatStarImpactText('Pelé', { moral: { before: 50, after: 55 } });
        expect(r).toContain('Pelé');
        expect(r).toContain('Moral +5');
    });

    it('moral delta negative shows -N', () => {
        const r = formatStarImpactText('Pelé', { moral: { before: 55, after: 50 } });
        expect(r).toContain('Moral -5');
    });

    it('xp delta shows +N XP', () => {
        const r = formatStarImpactText('Pelé', { xp: { before: 10, after: 15 } });
        expect(r).toContain('+5 XP');
    });

    it('multiple changes joined com ·', () => {
        const r = formatStarImpactText('Pelé', {
            moral: { before: 50, after: 55 },
            xp: { before: 0, after: 5 },
        });
        expect(r).toContain('·');
        expect(r).toContain('Moral +5');
        expect(r).toContain('+5 XP');
    });

    it('zero delta filtered out', () => {
        const r = formatStarImpactText('Pelé', { moral: { before: 50, after: 50 } });
        expect(r).toBe('');
    });

    it('null name → empty', () => {
        expect(formatStarImpactText(null, {})).toBe('');
    });
});
