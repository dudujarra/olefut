/**
 * Unit tests for WeekMatchResult
 * AKITA-411: Top 10 unit test coverage
 */
import { describe, it, expect } from 'vitest';
import { processMatchResult, populateMatchNarrative } from '../../src/services/WeekMatchResult.js';

function makeEngine() {
    return {
        weekEvents: [],
        managerStats: {
            streak: 0, lossStreak: 0, rollingForm: [],
            cleanSheets: 0, wins: 0, losses: 0, draws: 0,
            goalsFor: 0, goalsAgainst: 0,
        },
        boardTension: 0,
        rivalryHistory: {},
        matchHistory: [],
        lastMatchNarrative: null,
        currentWeek: 10,
        seasonNumber: 0,
        llmNarrative: {
            postMatchAnalysisSync: () => null,
            postMatchAnalysis: () => Promise.resolve(null),
        },
        manager: { teamId: 1 },
        pendingMatchBonus: null,
        getTeam(id) { return this.teams.find(t => t.id === id); },
        teams: [
            {
                id: 1, name: 'Player FC', zone: 'SE', division: 1,
                squad: Array.from({ length: 11 }, (_, i) => ({
                    id: i + 1, name: `P${i}`, position: 'MEI', ovr: 65,
                    isTitular: true, moral: 50, energy: 80,
                    form: { value: 50, trend: 0, last5: [] },
                })),
            },
            {
                id: 2, name: 'Rival FC', zone: 'SE', division: 1,
                squad: Array.from({ length: 11 }, (_, i) => ({
                    id: 100 + i, name: `R${i}`, position: 'MEI', ovr: 60,
                    isTitular: true, moral: 50, energy: 80,
                })),
            },
        ],
    };
}

// weekResults format: { [tournamentId]: [{ home, away, score: { homeGoals, awayGoals } }] }
function makeWeekResults(homeGoals, awayGoals) {
    return {
        league: [{ home: 1, away: 2, score: { homeGoals, awayGoals } }],
    };
}

describe('WeekMatchResult', () => {
    describe('processMatchResult()', () => {
        it('processes a win: streak and form', () => {
            const engine = makeEngine();
            const team = engine.getTeam(1);
            processMatchResult(engine, team, makeWeekResults(2, 0));
            expect(engine.managerStats.streak).toBeGreaterThan(0);
            expect(engine.managerStats.rollingForm).toContain('W');
            expect(engine.managerStats.wins).toBe(1);
        });

        it('processes a loss: negative streak and form', () => {
            const engine = makeEngine();
            const team = engine.getTeam(1);
            processMatchResult(engine, team, makeWeekResults(0, 3));
            expect(engine.managerStats.streak).toBeLessThan(0);
            expect(engine.managerStats.rollingForm).toContain('L');
            expect(engine.managerStats.losses).toBe(1);
        });

        it('processes a draw', () => {
            const engine = makeEngine();
            const team = engine.getTeam(1);
            processMatchResult(engine, team, makeWeekResults(1, 1));
            expect(engine.managerStats.rollingForm).toContain('D');
        });

        it('handles no match for the team gracefully', () => {
            const engine = makeEngine();
            const team = engine.getTeam(1);
            const noMatch = { league: [{ home: 3, away: 4, score: { homeGoals: 1, awayGoals: 0 } }] };
            // Should not throw
            processMatchResult(engine, team, noMatch);
            expect(engine.managerStats.rollingForm.length).toBe(0);
        });

        it('tracks goals for/against', () => {
            const engine = makeEngine();
            const team = engine.getTeam(1);
            processMatchResult(engine, team, makeWeekResults(3, 1));
            expect(engine.managerStats.goalsFor).toBe(3);
            expect(engine.managerStats.goalsAgainst).toBe(1);
        });

        it('caps rolling form to last 10', () => {
            const engine = makeEngine();
            engine.managerStats.rollingForm = Array(10).fill('W');
            const team = engine.getTeam(1);
            processMatchResult(engine, team, makeWeekResults(0, 1));
            expect(engine.managerStats.rollingForm.length).toBeLessThanOrEqual(10);
        });

        it('boosts squad moral on win', () => {
            const engine = makeEngine();
            const team = engine.getTeam(1);
            const initialMoral = team.squad[0].moral;
            processMatchResult(engine, team, makeWeekResults(2, 0));
            expect(team.squad[0].moral).toBeGreaterThan(initialMoral);
        });
    });

    describe('populateMatchNarrative()', () => {
        it('sets narrative text on engine', () => {
            const engine = makeEngine();
            engine.llmNarrative.postMatchAnalysisSync = () => 'Great match!';
            const team = engine.getTeam(1);
            const match = { home: 1, away: 2, score: { homeGoals: 2, awayGoals: 1 } };
            populateMatchNarrative(engine, team, match, true, 2, 1);
            expect(engine.lastMatchNarrative).toBe('Great match!');
        });

        it('does not crash when LLM returns null', () => {
            const engine = makeEngine();
            const team = engine.getTeam(1);
            const match = { home: 1, away: 2, score: { homeGoals: 0, awayGoals: 0 } };
            populateMatchNarrative(engine, team, match, true, 0, 0);
            // Should not throw
        });
    });
});
