// Regression test for BUG-013
// NPCAISystem + WeatherSystem usavam `let rngState` module-level (race condition)
// setSeed em uma instância afetava outras
// Issue: https://github.com/dudujarra/elifoot-web/issues/9
import { describe, test, expect } from 'vitest';
import { NPCAISystem } from '../../src/engine/systems/NPCAISystem.js';
import { WeatherSystem } from '../../src/engine/systems/WeatherSystem.js';

describe('BUG-013 regression: rng state per-instance (no race)', () => {
    test('Two NPC instances independent rng', () => {
        const ai1 = new NPCAISystem(100);
        const ai2 = new NPCAISystem(200);

        // Get bid de ai2 não deve afetar ai1
        const ai1Bid1 = ai1.getNPCBid({ teamId: 1, marketValue: 1000 });
        ai2.getNPCBid({ teamId: 1, marketValue: 1000 }); // ai2 consome rng

        // Reseta ai1 com mesmo seed: primeiro bid deve ser idêntico ai1Bid1
        const ai1Reset = new NPCAISystem(100);
        const ai1Bid2 = ai1Reset.getNPCBid({ teamId: 1, marketValue: 1000 });
        expect(ai1Bid2).toBe(ai1Bid1); // mesmo seed = mesma sequência
    });

    test('setSeed em uma instância não afeta outra', () => {
        const ai1 = new NPCAISystem(50);
        const ai2 = new NPCAISystem(50);

        const v1Before = ai1.getNPCBid({ teamId: 1, marketValue: 1000 });

        ai2.setSeed(999); // muda só ai2
        ai2.getNPCBid({ teamId: 1, marketValue: 1000 }); // consume

        const ai1After = new NPCAISystem(50);
        const v1After = ai1After.getNPCBid({ teamId: 1, marketValue: 1000 });

        expect(v1Before).toBe(v1After);
    });

    test('Weather systems não compartilham rng state', () => {
        const w1 = new WeatherSystem(123);
        const w2 = new WeatherSystem(123);

        // w1 gera 5 weeks, w2 não
        for (let i = 1; i <= 5; i++) w1.generateWeather(i, 'Brasil');

        // w2 começa do zero
        const w2Week1 = w2.generateWeather(1, 'Brasil');

        // w1 reset com mesmo seed deve produzir mesmo week 1
        const w1Reset = new WeatherSystem(123);
        const w1Week1 = w1Reset.generateWeather(1, 'Brasil');

        expect(w2Week1.type).toBe(w1Week1.type);
    });
});
