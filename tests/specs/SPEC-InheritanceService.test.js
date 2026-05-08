/**
 * InheritanceService tests — AKITA-052 v1.1.5
 */

import { describe, test, expect } from 'vitest';
import { InheritanceService } from '../../src/services/InheritanceService.js';
import { MythService, INHERITABLE_TRAITS } from '../../src/services/MythService.js';

describe('InheritanceService — initializeBaseTraits', () => {
    test('cria 4 traits range 30-70', () => {
        const svc = new InheritanceService();
        const traits = svc.initializeBaseTraits();
        expect(Object.keys(traits).sort()).toEqual([...INHERITABLE_TRAITS].sort());
        for (const t of INHERITABLE_TRAITS) {
            expect(traits[t]).toBeGreaterThanOrEqual(30);
            expect(traits[t]).toBeLessThanOrEqual(70);
        }
    });

    test('determinístico com seed', () => {
        const svc = new InheritanceService();
        const seed = () => 0.5;
        const t1 = svc.initializeBaseTraits(seed);
        const t2 = svc.initializeBaseTraits(seed);
        expect(t1).toEqual(t2);
    });
});

describe('InheritanceService — applyHallBias', () => {
    test('sem MythService injetado: traits inalteradas', () => {
        const svc = new InheritanceService();
        const traits = { garra: 50, talento_natural: 50, lealdade: 50, frieza: 50 };
        const result = svc.applyHallBias(traits, {}, 1);
        expect(result).toEqual(traits);
    });

    test('idoloEterno preenchido: aumenta lealdade + talento_natural', () => {
        const mythSvc = new MythService();
        const svc = new InheritanceService({ mythService: mythSvc });
        const save = {};
        mythSvc.promoteToHallOfFame(save, 1, 1, 'idoloEterno');

        const baseTraits = { garra: 50, talento_natural: 50, lealdade: 50, frieza: 50 };
        const result = svc.applyHallBias(baseTraits, save, 1);
        expect(result.lealdade).toBeGreaterThan(50); // bias +20 * 0.15
        expect(result.talento_natural).toBeGreaterThan(50); // bias +15 * 0.15
    });

    test('traidor preenchido: diminui lealdade', () => {
        const mythSvc = new MythService();
        const svc = new InheritanceService({ mythService: mythSvc });
        const save = {};
        mythSvc.promoteToHallOfFame(save, 1, 1, 'traidor');

        const baseTraits = { garra: 50, talento_natural: 50, lealdade: 50, frieza: 50 };
        const result = svc.applyHallBias(baseTraits, save, 1);
        expect(result.lealdade).toBeLessThan(50);
    });

    test('múltiplos slots: efeito acumula', () => {
        const mythSvc = new MythService();
        const svc = new InheritanceService({ mythService: mythSvc });
        const save = {};
        mythSvc.promoteToHallOfFame(save, 1, 1, 'idoloEterno');
        mythSvc.promoteToHallOfFame(save, 2, 1, 'criaDaBase');

        const baseTraits = { garra: 50, talento_natural: 50, lealdade: 50, frieza: 50 };
        const result = svc.applyHallBias(baseTraits, save, 1);
        // Both have lealdade bonus → strong increase
        expect(result.lealdade).toBeGreaterThan(55);
    });

    test('clamps em 0-100', () => {
        const mythSvc = new MythService();
        const svc = new InheritanceService({ mythService: mythSvc });
        const save = {};
        // Add many slots
        mythSvc.promoteToHallOfFame(save, 1, 1, 'idoloEterno');
        mythSvc.promoteToHallOfFame(save, 2, 1, 'criaDaBase');
        mythSvc.promoteToHallOfFame(save, 3, 1, 'goleirao');

        const baseTraits = { garra: 95, talento_natural: 95, lealdade: 95, frieza: 95 };
        const result = svc.applyHallBias(baseTraits, save, 1);
        for (const t of INHERITABLE_TRAITS) {
            expect(result[t]).toBeLessThanOrEqual(100);
            expect(result[t]).toBeGreaterThanOrEqual(0);
        }
    });
});

describe('InheritanceService — applyParentInheritance', () => {
    test('sem parents: traits inalteradas', () => {
        const svc = new InheritanceService();
        const traits = { garra: 50, talento_natural: 50, lealdade: 50, frieza: 50 };
        expect(svc.applyParentInheritance(traits, [])).toEqual(traits);
    });

    test('um parent: mix 60% próprio + 40% parent', () => {
        const svc = new InheritanceService();
        const baseTraits = { garra: 0, talento_natural: 0, lealdade: 0, frieza: 0 };
        const parents = [{
            traits: { garra: 100, talento_natural: 100, lealdade: 100, frieza: 100 }
        }];
        const result = svc.applyParentInheritance(baseTraits, parents);
        // Esperado: 0 * 0.6 + 100 * 0.4 = 40
        expect(result.garra).toBe(40);
    });

    test('dois parents: avg + ratio', () => {
        const svc = new InheritanceService();
        const baseTraits = { garra: 0, talento_natural: 0, lealdade: 0, frieza: 0 };
        const parents = [
            { traits: { garra: 100, talento_natural: 50, lealdade: 50, frieza: 50 } },
            { traits: { garra: 50, talento_natural: 50, lealdade: 50, frieza: 50 } }
        ];
        const result = svc.applyParentInheritance(baseTraits, parents);
        // garra avg = 75 → 0*0.6 + 75*0.4 = 30
        expect(result.garra).toBe(30);
    });
});

describe('InheritanceService — generateInheritedTraits (full pipeline)', () => {
    test('gera traits válidos sem parents nem hall', () => {
        const svc = new InheritanceService();
        const traits = svc.generateInheritedTraits({}, null, []);
        for (const t of INHERITABLE_TRAITS) {
            expect(traits[t]).toBeGreaterThanOrEqual(0);
            expect(traits[t]).toBeLessThanOrEqual(100);
            expect(Number.isInteger(traits[t])).toBe(true);
        }
    });

    test('hall + parents combinam efeitos', () => {
        const mythSvc = new MythService();
        const svc = new InheritanceService({ mythService: mythSvc });
        const save = {};
        mythSvc.promoteToHallOfFame(save, 1, 1, 'idoloEterno');

        const parents = [{ traits: { garra: 90, talento_natural: 90, lealdade: 90, frieza: 90 } }];
        const traits = svc.generateInheritedTraits(save, 1, parents, () => 0.5);

        // Should be elevated: parent +40% (90*0.4=36) + hall idoloEterno bias
        expect(traits.lealdade).toBeGreaterThan(50);
    });
});

describe('InheritanceService — helpers', () => {
    test('getDominantTrait retorna trait máximo', () => {
        const svc = new InheritanceService();
        const traits = { garra: 80, talento_natural: 60, lealdade: 50, frieza: 70 };
        const result = svc.getDominantTrait(traits);
        expect(result.trait).toBe('garra');
        expect(result.value).toBe(80);
    });

    test('findClosestHallMatch encontra slot mais alinhado', () => {
        const mythSvc = new MythService();
        const svc = new InheritanceService({ mythService: mythSvc });
        const save = {};
        mythSvc.promoteToHallOfFame(save, 1, 1, 'idoloEterno');
        mythSvc.promoteToHallOfFame(save, 2, 1, 'goleirao');

        // Player com frieza alta → matches goleirao melhor
        const traits = { garra: 30, talento_natural: 30, lealdade: 30, frieza: 95 };
        const match = svc.findClosestHallMatch(traits, save, 1);
        expect(match).not.toBeNull();
        expect(match.slot).toBe('goleirao');
    });
});
