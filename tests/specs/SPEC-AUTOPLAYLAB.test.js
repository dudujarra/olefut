/**
 * AutoPlayLab F1-F4 — harness validando plataforma + presets
 */

import { describe, it, expect } from 'vitest';
import { captureSnapshot } from '../../src/services/AutoPlayLab/SnapshotAPI.js';
import { runBatch, seedRange, randomSeeds } from '../../src/services/AutoPlayLab/BatchRunner.js';
import { aggregateStat, diffBatches, histogram, extractCrashes, groupCrashesByStack } from '../../src/services/AutoPlayLab/DiffEngine.js';
import { toCSV, toJSON, timestampedFilename } from '../../src/services/AutoPlayLab/Exporter.js';
import { PRESETS, PRESET_CATEGORIES } from '../../src/services/AutoPlayLab/presets.js';

describe('AutoPlayLab platform', () => {

    describe('SnapshotAPI', () => {
        it('null engine → null', () => {
            expect(captureSnapshot(null)).toBe(null);
        });

        it('returns shape with required fields', () => {
            const mockEngine = {
                seasonNumber: 1,
                currentWeek: 5,
                manager: { name: 'Test', teamId: 1, money: 50000 },
                managerStats: { wins: 10, draws: 3, losses: 5 },
                getTeam: () => ({ id: 1, name: 'Cruzeiro', squad: [{ ovr: 75 }, { ovr: 80 }] }),
                chronicles: [],
                rivalryHistory: {},
                weekEvents: [],
                viewUnlockState: { titlesWon: 0 },
            };
            const snap = captureSnapshot(mockEngine);
            expect(snap.seasonNumber).toBe(1);
            expect(snap.wins).toBe(10);
            expect(snap.teamName).toBe('Cruzeiro');
            expect(snap.squadSize).toBe(2);
            expect(snap.avgOvr).toBe(78);
        });
    });

    describe('BatchRunner', () => {
        it('seedRange returns inclusive-exclusive range', () => {
            expect(seedRange(0, 5)).toEqual([0, 1, 2, 3, 4]);
        });

        it('randomSeeds returns count of seeds', () => {
            expect(randomSeeds(3).length).toBe(3);
        });

        it('runBatch runs 2 saves headless', async () => {
            const results = await runBatch({
                seeds: [1000, 1001],
                weeks: 3,
            });
            expect(results.length).toBe(2);
            expect(results[0].seed).toBe(1000);
            expect(results[0].snapshot).toBeDefined();
        }, 60000);
    });

    describe('DiffEngine', () => {
        it('aggregateStat handles empty', () => {
            expect(aggregateStat([], 'wins')).toEqual({ count: 0, avg: 0, median: 0, min: 0, max: 0, stddev: 0 });
        });

        it('aggregateStat computes avg/median/min/max', () => {
            const results = [
                { snapshot: { wins: 10 } },
                { snapshot: { wins: 20 } },
                { snapshot: { wins: 30 } },
            ];
            const r = aggregateStat(results, 'wins');
            expect(r.avg).toBe(20);
            expect(r.min).toBe(10);
            expect(r.max).toBe(30);
            expect(r.count).toBe(3);
        });

        it('diffBatches computes delta percent', () => {
            const a = [{ snapshot: { wins: 10 } }];
            const b = [{ snapshot: { wins: 15 } }];
            const d = diffBatches(a, b, ['wins']);
            expect(d.wins.deltaAvg).toBe(5);
            expect(d.wins.deltaPercent).toBe(50);
            expect(d.wins.significantDelta).toBe(true);
        });

        it('histogram groups values', () => {
            const results = [
                { snapshot: { wins: 5 } },
                { snapshot: { wins: 5 } },
                { snapshot: { wins: 10 } },
            ];
            const h = histogram(results, 'wins', 5);
            expect(h[5]).toBe(2);
            expect(h[10]).toBe(1);
        });

        it('extractCrashes filters crashed', () => {
            const results = [
                { seed: 1, crash: { message: 'oops' } },
                { seed: 2, snapshot: {} },
            ];
            expect(extractCrashes(results).length).toBe(1);
        });

        it('groupCrashesByStack agrupa por signature', () => {
            const crashes = [
                { seed: 1, crash: { stack: 'foo\nbar', message: 'x' } },
                { seed: 2, crash: { stack: 'foo\nbar', message: 'x' } },
                { seed: 3, crash: { stack: 'baz\nqux', message: 'y' } },
            ];
            const groups = groupCrashesByStack(crashes);
            expect(groups.length).toBe(2);
            expect(groups[0].count).toBe(2);
        });
    });

    describe('Exporter', () => {
        it('toCSV gera header + rows', () => {
            const r = [
                { seed: 1, weeksCompleted: 5, snapshot: { wins: 10, losses: 5 } },
            ];
            const csv = toCSV(r, ['wins', 'losses']);
            expect(csv).toMatch(/seed,weeksCompleted/);
            expect(csv).toContain('1,5,,10,5');
        });

        it('toJSON é string parseable', () => {
            const j = toJSON([{ seed: 1 }]);
            expect(JSON.parse(j).length).toBe(1);
        });

        it('timestampedFilename format', () => {
            const f = timestampedFilename('test_preset', 'csv');
            expect(f).toMatch(/^autoplay-test_preset-\d{8}-\d{4}\.csv$/);
        });
    });

    describe('Presets registry', () => {
        it('25+ presets registered', () => {
            expect(Object.keys(PRESETS).length).toBeGreaterThanOrEqual(25);
        });

        it('balance_winrate has analyze function', () => {
            expect(typeof PRESETS.balance_winrate.analyze).toBe('function');
        });

        it('every preset has id/label/description/category/defaultConfig', () => {
            Object.values(PRESETS).forEach(p => {
                expect(typeof p.id).toBe('string');
                expect(typeof p.label).toBe('string');
                expect(typeof p.description).toBe('string');
                expect(typeof p.category).toBe('string');
                expect(typeof p.defaultConfig).toBe('object');
            });
        });

        it('every preset analyze callable com empty array', () => {
            Object.values(PRESETS).forEach(p => {
                expect(() => p.analyze([], p)).not.toThrow();
            });
        });

        it('PRESET_CATEGORIES tem todos categorias usadas', () => {
            const used = new Set(Object.values(PRESETS).map(p => p.category));
            used.forEach(c => {
                expect(PRESET_CATEGORIES[c]).toBeDefined();
            });
        });
    });

});
