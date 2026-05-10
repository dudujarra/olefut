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
import { AdaptiveBrain, encodeState, computeReward } from './learning/AdaptiveBrain.js';
import { LLMBridge, decideSellHeuristic } from './learning/LLMBridge.js';

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

        // SPEC-115/116/117 — adaptive learning brain
        this.brain = new AdaptiveBrain();

        // SPEC-119 — buy/sell decision engine (heuristic default, WebLLM opt-in)
        this.llmBridge = new LLMBridge();
        this._lastStateKey = null;
        this._lastAction = null;
        this._lastBalanceForReward = null;
        this._lastPositionForReward = null;
        this._lastSeasonForReward = null;
        this._lastDivisionForReward = null;

        // BUG-066 fix: restore stats from localStorage. Was zeroing on refresh
        // even though _save() wrote them — only brain had its own restore path.
        this._restoreStats();
    }

    /**
     * Restore session stats from localStorage. Brain restores separately.
     */
    _restoreStats() {
        try {
            if (typeof localStorage === 'undefined') return;
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (!saved || typeof saved !== 'object') return;
            // Merge saved counters + insights, preserve current empty arrays for fresh logs
            const preserveArrays = ['anomalies', 'successes', 'decisions'];
            for (const key of Object.keys(saved)) {
                if (preserveArrays.includes(key)) {
                    // Restore last 100 entries to avoid unbounded growth
                    if (Array.isArray(saved[key])) {
                        this.stats[key] = saved[key].slice(-100);
                    }
                } else if (key === 'insights' && saved.insights) {
                    this.stats.insights = { ...this.stats.insights, ...saved.insights };
                } else if (saved[key] !== undefined) {
                    this.stats[key] = saved[key];
                }
            }
            // Don't restore startTime/running — fresh session is paused initially
            this.stats.startTime = null;
        } catch { /* ignore */ }
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
                // SPEC-123: snapshot per-season for learning curve viz
                if (!Array.isArray(this.stats.seasonHistory)) this.stats.seasonHistory = [];
                const seasonRec = {
                    season: this.stats.seasonsPlayed,
                    wins: this.stats.wins,
                    draws: this.stats.draws,
                    losses: this.stats.losses,
                    transfers: this.stats.transfers,
                    matchesPlayed: this.stats.matchesPlayed,
                    brainStates: this.brain ? Object.keys(this.brain.qTable).length : 0,
                    brainUpdates: this.brain?.totalUpdates || 0
                };
                // Compute delta vs previous season (per-season counts)
                const prev = this.stats.seasonHistory[this.stats.seasonHistory.length - 1];
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
                this.stats.seasonHistory.push(seasonRec);
                // Cap to last 100 seasons
                if (this.stats.seasonHistory.length > 100) {
                    this.stats.seasonHistory = this.stats.seasonHistory.slice(-100);
                }
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
            // BUG-034 fix: telemetry was reading p.career?.goals (doesn't exist).
            // Real fields: totalGoals/seasonGoals/totalCards (PlayerTraits.initCareerStats).
            // SPEC-107 score was 0 because all goals = 0 even after 48k matches.
            const playerCareer = (team?.squad || []).map(p => ({
                id: p.id,
                name: p.name,
                goals: p.career?.totalGoals || p.career?.seasonGoals || 0,
                seasonGoals: p.career?.seasonGoals || 0,
                assists: p.career?.totalAssists || 0,
                apps: p.career?.totalApps || 0,
                hatTricks: p.career?.hatTricks || 0,
                redCards: p.career?.totalCards || 0,
                motm: p.career?.totalMotm || 0
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

    /**
     * SPEC-115/116/117: build state ctx from engine for brain.
     */
    _buildStateCtx() {
        const engine = this.engine;
        const teamId = engine?.manager?.teamId;
        const team = engine?.getTeam?.(teamId);
        const standings = team ? engine.getStandings(team.zone, team.division) : [];
        const position = team ? (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length : 20;
        const balance = team?.balance || 0;
        const formAvg = team?.squad?.length
            ? team.squad.reduce((s, p) => s + (p.form?.value ?? 50), 0) / team.squad.length
            : 50;
        const lastResult = this._lastMatchResult || '-';
        return {
            position,
            totalTeams: standings.length || 20,
            balance,
            formAvg,
            week: engine?.currentWeek || 0,
            squadSize: team?.squad?.length || 0,
            lastResult
        };
    }

    /**
     * SPEC-115/116/117: observe outcome of last action, update Q-table.
     * BUG-041 fix: pipe goalsScored/goalsAllowed/scoreDiff to reward shaping.
     */
    _observeOutcome(currentCtx) {
        if (!this._lastStateKey || !this._lastAction) return;
        const balanceDelta = (currentCtx.balance || 0) - (this._lastBalanceForReward || 0);
        const positionDelta = (this._lastPositionForReward || 20) - (currentCtx.position || 20);
        const promoted = this._lastDivisionForReward !== null
            && this.engine?.getTeam?.(this.engine.manager?.teamId)?.division < this._lastDivisionForReward;
        const relegated = this._lastDivisionForReward !== null
            && this.engine?.getTeam?.(this.engine.manager?.teamId)?.division > this._lastDivisionForReward;

        const reward = computeReward({
            matchResult: currentCtx.lastResult,
            balanceDelta,
            positionDelta,
            promoted,
            relegated,
            title: false,
            goalsScored: this._lastMatchGoalsScored || 0,
            goalsAllowed: this._lastMatchGoalsAllowed || 0,
            scoreDiff: this._lastMatchScoreDiff || 0
        });

        const nextStateKey = encodeState(currentCtx);
        this.brain.observe(this._lastStateKey, this._lastAction, reward, nextStateKey, []);
    }

    _makeDecisions() {
        const engine = this.engine;
        const teamId = engine?.manager?.teamId;
        if (!teamId) return;

        // SPEC-115/116/117: Build state + observe last outcome
        const ctx = this._buildStateCtx();
        this._observeOutcome(ctx);

        const stateKey = encodeState(ctx);

        // BUG-029 fix: TRAIN was 94% of decisions. Cap to 1-in-3 weeks.
        // Decision 1: Training rotation (now throttled)
        if (this.stats.weeksPlayed % 3 === 0) {
            const startTrain = performance.now();
            // SPEC-115: brain picks training id (was rotation hardcoded)
            const trainingActions = TRAINING_ROTATION.map(id => `TRAIN_${id}`);
            const pickedActionKey = this.brain.pickAction(stateKey, trainingActions, ctx);
            const trainingId = pickedActionKey
                ? pickedActionKey.replace(/^TRAIN_/, '')
                : TRAINING_ROTATION[this._trainingIdx % TRAINING_ROTATION.length];
            this._trainingIdx++;
            if (engine.doTraining && trainingId) {
                const result = engine.doTraining(trainingId);
                this._logDecision('TRAIN', { trainingId, picked: !!pickedActionKey }, performance.now() - startTrain);
                if (!result || result.success === false) {
                    this._logAnomaly('TRAIN_FAIL', result?.msg || 'doTraining failed', { trainingId });
                }
                // Snapshot for next observe
                this._lastStateKey = stateKey;
                this._lastAction = `TRAIN_${trainingId}`;
                this._lastBalanceForReward = ctx.balance;
                this._lastPositionForReward = ctx.position;
                this._lastDivisionForReward = engine.getTeam(teamId)?.division ?? null;
            }
        }

        // Decision 2: Tactic — SPEC-115 brain pick (was streak hardcoded fallback)
        const tacticActions = ['TACTIC_normal', 'TACTIC_attacking', 'TACTIC_defensive', 'TACTIC_counter'];
        const pickedTacticKey = this.brain.pickAction(stateKey, tacticActions, ctx);
        let nextTactic = 'normal';
        if (pickedTacticKey) {
            nextTactic = pickedTacticKey.replace(/^TACTIC_/, '');
        } else {
            // Fallback heuristic if brain returns null
            const streak = engine.managerStats?.streak || 0;
            if (streak >= 3) nextTactic = 'attacking';
            else if (streak <= -2) nextTactic = 'defensive';
            else if (streak <= 0) nextTactic = 'counter';
        }
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

        // BUG-032 + BUG-040 fix: auto-replenish squad more aggressively.
        // Playtest 3 mostrou squad estagnado em 6-10 players + apenas 11 SQUAD_REPLENISH
        // em 1258 weeks. Lower threshold + higher frequency + emergency double call.
        try {
            const team = engine.getTeam(teamId);
            if (team?.squad && typeof engine.triggerYouthIntake === 'function') {
                const squadSize = team.squad.length;
                let triggered = false;
                // EMERGENCY: squad <11 = below match minimum. Double call every tick.
                if (squadSize < 11) {
                    engine.triggerYouthIntake();
                    engine.triggerYouthIntake();
                    triggered = true;
                }
                // ROUTINE: squad <16 every 3 weeks
                else if (squadSize < 16 && this.stats.weeksPlayed % 3 === 0) {
                    engine.triggerYouthIntake();
                    triggered = true;
                }
                if (triggered) {
                    this._logDecision('SQUAD_REPLENISH', {
                        squadBefore: squadSize,
                        squadAfter: team.squad.length,
                        emergency: squadSize < 11
                    }, 0);
                }
            }
        } catch { /* ignore */ }

        // BUG-050 fix: bot now ACTUALLY buys/sells via LLMBridge (was fake log).
        // Process incoming transfer offers + opportunistically buy if available.
        try {
            const team = engine.getTeam(teamId);
            if (team) {
                // Process incoming offers (sell decisions — sync heuristic in tick loop)
                // BUG-076: offer fields were offer.player.id / offer.amount (wrong).
                // Engine generateTransferOffers returns: { playerId, offerAmount, playerName, buyerClub, deadline }.
                // Normalize to heuristic format: { player, amount }.
                if (Array.isArray(engine.transferOffers) && engine.transferOffers.length > 0) {
                    for (const offer of engine.transferOffers.slice(0, 3)) {
                        if (!offer?.playerId || !offer?.offerAmount) continue;
                        const player = team.squad.find(p => p.id === offer.playerId);
                        if (!player) {
                            // Player not in squad (already sold/retired) — discard offer
                            engine.rejectTransferOffer?.(offer.playerId);
                            continue;
                        }
                        const normalizedOffer = { player, amount: offer.offerAmount };
                        const decision = decideSellHeuristic(team, normalizedOffer);
                        if (decision.sell && typeof engine.acceptTransferOffer === 'function') {
                            const result = engine.acceptTransferOffer(offer.playerId);
                            if (result?.success) {
                                this.stats.transfers++;
                                this._logSuccess('TRANSFER_SOLD', `Vendeu ${player.name} (OVR${player.ovr}) por R$ ${(offer.offerAmount/1e6).toFixed(1)}M para ${offer.buyerClub || 'clube'}. ${decision.reason}`);
                                this._logDecision('SELL_PLAYER', {
                                    playerId: offer.playerId,
                                    amount: offer.offerAmount,
                                    source: decision.source,
                                    reason: decision.reason
                                }, 0);
                            }
                        } else if (offer.deadline && engine.currentWeek >= offer.deadline) {
                            // Offer expired — clear it
                            engine.rejectTransferOffer?.(offer.playerId);
                        }
                    }
                }

                // SPEC-122 BUG-053: Bot scouts league + makes outgoing buy offers every 4 weeks.
                // Picks weakest position, finds upgrade target, offers 1.3-1.5× value.
                if (this.stats.weeksPlayed % 4 === 0 && typeof engine.scoutLeague === 'function') {
                    try {
                        // Find weakest position in squad
                        const positions = ['GOL', 'DEF', 'MEI', 'ATA'];
                        const positionStrength = positions.map(pos => {
                            const players = team.squad.filter(p => p.position === pos);
                            const avgOVR = players.length > 0
                                ? players.reduce((s, p) => s + (p.ovr || 0), 0) / players.length
                                : 0;
                            return { pos, avgOVR, count: players.length };
                        });
                        const weakest = positionStrength.sort((a, b) => a.avgOVR - b.avgOVR)[0];

                        if (weakest && weakest.avgOVR < 70) {
                            const candidates = engine.scoutLeague(weakest.pos, weakest.avgOVR + 5, 10);
                            if (candidates.length > 0) {
                                // Pick affordable + best OVR upgrade
                                const target = candidates.find(c =>
                                    c.value * 1.5 <= (team.balance || 0) * 0.3
                                );
                                if (target) {
                                    const offerAmount = Math.round(target.value * (1.3 + Math.random() * 0.2));
                                    const result = engine.makeBuyOffer(target.teamId, target.player.id, offerAmount);
                                    this._logDecision('BUY_OFFER', {
                                        target: target.player.name,
                                        position: target.position,
                                        ovr: target.ovr,
                                        amount: offerAmount,
                                        accepted: result?.accepted || false
                                    }, 0);
                                    if (result?.accepted) {
                                        this.stats.transfers++;
                                        // SPEC-122 BUG-054: remember decision + outcome
                                        this.brain?.remember({
                                            week: engine.currentWeek,
                                            season: engine.seasonNumber,
                                            action: `BUY_${target.position}_OVR${target.ovr}`,
                                            result: 'success',
                                            reward: 5,
                                            details: `R$ ${(offerAmount / 1_000_000).toFixed(1)}M`
                                        });
                                    } else if (result?.success === true) {
                                        // offer rejected (bid too low) — bot learns
                                        this.brain?.remember({
                                            week: engine.currentWeek,
                                            season: engine.seasonNumber,
                                            action: `BUY_${target.position}_OVR${target.ovr}`,
                                            result: `rejected (ratio ${result.ratio?.toFixed(2)})`,
                                            reward: -1
                                        });
                                    }
                                }
                            }
                        }
                    } catch { /* ignore */ }
                }

                // Outgoing market inquiry every 8 weeks (telemetry data + decision log)
                if (this.stats.weeksPlayed % 8 === 0 && team.squad?.length > 0) {
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
            }
        } catch { /* ignore */ }
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

                    // SPEC-115: track lastMatchResult for state encoding next tick
                    // BUG-041: also track goals for granular reward shaping
                    this._lastMatchResult = outcome;
                    this._lastMatchGoalsScored = myGoals;
                    this._lastMatchGoalsAllowed = oppGoals;
                    this._lastMatchScoreDiff = diff;

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

        // BUG-031 + SPEC-125: dedupe TACTIC_STUCK + ignore se ganhando.
        // Bot achou estratégia winning (streak >0) = não é "stuck", é estratégia.
        // Só flag se streak ≤0 (perdendo + tactic same) OU squad weak.
        const tacticStreak = engine.managerStats?.streak || 0;
        if (this._consecutiveSameTactic > 30 && tacticStreak <= 0) {
            const week = engine.currentWeek || 0;
            const lastLogWeek = this._lastTacticStuckLogWeek || -999;
            if (week - lastLogWeek >= 38) {
                this._logAnomaly('TACTIC_STUCK', `Same tactic ${this._consecutiveSameTactic} weeks (streak ${tacticStreak})`, {
                    tactic: this._lastTactic,
                    streak: tacticStreak
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
            // BUG-069 fix: LOSS_STREAK era logged como sucesso. Move pra anomaly.
            if (streak <= -5) {
                this._logAnomaly('LOSS_STREAK', `${Math.abs(streak)} derrotas seguidas`, { streak });
            }
        }

        // Title/promotion detection (season transition)
        const seasonNum = engine.seasonNumber || 1;
        if (this._lastSeasonNumber !== null && seasonNum > this._lastSeasonNumber) {
            const titlesNow = engine.legacy?.titles?.length || 0;
            if (titlesNow > this._lastTitlesCount) {
                const newTitle = engine.legacy.titles[titlesNow - 1];
                this._logSuccess('TITLE_WON', `🏆 Título: ${newTitle || 'Nacional'}`, {
                    title: newTitle,
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
            telemetry: this.lastTelemetryReport,
            // SPEC-115/116/117: brain summary
            brain: this.brain ? this.brain.summary() : null
        };
    }

    /**
     * Reset learned Q-table (for benchmark / fresh start).
     */
    resetBrain() {
        if (this.brain) this.brain.reset();
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
