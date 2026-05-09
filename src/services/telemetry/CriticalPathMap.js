/**
 * SPEC-104: Critical Path Map
 *
 * Heatmap de views/clicks. Detecta dead views e hotspots.
 */

import { buildResult, safeDetect, clamp } from './_utils.js';

const SPEC = 'SPEC-104';
const NAME = 'Critical Path Map';

const KNOWN_VIEWS = [
    'start', 'dashboard', 'autoplay', 'squad', 'market', 'standings',
    'matchView', 'pressView', 'rivalries', 'achievements', 'monitor',
    'tutorial', 'saveSlots', 'styleguide', 'cosmeticShop', 'chronicle'
];

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const heatmap = history.viewVisits || {};
    const totalViews = KNOWN_VIEWS.length;
    const visitedViews = KNOWN_VIEWS.filter(v => (heatmap[v] || 0) > 0).length;

    const signals = [];

    if (visitedViews === 0) {
        signals.push({
            id: 'COVERAGE_LOW',
            severity: 1,
            msg: 'Nenhuma view visitada'
        });
    } else if (visitedViews / totalViews < 0.3) {
        signals.push({
            id: 'COVERAGE_LOW',
            severity: 0.6,
            msg: `Apenas ${visitedViews}/${totalViews} views acessadas`
        });
    }

    // Dead views
    const dead = KNOWN_VIEWS.filter(v => !heatmap[v]);
    if (dead.length >= 3 && dead.length < totalViews) {
        signals.push({
            id: 'DEAD_VIEW',
            severity: Math.min(1, dead.length / totalViews),
            msg: `${dead.length} views nunca visitadas (ex: ${dead.slice(0, 3).join(', ')})`
        });
    }

    // Hotspot
    const totalVisits = Object.values(heatmap).reduce((s, n) => s + (n || 0), 0);
    if (totalVisits >= 10) {
        const top = Object.entries(heatmap).sort((a, b) => b[1] - a[1])[0];
        if (top && top[1] / totalVisits > 0.7) {
            signals.push({
                id: 'HOTSPOT',
                severity: 0.5,
                msg: `${top[0]} = ${((top[1] / totalVisits) * 100).toFixed(0)}% dos visits`
            });
        }
    }

    const score = clamp((visitedViews / totalViews) * 100);

    return buildResult(SPEC, NAME, score, signals, {
        heatmap,
        totalViews,
        visitedViews
    });
});

export default { detect, SPEC, NAME };
