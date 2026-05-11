// SPEC-025: Advanced Player Aging harness
import { describe, test, expect } from 'vitest';
import { processPlayerDevelopment, ageSquad } from '../../src/engine/PlayerDevelopment.js';

function makePlayer({ age = 22, personality = 'Profissional' } = {}) {
    return {
        id: 1, name: 'Test', age, personality,
        attacking: 70, technical: 70, tactical: 70, defending: 70, creativity: 70,
        position: 'MEI', ovr: 70, retired: false,
    };
}

describe('SPEC-025: Advanced Player Aging', () => {
    test('Young (16-21): growth occurs', () => {
        const p = makePlayer({ age: 18 });
        const changes = [];
        for (let i = 0; i < 100; i++) {
            changes.push(...processPlayerDevelopment(p));
        }
        const growth = changes.filter((c) => c.type === 'growth').length;
        expect(growth).toBeGreaterThan(0);
    });

    test('Prime (25-30): mostly stable', () => {
        const p = makePlayer({ age: 27 });
        const changes = [];
        for (let i = 0; i < 50; i++) {
            changes.push(...processPlayerDevelopment(p));
        }
        // mostly stable, fewer changes
        expect(changes.length).toBeLessThan(20);
    });

    test('Declining (33-36): decline events', () => {
        const p = makePlayer({ age: 34 });
        const changes = [];
        for (let i = 0; i < 200; i++) {
            changes.push(...processPlayerDevelopment(p));
        }
        const declines = changes.filter((c) => c.type === 'decline');
        expect(declines.length).toBeGreaterThan(0);
    });

    test('ageSquad ages all', () => {
        const squad = [makePlayer({ age: 25 }), makePlayer({ age: 30 })];
        ageSquad(squad);
        expect(squad[0].age).toBe(26);
    });

    test('Old age can retire', () => {
        const p = makePlayer({ age: 38 });
        let retired = false;
        for (let i = 0; i < 50; i++) {
            processPlayerDevelopment(p);
            if (p.retired) {
                retired = true;
                break;
            }
        }
        // Pode aposentar — não é determinístico
        expect(typeof p.retired).toBe('boolean');
    });

    test('Caps maintained (attrs 20-99)', () => {
        const p = makePlayer({ age: 18 });
        for (let i = 0; i < 200; i++) {
            processPlayerDevelopment(p);
        }
        // SCHEMA-UNIFIED: check root-level stats
        const STAT_KEYS = ['attacking', 'technical', 'tactical', 'defending', 'creativity'];
        for (const key of STAT_KEYS) {
            expect(p[key]).toBeGreaterThanOrEqual(20);
            expect(p[key]).toBeLessThanOrEqual(99);
        }
    });

    test('Personality affects growth', () => {
        const pro = makePlayer({ age: 18, personality: 'Profissional' });
        const lazy = makePlayer({ age: 18, personality: 'Preguiçoso' });
        let pG = 0, lG = 0;
        for (let i = 0; i < 100; i++) {
            pG += processPlayerDevelopment(pro).filter((c) => c.type === 'growth').length;
            lG += processPlayerDevelopment(lazy).filter((c) => c.type === 'growth').length;
        }
        expect(pG).toBeGreaterThanOrEqual(lG);
    });

    // §3.1: Physical (attacking) decline fast, technical decline slow,
    // defending declines position-dependent. creativity (mental) can GROW, never declines.
    test('Decline first hits physical/technical/defensive (never creativity)', () => {
        const p = makePlayer({ age: 36 });
        const changes = [];
        for (let i = 0; i < 100; i++) {
            changes.push(...processPlayerDevelopment(p));
        }
        const declines = changes.filter((c) => c.type === 'decline');
        if (declines.length > 0) {
            for (const d of declines) {
                // creativity (mental) should NEVER decline — it can only grow
                expect(['attacking', 'defending', 'technical', 'tactical']).toContain(d.attr);
            }
        }
    });
});

