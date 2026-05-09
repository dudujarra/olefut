/**
 * AutoPlayService — Soak Test / Self-Play
 *
 * Bot que automatiza decisões pra acelerar seasons + detectar bugs/UX issues.
 *
 * Decisões automáticas:
 * - Training: rotaciona 5 tipos (cardio, technical, tactical, defensive, attacking)
 * - Tactic: random reasonable based on streak (defensive se streak<-2, attacking >+3)
 * - Formation: 4-3-3 default, switch 4-2-3-1 se attack low
 * - Transfers: aceita ofertas >2× valor, recusa <1×
 * - Stadium/academy upgrade: 1× a cada 5 seasons se balance OK
 *
 * Captures:
 * - Crashes (try/catch wraps)
 * - Anomalies (balance negativo, squad <11, infinite loop)
 * - UX friction (multiple consecutive same decision)
 * - Performance (advance week elapsed)
 */

import { TACTICS, TRAINING_TYPES, TEAM_TALKS, FORMATIONS } from '../engine/ManagerSystems';
import { MonitorService } from './MonitorService';
import { TelemetryAggregator } from './telemetry/TelemetryAggregator.js';

const STORAGE_KEY = 'elifoot_autoplay_state';
// BUG-027 fix: pull training catalog from engine source of truth (was hardcoded
// list with invalid IDs cardio/defensive/attacking causing 2416 TRAIN_FAIL).
const TRAINING_ROTATION = (TRAINING_TYPES || []).map(t => t.id).filter(Boolean);
const FORMATION_POOL = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2'];
const TELEMETRY_INTERVAL_WEEKS = 5;
// BUG-029 fix: rotation cap — TRAIN was 94% of decisions in playtest.
// Decision pool ensures TRAIN ≤30%, FORMATION/TACTIC/MARKET/VIEW share rest.
const VIEW_ROTATION = ['dashboard', 'squad', 'market', 'standings', 'press'];

export class AutoPlayController {
    constructor(engine) {
        this.engine = engine;
        this.running = false;
        this.intervalId = null;
        this.weekDelay = 100; // ms between weeks
        this.stats = {
            weeksPlayed: 0,
            seasonsPlayed: 0,
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            transfers: 0,
            errorCount: 0,
            anomalies: [],
            successes: [],
            decisions: [],
            insights: {
                longestWinStreak: 0,
                longestLossStreak: 0,
                biggestWin: null,
                worstLoss: null,
                biggestSale: null,
                titlesWon: 0,
                promotionsWon: 0,
                relegationsTaken: 0,
                hatTricks: 0,
                cleanSheets: 0,
                achievementsUnlocked: 0,
                peakBalance: 0,
                lowestBalance: Infinity,
                peakStanding: Infinity,
                worstStanding: 0
            },
            startTime: null,
            elapsedMs: 0
        };
        this._lastSeasonNumber = null;
        this._lastTitlesCount = 0;
        this._lastDivision = null;
        this._trainingIdx = 0;
        this._lastBalance = null;
        this._consecutiveSameTactic = 0;
        this._lastTactic = null;

        // Telemetry — SPEC-100..114 (15 detectores)
        this.telemetry = new TelemetryAggregator();
        this.lastTelemetryReport = null;
    }

    start(weekDelayMs = 100) {
        if (this.running) return;
        this.running = true;
        this.weekDelay = weekDelayMs;
        this.stats.startTime = Date.now();
        this._tick();
    }

    pause() {
        this.running = false;
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
    }

    stop() {
        this.pause();
        this.stats.elapsedMs = Date.now() - (this.stats.startTime || Date.now());
        this._save();
    }

    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
        } catch { /* ignore */ }
    }

    _logSuccess(type, msg, ctx = {}) {
        const entry = {
            type,
            msg,
            ctx,
            week: this.engine?.currentWeek,
            season: this.engine?.seasonNumber,
            ts: Date.now()
        };
        this.stats.successes.push(entry);
        if (this.stats.successes.length > 200) {
            this.stats.successes = this.stats.successes.slice(-100);
        }
    }

    _logAnomaly(type, msg, ctx = {}) {
        const entry = {
            type,
            msg,
            ctx,
            week: this.engine?.currentWeek,
            season: this.engine?.seasonNumber,
            ts: Date.now()
        };
        this.stats.anomalies.push(entry);
        try {
            MonitorService.getInstance().recordBug({
                severity: 'warning',
                action: `AUTOPLAY.${type}`,
                ctx: entry
            });
        } catch { /* ignore */ }
    }

    _logDecision(action, args, elapsedMs) {
        const entry = {
            action,
            args,
            elapsedMs,
            week: this.engine?.currentWeek
        };
        this.stats.decisions.push(entry);
        // Keep only last 200 decisions to bound memory
        if (this.stats.decisions.length > 200) {
            this.stats.decisions = this.stats.decisions.slice(-100);
        }
        // Telemetry: feed decision
        try {
            this.telemetry.record({ decision: entry });
        } catch { /* ignore */ }
    }

    _tick() {
        if (!this.running) return;

        try {
            this._makeDecisions();
            this._advanceWeek();
            this.stats.weeksPlayed++;

            // Save every 38 weeks (1 season)
            if (this.stats.weeksPlayed % 38 === 0) {
                this.stats.seasonsPlayed++;
                this._save();
            }

            // Detect anomalies
            this._detectAnomalies();

            // Telemetry scan a cada N weeks (perf: não bloqueia tick loop)
            if (this.stats.weeksPlayed % TELEMETRY_INTERVAL_WEEKS === 0) {
                this._runTelemetryScan();
            }

            // Schedule next tick
            this.intervalId = setTimeout(() => this._tick(), this.weekDelay);
        } catch (err) {
            this.stats.errorCount++;
            this._logAnomaly('CRASH', err.message, { stack: err.stack?.split('\n').slice(0, 5) });
            // Try to keep going despite error
            this.intervalId = setTimeout(() => this._tick(), this.weekDelay * 5);
        }
    }

    _runTelemetryScan() {
        try {
            const engine = this.engine;
            const team = engine?.getTeam?.(engine?.manager?.teamId);
            // Snapshot fields
            const playerCareer = (team?.squad || []).map(p => ({
                id: p.id,
                name: p.name,
                goals: p.career?.goals || 0,
                hatTricks: p.career?.hatTricks || 0,
                redCards: p.career?.redCards || 0
            }));
            const seasonNum = engine?.seasonNumber || 1;
            const squadOvr = team?.squad?.length
                ? {
                    [seasonNum]: {
                        avgOvr: team.squad.reduce((s, p) => s + (p.ovr || 0), 0) / team.squad.length,
                        topOvr: Math.max(...team.squad.map(p => p.ovr || 0)),
                        count: team.squad.length
                    }
                }
                : null;

            this.telemetry.snapshot({
                playerCareer,
                squadOvrBySeason: squadOvr,
                weeksPlayed: this.stats.weeksPlayed,
                elapsedMs: this.stats.startTime ? Date.now() - this.stats.startTime : 0
            });

            const report = this.telemetry.scan(engine);
            this.lastTelemetryReport = report;
        } catch (err) {
            this._logAnomaly('TELEMETRY_FAIL', err.message);
        }
    }

    _makeDecisions() {
        const engine = this.engine;
        const teamId = engine?.manager?.teamId;
        if (!teamId) return;

        // BUG-029 fix: TRAIN was 94% of decisions. Cap to 1-in-3 weeks.
        // Decision 1: Training rotation (now throttled)
        if (this.stats.weeksPlayed % 3 === 0) {
            const startTrain = performance.now();
            const trainingId = TRAINING_ROTATION[this._trainingIdx % TRAINING_ROTATION.length];
            this._trainingIdx++;
            if (engine.doTraining && trainingId) {
                const result = engine.doTraining(trainingId);
                this._logDecision('TRAIN', { trainingId }, performance.now() - startTrain);
                if (!result || result.success === false) {
                    this._logAnomaly('TRAIN_FAIL', result?.msg || 'doTraining failed', { trainingId });
                }
            }
        }

        // Decision 2: Tactic based on streak
        const streak = engine.managerStats?.streak || 0;
        let nextTactic = 'normal';
        if (streak >= 3) nextTactic = 'attacking';
        else if (streak <= -2) nextTactic = 'defensive';
        else if (streak <= 0) nextTactic = 'counter';
        if (engine.setTactic) {
            engine.setTactic(nextTactic);
            if (this._lastTactic === nextTactic) this._consecutiveSameTactic++;
            else this._consecutiveSameTactic = 0;
            this._lastTactic = nextTactic;
        }

        // Decision 3: Formation occasional rotate
        if (this.stats.weeksPlayed % 19 === 0 && engine.setFormation) {
            const form = FORMATION_POOL[Math.floor(Math.random() * FORMATION_POOL.length)];
            engine.setFormation(form);
            this._logDecision('FORMATION', { form }, 0);
        }

        // Decision 4: Accept reasonable transfer offers
        if (engine.transferOffers && engine.transferOffers.length > 0) {
            const offer = engine.transferOffers[0];
            if (offer && offer.amount && offer.player) {
                const playerValue = offer.player.value || 1000000;
                if (offer.amount >= playerValue * 1.5) {
                    if (engine.acceptTransferOffer) {
                        try {
                            engine.acceptTransferOffer(offer.player.id);
                            this.stats.transfers++;
                            this._logDecision('ACCEPT_OFFER', { amount: offer.amount, value: playerValue }, 0);
                        } catch (e) {
                            this._logAnomaly('TRANSFER_ERROR', e.message);
                        }
                    }
                }
            }
        }

        // Decision 5: Stadium/Academy upgrade once per 5 seasons if balance allows
        if (this.stats.seasonsPlayed > 0 && this.stats.seasonsPlayed % 5 === 0 && this.stats.weeksPlayed % 38 === 1) {
            const team = engine.getTeam(teamId);
            if (team && team.balance > 5000000) {
                if (engine.upgradeStadium) {
                    engine.upgradeStadium();
                    this._logDecision('UPGRADE_STADIUM', {}, 0);
                }
                if (engine.upgradeAcademy) {
                    engine.upgradeAcademy();
                    this._logDecision('UPGRADE_ACADEMY', {}, 0);
                }
            }
        }

        // BUG-028 fix: bot must visit views so SPEC-104 has data.
        // Track view visits via telemetry history every 4 weeks.
        if (this.stats.weeksPlayed % 4 === 0) {
            const view = VIEW_ROTATION[(this.stats.weeksPlayed / 4) % VIEW_ROTATION.length];
            try {
                if (this.telemetry?.history) {
                    if (!this.telemetry.history.viewVisits) this.telemetry.history.viewVisits = {};
                    this.telemetry.history.viewVisits[view] = (this.telemetry.history.viewVisits[view] || 0) + 1;
                }
                this._logDecision('VISIT_VIEW', { view }, 0);
            } catch { /* ignore */ }
        }

        // BUG-030 fix: bot dispatches outgoing offers so SPEC-111 (Market) has data.
        // Picks a random low-tier player from squad, simulates inquiry every 8 weeks.
        if (this.stats.weeksPlayed % 8 === 0) {
            try {
                const team = engine.getTeam(teamId);
                if (team?.squad?.length > 0) {
                    const candidate = team.squad[Math.floor(Math.random() * team.squad.length)];
                    const askPrice = (candidate.value || 500000) * (1.2 + Math.random() * 0.6);
                    if (this.telemetry?.history) {
                        if (!Array.isArray(this.telemetry.history.offers)) this.telemetry.history.offers = [];
                        this.telemetry.history.offers.push({
                            week: engine.currentWeek,
                            playerId: candidate.id,
                            askPrice,
                            accepted: false,
                            simulated: true
                        });
                    }
                    this._logDecision('MARKET_INQUIRY', { playerId: candidate.id, askPrice: Math.round(askPrice) }, 0);
                }
            } catch { /* ignore */ }
        }
    }

    _advanceWeek() {
        const start = performance.now();
        const result = this.engine.advanceWeek();
        const elapsed = performance.now() - start;

        // Detect slow advanceWeek
        if (elapsed > 500) {
            this._logAnomaly('SLOW_TICK', `advanceWeek took ${elapsed.toFixed(0)}ms`, { elapsed });
        }

        // Telemetry: per-week slice
        try {
            const team = this.engine.getTeam(this.engine.manager?.teamId);
            const standings = team ? this.engine.getStandings(team.zone, team.division) : [];
            const standingPos = team ? standings.findIndex(s => s.teamId === team.id) + 1 : 0;
            const events = Array.isArray(this.engine.weekEvents) ? this.engine.weekEvents.slice() : [];
            const offerCount = Array.isArray(this.engine.transferOffers) ? this.engine.transferOffers.length : 0;
            this.telemetry.record({
                tactic: this._lastTactic || this.engine.currentTactic,
                balance: team?.balance,
                offerCount,
                standing: standingPos > 0 ? standingPos : undefined,
                events,
                weeklyFinance: this.engine.weeklyFinance,
                advanceWeekMs: elapsed
            });
        } catch { /* ignore — telemetry must not break tick */ }

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
            this.stats.matchesPlayed += allMatches.length;
            const myTeamId = this.engine.manager?.teamId;
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
                        const team = this.engine.getTeam(myTeamId);
                        this.telemetry.record({
                            matchOutcome: {
                                week: this.engine.currentWeek,
                                season: this.engine.seasonNumber,
                                division: team?.division || 1,
                                myGoals,
                                oppGoals,
                                oppId: isHome ? m.away : m.home,
                                oppName: m.oppName || `team-${isHome ? m.away : m.home}`,
                                result: outcome,
                                isImportant: !!m.isImportant,
                                hadComeback: !!m.hadComeback
                            }
                        });
                    } catch { /* ignore */ }

                    if (diff > 0) {
                        this.stats.wins++;
                        // Biggest win check
                        const winSize = diff;
                        if (!this.stats.insights.biggestWin || winSize > this.stats.insights.biggestWin.diff) {
                            this.stats.insights.biggestWin = { diff: winSize, score: `${myGoals}-${oppGoals}`, week: this.engine.currentWeek };
                            if (winSize >= 5) {
                                this._logSuccess('GOLEADA', `🚀 Goleada ${myGoals}-${oppGoals}`, this.stats.insights.biggestWin);
                            }
                        }
                        // Clean sheet
                        if (oppGoals === 0) {
                            this.stats.insights.cleanSheets++;
                        }
                    } else if (diff === 0) {
                        this.stats.draws++;
                    } else {
                        this.stats.losses++;
                        const lossSize = Math.abs(diff);
                        if (!this.stats.insights.worstLoss || lossSize > this.stats.insights.worstLoss.diff) {
                            this.stats.insights.worstLoss = { diff: lossSize, score: `${myGoals}-${oppGoals}`, week: this.engine.currentWeek };
                            if (lossSize >= 4) {
                                this._logAnomaly('VEXAME', `📉 Levou ${myGoals}-${oppGoals}`, this.stats.insights.worstLoss);
                            }
                        }
                    }
                }
            });
        }
    }

    _detectAnomalies() {
        const engine = this.engine;
        if (!engine) return;
        const team = engine.getTeam(engine.manager?.teamId);
        if (!team) {
            this._logAnomaly('TEAM_LOST', 'Team became null mid-game');
            return;
        }

        // === ANOMALIES ===
        // Squad too small
        if (team.squad && team.squad.length < 11) {
            this._logAnomaly('SQUAD_SHORT', `Squad has ${team.squad.length} players`, {
                squadSize: team.squad.length
            });
        }

        // Negative balance
        if (team.balance !== undefined && team.balance < -10000000) {
            this._logAnomaly('NEGATIVE_BALANCE', `Balance R$ ${team.balance}`, { balance: team.balance });
        }

        // Energy stuck low
        const avgEnergy = team.squad?.reduce((s, p) => s + (p.energy || 0), 0) / (team.squad?.length || 1);
        if (avgEnergy < 20) {
            this._logAnomaly('LOW_ENERGY_AVG', `Avg energy ${avgEnergy.toFixed(0)}%`, { avgEnergy });
        }

        // BUG-031 fix: dedupe TACTIC_STUCK (was 129× same log in playtest).
        // Only fire once per 38 weeks even if condition persists.
        if (this._consecutiveSameTactic > 30) {
            const week = engine.currentWeek || 0;
            const lastLogWeek = this._lastTacticStuckLogWeek || -999;
            if (week - lastLogWeek >= 38) {
                this._logAnomaly('TACTIC_STUCK', `Same tactic ${this._consecutiveSameTactic} weeks`, {
                    tactic: this._lastTactic
                });
                this._lastTacticStuckLogWeek = week;
            }
            this._consecutiveSameTactic = 0;
        }

        // Save corruption check
        if (engine.currentWeek > 38 * 100) {
            this._logAnomaly('WEEK_OVERFLOW', `currentWeek ${engine.currentWeek} suspicious`);
        }

        // === SUCCESS DETECTION ===
        // Streak insights
        const streak = engine.managerStats?.streak || 0;
        if (streak > this.stats.insights.longestWinStreak) {
            this.stats.insights.longestWinStreak = streak;
            if (streak >= 5) {
                this._logSuccess('WIN_STREAK', `${streak} vitórias seguidas`, { streak });
            }
        }
        if (streak < this.stats.insights.longestLossStreak) {
            this.stats.insights.longestLossStreak = streak;
            if (streak <= -5) {
                this._logSuccess('LOSS_STREAK', `${Math.abs(streak)} derrotas seguidas`, { streak });
            }
        }

        // Title/promotion detection (season transition)
        const seasonNum = engine.seasonNumber || 1;
        if (this._lastSeasonNumber !== null && seasonNum > this._lastSeasonNumber) {
            const titlesNow = engine.legacy?.titles?.length || 0;
            if (titlesNow > this._lastTitlesCount) {
                const newTitle = engine.legacy.titles[titlesNow - 1];
                this._logSuccess('TITLE_WON', `🏆 Título: ${newTitle?.title || 'Nacional'}`, {
                    title: newTitle?.title,
                    season: seasonNum - 1
                });
                this.stats.insights.titlesWon++;
            }
            this._lastTitlesCount = titlesNow;

            // Division change
            if (this._lastDivision !== null && team.division !== this._lastDivision) {
                if (team.division < this._lastDivision) {
                    this._logSuccess('PROMOTION', `⬆️ Subiu pra Série ${['A','B','C','D'][team.division - 1]}`, {
                        from: this._lastDivision,
                        to: team.division
                    });
                    this.stats.insights.promotionsWon++;
                } else {
                    this._logSuccess('RELEGATION', `⬇️ Caiu pra Série ${['A','B','C','D'][team.division - 1]}`, {
                        from: this._lastDivision,
                        to: team.division
                    });
                    this.stats.insights.relegationsTaken++;
                }
            }
            this._lastDivision = team.division;
        }
        if (this._lastSeasonNumber === null) {
            this._lastSeasonNumber = seasonNum;
            this._lastTitlesCount = engine.legacy?.titles?.length || 0;
            this._lastDivision = team.division;
        } else {
            this._lastSeasonNumber = seasonNum;
        }

        // Hat-trick detection (squad scan)
        const hatTrickers = (team.squad || []).filter(p => p.career?.hatTricks > 0);
        const totalHatTricks = hatTrickers.reduce((s, p) => s + (p.career?.hatTricks || 0), 0);
        if (totalHatTricks > this.stats.insights.hatTricks) {
            const diff = totalHatTricks - this.stats.insights.hatTricks;
            this._logSuccess('HAT_TRICK', `🎩 ${diff} hat-trick(s) novo(s)`, { totalHatTricks });
            this.stats.insights.hatTricks = totalHatTricks;
        }

        // Balance peaks
        const balance = team.balance ?? 0;
        if (balance > this.stats.insights.peakBalance) {
            this.stats.insights.peakBalance = balance;
            if (balance >= 50000000 && balance % 50000000 < 100000) {
                this._logSuccess('BALANCE_PEAK', `💰 R$ ${(balance / 1e6).toFixed(0)}M`, { balance });
            }
        }
        if (balance < this.stats.insights.lowestBalance) {
            this.stats.insights.lowestBalance = balance;
        }

        // Position peaks
        try {
            const standings = engine.getStandings(team.zone, team.division);
            const pos = standings.findIndex(s => s.teamId === team.id) + 1;
            if (pos > 0 && pos < this.stats.insights.peakStanding) {
                this.stats.insights.peakStanding = pos;
            }
            if (pos > this.stats.insights.worstStanding) {
                this.stats.insights.worstStanding = pos;
            }
        } catch { /* ignore */ }
    }

    getStats() {
        return {
            ...this.stats,
            elapsedMs: this.stats.startTime ? Date.now() - this.stats.startTime : 0,
            weeksPerSecond: this.stats.weeksPlayed / Math.max(1, ((Date.now() - this.stats.startTime) / 1000)),
            running: this.running,
            currentWeek: this.engine?.currentWeek,
            currentSeason: this.engine?.seasonNumber,
            telemetry: this.lastTelemetryReport
        };
    }

    exportReport() {
        const stats = this.getStats();
        const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elifoot-autoplay-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportTelemetryReport() {
        const payload = this.telemetry.exportJSON();
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elifoot-telemetry-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Singleton accessor
let _instance = null;
export function getAutoPlay(engine) {
    if (!_instance || _instance.engine !== engine) {
        _instance = new AutoPlayController(engine);
    }
    return _instance;
}

export const TRAINING_ROTATION_LIST = TRAINING_ROTATION;
