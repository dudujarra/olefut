/**
 * SPEC-109: Economy Flow
 *
 * Inflow/outflow por categoria. Detecta money sinks.
 */

import { buildResult, safeDetect, clamp } from './_utils.js';

const SPEC = 'SPEC-109';
const NAME = 'Economy Flow';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const finances = history.weeklyFinances || [];

    if (finances.length === 0) {
        return buildResult(SPEC, NAME, 50, [], {
            byCategory: {},
            totalIn: 0,
            totalOut: 0
        });
    }

    const byCategory = {};
    let totalIn = 0;
    let totalOut = 0;

    finances.forEach(f => {
        const details = f?.details || [];
        details.forEach(d => {
            const label = d.label || 'unknown';
            if (!byCategory[label]) {
                byCategory[label] = { totalIn: 0, totalOut: 0, netFlow: 0, weeks: 0 };
            }
            const amt = Number(d.amount) || 0;
            if (d.type === 'income') {
                byCategory[label].totalIn += amt;
                totalIn += amt;
            } else if (d.type === 'expense') {
                byCategory[label].totalOut += amt;
                totalOut += amt;
            }
            byCategory[label].weeks++;
        });
    });

    Object.values(byCategory).forEach(b => {
        b.netFlow = b.totalIn - b.totalOut;
    });

    const signals = [];

    // Money sinks: pure outflow categories that are big
    const sinks = Object.entries(byCategory)
        .filter(([, b]) => b.totalIn === 0 && b.totalOut > 100000)
        .sort((a, b) => b[1].totalOut - a[1].totalOut);
    if (sinks.length > 0) {
        const [label, sink] = sinks[0];
        signals.push({
            id: 'MONEY_SINK',
            severity: Math.min(1, sink.totalOut / 1e7),
            msg: `${label}: R$ ${(sink.totalOut / 1e6).toFixed(1)}M sem inflow`
        });
    }

    // Sponsor dominant
    const sponsorEntry = Object.entries(byCategory).find(([k]) => /sponsor|patroc/i.test(k));
    if (sponsorEntry && totalOut > 0) {
        const sponsorPct = sponsorEntry[1].totalIn / Math.max(1, totalOut);
        if (sponsorPct > 0.5) {
            signals.push({
                id: 'SPONSOR_DOMINANT',
                severity: Math.min(1, sponsorPct),
                msg: `Sponsor cobre ${(sponsorPct * 100).toFixed(0)}% das despesas`
            });
        }
    }

    // Transfer engine
    const transferEntry = Object.entries(byCategory).find(([k]) => /transfer|venda/i.test(k));
    if (transferEntry && transferEntry[1].totalIn > 1e6) {
        signals.push({
            id: 'TRANSFER_ENGINE',
            severity: 0.3,
            msg: `Vendas: R$ ${(transferEntry[1].totalIn / 1e6).toFixed(1)}M total`
        });
    }

    // Score: high if ratio in/out is healthy (~1)
    const ratio = totalOut > 0 ? totalIn / totalOut : 1;
    let score = 50;
    if (ratio >= 0.9 && ratio <= 1.5) score = 90;
    else if (ratio >= 0.7) score = 70;
    else score = 30;

    return buildResult(SPEC, NAME, clamp(score), signals, {
        byCategory,
        totalIn,
        totalOut
    });
});

export default { detect, SPEC, NAME };
