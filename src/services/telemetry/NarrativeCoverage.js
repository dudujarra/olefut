/**
 * SPEC-105: Narrative Coverage
 *
 * % narrações únicas vs total. Detecta cards nunca disparados.
 */

import { buildResult, safeDetect, clamp } from './_utils.js';

const SPEC = 'SPEC-105';
const NAME = 'Narrative Coverage';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const narrations = history.matchNarrations || [];
    const events = history.eventStrings || [];

    const allTexts = [...narrations, ...events].filter(Boolean);

    if (allTexts.length === 0) {
        return buildResult(SPEC, NAME, 50, [], {
            uniqueCount: 0,
            totalCount: 0,
            topNarrators: []
        });
    }

    const counts = {};
    allTexts.forEach(t => {
        const key = String(t).slice(0, 80); // normalize
        counts[key] = (counts[key] || 0) + 1;
    });

    const uniqueCount = Object.keys(counts).length;
    const totalCount = allTexts.length;
    const coverage = uniqueCount / totalCount;

    const topNarrators = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const signals = [];

    if (coverage < 0.3 && totalCount >= 20) {
        signals.push({
            id: 'LOW_COVERAGE',
            severity: 1 - coverage,
            msg: `Apenas ${(coverage * 100).toFixed(0)}% únicos (${uniqueCount}/${totalCount})`
        });
    }

    const topRepeated = topNarrators[0];
    if (topRepeated && topRepeated[1] >= 5) {
        signals.push({
            id: 'REPEATED_NARRATOR',
            severity: Math.min(1, topRepeated[1] / 20),
            msg: `"${topRepeated[0].slice(0, 40)}..." usado ${topRepeated[1]}×`
        });
    }

    const score = clamp(coverage * 100);

    return buildResult(SPEC, NAME, score, signals, {
        uniqueCount,
        totalCount,
        topNarrators
    });
});

export default { detect, SPEC, NAME };
