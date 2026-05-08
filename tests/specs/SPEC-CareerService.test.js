/**
 * CareerService unit tests — AKITA-RFCT-014/015/016 collapsed
 */

import { describe, test, expect } from 'vitest';
import { CareerService } from '../../src/services/CareerService.js';
import { CareerTransition } from '../../src/services/CareerTransition.js';
import { MythService } from '../../src/services/MythService.js';
import { RelationshipService } from '../../src/services/RelationshipService.js';

describe('CareerService — RFCT-014 ProPlayer', () => {
    test('getProPlayer null sem proPlayer', () => {
        const svc = new CareerService();
        expect(svc.getProPlayer({})).toBeNull();
    });

    test('getProPlayer returns proPlayer', () => {
        const svc = new CareerService();
        const save = { proPlayer: { id: 1, name: 'Pelé' } };
        expect(svc.getProPlayer(save).name).toBe('Pelé');
    });

    test('advanceCareer increments weeksPlayed', () => {
        const svc = new CareerService();
        const save = { proPlayer: { id: 1, name: 'X' } };
        svc.advanceCareer(save, 5);
        expect(save.proPlayer.weeksPlayed).toBe(5);
    });

    test('advanceCareer rejeita aposentado', () => {
        const svc = new CareerService();
        const save = { proPlayer: { id: 1, retired: true } };
        const result = svc.advanceCareer(save, 1);
        expect(result.success).toBe(false);
    });
});

describe('CareerService — RFCT-015 Manager Career', () => {
    test('getManagerCareer retorna null inicialmente', () => {
        const svc = new CareerService();
        expect(svc.getManagerCareer({})).toBeNull();
    });

    test('signWithClub cria managerCareer', () => {
        const svc = new CareerService();
        const save = {};
        svc.signWithClub(save, 1, { weeks: 38, salary: 10000 });
        expect(save.managerCareer.currentClubId).toBe(1);
        expect(save.managerCareer.history).toHaveLength(1);
    });

    test('signWithClub fecha contrato anterior', () => {
        const svc = new CareerService();
        const save = {};
        svc.signWithClub(save, 1);
        svc.signWithClub(save, 2);
        expect(save.managerCareer.currentClubId).toBe(2);
        expect(save.managerCareer.history).toHaveLength(2);
        // Primeiro entry deve ter endedAt
        expect(save.managerCareer.history[0].endedAt).not.toBeNull();
    });

    test('addOffer + getOffers', () => {
        const svc = new CareerService();
        const save = {};
        svc.addOffer(save, { clubId: 1, salary: 5000 });
        const offers = svc.getOffers(save);
        expect(offers).toHaveLength(1);
        expect(offers[0].clubId).toBe(1);
    });
});

describe('CareerTransition — RFCT-016', () => {
    test('execute rejeita ProPlayer não aposentável (< 35 anos, < 12 temps)', () => {
        const save = {
            proPlayer: { id: 1, name: 'Young', age: 25, seasonsPlayed: 5 }
        };
        const transition = new CareerTransition(save);
        const result = transition.execute();
        expect(result.success).toBe(false);
    });

    test('execute aceita ProPlayer 35+ anos', () => {
        const save = {
            proPlayer: { id: 1, name: 'Veteran', age: 36, seasonsPlayed: 15 }
        };
        const transition = new CareerTransition(save);
        const result = transition.execute();
        expect(result.success).toBe(true);
    });

    test('execute aceita ProPlayer 12+ temps mesmo com idade < 35', () => {
        const save = {
            proPlayer: { id: 1, name: 'Y', age: 30, seasonsPlayed: 13 }
        };
        const transition = new CareerTransition(save);
        const result = transition.execute();
        expect(result.success).toBe(true);
    });

    test('execute snapshot persiste em retiredPlayers', () => {
        const save = {
            proPlayer: { id: 42, name: 'Pelé', age: 40, seasonsPlayed: 20, titles: [], clubsPlayed: [1, 2] }
        };
        const transition = new CareerTransition(save);
        transition.execute();
        expect(save.retiredPlayers).toHaveLength(1);
        expect(save.retiredPlayers[0].name).toBe('Pelé');
        expect(save.retiredPlayers[0].clubsPlayed).toEqual([1, 2]);
    });

    test('execute promote inicializa managerCareer', () => {
        const save = {
            proPlayer: { id: 1, name: 'X', age: 36, seasonsPlayed: 12 }
        };
        const transition = new CareerTransition(save);
        transition.execute();
        expect(save.managerCareer).toBeDefined();
        expect(save.managerCareer.originalPlayerId).toBe(1);
        expect(save.proPlayer.retired).toBe(true);
    });

    test('execute initial reputation: tier S +20', () => {
        const save = {
            proPlayer: {
                id: 1, name: 'Lenda', age: 36, seasonsPlayed: 14,
                titles: [{ tier: 'S' }, { tier: 'A' }],
                careerStats: { totalGoals: 250 }
            }
        };
        const transition = new CareerTransition(save);
        const result = transition.execute();
        // baseline 30 + tier S 20 + tier A 10 + 200+ goals 10 = 70
        expect(result.initialReputation).toBe(70);
    });

    test('execute initial reputation cap em 100', () => {
        const save = {
            proPlayer: {
                id: 1, name: 'GOAT', age: 40, seasonsPlayed: 20,
                titles: [{ tier: 'S' }, { tier: 'S' }, { tier: 'A' }, { tier: 'A' }, { tier: 'A' }],
                careerStats: { totalGoals: 500, totalAssists: 200 }
            }
        };
        const transition = new CareerTransition(save);
        const result = transition.execute();
        expect(result.initialReputation).toBe(100);
    });

    test('execute integra services injected', () => {
        const mythService = new MythService();
        const relSvc = new RelationshipService();
        const save = {
            proPlayer: {
                id: 1, name: 'Captain', age: 36, seasonsPlayed: 14,
                titles: [],
                clubsPlayed: [1]
            }
        };
        // Add hall slots no clube 1 pra trigger bonus
        mythService.promoteToHallOfFame(save, 1, 1, 'idoloEterno');
        mythService.promoteToHallOfFame(save, 2, 1, 'goleirao');

        const transition = new CareerTransition(save, { mythService, relationshipService: relSvc });
        transition.execute();

        // Trust ajustado: +5 ex-clube +10 hall slots >= 2
        expect(save.relations?.manager_president?.trust).toBe(75); // 60 + 5 + 10
    });
});

describe('CareerService → CareerTransition integration', () => {
    test('retireProPlayer delega a CareerTransition', () => {
        const svc = new CareerService({
            mythService: new MythService(),
            relationshipService: new RelationshipService()
        });
        const save = {
            proPlayer: { id: 1, name: 'X', age: 36, seasonsPlayed: 14 }
        };
        const result = svc.retireProPlayer(save);
        expect(result.success).toBe(true);
        expect(save.proPlayer.retired).toBe(true);
    });
});
