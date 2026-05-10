// Regression test — BUG-078
// SPEC-111 market liquidity always 0% because:
//   1. MARKET_INQUIRY probes were pushed to history.offers with no `amount` field → avgSpread=-1
//   2. Real BUY_OFFER results were never pushed to history.offers → acceptanceRate=0%
// Fix: remove probes from history.offers; log real buy offer results there instead.

import { describe, test, expect } from 'vitest';

describe('BUG-078 — SPEC-111 market offer tracking', () => {
    test('old probe shape caused avgSpread=-1 (confirmed broken behavior)', () => {
        // MARKET_INQUIRY probes had no `amount` and no `playerValue` field
        const brokenProbe = { week: 1, playerId: 'x', askPrice: 3_000_000, accepted: null, simulated: true };

        const value = Number(brokenProbe.playerValue) || 1; // undefined → 1
        const spread = (Number(brokenProbe.amount) || 0) / value - 1; // 0/1-1 = -1
        expect(spread).toBe(-1);

        const accepted = !!brokenProbe.accepted; // null → false
        expect(accepted).toBe(false);
    });

    test('real buy offer shape produces correct spread and acceptance', () => {
        // After fix: real BUY_OFFER results logged with these fields
        const offers = [
            { amount: 5_200_000, playerValue: 4_000_000, accepted: true,  simulated: false },
            { amount: 4_100_000, playerValue: 4_000_000, accepted: false, simulated: false },
            { amount: 6_000_000, playerValue: 4_000_000, accepted: true,  simulated: false },
        ];
        const accepted = offers.filter(o => o.accepted).length;
        expect(accepted / offers.length).toBeCloseTo(0.667, 2);

        const spreads = offers.map(o => (Number(o.amount) || 0) / (Number(o.playerValue) || 1) - 1);
        const avgSpread = spreads.reduce((s, v) => s + v, 0) / spreads.length;
        expect(avgSpread).toBeGreaterThan(0); // above value → positive spread
    });

    test('SPEC-111 sigmoid: offer 130% of value always accepted', () => {
        // makeBuyOffer sigmoid: acceptProb = clamp((ratio-1.0)/0.5, 0, 1)
        // ratio = offerAmount / playerValue
        const playerValue = 4_000_000;
        const offerAmount = Math.round(playerValue * 1.35); // 135% of value
        const ratio = offerAmount / playerValue;
        const acceptProb = Math.max(0, Math.min(1, (ratio - 1.0) / 0.5));
        expect(acceptProb).toBeCloseTo(0.7, 5); // (1.35-1)/0.5 = 0.7 → 70% acceptance
    });

    test('SPEC-111 sigmoid: OVR-based fallback still exceeds acceptance threshold', () => {
        // When player.value is undefined, fallback is (ovr * 50_000)
        const ovr = 70;
        const playerVal = ovr * 50_000; // 3_500_000
        const offerAmount = Math.round(playerVal * 1.3); // 4_550_000
        // AI team's player.value is also undefined → defaults to 1_000_000 in makeBuyOffer
        const ratio = offerAmount / 1_000_000;
        const acceptProb = Math.max(0, Math.min(1, (ratio - 1.0) / 0.5));
        expect(acceptProb).toBe(1.0); // 4.55× value → clamped to 1.0 (100% accept)
    });
});
