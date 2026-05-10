import { describe, test, expect } from 'vitest';
import { generate, resolve } from '../../src/engine/ContractGoalSystem.js';

const defaults = { managerId: 1, clubId: 10, contractType: 'new_hire' };

describe('SPEC-071: Contract Goals System', () => {

    test('every hired manager gets contract with objective', () => {
        const contract = generate({ ...defaults, clubTier: 'small', managerReputation: 30 });
        expect(contract.objective).toBeDefined();
        expect(contract.objectiveDescription).toBeTruthy();
    });

    test('big club rep≥60 gets title objective', () => {
        const contract = generate({ ...defaults, clubTier: 'big', managerReputation: 70 });
        expect(contract.objective).toBe('title');
    });

    test('big club rep<60 gets top_4', () => {
        const contract = generate({ ...defaults, clubTier: 'big', managerReputation: 50 });
        expect(contract.objective).toBe('top_4');
    });

    test('small club low rep gets avoid_relegation', () => {
        const contract = generate({ ...defaults, clubTier: 'small', managerReputation: 25 });
        expect(contract.objective).toBe('avoid_relegation');
    });

    test('small club div2 gets promotion', () => {
        const contract = generate({ ...defaults, clubTier: 'small', managerReputation: 50, clubDivision: 2 });
        expect(contract.objective).toBe('promotion');
    });

    test('failing objective with sufficient weeks → fired', () => {
        const result = resolve({ contractId: 'c1', objectiveMet: false, weeksManaged: 20, minWeeks: 10 });
        expect(result.consequence).toBe('fired');
    });

    test('minWeeks buffer protects from early firing', () => {
        const result = resolve({ contractId: 'c1', objectiveMet: false, weeksManaged: 5, minWeeks: 10 });
        expect(result.consequence).not.toBe('fired');
        expect(result.outcome).toBe('failed');
    });

    test('fulfill + rep≥70 → bigger_club_interested ≥30% of time', () => {
        const results = Array(200).fill(null).map(() =>
            resolve({ contractId: 'c1', objectiveMet: true, managerReputation: 75, bonusReputation: 8, penaltyReputation: 10 })
        );
        const biggerCount = results.filter(r => r.consequence === 'bigger_club_interested').length;
        expect(biggerCount).toBeGreaterThanOrEqual(30);
    });

    test('fulfill + rep<70 → mostly renewal_offered', () => {
        const results = Array(100).fill(null).map(() =>
            resolve({ contractId: 'c1', objectiveMet: true, managerReputation: 50, bonusReputation: 8, penaltyReputation: 10 })
        );
        const renewalCount = results.filter(r => r.consequence === 'renewal_offered').length;
        expect(renewalCount).toBeGreaterThan(50); // majority
    });

    test('bonusReputation in 5-15 range', () => {
        for (const tier of ['small', 'mid', 'big']) {
            const contract = generate({ ...defaults, clubTier: tier, managerReputation: 50 });
            expect(contract.bonusReputation).toBeGreaterThanOrEqual(5);
            expect(contract.bonusReputation).toBeLessThanOrEqual(15);
        }
    });

    test('penaltyReputation in 5-20 range', () => {
        for (const tier of ['small', 'mid', 'big']) {
            const contract = generate({ ...defaults, clubTier: tier, managerReputation: 50 });
            expect(contract.penaltyReputation).toBeGreaterThanOrEqual(5);
            expect(contract.penaltyReputation).toBeLessThanOrEqual(20);
        }
    });

    test('expiresAfterSeasons in 1-3 range', () => {
        const contract = generate({ ...defaults, clubTier: 'big', managerReputation: 80 });
        expect(contract.expiresAfterSeasons).toBeGreaterThanOrEqual(1);
        expect(contract.expiresAfterSeasons).toBeLessThanOrEqual(3);
    });

    test('failed outcome has negative or zero reputationDelta', () => {
        const result = resolve({ contractId: 'c1', objectiveMet: false, weeksManaged: 38, minWeeks: 10, penaltyReputation: 10 });
        expect(result.reputationDelta).toBeLessThanOrEqual(0);
    });

    test('fulfilled outcome has positive reputationDelta', () => {
        const result = resolve({ contractId: 'c1', objectiveMet: true, bonusReputation: 8 });
        expect(result.reputationDelta).toBeGreaterThan(0);
    });
});
