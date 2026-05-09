/**
 * SPEC-106: Emotional Arc
 *
 * Peaks (vitórias clutch) + valleys (derrotas humilhantes) per season.
 */

import { buildResult, safeDetect, clamp } from './_utils.js';

const SPEC = 'SPEC-106';
const NAME = 'Emotional Arc';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const matches = history.matchOutcomes || [];

    if (matches.length === 0) {
        return buildResult(SPEC, NAME, 0, [{
            id: 'FLAT_ARC', severity: 1, msg: 'Sem matches no histórico'
        }], { peaks: [], valleys: [], amplitude: 0 });
    }

    const peaks = [];
    const valleys = [];

    matches.forEach(m => {
        const my = m.myGoals || 0;
        const opp = m.oppGoals || 0;
        const diff = my - opp;

        // Peak: comeback OR goleada win OR clutch (close win)
        if (m.hadComeback) {
            peaks.push({ week: m.week, score: 90, type: 'COMEBACK', label: `Virada ${my}-${opp}` });
        } else if (diff >= 4) {
            peaks.push({ week: m.week, score: 70, type: 'GOLEADA', label: `Goleada ${my}-${opp}` });
        } else if (m.isImportant && diff > 0) {
            peaks.push({ week: m.week, score: 80, type: 'CLUTCH', label: `Clutch win ${my}-${opp}` });
        }

        // Valley
        if (diff <= -4) {
            valleys.push({ week: m.week, score: 70, type: 'HUMILIATION', label: `Vexame ${my}-${opp}` });
        } else if (m.isImportant && diff < 0) {
            valleys.push({ week: m.week, score: 60, type: 'CRITICAL_LOSS', label: `Derrota crítica ${my}-${opp}` });
        }
    });

    const signals = [];

    if (peaks.length === 0 && valleys.length === 0 && matches.length >= 10) {
        signals.push({
            id: 'FLAT_ARC',
            severity: 0.8,
            msg: `${matches.length} matches sem peaks/valleys`
        });
    }

    if (peaks.length > 0) {
        const topPeak = peaks.sort((a, b) => b.score - a.score)[0];
        signals.push({
            id: 'CLUTCH_PEAK',
            severity: 0.4,
            msg: `${topPeak.label} (sem ${topPeak.week})`
        });
    }

    if (valleys.length > 0) {
        const topValley = valleys.sort((a, b) => b.score - a.score)[0];
        signals.push({
            id: 'HUMILIATION_VALLEY',
            severity: 0.5,
            msg: `${topValley.label} (sem ${topValley.week})`
        });
    }

    const amplitude = peaks.length + valleys.length;
    const score = clamp(amplitude * 5);

    return buildResult(SPEC, NAME, score, signals, {
        peaks: peaks.slice(0, 5),
        valleys: valleys.slice(0, 5),
        amplitude
    });
});

export default { detect, SPEC, NAME };
