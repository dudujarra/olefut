/* eslint-disable no-unused-vars */
import { MatchCardsATA } from './decks/MatchCardsATA';
import { MatchCardsMEI } from './decks/MatchCardsMEI';
import { MatchCardsDEF } from './decks/MatchCardsDEF';
import { MatchCardsGOL } from './decks/MatchCardsGOL';

import { rng as systemRng } from './rng.js';

export const MatchEventsDeck = {
    ATA: MatchCardsATA,
    MEI: MatchCardsMEI,
    DEF: MatchCardsDEF,
    GOL: MatchCardsGOL
};

// Tier weights for draw probability
const TIER_WEIGHTS = { common: 60, uncommon: 25, rare: 12, legendary: 3 };

/**
 * Draws a card from the deck based on position, renown, and personality.
 * @param {string} position - GOL, DEF, MEI, ATA
 * @param {number} renown - Player renown (gates legendary cards)
 * @param {string} personality - maverick|virtuoso|heartbeat (future filter)
 * @returns {object|null} A card object or null
 */
export function drawCard(position, renown = 0, personality = null) {
    const deck = MatchEventsDeck[position];
    if (!deck || deck.length === 0) return null;

    // Filter by renown (legendary cards need minRenown)
    const eligible = deck.filter(card => {
        if (card.minRenown && renown < card.minRenown) return false;
        return true;
    });

    if (eligible.length === 0) return null;

    // Weighted random by tier
    const totalWeight = eligible.reduce((sum, card) => sum + (TIER_WEIGHTS[card.tier] || 10), 0);
    let roll = systemRng() * totalWeight;

    for (const card of eligible) {
        roll -= (TIER_WEIGHTS[card.tier] || 10);
        if (roll <= 0) return card;
    }

    return eligible[eligible.length - 1];
}
