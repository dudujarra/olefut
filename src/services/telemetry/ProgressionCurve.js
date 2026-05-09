/**
 * SPEC-110: Progression Curve
 *
 * XP/atributos jogadores ao longo seasons.
 */

import { buildResult, safeDetect, clamp } from './_utils.js';

const SPEC = 'SPEC-110';
const NAME = 'Progression Curve';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const seasonOvr = history.squadOvrBySeason || {};
    const growthEvents = history.growthEvents || [];

    const seasons = Object.keys(seasonOvr).map(Number).sort((a, b) => a - b);

    if (seasons.length < 2) {
        return buildResult(SPEC, NAME, 50, [], {
            curveSlope: 0,
            growthEventCount: growthEvents.length
        });
    }

    const ovrSeries = seasons.map(s => seasonOvr[s]?.avgOvr || 0);
    const first = ovrSeries[0] || 1;
    const last = ovrSeries[ovrSeries.length - 1] || 1;
    const curveSlope = (last - first) / Math.max(1, seasons.length - 1);

    const signals = [];

    if (Math.abs(curveSlope) < 0.1 && growthEvents.length === 0) {
        signals.push({
            id: 'FLAT_CURVE',
            severity: 0.7,
            msg: `Squad OVR sem mudança (slope=${curveSlope.toFixed(2)})`
        });
    }

    if (curveSlope > 3) {
        signals.push({
            id: 'EXPONENTIAL',
            severity: Math.min(1, curveSlope / 5),
            msg: `Squad OVR cresce ${curveSlope.toFixed(1)} pts/season`
        });
    }

    if (curveSlope < -1) {
        signals.push({
            id: 'DECLINE',
            severity: 0.5,
            msg: `Squad OVR caindo ${(-curveSlope).toFixed(1)} pts/season`
        });
    }

    let score = 70;
    if (Math.abs(curveSlope) < 0.1) score = 30;
    else if (curveSlope > 0 && curveSlope < 2) score = 90;

    return buildResult(SPEC, NAME, clamp(score), signals, {
        curveSlope: parseFloat(curveSlope.toFixed(2)),
        growthEventCount: growthEvents.length
    });
});

export default { detect, SPEC, NAME };
