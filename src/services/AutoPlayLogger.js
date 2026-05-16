import { EngineLogger } from '../engine/EngineLogger.js';
/**
 * AutoPlayLogger — Persistence + log entry collection
 * RFCT-020 Phase 1: Extracted from AutoPlayService
 *
 * Owns the logging side-effects (save to localStorage via AutoPlayPersistence,
 * push entries to stats.successes / stats.anomalies / stats.decisions,
 * cap buffers, feed telemetry, report bugs to MonitorService).
 *
 * Stateful: holds a reference to the parent AutoPlayController so it can
 * read/write `parent.stats`, `parent.engine`, `parent.telemetry`.
 */

import { MonitorService } from './MonitorService';
import { AutoPlayPersistence } from './AutoPlayPersistence.js';

export class AutoPlayLogger {
    /**
     * @param {AutoPlayController} parent - the controller instance owning the stats
     */
    constructor(parent) {
        this.parent = parent;
    }

    save() {
        AutoPlayPersistence.saveStats(this.parent.stats);
    }

    logSuccess(type, msg, ctx = {}) {
        const entry = {
            type,
            msg,
            ctx,
            week: this.parent.engine?.currentWeek,
            season: this.parent.engine?.seasonNumber,
            ts: Date.now()
        };
        this.parent.stats.successes.push(entry);
        if (this.parent.stats.successes.length > 200) {
            this.parent.stats.successes = this.parent.stats.successes.slice(-100);
        }
    }

    logAnomaly(type, msg, ctx = {}) {
        const entry = {
            type,
            msg,
            ctx,
            week: this.parent.engine?.currentWeek,
            season: this.parent.engine?.seasonNumber,
            ts: Date.now()
        };
        this.parent.stats.anomalies.push(entry);
        // BUG-089: cap anomalies — segmented like decisions
        if (this.parent.stats.anomalies.length > 500) {
            this.parent.stats.anomalies = this.parent.stats.anomalies.slice(-400);
        }
        try {
            MonitorService.getInstance().recordBug({
                severity: 'warning',
                action: `AUTOPLAY.${type}`,
                ctx: entry
            });
        } catch (err) { EngineLogger.capture(err, 'AutoPlayLogger.js', 'ignore'); }
    }

    /**
     * SPEC-123: snapshot per-season for learning curve viz.
     * Computes division/position/balance/promoted/relegated, tournament
     * participation, cumulative + per-season delta stats, then pushes to
     * stats.seasonHistory (capped at last 100).
     */
    snapshotSeasonHistory() {
        const parent = this.parent;
        if (!Array.isArray(parent.stats.seasonHistory)) parent.stats.seasonHistory = [];
        const team = parent.engine.getTeam(parent.engine.manager?.teamId);
        const standings = team ? parent.engine.getStandings(team.zone, team.division) : [];
        const position = team ? (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length : 0;
        const totalTeams = standings.length || 20;
        const promoted = position > 0 && position <= Math.max(2, Math.floor(totalTeams * 0.1));
        const relegated = position > 0 && position > totalTeams - Math.max(2, Math.floor(totalTeams * 0.1));

        const seasonRec = {
            season: parent.stats.seasonsPlayed,
            // Strategic data
            division: team?.division ?? null,
            position,
            balance: team?.balance ?? 0,
            promoted,
            relegated,
            squadSize: team?.squad?.length ?? 0,
            loanActive: !!parent.engine.activeLoan,
            // Tournament participation
            tournamentData: (parent.engine.tournaments || [])
                .filter(t => t.participants?.includes(team?.id))
                .map(t => ({
                    id: t.id,
                    winner: t.winner === team?.id,
                    phase: t.phase || (t.currentPhaseIndex != null ? `phase-${t.currentPhaseIndex}` : null),
                })),
            // Cumulative stats
            wins: parent.stats.wins,
            draws: parent.stats.draws,
            losses: parent.stats.losses,
            transfers: parent.stats.transfers,
            matchesPlayed: parent.stats.matchesPlayed,
            brainStates: parent.brain ? Object.keys(parent.brain.qTable).length : 0,
            brainUpdates: parent.brain?.totalUpdates || 0,
            // §17: Session metrics snapshot
            sessionMetrics: parent._sessionMetrics.getMetrics(),
            coreLoopFast: parent._sessionMetrics.isCoreLoopFast()
        };
        // Compute delta vs previous season (per-season counts)
        const prev = parent.stats.seasonHistory[parent.stats.seasonHistory.length - 1];
        if (prev) {
            seasonRec.seasonWins = seasonRec.wins - prev.wins;
            seasonRec.seasonLosses = seasonRec.losses - prev.losses;
            seasonRec.seasonDraws = seasonRec.draws - prev.draws;
            seasonRec.seasonTransfers = seasonRec.transfers - prev.transfers;
        } else {
            seasonRec.seasonWins = seasonRec.wins;
            seasonRec.seasonLosses = seasonRec.losses;
            seasonRec.seasonDraws = seasonRec.draws;
            seasonRec.seasonTransfers = seasonRec.transfers;
        }
        parent.stats.seasonHistory.push(seasonRec);
        // Cap to last 100 seasons
        if (parent.stats.seasonHistory.length > 100) {
            parent.stats.seasonHistory = parent.stats.seasonHistory.slice(-100);
        }
    }

    /**
     * SPEC-143: compute derived metrics for deep soak v2 reporting.
     * Pure read over stats — emotional distribution, transfer prices by OVR
     * bucket, tactic diversity. Returns { emotionalDistribution, transferPrices,
     * tacticDiversity } shaped exactly like the legacy getStats() output.
     */
    computeStatsAggregates() {
        const stats = this.parent.stats;

        // SPEC-143: distribuição emocional — computa dos decisions logados
        const emotionalDistribution = (() => {
            const decisions = stats.decisions || [];
            const counts = {};
            decisions.forEach(d => {
                const emo = d.args?.emotion;
                if (emo) counts[emo] = (counts[emo] || 0) + 1;
            });
            const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
            return Object.fromEntries(
                Object.entries(counts).map(([k, v]) => [k, `${(v / total * 100).toFixed(1)}%`])
            );
        })();

        // SPEC-143: preços de transferência — extrai dos successes TRANSFER_SOLD
        const transferPrices = (() => {
            const sells = (stats.successes || []).filter(s => s.type === 'TRANSFER_SOLD');
            if (!sells.length) return null;
            const priceRe = /R\$\s*([\d.]+)M/;
            const ovrRe = /OVR(\d+)/;
            const byOvr = {};
            sells.forEach(s => {
                const priceM = parseFloat((priceRe.exec(s.msg) || [])[1] || '0') * 1e6;
                const ovr = parseInt((ovrRe.exec(s.msg) || [])[1] || '0');
                if (ovr && priceM) {
                    const bucket = Math.floor(ovr / 5) * 5;
                    if (!byOvr[bucket]) byOvr[bucket] = [];
                    byOvr[bucket].push(priceM);
                }
            });
            return Object.fromEntries(
                Object.entries(byOvr).map(([ovr, prices]) => [
                    `ovr${ovr}Avg`, Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
                ])
            );
        })();

        // SPEC-143: diversidade tática — dos decisions TACTIC_CHANGE
        const tacticDiversity = (() => {
            const tactics = (stats.decisions || [])
                .filter(d => d.action === 'TACTIC_CHANGE')
                .map(d => d.args?.to)
                .filter(Boolean);
            const unique = new Set(tactics);
            const stuck = (stats.anomalies || [])
                .filter(a => a.type === 'TACTIC_STUCK')
                .map(a => a.ctx?.streak || 0);
            return {
                uniqueTacticsUsed: unique.size,
                tacticChanges: tactics.length,
                maxConsecutiveSameTactic: stuck.length ? Math.max(...stuck) : 0,
            };
        })();

        return { emotionalDistribution, transferPrices, tacticDiversity };
    }

    logDecision(action, args, elapsedMs) {
        const entry = {
            action,
            args,
            elapsedMs,
            week: this.parent.engine?.currentWeek,
            season: this.parent.engine?.seasonNumber
        };
        this.parent.stats.decisions.push(entry);
        // BUG-RC2 fix: segment decisions to prevent NARRATIVE_EVENT from
        // flooding the buffer and evicting strategic decisions.
        // Strategy: keep last 200 strategic + last 50 routine.
        if (this.parent.stats.decisions.length > 300) {
            const ROUTINE = new Set(['NARRATIVE_EVENT', 'VISIT_VIEW', 'TEAM_TALK', 'PRESS_CONFERENCE']);
            const strategic = this.parent.stats.decisions.filter(d => !ROUTINE.has(d.action));
            const routine = this.parent.stats.decisions.filter(d => ROUTINE.has(d.action));
            this.parent.stats.decisions = [
                ...strategic.slice(-200),
                ...routine.slice(-50)
            ];
        }
        // Telemetry: feed decision
        try {
            this.parent.telemetry.record({ decision: entry });
        } catch (err) { EngineLogger.capture(err, 'AutoPlayLogger.js', 'ignore'); }
    }
}
