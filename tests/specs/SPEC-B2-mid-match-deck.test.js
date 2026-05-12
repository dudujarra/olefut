/**
 * SPEC-B2: MidMatchManagerDeck harness
 */

import { describe, it, expect } from 'vitest';
import {
    MidMatchManagerDeck,
    shouldTriggerMidMatch,
    getMidMatchCard,
    VALID_TRIGGER_MINUTES,
} from '../../src/engine/MidMatchManagerDeck.js';

describe('SPEC-B2: MidMatchManagerDeck', () => {

    describe('rule 1: trigger minutes', () => {
        it('triggers at 15/30/45/60/75', () => {
            [15, 30, 45, 60, 75].forEach(m => {
                expect(shouldTriggerMidMatch(m, new Set())).toBe(true);
            });
        });

        it('does NOT trigger at non-multiples', () => {
            [1, 7, 14, 16, 31, 90].forEach(m => {
                expect(shouldTriggerMidMatch(m, new Set())).toBe(false);
            });
        });

        it('does NOT re-trigger at already-consumed minute', () => {
            expect(shouldTriggerMidMatch(30, new Set([30]))).toBe(false);
        });

        it('still triggers when other minutes consumed', () => {
            expect(shouldTriggerMidMatch(45, new Set([15, 30]))).toBe(true);
        });
    });

    describe('rule 2: catalog integrity', () => {
        it('has at least 8 cards', () => {
            expect(MidMatchManagerDeck.length).toBeGreaterThanOrEqual(8);
        });

        it('every card has 3 options', () => {
            MidMatchManagerDeck.forEach(c => {
                expect(c.options.length).toBe(3);
            });
        });

        it('every option has label, effect, resultText', () => {
            MidMatchManagerDeck.forEach(c => {
                c.options.forEach(o => {
                    expect(typeof o.label).toBe('string');
                    expect(typeof o.resultText).toBe('string');
                    expect(typeof o.effect).toBe('object');
                });
            });
        });

        it('effects within ±15 magnitude', () => {
            MidMatchManagerDeck.forEach(c => {
                c.options.forEach(o => {
                    if (typeof o.effect.moralDelta === 'number') {
                        expect(Math.abs(o.effect.moralDelta)).toBeLessThanOrEqual(15);
                    }
                    if (typeof o.effect.energyDelta === 'number') {
                        expect(Math.abs(o.effect.energyDelta)).toBeLessThanOrEqual(15);
                    }
                });
            });
        });

        it('minuteRange válido (lo<=hi e dentro 0-90)', () => {
            MidMatchManagerDeck.forEach(c => {
                const [lo, hi] = c.minuteRange;
                expect(lo).toBeLessThanOrEqual(hi);
                expect(lo).toBeGreaterThanOrEqual(0);
                expect(hi).toBeLessThanOrEqual(90);
            });
        });
    });

    describe('rule 3: PT-BR + sem emoji', () => {
        it('zero emoji em catalog', () => {
            const text = MidMatchManagerDeck
                .map(c => c.text + c.options.map(o => o.label + o.resultText).join(' '))
                .join(' ');
            // eslint-disable-next-line no-misleading-character-class
            const emojiRegex = /[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/u;
            expect(emojiRegex.test(text)).toBe(false);
        });

        it('cards mencionam termos BR (torcida, banco, capitao, lateral, volante)', () => {
            const allText = MidMatchManagerDeck.map(c => c.text + ' ' + c.options.map(o => o.label).join(' ')).join(' ').toLowerCase();
            const brTerms = ['torcida', 'banco', 'capitão', 'lateral', 'volante', 'tribuna'];
            const hits = brTerms.filter(t => allText.includes(t));
            expect(hits.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('rule 4: determinismo', () => {
        it('same seed + minute → same card', () => {
            const a = getMidMatchCard(45, 7);
            const b = getMidMatchCard(45, 7);
            expect(a?.id).toBe(b?.id);
        });

        it('different seed → potentially different card', () => {
            const ids = new Set();
            for (let s = 0; s < 10; s++) {
                ids.add(getMidMatchCard(60, s)?.id);
            }
            expect(ids.size).toBeGreaterThan(1);
        });

        it('minute fora de range → null', () => {
            // Minuto 5 não tem carta (todas iniciam em 15+)
            expect(getMidMatchCard(5, 0)).toBe(null);
        });
    });

    describe('VALID_TRIGGER_MINUTES', () => {
        it('contém exatamente 5 minutos', () => {
            expect(VALID_TRIGGER_MINUTES.size).toBe(5);
        });

        it('todos múltiplos de 15', () => {
            VALID_TRIGGER_MINUTES.forEach(m => {
                expect(m % 15).toBe(0);
            });
        });
    });

    describe('rule 5: forbidden', () => {
        it('nenhuma carta sem options', () => {
            MidMatchManagerDeck.forEach(c => {
                expect(c.options.length).toBeGreaterThan(0);
            });
        });

        it('todos os ids únicos', () => {
            const ids = MidMatchManagerDeck.map(c => c.id);
            expect(new Set(ids).size).toBe(ids.length);
        });
    });

});
