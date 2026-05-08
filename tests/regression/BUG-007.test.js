// Regression test for BUG-007
// Statistics topScorer atribuía sempre homeTeam (scorers.includes sempre true)
// Issue: https://github.com/dudujarra/elifoot-web/issues/2
import { describe, test, expect, beforeEach } from 'vitest';
import { StatisticsSystem } from '../../src/engine/systems/StatisticsSystem.js';

describe('BUG-007 regression: topScorer correctly attributed to scoring team', () => {
    let stats;
    beforeEach(() => {
        stats = new StatisticsSystem();
    });

    test('Away scorer atribuído a away team (não home)', () => {
        // Match: home 0-2 away. Player 999 (away) marca 2 gols.
        stats.recordMatch({
            matchId: 1, season: 2026,
            homeTeamId: 1, awayTeamId: 2,
            homeGoals: 0, awayGoals: 2,
            homeScorers: [],
            awayScorers: [999, 999],
        });

        const homeStats = stats.getTeamStats(1, 2026);
        const awayStats = stats.getTeamStats(2, 2026);

        // Away team é dono do top scorer 999, não home
        expect(awayStats.topScorer.playerId).toBe(999);
        expect(awayStats.topScorer.goals).toBe(2);
        expect(homeStats.topScorer.playerId).toBeNull();
    });

    test('Mixed match: cada time tem seu top scorer', () => {
        stats.recordMatch({
            matchId: 1, season: 2026,
            homeTeamId: 1, awayTeamId: 2,
            homeGoals: 1, awayGoals: 3,
            homeScorers: [101],
            awayScorers: [999, 999, 999],
        });

        const home = stats.getTeamStats(1, 2026);
        const away = stats.getTeamStats(2, 2026);

        expect(home.topScorer.playerId).toBe(101);
        expect(home.topScorer.goals).toBe(1);
        expect(away.topScorer.playerId).toBe(999);
        expect(away.topScorer.goals).toBe(3);
    });

    test('Backward compat: scorers default = home', () => {
        stats.recordMatch({
            matchId: 1, season: 2026,
            homeTeamId: 1, awayTeamId: 2,
            homeGoals: 2, awayGoals: 0,
            scorers: [101, 101],
        });

        const home = stats.getTeamStats(1, 2026);
        expect(home.topScorer.playerId).toBe(101);
    });
});
