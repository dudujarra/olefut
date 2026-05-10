/**
 * LearnedEmotionalModifiers — SARSA(λ) for Emotional Response Tuning
 *
 * Ref: Rummery & Niranjan (1994) — "On-Line Q-Learning Using Connectionist
 *      Systems" (original SARSA)
 *      Sutton & Barto (2018) — Ch.12 Eligibility Traces
 *
 * The EmotionalEngine FSM stays intact (it models real emotional states well).
 * This module REPLACES the hardcoded STATES modifier table with learned values.
 *
 * Instead of:
 *   ANXIOUS: { epsilonMod: 1.5, lossMod: 2.0, riskMod: 0.30 }  ← fixed
 *
 * We learn:
 *   ANXIOUS + bottom + poor + late: { epsilonMod: ?, lossMod: ?, riskMod: ? }
 *     → SARSA(λ) discovers optimal modifiers per context
 *
 * WHY SARSA NOT Q-LEARNING?
 * SARSA is on-policy: it learns the value of the policy BEING FOLLOWED,
 * including "bad" emotional actions. For emotion modeling this is crucial —
 * we DON'T want the agent to learn a cold "optimal" policy that ignores
 * the cost of emotional decisions. SARSA naturally learns safe/conservative
 * responses in risky situations.
 *
 * State: (emotionalState, positionTier, balanceTier, seasonPhase)
 * Actions: modifier presets (LOW, MEDIUM, HIGH for each modifier dimension)
 * Reward: same reward signal from AdaptiveBrain.observe()
 */

import { rng as systemRng } from '../../engine/rng.js';

const STORAGE_KEY = 'elifoot_emotion_sarsa';

// SARSA(λ) hyperparameters
const ALPHA = 0.08;      // learning rate (slightly lower than Q-learning for stability)
const GAMMA = 0.85;       // discount factor
const LAMBDA = 0.6;       // trace decay (shorter than Q(λ) — emotions are more local)
const EPSILON = 0.12;     // exploration rate
const TRACE_MIN = 0.01;
const MAX_STATES = 200;   // bound state table

// ─── MODIFIER PRESETS ───────────────────────────────────────
// Instead of learning continuous values (needs neural net),
// we discretize into 3-5 presets per emotional response dimension.
// SARSA picks the best preset combo for each (emotion, context).

const RESPONSE_PRESETS = {
    // How much to explore (epsilonMod)
    EXPLORE_LOW:    { epsilonMod: 0.3 },   // stick with what works
    EXPLORE_NORMAL: { epsilonMod: 1.0 },   // baseline
    EXPLORE_HIGH:   { epsilonMod: 2.0 },   // try new things
    EXPLORE_WILD:   { epsilonMod: 3.5 },   // panic exploration

    // How much losses hurt (lossMod)
    LOSS_NUMB:      { lossMod: 0.5 },      // desensitized
    LOSS_NORMAL:    { lossMod: 1.0 },      // baseline
    LOSS_PAINFUL:   { lossMod: 2.0 },      // losses hurt extra
    LOSS_CRUSHING:  { lossMod: 3.0 },      // devastating

    // Risk appetite for spending (riskMod)
    RISK_CAUTIOUS:  { riskMod: 0.20 },     // very conservative
    RISK_NORMAL:    { riskMod: 0.40 },     // baseline
    RISK_AGGRESSIVE:{ riskMod: 0.65 },     // willing to spend
    RISK_YOLO:      { riskMod: 0.90 },     // all in
};

// Each "emotional action" is a combo of 3 dimensions
// Total: 4 × 4 × 4 = 64 possible response combos
// But we'll use representative presets to keep it manageable
const EMOTIONAL_ACTIONS = [
    // Conservative responses
    { id: 'STOIC',       epsilonMod: 0.3, lossMod: 0.5, riskMod: 0.20, tacticOverride: null },
    { id: 'CAUTIOUS',    epsilonMod: 0.5, lossMod: 1.0, riskMod: 0.25, tacticOverride: null },
    { id: 'COMPOSED',    epsilonMod: 0.8, lossMod: 0.8, riskMod: 0.35, tacticOverride: null },

    // Balanced responses
    { id: 'NEUTRAL',     epsilonMod: 1.0, lossMod: 1.0, riskMod: 0.40, tacticOverride: null },
    { id: 'ADAPTIVE',    epsilonMod: 1.2, lossMod: 1.2, riskMod: 0.45, tacticOverride: null },

    // Aggressive responses
    { id: 'BOLD',        epsilonMod: 0.4, lossMod: 0.6, riskMod: 0.60, tacticOverride: null },
    { id: 'AGGRESSIVE',  epsilonMod: 1.5, lossMod: 1.5, riskMod: 0.55, tacticOverride: 'offensive' },
    { id: 'RECKLESS',    epsilonMod: 2.5, lossMod: 2.0, riskMod: 0.70, tacticOverride: 'offensive' },

    // Defensive responses
    { id: 'DEFENSIVE',   epsilonMod: 0.6, lossMod: 1.5, riskMod: 0.20, tacticOverride: 'defensive' },
    { id: 'BUNKER',      epsilonMod: 0.3, lossMod: 2.0, riskMod: 0.15, tacticOverride: 'defensive' },

    // Panic responses
    { id: 'PANICKED',    epsilonMod: 3.0, lossMod: 2.5, riskMod: 0.80, tacticOverride: null },
    { id: 'DESPERATE',   epsilonMod: 4.0, lossMod: 3.0, riskMod: 0.90, tacticOverride: 'offensive' },
];

const ACTION_IDS = EMOTIONAL_ACTIONS.map(a => a.id);
const ACTION_MAP = Object.fromEntries(EMOTIONAL_ACTIONS.map(a => [a.id, a]));

// ─── SARSA(λ) CLASS ─────────────────────────────────────────

export class LearnedEmotionalModifiers {
    constructor() {
        this.qTable = {};      // state → action → Q-value
        this.traces = {};      // eligibility traces
        this.visitCount = {};
        this.totalUpdates = 0;

        // SARSA needs to remember the last (state, action, reward) tuple
        this._lastState = null;
        this._lastAction = null;
        this._lastReward = 0;

        this._restore();
    }

    /**
     * Encode emotional context into a state key.
     * Uses: emotional state + position tier + balance tier + season phase
     *
     * @param {string} emotionState — current FSM state (CALM, ANXIOUS, etc.)
     * @param {Object} ctx — game context from _buildStateCtx()
     * @returns {string} e.g. "ANXIOUS|bottom|poor|late"
     */
    encodeState(emotionState, ctx = {}) {
        const pos = ctx.position || 10;
        const totalTeams = ctx.totalTeams || 20;
        const posTier = pos <= Math.floor(totalTeams * 0.25) ? 'top'
            : pos <= Math.floor(totalTeams * 0.6) ? 'mid'
            : pos <= Math.floor(totalTeams * 0.8) ? 'bottom' : 'rele';

        const bal = ctx.balance || 0;
        const balTier = bal > 5_000_000 ? 'rich'
            : bal > 1_000_000 ? 'ok'
            : bal > 0 ? 'poor' : 'broke';

        const week = ctx.week || 0;
        const phase = week < 13 ? 'early' : (week < 26 ? 'mid' : 'late');

        return `${emotionState}|${posTier}|${balTier}|${phase}`;
    }

    /**
     * Pick an emotional response action using ε-greedy from SARSA Q-table.
     *
     * @param {string} stateKey — from encodeState()
     * @returns {{ actionId: string, modifiers: Object }}
     */
    pickResponse(stateKey) {
        // ε-greedy exploration
        if (systemRng() < EPSILON || !this.qTable[stateKey]) {
            const idx = Math.floor(systemRng() * EMOTIONAL_ACTIONS.length);
            const action = EMOTIONAL_ACTIONS[idx];
            return { actionId: action.id, modifiers: { ...action } };
        }

        // Exploit: pick action with highest Q-value
        const stateQ = this.qTable[stateKey];
        let bestId = ACTION_IDS[0];
        let bestQ = -Infinity;

        for (const id of ACTION_IDS) {
            const q = stateQ[id] || 0;
            if (q > bestQ) {
                bestQ = q;
                bestId = id;
            }
        }

        const action = ACTION_MAP[bestId];
        return { actionId: bestId, modifiers: { ...action } };
    }

    /**
     * SARSA(λ) update with replacing eligibility traces.
     *
     * SARSA update rule:
     *   Q(s,a) += α · [r + γ · Q(s',a') - Q(s,a)] · e(s,a)
     *
     * Where a' is the ACTUAL next action (not max — this is on-policy).
     *
     * Call pattern: observe(s', a', r) where r is the reward received
     * for the PREVIOUS action that led to s'.
     *
     * @param {string} stateKey — current state s'
     * @param {string} actionId — current action a' (just chosen)
     * @param {number} reward — reward received from previous (s,a) transition
     */
    observe(stateKey, actionId, reward) {
        if (!this._lastState || !this._lastAction) {
            // First step — just record, no update yet
            this._lastState = stateKey;
            this._lastAction = actionId;
            this._lastReward = reward;
            return;
        }

        // SARSA TD error uses the reward from the PREVIOUS step
        // r = reward received after taking _lastAction in _lastState
        const r = this._lastReward;

        // SARSA: use Q(s', a') where a' is the ACTUALLY chosen action (on-policy)
        if (!this.qTable[this._lastState]) this.qTable[this._lastState] = {};
        const oldQ = this.qTable[this._lastState][this._lastAction] || 0;

        if (!this.qTable[stateKey]) this.qTable[stateKey] = {};
        const nextQ = this.qTable[stateKey][actionId] || 0;

        // TD error (SARSA — uses actual next action, not max)
        const delta = r + GAMMA * nextQ - oldQ;

        // Replacing trace for last (state, action)
        if (!this.traces[this._lastState]) this.traces[this._lastState] = {};
        this.traces[this._lastState][this._lastAction] = 1.0;

        // Propagate TD error to all traced state-action pairs
        for (const s of Object.keys(this.traces)) {
            const actions = this.traces[s];
            for (const a of Object.keys(actions)) {
                const trace = actions[a];

                if (!this.qTable[s]) this.qTable[s] = {};
                this.qTable[s][a] = (this.qTable[s][a] || 0) + ALPHA * delta * trace;

                // Decay trace
                const decayed = trace * GAMMA * LAMBDA;
                if (decayed < TRACE_MIN) {
                    delete actions[a];
                } else {
                    actions[a] = decayed;
                }
            }
            if (Object.keys(actions).length === 0) {
                delete this.traces[s];
            }
        }

        this.visitCount[stateKey] = (this.visitCount[stateKey] || 0) + 1;
        this.totalUpdates++;

        // Bound Q-table size
        if (Object.keys(this.qTable).length > MAX_STATES) {
            const sorted = Object.keys(this.visitCount)
                .sort((a, b) => (this.visitCount[a] || 0) - (this.visitCount[b] || 0));
            const evict = sorted[0];
            if (evict && evict !== stateKey) {
                delete this.qTable[evict];
                delete this.visitCount[evict];
                delete this.traces[evict];
            }
        }

        // Update last state/action/reward for next SARSA step
        this._lastState = stateKey;
        this._lastAction = actionId;
        this._lastReward = reward;

        // Save throttled
        if (this.totalUpdates % 30 === 0) this.save();
    }

    /**
     * Clear traces at episode boundary (season end).
     */
    clearTraces() {
        this.traces = {};
        this._lastState = null;
        this._lastAction = null;
        this._lastReward = 0;
    }

    // ─── PERSISTENCE ────────────────────────────────────────

    _restore() {
        try {
            if (typeof localStorage === 'undefined') return;
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed.qTable) this.qTable = parsed.qTable;
            if (parsed.visitCount) this.visitCount = parsed.visitCount;
            if (typeof parsed.totalUpdates === 'number') this.totalUpdates = parsed.totalUpdates;
        } catch { /* ignore */ }
    }

    save() {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                qTable: this.qTable,
                visitCount: this.visitCount,
                totalUpdates: this.totalUpdates,
                savedAt: Date.now()
            }));
        } catch { /* ignore */ }
    }

    reset() {
        this.qTable = {};
        this.traces = {};
        this.visitCount = {};
        this.totalUpdates = 0;
        this._lastState = null;
        this._lastAction = null;
        this._lastReward = 0;
        try {
            if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
        } catch { /* ignore */ }
    }

    // ─── ANALYTICS ──────────────────────────────────────────

    /**
     * Get the preferred response for an emotional state across all contexts.
     */
    preferredResponse(emotionState) {
        const matches = {};
        for (const stateKey of Object.keys(this.qTable)) {
            if (!stateKey.startsWith(emotionState + '|')) continue;
            const actions = this.qTable[stateKey];
            for (const [actionId, q] of Object.entries(actions)) {
                matches[actionId] = (matches[actionId] || 0) + q;
            }
        }
        const sorted = Object.entries(matches).sort((a, b) => b[1] - a[1]);
        return sorted.length > 0 ? sorted[0][0] : 'NEUTRAL';
    }

    summary() {
        let traceCount = 0;
        for (const s of Object.keys(this.traces)) {
            traceCount += Object.keys(this.traces[s]).length;
        }
        return {
            states: Object.keys(this.qTable).length,
            totalUpdates: this.totalUpdates,
            activeTraces: traceCount,
            preferredByEmotion: {
                CALM: this.preferredResponse('CALM'),
                CONFIDENT: this.preferredResponse('CONFIDENT'),
                ANXIOUS: this.preferredResponse('ANXIOUS'),
                TILTED: this.preferredResponse('TILTED'),
                DESPERATE: this.preferredResponse('DESPERATE')
            }
        };
    }
}
