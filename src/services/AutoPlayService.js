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
import { LLMBridge, decideSellHeuristic, detectMonotonyHeuristic, generateGameDesignInsights } from './learning/LLMBridge.js';
import { applyChallengeMode, checkChallengeWin, getAllChallengeModes } from '../engine/ChallengeModes.js';
import { SessionMetrics } from '../components/GDDSystems.jsx';

import { rng as systemRng } from '../engine/rng.js';

const STORAGE_KEY = 'elifoot_autoplay_state';
// BUG-027 fix: pull training catalog from engine source of truth (was hardcoded
// list with invalid IDs cardio/defensive/attacking causing 2416 TRAIN_FAIL).
const TRAINING_ROTATION = (TRAINING_TYPES || []).map(t => t.id).filter(Boolean);
const FORMATION_POOL = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2'];
const TELEMETRY_INTERVAL_WEEKS = 5;
// BUG-029 fix: rotation cap — TRAIN was 94% of decisions in playtest.
// Decision pool ensures TRAIN ≤30%, FORMATION/TACTIC/MARKET/VIEW share rest.
// SPEC-104: expanded to 10 views; 'press' renamed to 'pressView' to match KNOWN_VIEWS.
// Also includes matchView, rivalries, chronicle, achievements, monitor.
const VIEW_ROTATION = [
    'dashboard', 'squad', 'market', 'standings', 'pressView',
    'matchView', 'rivalries', 'chronicle', 'achievements', 'monitor'
];

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

        // §14.2: Challenge mode tracking
        this._challengeModesAvailable = getAllChallengeModes();

        // §17: Session time metrics
        this._sessionMetrics = new SessionMetrics();
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

            // §16.2: Auto-dismiss trophy ceremony (log it as success)
            if (this.engine.trophyCeremony) {
                this._logSuccess('TROPHY_CEREMONY', `🏆 Cerimônia: ${this.engine.trophyCeremony.trophy}`, {
                    trophy: this.engine.trophyCeremony.trophy,
                    season: this.engine.trophyCeremony.season
                });
                this.engine.trophyCeremony = null;
            }

            // §14.2: Check challenge mode win condition
            try {
                const challengeWin = checkChallengeWin(this.engine);
                if (challengeWin) {
                    this._logSuccess('CHALLENGE_WIN', `🎯 Desafio "${challengeWin.name}" completo!`, {
                        mode: challengeWin.id, emoji: challengeWin.emoji
                    });
                }
            } catch { /* challenge non-critical */ }

            // §12.4 #6: Scarcity telemetry — log transfer window pressure
            try {
                const seasonWeek = ((this.engine.currentWeek - 1) % 38) + 1;
                const team = this.engine.getTeam(this.engine.manager?.teamId);
                if (seasonWeek >= 18 && seasonWeek <= 22 && team) {
                    this._logDecision('SCARCITY_WINDOW', {
                        week: seasonWeek, balance: team.balance,
                        windowClosing: seasonWeek >= 21
                    }, 0);
                }
                // §12.4 #8: Loss avoidance dread telemetry
                if (team) {
                    const standings = this.engine.getStandings(team.zone, team.division);
                    const pos = standings?.findIndex(s => s.teamId === team.id);
                    const total = standings?.length || 20;
                    if (pos !== undefined && pos >= total - 4) {
                        this._logDecision('DREAD_RELEGATION', {
                            position: pos + 1, total, boardConf: this.engine.board?.confidence
                        }, 0);
                    }
                }
            } catch { /* scarcity non-critical */ }

            // §17: Track session metrics
            this._sessionMetrics.recordAction();

            // §17: Auto-answer press conferences (random option)
            try {
                if (typeof this.engine.checkPressConference === 'function') {
                    const question = this.engine.checkPressConference();
                    if (question && question.options?.length > 0) {
                        const pick = question.options[Math.floor(systemRng() * question.options.length)];
                        const result = this.engine.answerPress(pick.id);
                        this._logDecision('PRESS_CONFERENCE', {
                            context: question.context,
                            answered: pick.id,
                            moraleDelta: result?.moraleDelta || 0
                        }, 0);
                    }
                }
            } catch { /* press non-critical */ }

            // §15.4: PWA notification trigger on milestones (non-blocking)
            try {
                if (this.stats.weeksPlayed % 38 === 0) {
                    // Season end — trigger notification if PWAService available
                    if (typeof window !== 'undefined' && window.__pwaService) {
                        window.__pwaService.notifySeasonEnd?.(this.engine.seasonNumber);
                    }
                }
            } catch { /* PWA non-critical */ }

            // === HUMAN-PARITY INTERACTIONS (mirror what player does in UI) ===

            // Team Talk — human does this before matches (Dashboard + MatchView)
            try {
                if (typeof this.engine.doTeamTalk === 'function' && this.stats.weeksPlayed % 2 === 0) {
                    const talks = TEAM_TALKS || [];
                    if (talks.length > 0) {
                        const pick = talks[Math.floor(systemRng() * talks.length)];
                        const result = this.engine.doTeamTalk(pick.id);
                        if (result?.success) {
                            this._logDecision('TEAM_TALK', { talkId: pick.id, name: pick.name }, 0);
                        }
                    }
                }
            } catch { /* team talk non-critical */ }

            // Contract Renewals — human renews expiring contracts in SquadView
            try {
                const team = this.engine.getTeam(this.engine.manager?.teamId);
                if (team?.squad && typeof this.engine.renewContract === 'function') {
                    const expiring = team.squad.filter(p =>
                        p.contract && p.contract.endSeason <= (this.engine.seasonNumber || 1) + 1
                    );
                    for (const p of expiring.slice(0, 3)) {
                        const result = this.engine.renewContract(p.id);
                        if (result?.success) {
                            this._logDecision('RENEW_CONTRACT', {
                                playerId: p.id, name: p.name, ovr: p.ovr
                            }, 0);
                        }
                    }
                }
            } catch { /* contract non-critical */ }

            // Coach Proposals — human accepts/rejects in DashboardView
            try {
                if (this.engine.pendingCoachProposal) {
                    const proposal = this.engine.pendingCoachProposal;
                    // Bot always refuses (stays at current club) — like a loyal manager
                    if (typeof this.engine.respondCoachProposal === 'function') {
                        this.engine.respondCoachProposal(false);
                    } else {
                        // Fallback: just dismiss
                        this.engine.pendingCoachProposal = null;
                    }
                    this._logDecision('COACH_PROPOSAL_REFUSED', {
                        from: proposal.fromClubName,
                        reason: proposal.reason
                    }, 0);
                }
            } catch { /* proposal non-critical */ }

            // Scout Regions — human scouts in DashboardView/MarketView
            try {
                if (typeof this.engine.scoutRegionAction === 'function' && this.stats.weeksPlayed % 6 === 0) {
                    const regions = this.engine.scoutRegions || [];
                    if (regions.length > 0) {
                        const region = regions[Math.floor(systemRng() * regions.length)];
                        const result = this.engine.scoutRegionAction(region.id);
                        if (result?.players?.length > 0) {
                            this._logDecision('SCOUT_REGION', {
                                region: region.name || region.id,
                                found: result.players.length
                            }, 0);
                        }
                    }
                }
            } catch { /* scout non-critical */ }

            // Week Events — human reads narrative events in DashboardView
            try {
                const events = this.engine.weekEvents;
                if (Array.isArray(events) && events.length > 0) {
                    for (const ev of events) {
                        this._logDecision('NARRATIVE_EVENT', {
                            type: ev.type || 'unknown',
                            text: (ev.text || ev.msg || '').slice(0, 80)
                        }, 0);
                    }
                    // Track event variety for telemetry
                    if (!this.stats._eventTypes) this.stats._eventTypes = {};
                    events.forEach(ev => {
                        const t = ev.type || 'unknown';
                        this.stats._eventTypes[t] = (this.stats._eventTypes[t] || 0) + 1;
                    });
                }
            } catch { /* events non-critical */ }

            // Season Awards — human sees awards banner in DashboardView
            try {
                if (Array.isArray(this.engine.seasonAwards) && this.engine.seasonAwards.length > 0) {
                    for (const award of this.engine.seasonAwards) {
                        this._logSuccess('SEASON_AWARD', `🏅 ${award.title || award.name || 'Prêmio'}`, {
                            award: award.title || award.name,
                            player: award.playerName || award.player
                        });
                    }
                    // Clear after consuming (like UI does on next render)
                    this.engine.seasonAwards = [];
                }
            } catch { /* awards non-critical */ }

            // Active Challenge — human tracks in DashboardView
            try {
                if (this.engine.activeChallenge) {
                    const ch = this.engine.activeChallenge;
                    if (ch.completed) {
                        this._logSuccess('CHALLENGE_COMPLETED', `🎯 ${ch.description}`, {
                            reward: ch.reward
                        });
                    }
                    // Log active challenge progress for telemetry
                    if (!this.stats._challengesSeen) this.stats._challengesSeen = 0;
                    this.stats._challengesSeen++;
                }
            } catch { /* challenge non-critical */ }

            // Board Tension — human reads in DashboardView (no action, just observe)
            try {
                if (typeof this.engine.boardTension === 'number') {
                    if (!this.stats._boardTensionHistory) this.stats._boardTensionHistory = [];
                    this.stats._boardTensionHistory.push(this.engine.boardTension);
                    if (this.stats._boardTensionHistory.length > 200) {
                        this.stats._boardTensionHistory = this.stats._boardTensionHistory.slice(-100);
                    }
                }
            } catch { /* board non-critical */ }

            // Hall of Legends — human views in DashboardView
            try {
                if (this.engine.hallOfLegends?.filledCount > 0) {
                    if (!this.stats._hallOfLegendsCount) this.stats._hallOfLegendsCount = 0;
                    if (this.engine.hallOfLegends.filledCount > this.stats._hallOfLegendsCount) {
                        this._logSuccess('HALL_OF_LEGENDS', `⭐ ${this.engine.hallOfLegends.filledCount} lendas`, {
                            count: this.engine.hallOfLegends.filledCount
                        });
                        this.stats._hallOfLegendsCount = this.engine.hallOfLegends.filledCount;
                    }
                }
            } catch { /* hall non-critical */ }

            // Sign Scouted Players — human signs in MarketView/DashboardView
            try {
                if (Array.isArray(this.engine.scoutedPlayers) && this.engine.scoutedPlayers.length > 0
                    && typeof this.engine.signScoutedPlayer === 'function') {
                    const team = this.engine.getTeam(this.engine.manager?.teamId);
                    // Sign if squad small or player is upgrade (OVR > squad avg)
                    const avgOVR = team?.squad?.length
                        ? team.squad.reduce((s, p) => s + (p.ovr || 0), 0) / team.squad.length : 50;
                    for (let i = this.engine.scoutedPlayers.length - 1; i >= 0; i--) {
                        const sp = this.engine.scoutedPlayers[i];
                        const isUpgrade = (sp.ovr || 0) >= avgOVR;
                        const needsPlayers = (team?.squad?.length || 0) < 22;
                        if (isUpgrade || needsPlayers) {
                            const result = this.engine.signScoutedPlayer(i);
                            if (result?.success) {
                                this._logDecision('SIGN_SCOUTED', {
                                    name: sp.name, ovr: sp.ovr, position: sp.position
                                }, 0);
                                this.stats.transfers++;
                                break; // one per tick max
                            }
                        }
                    }
                }
            } catch { /* sign non-critical */ }

            // Staff Management — human hires/fires in DashboardView
            try {
                if (typeof this.engine.hireStaff === 'function' && this.stats.weeksPlayed % 38 === 1) {
                    const team = this.engine.getTeam(this.engine.manager?.teamId);
                    if (team && (team.balance || 0) > 2_000_000) {
                        const roles = ['scout', 'physio', 'assistant', 'fitness'];
                        const staff = this.engine.staff || {};
                        for (const role of roles) {
                            if (!staff[role]) {
                                const result = this.engine.hireStaff(role);
                                if (result?.success) {
                                    this._logDecision('HIRE_STAFF', { role }, 0);
                                    break;
                                }
                            }
                        }
                    }
                }
            } catch { /* staff non-critical */ }

            // Loan Players — human loans bench in SquadView
            try {
                if (typeof this.engine.loanPlayer === 'function' && this.stats.weeksPlayed % 19 === 0) {
                    const team = this.engine.getTeam(this.engine.manager?.teamId);
                    if (team?.squad?.length > 22) {
                        // Loan lowest OVR non-titular
                        const bench = team.squad.filter(p => !p.isTitular && !p.injury && (p.ovr || 0) < 60);
                        bench.sort((a, b) => (a.ovr || 0) - (b.ovr || 0));
                        if (bench.length > 0) {
                            const p = bench[0];
                            const result = this.engine.loanPlayer(p.id, 20);
                            if (result?.success) {
                                this._logDecision('LOAN_OUT', {
                                    name: p.name, ovr: p.ovr, weeks: 20
                                }, 0);
                            }
                        }
                    }
                }
            } catch { /* loan non-critical */ }

            // Live Substitutions — human subs during MatchView
            // Note: advanceWeek runs full match internally, so we simulate
            // tactical sub decisions by checking post-match if subs would help
            try {
                if (typeof this.engine.applyLiveSubstitution === 'function') {
                    const team = this.engine.getTeam(this.engine.manager?.teamId);
                    if (team?.squad) {
                        // Find exhausted titulars + fresh bench
                        const tired = team.squad.filter(p => p.isTitular && (p.energy || 100) < 40);
                        const fresh = team.squad.filter(p => !p.isTitular && !p.injury && (p.energy || 0) > 70);
                        if (tired.length > 0 && fresh.length > 0) {
                            // Sort fresh by OVR to pick best
                            fresh.sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
                            const out = tired[0];
                            const inP = fresh[0];
                            try {
                                this.engine.applyLiveSubstitution(out.id, inP.id, 65);
                                this._logDecision('SUBSTITUTION', {
                                    out: out.name, in: inP.name,
                                    outEnergy: out.energy, inOvr: inP.ovr
                                }, 0);
                            } catch { /* sub may fail if not mid-match */ }
                        }
                    }
                }
            } catch { /* sub non-critical */ }

            // Save every 38 weeks (1 season)
            if (this.stats.weeksPlayed % 38 === 0) {
                this.stats.seasonsPlayed++;
                // §17: Record match for session metrics
                this._sessionMetrics.recordMatch();
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
                    brainUpdates: this.brain?.totalUpdates || 0,
                    // §17: Session metrics snapshot
                    sessionMetrics: this._sessionMetrics.getMetrics(),
                    coreLoopFast: this._sessionMetrics.isCoreLoopFast()
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
        
        let lossStreak = 0;
        if (engine.managerStats?.streak < 0) {
            lossStreak = Math.abs(engine.managerStats.streak);
        }

        return {
            position,
            totalTeams: standings.length || 20,
            balance,
            formAvg,
            week: engine?.currentWeek || 0,
            squadSize: team?.squad?.length || 0,
            lastResult,
            lossStreak
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

        // MARL Fase 3: Prospect Theory — pass emotional loss modifier to reward shaping
        const emoMods = this.brain.emotions ? this.brain.emotions.getModifiers() : { lossMod: 1.0 };

        const reward = computeReward({
            matchResult: currentCtx.lastResult,
            balanceDelta,
            positionDelta,
            promoted,
            relegated,
            title: false,
            goalsScored: this._lastMatchGoalsScored || 0,
            goalsAllowed: this._lastMatchGoalsAllowed || 0,
            scoreDiff: this._lastMatchScoreDiff || 0,
            emotionalLossMod: emoMods.lossMod
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
            // BUG-081: boredom override — force rotation if same tactic >12 weeks and not winning big
            const tacticStreak = engine.managerStats?.streak || 0;
            if (this._consecutiveSameTactic > 12 && tacticStreak < 5) {
                const allTactics = ['normal', 'offensive', 'defensive', 'pressing', 'counter', 'possession'];
                const others = allTactics.filter(t => t !== nextTactic);
                nextTactic = others[Math.floor(systemRng() * others.length)];
                this._consecutiveSameTactic = 0;
            }
            engine.setTactic(nextTactic);
            if (this._lastTactic === nextTactic) this._consecutiveSameTactic++;
            else this._consecutiveSameTactic = 0;
            this._lastTactic = nextTactic;
        }

        // Decision 2b: Monotony detection — every 4 weeks apply suggestions
        if (this.stats.weeksPlayed % 4 === 0) {
            try {
                const team = engine.getTeam(teamId);
                const standings = team ? engine.getStandings(team.zone, team.division) : [];
                const position = team ? (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length : 10;
                const avgOVR = team?.squad?.length
                    ? team.squad.reduce((s, p) => s + (p.ovr || 0), 0) / team.squad.length : 60;
                const totalMatches = this.stats.wins + this.stats.draws + this.stats.losses;
                const winRate = totalMatches > 0 ? this.stats.wins / totalMatches : 0.33;

                if (!this._positionHistory) this._positionHistory = [];
                this._positionHistory.push(position);
                if (this._positionHistory.length > 12) this._positionHistory.shift();
                const positionStreak = this._positionHistory.filter(p => p === position).length;

                const monotony = detectMonotonyHeuristic({
                    currentTactic: nextTactic,
                    tacticStreak: this._consecutiveSameTactic,
                    position,
                    positionStreak,
                    streak: engine.managerStats?.streak || 0,
                    avgOVR,
                    balance: team?.balance || 0,
                    squadSize: team?.squad?.length || 0,
                    division: team?.division || 4,
                    seasonNumber: engine.seasonNumber || 1,
                    winRate
                });

                if (monotony.monotonous && monotony.topSuggestion) {
                    const s = monotony.topSuggestion;
                    if (s.action === 'CHANGE_TACTIC' && s.value && engine.setTactic) {
                        engine.setTactic(s.value);
                        this._consecutiveSameTactic = 0;
                        this._lastTactic = s.value;
                        this._logDecision('TACTIC_OVERRIDE', { tactic: s.value, reason: s.reason }, 0);
                    } else if (s.action === 'CHANGE_FORMATION' && engine.setFormation) {
                        const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '5-3-2', '4-2-3-1'];
                        const current = team?.formation || '4-3-3';
                        const alt = FORMATIONS.find(f => f !== current) || '4-4-2';
                        engine.setFormation(alt);
                        this._logDecision('FORMATION', { form: alt, reason: s.reason }, 0);
                    } else if (s.action === 'SCOUT' && engine.scoutLeague) {
                        // Trigger scout on next buy cycle (flag only)
                        this._urgentScout = true;
                    }
                    // Log monotony signals for telemetry
                    monotony.signals.forEach(sig => {
                        if (sig.id === 'TACTIC_STUCK') this._logAnomaly('TACTIC_STUCK', sig.msg, { tactic: nextTactic, streak: this._consecutiveSameTactic });
                    });
                }
            } catch { /* ignore */ }
        }

        // Decision 3: Formation occasional rotate
        if (this.stats.weeksPlayed % 19 === 0 && engine.setFormation) {
            const form = FORMATION_POOL[Math.floor(systemRng() * FORMATION_POOL.length)];
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

        // Decision 5: Stadium/Academy upgrade every 2 seasons (was 5 — too slow, balance stagnated).
        // SPEC-100: more frequent big spending increases balance variance (CV was 1.1%).
        if (this.stats.seasonsPlayed > 0 && this.stats.seasonsPlayed % 2 === 0 && this.stats.weeksPlayed % 38 === 1) {
            const team = engine.getTeam(teamId);
            if (team && team.balance > 3_000_000) {
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

        // BUG-080: emergency sell when deeply negative balance
        try {
            const team = engine.getTeam(teamId);
            if (team && (team.balance || 0) < -5_000_000) {
                this._emergencySell(team);
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
                // BUG-080: skip buys when balance is negative (salary drain spiral prevention)
                if (this.stats.weeksPlayed % 4 === 0 && typeof engine.scoutLeague === 'function' && (team.balance || 0) > 0) {
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

                        // Urgent scout flag from monotony detector
                        const urgentScout = this._urgentScout;
                        if (urgentScout) this._urgentScout = false;

                        if (weakest && (weakest.avgOVR < 70 || urgentScout)) {
                            const candidates = engine.scoutLeague(weakest.pos, weakest.avgOVR + 5, 10);
                            if (candidates.length > 0) {
                                // Pick affordable + best OVR upgrade
                                // Use ovr-based value fallback if value not set (bug: player.value undefined → offer = 0)
                                const target = candidates.find(c => {
                                    const v = c.value || (c.ovr || 60) * 50_000;
                                    return v * 1.5 <= (team.balance || 0) * 0.3;
                                });
                                if (target) {
                                    const playerVal = target.value || (target.ovr || 60) * 50_000;
                                    const offerAmount = Math.round(playerVal * (1.3 + systemRng() * 0.2));
                                    const result = engine.makeBuyOffer(target.teamId, target.player.id, offerAmount);
                                    // BUG-078: log real buy offer result to history.offers for SPEC-111
                                    if (this.telemetry?.history) {
                                        if (!Array.isArray(this.telemetry.history.offers)) this.telemetry.history.offers = [];
                                        this.telemetry.history.offers.push({
                                            week: engine.currentWeek,
                                            playerId: target.player?.id,
                                            amount: offerAmount,
                                            playerValue: playerVal,
                                            accepted: result?.accepted === true,
                                            simulated: false
                                        });
                                    }
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

                // Outgoing market inquiry every 8 weeks (decisions log only — NOT offers)
                // BUG-078: probes were being pushed to history.offers with no amount field,
                // causing SPEC-111 to see avgSpread=-1 (0% of value) and acceptanceRate=0%.
                // MARKET_INQUIRY is a valuation probe, not a real buy offer.
                if (this.stats.weeksPlayed % 8 === 0 && team.squad?.length > 0) {
                    const candidate = team.squad[Math.floor(systemRng() * team.squad.length)];
                    const playerVal = candidate.value || (candidate.ovr || 60) * 50_000;
                    const askPrice = playerVal * (1.2 + systemRng() * 0.6);
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
                        const standings = team ? this.engine.getStandings(team.zone, team.division) : [];
                        const myPos = team ? (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length : 10;
                        const oppId = isHome ? m.away : m.home;
                        const oppPos = standings.findIndex(s => s.teamId === oppId) + 1;
                        const n = standings.length;
                        // SPEC-108/102: mark as important if late season, top-3 clash, or promotion/relegation battle
                        const seasonWeek = this.engine.currentWeek;
                        const isTopClash = oppPos > 0 && oppPos <= 3 && myPos <= 6;
                        const isRelBattle = oppPos >= (n - 3) && myPos >= (n - 5);
                        const isDecisive = seasonWeek >= 34;
                        const isImportantMatch = m.isImportant || isTopClash || isRelBattle || isDecisive;
                        this.telemetry.record({
                            matchOutcome: {
                                week: seasonWeek,
                                season: this.engine.seasonNumber,
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
                    } catch { /* ignore */ }

                    // SPEC-115: track lastMatchResult for state encoding next tick
                    // BUG-041: also track goals for granular reward shaping
                    this._lastMatchResult = outcome;
                    this._lastMatchGoalsScored = myGoals;
                    this._lastMatchGoalsAllowed = oppGoals;
                    this._lastMatchScoreDiff = diff;

                    // MARL Fase 2: Feed EmotionalEngine with match result
                    try {
                        const streak = this.engine.managerStats?.streak || 0;
                        const isRelRisk = myPos > (n * 0.75);
                        this.brain.processMatchResult(outcome, streak, isRelRisk);
                    } catch { /* defensive — emotional engine must not break tick */ }

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

    // BUG-080: force-sell bench player (or weakest titular) to recover from death spiral
    _emergencySell(team) {
        const bench = team.squad.filter(p => !p.isTitular && !p._retired && !p.injury);
        bench.sort((a, b) => (b.value || 0) - (a.value || 0));
        if (bench.length > 0) {
            const p = bench[0];
            const amount = p.value || (p.ovr || 50) * 50_000;
            team.squad = team.squad.filter(x => x.id !== p.id);
            team.balance += amount;
            this._logDecision('EMERGENCY_SELL', { player: p.name, ovr: p.ovr, amount }, 0);
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
            this._logDecision('EMERGENCY_SELL_TITULAR', { player: weakest.name, ovr: weakest.ovr, amount }, 0);
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
                // MARL Fase 2: Title event → Emotional Engine
                try { this.brain.processSeasonEvent('TITLE'); } catch { /* defensive */ }
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
                    // MARL Fase 2: Promotion → Emotional Engine
                    try { this.brain.processSeasonEvent('PROMOTION'); } catch { /* defensive */ }
                } else {
                    this._logSuccess('RELEGATION', `⬇️ Caiu pra Série ${['A','B','C','D'][team.division - 1]}`, {
                        from: this._lastDivision,
                        to: team.division
                    });
                    this.stats.insights.relegationsTaken++;
                    // MARL Fase 2: Near-relegation → feed anxiety
                    try { this.brain.processSeasonEvent('RELEGATION_RISK'); } catch { /* defensive */ }
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
        const gameDesignInsights = this.lastTelemetryReport
            ? generateGameDesignInsights(this.lastTelemetryReport)
            : [];
        return {
            ...this.stats,
            elapsedMs: this.stats.startTime ? Date.now() - this.stats.startTime : 0,
            weeksPerSecond: this.stats.weeksPlayed / Math.max(1, ((Date.now() - this.stats.startTime) / 1000)),
            running: this.running,
            currentWeek: this.engine?.currentWeek,
            currentSeason: this.engine?.seasonNumber,
            telemetry: this.lastTelemetryReport,
            // SPEC-115/116/117: brain summary
            brain: this.brain ? this.brain.summary() : null,
            // Game design insights from telemetry analysis
            gameDesignInsights
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
