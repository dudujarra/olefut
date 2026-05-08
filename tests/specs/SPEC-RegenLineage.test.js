/**
 * Regen Lineage tests — AKITA-054 v1.3
 */

import { describe, test, expect } from 'vitest';
import { MythService } from '../../src/services/MythService.js';
import { InheritanceService } from '../../src/services/InheritanceService.js';

describe('MythService.generateRegenChild — v1.3', () => {
    test('falha com engineOrSave null', () => {
        const svc = new MythService();
        const result = svc.generateRegenChild(null, 1);
        expect(result.success).toBe(false);
    });

    test('falha sem parent encontrado', () => {
        const svc = new MythService();
        const save = { teams: [{ squad: [] }] };
        const result = svc.generateRegenChild(save, 999);
        expect(result.success).toBe(false);
    });

    test('encontra parent na squad ativa', () => {
        const svc = new MythService();
        const save = {
            teams: [{
                squad: [{ id: 1, name: 'Pai Ativo', position: 'ATA' }]
            }]
        };
        const result = svc.generateRegenChild(save, 1, { rng: () => 0.1 });
        expect(result.success).toBe(true);
        expect(result.child.parentId).toBe(1);
    });

    test('encontra parent em retiredPlayers', () => {
        const svc = new MythService();
        const save = {
            teams: [],
            retiredPlayers: [{ playerId: 99, name: 'Pai Aposentado' }]
        };
        const result = svc.generateRegenChild(save, 99, { rng: () => 0.1 });
        expect(result.success).toBe(true);
        expect(result.child.parentName).toBe('Pai Aposentado');
    });

    test('rng > 0.25: no birth (probabilidade gate)', () => {
        const svc = new MythService();
        const save = {
            teams: [{ squad: [{ id: 1, name: 'X' }] }]
        };
        const result = svc.generateRegenChild(save, 1, { rng: () => 0.5 });
        expect(result.success).toBe(false);
    });

    test('child age 16-18', () => {
        const svc = new MythService();
        const save = {
            teams: [{ squad: [{ id: 1, name: 'X', position: 'ATA' }] }]
        };
        const result = svc.generateRegenChild(save, 1, { rng: () => 0.1 });
        expect(result.child.age).toBeGreaterThanOrEqual(16);
        expect(result.child.age).toBeLessThanOrEqual(18);
    });

    test('persiste em regenLineage', () => {
        const svc = new MythService();
        const save = {
            teams: [{ squad: [{ id: 1, name: 'X' }] }]
        };
        svc.generateRegenChild(save, 1, { rng: () => 0.1, currentSeason: 5 });
        expect(save.regenLineage).toHaveLength(1);
        expect(save.regenLineage[0].parentId).toBe(1);
        expect(save.regenLineage[0].bornAt).toBe(5);
    });

    test('herda traits via InheritanceService injected', () => {
        const inhSvc = new InheritanceService();
        const svc = new MythService();
        const save = {
            teams: [{
                squad: [{
                    id: 1,
                    name: 'Pai Lendário',
                    position: 'ATA',
                    traits: { garra: 100, talento_natural: 100, lealdade: 100, frieza: 100 },
                    clubsPlayed: [1]
                }]
            }]
        };
        const result = svc.generateRegenChild(save, 1, {
            rng: () => 0.1,
            inheritanceService: inhSvc
        });
        // Child should inherit some elevated traits (parent ratio 40%)
        expect(result.child.traits).toBeDefined();
        expect(result.child.traits.garra).toBeGreaterThan(40);
    });

    test('child.isRegenChild flag true', () => {
        const svc = new MythService();
        const save = {
            teams: [{ squad: [{ id: 1, name: 'X' }] }]
        };
        const result = svc.generateRegenChild(save, 1, { rng: () => 0.1 });
        expect(result.child.isRegenChild).toBe(true);
    });
});

describe('MythService.getRegenChildren', () => {
    test('retorna lineage entries', () => {
        const svc = new MythService();
        const save = {
            teams: [{ squad: [{ id: 1, name: 'X' }] }]
        };
        svc.generateRegenChild(save, 1, { rng: () => 0.1 });
        const children = svc.getRegenChildren(save);
        expect(children).toHaveLength(1);
    });

    test('retorna [] sem regenLineage', () => {
        const svc = new MythService();
        expect(svc.getRegenChildren({})).toEqual([]);
    });
});
