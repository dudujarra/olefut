import { rng as systemRng } from '../../engine/rng.js';
import { ARCHETYPES, generatePersonality, generateRandomPersonality, checkIsTilted, deriveTraits } from './Archetypes.js';
import { EmotionalEngine } from './EmotionalEngine.js';

/**
 * AdaptiveBrain — SPEC-115 + SPEC-116 + SPEC-117 + MARL Roadmap Fases 1-3
 *
 * Q-learning tabular with:
 *   - OCEAN personality system (Fase 1)
 *   - Emotional State Machine (Fase 2)
 *   - Prospect Theory reward shaping (Fase 3)
 *   - Bayesian fallback for cold-start
 *   - Goal hierarchy modulated by personality traits
 *
 * Persists to localStorage 'elifoot_autoplay_brain'.
 *
 * Usage:
 *   const brain = new AdaptiveBrain('GUARDIOLA');
 *   const action = brain.pickAction(state, availableActions, ctx);
 *   brain.processMatchResult('W', 3);
 *   brain.observe(state, action, reward, nextState);
 */

const STORAGE_KEY = 'elifoot_autoplay_brain';
const ALPHA = 0.1;       // learning rate
const GAMMA = 0.9;       // discount factor
const BASE_EPSILON = 0.15;    // base exploration rate
const MAX_BUCKETS = 500; // bound table size

// ─── ELIGIBILITY TRACES (Fase 1 ML Upgrade) ─────────────────
// Ref: Sutton & Barto, Ch.12 — Singh & Sutton 1996 (Replacing Traces)
// λ controls trace decay: 0 = TD(0) (current behavior), 1 = Monte Carlo
// 0.7 is the sweet spot for game AI: propagates credit ~3-4 steps back
const LAMBDA = 0.7;          // trace decay rate
const TRACE_MIN = 0.01;      // prune traces below this threshold
const MAX_TRACE_ENTRIES = 300; // bound trace table size

// ─── PROSPECT THEORY CONSTANTS (Fase 3) ──────────────────────
const LOSS_AVERSION_LAMBDA = 2.0;   // Kahneman: losses hurt 2x more
const DIMINISHING_GAINS_ALPHA = 0.88; // concavity for gains
const RISK_SEEKING_LOSSES_BETA = 0.88; // convexity for losses

// ─── STATE ENCODING ──────────────────────────────────────────

/**
 * Encode engine state to bucket key.
 * @param {Object} ctx
 * @param {number} ctx.position - league position 1..N
 * @param {number} ctx.totalTeams
 * @param {number} ctx.balance
 * @param {number} ctx.formAvg - 0-100 squad avg form
 * @param {number} ctx.week - currentWeek 0-37
 * @param {string} [ctx.lastResult] - 'W'|'D'|'L'|'-'
 * @returns {string}
 */
export function encodeState(ctx = {}) {
    const totalTeams = ctx.totalTeams || 20;
    const top4Threshold = Math.max(4, Math.floor(totalTeams * 0.25));
    const midThreshold = Math.floor(totalTeams * 0.6);
    const pos = ctx.position || totalTeams;
    const posTier = pos <= top4Threshold ? 'top4' : (pos <= midThreshold ? 'mid' : 'bottom');

    const bal = ctx.balance || 0;
    const balTier = bal < 0 ? 'red' : (bal < 5_000_000 ? 'low' : (bal < 50_000_000 ? 'mid' : 'rich'));

    const f = ctx.formAvg || 50;
    const formTier = f < 40 ? 'poor' : (f <= 70 ? 'avg' : 'good');

    const w = ctx.week || 0;
    const phase = w < 13 ? 'early' : (w < 26 ? 'mid' : 'late');

    const last = ctx.lastResult || '-';
    // BUG-042: add squadTier to diversify state space
    const squadSize = ctx.squadSize || 0;
    const squadTier = squadSize < 11 ? 'thin' : (squadSize < 18 ? 'normal' : 'deep');
    return `${formTier}|${posTier}|${balTier}|${phase}|${last}|${squadTier}`;
}

// ─── GOAL DETECTION ──────────────────────────────────────────

/**
 * Detect active goals based on state context + personality traits.
 * Returns array of { goal, weight }.
 */
export function detectGoals(ctx = {}, personality = null) {
    const goals = [];
    const totalTeams = ctx.totalTeams || 20;
    const pos = ctx.position || totalTeams;

    // Base weights
    let relW = 1.0;
    let finW = 0.8;
    let climbW = 0.6;
    let squadW = 0.4;
    let winW = 0.3;

    // Modulate by OCEAN-derived traits
    const traits = personality?.traits || personality || {};
    if (traits.ambition != null) {
        winW += traits.ambition * 0.5;
        climbW += traits.ambition * 0.3;
    }
    if (traits.loyalty != null) {
        squadW += traits.loyalty * 0.4;
    }
    // Conscientiousness → financial discipline
    const conscient = personality?.ocean?.C ?? 0.5;
    finW += conscient * 0.4;

    if (pos > totalTeams * 0.75) goals.push({ goal: 'AVOID_RELEGATION', weight: relW });
    if ((ctx.balance || 0) < 0) goals.push({ goal: 'FINANCIAL_HEALTH', weight: finW });
    if (pos > 4 && pos <= totalTeams * 0.6) goals.push({ goal: 'CLIMB_POSITION', weight: climbW });
    if ((ctx.squadSize || 0) < 18) goals.push({ goal: 'SQUAD_DEPTH', weight: squadW });
    if (pos <= 4) goals.push({ goal: 'WIN_TITLE', weight: winW });

    return goals;
}

// ─── GOAL RELEVANCE MATRIX ───────────────────────────────────

const GOAL_RELEVANCE = {
    AVOID_RELEGATION: {
        TACTIC_defensive: 0.7, TACTIC_normal: 0.4, TACTIC_offensive: -0.2,
        TRAIN_fitness: 0.6, TRAIN_tactical: 0.5,
        UPGRADE_STADIUM: -0.5, UPGRADE_ACADEMY: -0.3, SQUAD_REPLENISH: 0.7,
        MKT_BUY_YES: 0.3, MKT_BUY_NO: -0.1, MKT_SELL_YES: -0.4, MKT_SELL_NO: 0.3
    },
    FINANCIAL_HEALTH: {
        UPGRADE_STADIUM: -0.8, UPGRADE_ACADEMY: -0.5, ACCEPT_OFFER: 0.9,
        TACTIC_defensive: 0.2, SQUAD_REPLENISH: -0.2,
        MKT_BUY_YES: -0.6, MKT_BUY_NO: 0.4, MKT_SELL_YES: 0.8, MKT_SELL_NO: -0.5
    },
    CLIMB_POSITION: {
        TACTIC_offensive: 0.7, TACTIC_counter: 0.5,
        TRAIN_attack: 0.6, TRAIN_technical: 0.5, FORMATION: 0.4,
        MKT_BUY_YES: 0.5, MKT_BUY_NO: -0.2, MKT_SELL_YES: -0.3, MKT_SELL_NO: 0.2
    },
    SQUAD_DEPTH: {
        SQUAD_REPLENISH: 1.0, UPGRADE_ACADEMY: 0.6, ACCEPT_OFFER: -0.4, TRAIN_fitness: 0.2,
        MKT_BUY_YES: 0.8, MKT_BUY_NO: -0.5, MKT_SELL_YES: -0.6, MKT_SELL_NO: 0.4
    },
    WIN_TITLE: {
        TACTIC_offensive: 0.6, TACTIC_counter: 0.5,
        TRAIN_attack: 0.5, TRAIN_technical: 0.4, UPGRADE_STADIUM: 0.3,
        MKT_BUY_YES: 0.4, MKT_BUY_NO: -0.1, MKT_SELL_YES: -0.5, MKT_SELL_NO: 0.3
    }
};

export function actionRelevance(action, goal) {
    const map = GOAL_RELEVANCE[goal] || {};
    return map[action] ?? 0;
}

// ─── PROSPECT THEORY REWARD (Fase 3) ─────────────────────────

/**
 * Prospect Theory value function.
 * - Gains: v(x) = x^α           (concave → risk-averse when winning)
 * - Losses: v(x) = -λ·|x|^β     (convex → risk-seeking when losing)
 *
 * @param {number} x — raw reward delta
 * @returns {number} perceived value
 */
function prospectValue(x) {
    if (x >= 0) {
        return Math.pow(x, DIMINISHING_GAINS_ALPHA);
    }
    return -LOSS_AVERSION_LAMBDA * Math.pow(Math.abs(x), RISK_SEEKING_LOSSES_BETA);
}

/**
 * Compute reward from match + state delta.
 * Now uses Prospect Theory (Fase 3):
 *   - Losses weighted 2x heavier (loss aversion)
 *   - Gains have diminishing returns (risk aversion when ahead)
 *   - Reference point = expected position for division
 *
 * @param {Object} params
 * @param {number} [params.emotionalLossMod=1.0] — from EmotionalEngine
 */
export function computeReward({
    matchResult, balanceDelta, positionDelta, promoted, relegated, title,
    goalsScored = 0, goalsAllowed = 0, scoreDiff = 0,
    emotionalLossMod = 1.0
}) {
    let r = 0;

    // Match result base (raw, before Prospect Theory)
    if (matchResult === 'W') r += 10;
    else if (matchResult === 'D') r += 2;
    else if (matchResult === 'L') {
        // BUG-041: soften crushing losses but reward narrow ones
        if (Math.abs(scoreDiff) <= 1) r -= 1;
        else if (Math.abs(scoreDiff) <= 3) r -= 3;
        else r -= 5;
        // Emotional amplification: ANXIOUS/TILTED feel losses harder
        r *= emotionalLossMod;
    }

    // BUG-041: own scoring is intrinsic positive signal even in loss
    r += Math.min(5, goalsScored * 1.5);
    // Defensive performance
    if (matchResult !== 'L' && goalsAllowed === 0) r += 3;

    // Balance trend — apply Prospect Theory
    if (balanceDelta) {
        const balReward = balanceDelta / 1_000_000;
        r += prospectValue(Math.max(-10, Math.min(10, balReward)));
    }

    // Position movement — apply Prospect Theory
    if (positionDelta) {
        r += prospectValue(positionDelta * 2);
    }

    // Season events — BUG-RC1 fix: rewards MUST be symmetric to avoid
    // Q-value collapse during yo-yo cycles. Previous: promoted=+50, relegated=-100
    // caused net=-50 per cycle × 93 cycles = -4650 cumulative bias.
    if (promoted) r += 60;
    if (relegated) r -= 60 * emotionalLossMod;
    if (title) r += 200;

    return r;
}

// ─── ADAPTIVE BRAIN CLASS ────────────────────────────────────

export class AdaptiveBrain {
    /**
     * @param {string|null} personalityId — archetype seed (e.g. 'GUARDIOLA')
     */
    constructor(personalityId = null) {
        this.qTable = {};
        this.visitCount = {};
        this.totalUpdates = 0;
        this.lastSavedAt = 0;

        // Q(λ) Eligibility Traces — Replacing Traces variant
        // Ref: Singh & Sutton, 1996 — "RL with Replacing Eligibility Traces"
        // Each entry: traces[stateKey][actionKey] = traceValue (0..1)
        this.traces = {};

        // Fase 1: OCEAN personality
        this.personality = personalityId
            ? generatePersonality(personalityId)
            : generateRandomPersonality();

        // Fase 2: Emotional State Machine
        this.emotions = new EmotionalEngine(this.personality);

        // SPEC-122 BUG-054: episodic memory — last N decisions+outcomes for RAG.
        this.memory = [];
        this.memoryMax = 30;

        this._restore();
    }

    // ─── EMOTIONAL INTERFACE (Fase 2) ────────────────────────

    /**
     * Process a match result through the Emotional Engine.
     * Call this AFTER each match to update the bot's emotional state.
     *
     * @param {'W'|'D'|'L'} result
     * @param {number} streak — current streak (positive=wins, negative=losses)
     * @param {boolean} [isRelegationRisk=false]
     * @returns {{ from, to, changed }}
     */
    processMatchResult(result, streak, isRelegationRisk = false) {
        const event = result === 'W' ? 'WIN' : result === 'D' ? 'DRAW' : 'LOSS';
        return this.emotions.processEvent(event, streak, isRelegationRisk);
    }

    /**
     * Process a major season event.
     * @param {'TITLE'|'PROMOTION'|'RELEGATION_RISK'|'STREAK_BROKEN'} event
     */
    processSeasonEvent(event, streak = 0) {
        return this.emotions.processEvent(event, streak);
    }

    /**
     * Get current emotional state name.
     */
    get emotionalState() {
        return this.emotions.state;
    }

    // ─── MEMORY ──────────────────────────────────────────────

    /**
     * Append decision+outcome to episodic memory (ring buffer).
     */
    remember(entry) {
        if (!entry) return;
        this.memory.push({ ts: Date.now(), ...entry });
        if (this.memory.length > this.memoryMax) {
            this.memory = this.memory.slice(-this.memoryMax);
        }
    }

    /**
     * Get formatted memory context for LLM RAG prompt.
     */
    recallContext(limit = 10) {
        return this.memory.slice(-limit).map((m, i) => {
            const r = (m.reward != null) ? `r=${m.reward.toFixed(1)}` : '';
            return `${i + 1}. wk${m.week ?? '?'}: ${m.action || m.decision || '?'} → ${m.result || ''} ${r}`.trim();
        }).join('\n');
    }

    // ─── PERSISTENCE ─────────────────────────────────────────

    _restore() {
        try {
            if (typeof localStorage === 'undefined') return;
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed.qTable) this.qTable = parsed.qTable;
            if (parsed.visitCount) this.visitCount = parsed.visitCount;
            if (typeof parsed.totalUpdates === 'number') this.totalUpdates = parsed.totalUpdates;
            if (Array.isArray(parsed.memory)) this.memory = parsed.memory;
            if (parsed.personality) this.personality = parsed.personality;
            if (parsed.emotions) this.emotions.restore(parsed.emotions);
        } catch { /* ignore */ }
    }

    save() {
        try {
            if (typeof localStorage === 'undefined') return;
            const payload = {
                qTable: this.qTable,
                visitCount: this.visitCount,
                totalUpdates: this.totalUpdates,
                memory: this.memory,
                personality: this.personality,
                emotions: this.emotions.serialize(),
                savedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            this.lastSavedAt = Date.now();
        } catch { /* ignore */ }
    }

    reset() {
        this.qTable = {};
        this.visitCount = {};
        this.traces = {};
        this.totalUpdates = 0;
        this.memory = [];
        this.emotions.forceState('CALM');
        try {
            if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
        } catch { /* ignore */ }
    }

    // ─── Q-LEARNING CORE ─────────────────────────────────────

    getQ(stateKey, actionKey) {
        return this.qTable[stateKey]?.[actionKey] ?? 0;
    }

    /**
     * Pick action: epsilon-greedy + goal modulation + emotional modifiers.
     */
    pickAction(stateKey, availableActions, ctx = {}) {
        if (!Array.isArray(availableActions) || availableActions.length === 0) return null;

        const emo = this.emotions.getModifiers();

        // Emotional tactic override (DESPERATE forces attacking)
        if (emo.tacticOverride) {
            const forced = availableActions.find(a => a.includes(emo.tacticOverride));
            if (forced) return forced;
        }

        // Effective epsilon = base × emotional modifier × AI Director modifier
        const directorMod = this._aiDirectorMod || 1.0;
        const effectiveEpsilon = Math.min(0.95, BASE_EPSILON * emo.epsilonMod * (2.0 - directorMod));

        // TILT MECHANIC: high epsilonMod makes decisions erratic
        const lossStreak = ctx.lossStreak || 0;
        if (checkIsTilted(this.personality, lossStreak)) {
            if (systemRng() < 0.5) {
                return availableActions[Math.floor(systemRng() * availableActions.length)];
            }
        }

        // Cold start or exploration
        const visits = this.visitCount[stateKey] || 0;
        if (visits < 3 || systemRng() < effectiveEpsilon) {
            return availableActions[Math.floor(systemRng() * availableActions.length)];
        }

        // Exploit: pick action with highest Q + goal-modulated score
        const goals = detectGoals(ctx, this.personality);
        let bestAction = availableActions[0];
        let bestScore = -Infinity;
        for (const action of availableActions) {
            const q = this.getQ(stateKey, action);
            const goalBoost = goals.reduce((sum, g) => sum + g.weight * actionRelevance(action, g.goal), 0);
            const score = q + goalBoost;
            if (score > bestScore) {
                bestScore = score;
                bestAction = action;
            }
        }
        return bestAction;
    }

    /**
     * Q(λ) with Replacing Eligibility Traces.
     *
     * Ref: Sutton & Barto, Ch.12 (2018); Singh & Sutton (1996).
     *
     * Instead of updating only Q[s][a], we:
     *   1. Compute TD error δ = r + γ·max(Q[s'][a']) - Q[s][a]
     *   2. Set trace e[s][a] = 1 (replacing, not accumulating)
     *   3. Update ALL traced state-action pairs: Q[s'][a'] += α·δ·e[s'][a']
     *   4. Decay all traces: e[s'][a'] *= γ·λ
     *
     * This propagates credit ~3-4 steps back (with λ=0.7),
     * making the bot learn 3-5x faster from delayed rewards.
     */
    observe(stateKey, actionKey, reward, nextStateKey, nextActions = []) {
        if (!this.qTable[stateKey]) this.qTable[stateKey] = {};
        const oldQ = this.qTable[stateKey][actionKey] || 0;

        let maxNextQ = 0;
        if (nextStateKey && nextActions.length > 0) {
            maxNextQ = Math.max(...nextActions.map(a => this.getQ(nextStateKey, a)));
        }

        // TD error (same as before)
        const delta = reward + GAMMA * maxNextQ - oldQ;

        // Replacing trace: set current (s,a) to 1.0
        // (replaces rather than accumulates — more stable for control tasks)
        if (!this.traces[stateKey]) this.traces[stateKey] = {};
        this.traces[stateKey][actionKey] = 1.0;

        // Propagate TD error to ALL traced state-action pairs
        const traceStates = Object.keys(this.traces);
        for (let i = traceStates.length - 1; i >= 0; i--) {
            const ts = traceStates[i];
            const actions = this.traces[ts];
            const actionKeys = Object.keys(actions);
            for (let j = actionKeys.length - 1; j >= 0; j--) {
                const ta = actionKeys[j];
                const trace = actions[ta];

                // Update Q-value weighted by trace
                if (!this.qTable[ts]) this.qTable[ts] = {};
                this.qTable[ts][ta] = (this.qTable[ts][ta] || 0) + ALPHA * delta * trace;

                // Decay trace
                const decayed = trace * GAMMA * LAMBDA;
                if (decayed < TRACE_MIN) {
                    delete actions[ta];
                } else {
                    actions[ta] = decayed;
                }
            }
            // Clean empty state entries
            if (Object.keys(actions).length === 0) {
                delete this.traces[ts];
            }
        }

        // Bound trace table (emergency pruning if too large)
        this._pruneTraces();

        this.visitCount[stateKey] = (this.visitCount[stateKey] || 0) + 1;
        this.totalUpdates++;

        // Bound Q-table size — evict LRU-ish (lowest visit count)
        if (Object.keys(this.qTable).length > MAX_BUCKETS) {
            const sortedByVisits = Object.keys(this.visitCount)
                .sort((a, b) => (this.visitCount[a] || 0) - (this.visitCount[b] || 0));
            const toEvict = sortedByVisits[0];
            if (toEvict && toEvict !== stateKey) {
                delete this.qTable[toEvict];
                delete this.visitCount[toEvict];
                delete this.traces[toEvict]; // also evict traces
            }
        }

        // Save throttled (every 50 updates)
        if (this.totalUpdates % 50 === 0) this.save();
    }

    /**
     * Clear all eligibility traces. Call at episode boundaries
     * (e.g. season end) to prevent cross-episode credit leakage.
     */
    clearTraces() {
        this.traces = {};
    }

    /**
     * Prune trace table if it exceeds MAX_TRACE_ENTRIES.
     * Removes entries with lowest trace values first.
     * @private
     */
    _pruneTraces() {
        let count = 0;
        for (const s of Object.keys(this.traces)) {
            count += Object.keys(this.traces[s]).length;
        }
        if (count <= MAX_TRACE_ENTRIES) return;

        // Collect all trace entries and sort by value (ascending)
        const entries = [];
        for (const s of Object.keys(this.traces)) {
            for (const a of Object.keys(this.traces[s])) {
                entries.push({ s, a, v: this.traces[s][a] });
            }
        }
        entries.sort((a, b) => a.v - b.v);

        // Remove lowest half
        const toRemove = Math.floor(entries.length / 2);
        for (let i = 0; i < toRemove; i++) {
            const { s, a } = entries[i];
            if (this.traces[s]) {
                delete this.traces[s][a];
                if (Object.keys(this.traces[s]).length === 0) delete this.traces[s];
            }
        }
    }

    // ─── ANALYTICS ───────────────────────────────────────────

    topActions(limit = 10) {
        const tally = {};
        for (const stateKey of Object.keys(this.qTable)) {
            for (const actionKey of Object.keys(this.qTable[stateKey])) {
                tally[actionKey] = (tally[actionKey] || 0) + this.qTable[stateKey][actionKey];
            }
        }
        return Object.entries(tally)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([action, totalQ]) => ({ action, totalQ }));
    }

    summary() {
        // Count active trace entries
        let traceEntries = 0;
        for (const s of Object.keys(this.traces)) {
            traceEntries += Object.keys(this.traces[s]).length;
        }
        return {
            states: Object.keys(this.qTable).length,
            totalUpdates: this.totalUpdates,
            activeTraces: traceEntries,
            lambda: LAMBDA,
            topActions: this.topActions(5),
            personality: {
                id: this.personality?.id,
                label: this.personality?.label,
                ocean: this.personality?.ocean,
                traits: this.personality?.traits
            },
            emotional: this.emotions.summary()
        };
    }
}
