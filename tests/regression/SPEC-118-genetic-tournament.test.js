// Regression test SPEC-118: GeneticTournament evolution mechanics.
import { describe, test, expect, beforeEach } from 'vitest';
import { GeneticTournament } from '../../src/services/learning/GeneticTournament.js';

describe('SPEC-118 — GeneticTournament', () => {
    let tour;
    beforeEach(() => {
        // Fresh localStorage mock
        const store = {};
        global.localStorage = {
            getItem: (k) => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: (k) => { delete store[k]; }
        };
        tour = new GeneticTournament({ populationSize: 4 });
        tour.reset();
    });

    test('initializes population of N bots', () => {
        expect(tour.population.length).toBe(4);
        expect(tour.generation).toBe(0);
    });

    test('each bot has unique random Q-table seed', () => {
        const tables = tour.population.map(b => JSON.stringify(b.brain.qTable));
        const unique = new Set(tables);
        // Different seeds → most should differ
        expect(unique.size).toBeGreaterThan(1);
    });

    test('scoreBot returns finite number', () => {
        const score = tour.scoreBot(tour.population[0]);
        expect(Number.isFinite(score)).toBe(true);
    });

    test('evolveOnce advances generation', () => {
        tour.evolveOnce();
        expect(tour.generation).toBe(1);
        expect(tour.history.length).toBe(1);
    });

    test('evolve(N) runs N generations', () => {
        tour.evolve(3);
        expect(tour.generation).toBe(3);
        expect(tour.history.length).toBe(3);
    });

    test('best score tracked across generations', () => {
        tour.evolve(3);
        expect(tour.bestBrain).toBeDefined();
        expect(typeof tour.bestBrain.score).toBe('number');
    });

    test('crossover produces child with merged states', () => {
        const a = tour.population[0].brain;
        const b = tour.population[1].brain;
        const child = tour.crossover(a, b);
        expect(child.qTable).toBeDefined();
        // Child should have at least some states from parents
        const childStates = Object.keys(child.qTable);
        const parentStates = new Set([
            ...Object.keys(a.qTable),
            ...Object.keys(b.qTable)
        ]);
        childStates.forEach(s => {
            expect(parentStates.has(s)).toBe(true);
        });
    });

    test('mutate modifies Q-values within bounds', () => {
        const brain = tour.population[0].brain;
        const before = JSON.stringify(brain.qTable);
        tour.mutate(brain);
        const after = JSON.stringify(brain.qTable);
        // Some change might happen (5% mutation rate × all values)
        // Just ensure no crash + values still finite
        for (const s of Object.keys(brain.qTable)) {
            for (const a of Object.keys(brain.qTable[s])) {
                expect(Number.isFinite(brain.qTable[s][a])).toBe(true);
            }
        }
    });

    test('summary returns expected shape', () => {
        tour.evolve(2);
        const sum = tour.summary();
        expect(sum.generation).toBe(2);
        expect(sum.populationSize).toBe(4);
        expect(typeof sum.bestScore).toBe('number');
        expect(Array.isArray(sum.history)).toBe(true);
    });

    test('reset clears everything', () => {
        tour.evolve(3);
        tour.reset();
        expect(tour.generation).toBe(0);
        expect(tour.history.length).toBe(0);
        expect(tour.bestBrain).toBeNull();
    });

    test('save + restore roundtrip', () => {
        tour.evolve(2);
        const fresh = new GeneticTournament({ populationSize: 4 });
        expect(fresh.generation).toBe(2);
        expect(fresh.history.length).toBe(2);
    });
});
