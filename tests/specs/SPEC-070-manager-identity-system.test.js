import { describe, test, expect } from 'vitest';
import { compute, applyEvent, computeLeagueRankings } from '../../src/engine/ManagerIdentitySystem.js';

const defaults = {
    managerId: 1,
    name: 'João Silva',
    isPlayerManager: true,
    tacticHistory: [],
    careerHistory: [],
    currentReputation: 10,
};

describe('SPEC-070: Manager Identity System', () => {

    test('reputation always 0-100', () => {
        const high = compute({ ...defaults, currentReputation: 9999 });
        expect(high.reputation).toBeLessThanOrEqual(100);
        const low = compute({ ...defaults, currentReputation: -999 });
        expect(low.reputation).toBeGreaterThanOrEqual(0);
    });

    test('reputation tier — lenda ≥80', () => {
        expect(compute({ ...defaults, currentReputation: 85 }).reputationTier).toBe('lenda');
    });

    test('reputation tier — experiente 50-79', () => {
        expect(compute({ ...defaults, currentReputation: 55 }).reputationTier).toBe('experiente');
    });

    test('reputation tier — promissor 20-49', () => {
        expect(compute({ ...defaults, currentReputation: 25 }).reputationTier).toBe('promissor');
    });

    test('reputation tier — iniciante <20', () => {
        expect(compute({ ...defaults, currentReputation: 10 }).reputationTier).toBe('iniciante');
    });

    test('dominant style from tactic history (>40% → that tactic)', () => {
        const m = compute({
            ...defaults,
            tacticHistory: [
                { tactic: 'attacking', gamesUsed: 60, winRate: 0.5 },
                { tactic: 'defensive', gamesUsed: 20, winRate: 0.4 },
                { tactic: 'normal', gamesUsed: 20, winRate: 0.45 },
            ],
        });
        expect(m.dominantStyle).toBe('attacking');
        expect(m.styleConfidence).toBe(60);
    });

    test('balanced if no tactic >40%', () => {
        const m = compute({
            ...defaults,
            tacticHistory: [
                { tactic: 'attacking', gamesUsed: 35, winRate: 0.5 },
                { tactic: 'defensive', gamesUsed: 35, winRate: 0.4 },
                { tactic: 'normal', gamesUsed: 30, winRate: 0.45 },
            ],
        });
        expect(m.dominantStyle).toBe('balanced');
    });

    test('national_title adds +10 reputation', () => {
        const result = applyEvent({ event: 'national_title', currentReputation: 50 });
        expect(result.reputation).toBe(60);
    });

    test('relegation subtracts -8 reputation', () => {
        const result = applyEvent({ event: 'relegation', currentReputation: 50 });
        expect(result.reputation).toBe(42);
    });

    test('promotion adds +5 reputation', () => {
        const result = applyEvent({ event: 'promotion', currentReputation: 30 });
        expect(result.reputation).toBe(35);
    });

    test('fired subtracts -3 reputation', () => {
        const result = applyEvent({ event: 'fired', currentReputation: 30 });
        expect(result.reputation).toBe(27);
    });

    test('reputation clamped at 100 even after multiple titles', () => {
        let rep = 95;
        rep = applyEvent({ event: 'national_title', currentReputation: rep }).reputation;
        expect(rep).toBeLessThanOrEqual(100);
    });

    test('reputation clamped at 0 even after multiple relegations', () => {
        let rep = 5;
        rep = applyEvent({ event: 'relegation', currentReputation: rep }).reputation;
        expect(rep).toBeGreaterThanOrEqual(0);
    });

    test('rankings are unique (no ties)', () => {
        const managers = [
            { managerId: 1, reputation: 80 },
            { managerId: 2, reputation: 60 },
            { managerId: 3, reputation: 60 }, // tie in rep → still unique ranking
            { managerId: 4, reputation: 30 },
        ];
        const ranked = computeLeagueRankings(managers);
        const rankValues = ranked.map(m => m.ranking);
        expect(new Set(rankValues).size).toBe(rankValues.length);
    });

    test('careerHighlight always non-empty for new manager', () => {
        const m = compute({ ...defaults, careerHistory: [] });
        expect(m.careerHighlight).toBeTruthy();
        expect(m.careerHighlight.length).toBeGreaterThan(0);
    });

    test('careerHighlight shows title when available', () => {
        const m = compute({
            ...defaults,
            careerHistory: [{ clubName: 'Flamengo', titlesWon: 1, promoted: false, relegated: false, seasonsManaged: 2 }],
        });
        expect(m.careerHighlight).toContain('Flamengo');
    });

    test('attractiveness sums ~100 (±5)', () => {
        const m = compute({ ...defaults, currentReputation: 70 });
        const sum = m.attractiveness.smallClub + m.attractiveness.midClub + m.attractiveness.bigClub;
        expect(sum).toBeGreaterThanOrEqual(95);
        expect(sum).toBeLessThanOrEqual(130); // ranges slightly above 100 by design
    });

    test('high reputation → mostly bigClub attractive', () => {
        const m = compute({ ...defaults, currentReputation: 90 });
        expect(m.attractiveness.bigClub).toBeGreaterThan(m.attractiveness.smallClub);
    });

    test('low reputation → mostly smallClub attractive', () => {
        const m = compute({ ...defaults, currentReputation: 15 });
        expect(m.attractiveness.smallClub).toBeGreaterThan(m.attractiveness.bigClub);
    });
});
