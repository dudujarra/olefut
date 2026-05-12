/**
 * SPEC-B2.2: MidMatchCardModal — pure helper tests
 */

import { describe, it, expect } from 'vitest';
import { formatEffectChip, MidMatchCardModal } from '../../src/components/MidMatchCardModal.jsx';

describe('SPEC-B2.2: MidMatchCardModal', () => {

    describe('formatEffectChip', () => {
        it('moralDelta positive', () => {
            expect(formatEffectChip({ moralDelta: 5 })).toBe('Moral +5');
        });

        it('moralDelta negative', () => {
            expect(formatEffectChip({ moralDelta: -3 })).toBe('Moral -3');
        });

        it('energyDelta', () => {
            expect(formatEffectChip({ energyDelta: 10 })).toBe('Energia +10');
        });

        it('tacticShift', () => {
            expect(formatEffectChip({ tacticShift: 'pressing' })).toBe('Tática: pressing');
        });

        it('multiple effects joined com ·', () => {
            const r = formatEffectChip({ moralDelta: 5, energyDelta: -3 });
            expect(r).toContain('Moral +5');
            expect(r).toContain('Energia -3');
            expect(r).toContain('·');
        });

        it('empty effect returns empty string', () => {
            expect(formatEffectChip({})).toBe('');
        });

        it('null effect returns empty string', () => {
            expect(formatEffectChip(null)).toBe('');
        });

        it('invalid input returns empty string', () => {
            expect(formatEffectChip('not an object')).toBe('');
            expect(formatEffectChip(undefined)).toBe('');
        });
    });

    describe('module integrity', () => {
        it('MidMatchCardModal is exported as function', () => {
            expect(typeof MidMatchCardModal).toBe('function');
        });
    });

});
