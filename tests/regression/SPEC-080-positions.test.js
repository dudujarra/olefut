/**
 * SPEC-080 — 18 positions taxonomy regression test
 */

import { describe, test, expect } from 'vitest';
import {
    POSITIONS,
    ALL_POSITION_CODES,
    POSITION_FAMILIES,
    calculatePositionFit,
    calculateRatingForPosition,
    calculateEffectiveRating,
    getMacroPosition,
    migrateLegacyPosition,
    mapSofaScorePosition
} from '../../src/engine/Positions';

describe('SPEC-080 18-Position Taxonomy', () => {
    test('exactly 18 positions defined', () => {
        expect(ALL_POSITION_CODES).toHaveLength(18);
    });

    test('every position has required fields', () => {
        ALL_POSITION_CODES.forEach(code => {
            const pos = POSITIONS[code];
            expect(pos.code).toBe(code);
            expect(pos.name).toBeTruthy();
            expect(pos.macro).toMatch(/^(GOL|DEF|MEI|ATA)$/);
            expect(pos.family).toBeTruthy();
            expect(pos.side).toMatch(/^(L|C|R)$/);
            expect(typeof pos.line).toBe('number');
        });
    });

    test('macro distribution: 1 GOL, 7 DEF, 7 MEI, 3 ATA', () => {
        const counts = { GOL: 0, DEF: 0, MEI: 0, ATA: 0 };
        ALL_POSITION_CODES.forEach(code => counts[POSITIONS[code].macro]++);
        expect(counts.GOL).toBe(1);
        expect(counts.DEF).toBe(7);
        expect(counts.MEI).toBe(7);
        expect(counts.ATA).toBe(3);
    });

    test('position fit: natural = 1.0', () => {
        expect(calculatePositionFit('CF', 'CF')).toBe(1.0);
    });

    test('position fit: family member = 0.85', () => {
        expect(calculatePositionFit('CM', 'CMR')).toBe(0.85);
        expect(calculatePositionFit('LB', 'RB')).toBe(0.85);
    });

    test('position fit: adjacent family = 0.6', () => {
        expect(calculatePositionFit('CB', 'DM')).toBe(0.6);
        expect(calculatePositionFit('CM', 'AM')).toBe(0.6);
    });

    test('position fit: distant = 0.3', () => {
        expect(calculatePositionFit('GK', 'CF')).toBe(0.3);
        expect(calculatePositionFit('CB', 'AM')).toBe(0.3);
    });

    test('rating for position uses pentagon weights', () => {
        const pedro = {
            attacking: 73,
            technical: 57,
            tactical: 64,
            defending: 39,
            creativity: 55
        };
        const cfRating = calculateRatingForPosition(pedro, 'CF');
        const cbRating = calculateRatingForPosition(pedro, 'CB');
        // Pedro is forward, CF rating should be higher than CB
        expect(cfRating).toBeGreaterThan(cbRating);
    });

    test('effective rating respects fit', () => {
        const player = { naturalPosition: 'CF', attacking: 80, technical: 70, tactical: 60, defending: 30, creativity: 70 };
        const naturalRating = calculateEffectiveRating(player, 'CF');
        const distantRating = calculateEffectiveRating(player, 'CB');
        expect(naturalRating).toBeGreaterThan(distantRating);
    });

    test('legacy migration: GOL → GK', () => {
        expect(migrateLegacyPosition('GOL')).toBe('GK');
        expect(migrateLegacyPosition('GK')).toBe('GK');
    });

    test('legacy migration: ATA returns valid forward', () => {
        const validForwards = ['CF', 'RW', 'LW'];
        for (let i = 0; i < 20; i++) {
            const result = migrateLegacyPosition('ATA');
            expect(validForwards).toContain(result);
        }
    });

    test('SofaScore mapping covers common codes', () => {
        expect(mapSofaScorePosition('G')).toBe('GK');
        expect(mapSofaScorePosition('ST')).toBe('CF');
        expect(mapSofaScorePosition('AMC')).toBe('AM');
        expect(mapSofaScorePosition('DC')).toBe('CB');
        expect(mapSofaScorePosition('DR')).toBe('RB');
    });

    test('macro position helper', () => {
        expect(getMacroPosition('GK')).toBe('GOL');
        expect(getMacroPosition('CB')).toBe('DEF');
        expect(getMacroPosition('AM')).toBe('MEI');
        expect(getMacroPosition('CF')).toBe('ATA');
    });

    test('all families are referenced', () => {
        const families = new Set(ALL_POSITION_CODES.map(c => POSITIONS[c].family));
        ['GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'WM', 'WG', 'FW'].forEach(f => {
            expect(families.has(f)).toBe(true);
        });
    });
});
