import { describe, test, expect } from 'vitest';
import { calcMarketValue, makeOffer } from '../../src/engine/MarketPricer';

describe('SPEC-133: MarketPricer', () => {
    test('spread always 0.5-1.3', () => {
        for (let i = 0; i < 50; i++) {
            const r = makeOffer({ playerOvr: 72, playerAge: 26, playerContract: 20, need: 'medium', sellingWillingness: 'open', seed: i });
            expect(r.spread).toBeGreaterThanOrEqual(0.5);
            expect(r.spread).toBeLessThanOrEqual(1.3);
        }
    });

    test('need=high offer ≥ 0.9 × marketValue', () => {
        for (let i = 0; i < 30; i++) {
            const r = makeOffer({ playerOvr: 72, playerAge: 26, playerContract: 30, need: 'high', sellingWillingness: 'open', seed: i });
            expect(r.offerPrice).toBeGreaterThanOrEqual(r.marketValue * 0.9 - 1);
        }
    });

    test('high need + forced willingness → accepted', () => {
        for (let i = 0; i < 20; i++) {
            const r = makeOffer({ playerOvr: 65, playerAge: 28, playerContract: 10, need: 'high', sellingWillingness: 'forced', seed: i });
            expect(r.accepted).toBe(true);
        }
    });

    test('acceptance rate > 20% in 100 mixed transactions', () => {
        const scenarios = [
            { need: 'high', sellingWillingness: 'forced' },
            { need: 'high', sellingWillingness: 'open' },
            { need: 'medium', sellingWillingness: 'open' },
            { need: 'low', sellingWillingness: 'open' },
        ];
        const results = Array(100).fill(null).map((_, i) =>
            makeOffer({ playerOvr: 70, playerAge: 26, playerContract: 20, seed: i, ...scenarios[i % scenarios.length] })
        );
        expect(results.filter(r => r.accepted).length).toBeGreaterThan(20);
    });

    test('expiring contract (<13 weeks) → marketValue drops ≥40%', () => {
        const full = calcMarketValue({ playerOvr: 70, playerAge: 26, playerContract: 30 });
        const expiring = calcMarketValue({ playerOvr: 70, playerAge: 26, playerContract: 10 });
        expect(expiring).toBeLessThanOrEqual(full * 0.6);
    });

    test('young player (22) → 30%+ premium vs prime (26) same OVR', () => {
        const young = calcMarketValue({ playerOvr: 70, playerAge: 22, playerContract: 26 });
        const prime = calcMarketValue({ playerOvr: 70, playerAge: 26, playerContract: 26 });
        expect(young).toBeGreaterThanOrEqual(prime * 1.3);
    });

    test('OVR 70 age 25 → marketValue 150k-250k', () => {
        const mv = calcMarketValue({ playerOvr: 70, playerAge: 25, playerContract: 26 });
        expect(mv).toBeGreaterThanOrEqual(150000);
        expect(mv).toBeLessThanOrEqual(250000);
    });

    test('counterOffer > offerPrice when rejected', () => {
        for (let i = 0; i < 30; i++) {
            const r = makeOffer({ playerOvr: 75, playerAge: 27, playerContract: 20, need: 'low', sellingWillingness: 'reluctant', seed: i });
            if (!r.accepted && r.counterOffer) {
                expect(r.counterOffer).toBeGreaterThan(r.offerPrice);
            }
        }
    });
});
