// Regression / harness for SPEC-060 — Club Identity System
// Validates: 80 clubes mapped, defaults fallback, deriveInitials.
import { describe, test, expect } from 'vitest';
import { CLUB_COLORS, DEFAULT_COLORS, getClubColors, deriveInitials, CLUB_COUNT, CLUB_SPRITES, getClubSprite, SPRITE_SHEETS, SPRITE_GRID } from '../../src/data/clubColors.js';
import { BrazilDB } from '../../src/engine/db/brazil.js';

describe('SPEC-060: Club Identity System', () => {
    test('CLUB_COLORS has 80 entries', () => {
        expect(CLUB_COUNT).toBe(80);
    });

    test('getClubColors returns mapped colors for Flamengo', () => {
        const c = getClubColors('Flamengo');
        expect(c.primary).toBe('#E32636');
        expect(c.secondary).toBe('#000000');
        expect(c.initials).toBe('FLA');
        expect(c.nickname).toBe('Mengão');
    });

    test('getClubColors returns DEFAULT for unmapped name with derived initials', () => {
        const c = getClubColors('Inexistente FC');
        expect(c.primary).toBe(DEFAULT_COLORS.primary);
        expect(c.secondary).toBe(DEFAULT_COLORS.secondary);
        expect(c.initials).toBe('INE');
    });

    test('All 80 clubes from BrazilDB are mapped in CLUB_COLORS', () => {
        const allBrazilClubs = [
            ...BrazilDB[1],
            ...BrazilDB[2],
            ...BrazilDB[3],
            ...BrazilDB[4]
        ];

        expect(allBrazilClubs).toHaveLength(80);

        const unmapped = allBrazilClubs.filter(c => !CLUB_COLORS[c.name]);
        expect(unmapped.map(c => c.name)).toEqual([]);
    });

    test('deriveInitials strips accents and non-letters', () => {
        expect(deriveInitials('São Paulo')).toBe('SAO');
        expect(deriveInitials('Atlético-MG')).toBe('ATL');
        expect(deriveInitials('CSA')).toBe('CSA');
        expect(deriveInitials('')).toBe('CLB');
        expect(deriveInitials(null)).toBe('CLB');
    });

    test('All mapped clubes have required fields', () => {
        Object.entries(CLUB_COLORS).forEach(([name, c]) => {
            expect(c.primary, `${name} primary missing`).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(c.secondary, `${name} secondary missing`).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(c.accent, `${name} accent missing`).toMatch(/^#[0-9A-Fa-f]{6}$/);
            expect(c.initials, `${name} initials missing`).toMatch(/^[A-Z]{2,3}$/);
            expect(typeof c.nickname).toBe('string');
        });
    });

    test('All 80 clubes have sprite coords', () => {
        const allBrazilClubs = [
            ...BrazilDB[1], ...BrazilDB[2], ...BrazilDB[3], ...BrazilDB[4]
        ];
        const unmapped = allBrazilClubs.filter(c => !CLUB_SPRITES[c.name]);
        expect(unmapped.map(c => c.name)).toEqual([]);
    });

    test('Sprite coords valid (col 0-4, row 0-3)', () => {
        Object.entries(CLUB_SPRITES).forEach(([name, s]) => {
            expect(s.sheet, `${name} sheet`).toMatch(/^[abcd]$/);
            expect(s.col, `${name} col`).toBeGreaterThanOrEqual(0);
            expect(s.col, `${name} col`).toBeLessThan(SPRITE_GRID.cols);
            expect(s.row, `${name} row`).toBeGreaterThanOrEqual(0);
            expect(s.row, `${name} row`).toBeLessThan(SPRITE_GRID.rows);
        });
    });

    test('Each sheet has exactly 20 sprites mapped', () => {
        const counts = { a: 0, b: 0, c: 0, d: 0 };
        Object.values(CLUB_SPRITES).forEach(s => counts[s.sheet]++);
        expect(counts).toEqual({ a: 20, b: 20, c: 20, d: 20 });
    });

    test('SPRITE_SHEETS has all 4 series files', () => {
        expect(SPRITE_SHEETS.a).toMatch(/serie-a\.png$/);
        expect(SPRITE_SHEETS.b).toMatch(/serie-b\.png$/);
        expect(SPRITE_SHEETS.c).toMatch(/serie-c\.png$/);
        expect(SPRITE_SHEETS.d).toMatch(/serie-d\.png$/);
    });

    test('getClubSprite returns null for unknown club', () => {
        expect(getClubSprite('Inexistente FC')).toBeNull();
    });

    test('Tier S Série A clubes have authentic primary colors', () => {
        // Spot-check famous club colors against authentic references
        const checks = {
            'Flamengo': '#E32636',       // Vermelho rubro-negro
            'Palmeiras': '#006437',      // Verde Palmeiras
            'São Paulo': '#FE0000',      // Vermelho tricolor
            'Cruzeiro': '#003F87',       // Azul celeste
            'Internacional': '#E5050E',  // Vermelho colorado
            'Grêmio': '#007BC4',         // Azul tricolor
            'Vasco da Gama': '#000000'   // Preto Cruz Maltesa
        };
        Object.entries(checks).forEach(([name, expected]) => {
            expect(getClubColors(name).primary, `${name} primary`).toBe(expected);
        });
    });
});
