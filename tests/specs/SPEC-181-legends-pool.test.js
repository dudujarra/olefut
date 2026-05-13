/**
 * SPEC-181: LegendsCrossSavePool harness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    markRetired,
    recruitableLegends,
    computeEligibleRoles,
    loadPool,
    resetPool,
    getPool,
    exportPool,
    importPool,
    MAX_POOL_SIZE,
} from '../../src/engine/LegendsCrossSavePool.js';

const sampleHallEntry = {
    slot: 'idoloEterno',
    slotLabel: 'Ídolo Eterno',
    playerName: 'Ronaldo',
    stats: { apps: 412, goals: 287 },
};

const sampleAttrs = { leadership: 80, technique: 85, charisma: 75 };

describe('SPEC-181: LegendsCrossSavePool', () => {

    beforeEach(() => resetPool());

    describe('computeEligibleRoles', () => {
        it('leadership 80 → coach eligible', () => {
            expect(computeEligibleRoles({ leadership: 80 })).toContain('coach');
        });

        it('leadership 65 → no coach', () => {
            expect(computeEligibleRoles({ leadership: 65 })).not.toContain('coach');
        });

        it('technique 80 → scout', () => {
            expect(computeEligibleRoles({ technique: 80 })).toContain('scout');
        });

        it('charisma 70 → commentator', () => {
            expect(computeEligibleRoles({ charisma: 70 })).toContain('commentator');
        });

        it('high all → 3 roles', () => {
            const roles = computeEligibleRoles({ leadership: 80, technique: 80, charisma: 80 });
            expect(roles.length).toBe(3);
        });

        it('low all → 0 roles', () => {
            expect(computeEligibleRoles({ leadership: 50, technique: 50, charisma: 50 })).toEqual([]);
        });
    });

    describe('markRetired', () => {
        it('adds legend with eligible roles', () => {
            const r = markRetired({
                playerId: 1, saveId: 'save-A', retiredYear: 2030,
                hallEntry: sampleHallEntry, finalAttrs: sampleAttrs,
            });
            expect(r.added).toBe(true);
            expect(r.totalSize).toBe(1);
        });

        it('skips if no eligible roles', () => {
            const r = markRetired({
                playerId: 1, saveId: 'save-A', retiredYear: 2030,
                hallEntry: sampleHallEntry, finalAttrs: { leadership: 50, technique: 50, charisma: 50 },
            });
            expect(r.added).toBe(false);
        });

        it('rejects duplicate (same save + playerId + year)', () => {
            markRetired({
                playerId: 1, saveId: 'save-A', retiredYear: 2030,
                hallEntry: sampleHallEntry, finalAttrs: sampleAttrs,
            });
            const r = markRetired({
                playerId: 1, saveId: 'save-A', retiredYear: 2030,
                hallEntry: sampleHallEntry, finalAttrs: sampleAttrs,
            });
            expect(r.added).toBe(false);
        });

        it('FIFO eviction at MAX_POOL_SIZE', () => {
            for (let i = 0; i < MAX_POOL_SIZE + 5; i++) {
                markRetired({
                    playerId: i, saveId: `save-${i}`, retiredYear: 2030 + i,
                    hallEntry: sampleHallEntry, finalAttrs: sampleAttrs,
                });
            }
            const pool = getPool();
            expect(pool.length).toBe(MAX_POOL_SIZE);
        });

        it('missing playerId → not added', () => {
            const r = markRetired({ saveId: 'save-A' });
            expect(r.added).toBe(false);
        });
    });

    describe('recruitableLegends', () => {
        beforeEach(() => {
            markRetired({
                playerId: 1, saveId: 'save-A', retiredYear: 2030,
                hallEntry: sampleHallEntry, finalAttrs: sampleAttrs,
            });
            markRetired({
                playerId: 2, saveId: 'save-B', retiredYear: 2032,
                hallEntry: { ...sampleHallEntry, playerName: 'Pele', stats: { apps: 500, goals: 350 } },
                finalAttrs: sampleAttrs,
            });
        });

        it('returns legends for coach role', () => {
            const r = recruitableLegends({ role: 'coach', count: 5 });
            expect(r.length).toBeGreaterThan(0);
            expect(r.every(l => l.role === 'coach')).toBe(true);
        });

        it('respects count limit', () => {
            const r = recruitableLegends({ role: 'coach', count: 1 });
            expect(r.length).toBe(1);
        });

        it('excludes saveId match', () => {
            const r = recruitableLegends({ role: 'coach', count: 5, excludeSaveId: 'save-A' });
            expect(r.find(l => l.name === 'Ronaldo')).toBeUndefined();
            expect(r.find(l => l.name === 'Pele')).toBeDefined();
        });

        it('bio includes apps + goals + year', () => {
            const r = recruitableLegends({ role: 'coach' });
            expect(r[0].bio).toMatch(/jogos/);
            expect(r[0].bio).toMatch(/gols/);
            expect(r[0].bio).toMatch(/202\d|203\d/);
        });

        it('baseSalary > 0', () => {
            const r = recruitableLegends({ role: 'coach' });
            expect(r[0].baseSalary).toBeGreaterThan(0);
        });

        it('scout role returns judging attr', () => {
            const r = recruitableLegends({ role: 'scout' });
            expect(r[0].attrs.judging).toBeGreaterThan(0);
        });

        it('commentator role returns eloquence attr', () => {
            const r = recruitableLegends({ role: 'commentator' });
            expect(r[0].attrs.eloquence).toBeGreaterThan(0);
        });

        it('empty pool → empty array', () => {
            resetPool();
            expect(recruitableLegends({ role: 'coach' })).toEqual([]);
        });
    });

    describe('persistence (storage roundtrip)', () => {
        it('survives load after save', () => {
            markRetired({
                playerId: 99, saveId: 'save-X', retiredYear: 2040,
                hallEntry: sampleHallEntry, finalAttrs: sampleAttrs,
            });
            const data = loadPool();
            expect(data.pool.length).toBe(1);
            expect(data.pool[0].name).toBe('Ronaldo');
        });

        it('exportPool returns JSON parseable', () => {
            markRetired({
                playerId: 1, saveId: 'save-A', retiredYear: 2030,
                hallEntry: sampleHallEntry, finalAttrs: sampleAttrs,
            });
            const json = exportPool();
            const parsed = JSON.parse(json);
            expect(parsed.pool).toBeDefined();
            expect(parsed.version).toBeDefined();
        });

        it('importPool restores from JSON', () => {
            markRetired({
                playerId: 1, saveId: 'save-A', retiredYear: 2030,
                hallEntry: sampleHallEntry, finalAttrs: sampleAttrs,
            });
            const exported = exportPool();
            resetPool();
            expect(getPool().length).toBe(0);
            const ok = importPool(exported);
            expect(ok).toBe(true);
            expect(getPool().length).toBe(1);
        });

        it('importPool rejects invalid schema', () => {
            const bad = JSON.stringify({ version: 999, pool: [] });
            expect(importPool(bad)).toBe(false);
        });

        it('importPool rejects malformed JSON', () => {
            expect(importPool('{not json')).toBe(false);
        });
    });

    describe('graceful degradation', () => {
        it('corrupt localStorage → returns empty pool', () => {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('olefut_legends_pool', '{invalid');
                const data = loadPool();
                expect(data.pool).toEqual([]);
            }
        });
    });

});
