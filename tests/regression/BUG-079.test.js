// Regression test — BUG-079
// Player immortality: high-OVR titular players accumulate totalGoals indefinitely
// (7269 goals in 203 seasons observed in playtest 12) because stochastic retirement
// at age 35+ failed to trigger for at least one player over 191 seasons.
// Fix: force-retire any player with age > 42 as defensive safety cap.

import { describe, test, expect } from 'vitest';
import { processPlayerDevelopment } from '../../src/engine/PlayerDevelopment.js';

function makePlayer(age, ovr = 85) {
    return {
        id: 'test', name: 'Samuel Teixeira', position: 'ATA', age, ovr,
        energy: 100, moral: 70,
        personality: 'Profissional',
        attributes: { FIS: 85, DEF: 60, CRI: 85, FIN: 90, REF: 50 },
        career: { totalGoals: 7000, seasonGoals: 50, totalApps: 1000 }
    };
}

describe('BUG-079 — Player immortality safety cap', () => {
    test('player at age 43 is force-retired regardless of random outcome', () => {
        for (let i = 0; i < 10; i++) {
            const p = makePlayer(43);
            processPlayerDevelopment(p);
            expect(p._retired).toBe(true);
        }
    });

    test('player at age 42 always retires (retireChance = 8*0.15 = 1.2 > 1)', () => {
        for (let i = 0; i < 10; i++) {
            const p = makePlayer(42);
            processPlayerDevelopment(p);
            expect(p._retired).toBe(true);
        }
    });

    test('player at age 35 has ~15% weekly retire chance (not force-cap)', () => {
        let retiredCount = 0;
        const RUNS = 500;
        for (let i = 0; i < RUNS; i++) {
            const p = makePlayer(35);
            processPlayerDevelopment(p);
            if (p._retired) retiredCount++;
        }
        const rate = retiredCount / RUNS;
        expect(rate).toBeGreaterThan(0.05);
        expect(rate).toBeLessThan(0.35);
    });

    test('player at age 34 never hits retirement check', () => {
        for (let i = 0; i < 20; i++) {
            const p = makePlayer(34);
            processPlayerDevelopment(p);
            expect(p._retired).toBeFalsy();
        }
    });

    test('no player survives past age 42 in long simulation', () => {
        const player = makePlayer(35);
        let weeksAlive = 0;
        const MAX_WEEKS = 38 * 10;
        while (!player._retired && weeksAlive < MAX_WEEKS) {
            processPlayerDevelopment(player);
            weeksAlive++;
            // simulate annual aging every 38 weeks
            if (weeksAlive % 38 === 0) player.age++;
        }
        expect(player._retired).toBe(true);
        // safety cap at 43 means at most 8 years * 38 weeks = 304 weeks
        expect(weeksAlive).toBeLessThanOrEqual(304);
    });
});
