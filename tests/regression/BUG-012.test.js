// Regression test for BUG-012
// PrestigeSystem.processYear: Math.floor(prestige * 0.95) zerava valores baixos
// Issue: https://github.com/dudujarra/elifoot-web/issues/8
import { describe, test, expect, beforeEach } from 'vitest';
import { PrestigeSystem } from '../../src/engine/systems/PrestigeSystem.js';

describe('BUG-012 regression: decay preserva tier Local', () => {
    let prestige;
    beforeEach(() => {
        prestige = new PrestigeSystem();
    });

    test('Prestige < 20 não decai', () => {
        prestige.setPrestige(1, 10);
        prestige.processYear();
        expect(prestige.getPrestige(1)).toBe(10);
    });

    test('Prestige = 1 não vira 0 após decay', () => {
        prestige.setPrestige(1, 1);
        prestige.processYear();
        expect(prestige.getPrestige(1)).toBe(1);
    });

    test('Prestige > 20 decai normal', () => {
        prestige.setPrestige(1, 100);
        prestige.processYear();
        expect(prestige.getPrestige(1)).toBe(95);
    });

    test('Math.round (não floor): 21 * 0.95 = 19.95 → 20', () => {
        prestige.setPrestige(1, 21);
        prestige.processYear();
        // round(19.95) = 20
        expect(prestige.getPrestige(1)).toBe(20);
    });

    test('10 anos consecutivos: tier Local survives', () => {
        prestige.setPrestige(1, 15);
        for (let i = 0; i < 10; i++) prestige.processYear();
        expect(prestige.getPrestige(1)).toBe(15); // protegido
    });
});
