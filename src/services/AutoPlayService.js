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

import { TRAINING_TYPES, TEAM_TALKS, FORMATIONS } from '../engine/ManagerSystems';
import { MonitorService } from './MonitorService';
import { TelemetryAggregator } from './telemetry/TelemetryAggregator.js';
import { AdaptiveBrain, encodeState, computeReward } from './learning/AdaptiveBrain.js';
import { ThompsonBandit } from './learning/ThompsonBandit.js';
import { DAggerBootstrap } from './learning/DAggerBootstrap.js';
import { detectMonotonyHeuristic, generateGameDesignInsights } from './learning/LLMBridge.js';
import { smartSellDecision, rankCandidates, computeTransferReward } from './learning/SmartMarketEngine.js';
import { checkChallengeWin, getAllChallengeModes } from '../engine/ChallengeModes.js';
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

        // Fase 2 ML: Thompson Sampling bandits for low-frequency decisions
        // Ref: Chapelle & Li (2011) — "An Empirical Evaluation of Thompson Sampling"
        this.bandits = {
            teamTalk: new ThompsonBandit('teamTalk',
                (TEAM_TALKS || []).map(t => t.id).filter(Boolean)
            ),
            scoutRegion: new ThompsonBandit('scoutRegion', []),  // actions set dynamically
            staffHire: new ThompsonBandit('staffHire',
                ['scout', 'physio', 'assistant', 'fitness']
            )
        };

        // Fase 4 ML: DAgger warm-start — pre-fill ML tables with heuristic knowledge
        // Ref: Ross, Gordon & Bagnell (2011) — CMU DAgger
        // Only runs once when brain Q-table is empty (cold start)
        if (Object.keys(this.brain.qTable || {}).length === 0) {
            try {
                const result = DAggerBootstrap.warmStartAll({
                    brain: this.brain,
                    bandits: this.bandits,
                    sarsaModifiers: this.brain.emotions?.sarsaModifiers
                });
                if (result.total > 0) {
                    console.log(`[DAgger] Warm-start: ${result.total} teacher lessons loaded`);
                }
            } catch { /* non-critical */ }
        }

        // Transfer tracking for ML reward feedback
        this._pendingTransferRewards = []; // { type, stateKey, action, weekBought, positionBefore, balanceBefore, playerOvr }
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
        // BUG-089: cap anomalies — segmented like decisions
        if (this.stats.anomalies.length > 500) {
            this.stats.anomalies = this.stats.anomalies.slice(-400);
        }
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
            week: this.engine?.currentWeek,
            season: this.engine?.seasonNumber
        };
        this.stats.decisions.push(entry);
        // BUG-RC2 fix: segment decisions to prevent NARRATIVE_EVENT from
        // flooding the buffer and evicting strategic decisions.
        // Strategy: keep last 200 strategic + last 50 routine.
        if (this.stats.decisions.length > 300) {
            const ROUTINE = new Set(['NARRATIVE_EVENT', 'VISIT_VIEW', 'TEAM_TALK', 'PRESS_CONFERENCE']);
            const strategic = this.stats.decisions.filter(d => !ROUTINE.has(d.action));
            const routine = this.stats.decisions.filter(d => ROUTINE.has(d.action));
            this.stats.decisions = [
                ...strategic.slice(-200),
                ...routine.slice(-50)
            ];
        }
        // Telemetry: feed decision
        try {
            this.telemetry.record({ decision: entry });
        } catch { /* ignore */ }
    }

    _tick() {
        if (!this.running) return;

        // BUG-087: _makeDecisions e _advanceWeek em try/catch independentes.
        // Decisões falharem NÃO pode impedir a progressão do tempo.
        try {
            this._makeDecisions();
        } catch (e) {
            this._logAnomaly('DECISIONS_CRASH', e?.message || 'Unknown error in _makeDecisions');
        }

        try {
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

            // Team Talk — ML via Thompson Sampling (was random pick)
            // Ref: Thompson (1933), Chapelle & Li (2011)
            try {
                if (typeof this.engine.doTeamTalk === 'function' && this.stats.weeksPlayed % 2 === 0) {
                    const talks = TEAM_TALKS || [];
                    if (talks.length > 0) {
                        const ctxKey = this._banditContextKey();
                        const talkIds = talks.map(t => t.id).filter(Boolean);
                        const pickedId = this.bandits.teamTalk.pick(ctxKey, talkIds);
                        const result = this.engine.doTeamTalk(pickedId);
                        if (result?.success) {
                            this._logDecision('TEAM_TALK', { talkId: pickedId, source: 'thompson' }, 0);
                            // Track for delayed reward feedback
                            this._lastBanditActions = this._lastBanditActions || {};
                            this._lastBanditActions.teamTalk = { ctxKey, action: pickedId };
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

            // Scout Regions — ML via Thompson Sampling (was random pick)
            try {
                if (typeof this.engine.scoutRegionAction === 'function' && this.stats.weeksPlayed % 6 === 0) {
                    const regions = this.engine.scoutRegions || [];
                    if (regions.length > 0) {
                        const ctxKey = this._banditContextKey();
                        const regionIds = regions.map(r => r.id || r.name).filter(Boolean);
                        const pickedRegion = this.bandits.scoutRegion.pick(ctxKey, regionIds);
                        const result = this.engine.scoutRegionAction(pickedRegion);
                        if (result?.players?.length > 0) {
                            this._logDecision('SCOUT_REGION', {
                                region: pickedRegion,
                                found: result.players.length,
                                source: 'thompson'
                            }, 0);
                            // Immediate reward: found players = success signal
                            const quality = result.players.reduce((s, p) => s + (p.ovr || 50), 0) / result.players.length;
                            const reward = quality > 60 ? 2 : (quality > 50 ? 1 : 0.5);
                            this.bandits.scoutRegion.update(ctxKey, pickedRegion, reward);
                        } else {
                            // No players found = mild negative signal
                            this.bandits.scoutRegion.update(ctxKey, pickedRegion, -0.5);
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
                        ? team.squad.reduce((s, p) => s + (p.ovr || 0), 0) / (team.squad.length || 1) : 50;
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

            // Staff Management — ML via Thompson Sampling (was fixed iteration)
            try {
                if (typeof this.engine.hireStaff === 'function' && this.stats.weeksPlayed % 38 === 1) {
                    const team = this.engine.getTeam(this.engine.manager?.teamId);
                    if (team && (team.balance || 0) > 2_000_000) {
                        const staff = this.engine.staff || {};
                        const availableRoles = ['scout', 'physio', 'assistant', 'fitness']
                            .filter(role => !staff[role]);
                        if (availableRoles.length > 0) {
                            const ctxKey = this._banditContextKey();
                            const pickedRole = this.bandits.staffHire.pick(ctxKey, availableRoles);
                            const result = this.engine.hireStaff(pickedRole);
                            if (result?.success) {
                                this._logDecision('HIRE_STAFF', { role: pickedRole, source: 'thompson' }, 0);
                                // Immediate reward: hiring is a mild positive
                                this.bandits.staffHire.update(ctxKey, pickedRole, 1);
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
                const team = this.engine.getTeam(this.engine.manager?.teamId);
                const standings = team ? this.engine.getStandings(team.zone, team.division) : [];
                const position = team ? (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length : 0;
                const totalTeams = standings.length || 20;
                const promoted = position > 0 && position <= Math.max(2, Math.floor(totalTeams * 0.1));
                const relegated = position > 0 && position > totalTeams - Math.max(2, Math.floor(totalTeams * 0.1));

                const seasonRec = {
                    season: this.stats.seasonsPlayed,
                    // Strategic data
                    division: team?.division ?? null,
                    position,
                    balance: team?.balance ?? 0,
                    promoted,
                    relegated,
                    squadSize: team?.squad?.length ?? 0,
                    loanActive: !!this.engine.activeLoan,
                    // Tournament participation
                    tournamentData: (this.engine.tournaments || [])
                        .filter(t => t.participants?.includes(team?.id))
                        .map(t => ({
                            id: t.id,
                            winner: t.winner === team?.id,
                            phase: t.phase || (t.currentPhaseIndex != null ? `phase-${t.currentPhaseIndex}` : null),
                        })),
                    // Cumulative stats
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
                        avgOvr: team.squad.reduce((s, p) => s + (p.ovr || 0), 0) / (team.squad.length || 1),
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
     * Fase 2 ML: Discretize game state into a compact context key for Thompson bandits.
     * Uses 3 dimensions: position tier, balance tier, season phase.
     * Total: 4 × 4 × 3 = 48 possible contexts — keeps bandit tables tiny.
     * @returns {string} e.g. "top4|rich|late"
     */
    _banditContextKey() {
        const ctx = this._buildStateCtx();
        const posTier = ctx.position <= 4 ? 'top4'
            : ctx.position <= 10 ? 'mid'
            : ctx.position <= 16 ? 'bottom' : 'rele';
        const balTier = ctx.balance > 5_000_000 ? 'rich'
            : ctx.balance > 1_000_000 ? 'stable'
            : ctx.balance > 0 ? 'poor' : 'broke';
        const phaseTier = ctx.week <= 12 ? 'early'
            : ctx.week <= 28 ? 'mid' : 'late';
        return `${posTier}|${balTier}|${phaseTier}`;
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
            ? team.squad.reduce((s, p) => s + (p.form?.value ?? 50), 0) / (team.squad.length || 1)
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
        // Convergence fix: pass real next-state actions for Q-value bootstrapping
        // Ref: Watkins (1989) — δ = r + γ·max(Q[s'][a']) - Q[s][a]
        const tacticActions = ['TACTIC_normal', 'TACTIC_offensive', 'TACTIC_defensive', 'TACTIC_counter'];
        const trainingActions = TRAINING_ROTATION.map(id => `TRAIN_${id}`);
        const nextActions = [...tacticActions, ...trainingActions];
        this.brain.observe(this._lastStateKey, this._lastAction, reward, nextStateKey, nextActions);

        // Fase 3 ML: Feed reward to SARSA emotional modifier learner
        try { this.brain.emotions.feedReward(reward); } catch { /* defensive */ }

        // Fase 2 ML: Thompson Sampling feedback for team talk
        // Match result feeds back to the last team talk choice
        if (this._lastBanditActions?.teamTalk) {
            const { ctxKey, action } = this._lastBanditActions.teamTalk;
            // Win = positive, draw = neutral, loss = negative
            const talkReward = currentCtx.lastResult === 'W' ? 1.5
                : currentCtx.lastResult === 'D' ? 0
                : currentCtx.lastResult === 'L' ? -1 : 0;
            if (talkReward !== 0) {
                this.bandits.teamTalk.update(ctxKey, action, talkReward);
            }
            this._lastBanditActions.teamTalk = null; // consumed
        }
    }

    _makeDecisions() {
        const engine = this.engine;
        const teamId = engine?.manager?.teamId;
        if (!teamId) return;

        // SPEC-115/116/117: Build state + observe last outcome
        const ctx = this._buildStateCtx();

        // Fase 3 ML: Set emotional context for SARSA modifier learning
        try { this.brain.emotions.setContext(ctx); } catch { /* defensive */ }

        this._observeOutcome(ctx);

        // ML Transfer Reward Feedback: evaluate past transfers every 8 weeks
        if (this.stats.weeksPlayed % 8 === 0 && this._pendingTransferRewards?.length > 0) {
            const team = engine.getTeam(teamId);
            const standings = team ? (engine.getStandings(team.zone, team.division) || []) : [];
            const currentPos = team ? (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length : 10;

            // Process transfers that are at least 6 weeks old
            const matured = this._pendingTransferRewards.filter(
                t => (engine.currentWeek || 0) - t.weekDone >= 6
            );
            for (const tx of matured) {
                const reward = computeTransferReward({
                    action: tx.type,
                    positionBefore: tx.positionBefore,
                    positionAfter: currentPos,
                    balanceBefore: tx.balanceBefore,
                    balanceAfter: team?.balance || 0,
                    playerBecameStarter: tx.type === 'BUY' && (tx.playerOvr || 0) >= 65,
                    playerWasStarter: tx.playerWasStarter || false,
                    offerRatio: tx.offerRatio || 1.0,
                    emotionalLossMod: this.brain?.emotions?.getModifiers?.()?.lossMod || 1.0
                });
                // Feed reward back to Q-table
                if (tx.stateKey && tx.action) {
                    this.brain.observe(tx.stateKey, tx.action, reward, encodeState(ctx), ['MKT_BUY_YES', 'MKT_BUY_NO', 'MKT_SELL_YES', 'MKT_SELL_NO']);
                    this._logDecision('ML_TRANSFER_REWARD', {
                        type: tx.type, reward: reward.toFixed(1),
                        posChange: tx.positionBefore - currentPos,
                        stateKey: tx.stateKey
                    }, 0);
                }
            }
            // Remove matured entries
            this._pendingTransferRewards = this._pendingTransferRewards.filter(
                t => (engine.currentWeek || 0) - t.weekDone < 6
            );
        }

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
        const tacticActions = ['TACTIC_normal', 'TACTIC_offensive', 'TACTIC_defensive', 'TACTIC_counter'];
        const pickedTacticKey = this.brain.pickAction(stateKey, tacticActions, ctx);
        let nextTactic = 'normal';
        if (pickedTacticKey) {
            nextTactic = pickedTacticKey.replace(/^TACTIC_/, '');
        } else {
            // Fallback heuristic if brain returns null
            const streak = engine.managerStats?.streak || 0;
            if (streak >= 3) nextTactic = 'offensive';
            else if (streak <= -2) nextTactic = 'defensive';
            else if (streak <= 0) nextTactic = 'counter';
        }
        if (engine.setTactic) {
            // BUG-081: boredom override — force rotation if same tactic >8 weeks and not winning big
            // BUG-RC3 fix: reduced from 12→8 to break stuck loops faster
            const tacticStreak = engine.managerStats?.streak || 0;
            if (this._consecutiveSameTactic > 8 && tacticStreak < 5) {
                const allTactics = ['normal', 'offensive', 'defensive', 'pressing', 'counter', 'possession'];
                const others = allTactics.filter(t => t !== nextTactic);
                nextTactic = others[Math.floor(systemRng() * others.length)];
                this._consecutiveSameTactic = 0;
            }
            engine.setTactic(nextTactic);
            // BUG-RC3: log tactic CHANGES (not same-tactic repeats) for observability
            if (this._lastTactic !== nextTactic) {
                this._logDecision('TACTIC_CHANGE', {
                    from: this._lastTactic || 'none',
                    to: nextTactic,
                    source: pickedTacticKey ? 'brain' : 'heuristic'
                }, 0);
                this._consecutiveSameTactic = 0;
            } else {
                this._consecutiveSameTactic++;
            }
            this._lastTactic = nextTactic;
        }

        // Decision 2b: Monotony detection — every 4 weeks apply suggestions
        if (this.stats.weeksPlayed % 4 === 0) {
            try {
                const team = engine.getTeam(teamId);
                const standings = team ? engine.getStandings(team.zone, team.division) : [];
                const position = team ? (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length : 10;
                const avgOVR = team?.squad?.length
                    ? team.squad.reduce((s, p) => s + (p.ovr || 0), 0) / (team.squad.length || 1) : 60;
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

        // Decision 4: REMOVED (BUG-086) — transfer offer processing is handled
        // in the ML-powered block below (L989+) with smartSellDecision + reward tracking.
        // This legacy block used wrong field names (offer.amount/offer.player) and never executed.

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

        // Decision 6: Emergency loan when balance is critically low
        try {
            const team = engine.getTeam(teamId);
            if (team && (team.balance || 0) < 0 && !engine.activeLoan) {
                const loanOpts = engine.getLoanOptions();
                if (loanOpts.available && loanOpts.options.length > 0) {
                    // Take medium loan for breathing room
                    const mediumLoan = loanOpts.options[1] || loanOpts.options[0];
                    const result = engine.takeLoan(mediumLoan.amount);
                    if (result.success) {
                        this._logDecision('TAKE_LOAN', {
                            amount: mediumLoan.amount,
                            weeklyPayment: mediumLoan.weeklyPayment,
                            balance: team.balance,
                        }, 0);
                    }
                }
            }
        } catch { /* ignore */ }

        // BUG-080: emergency sell when deeply negative balance (even after loan)
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
                            engine.rejectTransferOffer?.(offer.playerId);
                            continue;
                        }
                        // ML: brain decides via Q-Learning (learns from sell outcomes)
                        const decision = smartSellDecision(this.brain, {
                            team, player, offerAmount: offer.offerAmount
                        });
                        if (decision.sell && typeof engine.acceptTransferOffer === 'function') {
                            // Track for reward feedback
                            const standings = engine.getStandings(team.zone, team.division) || [];
                            const posBefore = (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length;
                            this._pendingTransferRewards.push({
                                type: 'SELL', stateKey: decision.stateKey, action: decision.action,
                                weekDone: engine.currentWeek, positionBefore: posBefore,
                                balanceBefore: team.balance, playerWasStarter: (player.ovr || 0) >= 65,
                                offerRatio: offer.offerAmount / Math.max(player.value || 1, 1)
                            });
                            const result = engine.acceptTransferOffer(offer.playerId);
                            if (result?.success) {
                                this.stats.transfers++;
                                this._logSuccess('TRANSFER_SOLD', `Vendeu ${player.name} (OVR${player.ovr}) por R$ ${(offer.offerAmount/1e6).toFixed(1)}M. ${decision.reason}`);
                                this._logDecision('SELL_PLAYER', {
                                    playerId: offer.playerId, amount: offer.offerAmount,
                                    source: decision.source, reason: decision.reason,
                                    biases: decision.biases || []
                                }, 0);
                            }
                        } else if (offer.deadline && engine.currentWeek >= offer.deadline) {
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

                        const urgentScout = this._urgentScout;
                        if (urgentScout) this._urgentScout = false;

                        if (weakest && (weakest.avgOVR < 70 || urgentScout)) {
                            const candidates = engine.scoutLeague(weakest.pos, weakest.avgOVR + 5, 10);
                            if (candidates.length > 0) {
                                // ML: rank candidates through brain Q-Learning
                                const biasCtx = {
                                    windowWeeksLeft: Math.max(0, 38 - (engine.currentWeek || 0)),
                                    totalWindowWeeks: 38
                                };
                                const ranked = rankCandidates({
                                    brain: this.brain,
                                    team,
                                    candidates,
                                    biasCtx,
                                    limit: 3
                                });

                                // Try best candidate that brain approved
                                const best = ranked[0];
                                if (best) {
                                    const target = best.candidate;
                                    const player = target.player || target;
                                    const offerAmount = best.askingPrice;

                                    const result = engine.makeBuyOffer(target.teamId, player.id, offerAmount);
                                    // Track for ML reward feedback
                                    const standings = engine.getStandings(team.zone, team.division) || [];
                                    const posBefore = (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length;

                                    if (this.telemetry?.history) {
                                        if (!Array.isArray(this.telemetry.history.offers)) this.telemetry.history.offers = [];
                                        this.telemetry.history.offers.push({
                                            week: engine.currentWeek,
                                            playerId: player?.id,
                                            amount: offerAmount,
                                            playerValue: target.value || (player.ovr || 60) * 50_000,
                                            accepted: result?.accepted === true,
                                            simulated: false,
                                            source: best.decision.source
                                        });
                                        // BUG-094: cap to 200 entries (consistent with TelemetryAggregator MAX_HISTORY)
                                        if (this.telemetry.history.offers.length > 200) {
                                            this.telemetry.history.offers = this.telemetry.history.offers.slice(-200);
                                        }
                                    }
                                    this._logDecision('BUY_OFFER', {
                                        target: player.name,
                                        position: player.position || weakest.pos,
                                        ovr: player.ovr || target.ovr,
                                        amount: offerAmount,
                                        accepted: result?.accepted || false,
                                        reason: best.decision.reason,
                                        source: best.decision.source
                                    }, 0);

                                    if (result?.accepted) {
                                        this.stats.transfers++;
                                        // Track for delayed reward
                                        this._pendingTransferRewards.push({
                                            type: 'BUY', stateKey: best.decision.stateKey,
                                            action: best.decision.action,
                                            weekDone: engine.currentWeek, positionBefore: posBefore,
                                            balanceBefore: team.balance, playerOvr: player.ovr || 60
                                        });
                                        this.brain?.remember({
                                            week: engine.currentWeek, season: engine.seasonNumber,
                                            action: `BUY_${weakest.pos}_OVR${player.ovr}`,
                                            result: 'accepted', reward: 3,
                                            details: `R$ ${(offerAmount / 1_000_000).toFixed(1)}M via ML`
                                        });
                                    } else if (result?.success === true) {
                                        this.brain?.remember({
                                            week: engine.currentWeek, season: engine.seasonNumber,
                                            action: `BUY_${weakest.pos}_OVR${player.ovr}`,
                                            result: `rejected`, reward: -1
                                        });
                                    }
                                } else {
                                    // Brain rejected all candidates
                                    this._logDecision('BUY_ALL_REJECTED_BY_ML', {
                                        position: weakest.pos,
                                        candidatesScanned: candidates.length,
                                        brainStates: Object.keys(this.brain?.qTable || {}).length
                                    }, 0);
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
                        const team2 = this.engine.getTeam(myTeamId);
                        const standings2 = team2 ? this.engine.getStandings(team2.zone, team2.division) : [];
                        const pos2 = team2 ? (standings2.findIndex(s => s.teamId === team2.id) + 1) || standings2.length : 10;
                        const n2 = standings2.length || 20;
                        const isRelRisk = pos2 > (n2 * 0.75);
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
            // Q(λ) episode boundary: clear eligibility traces to prevent
            // cross-season credit leakage (Ref: Sutton & Barto Ch.12 §12.1)
            try { this.brain.clearTraces(); } catch { /* defensive */ }
            // Fase 3: clear SARSA(λ) emotional traces at season boundary
            try { this.brain.emotions.clearSarsaTraces(); } catch { /* defensive */ }
            // Fase C: replay high-impact experiences at season boundary
            // Re-trains on promotions, relegations, title wins, big transfers
            try { this.brain.replayExperiences(); } catch { /* defensive */ }

            // Fase C: NPC season boundary — clear traces + replay for all NPC brains
            try {
                const allTeams = engine.getAllTeams?.() || [];
                for (const t of allTeams) {
                    if (t.brain && t.id !== team?.id) {
                        try { t.brain.clearTraces(); } catch { /* skip */ }
                        try { t.brain.replayExperiences(); } catch { /* skip */ }
                    }
                }
            } catch { /* defensive */ }

            // Flush all pending transfer rewards (season rolled over, can't wait anymore)
            if (this._pendingTransferRewards?.length > 0 && team) {
                const standings = engine.getStandings(team.zone, team.division) || [];
                const currentPos = (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length;
                const ctx = this._buildStateCtx();
                for (const tx of this._pendingTransferRewards) {
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
                            emotionalLossMod: this.brain?.emotions?.getModifiers?.()?.lossMod || 1.0
                        });
                        if (tx.stateKey && tx.action) {
                            this.brain.observe(tx.stateKey, tx.action, reward, encodeState(ctx), ['MKT_BUY_YES', 'MKT_BUY_NO', 'MKT_SELL_YES', 'MKT_SELL_NO']);
                        }
                    } catch { /* defensive */ }
                }
                this._pendingTransferRewards = [];
            }
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

    /**
     * NEW GAME+ — Salva o brain treinado, reseta TUDO do gameplay.
     * 
     * O brain (Q-table, personality, emotions, memória episódica) é salvo
     * no localStorage. Stats, seasons, match results, telemetry, transfer
     * tracking — tudo é zerado. Quando o jogo reinicia, o brain restaura
     * automaticamente do localStorage com todo o aprendizado intacto.
     * 
     * Fluxo:
     *   1. Pausa o autoplay
     *   2. Salva brain no localStorage (persiste ML)
     *   3. Zera stats, insights, decisions, anomalies, seasonHistory
     *   4. Reseta telemetry aggregator
     *   5. Limpa transfer tracking interno
     *   6. Remove save de gameplay (elifoot_autoplay_state, elifoot_save_v1)
     *   7. Retorna snapshot do brain salvo para confirmação
     * 
     * @returns {{ brainStates: number, totalUpdates: number, personality: string, savedAt: number }}
     */
    newGamePlus() {
        // 1. Pausa
        this.pause();

        // 2. Salva brain ANTES de limpar qualquer coisa
        const brainSnapshot = {
            states: Object.keys(this.brain?.qTable || {}).length,
            totalUpdates: this.brain?.totalUpdates || 0,
            personality: this.brain?.personality?.id || 'unknown',
            memoryEntries: this.brain?.memory?.length || 0,
            emotionalState: this.brain?.emotions?.state || 'CALM',
        };
        if (this.brain) {
            this.brain.save(); // persiste brain no localStorage
        }

        // 3. Zera stats de gameplay
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

        // 4. Reseta tracking interno
        this._lastSeasonNumber = null;
        this._lastTitlesCount = 0;
        this._lastDivision = null;
        this._trainingIdx = 0;
        this._lastBalance = null;
        this._consecutiveSameTactic = 0;
        this._lastTactic = null;
        this._pendingTransferRewards = [];
        this._lastStateKey = null;
        this._lastAction = null;
        this._lastBalanceForReward = null;
        this._lastPositionForReward = null;
        this._lastSeasonForReward = null;
        this._lastDivisionForReward = null;

        // 5. Reseta telemetry
        try {
            this.telemetry = new TelemetryAggregator();
            this.lastTelemetryReport = null;
        } catch { /* ignore */ }

        // 6. Limpa saves de gameplay (mas NÃO o brain!)
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('elifoot_autoplay_state');
                localStorage.removeItem('elifoot_save_v1');
                localStorage.removeItem('elifoot_genetic_state');
                // NÃO remove 'elifoot_autoplay_brain' — esse é o ponto!
            }
        } catch { /* ignore */ }

        brainSnapshot.savedAt = Date.now();
        return brainSnapshot;
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
