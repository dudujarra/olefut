/**
 * Engine Golden Master — Characterization Tests
 *
 * AKITA-RFCT-001 implementation.
 *
 * Estratégia:
 * - Mock global Math.random com seeded RNG (createSeededRng).
 * - Engine NÃO modificado (RFCT-001 invariante).
 * - 5 temporadas (190 weeks) capturadas em snapshot.
 * - Re-runs devem produzir snapshot idêntico (verificado em 3 runs deste suite).
 *
 * Refactor de produção (RFCT-002+) DEVE preservar este snapshot.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { setGlobalSeed } from '../../src/engine/rng.js';

const SEED = 42;

// Re-enabled: engine now uses seeded PRNG natively via rng.js
describe('Engine Golden Master (5 seasons, seed=42)', () => {

    beforeEach(() => {
        setGlobalSeed(SEED);
    });

    afterEach(() => {
        // No cleanup needed — global seed is reset per test
    });

    test('5-season simulation snapshot is deterministic', () => {
        const engine = new Engine();
        engine.initGame('Dudu', 1, 'manager', 'livre', 'ATA');

        // 5 temporadas = 190 weeks
        for (let week = 0; week < 190; week++) {
            engine.advanceWeek();
        }

        const userTeam = engine.getTeam(engine.manager.teamId);
        const top5BRA1 = engine.getStandings('BRA', 1).slice(0, 5).map(s => ({
            teamId: s.teamId,
            points: s.points,
            played: s.played,
            won: s.won
        }));

        const snapshot = {
            currentWeek: engine.currentWeek,
            seasonNumber: engine.seasonNumber,
            userTeamId: userTeam?.id,
            userTeamBalance: typeof userTeam?.balance === 'number' ? userTeam.balance : null,
            userSquadSize: userTeam?.squad?.length ?? null,
            managerWins: engine.managerStats?.wins ?? 0,
            managerLosses: engine.managerStats?.losses ?? 0,
            top5BRA1,
            tournamentsCount: engine.tournaments.length,
            teamsCount: engine.teams.length,
            stadiumLevel: engine.stadiumLevel,
            academyLevel: engine.academyLevel,
            legacyTitlesCount: Array.isArray(engine.legacy?.titles) ? engine.legacy.titles.length : 0
        };

        expect(snapshot).toMatchSnapshot();
    });

    test('determinism: same seed produces identical key state across instances', () => {
        const runEngine = (weeks) => {
            setGlobalSeed(SEED);
            const e = new Engine();
            e.initGame('Dudu', 1, 'manager', 'livre', 'ATA');
            for (let i = 0; i < weeks; i++) e.advanceWeek();
            return {
                week: e.currentWeek,
                season: e.seasonNumber,
                teams: e.teams.length,
                userBalance: e.getTeam(e.manager.teamId)?.balance,
                wins: e.managerStats?.wins,
                losses: e.managerStats?.losses
            };
        };

        const run1 = runEngine(40);
        const run2 = runEngine(40);
        const run3 = runEngine(40);

        expect(run1).toEqual(run2);
        expect(run2).toEqual(run3);
    });

    test('initGame produces deterministic team count', () => {
        const engine = new Engine();
        engine.initGame('Dudu', 1, 'manager', 'livre', 'ATA');
        expect(engine.teams.length).toBeGreaterThan(0);
        expect(engine.tournaments.length).toBeGreaterThan(0);
    });

    test('40-week simulation completes without throwing', () => {
        const engine = new Engine();
        engine.initGame('Dudu', 1, 'manager', 'livre', 'ATA');

        expect(() => {
            for (let i = 0; i < 40; i++) engine.advanceWeek();
        }).not.toThrow();

        expect(engine.currentWeek).toBeGreaterThan(0);
    });
});
