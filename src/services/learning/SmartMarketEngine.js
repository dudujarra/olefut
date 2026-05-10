/**
 * SmartMarketEngine — ML-Driven Transfer Decisions
 *
 * This module does NOT make decisions itself. Instead:
 *   1. Analyzes squad + player + context → encodes a compact market STATE
 *   2. Passes state to AdaptiveBrain.pickAction() → Q-Learning decides
 *   3. Brain observes reward after transfer outcome → learns over time
 *
 * The state encoding captures 8 features that the brain learns to associate
 * with good/bad transfer outcomes:
 *   - Squad need at position (gap detection)
 *   - Quality delta (upgrade potential)
 *   - Age trajectory (peak/decline/potential)
 *   - Affordability ratio
 *   - Squad size pressure
 *   - Emotional state modifier
 *   - Personality risk appetite
 *   - Window urgency
 *
 * Over multiple seasons, the Q-table learns patterns like:
 *   "When squad is weak at DEF and player is a big upgrade and affordable → BUY"
 *   "When desperate and overstocked → SELL even cheap"
 *
 * Works for both AutoPlay bot AND NPC managers.
 */

import { applyBuyBiases, applySellBiases } from './CognitiveBiases.js';

// ─── QUANTIZE HELPERS (continuous → discrete bins for Q-table) ──

function quantize(value, bins) {
    for (let i = 0; i < bins.length; i++) {
        if (value <= bins[i]) return i;
    }
    return bins.length;
}

// Bins for each feature dimension
const NEED_BINS    = [-1, 0, 1, 3];      // 5 levels: surplus → critical need
const OVR_BINS     = [-5, 0, 5, 15];     // 5 levels: downgrade → huge upgrade
const AGE_BINS     = [21, 25, 29, 32];   // 5 levels: youth → veteran
const AFFORD_BINS  = [0.1, 0.25, 0.4, 0.6]; // 5 levels: cheap → expensive
const SQUAD_BINS   = [15, 18, 22, 26];   // 5 levels: tiny → bloated
const EMO_BINS     = [0, 1, 2, 3];       // 5 levels: calm → desperate
const RISK_BINS    = [0.2, 0.35, 0.5, 0.7]; // 5 levels: conservative → aggressive
const RATIO_BINS   = [0.8, 1.0, 1.3, 2.0]; // 5 levels: lowball → amazing (sell)

// Emotional state → numeric scale
const EMO_SCALE = {
    CALM: 0, CONFIDENT: 1, EUPHORIC: 2,
    ANXIOUS: 2, TILTED: 3, DESPERATE: 4
};

// ─── POSITION IDEAL DEPTH ────────────────────────────────────
const IDEAL_DEPTH = { GOL: 2, DEF: 6, MEI: 6, ATA: 4 };

// ─── SQUAD ANALYSIS ──────────────────────────────────────────

/**
 * Analyze squad and return per-position metrics.
 */
export function analyzeSquad(squad = []) {
    const result = {};
    for (const pos of ['GOL', 'DEF', 'MEI', 'ATA']) {
        const players = squad.filter(p => p.position === pos && !p._retired);
        const ovrs = players.map(p => p.ovr || 50);
        const avg = ovrs.length > 0 ? ovrs.reduce((a, b) => a + b, 0) / ovrs.length : 0;
        const max = ovrs.length > 0 ? Math.max(...ovrs) : 0;
        const ideal = IDEAL_DEPTH[pos] || 4;
        result[pos] = {
            depth: players.length,
            idealDepth: ideal,
            gap: ideal - players.length,
            avgOvr: avg,
            maxOvr: max,
            avgAge: players.length > 0
                ? players.reduce((s, p) => s + (p.age || 25), 0) / players.length : 25,
        };
    }
    return result;
}

// ═══════════════════════════════════════════════════════════════
// BUY STATE ENCODING (for Q-table)
// ═══════════════════════════════════════════════════════════════

/**
 * Encode a potential buy into a compact state key for Q-learning.
 * Returns a string like "MKT_B|n3|u2|a1|f2|s1|e0|r2"
 *
 * @param {Object} params
 * @param {Object} params.team
 * @param {Object} params.player — candidate player
 * @param {number} params.askingPrice
 * @param {Object|null} params.personality
 * @param {string} params.emotionalState
 * @returns {string} state key
 */
export function encodeBuyState({ team, player, askingPrice, personality = null, emotionalState = 'CALM' }) {
    const squad = team?.squad || [];
    const pos = player?.position || 'MEI';
    const posAnalysis = analyzeSquad(squad)[pos] || {};

    // Feature 1: Squad need at position
    const need = quantize(posAnalysis.gap || 0, NEED_BINS);

    // Feature 2: OVR delta (how much better is this player)
    const ovrDelta = (player?.ovr || 50) - (posAnalysis.avgOvr || 50);
    const upgrade = quantize(ovrDelta, OVR_BINS);

    // Feature 3: Player age
    const age = quantize(player?.age || 25, AGE_BINS);

    // Feature 4: Affordability (price / balance ratio)
    const balance = Math.max(team?.balance || 1, 1);
    const affordRatio = askingPrice / balance;
    const afford = quantize(affordRatio, AFFORD_BINS);

    // Feature 5: Squad size
    const squadSize = squad.filter(p => !p._retired).length;
    const size = quantize(squadSize, SQUAD_BINS);

    // Feature 6: Emotional state
    const emo = quantize(EMO_SCALE[emotionalState] || 0, EMO_BINS);

    // Feature 7: Personality risk appetite (Openness + Extraversion - Conscientiousness)
    const ocean = personality?.ocean || {};
    const riskAppetite = ((ocean.O || 0.5) + (ocean.E || 0.5) - (ocean.C || 0.5)) / 2;
    const risk = quantize(riskAppetite, RISK_BINS);

    return `MKT_B|n${need}|u${upgrade}|a${age}|f${afford}|s${size}|e${emo}|r${risk}`;
}

// ═══════════════════════════════════════════════════════════════
// SELL STATE ENCODING (for Q-table)
// ═══════════════════════════════════════════════════════════════

/**
 * Encode a sell offer into a compact state key for Q-learning.
 *
 * @param {Object} params
 * @returns {string} state key
 */
export function encodeSellState({ team, player, offerAmount, personality = null, emotionalState = 'CALM' }) {
    const squad = team?.squad || [];
    const pos = player?.position || 'MEI';
    const posAnalysis = analyzeSquad(squad)[pos] || {};
    const playerValue = player?.value || (player?.ovr || 50) * 50_000;

    // Feature 1: Offer/value ratio
    const ratio = quantize(offerAmount / Math.max(playerValue, 100_000), RATIO_BINS);

    // Feature 2: Player age
    const age = quantize(player?.age || 25, AGE_BINS);

    // Feature 3: Position depth (can we afford to lose?)
    const depth = quantize(posAnalysis.depth || 0, [1, 2, 3, 5]);

    // Feature 4: Is player a starter? (OVR vs position max)
    const isStarter = (player?.ovr || 0) >= (posAnalysis.maxOvr || 50) - 3 ? 1 : 0;

    // Feature 5: Financial need (negative balance = urgent)
    const balance = team?.balance || 0;
    const finNeed = balance < 0 ? 3 : balance < 1_000_000 ? 2 : balance < 5_000_000 ? 1 : 0;

    // Feature 6: Emotional state
    const emo = quantize(EMO_SCALE[emotionalState] || 0, EMO_BINS);

    // Feature 7: Personality sell willingness (Agreeableness - Neuroticism)
    const ocean = personality?.ocean || {};
    const sellWill = ((ocean.A || 0.5) - (ocean.N || 0.5) + 0.5) / 1.5;
    const will = quantize(sellWill, RISK_BINS);

    return `MKT_S|r${ratio}|a${age}|d${depth}|s${isStarter}|f${finNeed}|e${emo}|w${will}`;
}

// ═══════════════════════════════════════════════════════════════
// MARKET ACTIONS (passed to brain.pickAction)
// ═══════════════════════════════════════════════════════════════

export const BUY_ACTIONS = ['MKT_BUY_YES', 'MKT_BUY_NO'];
export const SELL_ACTIONS = ['MKT_SELL_YES', 'MKT_SELL_NO'];

// ═══════════════════════════════════════════════════════════════
// TRANSFER REWARD (call AFTER transfer outcome is known)
// ═══════════════════════════════════════════════════════════════

/**
 * Compute reward for a transfer decision.
 * Called weeks after the transfer to evaluate if it was good.
 *
 * For BUY:
 *   +10 if bought player became starter
 *   +5  if team position improved after buy
 *   -5  if bought player is benched
 *   -10 if team went into financial trouble after buy
 *
 * For SELL:
 *   +10 if sold deadwood (reserve, old) at good price
 *   +5  if team position held/improved
 *   -10 if sold starter and position weakened
 *   -5  if sold cheap (bad deal)
 *
 * @param {Object} params
 * @returns {number} reward
 */
export function computeTransferReward({
    action, // 'BUY' or 'SELL'
    positionBefore, positionAfter,
    balanceBefore, balanceAfter,
    playerBecameStarter = false,
    playerWasStarter = false,
    offerRatio = 1.0,
    emotionalLossMod = 1.0
}) {
    let r = 0;

    if (action === 'BUY') {
        if (playerBecameStarter) r += 10;
        else r -= 5; // benched = wasted money

        // Position improvement
        const posDelta = (positionBefore || 10) - (positionAfter || 10); // positive = improved
        r += Math.min(5, posDelta * 2);

        // Financial health
        if ((balanceAfter || 0) < 0) r -= 10 * emotionalLossMod;

    } else if (action === 'SELL') {
        // Good deal?
        if (offerRatio >= 1.5) r += 8;
        else if (offerRatio >= 1.0) r += 3;
        else r -= 5 * emotionalLossMod; // sold cheap

        // Selling starter hurt?
        if (playerWasStarter) {
            const posDelta = (positionBefore || 10) - (positionAfter || 10);
            if (posDelta < 0) r -= 8 * emotionalLossMod; // position dropped
            else r += 3; // position held despite losing starter
        } else {
            r += 5; // trimming reserves is generally good
        }
    }

    return r;
}

// ═══════════════════════════════════════════════════════════════
// HIGH-LEVEL DECISION INTERFACE
// ═══════════════════════════════════════════════════════════════

/**
 * Ask the brain whether to buy. Returns { buy, reason, action, stateKey, source }.
 *
 * @param {Object} brain — AdaptiveBrain instance
 * @param {Object} params — { team, player, askingPrice, biasCtx }
 * @returns {Object}
 */
export function smartBuyDecision(brain, { team, player, askingPrice, biasCtx = {} }) {
    if (!brain) {
        return { buy: false, reason: 'no brain', source: 'fallback' };
    }

    const emoState = brain.emotions?.state || 'CALM';
    const stateKey = encodeBuyState({
        team, player, askingPrice,
        personality: brain.personality,
        emotionalState: emoState
    });

    const action = brain.pickAction(stateKey, BUY_ACTIONS, {
        position: 0, balance: team?.balance || 0,
        formAvg: 50, lastResult: 'D'
    });

    const buy = action === 'MKT_BUY_YES';

    // Apply cognitive bias as post-filter (can override brain in extreme cases)
    if (buy && brain.personality) {
        try {
            const biases = applyBuyBiases({
                realValue: askingPrice,
                personality: brain.personality,
                context: { ...biasCtx, targetPosition: player?.position }
            });
            // If biases say it's WAY too expensive, override
            if (biases.perceivedValue > askingPrice * 3) {
                return {
                    buy: false,
                    reason: `brain said YES but biases say overpriced (perceived ${biases.perceivedValue.toFixed(0)} vs ${askingPrice})`,
                    action, stateKey, source: 'smart+bias_override',
                    biases: biases.biasesApplied
                };
            }
        } catch { /* continue with brain decision */ }
    }

    return {
        buy,
        reason: `brain=${action} state=${stateKey} emo=${emoState}`,
        action, stateKey, source: 'smart',
        biases: []
    };
}

/**
 * Ask the brain whether to sell.
 */
export function smartSellDecision(brain, { team, player, offerAmount }) {
    if (!brain) {
        return { sell: false, reason: 'no brain', source: 'fallback' };
    }

    const emoState = brain.emotions?.state || 'CALM';
    const stateKey = encodeSellState({
        team, player, offerAmount,
        personality: brain.personality,
        emotionalState: emoState
    });

    const action = brain.pickAction(stateKey, SELL_ACTIONS, {
        position: 0, balance: team?.balance || 0,
        formAvg: 50, lastResult: 'D'
    });

    const sell = action === 'MKT_SELL_YES';

    // Cognitive bias post-filter: sunk cost / endowment might override
    if (!sell && brain.personality) {
        try {
            const biases = applySellBiases({
                offerAmount,
                playerValue: player?.value || (player?.ovr || 50) * 50_000,
                purchasePrice: player?._purchasePrice || 0,
                personality: brain.personality,
            });
            // If offer is way above biased minimum AND brain said no, let biases override
            if (offerAmount > biases.minAcceptable * 2.5) {
                return {
                    sell: true,
                    reason: `brain said NO but offer ${offerAmount} >> min ${biases.minAcceptable.toFixed(0)} — too good to refuse`,
                    action, stateKey, source: 'smart+bias_override',
                    biases: biases.biasesApplied
                };
            }
        } catch { /* continue with brain decision */ }
    }

    return {
        sell,
        reason: `brain=${action} state=${stateKey} emo=${emoState}`,
        action, stateKey, source: 'smart',
        biases: []
    };
}

/**
 * Rank scouted candidates by brain score.
 * Returns top N that the brain says BUY.
 */
export function rankCandidates({ brain, team, candidates, biasCtx = {}, limit = 5 }) {
    if (!brain || !candidates?.length) return [];

    const scored = candidates.map(c => {
        const player = c.player || c;
        const askingPrice = Math.round((c.value || (player.ovr || 60) * 50_000) * 1.3);
        const decision = smartBuyDecision(brain, { team, player, askingPrice, biasCtx });
        return { candidate: c, decision, askingPrice };
    });

    return scored
        .filter(s => s.decision.buy)
        .sort((a, b) => {
            // Prefer: higher OVR upgrade, lower cost
            const aUpgrade = (a.candidate.player || a.candidate).ovr || 0;
            const bUpgrade = (b.candidate.player || b.candidate).ovr || 0;
            return bUpgrade - aUpgrade;
        })
        .slice(0, limit);
}
