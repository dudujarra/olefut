/**
 * DAggerBootstrap — Imitation Learning Warm-Start Pipeline
 *
 * Ref: Ross, Gordon & Bagnell (2011) — "A Reduction of Imitation Learning
 *      and Structured Prediction to No-Regret Online Learning" (CMU)
 *
 * PURPOSE:
 * Instead of the ML systems starting from zero knowledge (cold start),
 * this module pre-fills Q-tables, Thompson bandits, and SARSA tables
 * using the EXISTING heuristic logic as a "teacher".
 *
 * The heuristics encode decades of football manager game design wisdom.
 * Rather than throwing that away, DAgger uses them as prior knowledge
 * so the RL agents start "warm" — already making reasonable decisions
 * from season 1, then improving via online learning.
 *
 * PIPELINE:
 * 1. Run heuristic logic (teacher) on a set of state contexts
 * 2. Record (state, action, expected_reward) tuples
 * 3. Pre-fill ML tables with these tuples
 * 4. ML starts with teacher knowledge, then diverges as it learns
 *
 * COST: Zero runtime cost. Runs once at initialization.
 */

import { encodeState } from './AdaptiveBrain.js';

// ─── HEURISTIC TEACHER DATA ────────────────────────────────────
// These encode what the hardcoded heuristics would recommend
// in various game situations. Extracted from AutoPlayService logic.

/**
 * Tactical teacher: what tactic the heuristics recommend by context.
 * Based on the original AutoPlayService conditional logic.
 */
const TACTIC_TEACHER = [
    // Relegation zone: defensive/counter
    { ctx: { position: 18, totalTeams: 20, balance: 1_000_000, formAvg: 35, week: 20, squadSize: 16 },
      action: 'TACTIC_defensive', reward: 5 },
    { ctx: { position: 19, totalTeams: 20, balance: 500_000, formAvg: 30, week: 30, squadSize: 14 },
      action: 'TACTIC_defensive', reward: 7 },
    // Mid-table: normal/balanced
    { ctx: { position: 10, totalTeams: 20, balance: 5_000_000, formAvg: 55, week: 15, squadSize: 20 },
      action: 'TACTIC_normal', reward: 4 },
    { ctx: { position: 8, totalTeams: 20, balance: 3_000_000, formAvg: 50, week: 10, squadSize: 18 },
      action: 'TACTIC_normal', reward: 4 },
    // Title contention: offensive/counter
    { ctx: { position: 2, totalTeams: 20, balance: 20_000_000, formAvg: 75, week: 25, squadSize: 22 },
      action: 'TACTIC_offensive', reward: 8 },
    { ctx: { position: 1, totalTeams: 20, balance: 30_000_000, formAvg: 80, week: 30, squadSize: 24 },
      action: 'TACTIC_offensive', reward: 10 },
    { ctx: { position: 3, totalTeams: 20, balance: 15_000_000, formAvg: 70, week: 20, squadSize: 21 },
      action: 'TACTIC_counter', reward: 6 },
    // Early season: balanced
    { ctx: { position: 10, totalTeams: 20, balance: 8_000_000, formAvg: 50, week: 3, squadSize: 20 },
      action: 'TACTIC_normal', reward: 3 },
    // Late season desperate: offensive
    { ctx: { position: 17, totalTeams: 20, balance: 2_000_000, formAvg: 40, week: 35, squadSize: 15 },
      action: 'TACTIC_offensive', reward: 4 },
    // Financial crisis: sell + defensive
    { ctx: { position: 12, totalTeams: 20, balance: -500_000, formAvg: 45, week: 15, squadSize: 20 },
      action: 'TACTIC_defensive', reward: 3 },
];

/**
 * Market teacher: buy/sell decisions by context.
 */
const MARKET_TEACHER = [
    // Rich + deep squad: don't buy more
    { ctx: { position: 5, totalTeams: 20, balance: 25_000_000, formAvg: 70, week: 10, squadSize: 24 },
      action: 'MKT_BUY_NO', reward: 3 },
    // Thin squad: buy
    { ctx: { position: 10, totalTeams: 20, balance: 8_000_000, formAvg: 50, week: 8, squadSize: 14 },
      action: 'MKT_BUY_YES', reward: 6 },
    // Broke + deep squad: sell
    { ctx: { position: 12, totalTeams: 20, balance: -1_000_000, formAvg: 45, week: 20, squadSize: 22 },
      action: 'MKT_SELL_YES', reward: 5 },
    // Title run + thin squad: buy even if expensive
    { ctx: { position: 3, totalTeams: 20, balance: 10_000_000, formAvg: 65, week: 15, squadSize: 16 },
      action: 'MKT_BUY_YES', reward: 8 },
    // Relegation + broke: desperate sell
    { ctx: { position: 19, totalTeams: 20, balance: -2_000_000, formAvg: 30, week: 25, squadSize: 18 },
      action: 'MKT_SELL_YES', reward: 7 },
];

/**
 * Training teacher: training type by context.
 */
const TRAINING_TEACHER = [
    { ctx: { position: 18, totalTeams: 20, balance: 1_000_000, formAvg: 35, week: 20, squadSize: 16 },
      action: 'TRAIN_fitness', reward: 5 },
    { ctx: { position: 5, totalTeams: 20, balance: 15_000_000, formAvg: 70, week: 15, squadSize: 20 },
      action: 'TRAIN_tactical', reward: 6 },
    { ctx: { position: 2, totalTeams: 20, balance: 20_000_000, formAvg: 75, week: 25, squadSize: 22 },
      action: 'TRAIN_attack', reward: 7 },
    { ctx: { position: 10, totalTeams: 20, balance: 5_000_000, formAvg: 50, week: 5, squadSize: 18 },
      action: 'TRAIN_technical', reward: 4 },
];

/**
 * Emotional response teacher: what modifier preset works best per context.
 */
const EMOTION_TEACHER = [
    // CALM + winning: stay COMPOSED (don't get cocky)
    { emotion: 'CALM', ctx: { position: 3, totalTeams: 20, balance: 10_000_000, week: 15 },
      action: 'COMPOSED', reward: 5 },
    // CALM + mid-table: NEUTRAL (no emotional tilt)
    { emotion: 'CALM', ctx: { position: 10, totalTeams: 20, balance: 3_000_000, week: 10 },
      action: 'NEUTRAL', reward: 4 },
    // ANXIOUS + losing: CAUTIOUS (don't panic)
    { emotion: 'ANXIOUS', ctx: { position: 16, totalTeams: 20, balance: 1_000_000, week: 25 },
      action: 'CAUTIOUS', reward: 4 },
    // ANXIOUS + relegation zone: DEFENSIVE (park the bus)
    { emotion: 'ANXIOUS', ctx: { position: 18, totalTeams: 20, balance: 500_000, week: 30 },
      action: 'DEFENSIVE', reward: 5 },
    // CONFIDENT + top: BOLD (push for title)
    { emotion: 'CONFIDENT', ctx: { position: 2, totalTeams: 20, balance: 15_000_000, week: 20 },
      action: 'BOLD', reward: 6 },
    // TILTED + losing: STOIC (reset, don't panic more)
    { emotion: 'TILTED', ctx: { position: 15, totalTeams: 20, balance: 2_000_000, week: 20 },
      action: 'STOIC', reward: 3 },
    // DESPERATE + relegation: AGGRESSIVE (all in, nothing to lose)
    { emotion: 'DESPERATE', ctx: { position: 19, totalTeams: 20, balance: -500_000, week: 35 },
      action: 'AGGRESSIVE', reward: 4 },
];

/**
 * Team talk teacher: what talk type works in each context.
 */
const TEAM_TALK_TEACHER = [
    // Winning: motivational
    { ctx: 'top4|rich|mid', action: 'motivational', confidence: 0.7, strength: 0.6 },
    // Losing: tactical
    { ctx: 'bottom|poor|late', action: 'tactical', confidence: 0.6, strength: 0.7 },
    // Relegation: inspirational
    { ctx: 'rele|broke|late', action: 'inspirational', confidence: 0.8, strength: 0.8 },
    // Mid stable: analytical
    { ctx: 'mid|stable|mid', action: 'analytical', confidence: 0.5, strength: 0.5 },
    // Early season: motivational
    { ctx: 'mid|stable|early', action: 'motivational', confidence: 0.6, strength: 0.5 },
];

// ─── BOOTSTRAP CLASS ────────────────────────────────────────

export class DAggerBootstrap {
    /**
     * Warm-start the AdaptiveBrain Q-table with heuristic teacher data.
     * Pre-fills Q-values so the agent doesn't start from zero.
     *
     * @param {AdaptiveBrain} brain — the brain to warm-start
     */
    static warmStartBrain(brain) {
        if (!brain || !brain.observe) return { tacticsLoaded: 0, marketLoaded: 0, trainingLoaded: 0 };

        let tacticsLoaded = 0, marketLoaded = 0, trainingLoaded = 0;

        // Tactical teacher data
        for (const lesson of TACTIC_TEACHER) {
            const stateKey = encodeState(lesson.ctx);
            brain.observe(stateKey, lesson.action, lesson.reward, stateKey, []);
            tacticsLoaded++;
        }

        // Market teacher data
        for (const lesson of MARKET_TEACHER) {
            const stateKey = encodeState(lesson.ctx);
            brain.observe(stateKey, lesson.action, lesson.reward, stateKey, []);
            marketLoaded++;
        }

        // Training teacher data
        for (const lesson of TRAINING_TEACHER) {
            const stateKey = encodeState(lesson.ctx);
            brain.observe(stateKey, lesson.action, lesson.reward, stateKey, []);
            trainingLoaded++;
        }

        // Clear traces after bootstrap (don't leak teacher traces into live play)
        brain.clearTraces();

        return { tacticsLoaded, marketLoaded, trainingLoaded };
    }

    /**
     * Warm-start Thompson bandits with teacher data.
     *
     * @param {Object} bandits — { teamTalk, scoutRegion, staffHire }
     */
    static warmStartBandits(bandits) {
        if (!bandits) return { teamTalkLoaded: 0 };

        let teamTalkLoaded = 0;

        // Team talk teacher data → Thompson bandit warm start
        if (bandits.teamTalk?.warmStart) {
            for (const lesson of TEAM_TALK_TEACHER) {
                bandits.teamTalk.warmStart(lesson.ctx, lesson.action, lesson.confidence, lesson.strength);
                teamTalkLoaded++;
            }
        }

        return { teamTalkLoaded };
    }

    /**
     * Warm-start SARSA emotional modifier learner with teacher data.
     *
     * @param {LearnedEmotionalModifiers} sarsaModifiers
     */
    static warmStartEmotions(sarsaModifiers) {
        if (!sarsaModifiers?.observe) return { emotionsLoaded: 0 };

        let emotionsLoaded = 0;

        for (const lesson of EMOTION_TEACHER) {
            const stateKey = sarsaModifiers.encodeState(lesson.emotion, lesson.ctx);
            // Simulate: we're in this state, chose this action, got this reward
            sarsaModifiers.observe(stateKey, lesson.action, lesson.reward);
            emotionsLoaded++;
        }

        // Clear traces after bootstrap
        sarsaModifiers.clearTraces();

        return { emotionsLoaded };
    }

    /**
     * Full warm-start pipeline: brain + bandits + emotions.
     *
     * @param {Object} options
     * @param {AdaptiveBrain} options.brain
     * @param {Object} options.bandits — { teamTalk, scoutRegion, staffHire }
     * @param {LearnedEmotionalModifiers} options.sarsaModifiers
     * @returns {Object} summary of loaded lessons
     */
    static warmStartAll({ brain, bandits, sarsaModifiers } = {}) {
        const brainResult = this.warmStartBrain(brain);
        const banditResult = this.warmStartBandits(bandits);
        const emotionResult = this.warmStartEmotions(sarsaModifiers);

        return {
            ...brainResult,
            ...banditResult,
            ...emotionResult,
            total: (brainResult.tacticsLoaded + brainResult.marketLoaded + brainResult.trainingLoaded)
                + banditResult.teamTalkLoaded
                + emotionResult.emotionsLoaded
        };
    }
}
