/**
 * TelemetryAggregator — orquestra os 15 detectores SPEC-100..114.
 *
 * Mantém histórico ring-buffer para alimentar detectores.
 * Roda a cada N semanas (default 5) durante AutoPlay soak test.
 *
 * IMPORTANTE: detectores são puros. Aggregator só lê engine state.
 */

import { detect as detectMonotony } from './MonotonyDetector.js';
import { detect as detectBalance } from './BalanceAudit.js';
import { detect as detectFun } from './FunScore.js';
import { detect as detectDecisionImpact } from './DecisionImpact.js';
import { detect as detectCriticalPath } from './CriticalPathMap.js';
import { detect as detectNarrativeCoverage } from './NarrativeCoverage.js';
import { detect as detectEmotionalArc } from './EmotionalArc.js';
import { detect as detectPlayerIdentity } from './PlayerIdentity.js';
import { detect as detectRivalry } from './RivalryEmergence.js';
import { detect as detectEconomy } from './EconomyFlow.js';
import { detect as detectProgression } from './ProgressionCurve.js';
import { detect as detectMarket } from './MarketLiquidity.js';
import { detect as detectSession } from './SessionLength.js';
import { detect as detectTutorial } from './TutorialFunnel.js';
import { detect as detectLoad } from './LoadPerformance.js';

const DETECTORS = [
    { spec: 'SPEC-100', detect: detectMonotony },
    { spec: 'SPEC-101', detect: detectBalance },
    { spec: 'SPEC-102', detect: detectFun },
    { spec: 'SPEC-103', detect: detectDecisionImpact },
    { spec: 'SPEC-104', detect: detectCriticalPath },
    { spec: 'SPEC-105', detect: detectNarrativeCoverage },
    { spec: 'SPEC-106', detect: detectEmotionalArc },
    { spec: 'SPEC-107', detect: detectPlayerIdentity },
    { spec: 'SPEC-108', detect: detectRivalry },
    { spec: 'SPEC-109', detect: detectEconomy },
    { spec: 'SPEC-110', detect: detectProgression },
    { spec: 'SPEC-111', detect: detectMarket },
    { spec: 'SPEC-112', detect: detectSession },
    { spec: 'SPEC-113', detect: detectTutorial },
    { spec: 'SPEC-114', detect: detectLoad }
];

const MAX_HISTORY = 200;

export class TelemetryAggregator {
    constructor() {
        this.history = {
            // monotony
            matchNarrations: [],
            tactics: [],
            balance: [],
            offerCounts: [],
            standingsByWeek: [],
            weekEvents: [],
            decisions: [],
            weeklyFinances: [],
            // balance audit
            matchOutcomes: [],
            balanceByWeek: [],
            // critical path
            viewVisits: {},
            // narrative
            eventStrings: [],
            // player identity
            playerCareer: [],
            // economy already covered
            // progression
            squadOvrBySeason: {},
            growthEvents: [],
            // market
            offers: [],
            transfers: [],
            // session
            weeksPlayed: 0,
            elapsedMs: 0,
            // tutorial
            tutorialSteps: [],
            startedFromTutorial: 0,
            startedFromSkip: 0,
            // load
            advanceWeekTimings: [],
            detectorTimings: {},
            fps: []
        };
        this.lastReport = null;
    }

    /**
     * Push tick data — called every AutoPlay tick.
     */
    record(slice) {
        if (!slice) return;
        if (slice.tactic) this._push('tactics', slice.tactic);
        if (typeof slice.balance === 'number') this._push('balance', slice.balance);
        if (typeof slice.balance === 'number') this._push('balanceByWeek', slice.balance);
        if (typeof slice.offerCount === 'number') this._push('offerCounts', slice.offerCount);
        if (typeof slice.standing === 'number') this._push('standingsByWeek', slice.standing);
        if (Array.isArray(slice.events)) {
            this._push('weekEvents', slice.events.slice(0, 20));
            slice.events.forEach(ev => this._push('eventStrings', ev));
        }
        if (slice.decision) this._push('decisions', slice.decision);
        if (slice.weeklyFinance) this._push('weeklyFinances', slice.weeklyFinance);
        if (slice.matchOutcome) this._push('matchOutcomes', slice.matchOutcome);
        if (typeof slice.advanceWeekMs === 'number') this._push('advanceWeekTimings', slice.advanceWeekMs);
        if (slice.viewVisit) {
            this.history.viewVisits[slice.viewVisit] = (this.history.viewVisits[slice.viewVisit] || 0) + 1;
        }
        if (Array.isArray(slice.matchNarrations)) {
            slice.matchNarrations.forEach(n => this._push('matchNarrations', n));
        }
        if (Array.isArray(slice.offers)) {
            slice.offers.forEach(o => this._push('offers', o));
        }
        if (slice.growth) this._push('growthEvents', slice.growth);
    }

    /**
     * Replace snapshot fields (player career, squad ovr).
     */
    snapshot(payload) {
        if (!payload) return;
        if (Array.isArray(payload.playerCareer)) {
            this.history.playerCareer = payload.playerCareer;
        }
        if (payload.squadOvrBySeason) {
            this.history.squadOvrBySeason = { ...this.history.squadOvrBySeason, ...payload.squadOvrBySeason };
        }
        if (typeof payload.weeksPlayed === 'number') this.history.weeksPlayed = payload.weeksPlayed;
        if (typeof payload.elapsedMs === 'number') this.history.elapsedMs = payload.elapsedMs;
    }

    _push(key, value) {
        if (!Array.isArray(this.history[key])) this.history[key] = [];
        this.history[key].push(value);
        if (this.history[key].length > MAX_HISTORY) {
            this.history[key] = this.history[key].slice(-MAX_HISTORY);
        }
    }

    /**
     * Run all detectors. Returns aggregated report.
     */
    scan(engine) {
        const state = { engine, history: this.history };
        const results = {};
        let overallScore = 0;
        let detectorCount = 0;

        for (const { spec, detect } of DETECTORS) {
            const start = performance.now();
            let res;
            try {
                res = detect(state);
            } catch (err) {
                res = {
                    spec,
                    name: spec,
                    score: 0,
                    signals: [{ id: 'CRASH', severity: 1, msg: err.message }],
                    topSignal: 'CRASH'
                };
            }
            const elapsed = performance.now() - start;
            if (!this.history.detectorTimings[spec]) this.history.detectorTimings[spec] = [];
            this.history.detectorTimings[spec].push(elapsed);
            if (this.history.detectorTimings[spec].length > 50) {
                this.history.detectorTimings[spec] = this.history.detectorTimings[spec].slice(-50);
            }
            results[spec] = res;
            overallScore += res.score || 0;
            detectorCount++;

            if (elapsed > 10) {
                if (typeof console !== 'undefined') {
                    console.warn(`[TelemetryAggregator] ${spec} slow: ${elapsed.toFixed(1)}ms`);
                }
            }
        }

        const report = {
            overallScore: detectorCount > 0 ? Math.round(overallScore / detectorCount) : 0,
            timestamp: Date.now(),
            detectorCount,
            results
        };
        this.lastReport = report;
        return report;
    }

    getReport() {
        return this.lastReport;
    }

    exportJSON() {
        return JSON.stringify({
            report: this.lastReport,
            history: this.history
        }, null, 2);
    }
}

export const TELEMETRY_DETECTORS = DETECTORS.map(d => d.spec);

export default TelemetryAggregator;
