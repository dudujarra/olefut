/**
 * ThompsonBandit — Contextual Multi-Armed Bandit via Thompson Sampling
 *
 * Ref: Thompson (1933) — "On the likelihood that one unknown probability
 *      exceeds another in view of the evidence of two samples"
 *      Chapelle & Li (2011) — "An Empirical Evaluation of Thompson Sampling"
 *      Agrawal & Goyal (2013) — "Thompson Sampling for Contextual Bandits
 *      with Linear Payoffs" (ICML)
 *
 * Each arm (action) maintains a Beta(α, β) distribution.
 * - Success: α += reward magnitude
 * - Failure: β += |reward| magnitude
 *
 * Contextual variant: separate Beta params per (context, action) pair.
 * Context is a discretized string key (e.g. "top4|rich|early").
 *
 * Zero neural net. ~2 numbers per (context, action) pair.
 * Runs in <0.01ms per decision.
 *
 * Usage:
 *   const bandit = new ThompsonBandit('teamTalk', ['motivate', 'calm', 'demand']);
 *   const action = bandit.pick(contextKey);
 *   // ... observe outcome ...
 *   bandit.update(contextKey, action, reward);
 */

import { rng as systemRng } from '../../engine/rng.js';

const STORAGE_KEY_PREFIX = 'elifoot_bandit_';
const MAX_CONTEXTS = 100; // bound per-bandit context table
const PRIOR_ALPHA = 1;    // uniform prior
const PRIOR_BETA = 1;     // uniform prior

// ─── BETA DISTRIBUTION SAMPLING ─────────────────────────────
// Pure JS implementation — no library needed.
// Uses Jöhnk's algorithm for Beta sampling via Gamma samples.

/**
 * Sample from Gamma(shape, 1) using Marsaglia & Tsang's method.
 * Ref: Marsaglia & Tsang (2000) — "A Simple Method for Generating Gamma Variables"
 * @param {number} shape — must be > 0
 * @returns {number}
 */
function gammaSample(shape) {
    if (shape < 1) {
        // Boost: Gamma(a) = Gamma(a+1) * U^(1/a) for a < 1
        return gammaSample(shape + 1) * Math.pow(systemRng(), 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
        let x, v;
        do {
            // Box-Muller for normal sample
            const u1 = systemRng();
            const u2 = systemRng();
            x = Math.sqrt(-2 * Math.log(Math.max(1e-10, u1))) * Math.cos(2 * Math.PI * u2);
            v = 1 + c * x;
        } while (v <= 0);
        v = v * v * v;
        const u = systemRng();
        if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
        if (Math.log(Math.max(1e-10, u)) < 0.5 * x * x + d * (1 - v + Math.log(Math.max(1e-10, v)))) return d * v;
    }
}

/**
 * Sample from Beta(alpha, beta) distribution.
 * Uses ratio of independent Gamma samples.
 * @param {number} alpha — shape parameter (successes + 1)
 * @param {number} beta — shape parameter (failures + 1)
 * @returns {number} sample in (0, 1)
 */
export function betaSample(alpha, beta) {
    const x = gammaSample(alpha);
    const y = gammaSample(beta);
    if (x + y === 0) return 0.5; // degenerate case
    return x / (x + y);
}

// ─── THOMPSON BANDIT CLASS ──────────────────────────────────

export class ThompsonBandit {
    /**
     * @param {string} name — unique name for persistence (e.g. 'teamTalk', 'training')
     * @param {string[]} defaultActions — initial set of possible actions
     */
    constructor(name, defaultActions = []) {
        this.name = name;
        this.defaultActions = defaultActions;
        this.totalPicks = 0;
        this.totalUpdates = 0;

        // arms[contextKey][actionKey] = { alpha, beta }
        this.arms = {};

        this._restore();
    }

    /**
     * Pick the best action for a given context using Thompson Sampling.
     * Samples from each arm's Beta distribution and returns the action
     * with the highest sampled value.
     *
     * @param {string} contextKey — discretized context (e.g. "top4|rich|early")
     * @param {string[]} [availableActions] — override default actions
     * @returns {string} chosen action
     */
    pick(contextKey = 'default', availableActions = null) {
        const actions = availableActions || this.defaultActions;
        if (!actions || actions.length === 0) return null;
        if (actions.length === 1) return actions[0];

        const ctxArms = this.arms[contextKey] || {};
        let bestAction = actions[0];
        let bestSample = -Infinity;

        for (const action of actions) {
            const params = ctxArms[action] || { alpha: PRIOR_ALPHA, beta: PRIOR_BETA };
            const sample = betaSample(params.alpha, params.beta);
            if (sample > bestSample) {
                bestSample = sample;
                bestAction = action;
            }
        }

        this.totalPicks++;
        return bestAction;
    }

    /**
     * Update the arm's Beta distribution based on observed outcome.
     *
     * @param {string} contextKey — same context used in pick()
     * @param {string} action — action taken
     * @param {number} reward — positive = success, negative = failure.
     *                          Magnitude controls update strength.
     */
    update(contextKey = 'default', action, reward) {
        if (!action) return;
        if (!this.arms[contextKey]) this.arms[contextKey] = {};
        if (!this.arms[contextKey][action]) {
            this.arms[contextKey][action] = { alpha: PRIOR_ALPHA, beta: PRIOR_BETA };
        }

        const arm = this.arms[contextKey][action];
        if (reward > 0) {
            // Success: increment alpha (capped to avoid overflow)
            arm.alpha = Math.min(arm.alpha + Math.min(reward, 5), 500);
        } else if (reward < 0) {
            // Failure: increment beta
            arm.beta = Math.min(arm.beta + Math.min(Math.abs(reward), 5), 500);
        }
        // reward === 0: no update (neutral outcome)

        this.totalUpdates++;

        // Bound context table size
        this._pruneContexts();

        // Save throttled (every 20 updates)
        if (this.totalUpdates % 20 === 0) this.save();
    }

    /**
     * Get the empirical success rate for an action in a context.
     * @returns {number} rate in [0, 1]
     */
    getRate(contextKey, action) {
        const arm = this.arms[contextKey]?.[action];
        if (!arm) return 0.5; // prior
        return arm.alpha / (arm.alpha + arm.beta);
    }

    /**
     * Get all arms for a context, sorted by success rate.
     * @returns {Array<{action, alpha, beta, rate}>}
     */
    getRanking(contextKey = 'default') {
        const ctxArms = this.arms[contextKey] || {};
        return Object.entries(ctxArms)
            .map(([action, { alpha, beta }]) => ({
                action,
                alpha,
                beta,
                rate: alpha / (alpha + beta),
                samples: alpha + beta - 2 // subtract priors
            }))
            .sort((a, b) => b.rate - a.rate);
    }

    // ─── WARM START FROM HEURISTICS ─────────────────────────

    /**
     * Initialize an arm with prior knowledge (e.g. from hardcoded heuristics).
     * Converts a "confidence" (0..1) into α/β params.
     *
     * Example: warmStart('default', 'motivate', 0.7, 20)
     *   → α = 0.7 * 20 + 1 = 15, β = 0.3 * 20 + 1 = 7
     *
     * @param {string} contextKey
     * @param {string} action
     * @param {number} confidence — prior belief of success (0..1)
     * @param {number} strength — how strongly to believe (pseudo-observations)
     */
    warmStart(contextKey, action, confidence, strength = 10) {
        if (!this.arms[contextKey]) this.arms[contextKey] = {};
        this.arms[contextKey][action] = {
            alpha: PRIOR_ALPHA + confidence * strength,
            beta: PRIOR_BETA + (1 - confidence) * strength
        };
    }

    // ─── PERSISTENCE ────────────────────────────────────────

    _restore() {
        try {
            if (typeof localStorage === 'undefined') return;
            const raw = localStorage.getItem(STORAGE_KEY_PREFIX + this.name);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed.arms) this.arms = parsed.arms;
            if (typeof parsed.totalPicks === 'number') this.totalPicks = parsed.totalPicks;
            if (typeof parsed.totalUpdates === 'number') this.totalUpdates = parsed.totalUpdates;
        } catch { /* ignore */ }
    }

    save() {
        try {
            if (typeof localStorage === 'undefined') return;
            const payload = {
                arms: this.arms,
                totalPicks: this.totalPicks,
                totalUpdates: this.totalUpdates,
                savedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEY_PREFIX + this.name, JSON.stringify(payload));
        } catch { /* ignore */ }
    }

    reset() {
        this.arms = {};
        this.totalPicks = 0;
        this.totalUpdates = 0;
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(STORAGE_KEY_PREFIX + this.name);
            }
        } catch { /* ignore */ }
    }

    /**
     * Prune oldest/least-used contexts if table exceeds MAX_CONTEXTS.
     * @private
     */
    _pruneContexts() {
        const contexts = Object.keys(this.arms);
        if (contexts.length <= MAX_CONTEXTS) return;

        // Remove contexts with fewest total observations
        const scored = contexts.map(ctx => {
            let total = 0;
            for (const arm of Object.values(this.arms[ctx])) {
                total += (arm.alpha - PRIOR_ALPHA) + (arm.beta - PRIOR_BETA);
            }
            return { ctx, total };
        }).sort((a, b) => a.total - b.total);

        // Remove bottom half
        const toRemove = Math.floor(scored.length / 2);
        for (let i = 0; i < toRemove; i++) {
            delete this.arms[scored[i].ctx];
        }
    }

    // ─── ANALYTICS ──────────────────────────────────────────

    summary() {
        let contextCount = 0;
        let armCount = 0;
        for (const ctx of Object.keys(this.arms)) {
            contextCount++;
            armCount += Object.keys(this.arms[ctx]).length;
        }
        return {
            name: this.name,
            contexts: contextCount,
            arms: armCount,
            totalPicks: this.totalPicks,
            totalUpdates: this.totalUpdates
        };
    }
}
