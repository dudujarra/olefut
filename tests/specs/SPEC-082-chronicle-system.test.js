import { describe, test, expect } from 'vitest';
import { generate } from '../../src/engine/ChronicleSystem.js';

const defaults = { season: 5, clubName: 'Flamengo', managerName: 'Técnico Famoso' };

describe('SPEC-082: Chronicle System', () => {

    test('chronicle is non-empty string', () => {
        const result = generate({ ...defaults, seasonData: { finalPosition: 5, wins: 20, totalTeams: 20 } });
        expect(typeof result.chronicle).toBe('string');
        expect(result.chronicle.length).toBeGreaterThan(10);
    });

    test('title win → triumph mood', () => {
        const result = generate({ ...defaults, seasonData: { titlesWon: ['Brasileirão'], finalPosition: 1 } });
        expect(result.mood).toBe('triumph');
        expect(result.chronicle).toContain('Flamengo');
    });

    test('title interpolated in chronicle', () => {
        const result = generate({ ...defaults, seasonData: { titlesWon: ['Copa do Brasil'], finalPosition: 1 } });
        expect(result.chronicle).toContain('Copa do Brasil');
    });

    test('promotion → rise mood', () => {
        const result = generate({ ...defaults, seasonData: { promotionOccurred: true, finalPosition: 2 } });
        expect(result.mood).toBe('rise');
    });

    test('relegation → fall mood', () => {
        const result = generate({ ...defaults, seasonData: { relegationOccurred: true, finalPosition: 19 } });
        expect(result.mood).toBe('fall');
    });

    test('worst loss ≥ 4 → shame mood', () => {
        const result = generate({ ...defaults, seasonData: { worstLoss: { diff: 5, score: '0-5', opponent: 'Corinthians' }, finalPosition: 10 } });
        expect(result.mood).toBe('shame');
    });

    test('top 40% position → solid mood', () => {
        const result = generate({ ...defaults, seasonData: { finalPosition: 6, wins: 15, totalTeams: 20 } });
        expect(result.mood).toBe('solid');
    });

    test('mid-table → neutral mood', () => {
        const result = generate({ ...defaults, seasonData: { finalPosition: 13, wins: 10, totalTeams: 20 } });
        expect(result.mood).toBe('neutral');
    });

    test('season number returned', () => {
        const result = generate({ ...defaults, season: 7, seasonData: {} });
        expect(result.season).toBe(7);
    });

    test('clubName always appears in chronicle', () => {
        const result = generate({ ...defaults, seasonData: { finalPosition: 5, wins: 15, totalTeams: 20 } });
        expect(result.chronicle).toContain('Flamengo');
    });
});
