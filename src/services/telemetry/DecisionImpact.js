/**
 * SPEC-103: Decision Impact
 *
 * Mede impacto de decisões bot via baseline (não re-roda match).
 */

import { buildResult, safeDetect, avg, clamp } from './_utils.js';

const SPEC = 'SPEC-103';
const NAME = 'Decision Impact';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const decisions = history.decisions || [];
    const matches = history.matchOutcomes || [];
    const balances = history.balanceByWeek || [];

    if (decisions.length === 0) {
        return buildResult(SPEC, NAME, 50, [], { byActionType: {} });
    }

    const byActionType = {};
    decisions.forEach(d => {
        if (!byActionType[d.action]) {
            byActionType[d.action] = { count: 0, deltas: [] };
        }
        byActionType[d.action].count++;

        // Estimate delta: 3-week match result swing post-decision
        const w = d.week || 0;
        const post = matches.filter(m => m.week >= w && m.week <= w + 3);
        if (post.length > 0) {
            const wins = post.filter(m => m.result === 'W').length;
            const losses = post.filter(m => m.result === 'L').length;
            byActionType[d.action].deltas.push(wins - losses);
        }

        // Balance delta
        if (balances.length > w + 3 && w > 0) {
            const before = balances[w] || 0;
            const after = balances[Math.min(balances.length - 1, w + 3)] || 0;
            byActionType[d.action].deltas.push((after - before) / 1e6); // in millions
        }
    });

    Object.values(byActionType).forEach(b => {
        b.avgDelta = b.deltas.length > 0 ? avg(b.deltas) : 0;
        delete b.deltas;
    });

    const signals = [];

    // Cosmetic decisions: action types with avgDelta ~0
    const cosmeticTypes = Object.entries(byActionType).filter(([, b]) => Math.abs(b.avgDelta) < 0.1 && b.count >= 5);
    if (cosmeticTypes.length > 0) {
        const totalCosmetic = cosmeticTypes.reduce((s, [, b]) => s + b.count, 0);
        const ratio = totalCosmetic / decisions.length;
        if (ratio > 0.5) {
            signals.push({
                id: 'COSMETIC_DECISIONS',
                severity: Math.min(1, ratio),
                msg: `${(ratio * 100).toFixed(0)}% decisões sem impacto medível (${cosmeticTypes.map(([t]) => t).join(', ')})`
            });
        }
    }

    // High leverage
    const highLeverage = Object.entries(byActionType).find(([, b]) => Math.abs(b.avgDelta) > 5);
    if (highLeverage) {
        signals.push({
            id: 'HIGH_LEVERAGE',
            severity: 0.5,
            msg: `${highLeverage[0]} avg delta ${highLeverage[1].avgDelta.toFixed(1)}`
        });
    }

    // Score: penalize cosmetic
    const penalty = signals.find(s => s.id === 'COSMETIC_DECISIONS')?.severity * 60 || 0;
    const score = clamp(100 - penalty);

    return buildResult(SPEC, NAME, score, signals, { byActionType });
});

export default { detect, SPEC, NAME };
