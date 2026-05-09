/**
 * SPEC-108: Rivalry Emergence
 *
 * Mesmo adversário >=3× momento crítico → clássico emergente.
 */

import { buildResult, safeDetect, clamp } from './_utils.js';

const SPEC = 'SPEC-108';
const NAME = 'Rivalry Emergence';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const matches = history.matchOutcomes || [];

    if (matches.length === 0) {
        return buildResult(SPEC, NAME, 0, [], { topRivals: [] });
    }

    const byOpp = {};
    matches.forEach(m => {
        const oppKey = m.oppName || `team-${m.oppId}`;
        if (!byOpp[oppKey]) {
            byOpp[oppKey] = {
                oppName: oppKey,
                encounters: 0,
                criticalCount: 0,
                headToHead: { W: 0, D: 0, L: 0 }
            };
        }
        byOpp[oppKey].encounters++;
        if (m.isImportant) byOpp[oppKey].criticalCount++;
        const r = m.result;
        if (r === 'W' || r === 'D' || r === 'L') byOpp[oppKey].headToHead[r]++;
    });

    const ranked = Object.values(byOpp)
        .sort((a, b) => (b.criticalCount * 10 + b.encounters) - (a.criticalCount * 10 + a.encounters));

    const topRivals = ranked.slice(0, 3);

    const signals = [];

    const rival = topRivals.find(r => r.criticalCount >= 3);
    if (rival) {
        signals.push({
            id: 'RIVAL_DETECTED',
            severity: Math.min(1, rival.criticalCount / 5),
            msg: `${rival.oppName}: ${rival.criticalCount} jogos críticos`
        });
    }

    const repeat = topRivals.find(r => r.encounters >= 6);
    if (repeat) {
        signals.push({
            id: 'REPEAT_OPPONENT',
            severity: Math.min(1, repeat.encounters / 10),
            msg: `${repeat.oppName} enfrentado ${repeat.encounters}× (V${repeat.headToHead.W}/E${repeat.headToHead.D}/D${repeat.headToHead.L})`
        });
    }

    const score = clamp((rival ? 50 : 0) + topRivals.length * 10);

    return buildResult(SPEC, NAME, score, signals, { topRivals });
});

export default { detect, SPEC, NAME };
