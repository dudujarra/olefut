// Regression / harness for SPEC-060 — Club Identity System
// Validates: 170 clubes mapped (80 BR + 50 EU + 40 SA), defaults fallback, sprite coords.
import { describe, test, expect } from 'vitest';
import { CLUB_COLORS, DEFAULT_COLORS, getClubColors, deriveInitials, CLUB_COUNT, CLUB_SPRITES, getClubSprite, SPRITE_SHEETS, normalizeClubName } from '../../src/data/clubColors.js';
import { BrazilDB } from '../../src/engine/db/brazil.js';
import { EuropeDB } from '../../src/engine/db/europe.js';
import { SouthAmericaDB } from '../../src/engine/db/south_america.js';

function flattenDB(db, divisions = false) {
    if (divisions) {
        return [...db[1], ...(db[2] || []), ...(db[3] || []), ...(db[4] || [])];
    }
    // Country-keyed (EUR/SA)
    const all = [];
    Object.values(db).forEach(country => {
        Object.values(country).forEach(div => all.push(...div));
    });
    return all;
}

const allClubs = [
    ...flattenDB(BrazilDB, true),
    ...flattenDB(EuropeDB),
    ...flattenDB(SouthAmericaDB)
];

describe('SPEC-060: Club Identity System (170 clubes BR+EU+SA)', () => {
    test('CLUB_COLORS has 170 entries', () => {
        expect(CLUB_COUNT).toBe(170);
    });

    test('Total clubs in DBs is 170', () => {
        expect(allClubs).toHaveLength(170);
    });

    test('getClubColors returns mapped colors for Flamengo', () => {
        const c = getClubColors('Flamengo');
        expect(c.primary).toBe('#E32636');
        expect(c.initials).toBe('FLA');
    });

    test('getClubColors returns DEFAULT for unmapped + derived initials', () => {
        const c = getClubColors('Inexistente FC');
        expect(c.primary).toBe(DEFAULT_COLORS.primary);
        expect(c.initials).toBe('INE');
    });

    test('All 170 clubs from DBs are mapped in CLUB_COLORS', () => {
        const unmapped = allClubs.filter(c => !CLUB_COLORS[normalizeClubName(c.name)]);
        expect(unmapped.map(c => c.name)).toEqual([]);
    });

    test('All 170 clubs have sprite coords', () => {
        const unmapped = allClubs.filter(c => !CLUB_SPRITES[normalizeClubName(c.name)]);
        expect(unmapped.map(c => c.name)).toEqual([]);
    });

    test('deriveInitials strips accents/non-letters', () => {
        expect(deriveInitials('São Paulo')).toBe('SAO');
        expect(deriveInitials('Atlético-MG')).toBe('ATL');
        expect(deriveInitials('CSA')).toBe('CSA');
        expect(deriveInitials('')).toBe('CLB');
        expect(deriveInitials(null)).toBe('CLB');
    });

    test('All clubes have valid color/initials format', () => {
        Object.entries(CLUB_COLORS).forEach(([name, c]) => {
            expect(c.primary, `${name} primary`).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(c.secondary, `${name} secondary`).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(c.accent, `${name} accent`).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(c.initials, `${name} initials`).toMatch(/^[A-Z0-9]{2,3}$/);
        });
    });

    test('Sprite coords valid per sheet config', () => {
        Object.entries(CLUB_SPRITES).forEach(([name, s]) => {
            const cfg = SPRITE_SHEETS[s.sheet];
            expect(cfg, `${name} sheet '${s.sheet}' missing in SPRITE_SHEETS`).toBeDefined();
            expect(s.col, `${name} col`).toBeLessThan(cfg.cols);
            expect(s.row, `${name} row`).toBeLessThan(cfg.rows);
            expect(s.col).toBeGreaterThanOrEqual(0);
            expect(s.row).toBeGreaterThanOrEqual(0);
        });
    });

    test('Sheet sprite counts match expected: BR 4×20, EU 5×10, SA 4×10', () => {
        const counts = {};
        Object.values(CLUB_SPRITES).forEach(s => {
            counts[s.sheet] = (counts[s.sheet] || 0) + 1;
        });
        expect(counts.a).toBe(20);
        expect(counts.b).toBe(20);
        expect(counts.c).toBe(20);
        expect(counts.d).toBe(20);
        expect(counts.eng).toBe(10);
        expect(counts.esp).toBe(10);
        expect(counts.ita).toBe(10);
        expect(counts.ger).toBe(10);
        expect(counts.fra).toBe(10);
        expect(counts.arg).toBe(10);
        expect(counts.uru).toBe(10);
        expect(counts.chi).toBe(10);
        expect(counts.col).toBe(10);
    });

    test('SPRITE_SHEETS has all 13 sheets', () => {
        const expected = ['a','b','c','d','eng','esp','ita','ger','fra','arg','uru','chi','col'];
        expect(Object.keys(SPRITE_SHEETS).sort()).toEqual(expected.sort());
    });

    test('getClubSprite returns null for unknown', () => {
        expect(getClubSprite('Inexistente FC')).toBeNull();
    });

    test('Authentic primary colors spot-check BR + Tier S Europe', () => {
        const checks = {
            'Flamengo': '#E32636',
            'Palmeiras': '#006437',
            'Manchester City': '#6CABDD',
            'Real Madrid': '#FFFFFF',
            'Barcelona': '#A50044',
            'Juventus': '#000000',
            'Bayern de Munique': '#DC052D',
            'Paris Saint-Germain': '#004170',
            'Boca Juniors': '#002F69',
            'Peñarol': '#FFCD00',
            'Colo-Colo': '#FFFFFF',
            'Atlético Nacional': '#006837'
        };
        Object.entries(checks).forEach(([name, expected]) => {
            expect(getClubColors(name).primary, `${name} primary`).toBe(expected);
        });
    });
});
