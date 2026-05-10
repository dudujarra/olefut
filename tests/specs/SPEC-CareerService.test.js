/**
 * CareerService unit tests — AKITA-RFCT-014/015/016 collapsed
 */

import { describe, test, expect } from 'vitest';
import { CareerService } from '../../src/services/CareerService.js';

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

describe('CareerService — retireProPlayer', () => {
    test('retireProPlayer aposenta e transiciona para manager', () => {
        const svc = new CareerService();
        const save = {
            proPlayer: { id: 1, name: 'Veterano', age: 36 }
        };
        const result = svc.retireProPlayer(save);
        expect(result.success).toBe(true);
        expect(save.proPlayer.retired).toBe(true);
        expect(save.mode).toBe('manager');
        expect(save.manager.name).toBe('Veterano');
        expect(save.manager.formerPlayer).toBe(true);
    });

    test('retireProPlayer rejeita sem proPlayer', () => {
        const svc = new CareerService();
        const result = svc.retireProPlayer({});
        expect(result.success).toBe(false);
    });

    test('retireProPlayer rejeita já aposentado', () => {
        const svc = new CareerService();
        const save = { proPlayer: { id: 1, retired: true } };
        const result = svc.retireProPlayer(save);
        expect(result.success).toBe(false);
    });
});
