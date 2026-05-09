/**
 * SPEC-101: Balance Audit
 *
 * Histograma W/D/L por divisão + economia. Detecta easy/grind.
 */

import { buildResult, safeDetect, clamp } from './_utils.js';

const SPEC = 'SPEC-101';
const NAME = 'Balance Audit';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const matches = history.matchOutcomes || [];
    const balances = history.balanceByWeek || [];

    const histogram = { 1: { W: 0, D: 0, L: 0, total: 0 },
                        2: { W: 0, D: 0, L: 0, total: 0 },
                        3: { W: 0, D: 0, L: 0, total: 0 },
                        4: { W: 0, D: 0, L: 0, total: 0 } };
    matches.forEach(m => {
        const div = m.division || 1;
        if (!histogram[div]) histogram[div] = { W: 0, D: 0, L: 0, total: 0 };
        histogram[div][m.result] = (histogram[div][m.result] || 0) + 1;
        histogram[div].total++;
    });

    const signals = [];

    // Easy / grind detection
    Object.entries(histogram).forEach(([div, h]) => {
        if (h.total >= 10) {
            const winRate = h.W / h.total;
            const lossRate = h.L / h.total;
            if (winRate > 0.7) {
                signals.push({
                    id: 'EASY_DIVISION',
                    severity: Math.min(1, (winRate - 0.7) * 3),
                    msg: `Série ${['A','B','C','D'][div-1]}: ${(winRate * 100).toFixed(0)}% vitórias (${h.total} jogos)`
                });
            }
            if (lossRate > 0.7) {
                signals.push({
                    id: 'GRIND_DIVISION',
                    severity: Math.min(1, (lossRate - 0.7) * 3),
                    msg: `Série ${['A','B','C','D'][div-1]}: ${(lossRate * 100).toFixed(0)}% derrotas`
                });
            }
        }
    });

    // Economy: inflation
    if (balances.length >= 38) {
        const first = balances[0] || 1;
        const last = balances[balances.length - 1] || 1;
        const ratio = last / Math.max(1, first);
        if (ratio > 5) {
            signals.push({
                id: 'ECONOMY_INFLATION',
                severity: Math.min(1, (ratio - 5) / 10),
                msg: `Balance multiplicou ×${ratio.toFixed(1)} em ${balances.length} semanas`
            });
        }
        if (ratio < 0.2 && first > 0) {
            signals.push({
                id: 'ECONOMY_DEATH',
                severity: 0.8,
                msg: `Balance caiu para ${(ratio * 100).toFixed(0)}% do inicial`
            });
        }
    }

    // Score: high = balanced
    const penalty = signals.reduce((s, sig) => s + sig.severity * 20, 0);
    const score = clamp(100 - penalty);

    return buildResult(SPEC, NAME, score, signals, { histogram });
});

export default { detect, SPEC, NAME };
