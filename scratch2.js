import { describe, it, expect, beforeAll } from 'vitest';
import { Engine } from './src/engine/engine.js';
import { AutoPlayController } from './src/services/AutoPlayService.js';

if (typeof globalThis.localStorage === 'undefined') {
    const store = {};
    globalThis.localStorage = {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = v; },
        removeItem: (k) => { delete store[k]; },
        clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    };
}

const engine = new Engine();
engine.initGame('IguatuBot', 1, 'manager', 'fallen');
const bot = new AutoPlayController(engine);
bot.running = true;
console.log("Before loop: weeksPlayed=", bot.stats.weeksPlayed, " running=", bot.running);
bot._tick();
console.log("After 1 tick: weeksPlayed=", bot.stats.weeksPlayed, " errors=", bot.stats.errorCount);
