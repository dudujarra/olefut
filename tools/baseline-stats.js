/**
 * Baseline Stats Runner — SPEC Etapa 5 SDD
 *
 * Simula N temporadas e dump métricas pra validar hipóteses de balance.
 * Roda direto via node tools/baseline-stats.js [N]
 */

import { Engine } from '../src/engine/engine.js';
import { setGlobalSeed } from '../src/engine/rng.js';

const N = parseInt(process.argv[2] || '20', 10);

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
        seasonsCompleted: N,
    },
};

let winStreakMaxOverall = 0;
let lossStreakMaxOverall = 0;
let finalPositionSum = 0;

console.log(`=== Baseline Stats Runner: ${N} seasons ===\n`);

for (let i = 0; i < N; i++) {
    setGlobalSeed(1000 + i); // deterministic per-run
    const engine = new Engine();
    engine.initGame(`Tecnico${i}`, 1, 'manager', 'livre');

    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let seasonWinStreakMax = 0;
    let seasonLossStreakMax = 0;

    // Run 1 full season (38 weeks)
    for (let w = 0; w < 38; w++) {
        try {
            engine.weekEvents = [];
            engine.doTraining('fitness');
            engine.advanceWeek();
            // Detectar resultado da semana via managerStats delta
            const wins = engine.managerStats?.wins || 0;
            const draws = engine.managerStats?.draws || 0;
            const losses = engine.managerStats?.losses || 0;
            const total = wins + draws + losses;
            // streak tracking via rollingForm length grows
            const form = engine.managerStats?.rollingForm || [];
            const last = form[form.length - 1];
            if (last === 'W') { currentWinStreak++; currentLossStreak = 0; }
            else if (last === 'L') { currentLossStreak++; currentWinStreak = 0; }
            else if (last === 'D') { currentWinStreak = 0; currentLossStreak = 0; }
            if (currentWinStreak > seasonWinStreakMax) seasonWinStreakMax = currentWinStreak;
            if (currentLossStreak > seasonLossStreakMax) seasonLossStreakMax = currentLossStreak;
        } catch (e) {
            // tournaments may not be initialized; skip
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

    const seasonData = {
        run: i + 1,
        wins: stats.wins,
        draws: stats.draws,
        losses: stats.losses,
        winStreakMax: seasonWinStreakMax,
        lossStreakMax: seasonLossStreakMax,
        finalPosition: finalPos,
    };
    results.perSeason.push(seasonData);

    results.aggregate.totalWins += stats.wins;
    results.aggregate.totalDraws += stats.draws;
    results.aggregate.totalLosses += stats.losses;
    if (seasonWinStreakMax > winStreakMaxOverall) winStreakMaxOverall = seasonWinStreakMax;
    if (seasonLossStreakMax > lossStreakMaxOverall) lossStreakMaxOverall = seasonLossStreakMax;
    finalPositionSum += finalPos;

    if ((i + 1) % 10 === 0) {
        console.log(`  Run ${i + 1}/${N}: W${stats.wins} D${stats.draws} L${stats.losses} pos${finalPos} maxStreakW=${seasonWinStreakMax} L=${seasonLossStreakMax}`);
    }
}

results.aggregate.winStreakMax = winStreakMaxOverall;
results.aggregate.lossStreakMax = lossStreakMaxOverall;
results.aggregate.finalPositionAvg = N > 0 ? (finalPositionSum / N) : 0;

const avgWins = results.aggregate.totalWins / N;
const avgDraws = results.aggregate.totalDraws / N;
const avgLosses = results.aggregate.totalLosses / N;

console.log('\n=== Aggregate ===');
console.log(`  Avg per season: W ${avgWins.toFixed(2)} | D ${avgDraws.toFixed(2)} | L ${avgLosses.toFixed(2)}`);
console.log(`  Max win streak overall: ${winStreakMaxOverall}`);
console.log(`  Max loss streak overall: ${lossStreakMaxOverall}`);
console.log(`  Avg final position: ${results.aggregate.finalPositionAvg.toFixed(2)}`);

// Calculate variance
const finalPositions = results.perSeason.map(s => s.finalPosition).filter(p => p > 0);
const meanPos = finalPositions.reduce((a, b) => a + b, 0) / finalPositions.length;
const variancePos = finalPositions.reduce((sum, p) => sum + Math.pow(p - meanPos, 2), 0) / finalPositions.length;
console.log(`  Final position variance: ${variancePos.toFixed(2)}`);

results.aggregate.variance = variancePos;

console.log('\nDump:');
console.log(JSON.stringify(results.aggregate, null, 2));
