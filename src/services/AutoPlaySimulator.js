import { EngineLogger } from '../engine/EngineLogger.js';
/**
 * AutoPlaySimulator — Week Advancement, Match Processing & Anomaly Detection
 * RFCT-018 Phase 3: Extracted from AutoPlayService
 *
 * Contains the core simulation loop logic:
 * - _advanceWeek(): engine tick + match result processing + telemetry
 * - _emergencySell(): BUG-080 death-spiral recovery
 * - _detectAnomalies(): anomaly detection + success/milestone tracking
 *
 * All methods are static and receive the controller instance (ctx).
 */

import { encodeState } from './learning/AdaptiveBrain.js';
import { computeTransferReward } from './learning/SmartMarketEngine.js';

export class AutoPlaySimulator {

    /**
     * Advance the engine by one week, process all match results,
     * feed telemetry, and update stats.
     * @param {AutoPlayController} ctx
     */
    static advanceWeek(ctx) {
        const start = performance.now();
        const result = ctx.engine.advanceWeek();
        const elapsed = performance.now() - start;

        // Detect slow advanceWeek
        if (elapsed > 500) {
            ctx._logAnomaly('SLOW_TICK', `advanceWeek took ${elapsed.toFixed(0)}ms`, { elapsed });
        }

        // Telemetry: per-week slice
        try {
            const team = ctx.engine.getTeam(ctx.engine.manager?.teamId);
            const standings = team ? ctx.engine.getStandings(team.zone, team.division) : [];
            const standingPos = team ? standings.findIndex(s => s.teamId === team.id) + 1 : 0;
            const events = Array.isArray(ctx.engine.weekEvents) ? ctx.engine.weekEvents.slice() : [];
            const offerCount = Array.isArray(ctx.engine.transferOffers) ? ctx.engine.transferOffers.length : 0;
            ctx.telemetry.record({
                tactic: ctx._lastTactic || ctx.engine.currentTactic,
                balance: team?.balance,
                offerCount,
                standing: standingPos > 0 ? standingPos : undefined,
                events,
                weeklyFinance: ctx.engine.weeklyFinance,
                advanceWeekMs: elapsed
            });
        } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'ignore — telemetry must not break tick'); }

        // BUG-026 fix: engine.advanceWeek returns weekResults keyed by tournamentId,
        // NOT { matches: [...] }. Previous code never matched, leaving matchesPlayed=0
        // and cascade-zeroing SPEC-106/107/108/111 in telemetry.
        const allMatches = [];
        if (result && typeof result === 'object') {
            for (const tournamentId of Object.keys(result)) {
                const tournResults = result[tournamentId];
                if (Array.isArray(tournResults)) {
                    allMatches.push(...tournResults);
                }
            }
        }
        if (allMatches.length > 0) {
            ctx.stats.matchesPlayed += allMatches.length;
            const myTeamId = ctx.engine.manager?.teamId;
            allMatches.forEach(m => {
                if (m.home === myTeamId || m.away === myTeamId) {
                    const isHome = m.home === myTeamId;
                    // Match objects from League use m.score.{home,away}Goals
                    const myGoals = isHome
                        ? (m.score?.homeGoals ?? m.homeGoals ?? 0)
                        : (m.score?.awayGoals ?? m.awayGoals ?? 0);
                    const oppGoals = isHome
                        ? (m.score?.awayGoals ?? m.awayGoals ?? 0)
                        : (m.score?.homeGoals ?? m.homeGoals ?? 0);
                    const diff = myGoals - oppGoals;
                    let outcome = 'D';
                    if (diff > 0) outcome = 'W';
                    else if (diff < 0) outcome = 'L';

                    // Telemetry match outcome
                    try {
                        const team = ctx.engine.getTeam(myTeamId);
                        const standings = team ? ctx.engine.getStandings(team.zone, team.division) : [];
                        const myPos = team ? (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length : 10;
                        const oppId = isHome ? m.away : m.home;
                        const oppPos = standings.findIndex(s => s.teamId === oppId) + 1;
                        const n = standings.length;
                        // SPEC-108/102: mark as important if late season, top-3 clash, or promotion/relegation battle
                        const seasonWeek = ctx.engine.currentWeek;
                        const isTopClash = oppPos > 0 && oppPos <= 3 && myPos <= 6;
                        const isRelBattle = oppPos >= (n - 3) && myPos >= (n - 5);
                        const isDecisive = seasonWeek >= 34;
                        const isImportantMatch = m.isImportant || isTopClash || isRelBattle || isDecisive;
                        ctx.telemetry.record({
                            matchOutcome: {
                                week: seasonWeek,
                                season: ctx.engine.seasonNumber,
                                division: team?.division || 1,
                                myGoals,
                                oppGoals,
                                oppId,
                                oppName: m.oppName || `team-${oppId}`,
                                result: outcome,
                                isImportant: isImportantMatch,
                                hadComeback: !!m.hadComeback
                            }
                        });
                    } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'ignore'); }

                    // SPEC-115: track lastMatchResult for state encoding next tick
                    // BUG-041: also track goals for granular reward shaping
                    ctx._lastMatchResult = outcome;
                    ctx._lastMatchGoalsScored = myGoals;
                    ctx._lastMatchGoalsAllowed = oppGoals;
                    ctx._lastMatchScoreDiff = diff;

                    // MARL Fase 2: Feed EmotionalEngine with match result
                    try {
                        const streak = ctx.engine.managerStats?.streak || 0;
                        const team2 = ctx.engine.getTeam(myTeamId);
                        const standings2 = team2 ? ctx.engine.getStandings(team2.zone, team2.division) : [];
                        const pos2 = team2 ? (standings2.findIndex(s => s.teamId === team2.id) + 1) || standings2.length : 10;
                        const n2 = standings2.length || 20;
                        const isRelRisk = pos2 > (n2 * 0.75);
                        ctx.brain.processMatchResult(outcome, streak, isRelRisk);
                    } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'defensive — emotional engine must not break tick'); }

                    if (diff > 0) {
                        ctx.stats.wins++;
                        // Biggest win check
                        const winSize = diff;
                        if (!ctx.stats.insights.biggestWin || winSize > ctx.stats.insights.biggestWin.diff) {
                            ctx.stats.insights.biggestWin = { diff: winSize, score: `${myGoals}-${oppGoals}`, week: ctx.engine.currentWeek };
                            if (winSize >= 5) {
                                ctx._logSuccess('GOLEADA', `🚀 Goleada ${myGoals}-${oppGoals}`, ctx.stats.insights.biggestWin);
                            }
                        }
                        // Clean sheet
                        if (oppGoals === 0) {
                            ctx.stats.insights.cleanSheets++;
                        }
                    } else if (diff === 0) {
                        ctx.stats.draws++;
                    } else {
                        ctx.stats.losses++;
                        const lossSize = Math.abs(diff);
                        if (!ctx.stats.insights.worstLoss || lossSize > ctx.stats.insights.worstLoss.diff) {
                            ctx.stats.insights.worstLoss = { diff: lossSize, score: `${myGoals}-${oppGoals}`, week: ctx.engine.currentWeek };
                            if (lossSize >= 4) {
                                ctx._logAnomaly('VEXAME', `📉 Levou ${myGoals}-${oppGoals}`, ctx.stats.insights.worstLoss);
                            }
                        }
                    }
                }
            });
        }
    }

    /**
     * BUG-080: force-sell bench player (or weakest titular) to recover from death spiral
     * @param {AutoPlayController} ctx
     * @param {object} team
     */
    static emergencySell(ctx, team) {
        const bench = team.squad.filter(p => !p.isTitular && !p._retired && !p.injury);
        bench.sort((a, b) => (b.value || 0) - (a.value || 0));
        if (bench.length > 0) {
            const p = bench[0];
            const amount = p.value || (p.ovr || 50) * 50_000;
            team.squad = team.squad.filter(x => x.id !== p.id);
            team.balance += amount;
            ctx._logDecision('EMERGENCY_SELL', { player: p.name, ovr: p.ovr, amount }, 0);
            return;
        }
        // No bench: demote + sell weakest titular (only if >11 titulares remain)
        const titulares = team.squad.filter(p => p.isTitular && !p._retired);
        if (titulares.length > 11) {
            const weakest = [...titulares].sort((a, b) => (a.ovr || 0) - (b.ovr || 0))[0];
            weakest.isTitular = false;
            const amount = weakest.value || (weakest.ovr || 50) * 50_000;
            team.squad = team.squad.filter(x => x.id !== weakest.id);
            team.balance += amount;
            ctx._logDecision('EMERGENCY_SELL_TITULAR', { player: weakest.name, ovr: weakest.ovr, amount }, 0);
        }
    }

    /**
     * Detect anomalies, streaks, titles, promotions, relegations,
     * hat-tricks, balance peaks, and position peaks.
     * @param {AutoPlayController} ctx
     */
    static detectAnomalies(ctx) {
        const engine = ctx.engine;
        if (!engine) return;
        const team = engine.getTeam(engine.manager?.teamId);
        if (!team) {
            ctx._logAnomaly('TEAM_LOST', 'Team became null mid-game');
            return;
        }

        // === ANOMALIES ===
        // Squad too small
        if (team.squad && team.squad.length < 11) {
            ctx._logAnomaly('SQUAD_SHORT', `Squad has ${team.squad.length} players`, {
                squadSize: team.squad.length
            });
        }

        // Negative balance
        if (team.balance !== undefined && team.balance < -10000000) {
            ctx._logAnomaly('NEGATIVE_BALANCE', `Balance R$ ${team.balance}`, { balance: team.balance });
        }

        // Energy stuck low
        const avgEnergy = team.squad?.reduce((s, p) => s + (p.energy || 0), 0) / (team.squad?.length || 1);
        if (avgEnergy < 20) {
            ctx._logAnomaly('LOW_ENERGY_AVG', `Avg energy ${avgEnergy.toFixed(0)}%`, { avgEnergy });
        }

        // BUG-031 + SPEC-125: dedupe TACTIC_STUCK + ignore se ganhando.
        const tacticStreak = engine.managerStats?.streak || 0;
        if (ctx._consecutiveSameTactic > 30 && tacticStreak <= 0) {
            const week = engine.currentWeek || 0;
            const lastLogWeek = ctx._lastTacticStuckLogWeek || -999;
            if (week - lastLogWeek >= 38) {
                ctx._logAnomaly('TACTIC_STUCK', `Same tactic ${ctx._consecutiveSameTactic} weeks (streak ${tacticStreak})`, {
                    tactic: ctx._lastTactic,
                    streak: tacticStreak
                });
                ctx._lastTacticStuckLogWeek = week;
            }
            ctx._consecutiveSameTactic = 0;
        }

        // Save corruption check
        if (engine.currentWeek > 38 * 100) {
            ctx._logAnomaly('WEEK_OVERFLOW', `currentWeek ${engine.currentWeek} suspicious`);
        }

        // === SUCCESS DETECTION ===
        // Streak insights
        const streak = engine.managerStats?.streak || 0;
        if (streak > ctx.stats.insights.longestWinStreak) {
            ctx.stats.insights.longestWinStreak = streak;
            if (streak >= 5) {
                ctx._logSuccess('WIN_STREAK', `${streak} vitórias seguidas`, { streak });
            }
        }
        if (streak < ctx.stats.insights.longestLossStreak) {
            ctx.stats.insights.longestLossStreak = streak;
            // BUG-069 fix: LOSS_STREAK era logged como sucesso. Move pra anomaly.
            if (streak <= -5) {
                ctx._logAnomaly('LOSS_STREAK', `${Math.abs(streak)} derrotas seguidas`, { streak });
            }
        }

        // Title/promotion detection (season transition)
        const seasonNum = engine.seasonNumber || 1;
        if (ctx._lastSeasonNumber !== null && seasonNum > ctx._lastSeasonNumber) {
            // Q(λ) episode boundary: clear eligibility traces to prevent
            // cross-season credit leakage (Ref: Sutton & Barto Ch.12 §12.1)
            try { ctx.brain.clearTraces(); } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'defensive'); }
            // Fase 3: clear SARSA(λ) emotional traces at season boundary
            try { ctx.brain.emotions.clearSarsaTraces(); } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'defensive'); }
            // Fase C: replay high-impact experiences at season boundary
            try { ctx.brain.replayExperiences(); } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'defensive'); }

            // Fase C: NPC season boundary — clear traces + replay for all NPC brains
            try {
                const allTeams = engine.getAllTeams?.() || [];
                for (const t of allTeams) {
                    if (t.brain && t.id !== team?.id) {
                        try { t.brain.clearTraces(); } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'skip'); }
                        try { t.brain.replayExperiences(); } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'skip'); }
                    }
                }
            } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'defensive'); }

            // Flush all pending transfer rewards (season rolled over, can't wait anymore)
            if (ctx._pendingTransferRewards?.length > 0 && team) {
                const standings = engine.getStandings(team.zone, team.division) || [];
                const currentPos = (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length;
                const stateCtx = ctx._buildStateCtx();
                for (const tx of ctx._pendingTransferRewards) {
                    try {
                        const reward = computeTransferReward({
                            action: tx.type,
                            positionBefore: tx.positionBefore,
                            positionAfter: currentPos,
                            balanceBefore: tx.balanceBefore,
                            balanceAfter: team?.balance || 0,
                            playerBecameStarter: tx.type === 'BUY' && (tx.playerOvr || 0) >= 65,
                            playerWasStarter: tx.playerWasStarter || false,
                            offerRatio: tx.offerRatio || 1.0,
                            emotionalLossMod: ctx.brain?.emotions?.getModifiers?.()?.lossMod || 1.0
                        });
                        if (tx.stateKey && tx.action) {
                            ctx.brain.observe(tx.stateKey, tx.action, reward, encodeState(stateCtx), ['MKT_BUY_YES', 'MKT_BUY_NO', 'MKT_SELL_YES', 'MKT_SELL_NO']);
                        }
                    } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'defensive'); }
                }
                ctx._pendingTransferRewards = [];
            }
            const titlesNow = engine.legacy?.titles?.length || 0;
            if (titlesNow > ctx._lastTitlesCount) {
                const newTitle = engine.legacy.titles[titlesNow - 1];
                ctx._logSuccess('TITLE_WON', `🏆 Título: ${newTitle || 'Nacional'}`, {
                    title: newTitle,
                    season: seasonNum - 1
                });
                ctx.stats.insights.titlesWon++;
                // MARL Fase 2: Title event → Emotional Engine
                try { ctx.brain.processSeasonEvent('TITLE'); } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'defensive'); }
            }
            ctx._lastTitlesCount = titlesNow;

            // Division change
            if (ctx._lastDivision !== null && team.division !== ctx._lastDivision) {
                if (team.division < ctx._lastDivision) {
                    ctx._logSuccess('PROMOTION', `⬆️ Subiu pra Série ${['A','B','C','D'][team.division - 1]}`, {
                        from: ctx._lastDivision,
                        to: team.division
                    });
                    ctx.stats.insights.promotionsWon++;
                    // MARL Fase 2: Promotion → Emotional Engine
                    try { ctx.brain.processSeasonEvent('PROMOTION'); } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'defensive'); }
                } else {
                    ctx._logSuccess('RELEGATION', `⬇️ Caiu pra Série ${['A','B','C','D'][team.division - 1]}`, {
                        from: ctx._lastDivision,
                        to: team.division
                    });
                    ctx.stats.insights.relegationsTaken++;
                    // MARL Fase 2: Near-relegation → feed anxiety
                    try { ctx.brain.processSeasonEvent('RELEGATION_RISK'); } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'defensive'); }
                }
            }
            ctx._lastDivision = team.division;

            // AUDIT-FIX #F: Yo-yo detection at season boundary
            try {
                const yoyo = ctx.brain.recordSeasonDivision(team.division, seasonNum);
                if (yoyo.isYoyo && yoyo.penalty !== 0) {
                    const stateCtx2 = ctx._buildStateCtx();
                    const stateKey = encodeState(stateCtx2);
                    ctx.brain.observe(stateKey, 'YOYO_PENALTY', yoyo.penalty, stateKey, []);
                    ctx._logDecision('YOYO_DETECTED', {
                        yoyoCount: yoyo.yoyoCount,
                        penalty: yoyo.penalty,
                        divisionHistory: ctx.brain.divisionHistory
                    }, 0);
                }
            } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'defensive'); }
        }
        if (ctx._lastSeasonNumber === null) {
            ctx._lastSeasonNumber = seasonNum;
            ctx._lastTitlesCount = engine.legacy?.titles?.length || 0;
            ctx._lastDivision = team.division;
        } else {
            ctx._lastSeasonNumber = seasonNum;
        }

        // Hat-trick detection (squad scan)
        const hatTrickers = (team.squad || []).filter(p => p.career?.hatTricks > 0);
        const totalHatTricks = hatTrickers.reduce((s, p) => s + (p.career?.hatTricks || 0), 0);
        if (totalHatTricks > ctx.stats.insights.hatTricks) {
            const diff = totalHatTricks - ctx.stats.insights.hatTricks;
            ctx._logSuccess('HAT_TRICK', `🎩 ${diff} hat-trick(s) novo(s)`, { totalHatTricks });
            ctx.stats.insights.hatTricks = totalHatTricks;
        }

        // Balance peaks
        const balance = team.balance ?? 0;
        if (balance > ctx.stats.insights.peakBalance) {
            ctx.stats.insights.peakBalance = balance;
            if (balance >= 50000000 && balance % 50000000 < 100000) {
                ctx._logSuccess('BALANCE_PEAK', `💰 R$ ${(balance / 1e6).toFixed(0)}M`, { balance });
            }
        }
        if (balance < ctx.stats.insights.lowestBalance) {
            ctx.stats.insights.lowestBalance = balance;
        }

        // Position peaks
        try {
            const standings = engine.getStandings(team.zone, team.division);
            const pos = standings.findIndex(s => s.teamId === team.id) + 1;
            if (pos > 0 && pos < ctx.stats.insights.peakStanding) {
                ctx.stats.insights.peakStanding = pos;
            }
            if (pos > ctx.stats.insights.worstStanding) {
                ctx.stats.insights.worstStanding = pos;
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlaySimulator.js', 'ignore'); }
    }
}
