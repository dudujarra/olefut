/**
 * SPEC-112: Session Length
 *
 * Ticks/dia projetando duração real. Alvo: PC 30-90min/season, mobile 5-10min.
 */

import { buildResult, safeDetect, clamp } from './_utils.js';

const SPEC = 'SPEC-112';
const NAME = 'Session Length';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const weeksPlayed = Number(history.weeksPlayed) || 0;
    const elapsedMs = Number(history.elapsedMs) || 0;

    if (weeksPlayed === 0 || elapsedMs === 0) {
        return buildResult(SPEC, NAME, 50, [], {
            weeksPerSec: 0,
            projectedSeasonMinutes: 0
        });
    }

    const weeksPerSec = weeksPlayed / (elapsedMs / 1000);
    const projectedSeasonSec = weeksPerSec > 0 ? 38 / weeksPerSec : 0;
    const projectedSeasonMinutes = projectedSeasonSec / 60;

    const signals = [];

    if (projectedSeasonMinutes < 5) {
        signals.push({
            id: 'TOO_FAST',
            severity: 0.3,
            msg: `Season em ${projectedSeasonMinutes.toFixed(1)}min (modo soak)`
        });
    } else if (projectedSeasonMinutes > 90) {
        signals.push({
            id: 'TOO_SLOW',
            severity: Math.min(1, (projectedSeasonMinutes - 90) / 60),
            msg: `Season projetada em ${projectedSeasonMinutes.toFixed(0)}min`
        });
    } else if (projectedSeasonMinutes >= 30 && projectedSeasonMinutes <= 90) {
        signals.push({
            id: 'SWEET_SPOT',
            severity: 0.1,
            msg: `Season em ${projectedSeasonMinutes.toFixed(0)}min — sweet spot PC`
        });
    }

    let score = 50;
    if (projectedSeasonMinutes >= 30 && projectedSeasonMinutes <= 90) score = 95;
    else if (projectedSeasonMinutes >= 5 && projectedSeasonMinutes < 30) score = 80;
    else if (projectedSeasonMinutes < 5) score = 70; // soak mode OK
    else score = 30;

    return buildResult(SPEC, NAME, clamp(score), signals, {
        weeksPerSec: parseFloat(weeksPerSec.toFixed(2)),
        projectedSeasonMinutes: parseFloat(projectedSeasonMinutes.toFixed(1))
    });
});

export default { detect, SPEC, NAME };
