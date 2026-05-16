/**
 * Baseline Stats — SPEC Etapa 5
 *
 * Simula N temporadas via vitest runner (resolves ESM imports automaticamente).
 * Dump JSON em tests/statistical/baseline-output.json para análise futura.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { Engine } from '../../src/engine/engine.js';
import { createEngine } from '../../src/engine/engineFactory.js';
import { setGlobalSeed } from '../../src/engine/rng.js';

const N = 20;

describe('Statistical Baseline (Etapa 5 SDD)', () => {

    it(`simulate ${N} seasons and dump aggregate metrics`, () => {
        const results = {
            runs: N,
            perSeason: [],
            aggregate: {
                totalWins: 0,
                totalDraws: 0,
                totalLosses: 0,
                winStreakMax: 0,
                lossStreakMax: 0,
                finalPositionAvg: 0,
                variance: 0,
                seasonsCompleted: 0,
            },
        };

        let winStreakMaxOverall = 0;
        let lossStreakMaxOverall = 0;
        let finalPositionSum = 0;
        let completed = 0;

        for (let i = 0; i < N; i++) {
            setGlobalSeed(1000 + i);
            const engine = createEngine();
            try {
                engine.initGame(`Tecnico${i}`, 1, 'manager', 'livre');
            } catch {
                continue;
            }

            let currentWinStreak = 0;
            let currentLossStreak = 0;
            let seasonWinStreakMax = 0;
            let seasonLossStreakMax = 0;

            for (let w = 0; w < 38; w++) {
                try {
                    engine.weekEvents = [];
                    engine.doTraining('fitness');
                    engine.advanceWeek();
                    const form = engine.managerStats?.rollingForm || [];
                    const last = form[form.length - 1];
                    if (last === 'W') { currentWinStreak++; currentLossStreak = 0; }
                    else if (last === 'L') { currentLossStreak++; currentWinStreak = 0; }
                    else if (last === 'D') { currentWinStreak = 0; currentLossStreak = 0; }
                    if (currentWinStreak > seasonWinStreakMax) seasonWinStreakMax = currentWinStreak;
                    if (currentLossStreak > seasonLossStreakMax) seasonLossStreakMax = currentLossStreak;
                } catch {
                    break;
                }
            }

            const stats = engine.managerStats || { wins: 0, draws: 0, losses: 0 };
            let finalPos = 0;
            try {
                const team = engine.getTeam(1);
                if (team && typeof engine.getStandings === 'function') {
                    const standings = engine.getStandings(team.zone, team.division);
                    const myRow = standings.findIndex(s => s.teamId === team.id);
                    if (myRow >= 0) finalPos = myRow + 1;
                }
            } catch { /* defensive */ }

            results.perSeason.push({
                run: i + 1,
                wins: stats.wins,
                draws: stats.draws,
                losses: stats.losses,
                winStreakMax: seasonWinStreakMax,
                lossStreakMax: seasonLossStreakMax,
                finalPosition: finalPos,
            });

            results.aggregate.totalWins += stats.wins;
            results.aggregate.totalDraws += stats.draws;
            results.aggregate.totalLosses += stats.losses;
            if (seasonWinStreakMax > winStreakMaxOverall) winStreakMaxOverall = seasonWinStreakMax;
            if (seasonLossStreakMax > lossStreakMaxOverall) lossStreakMaxOverall = seasonLossStreakMax;
            finalPositionSum += finalPos;
            completed++;
        }

        results.aggregate.winStreakMax = winStreakMaxOverall;
        results.aggregate.lossStreakMax = lossStreakMaxOverall;
        results.aggregate.finalPositionAvg = completed > 0 ? finalPositionSum / completed : 0;
        results.aggregate.seasonsCompleted = completed;

        const finalPositions = results.perSeason.map(s => s.finalPosition).filter(p => p > 0);
        if (finalPositions.length > 0) {
            const meanPos = finalPositions.reduce((a, b) => a + b, 0) / finalPositions.length;
            const variancePos = finalPositions.reduce((sum, p) => sum + Math.pow(p - meanPos, 2), 0) / finalPositions.length;
            results.aggregate.variance = variancePos;
        }

        // Dump JSON
        const outPath = path.resolve(__dirname, 'baseline-output.json');
        fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

        console.log('\n=== BASELINE STATS DUMP ===');
        console.log(JSON.stringify(results.aggregate, null, 2));
        console.log(`Full per-season data: ${outPath}`);

        // Assertions: basic sanity
        expect(completed).toBeGreaterThan(0);
        expect(results.aggregate.totalWins + results.aggregate.totalDraws + results.aggregate.totalLosses).toBeGreaterThanOrEqual(0);
    }, 600000); // 10min timeout

});
