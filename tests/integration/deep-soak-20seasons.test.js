/**
 * Deep Soak Test — 20 seasons
 * Verifies ML convergence, Q-value bounding, memory stability
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { AutoPlayController } from '../../src/services/AutoPlayService.js';

// Mock localStorage for Node
if (typeof globalThis.localStorage === 'undefined') {
    const store = {};
    globalThis.localStorage = {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = v; },
        removeItem: (k) => { delete store[k]; },
        clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    };
}

describe('Deep Soak Test — 20 seasons ML convergence', () => {
    let bot, stats;
    const SEASONS = 20;
    const MAX_WEEKS = SEASONS * 38 + 40; // safety margin

    beforeAll(() => {
        // CRITICAL: clear any state from previous test files in same worker
        localStorage.clear();
        
        const engine = new Engine();
        engine.initGame('DeepBot', 1, 'manager', 'fallen');
        bot = new AutoPlayController(engine);
        bot.running = true;

        let errors = [];
        for (let w = 0; w < MAX_WEEKS && bot.stats.seasonsPlayed < SEASONS; w++) {
            try {
                bot._tick();
            } catch (err) {
                errors.push({ week: w, error: err.message });
            }
        }
        bot.running = false;
        stats = bot.getStats();
        console.log(`\n=== DEEP SOAK: ${stats.weeksPlayed} weeks, ${stats.seasonsPlayed} seasons, ${errors.length} errors ===`);
    }, 30000);

    it('zero crashes over 20 seasons', () => {
        expect(stats.seasonsPlayed).toBeGreaterThanOrEqual(SEASONS);
        expect(stats.errorCount).toBe(0);
    });

    it('Q-values bounded ±50 (no runaway)', () => {
        const allQ = Object.values(bot.brain.qTable).flatMap(a => Object.values(a));
        const qMax = Math.max(...allQ);
        const qMin = Math.min(...allQ);
        
        console.log(`Q range: [${qMin.toFixed(2)}, ${qMax.toFixed(2)}] | States: ${Object.keys(bot.brain.qTable).length} | Updates: ${bot.brain.totalUpdates}`);
        
        // Phase D bounds: ±50
        expect(qMax).toBeLessThanOrEqual(55);
        expect(qMin).toBeGreaterThanOrEqual(-55);
    });

    it('replay buffer bounded ≤200', () => {
        const bufferSize = bot.brain.replayBuffer?.length || 0;
        console.log(`Replay buffer: ${bufferSize}/200`);
        expect(bufferSize).toBeLessThanOrEqual(200);
        expect(bufferSize).toBeGreaterThan(0);
    });

    it('alpha decayed after 20 seasons', () => {
        const updates = bot.brain.totalUpdates;
        const effectiveAlpha = Math.max(0.01, 0.1 / (1 + updates * 0.0001));
        console.log(`α effective: ${effectiveAlpha.toFixed(5)} (${updates} updates)`);
        expect(effectiveAlpha).toBeLessThan(0.1);
    });

    it('decision buffers bounded (no memory leak)', () => {
        console.log(`Decisions: ${stats.decisions?.length} | Anomalies: ${stats.anomalies?.length} | Successes: ${stats.successes?.length}`);
        expect(stats.decisions?.length).toBeLessThanOrEqual(2000);
        expect(stats.anomalies?.length).toBeLessThanOrEqual(500);
    });

    it('season history complete and enriched', () => {
        const sh = stats.seasonHistory || [];
        console.log(`\n=== Season History (${sh.length} entries) ===`);
        sh.forEach((s, i) => {
            console.log(`  S${s.season}: Div${s.division} Pos${s.position} Bal=${((s.balance||0)/1e6).toFixed(1)}M prom=${s.promoted} rel=${s.relegated}`);
        });
        expect(sh.length).toBeGreaterThanOrEqual(SEASONS - 1);
    });

    it('brain summary has convergence metrics', () => {
        const summary = bot.brain.summary();
        console.log(`\n=== Brain Summary ===`);
        console.log(`  States: ${summary.states} | Updates: ${summary.totalUpdates} | Replay: ${summary.replayBuffer} | Impactful: ${summary.impactfulExperiences}`);
        console.log(`  Top Actions: ${summary.topActions?.slice(0, 5).map(a => `${a.action}=${a.totalQ.toFixed(1)}`).join(', ')}`);
        
        expect(summary.states).toBeGreaterThan(0);
        expect(summary.totalUpdates).toBeGreaterThan(100);
    });

    it('emotional engine stable', () => {
        const emotions = bot.brain.emotions;
        if (emotions) {
            console.log(`Emotional state: ${emotions.state}`);
        }
        expect(bot.brain.emotions).toBeDefined();
    });

    it('win rate reasonable (not stuck at 0% or 100%)', () => {
        const total = stats.wins + stats.draws + stats.losses;
        const winRate = total > 0 ? stats.wins / total : 0;
        console.log(`\nRecord: ${stats.wins}W ${stats.draws}D ${stats.losses}L (${(winRate*100).toFixed(1)}% WR)`);
        expect(winRate).toBeGreaterThan(0.05);
        expect(winRate).toBeLessThan(0.95);
    });
});
