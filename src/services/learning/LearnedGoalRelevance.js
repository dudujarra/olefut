/**
 * LearnedGoalRelevance — Contextual Bandit for Goal-Action Relevance
 *
 * Ref: Agrawal & Goyal (2013) — "Thompson Sampling for Contextual Bandits
 *      with Linear Payoffs" (ICML)
 *
 * REPLACES the hardcoded GOAL_RELEVANCE matrix in AdaptiveBrain.js:
 *   AVOID_RELEGATION: { TACTIC_defensive: 0.7, ... }  ← fixed forever
 *
 * WITH a learned matrix where each (goal, action) pair has a Thompson
 * Beta distribution that converges to the true relevance via online learning.
 *
 * HOW IT WORKS:
 * 1. Each (goal, action) pair has alpha/beta parameters (Beta distribution)
 * 2. When queried, sample from Beta(alpha, beta) → stochastic relevance score
 * 3. After observing outcome, update alpha (success) or beta (failure)
 * 4. Over time, the distribution narrows around the true relevance
 *
 * WARM START:
 * Initialized from the hardcoded GOAL_RELEVANCE values:
 *   relevance=0.7 → alpha=7, beta=3 (70% prior success rate)
 * This preserves heuristic wisdom while allowing online adaptation.
 *
 * COST: ~2 numbers per (goal, action) pair ≈ 120 bytes total
 */

import { rng as systemRng } from '../../engine/rng.js';

const STORAGE_KEY = 'elifoot_goal_relevance';

// ─── HARDCODED PRIORS (from AdaptiveBrain.js GOAL_RELEVANCE) ─────
// These become the warm-start priors for the learned matrix.
// Format: { goal: { action: relevance_score } }
const INITIAL_RELEVANCE = {
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

// Marsaglia & Tsang (2000) Gamma sampling (same as ThompsonBandit.js)
function gammaSample(shape) {
    if (shape < 1) {
        const u = systemRng();
        return gammaSample(shape + 1) * Math.pow(u, 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
        let x, v;
        do {
            x = normalSample();
            v = 1 + c * x;
        } while (v <= 0);
        v = v * v * v;
        const u = systemRng();
        if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
}

function normalSample() {
    const u1 = systemRng();
    const u2 = systemRng();
    return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

function betaSample(alpha, beta) {
    if (alpha <= 0) alpha = 0.01;
    if (beta <= 0) beta = 0.01;
    const x = gammaSample(alpha);
    const y = gammaSample(beta);
    return x / (x + y || 1);
}

// ─── LEARNED GOAL RELEVANCE ────────────────────────────────────

export class LearnedGoalRelevance {
    constructor() {
        // relevance[goal][action] = { alpha, beta }
        this.relevance = {};
        this.totalUpdates = 0;

        this._restore();

        // Warm-start from hardcoded priors if fresh
        if (Object.keys(this.relevance).length === 0) {
            this._warmStartFromPriors();
        }
    }

    /**
     * Convert hardcoded relevance scores to Beta distribution params.
     * Score of 0.7 → alpha=7, beta=3 (70% success prior)
     * Score of -0.5 → alpha=1, beta=6 (low success prior)
     * Strength of 10 → 10 "virtual observations" (moderate confidence)
     */
    _warmStartFromPriors() {
        const STRENGTH = 10; // virtual observations

        for (const [goal, actions] of Object.entries(INITIAL_RELEVANCE)) {
            if (!this.relevance[goal]) this.relevance[goal] = {};

            for (const [action, score] of Object.entries(actions)) {
                // Map score [-1, 1] to success probability [0, 1]
                const prob = Math.max(0.05, Math.min(0.95, (score + 1) / 2));
                this.relevance[goal][action] = {
                    alpha: prob * STRENGTH,
                    beta: (1 - prob) * STRENGTH
                };
            }
        }
    }

    /**
     * Get the learned relevance of an action for a goal.
     * Returns a Thompson-sampled value (stochastic for exploration).
     *
     * @param {string} action — e.g. 'TACTIC_defensive'
     * @param {string} goal — e.g. 'AVOID_RELEGATION'
     * @returns {number} sampled relevance in [-1, 1] range
     */
    getRelevance(action, goal) {
        if (!this.relevance[goal]?.[action]) {
            // Unknown pair — return 0 (neutral) with slight exploration
            return (systemRng() - 0.5) * 0.2;
        }

        const { alpha, beta } = this.relevance[goal][action];
        // Sample from Beta → [0,1] → map back to [-1, 1]
        const sample = betaSample(alpha, beta);
        return sample * 2 - 1;
    }

    /**
     * Get the mean (expected) relevance without Thompson exploration.
     * Use for analytics/debugging.
     *
     * @param {string} action
     * @param {string} goal
     * @returns {number} expected relevance in [-1, 1]
     */
    getMeanRelevance(action, goal) {
        if (!this.relevance[goal]?.[action]) return 0;
        const { alpha, beta } = this.relevance[goal][action];
        const mean = alpha / (alpha + beta);
        return mean * 2 - 1;
    }

    /**
     * Update the relevance of an action for a goal after observing outcome.
     *
     * @param {string} goal — the active goal
     * @param {string} action — the action taken
     * @param {boolean|number} wasGoodOutcome — true/positive = success, false/negative = failure
     */
    update(goal, action, wasGoodOutcome) {
        if (!this.relevance[goal]) this.relevance[goal] = {};
        if (!this.relevance[goal][action]) {
            this.relevance[goal][action] = { alpha: 1, beta: 1 };
        }

        const params = this.relevance[goal][action];

        if (typeof wasGoodOutcome === 'number') {
            // Continuous reward: scale update
            if (wasGoodOutcome > 0) {
                params.alpha += Math.min(3, wasGoodOutcome);
            } else {
                params.beta += Math.min(3, Math.abs(wasGoodOutcome));
            }
        } else {
            // Boolean: simple increment
            if (wasGoodOutcome) params.alpha += 1;
            else params.beta += 1;
        }

        // Decay to prevent distribution from getting too tight
        // (allows adaptation to meta changes)
        if (params.alpha + params.beta > 100) {
            const scale = 80 / (params.alpha + params.beta);
            params.alpha *= scale;
            params.beta *= scale;
        }

        this.totalUpdates++;
        if (this.totalUpdates % 50 === 0) this.save();
    }

    // ─── PERSISTENCE ────────────────────────────────────────

    save() {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                relevance: this.relevance,
                totalUpdates: this.totalUpdates,
                savedAt: Date.now()
            }));
        } catch { /* ignore */ }
    }

    _restore() {
        try {
            if (typeof localStorage === 'undefined') return;
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed.relevance) this.relevance = parsed.relevance;
            if (typeof parsed.totalUpdates === 'number') this.totalUpdates = parsed.totalUpdates;
        } catch { /* ignore */ }
    }

    reset() {
        this.relevance = {};
        this.totalUpdates = 0;
        try {
            if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
        } catch { /* ignore */ }
        this._warmStartFromPriors();
    }

    // ─── ANALYTICS ──────────────────────────────────────────

    summary() {
        let totalPairs = 0;
        const goalSummary = {};

        for (const [goal, actions] of Object.entries(this.relevance)) {
            const actionCount = Object.keys(actions).length;
            totalPairs += actionCount;

            // Find top action for this goal
            let bestAction = null, bestMean = -Infinity;
            for (const [action, params] of Object.entries(actions)) {
                const mean = params.alpha / (params.alpha + params.beta);
                if (mean > bestMean) {
                    bestMean = mean;
                    bestAction = action;
                }
            }
            goalSummary[goal] = {
                actions: actionCount,
                topAction: bestAction,
                topRelevance: bestMean ? (bestMean * 2 - 1).toFixed(2) : '0'
            };
        }

        return {
            totalPairs,
            totalUpdates: this.totalUpdates,
            goals: goalSummary
        };
    }
}
