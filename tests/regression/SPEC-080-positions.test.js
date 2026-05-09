/**
 * SPEC-080 — 18 posições BR taxonomy regression test
 */

import { describe, test, expect } from 'vitest';
import {
    POSITIONS,
    ALL_POSITION_CODES,
    POSITION_FAMILIES,
    EN_TO_BR,
    BR_TO_EN,
    calculatePositionFit,
    calculateRatingForPosition,
    calculateEffectiveRating,
    getMacroPosition,
    migrateLegacyPosition,
    mapSofaScorePosition
} from '../../src/engine/Positions';

describe('SPEC-080 18-Position Taxonomy (BR)', () => {
    test('exactly 18 positions defined', () => {
        expect(ALL_POSITION_CODES).toHaveLength(18);
    });

    test('all primary codes are BR Portuguese', () => {
        const expected = ['GOL', 'ZAG', 'ZAD', 'ZAE', 'LAD', 'LAE', 'ALD', 'ALE',
                          'VOL', 'MEC', 'MCD', 'MCE', 'MEA', 'MPD', 'MPE',
                          'POD', 'POE', 'CTA'];
        expected.forEach(code => {
            expect(ALL_POSITION_CODES).toContain(code);
        });
    });

    test('every position has BR + EN names', () => {
        ALL_POSITION_CODES.forEach(code => {
            const pos = POSITIONS[code];
            expect(pos.code).toBe(code);
            expect(pos.codeEn).toBeTruthy();
            expect(pos.name).toBeTruthy();
            expect(pos.nameEn).toBeTruthy();
            expect(pos.macro).toMatch(/^(GOL|DEF|MEI|ATA)$/);
        });
    });

    test('EN_TO_BR + BR_TO_EN reciprocal mapping', () => {
        Object.entries(EN_TO_BR).forEach(([en, br]) => {
            expect(BR_TO_EN[br]).toBe(en);
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
        expect(calculatePositionFit('CTA', 'CTA')).toBe(1.0);
        expect(calculatePositionFit('VOL', 'VOL')).toBe(1.0);
    });

    test('position fit: family member = 0.85', () => {
        expect(calculatePositionFit('MEC', 'MCD')).toBe(0.85);
        expect(calculatePositionFit('LAE', 'LAD')).toBe(0.85);
        expect(calculatePositionFit('ZAG', 'ZAD')).toBe(0.85);
    });

    test('position fit: adjacent family = 0.6', () => {
        expect(calculatePositionFit('ZAG', 'VOL')).toBe(0.6);
        expect(calculatePositionFit('MEC', 'MEA')).toBe(0.6);
    });

    test('position fit: distant = 0.3', () => {
        expect(calculatePositionFit('GOL', 'CTA')).toBe(0.3);
        expect(calculatePositionFit('ZAG', 'MEA')).toBe(0.3);
    });

    test('rating for position uses pentagon weights', () => {
        const pedro = {
            attacking: 73,
            technical: 57,
            tactical: 64,
            defending: 39,
            creativity: 55
        };
        const cfRating = calculateRatingForPosition(pedro, 'CTA');
        const cbRating = calculateRatingForPosition(pedro, 'ZAG');
        expect(cfRating).toBeGreaterThan(cbRating);
    });

    test('effective rating respects fit', () => {
        const player = { naturalPosition: 'CTA', attacking: 80, technical: 70, tactical: 60, defending: 30, creativity: 70 };
        const naturalRating = calculateEffectiveRating(player, 'CTA');
        const distantRating = calculateEffectiveRating(player, 'ZAG');
        expect(naturalRating).toBeGreaterThan(distantRating);
    });

    test('legacy migration: GOL → GOL', () => {
        expect(migrateLegacyPosition('GOL')).toBe('GOL');
        expect(migrateLegacyPosition('GK')).toBe('GOL');
    });

    test('legacy migration: ATA returns valid forward BR', () => {
        const validForwards = ['CTA', 'POD', 'POE'];
        for (let i = 0; i < 20; i++) {
            const result = migrateLegacyPosition('ATA');
            expect(validForwards).toContain(result);
        }
    });

    test('SofaScore mapping uses BR codes', () => {
        expect(mapSofaScorePosition('G')).toBe('GOL');
        expect(mapSofaScorePosition('ST')).toBe('CTA');
        expect(mapSofaScorePosition('AMC')).toBe('MEA');
        expect(mapSofaScorePosition('DC')).toBe('ZAG');
        expect(mapSofaScorePosition('DR')).toBe('LAD');
    });

    test('macro position helper', () => {
        expect(getMacroPosition('GOL')).toBe('GOL');
        expect(getMacroPosition('ZAG')).toBe('DEF');
        expect(getMacroPosition('MEA')).toBe('MEI');
        expect(getMacroPosition('CTA')).toBe('ATA');
    });

    test('all families are referenced (BR)', () => {
        const families = new Set(ALL_POSITION_CODES.map(c => POSITIONS[c].family));
        ['GOL', 'ZAG', 'LAT', 'ALA', 'VOL', 'MEI', 'MEA', 'MPL', 'PON', 'ATA'].forEach(f => {
            expect(families.has(f)).toBe(true);
        });
    });
});
