/**
 * BatchRunner — AutoPlayLab F1
 *
 * Roda N saves headless com seeds determinísticos. Captura snapshots
 * + crashes. Callback de progress pra UI.
 */

import { Engine } from '../../engine/engine.js';
import { setGlobalSeed } from '../../engine/rng.js';
import { captureSnapshot, trackStreaks } from './SnapshotAPI.js';

/**
 * Roda batch de saves.
 *
 * @param {object} opts
 * @param {number[]} opts.seeds — lista de seeds
 * @param {number} [opts.weeks=38] — semanas por save
 * @param {string} [opts.teamId=1]
 * @param {string} [opts.mode='manager']
 * @param {string} [opts.scenario='livre']
 * @param {Function} [opts.beforeRun] — opcional, chamado com engine antes do loop
 * @param {Function} [opts.afterWeek] — opcional, chamado a cada week com (engine, week)
 * @param {Function} [opts.onProgress] — callback (currentIndex/total)
 * @returns {Promise<Array>}
 */
export async function runBatch({
    seeds = [],
    weeks = 38,
    teamId = 1,
    mode = 'manager',
    scenario = 'livre',
    beforeRun,
    afterWeek,
    onProgress,
} = {}) {
    const results = [];
    for (let i = 0; i < seeds.length; i++) {
        const seed = seeds[i];
        const result = { seed, crash: null, snapshot: null, weeksCompleted: 0, streakHistory: [] };
        try {
            setGlobalSeed(seed);
            const engine = new Engine();
            engine.initGame(`AutoPlay${seed}`, teamId, mode, scenario);
            if (typeof beforeRun === 'function') beforeRun(engine);

            for (let w = 0; w < weeks; w++) {
                try {
                    engine.weekEvents = [];
                    if (mode === 'manager') engine.doTraining('fitness');
                    engine.advanceWeek();
                    result.weeksCompleted++;
                    if (typeof afterWeek === 'function') afterWeek(engine, w);
                    // Snapshot streak per week (cheap)
                    if (w % 5 === 0) {
                        result.streakHistory.push({ week: w, ...trackStreaks(engine) });
                    }
                } catch (we) {
                    result.crash = { week: w, message: we.message, stack: we.stack?.split('\n').slice(0, 3).join('\n') };
                    break;
                }
            }
            result.snapshot = captureSnapshot(engine);
        } catch (e) {
            result.crash = { week: -1, message: e.message, stack: e.stack?.split('\n').slice(0, 3).join('\n') };
        }
        results.push(result);
        if (typeof onProgress === 'function') {
            onProgress(i + 1, seeds.length);
        }
        // Yield control para UI
        if (typeof setTimeout !== 'undefined' && i % 5 === 4) {
            await new Promise(r => setTimeout(r, 0));
        }
    }
    return results;
}

/**
 * Helper: gera range de seeds.
 */
export function seedRange(start, end) {
    const out = [];
    for (let i = start; i < end; i++) out.push(i);
    return out;
}

/**
 * Helper: random seeds (não determinístico, mas captura para repro).
 */
export function randomSeeds(count, base = 100000) {
    const out = [];
    for (let i = 0; i < count; i++) {
        out.push(base + Math.floor(Math.random() * 999999));
    }
    return out;
}
