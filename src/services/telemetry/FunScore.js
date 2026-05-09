/**
 * SPEC-102: Fun Score
 *
 * Composite per-match: goal variance + comebacks + boring streaks.
 */

import { buildResult, safeDetect, variance, clamp } from './_utils.js';

const SPEC = 'SPEC-102';
const NAME = 'Fun Score';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const matches = (history.matchOutcomes || []).slice(-30);

    if (matches.length === 0) {
        return buildResult(SPEC, NAME, 50, [], {
            averagePerMatch: 50,
            matchCount: 0
        });
    }

    const signals = [];
    let funSum = 0;

    matches.forEach(m => {
        const total = (m.myGoals || 0) + (m.oppGoals || 0);
        const diff = Math.abs((m.myGoals || 0) - (m.oppGoals || 0));
        let f = 30; // base
        if (total >= 4) f += 20;             // many goals = fun
        if (diff <= 1) f += 15;              // close match = fun
        if (m.hadComeback) f += 25;          // comeback = peak fun
        if (m.isImportant) f += 10;
        if (total === 0) f -= 20;             // 0-0 boring
        if (diff >= 4) f -= 10;               // blowout meh
        funSum += clamp(f);
    });

    const avgFun = funSum / matches.length;

    // Check goal variance
    const goalDiffs = matches.map(m => (m.myGoals || 0) + (m.oppGoals || 0));
    const goalVar = variance(goalDiffs);
    if (goalVar < 1) {
        signals.push({
            id: 'BORING_STREAK',
            severity: 0.7,
            msg: `Variância gols baixa (${goalVar.toFixed(1)}) em ${matches.length} matches`
        });
    } else if (goalVar > 5) {
        signals.push({
            id: 'GOAL_VARIANCE_HIGH',
            severity: 0.3,
            msg: `Boa variação de gols (var=${goalVar.toFixed(1)})`
        });
    }

    // Comeback frequency
    const comebackCount = matches.filter(m => m.hadComeback).length;
    if (comebackCount >= 3) {
        signals.push({
            id: 'COMEBACK_FREQUENCY',
            severity: 0.4,
            msg: `${comebackCount} viradas em ${matches.length} matches`
        });
    }

    return buildResult(SPEC, NAME, avgFun, signals, {
        averagePerMatch: Math.round(avgFun),
        matchCount: matches.length
    });
});

export default { detect, SPEC, NAME };
