/**
 * AdaptiveBrain — SPEC-115 + SPEC-116 + SPEC-117
 *
 * Q-learning tabular with Bayesian fallback for cold-start.
 * Goal hierarchy modulates action selection.
 *
 * Persists to localStorage 'elifoot_autoplay_brain'.
 *
 * Pure functions where possible. Class encapsulates Q-table + state.
 *
 * Usage:
 *   const brain = new AdaptiveBrain();
 *   const action = brain.pickAction(state, availableActions);
 *   // ... apply action, get outcome ...
 *   brain.observe(state, action, reward, nextState);
 */

const STORAGE_KEY = 'elifoot_autoplay_brain';
const ALPHA = 0.1;       // learning rate
const GAMMA = 0.9;       // discount factor
const EPSILON = 0.15;    // exploration rate
const MAX_BUCKETS = 500; // bound table size

const POS_TIERS = ['top4', 'mid', 'bottom'];
const BAL_TIERS = ['red', 'low', 'mid', 'rich'];
const FORM_TIERS = ['poor', 'avg', 'good'];
const WEEK_PHASES = ['early', 'mid', 'late'];

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
    // BUG-042: add squadTier to diversify state space (was only 7 states explored
    // in playtest 3 because squad context same all run).
    const squadSize = ctx.squadSize || 0;
    const squadTier = squadSize < 11 ? 'thin' : (squadSize < 18 ? 'normal' : 'deep');
    return `${formTier}|${posTier}|${balTier}|${phase}|${last}|${squadTier}`;
}

/**
 * Detect active goals based on state context.
 * Returns array of { goal, weight }.
 */
export function detectGoals(ctx = {}) {
    const goals = [];
    const totalTeams = ctx.totalTeams || 20;
    const pos = ctx.position || totalTeams;

    if (pos > totalTeams * 0.75) goals.push({ goal: 'AVOID_RELEGATION', weight: 1.0 });
    if ((ctx.balance || 0) < 0) goals.push({ goal: 'FINANCIAL_HEALTH', weight: 0.8 });
    if (pos > 4 && pos <= totalTeams * 0.6) goals.push({ goal: 'CLIMB_POSITION', weight: 0.6 });
    if ((ctx.squadSize || 0) < 18) goals.push({ goal: 'SQUAD_DEPTH', weight: 0.4 });
    if (pos <= 4) goals.push({ goal: 'WIN_TITLE', weight: 0.3 });

    return goals;
}

/**
 * Action relevance per goal — higher = more aligned.
 * Range -1..1. Negative = action HURTS goal.
 */
const GOAL_RELEVANCE = {
    AVOID_RELEGATION: {
        TACTIC_defensive: 0.7,
        TACTIC_normal: 0.4,
        TACTIC_attacking: -0.2,
        TRAIN_fitness: 0.6,
        TRAIN_tactical: 0.5,
        UPGRADE_STADIUM: -0.5,
        UPGRADE_ACADEMY: -0.3,
        SQUAD_REPLENISH: 0.7
    },
    FINANCIAL_HEALTH: {
        UPGRADE_STADIUM: -0.8,
        UPGRADE_ACADEMY: -0.5,
        ACCEPT_OFFER: 0.9,
        TACTIC_defensive: 0.2,
        SQUAD_REPLENISH: -0.2
    },
    CLIMB_POSITION: {
        TACTIC_attacking: 0.7,
        TACTIC_counter: 0.5,
        TRAIN_attack: 0.6,
        TRAIN_technical: 0.5,
        FORMATION: 0.4
    },
    SQUAD_DEPTH: {
        SQUAD_REPLENISH: 1.0,
        UPGRADE_ACADEMY: 0.6,
        ACCEPT_OFFER: -0.4,
        TRAIN_fitness: 0.2
    },
    WIN_TITLE: {
        TACTIC_attacking: 0.6,
        TACTIC_counter: 0.5,
        TRAIN_attack: 0.5,
        TRAIN_technical: 0.4,
        UPGRADE_STADIUM: 0.3
    }
};

export function actionRelevance(action, goal) {
    const map = GOAL_RELEVANCE[goal] || {};
    return map[action] ?? 0;
}

/**
 * Compute reward from match + state delta.
 * BUG-041 fix: more granular signal so brain doesn't end with all-negative Q-values
 * when team consistently loses (1245× streak in playtest 3).
 * Adds: own-goals-scored bonus, clean sheet bonus, soft floor for narrow losses.
 */
export function computeReward({
    matchResult, balanceDelta, positionDelta, promoted, relegated, title,
    goalsScored = 0, goalsAllowed = 0, scoreDiff = 0
}) {
    let r = 0;
    // Match result base
    if (matchResult === 'W') r += 10;
    else if (matchResult === 'D') r += 2;
    else if (matchResult === 'L') {
        // BUG-041: soften crushing losses but reward narrow ones (closer to draw)
        if (Math.abs(scoreDiff) <= 1) r -= 1;       // narrow loss
        else if (Math.abs(scoreDiff) <= 3) r -= 3;  // moderate loss
        else r -= 5;                                 // big loss
    }
    // BUG-041: own scoring is intrinsic positive signal even in loss
    r += Math.min(5, goalsScored * 1.5);
    // Defensive performance
    if (matchResult !== 'L' && goalsAllowed === 0) r += 3; // clean sheet bonus
    // Balance trend
    if (balanceDelta) r += Math.max(-10, Math.min(10, balanceDelta / 1_000_000));
    // Position movement
    if (positionDelta) r += positionDelta * 2;
    // Season events
    if (promoted) r += 50;
    if (relegated) r -= 100;
    if (title) r += 200;
    return r;
}

export class AdaptiveBrain {
    constructor() {
        this.qTable = {}; // { stateKey: { actionKey: number } }
        this.visitCount = {}; // { stateKey: number }
        this.totalUpdates = 0;
        this.lastSavedAt = 0;
        // SPEC-122 BUG-054: episodic memory — last N decisions+outcomes for RAG.
        this.memory = []; // [{ decision, outcome, week, season, reward, ts }]
        this.memoryMax = 30;
        this._restore();
    }

    /**
     * Append decision+outcome to episodic memory (ring buffer).
     */
    remember(entry) {
        if (!entry) return;
        this.memory.push({
            ts: Date.now(),
            ...entry
        });
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
                savedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            this.lastSavedAt = Date.now();
        } catch { /* ignore */ }
    }

    reset() {
        this.qTable = {};
        this.visitCount = {};
        this.totalUpdates = 0;
        this.memory = [];
        try {
            if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
        } catch { /* ignore */ }
    }

    /**
     * Q-value for state-action pair (default 0 if unseen).
     */
    getQ(stateKey, actionKey) {
        return this.qTable[stateKey]?.[actionKey] ?? 0;
    }

    /**
     * Pick action: epsilon-greedy + goal modulation.
     */
    pickAction(stateKey, availableActions, ctx = {}) {
        if (!Array.isArray(availableActions) || availableActions.length === 0) return null;

        // Cold start: state unseen → uniform random
        const visits = this.visitCount[stateKey] || 0;
        if (visits < 3 || Math.random() < EPSILON) {
            return availableActions[Math.floor(Math.random() * availableActions.length)];
        }

        // Exploit: pick action with highest Q + goal-modulated score
        const goals = detectGoals(ctx);
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
     * Bellman update Q[s][a] += α(r + γ·max(Q[s'][a']) - Q[s][a])
     */
    observe(stateKey, actionKey, reward, nextStateKey, nextActions = []) {
        if (!this.qTable[stateKey]) this.qTable[stateKey] = {};
        const oldQ = this.qTable[stateKey][actionKey] || 0;

        let maxNextQ = 0;
        if (nextStateKey && nextActions.length > 0) {
            maxNextQ = Math.max(...nextActions.map(a => this.getQ(nextStateKey, a)));
        }

        const newQ = oldQ + ALPHA * (reward + GAMMA * maxNextQ - oldQ);
        this.qTable[stateKey][actionKey] = newQ;
        this.visitCount[stateKey] = (this.visitCount[stateKey] || 0) + 1;
        this.totalUpdates++;

        // Bound table size — evict LRU-ish (lowest visit count)
        if (Object.keys(this.qTable).length > MAX_BUCKETS) {
            const sortedByVisits = Object.keys(this.visitCount)
                .sort((a, b) => (this.visitCount[a] || 0) - (this.visitCount[b] || 0));
            const toEvict = sortedByVisits[0];
            if (toEvict && toEvict !== stateKey) {
                delete this.qTable[toEvict];
                delete this.visitCount[toEvict];
            }
        }

        // Save throttled (every 50 updates)
        if (this.totalUpdates % 50 === 0) this.save();
    }

    /**
     * Top-N actions across all states by total Q-value.
     */
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
        return {
            states: Object.keys(this.qTable).length,
            totalUpdates: this.totalUpdates,
            topActions: this.topActions(5)
        };
    }
}
