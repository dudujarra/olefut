import { describe, test, expect } from 'vitest';
import { inherit } from '../../src/engine/HeritageTraitSystem.js';

const mockHall = {
    clubId: 1,
    slots: {
        idoloEterno: { playerId: 1, playerName: 'Pelé', slot: 'idoloEterno' },
        goleirao: { playerId: 2, playerName: 'Romário', slot: 'goleirao' },
    },
    filledCount: 2,
};

describe('SPEC-079: Heritage Trait System', () => {

    test('inherit returns traits object with all 4 keys', () => {
        const result = inherit({ clubId: 1, hall: mockHall, seed: 42 });
        expect(result.traits).toBeDefined();
        expect(Object.keys(result.traits)).toContain('garra');
        expect(Object.keys(result.traits)).toContain('talento_natural');
        expect(Object.keys(result.traits)).toContain('lealdade');
        expect(Object.keys(result.traits)).toContain('frieza');
    });

    test('all trait values in 0-100 range', () => {
        const result = inherit({ clubId: 1, hall: mockHall, seed: 99 });
        Object.values(result.traits).forEach(v => {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(100);
        });
    });

    test('inheritedFrom lists slot names', () => {
        const result = inherit({ clubId: 1, hall: mockHall, baseChance: 1.0, seed: 1 });
        expect(Array.isArray(result.inheritedFrom)).toBe(true);
    });

    test('inheritanceNarrative is non-empty', () => {
        const result = inherit({ clubId: 1, hall: mockHall, seed: 42 });
        expect(result.inheritanceNarrative).toBeTruthy();
        expect(result.inheritanceNarrative.length).toBeGreaterThan(5);
    });

    test('with baseChance=1.0 always inherits from filled slots', () => {
        const result = inherit({ clubId: 1, hall: mockHall, baseChance: 1.0, seed: 1 });
        expect(result.inheritedFrom.length).toBeGreaterThan(0);
    });

    test('with baseChance=0.0 inherits from nothing', () => {
        const result = inherit({ clubId: 1, hall: mockHall, baseChance: 0.0, seed: 1 });
        expect(result.inheritedFrom.length).toBe(0);
    });

    test('empty hall → no inheritance, narrative still returned', () => {
        const result = inherit({ clubId: 1, hall: { slots: {}, filledCount: 0 }, seed: 1 });
        expect(result.inheritedFrom.length).toBe(0);
        expect(result.inheritanceNarrative).toBeTruthy();
    });

    test('deterministic with same seed', () => {
        const a = inherit({ clubId: 1, hall: mockHall, seed: 777 });
        const b = inherit({ clubId: 1, hall: mockHall, seed: 777 });
        expect(JSON.stringify(a.traits)).toBe(JSON.stringify(b.traits));
    });
});
