/**
 * SPEC-107: Player Identity
 *
 * Top scorer / vilão / herói emerge organicamente?
 */

import { buildResult, safeDetect, gini, clamp } from './_utils.js';

const SPEC = 'SPEC-107';
const NAME = 'Player Identity';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const playerCareer = history.playerCareer || [];

    const totalGoals = playerCareer.reduce((s, p) => s + (p.goals || 0), 0);

    // BUG-082: empty squad → hard zero. Zero goals → squad too new, return low score instead.
    if (playerCareer.length === 0) {
        return buildResult(SPEC, NAME, 0, [{
            id: 'NO_TOP_SCORER',
            severity: 1,
            msg: 'Sem dados de gols'
        }], { topScorer: null, topVillain: null, giniCoefficient: 0 });
    }
    if (totalGoals === 0) {
        return buildResult(SPEC, NAME, 20, [{
            id: 'NO_TOP_SCORER',
            severity: 0.8,
            msg: 'Nenhum gol registrado (squad novo ou temporada inicial)'
        }], { topScorer: null, topVillain: null, giniCoefficient: 0 });
    }

    const sortedScorers = [...playerCareer].sort((a, b) => (b.goals || 0) - (a.goals || 0));
    const top = sortedScorers[0];
    const topScorer = top && top.goals > 0 ? {
        name: top.name,
        goals: top.goals,
        percentage: ((top.goals / totalGoals) * 100).toFixed(0)
    } : null;

    const sortedVillains = [...playerCareer].sort((a, b) => (b.redCards || 0) - (a.redCards || 0));
    const villain = sortedVillains[0];
    const topVillain = villain && villain.redCards > 0 ? {
        name: villain.name,
        redCards: villain.redCards
    } : null;

    const giniCoefficient = gini(playerCareer.map(p => p.goals || 0));

    const signals = [];

    if (topScorer && parseFloat(topScorer.percentage) >= 30) {
        signals.push({
            id: 'CRAQUE_EMERGED',
            severity: Math.min(1, parseFloat(topScorer.percentage) / 50),
            msg: `${topScorer.name}: ${topScorer.goals} gols (${topScorer.percentage}%)`
        });
    } else if (giniCoefficient < 0.3 && totalGoals >= 20) {
        signals.push({
            id: 'NO_TOP_SCORER',
            severity: 0.6,
            msg: `Gini ${giniCoefficient.toFixed(2)} — gols dispersos sem destaque`
        });
    }

    if (topVillain && topVillain.redCards >= 3) {
        signals.push({
            id: 'VILLAIN_EMERGED',
            severity: 0.4,
            msg: `${topVillain.name}: ${topVillain.redCards} expulsões`
        });
    }

    // Score: gini concentration + presence of identity
    let score = 0;
    if (topScorer) score += 40;
    if (topVillain) score += 20;
    score += giniCoefficient * 40;

    return buildResult(SPEC, NAME, clamp(score), signals, {
        topScorer,
        topVillain,
        giniCoefficient: parseFloat(giniCoefficient.toFixed(3))
    });
});

export default { detect, SPEC, NAME };
