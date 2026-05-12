/**
 * SPEC-B5: TacticFormatter harness
 */

import { describe, it, expect } from 'vitest';
import { formatTacticModifiers, getTacticModifierParts } from '../../src/engine/TacticFormatter.js';

describe('SPEC-B5: TacticFormatter', () => {

    describe('formatTacticModifiers', () => {
        it('offensive tactic formats correctly', () => {
            const s = formatTacticModifiers('offensive');
            expect(s).toBe('ATA ×1.30 / DEF ×0.70');
        });

        it('defensive tactic formats correctly', () => {
            expect(formatTacticModifiers('defensive')).toBe('ATA ×0.70 / DEF ×1.30');
        });

        it('normal tactic formats correctly', () => {
            expect(formatTacticModifiers('normal')).toBe('ATA ×1.00 / DEF ×1.00');
        });

        it('unknown tactic returns empty string', () => {
            expect(formatTacticModifiers('nonexistent')).toBe('');
        });

        it('counter tactic shows offensive + defensive bias', () => {
            const s = formatTacticModifiers('counter');
            expect(s).toMatch(/×1\.20/);
            expect(s).toMatch(/×1\.10/);
        });
    });

    describe('getTacticModifierParts', () => {
        it('returns split parts with ataValue/defValue', () => {
            const parts = getTacticModifierParts('offensive');
            expect(parts.ata).toBe('×1.30');
            expect(parts.def).toBe('×0.70');
            expect(parts.ataValue).toBeCloseTo(1.30);
            expect(parts.defValue).toBeCloseTo(0.70);
        });

        it('unknown tactic returns neutral defaults', () => {
            const parts = getTacticModifierParts('nonexistent');
            expect(parts.ataValue).toBe(1.0);
            expect(parts.defValue).toBe(1.0);
            expect(parts.ata).toBe('');
        });

        it('all valid tactics return valid parts', () => {
            const keys = ['normal', 'offensive', 'defensive', 'pressing', 'counter', 'possession'];
            keys.forEach(k => {
                const parts = getTacticModifierParts(k);
                expect(parts.ataValue).toBeGreaterThan(0);
                expect(parts.defValue).toBeGreaterThan(0);
                expect(parts.ata).toMatch(/×\d+\.\d{2}/);
                expect(parts.def).toMatch(/×\d+\.\d{2}/);
            });
        });
    });

    describe('determinism', () => {
        it('same key → same output', () => {
            expect(formatTacticModifiers('offensive')).toBe(formatTacticModifiers('offensive'));
        });
    });

});
