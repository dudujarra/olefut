/**
 * SPEC-100: Monotony Detector
 *
 * Detects 8 simultaneous boredom signals during AutoPlay soak test.
 */

import { buildResult, safeDetect, avg, stdDev } from './_utils.js';

const SPEC = 'SPEC-100';
const NAME = 'Monotony Detector';

export const detect = safeDetect(SPEC, NAME, (state) => {
    const history = state.history || {};
    const signals = [];

    // 1. NARRATION_REPEAT — narrator pool reuse rate
    const narrations = history.matchNarrations || [];
    if (narrations.length >= 10) {
        const unique = new Set(narrations).size;
        const reuseRate = 1 - unique / narrations.length;
        if (reuseRate > 0.5) {
            signals.push({
                id: 'NARRATION_REPEAT',
                severity: Math.min(1, reuseRate),
                msg: `${(reuseRate * 100).toFixed(0)}% narrações repetidas (${unique}/${narrations.length})`
            });
        }
    }

    // 2. TACTIC_STUCK — same tactic > 20 weeks
    const tactics = history.tactics || [];
    if (tactics.length >= 20) {
        const last20 = tactics.slice(-20);
        const sameAsFirst = last20.every(t => t === last20[0]);
        if (sameAsFirst) {
            signals.push({
                id: 'TACTIC_STUCK',
                severity: 0.7,
                msg: `Mesma tática "${last20[0]}" há ${last20.length} semanas`
            });
        }
    }

    // 3. STAT_VARIANCE_LOW — balance variance very low
    const balances = history.balance || [];
    if (balances.length >= 10) {
        const sd = stdDev(balances);
        const mean = avg(balances);
        const cv = mean > 0 ? sd / mean : 0;
        if (cv < 0.05 && mean > 0) {
            signals.push({
                id: 'STAT_VARIANCE_LOW',
                severity: Math.min(1, 1 - cv * 20),
                msg: `Balance praticamente estático (CV ${(cv * 100).toFixed(1)}%)`
            });
        }
    }

    // 4. MARKET_DEAD — zero offers in N weeks
    const offers = history.offerCounts || [];
    if (offers.length >= 10) {
        const recent = offers.slice(-10);
        const total = recent.reduce((s, n) => s + n, 0);
        if (total === 0) {
            signals.push({
                id: 'MARKET_DEAD',
                severity: 1,
                msg: 'Zero ofertas nas últimas 10 semanas'
            });
        }
    }

    // 5. STANDING_FREEZE — same standing position N weeks
    const standings = history.standingsByWeek || [];
    if (standings.length >= 10) {
        const last10 = standings.slice(-10);
        const allSame = last10.every(p => p === last10[0]);
        if (allSame && last10[0]) {
            signals.push({
                id: 'STANDING_FREEZE',
                severity: 0.6,
                msg: `Posição ${last10[0]}º há 10 semanas`
            });
        }
    }

    // 6. EVENT_DROUGHT — no weekEvents
    const eventsByWeek = history.weekEvents || [];
    if (eventsByWeek.length >= 5) {
        const recent5 = eventsByWeek.slice(-5);
        const totalEvents = recent5.reduce((s, evs) => s + (evs?.length || 0), 0);
        if (totalEvents === 0) {
            signals.push({
                id: 'EVENT_DROUGHT',
                severity: 0.8,
                msg: 'Zero eventos nas últimas 5 semanas'
            });
        }
    }

    // 7. DECISION_DOMINANCE — 1 action type > 80% das decisions
    const decisions = history.decisions || [];
    if (decisions.length >= 20) {
        const counts = {};
        decisions.forEach(d => {
            counts[d.action] = (counts[d.action] || 0) + 1;
        });
        const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        if (dominant && dominant[1] / decisions.length > 0.8) {
            signals.push({
                id: 'DECISION_DOMINANCE',
                severity: 0.5,
                msg: `${dominant[0]} = ${((dominant[1] / decisions.length) * 100).toFixed(0)}% das decisões`
            });
        }
    }

    // 8. FINANCIAL_FREEZE — net flow ~zero each week
    const finances = history.weeklyFinances || [];
    if (finances.length >= 10) {
        const net = finances.slice(-10).map(f => (f?.income || 0) - (f?.expenses || 0));
        const meanAbs = avg(net.map(Math.abs));
        if (meanAbs < 1000) {
            signals.push({
                id: 'FINANCIAL_FREEZE',
                severity: 0.5,
                msg: `Net financial ~R$ ${meanAbs.toFixed(0)}/sem`
            });
        }
    }

    // Score: high if signals are strong
    const totalSeverity = signals.reduce((s, sig) => s + sig.severity, 0);
    const score = Math.min(100, totalSeverity * 14);

    return buildResult(SPEC, NAME, score, signals);
});

export default { detect, SPEC, NAME };
