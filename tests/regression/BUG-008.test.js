// Regression test for BUG-008
// MarketSystem makeOffer aceitava qualquer oferta se listing não existia
// Issue: https://github.com/dudujarra/elifoot-web/issues/3
import { describe, test, expect, beforeEach } from 'vitest';
import { MarketSystem } from '../../src/engine/systems/MarketSystem.js';

describe('BUG-008 regression: makeOffer rejeita sem listing', () => {
    let market;
    beforeEach(() => {
        market = new MarketSystem();
    });

    test('Sem listing → oferta rejeitada', () => {
        // Player 999 nunca foi listado
        const offer = market.makeOffer({
            playerId: 999,
            offeringTeamId: 1,
            bidAmount: 1000000,
            weekOfYear: 5,
        });
        expect(offer.rejected).toBe(true);
        expect(offer.reason).toMatch(/not listed/i);
    });

    test('Com listing → oferta processada normal', () => {
        market.listPlayer({ playerId: 1, askingPrice: 1000000, weekOfYear: 5, sellingTeamId: 99 });
        const offer = market.makeOffer({
            playerId: 1,
            offeringTeamId: 2,
            bidAmount: 800000,
            weekOfYear: 5,
        });
        expect(offer.rejected).toBeUndefined();
        expect(offer.id).toBeDefined();
    });

    test('Bid < 50% rejeitado mesmo com listing', () => {
        market.listPlayer({ playerId: 1, askingPrice: 1000000, weekOfYear: 5, sellingTeamId: 99 });
        const offer = market.makeOffer({
            playerId: 1,
            offeringTeamId: 2,
            bidAmount: 200000, // < 50%
            weekOfYear: 5,
        });
        expect(offer.rejected).toBe(true);
        expect(offer.reason).toMatch(/50%/);
    });
});
