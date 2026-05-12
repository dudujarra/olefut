/**
 * SPEC-C5.3: Derby-aware mid-match cards
 */

import { describe, it, expect } from 'vitest';
import {
    MidMatchManagerDeck,
    getMidMatchCardDerbyAware,
    getMidMatchCard,
} from '../../src/engine/MidMatchManagerDeck.js';

describe('SPEC-C5.3: Derby-aware cards', () => {

    describe('derby cards in catalog', () => {
        it('catalog has at least 3 derby-flagged cards', () => {
            const derbyCards = MidMatchManagerDeck.filter(c => c.derby === true);
            expect(derbyCards.length).toBeGreaterThanOrEqual(3);
        });

        it('derby cards cover wide minute range', () => {
            const derbyCards = MidMatchManagerDeck.filter(c => c.derby === true);
            const ranges = derbyCards.map(c => c.minuteRange);
            const lowMin = Math.min(...ranges.map(r => r[0]));
            const highMax = Math.max(...ranges.map(r => r[1]));
            expect(lowMin).toBeLessThanOrEqual(30);
            expect(highMax).toBeGreaterThanOrEqual(75);
        });

        it('all derby cards have options + effects', () => {
            const derbyCards = MidMatchManagerDeck.filter(c => c.derby === true);
            derbyCards.forEach(c => {
                expect(c.options.length).toBeGreaterThanOrEqual(2);
                c.options.forEach(o => {
                    expect(typeof o.label).toBe('string');
                    expect(typeof o.effect).toBe('object');
                });
            });
        });

        it('derby cards mention BR derby context', () => {
            const derbyCards = MidMatchManagerDeck.filter(c => c.derby === true);
            const allText = derbyCards.map(c => c.text).join(' ').toLowerCase();
            const derbyTerms = ['clássico', 'derby', 'torcida'];
            const hits = derbyTerms.filter(t => allText.includes(t));
            expect(hits.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('getMidMatchCardDerbyAware', () => {
        it('non-derby context → returns from full deck', () => {
            const card = getMidMatchCardDerbyAware(45, false, 0);
            expect(card).not.toBe(null);
        });

        it('derby context → returns derby card when available', () => {
            const card = getMidMatchCardDerbyAware(60, true, 0);
            expect(card).not.toBe(null);
            // Should be derby-flagged at minute 60
            if (card) expect(card.derby).toBe(true);
        });

        it('derby context with no minute match → fallback to normal deck', () => {
            // Minute 5 has no derby cards (derby cards range 15-90)
            const card = getMidMatchCardDerbyAware(5, true, 0);
            // No card at minute 5 in any deck → null
            expect(card).toBe(null);
        });

        it('determinism with seed', () => {
            const a = getMidMatchCardDerbyAware(60, true, 42);
            const b = getMidMatchCardDerbyAware(60, true, 42);
            expect(a?.id).toBe(b?.id);
        });

        it('different seeds → potentially different derby cards', () => {
            const ids = new Set();
            for (let s = 0; s < 10; s++) {
                const c = getMidMatchCardDerbyAware(60, true, s);
                if (c) ids.add(c.id);
            }
            expect(ids.size).toBeGreaterThan(1);
        });

        it('isDerby=false delegates to getMidMatchCard', () => {
            const aware = getMidMatchCardDerbyAware(45, false, 7);
            const plain = getMidMatchCard(45, 7);
            expect(aware?.id).toBe(plain?.id);
        });
    });

});
