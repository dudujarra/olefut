import { createEngine } from './src/engine/engineFactory.js';
import { EngineLogger } from './src/engine/EngineLogger.js';

const e = createEngine();
e.initGame('TestManager', 1, 'manager', 'livre');
for (let i = 0; i < 39; i++) {
    try { e.advanceWeek(); } catch { /* defensive */ }
}
console.log('Chronicles length:', e.chronicles.length);
if (e.chronicles.length === 0) {
    console.log('EngineLogger captured:', EngineLogger.getLogs ? EngineLogger.getLogs() : 'no getLogs method');
}
