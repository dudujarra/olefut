/**
 * SPEC-111: Market Liquidity
 *
 * Tempo médio até oferta + spread bid/ask + % aceitação.
 */

import { buildResult, safeDetect, avg, clamp } from './_utils.js';

const SPEC = 'SPEC-111';
const NAME = 'Market Liquidity';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const offers = history.offers || [];

    if (offers.length === 0) {
        return buildResult(SPEC, NAME, 0, [{
            id: 'NO_OFFERS',
            severity: 1,
            msg: 'Sem ofertas no histórico'
        }], {
            acceptanceRate: 0,
            avgSpread: 0,
            offerCount: 0
        });
    }

    const accepted = offers.filter(o => o.accepted).length;
    const acceptanceRate = accepted / offers.length;
    const spreads = offers.map(o => {
        const value = Number(o.playerValue) || 1;
        return (Number(o.amount) || 0) / value - 1;
    }).filter(v => isFinite(v));
    const avgSpread = avg(spreads);

    const signals = [];

    if (avgSpread < -0.5) {
        signals.push({
            id: 'LOWBALL',
            severity: Math.min(1, -avgSpread),
            msg: `Ofertas média ${((1 + avgSpread) * 100).toFixed(0)}% do valor`
        });
    } else if (avgSpread > 1) {
        signals.push({
            id: 'OVERPAY',
            severity: 0.3,
            msg: `Ofertas média ${((1 + avgSpread) * 100).toFixed(0)}% do valor`
        });
    }

    let score = 50;
    if (acceptanceRate > 0.1 && Math.abs(avgSpread) < 0.5) score = 80;
    if (offers.length >= 10 && acceptanceRate >= 0.2) score = 90;

    return buildResult(SPEC, NAME, clamp(score), signals, {
        acceptanceRate: parseFloat(acceptanceRate.toFixed(2)),
        avgSpread: parseFloat(avgSpread.toFixed(2)),
        offerCount: offers.length
    });
});

export default { detect, SPEC, NAME };
