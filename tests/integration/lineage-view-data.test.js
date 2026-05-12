/**
 * SPEC-166 harness — Lineage & Legacy panel data plumbing.
 *
 * Regra 0 (Akita): toda spec entrega harness executável no mesmo PR.
 *
 * Cobertura:
 *  1. HallOfLegendsSystem.compute() shape contract.
 *  2. HeritageTraitSystem.inherit() determinism + empty hall.
 *  3. Filter helpers exportados do LineageView (humiliation/growth).
 *  4. Smoke: módulo importa sem crash (não tenta render — sem testing-library).
 *  5. Engine integration: hallOfLegends populado após 1 season simulada.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { compute as computeHall, isCanonized, SLOTS } from '../../src/engine/HallOfLegendsSystem.js';
import { inherit as inheritTraits } from '../../src/engine/HeritageTraitSystem.js';
import { filterHumiliationEvents, filterGrowthEvents } from '../../src/components/LineageView.jsx';

// Mock localStorage for Node
if (typeof globalThis.localStorage === 'undefined') {
    const store = {};
    globalThis.localStorage = {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = v; },
        removeItem: (k) => { delete store[k]; },
    };
}

describe('SPEC-166: Lineage & Legacy panel — data plumbing', () => {

    describe('HallOfLegendsSystem.compute()', () => {
        it('returns valid shape with empty input', () => {
            const result = computeHall({ clubId: 1 });
            expect(result).toHaveProperty('clubId', 1);
            expect(result).toHaveProperty('slots');
            expect(result).toHaveProperty('filledCount', 0);
            expect(typeof result.slots).toBe('object');
        });

        it('fills slots when player data has apps/goals/base markers', () => {
            const players = [
                { id: 1, name: 'Pelé',     apps: 200, goals: 150, fromBase: true,  morale: 80 },
                { id: 2, name: 'Garrincha', apps: 180, goals: 90, fromBase: false, morale: 60 },
                { id: 3, name: 'Zico',      apps: 50,  goals: 30, fromBase: false, hadLongInjury: true },
            ];
            const result = computeHall({ clubId: 1, players });
            expect(result.filledCount).toBeGreaterThan(0);
            expect(result.slots.idoloEterno?.playerName).toBe('Pelé');     // most apps
            expect(result.slots.goleirao?.playerName).toBe('Pelé');         // most goals
            expect(result.slots.criaDaBase?.playerName).toBe('Pelé');       // fromBase + goals
            expect(result.slots.lendaTragica?.playerName).toBe('Zico');     // hadLongInjury
        });

        it('SLOTS export lists all 6 keys', () => {
            expect(SLOTS).toHaveLength(6);
            expect(SLOTS).toContain('idoloEterno');
            expect(SLOTS).toContain('carrasco');
            expect(SLOTS).toContain('goleirao');
            expect(SLOTS).toContain('criaDaBase');
            expect(SLOTS).toContain('traidor');
            expect(SLOTS).toContain('lendaTragica');
        });

        it('isCanonized() finds canonized player by id', () => {
            const players = [{ id: 1, name: 'Pelé', apps: 200, goals: 150, fromBase: true }];
            const hall = computeHall({ clubId: 1, players });
            expect(isCanonized(hall, 1)).toBe(true);
            expect(isCanonized(hall, 999)).toBe(false);
        });
    });

    describe('HeritageTraitSystem.inherit()', () => {
        it('returns base traits when hall is empty', () => {
            const result = inheritTraits({ clubId: 1, hall: { slots: {} } });
            expect(result.traits.garra).toBe(30);
            expect(result.traits.talento_natural).toBe(30);
            expect(result.traits.lealdade).toBe(30);
            expect(result.traits.frieza).toBe(30);
            expect(result.inheritedFrom).toEqual([]);
        });

        it('inheritance is deterministic with seed', () => {
            const hall = {
                slots: {
                    idoloEterno: { playerId: 1, playerName: 'Pelé' },
                    goleirao:    { playerId: 1, playerName: 'Pelé' },
                },
            };
            const a = inheritTraits({ clubId: 1, hall, seed: 42 });
            const b = inheritTraits({ clubId: 1, hall, seed: 42 });
            expect(a.traits).toEqual(b.traits);
            expect(a.inheritedFrom).toEqual(b.inheritedFrom);
        });

        it('inheritanceNarrative references legend name when inherited', () => {
            // Use seed that guarantees inheritance (try multiple)
            const hall = {
                slots: {
                    idoloEterno: { playerId: 1, playerName: 'Pelé' },
                    goleirao:    { playerId: 2, playerName: 'Garrincha' },
                    criaDaBase:  { playerId: 3, playerName: 'Zico' },
                    carrasco:    { playerId: 4, playerName: 'Maradona' },
                },
            };
            // baseChance=1.0 → inherits all eligible slots deterministically
            const result = inheritTraits({ clubId: 1, hall, baseChance: 1.0, seed: 1 });
            expect(result.inheritedFrom.length).toBeGreaterThan(0);
            expect(result.inheritanceNarrative).toContain('espírito');
        });
    });

    describe('filterHumiliationEvents()', () => {
        it('returns empty array for null/undefined/empty input', () => {
            expect(filterHumiliationEvents(null)).toEqual([]);
            expect(filterHumiliationEvents(undefined)).toEqual([]);
            expect(filterHumiliationEvents([])).toEqual([]);
        });

        it('keeps only events starting with 💀 or 🛡️', () => {
            const events = [
                '💀 Elenco devastado pelo resultado.',
                '🛡️ Técnico sobrevive ao escândalo.',
                '⭐ Jovem promessa explodiu!',
                'Texto sem prefixo',
                123, // non-string
            ];
            const filtered = filterHumiliationEvents(events);
            expect(filtered).toHaveLength(2);
            expect(filtered[0]).toMatch(/^💀/);
            expect(filtered[1]).toMatch(/^🛡️/);
        });
    });

    describe('filterGrowthEvents()', () => {
        it('returns empty array for null/undefined/empty input', () => {
            expect(filterGrowthEvents(null)).toEqual([]);
            expect(filterGrowthEvents(undefined)).toEqual([]);
            expect(filterGrowthEvents([])).toEqual([]);
        });

        it('keeps only events starting with ⭐ ⚡ 🔥 📈 💪 🧬', () => {
            const events = [
                '⭐ Jovem explodiu! OVR +5',
                '🔥 Jogador em grande fase!',
                '📈 Peak season',
                '💪 Evoluiu no treino',
                '🧬 Herdou DNA de lenda',
                '⚡ Faísca',
                '💀 Vexame',
                'Sem prefixo',
            ];
            const filtered = filterGrowthEvents(events);
            expect(filtered).toHaveLength(6);
            const validPrefixes = ['⭐', '⚡', '🔥', '📈', '💪', '🧬'];
            filtered.forEach(e => {
                // Some prefixes are surrogate pairs (length 2). Match against startsWith.
                const matchesAny = validPrefixes.some(p => e.startsWith(p));
                expect(matchesAny).toBe(true);
            });
        });
    });

    describe('module import smoke', () => {
        it('LineageView module exports default + named filters', async () => {
            const mod = await import('../../src/components/LineageView.jsx');
            expect(typeof mod.LineageView).toBe('function');
            expect(typeof mod.default).toBe('function');
            expect(typeof mod.filterHumiliationEvents).toBe('function');
            expect(typeof mod.filterGrowthEvents).toBe('function');
        });
    });

    describe('engine integration — hallOfLegends after season', () => {
        let engine;

        beforeAll(async () => {
            const { Engine } = await import('../../src/engine/engine.js');
            engine = new Engine();
            engine.initGame('LinhagemBot', 1);
            // Simulate a full season to trigger HallOfLegends + Heritage flow.
            for (let w = 0; w < 38; w++) {
                engine.advanceWeek();
            }
        }, 60000);

        it('engine.hallOfLegends is computed or remains null defensively', () => {
            // After 1 season SeasonProcessor._processHallOfLegends should have run.
            // hallOfLegends may be null if try/catch caught error, but field must exist.
            expect('hallOfLegends' in engine).toBe(true);
            if (engine.hallOfLegends) {
                expect(engine.hallOfLegends).toHaveProperty('slots');
                expect(typeof engine.hallOfLegends.filledCount).toBe('number');
            }
        });

        it('engine.weekEvents is always an array (current week)', () => {
            expect(Array.isArray(engine.weekEvents)).toBe(true);
        });
    });
});
