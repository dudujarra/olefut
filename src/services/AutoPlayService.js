import { EngineLogger } from '../engine/EngineLogger.js';
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

import { TRAINING_TYPES, TEAM_TALKS } from '../engine/ManagerSystems';
import { SAVE_KEY } from '../engine/constants.js';
import { TelemetryAggregator } from './telemetry/TelemetryAggregator.js';
import { AdaptiveBrain } from './learning/AdaptiveBrain.js';
import { ThompsonBandit } from './learning/ThompsonBandit.js';
import { DAggerBootstrap } from './learning/DAggerBootstrap.js';
import { generateGameDesignInsights } from './learning/LLMBridge.js';
import { checkChallengeWin, getAllChallengeModes } from '../engine/ChallengeModes.js';
import { SessionMetrics } from '../components/GDDSystems.jsx';
import { AutoPlayLLMBridge } from './AutoPlayLLMBridge.js';
import { AutoPlayPersistence } from './AutoPlayPersistence.js';
import { AutoPlayPacing } from './AutoPlayPacing.js';
import { AutoPlaySimulator } from './AutoPlaySimulator.js';
import { AutoPlayLogger } from './AutoPlayLogger.js';
import { AutoPlayBanditCoordinator } from './AutoPlayBanditCoordinator.js';
import { AutoPlayDecisions } from './AutoPlayDecisions.js';

import { rng as systemRng } from '../engine/rng.js';
import { devLog } from '../engine/DevLog.js';

// BUG-027 fix: pull training catalog from engine source of truth (was hardcoded
// list with invalid IDs cardio/defensive/attacking causing 2416 TRAIN_FAIL).
// FORMATION_POOL/VIEW_ROTATION moved to AutoPlayDecisions.js (RFCT-020 Phase 3).
const TRAINING_ROTATION = (TRAINING_TYPES || []).map(t => t.id).filter(Boolean);
const TELEMETRY_INTERVAL_WEEKS = 5;

// RFCT-020: shared factories — used by constructor + newGamePlus
function _makeInitialStats() {
    return {
        weeksPlayed: 0, seasonsPlayed: 0, matchesPlayed: 0,
        wins: 0, draws: 0, losses: 0, transfers: 0, errorCount: 0,
        anomalies: [], successes: [], decisions: [],
        insights: {
            longestWinStreak: 0, longestLossStreak: 0,
            biggestWin: null, worstLoss: null, biggestSale: null,
            titlesWon: 0, promotionsWon: 0, relegationsTaken: 0,
            hatTricks: 0, cleanSheets: 0, achievementsUnlocked: 0,
            peakBalance: 0, lowestBalance: Infinity,
            peakStanding: Infinity, worstStanding: 0,
        },
        startTime: null, elapsedMs: 0,
    };
}

function _resetRuntimeTracking(self) {
    self._lastSeasonNumber = null;
    self._lastTitlesCount = 0;
    self._lastDivision = null;
    self._trainingIdx = 0;
    self._lastBalance = null;
    self._consecutiveSameTactic = 0;
    self._lastTactic = null;
    self._pendingTransferRewards = [];
    self._lastStateKey = null;
    self._lastAction = null;
    self._lastBalanceForReward = null;
    self._lastPositionForReward = null;
    self._lastSeasonForReward = null;
    self._lastDivisionForReward = null;
}

export class AutoPlayController {
    constructor(engine) {
        this.engine = engine;
        this.running = false;
        this.intervalId = null;
        this.weekDelay = 100; // ms between weeks
        this.stats = _makeInitialStats();
        _resetRuntimeTracking(this);

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
                    devLog('DAgger', `Warm-start: ${result.total} teacher lessons loaded`);
                }
            } catch (err) { EngineLogger.capture(err, 'AutoPlayService.js', 'non-critical'); }
        }

        // Transfer tracking for ML reward feedback — initialized via _resetRuntimeTracking() above
        // { type, stateKey, action, weekBought, positionBefore, balanceBefore, playerOvr }

        // BUG-066 fix: restore stats from localStorage. Was zeroing on refresh
        // even though _save() wrote them — only brain had its own restore path.
        AutoPlayPersistence.restoreStats(this.stats);

        // §14.2: Challenge mode tracking
        this._challengeModesAvailable = getAllChallengeModes();

        // §17: Session time metrics
        this._sessionMetrics = new SessionMetrics();

        // SPEC-119 / RFCT-018: LLM Bridge extracted to AutoPlayLLMBridge.js
        this.llmBridge = new AutoPlayLLMBridge();

        // RFCT-020 Phase 1: Logger extracted to AutoPlayLogger.js
        this._logger = new AutoPlayLogger(this);

        // RFCT-020 Phase 2: Bandit coordinator extracted to AutoPlayBanditCoordinator.js
        this._banditCoord = new AutoPlayBanditCoordinator(this);

        // RFCT-020 Phase 3: Decisions extracted to AutoPlayDecisions.js
        this._decisions = new AutoPlayDecisions(this);
    }

    // _restoreStats: RFCT-018 — moved to AutoPlayPersistence.restoreStats()

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

    // RFCT-020 Phase 1: delegated to AutoPlayLogger.js
    _save() { this._logger.save(); }
    _logSuccess(type, msg, ctx = {}) { this._logger.logSuccess(type, msg, ctx); }
    _logAnomaly(type, msg, ctx = {}) { this._logger.logAnomaly(type, msg, ctx); }
    _logDecision(action, args, elapsedMs) { this._logger.logDecision(action, args, elapsedMs); }

    _tick() {
        if (!this.running) return;

        // BUG-087: _makeDecisions e _advanceWeek em try/catch independentes.
        // Decisões falharem NÃO pode impedir a progressão do tempo.
        try {
            this._makeDecisions();
        } catch (e) {
            this._logAnomaly('DECISIONS_CRASH', `${e?.message || 'Unknown'} | ${e?.stack?.split('\n')[1]?.trim() || 'n/a'}`, { errorType: e?.constructor?.name });
        }

        try {
            this._advanceWeek();
            this.stats.weeksPlayed++;

            // §16.2: Auto-dismiss trophy ceremony (log it as success)
            if (this.engine.trophyCeremony) {
                this._logSuccess('TROPHY_CEREMONY', `🏆 Cerimônia: ${this.engine.trophyCeremony.trophy?.name || this.engine.trophyCeremony.trophy}`, {
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
            } catch (err) { EngineLogger.capture(err, 'AutoPlayService.js', 'challenge non-critical'); }

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
            } catch (err) { EngineLogger.capture(err, 'AutoPlayService.js', 'scarcity non-critical'); }

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
            } catch (err) { EngineLogger.capture(err, 'AutoPlayService.js', 'press non-critical'); }

            // §15.4: PWA notification trigger on milestones (non-blocking)
            try {
                if (this.stats.weeksPlayed % 38 === 0) {
                    // Season end — trigger notification if PWAService available
                    if (typeof window !== 'undefined' && window.__pwaService) {
                        window.__pwaService.notifySeasonEnd?.(this.engine.seasonNumber);
                    }
                }
            } catch (err) { EngineLogger.capture(err, 'AutoPlayService.js', 'PWA non-critical'); }

            // === HUMAN-PARITY INTERACTIONS (RFCT-018: delegated to AutoPlayPacing) ===
            AutoPlayPacing.runAll(this);

            // Save every 38 weeks (1 season)
            if (this.stats.weeksPlayed % 38 === 0) {
                this.stats.seasonsPlayed++;
                // §17: Record match for session metrics
                this._sessionMetrics.recordMatch();
                // SPEC-123: snapshot per-season for learning curve viz
                // RFCT-020: extracted to AutoPlayLogger.snapshotSeasonHistory()
                this._logger.snapshotSeasonHistory();
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

    // RFCT-020 Phase 2: delegated to AutoPlayBanditCoordinator.js
    _banditContextKey() { return this._banditCoord.banditContextKey(); }
    _buildStateCtx() { return this._banditCoord.buildStateCtx(); }
    _observeOutcome(currentCtx) { return this._banditCoord.observeOutcome(currentCtx); }

    // RFCT-020 Phase 3: delegated to AutoPlayDecisions.js
    _makeDecisions() { return this._decisions.makeDecisions(); }
    // RFCT-018 Phase 3: delegated to AutoPlaySimulator.js
    _advanceWeek() {
        AutoPlaySimulator.advanceWeek(this);
    }

    // BUG-080: delegated to AutoPlaySimulator.js
    _emergencySell(team) {
        AutoPlaySimulator.emergencySell(this, team);
    }

    // RFCT-018 Phase 3: delegated to AutoPlaySimulator.js
    _detectAnomalies() {
        AutoPlaySimulator.detectAnomalies(this);
    }

    getStats() {
        const gameDesignInsights = this.lastTelemetryReport
            ? generateGameDesignInsights(this.lastTelemetryReport)
            : [];

        // RFCT-020: SPEC-143 derived metrics extracted to AutoPlayLogger.computeStatsAggregates()
        const { emotionalDistribution, transferPrices, tacticDiversity } = this._logger.computeStatsAggregates();

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
            gameDesignInsights,
            // SPEC-143: métricas melhoradas para deep soak v2
            emotionalDistribution,
            transferPrices,
            tacticDiversity,
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
     *   6. Remove save de gameplay (olefut_autoplay_state, olefut_save_v1)
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
        this.stats = _makeInitialStats();

        // 4. Reseta tracking interno
        _resetRuntimeTracking(this);

        // 5. Reseta telemetry
        try {
            this.telemetry = new TelemetryAggregator();
            this.lastTelemetryReport = null;
        } catch (err) { EngineLogger.capture(err, 'AutoPlayService.js', 'ignore'); }

        // 6. Limpa saves de gameplay (mas NÃO o brain!)
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('olefut_autoplay_state');
                localStorage.removeItem(SAVE_KEY);
                localStorage.removeItem('olefut_genetic_state');
                // NÃO remove 'olefut_autoplay_brain' — esse é o ponto!
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayService.js', 'ignore'); }

        brainSnapshot.savedAt = Date.now();
        return brainSnapshot;
    }

    exportReport() {
        const stats = this.getStats();
        const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `olefut-autoplay-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportTelemetryReport() {
        const payload = this.telemetry.exportJSON();
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `olefut-telemetry-${Date.now()}.json`;
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
