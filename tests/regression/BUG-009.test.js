// Regression test for BUG-009
// ContractSystem payGoalBonus pagava bonus 2x se chamado com goalNumber distintos
// Spec SPEC-016: bônus pago 1× por evento gol único
// Issue: https://github.com/dudujarra/elifoot-web/issues/4
import { describe, test, expect, beforeEach } from 'vitest';
import { ContractSystem } from '../../src/engine/systems/ContractSystem.js';

describe('BUG-009 regression: bonus único por eventId', () => {
    let cs;
    beforeEach(() => {
        cs = new ContractSystem();
        cs.offerContract({ playerId: 1, salary: 50000, duration: 2, type: 'Junior', bonuses: { perGoal: 5000 } });
    });

    test('Mesmo eventId não paga 2x', () => {
        const b1 = cs.payGoalBonus(1, 'event_001');
        const b2 = cs.payGoalBonus(1, 'event_001');
        expect(b1).toBe(5000);
        expect(b2).toBe(0);
    });

    test('EventIds distintos pagam cada um 1×', () => {
        const b1 = cs.payGoalBonus(1, 'event_001');
        const b2 = cs.payGoalBonus(1, 'event_002');
        expect(b1).toBe(5000);
        expect(b2).toBe(5000);
    });

    test('Sem eventId: gera id único, paga 1×', () => {
        // Mesmo gol, sem id, paga separadamente cada chamada (auto-increment)
        const b1 = cs.payGoalBonus(1);
        const b2 = cs.payGoalBonus(1);
        expect(b1).toBe(5000);
        expect(b2).toBe(5000);
    });
});
