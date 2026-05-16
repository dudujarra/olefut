/**
 * DuelResolver.js
 * Deep Tactical Engine - Part of Phase 2
 * Resolves mathematical duels between players (Attacker vs Defender).
 */

import { rng } from '../rng.js';

/**
 * Standard logistic function
 * @param {number} x 
 * @returns {number} Probability between 0 and 1
 */
function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

/**
 * Generic Duel Outcome
 * P(A wins) = sigmoid((Q_A - Q_D + TacticalMod) / T)
 * @param {number} qualityA - Attacker's quality
 * @param {number} qualityB - Defender's quality
 * @param {number} tacticalMod - Modifiers from zone or formation (-5 to +5 typically)
 * @param {number} temperature - Controls determinism (e.g., 5.0)
 * @returns {boolean} True if Attacker wins, False if Defender wins
 */
export function resolveGenericDuel(qualityA, qualityB, tacticalMod = 0, temperature = 5.0) {
    // Add noise epsilon N(0, 1) approximation — MUST use seeded rng, not Math.random
    const epsilon = (rng.float() + rng.float() - 1); 
    const probability = sigmoid((qualityA - qualityB + tacticalMod + epsilon) / temperature);
    return rng.float() < probability;
}

/**
 * Winger vs Full-back 1v1 (Dribble Attempt)
 * @param {Object} attacker - Winger attributes
 * @param {Object} defender - Fullback attributes
 * @returns {boolean} True if winger passes, False if tackled
 */
export function resolveDribbleDuel(attacker, defender) {
    const qA = (0.35 * (attacker.dribbling || 10)) + 
               (0.25 * (attacker.pace || 10)) + 
               (0.15 * (attacker.acceleration || 10)) + 
               (0.10 * (attacker.technique || 10)) + 
               (0.10 * (attacker.flair || 10)) + 
               (0.05 * (attacker.balance || 10));

    const qD = (0.30 * (defender.tackling || 10)) + 
               (0.20 * (defender.pace || 10)) + 
               (0.15 * (defender.positioning || 10)) + 
               (0.15 * (defender.marking || 10)) + 
               (0.10 * (defender.anticipation || 10)) + 
               (0.10 * (defender.strength || 10));

    let mod = 0;
    // Pace mismatch bonus
    if ((attacker.pace || 10) - (defender.pace || 10) >= 4) {
        mod += 2;
    }

    return resolveGenericDuel(qA, qD, mod, 5.0);
}

/**
 * Aerial Duel
 * @param {Object} attacker - Target Man / Striker
 * @param {Object} defender - Center Back
 * @returns {boolean} True if Attacker wins header
 */
export function resolveAerialDuel(attacker, defender) {
    const hA = (attacker.heading || 10);
    const jA = (attacker.jumpingReach || 10);
    const sA = (attacker.strength || 10) * 0.5;

    const hD = (defender.heading || 10);
    const jD = (defender.jumpingReach || 10);
    const sD = (defender.strength || 10) * 0.5;

    const prob = sigmoid(((hA + jA + sA) - (hD + jD + sD)) / 15.0);
    return rng.float() < prob;
}

/**
 * Press Success Probability (per pressing event)
 * @param {Object} presser - Defending player pressing the ball
 * @param {Object} ballCarrier - Attacking player with the ball
 * @param {number} blockCompactness - {-2, 0, +2} based on team shape
 * @returns {boolean} True if turnover happens
 */
export function resolvePress(presser, ballCarrier, blockCompactness = 0) {
    const pQ = (presser.workRate || 10) + (presser.aggression || 10) + (presser.anticipation || 10);
    const bQ = (ballCarrier.firstTouch || 10) + (ballCarrier.composure || 10) + (ballCarrier.technique || 10);

    const prob = sigmoid((pQ - bQ + blockCompactness) / 10.0);
    return rng.float() < prob;
}

/**
 * Pass Completion (Press-Resistance)
 * @param {Object} passer 
 * @param {boolean} underPressure 
 * @param {number} pressureIntensity - From 0 to 20
 * @param {number} distancePenalty - From 0 to 10
 * @returns {boolean}
 */
export function resolvePassCompletion(passer, underPressure, pressureIntensity, distancePenalty = 0) {
    const passQual = (passer.passing || 10);
    const tech = (passer.technique || 10);
    const pressureRes = underPressure ? tech : 0; // Technique helps against pressure

    const prob = sigmoid((passQual + pressureRes - pressureIntensity - distancePenalty) / 6.0);
    return rng.float() < prob;
}
