/**
 * AutoPlayBanditCoordinator — ML state encoding + outcome observation
 * RFCT-020 Phase 2: Extracted from AutoPlayService
 *
 * Owns:
 *  - bandit context key discretization (3 dims = 48 contexts)
 *  - state ctx construction from engine snapshot
 *  - observe outcome (Q-Learning update + Thompson feedback)
 *
 * Stateful only via parent reference: reads/writes
 * `parent.engine`, `parent.brain`, `parent.bandits`, `parent._lastStateKey`,
 * `parent._lastAction`, `parent._last*ForReward`, `parent._lastMatch*`,
 * `parent._lastBanditActions`, `parent._lastMatchResult`.
 */

import { TRAINING_TYPES } from '../engine/ManagerSystems';
import { encodeState, computeReward } from './learning/AdaptiveBrain.js';

const TRAINING_ROTATION = (TRAINING_TYPES || []).map(t => t.id).filter(Boolean);

export class AutoPlayBanditCoordinator {
    /**
     * @param {AutoPlayController} parent
     */
    constructor(parent) {
        this.parent = parent;
    }

    /**
     * Fase 2 ML: Discretize game state into a compact context key for Thompson bandits.
     * Uses 3 dimensions: position tier, balance tier, season phase.
     * Total: 4 × 4 × 3 = 48 possible contexts — keeps bandit tables tiny.
     * @returns {string} e.g. "top4|rich|late"
     */
    banditContextKey() {
        const ctx = this.buildStateCtx();
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
    buildStateCtx() {
        const engine = this.parent.engine;
        const teamId = engine?.manager?.teamId;
        const team = engine?.getTeam?.(teamId);
        const standings = team ? engine.getStandings(team.zone, team.division) : [];
        const position = team ? (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length : 20;
        const balance = team?.balance || 0;
        const formAvg = team?.squad?.length
            ? team.squad.reduce((s, p) => s + (p.form?.value ?? 50), 0) / (team.squad.length || 1)
            : 50;
        const lastResult = this.parent._lastMatchResult || '-';

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
            lossStreak,
            division: team?.division || 4, // AUDIT-FIX #F.2: division-aware state encoding
        };
    }

    /**
     * SPEC-115/116/117: observe outcome of last action, update Q-table.
     * BUG-041 fix: pipe goalsScored/goalsAllowed/scoreDiff to reward shaping.
     */
    observeOutcome(currentCtx) {
        const parent = this.parent;
        if (!parent._lastStateKey || !parent._lastAction) return;
        const balanceDelta = (currentCtx.balance || 0) - (parent._lastBalanceForReward || 0);
        const positionDelta = (parent._lastPositionForReward || 20) - (currentCtx.position || 20);
        const promoted = parent._lastDivisionForReward !== null
            && parent.engine?.getTeam?.(parent.engine.manager?.teamId)?.division < parent._lastDivisionForReward;
        const relegated = parent._lastDivisionForReward !== null
            && parent.engine?.getTeam?.(parent.engine.manager?.teamId)?.division > parent._lastDivisionForReward;

        // MARL Fase 3: Prospect Theory — pass emotional loss modifier to reward shaping
        const emoMods = parent.brain.emotions ? parent.brain.emotions.getModifiers() : { lossMod: 1.0 };

        const reward = computeReward({
            matchResult: currentCtx.lastResult,
            balanceDelta,
            positionDelta,
            promoted,
            relegated,
            title: false,
            goalsScored: parent._lastMatchGoalsScored || 0,
            goalsAllowed: parent._lastMatchGoalsAllowed || 0,
            scoreDiff: parent._lastMatchScoreDiff || 0,
            emotionalLossMod: emoMods.lossMod
        });

        const nextStateKey = encodeState(currentCtx);
        // Convergence fix: pass real next-state actions for Q-value bootstrapping
        // Ref: Watkins (1989) — δ = r + γ·max(Q[s'][a']) - Q[s][a]
        const tacticActions = ['TACTIC_normal', 'TACTIC_offensive', 'TACTIC_defensive', 'TACTIC_counter'];
        const trainingActions = TRAINING_ROTATION.map(id => `TRAIN_${id}`);
        const nextActions = [...tacticActions, ...trainingActions];
        parent.brain.observe(parent._lastStateKey, parent._lastAction, reward, nextStateKey, nextActions);

        // Fase 3 ML: Feed reward to SARSA emotional modifier learner
        try { parent.brain.emotions.feedReward(reward); } catch { /* defensive */ }

        // Fase 2 ML: Thompson Sampling feedback for team talk
        // Match result feeds back to the last team talk choice
        if (parent._lastBanditActions?.teamTalk) {
            const { ctxKey, action } = parent._lastBanditActions.teamTalk;
            // Win = positive, draw = neutral, loss = negative
            const talkReward = currentCtx.lastResult === 'W' ? 1.5
                : currentCtx.lastResult === 'D' ? 0
                : currentCtx.lastResult === 'L' ? -1 : 0;
            if (talkReward !== 0) {
                parent.bandits.teamTalk.update(ctxKey, action, talkReward);
            }
            parent._lastBanditActions.teamTalk = null; // consumed
        }
    }
}
