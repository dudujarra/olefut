/**
 * SPEC-114: Load Performance
 *
 * advanceWeek timings + detector timings. Detecta UI bottleneck.
 */

import { buildResult, safeDetect, avg, percentile, clamp } from './_utils.js';

const SPEC = 'SPEC-114';
const NAME = 'Load Performance';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const timings = history.advanceWeekTimings || [];
    const detectorTimings = history.detectorTimings || {};
    const fps = history.fps || [];

    if (timings.length === 0) {
        return buildResult(SPEC, NAME, 100, [], {
            advanceWeekP95: 0,
            advanceWeekAvg: 0,
            slowestDetector: null
        });
    }

    const p95 = percentile(timings, 95);
    const avgTick = avg(timings);

    const detectorAverages = {};
    Object.entries(detectorTimings).forEach(([name, arr]) => {
        if (arr && arr.length > 0) detectorAverages[name] = avg(arr);
    });
    const slowest = Object.entries(detectorAverages).sort((a, b) => b[1] - a[1])[0];

    const signals = [];

    if (p95 > 500) {
        signals.push({
            id: 'SLOW_TICK',
            severity: Math.min(1, p95 / 1000),
            msg: `advanceWeek p95 = ${p95.toFixed(0)}ms`
        });
    }

    if (slowest && slowest[1] > 10) {
        signals.push({
            id: 'SLOW_DETECTOR',
            severity: Math.min(1, slowest[1] / 30),
            msg: `${slowest[0]}: ${slowest[1].toFixed(1)}ms média`
        });
    }

    if (fps.length > 0) {
        const avgFps = avg(fps);
        if (avgFps < 30) {
            signals.push({
                id: 'FPS_DROP',
                severity: Math.min(1, (30 - avgFps) / 30),
                msg: `FPS médio ${avgFps.toFixed(0)}`
            });
        }
    }

    let score = 100;
    if (p95 > 100) score -= Math.min(60, p95 / 10);
    if (slowest && slowest[1] > 5) score -= 10;

    return buildResult(SPEC, NAME, clamp(score), signals, {
        advanceWeekP95: parseFloat(p95.toFixed(1)),
        advanceWeekAvg: parseFloat(avgTick.toFixed(1)),
        slowestDetector: slowest ? slowest[0] : null
    });
});

export default { detect, SPEC, NAME };
