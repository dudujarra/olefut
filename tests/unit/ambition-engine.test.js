/**
 * Unit tests for AmbitionEngine
 * AKITA-411: Top 10 unit test coverage
 */
import { describe, it, expect } from 'vitest';
import {
    calcPrestige,
    calcAmbition,
    calcSatisfaction,
    processAmbitionWeekly,
    onRelegation,
    onPromotion,
    findContextualBuyers,
} from '../../src/engine/AmbitionEngine.js';

function makeTeam(overrides = {}) {
    return {
        id: 1, name: 'Test FC', division: 2, balance: 2_000_000,
        stadiumLevel: 2, academyLevel: 1,
        squad: Array.from({ length: 18 }, (_, i) => ({
            id: i, name: `P${i}`, position: 'MEI', ovr: 60 + i,
            moral: 60, energy: 80, age: 22 + i, isTitular: i < 11,
            contract: { weeksLeft: 20 }, salary: 5000,
        })),
        ...overrides,
    };
}

describe('AmbitionEngine', () => {
    describe('calcPrestige()', () => {
        it('returns number between 0-100 for a normal team', () => {
            const p = calcPrestige(makeTeam());
            expect(p).toBeGreaterThanOrEqual(0);
            expect(p).toBeLessThanOrEqual(100);
        });

        it('higher division gives more prestige', () => {
            const d1 = calcPrestige(makeTeam({ division: 1 }));
            const d4 = calcPrestige(makeTeam({ division: 4 }));
            expect(d1).toBeGreaterThan(d4);
        });
    });

    describe('calcAmbition()', () => {
        it('returns number between 0-100', () => {
            const player = { ovr: 75, age: 24, starRating: 3 };
            const a = calcAmbition(player);
            expect(a).toBeGreaterThanOrEqual(0);
            expect(a).toBeLessThanOrEqual(100);
        });

        it('higher OVR players have higher ambition', () => {
            const low = calcAmbition({ ovr: 40, age: 25 });
            const high = calcAmbition({ ovr: 85, age: 25 });
            expect(high).toBeGreaterThan(low);
        });
    });

    describe('calcSatisfaction()', () => {
        it('returns number between 0-100', () => {
            const team = makeTeam();
            const player = team.squad[0];
            const s = calcSatisfaction(player, team);
            expect(s).toBeGreaterThanOrEqual(0);
            expect(s).toBeLessThanOrEqual(100);
        });
    });

    describe('processAmbitionWeekly()', () => {
        it('populates _satisfaction on all active squad', () => {
            const team = makeTeam();
            processAmbitionWeekly(team);
            team.squad.forEach(p => {
                expect(typeof p._satisfaction).toBe('number');
            });
        });

        it('returns events array', () => {
            const team = makeTeam();
            const result = processAmbitionWeekly(team);
            expect(Array.isArray(result)).toBe(true);
        });

        it('sets _prestige on team', () => {
            const team = makeTeam();
            processAmbitionWeekly(team);
            expect(typeof team._prestige).toBe('number');
        });
    });

    describe('onRelegation()', () => {
        it('decreases moral of all players', () => {
            const team = makeTeam();
            team.squad.forEach(p => { p.moral = 70; });
            onRelegation(team, 2, 3);
            // All players should have reduced moral (some from transfer request, some from general drop)
            const avgMoral = team.squad.reduce((s, p) => s + p.moral, 0) / team.squad.length;
            expect(avgMoral).toBeLessThan(70);
        });

        it('returns events array with relegation info', () => {
            const team = makeTeam();
            const events = onRelegation(team, 1, 2);
            expect(Array.isArray(events)).toBe(true);
            expect(events.length).toBeGreaterThan(0);
            expect(events.some(e => e.type === 'relegation_financial')).toBe(true);
        });

        it('applies wage reduction', () => {
            const team = makeTeam();
            const originalSalary = team.squad[0].salary;
            onRelegation(team, 1, 2);
            expect(team.squad[0].salary).toBeLessThan(originalSalary);
        });
    });

    describe('onPromotion()', () => {
        it('increases moral of all players', () => {
            const team = makeTeam();
            team.squad.forEach(p => { p.moral = 50; });
            onPromotion(team, 3, 2);
            team.squad.forEach(p => {
                expect(p.moral).toBeGreaterThan(50);
            });
        });

        it('adds budget bonus', () => {
            const team = makeTeam();
            const oldBalance = team.balance;
            onPromotion(team, 3, 2);
            expect(team.balance).toBeGreaterThan(oldBalance);
        });
    });

    describe('findContextualBuyers()', () => {
        it('returns array of potential buyer teams', () => {
            const team = makeTeam();
            const team2 = makeTeam({ id: 2, name: 'Other FC', division: 1, balance: 10_000_000 });
            const allTeams = [team, team2];
            const player = team.squad[0];
            player.value = 500_000;
            const buyers = findContextualBuyers(player, allTeams, team);
            expect(Array.isArray(buyers)).toBe(true);
        });

        it('excludes seller team from buyers', () => {
            const team = makeTeam();
            const team2 = makeTeam({ id: 2, name: 'B FC', division: 1, balance: 10_000_000 });
            const player = team.squad[0];
            player.value = 500_000;
            const buyers = findContextualBuyers(player, [team, team2], team);
            expect(buyers.every(b => b.teamId !== team.id)).toBe(true);
        });
    });
});
