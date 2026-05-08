/**
 * MythService unit tests — AKITA-RFCT-005
 *
 * Read-only methods + helpers. Engine não envolvido (stateless service).
 */

import { describe, test, expect } from 'vitest';
import { MythService, MYTH_SLOTS, INHERITABLE_TRAITS } from '../../src/services/MythService.js';

describe('MythService — vocabulário fixo (SPEC-049 Camada 5)', () => {
    test('MYTH_SLOTS contém 6 slots imutáveis', () => {
        expect(MYTH_SLOTS).toHaveLength(6);
        expect(MYTH_SLOTS).toContain('idoloEterno');
        expect(MYTH_SLOTS).toContain('carrasco');
        expect(MYTH_SLOTS).toContain('goleirao');
        expect(MYTH_SLOTS).toContain('criaDaBase');
        expect(MYTH_SLOTS).toContain('traidor');
        expect(MYTH_SLOTS).toContain('lendaTragica');
    });

    test('INHERITABLE_TRAITS contém 4 traits imutáveis', () => {
        expect(INHERITABLE_TRAITS).toHaveLength(4);
        expect(INHERITABLE_TRAITS).toEqual(['garra', 'talento_natural', 'lealdade', 'frieza']);
    });

    test('MYTH_SLOTS é frozen (anti-tampering)', () => {
        expect(Object.isFrozen(MYTH_SLOTS)).toBe(true);
        expect(Object.isFrozen(INHERITABLE_TRAITS)).toBe(true);
    });
});

describe('MythService — getLegends', () => {
    test('retorna [] para input null', () => {
        const svc = new MythService();
        expect(svc.getLegends(null)).toEqual([]);
        expect(svc.getLegends(undefined)).toEqual([]);
    });

    test('retorna [] para save sem myth.legends', () => {
        const svc = new MythService();
        expect(svc.getLegends({})).toEqual([]);
        expect(svc.getLegends({ myth: {} })).toEqual([]);
    });

    test('retorna copy de myth.legends', () => {
        const svc = new MythService();
        const save = { myth: { legends: [{ id: 1, name: 'Pelé' }] } };
        const result = svc.getLegends(save);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Pelé');
        // Verifica copy (não referência)
        result.push({ id: 2, name: 'Fake' });
        expect(save.myth.legends).toHaveLength(1);
    });
});

describe('MythService — getHallOfFame', () => {
    test('retorna hall vazio (null em todos slots) sem clubId', () => {
        const svc = new MythService();
        const hall = svc.getHallOfFame({}, null);
        expect(hall).toEqual({
            idoloEterno: null,
            carrasco: null,
            goleirao: null,
            criaDaBase: null,
            traidor: null,
            lendaTragica: null
        });
    });

    test('retorna hall vazio para clube sem dados', () => {
        const svc = new MythService();
        const hall = svc.getHallOfFame({ myth: { halls: {} } }, 1);
        expect(Object.values(hall).every(v => v === null)).toBe(true);
    });

    test('preenche slots existentes do clube', () => {
        const svc = new MythService();
        const save = {
            myth: {
                halls: {
                    1: { idoloEterno: 42, carrasco: 17 }
                }
            }
        };
        const hall = svc.getHallOfFame(save, 1);
        expect(hall.idoloEterno).toBe(42);
        expect(hall.carrasco).toBe(17);
        expect(hall.goleirao).toBeNull();
        expect(hall.criaDaBase).toBeNull();
    });

    test('todos os 6 slots presentes mesmo com dados parciais', () => {
        const svc = new MythService();
        const save = { myth: { halls: { 1: { idoloEterno: 42 } } } };
        const hall = svc.getHallOfFame(save, 1);
        expect(Object.keys(hall).sort()).toEqual([...MYTH_SLOTS].sort());
    });
});

describe('MythService — getRegenChildren', () => {
    test('retorna [] sem regenLineage', () => {
        const svc = new MythService();
        expect(svc.getRegenChildren({})).toEqual([]);
    });

    test('retorna copy de regenLineage', () => {
        const svc = new MythService();
        const save = { regenLineage: [{ childId: 1, parentId: 100 }] };
        const result = svc.getRegenChildren(save);
        expect(result).toHaveLength(1);
        result.push({ fake: true });
        expect(save.regenLineage).toHaveLength(1);
    });

    test('aceita regenLineage em myth.regenLineage', () => {
        const svc = new MythService();
        const save = { myth: { regenLineage: [{ childId: 99 }] } };
        expect(svc.getRegenChildren(save)).toHaveLength(1);
    });
});

describe('MythService — helpers', () => {
    test('isCanonized: false para playerId não em legends', () => {
        const svc = new MythService();
        const save = { myth: { legends: [{ playerId: 1 }] } };
        expect(svc.isCanonized(save, 999)).toBe(false);
    });

    test('isCanonized: true para playerId em legends', () => {
        const svc = new MythService();
        const save = { myth: { legends: [{ playerId: 42 }] } };
        expect(svc.isCanonized(save, 42)).toBe(true);
    });

    test('countHallSlots: 0 para hall vazio', () => {
        const svc = new MythService();
        expect(svc.countHallSlots({}, 1)).toBe(0);
    });

    test('countHallSlots: conta slots não-null', () => {
        const svc = new MythService();
        const save = {
            myth: {
                halls: {
                    1: { idoloEterno: 1, carrasco: 2, goleirao: null }
                }
            }
        };
        expect(svc.countHallSlots(save, 1)).toBe(2);
    });
});

describe('MythService — write placeholders (AKITA-RFCT-007)', () => {
    test('addLegend é callable (placeholder)', () => {
        const svc = new MythService();
        expect(() => svc.addLegend({}, 1, 'idoloEterno')).not.toThrow();
    });

    test('promoteToHallOfFame é callable (placeholder)', () => {
        const svc = new MythService();
        expect(() => svc.promoteToHallOfFame({}, 1, 1, 'idoloEterno')).not.toThrow();
    });

    test('generateRegenChild é callable (placeholder)', () => {
        const svc = new MythService();
        expect(() => svc.generateRegenChild({}, 1)).not.toThrow();
    });
});
