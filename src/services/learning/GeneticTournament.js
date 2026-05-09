/**
 * GeneticTournament — SPEC-118
 *
 * Multi-bot evolutionary brain optimization.
 * Runs N=4 bots with different Q-tables, each plays K seasons.
 * Top 2 cross-breed → 4 new generation. Best Q-table emerges.
 *
 * SCAFFOLD VERSION: brains evolve independently, no parallel engine simulation
 * (would require Web Worker). Cross-breed simulates by sampling Q-values.
 *
 * Usage:
 *   const tour = new GeneticTournament({ populationSize: 4 });
 *   tour.evolve(generations: 5, seasonsPerBot: 1);
 *   const champion = tour.bestBrain;
 */

import { AdaptiveBrain } from './AdaptiveBrain.js';

const STORAGE_KEY = 'elifoot_genetic_state';
const DEFAULT_POPULATION = 4;
const MUTATION_RATE = 0.05;
const ELITE_KEEP = 1; // top survivor preserved each generation

export class GeneticTournament {
    constructor({ populationSize = DEFAULT_POPULATION } = {}) {
        this.populationSize = populationSize;
        this.population = [];
        this.generation = 0;
        this.history = []; // [{generation, scores: [], bestScore}]
        this.bestBrain = null;
        this._initPopulation();
        this._restore();
    }

    _initPopulation() {
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            const brain = new AdaptiveBrain();
            // Seed with random Q-values per bot to differentiate
            brain.qTable = this._randomQSeed();
            this.population.push({ id: i, brain, score: 0 });
        }
    }

    _randomQSeed() {
        const seed = {};
        const states = ['avg|top4|mid|early|-', 'avg|mid|mid|mid|W', 'poor|bottom|low|late|L'];
        const actions = ['TACTIC_normal', 'TACTIC_attacking', 'TACTIC_defensive', 'TACTIC_counter'];
        states.forEach(s => {
            seed[s] = {};
            actions.forEach(a => {
                seed[s][a] = (Math.random() - 0.5) * 10; // [-5, 5]
            });
        });
        return seed;
    }

    /**
     * Score a bot brain. Heuristic stand-in for real engine simulation.
     * In production, would run engine.advanceWeek loop seasonsPerBot times.
     */
    scoreBot(bot, seasonsPerBot = 1) {
        // Heuristic: sum of Q-values weighted by visit count = "experience score"
        let score = 0;
        for (const stateKey of Object.keys(bot.brain.qTable)) {
            const visits = bot.brain.visitCount[stateKey] || 1;
            for (const actionKey of Object.keys(bot.brain.qTable[stateKey])) {
                score += bot.brain.qTable[stateKey][actionKey] * Math.log(1 + visits);
            }
        }
        // Add noise so duplicate Q-tables don't tie deterministically
        score += (Math.random() - 0.5) * seasonsPerBot;
        return score;
    }

    /**
     * Crossover: child brain inherits Q-values randomly from two parents.
     */
    crossover(parentA, parentB) {
        const child = new AdaptiveBrain();
        child.qTable = {};
        const allStates = new Set([
            ...Object.keys(parentA.qTable),
            ...Object.keys(parentB.qTable)
        ]);
        for (const stateKey of allStates) {
            const fromA = parentA.qTable[stateKey];
            const fromB = parentB.qTable[stateKey];
            const source = Math.random() < 0.5 ? (fromA || fromB) : (fromB || fromA);
            if (source) {
                child.qTable[stateKey] = { ...source };
            }
        }
        return child;
    }

    /**
     * Mutation: add small noise to random Q-values.
     */
    mutate(brain) {
        for (const stateKey of Object.keys(brain.qTable)) {
            for (const actionKey of Object.keys(brain.qTable[stateKey])) {
                if (Math.random() < MUTATION_RATE) {
                    const noise = (Math.random() - 0.5) * 2;
                    brain.qTable[stateKey][actionKey] += noise;
                }
            }
        }
    }

    /**
     * Run one evolution cycle: score all, select top, breed, mutate.
     */
    evolveOnce(seasonsPerBot = 1) {
        // Score all bots
        this.population.forEach(bot => {
            bot.score = this.scoreBot(bot, seasonsPerBot);
        });
        // Sort descending by score
        this.population.sort((a, b) => b.score - a.score);

        // Track best
        const best = this.population[0];
        if (!this.bestBrain || best.score > (this.bestBrain.score || -Infinity)) {
            this.bestBrain = { score: best.score, qTable: JSON.parse(JSON.stringify(best.brain.qTable)) };
        }

        // History
        this.history.push({
            generation: this.generation,
            scores: this.population.map(b => b.score),
            bestScore: best.score
        });

        // Build new generation
        const newPop = [];
        // Elite preserved
        for (let i = 0; i < ELITE_KEEP; i++) {
            newPop.push({ id: i, brain: this.population[i].brain, score: 0 });
        }
        // Rest = crossover top 2 + mutation
        const parentA = this.population[0].brain;
        const parentB = this.population[1].brain;
        while (newPop.length < this.populationSize) {
            const child = this.crossover(parentA, parentB);
            this.mutate(child);
            newPop.push({ id: newPop.length, brain: child, score: 0 });
        }
        this.population = newPop;
        this.generation++;
        this._save();
    }

    /**
     * Multiple generations.
     */
    evolve(generations = 5, seasonsPerBot = 1) {
        for (let g = 0; g < generations; g++) {
            this.evolveOnce(seasonsPerBot);
        }
    }

    summary() {
        return {
            generation: this.generation,
            populationSize: this.populationSize,
            bestScore: this.bestBrain?.score ?? null,
            history: this.history.slice(-10)
        };
    }

    _save() {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                generation: this.generation,
                history: this.history,
                bestBrain: this.bestBrain
            }));
        } catch { /* ignore */ }
    }

    _restore() {
        try {
            if (typeof localStorage === 'undefined') return;
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            this.generation = parsed.generation || 0;
            this.history = parsed.history || [];
            this.bestBrain = parsed.bestBrain || null;
        } catch { /* ignore */ }
    }

    reset() {
        this.generation = 0;
        this.history = [];
        this.bestBrain = null;
        this._initPopulation();
        try {
            if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
        } catch { /* ignore */ }
    }
}
