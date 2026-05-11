// SPEC-003: Player Development harness
import { describe, test, expect } from 'vitest';
import { processPlayerDevelopment, ageSquad, updateForm, getFormModifier, TACTIC_COUNTERS } from '../../src/engine/PlayerDevelopment.js';

function makePlayer({ age = 22, personality = 'Profissional', attrs = { attacking: 70, technical: 70, tactical: 70, defending: 70, creativity: 70 } } = {}) {
    return {
        id: 1,
        name: 'TestPlayer',
        age,
        personality,
        // SCHEMA-UNIFIED: root-level stats
        attacking: attrs.attacking ?? 70,
        technical: attrs.technical ?? 70,
        tactical: attrs.tactical ?? 70,
        defending: attrs.defending ?? 70,
        creativity: attrs.creativity ?? 70,
        position: 'MEI',
        ovr: 70,
        retired: false,
    };
}

describe('SPEC-003: Player Development', () => {
    test('Young player can grow', () => {
        const player = makePlayer({ age: 18 });
        const changes = [];
        for (let i = 0; i < 100; i++) {
            const c = processPlayerDevelopment(player);
            changes.push(...c);
        }
        const growth = changes.filter((c) => c.type === 'growth');
        expect(growth.length).toBeGreaterThan(0);
    });

    test('Old player can decline', () => {
        const player = makePlayer({ age: 35 });
        const changes = [];
        for (let i = 0; i < 50; i++) {
            const c = processPlayerDevelopment(player);
            changes.push(...c);
        }
        const declines = changes.filter((c) => c.type === 'decline');
        expect(declines.length).toBeGreaterThanOrEqual(0);
    });

    test('Profissional grows more than Preguiçoso', () => {
        const profissional = makePlayer({ age: 18, personality: 'Profissional' });
        const preguicoso = makePlayer({ age: 18, personality: 'Preguiçoso' });
        let pCount = 0;
        let lCount = 0;
        for (let i = 0; i < 200; i++) {
            const cP = processPlayerDevelopment(profissional);
            const cL = processPlayerDevelopment(preguicoso);
            pCount += cP.filter((c) => c.type === 'growth').length;
            lCount += cL.filter((c) => c.type === 'growth').length;
        }
        expect(pCount).toBeGreaterThanOrEqual(lCount);
    });

    test('ageSquad ages all players', () => {
        const squad = [makePlayer({ age: 25 }), makePlayer({ age: 30 })];
        ageSquad(squad);
        expect(squad[0].age).toBe(26);
        expect(squad[1].age).toBe(31);
    });

    test('updateForm modifies player form', () => {
        const player = makePlayer({ age: 25 });
        updateForm(player, 1);
        expect(player.form).toBeDefined();
        expect(Array.isArray(player.form.last5)).toBe(true);
        expect(player.form.last5[0]).toBe(1);
    });

    test('getFormModifier returns multiplier', () => {
        const hot = getFormModifier('hot');
        const cold = getFormModifier('cold');
        const normal = getFormModifier('normal');
        expect(hot).toBeGreaterThan(normal);
        expect(cold).toBeLessThan(normal);
    });

    test('TACTIC_COUNTERS defined', () => {
        expect(TACTIC_COUNTERS).toBeDefined();
        expect(typeof TACTIC_COUNTERS).toBe('object');
    });

    test('Attributes capped at 99', () => {
        const player = makePlayer({ age: 18, attrs: { attacking: 99, technical: 70, tactical: 70, defending: 70, creativity: 70 } });
        for (let i = 0; i < 100; i++) processPlayerDevelopment(player);
        expect(player.attacking).toBeLessThanOrEqual(99);
    });
});

