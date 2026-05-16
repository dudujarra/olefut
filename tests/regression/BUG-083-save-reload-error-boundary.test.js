/**
 * Regression test for BUG-083 — save→reload error boundary in DashboardView.
 *
 * Repro (discovered durante B2.4 E2E / SPEC-164):
 *   1. Start career via UI
 *   2. Click 💾 (save header)
 *   3. Reload page (F5)
 *   4. DashboardView crashes with "An error occurred in component"
 *
 * Root cause:
 *   `engine.llmNarrative` (instance of LLMNarrativeService, added in SPEC-167)
 *   was NOT in `ENGINE_CLASS_FIELDS` of GameContext.jsx. Therefore, save
 *   serializes it as a plain object (`{}` after JSON round-trip) and restore
 *   overwrites the live instance, losing all methods (managerAdvice, etc).
 *   First consumer (DashboardView.handleAuxiliarAdvice or WeekProcessor
 *   post-match hook) tries `engine.llmNarrative.managerAdvice(...)` → TypeError.
 *
 *   Same class-instance-loss affected other top-level services not listed in
 *   ENGINE_CLASS_FIELDS:
 *     _npcWeekProcessor, _transferService, _scoutingService, _loanService,
 *     _facilityService, _formationService, _pressService, _sectorService,
 *     _gameInitializer.
 *   These get exercised on next advanceWeek / view interaction.
 *
 * Fix:
 *   - Add `llmNarrative` + all `_*Service`/`_*Processor`/`_gameInitializer`
 *     to `ENGINE_CLASS_FIELDS` so they are skipped at save time AND restore
 *     time (constructor recreates fresh instances).
 *
 * Akita Mandamento #6 — this test pairs with the fix; it must fail without the
 * fix and pass with it.
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { createEngine } from '../../src/engine/engineFactory.js';
import { LLMNarrativeService } from '../../src/services/LLMNarrativeService.js';
import { MatchSimulator } from '../../src/services/MatchSimulator.js';
import { WeekProcessor } from '../../src/services/WeekProcessor.js';

// Re-implement the save/restore round-trip in isolation so we don't need React.
// Mirrors src/context/GameContext.jsx logic. If the lists drift, this test
// catches it.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ctxFile = path.resolve(__dirname, '../../src/context/GameContext.jsx');

function extractEngineClassFields() {
    const src = fs.readFileSync(ctxFile, 'utf-8');
    const match = src.match(/const ENGINE_CLASS_FIELDS = \[([\s\S]*?)\];/);
    if (!match) throw new Error('ENGINE_CLASS_FIELDS not found in GameContext.jsx');
    return match[1]
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(s => s.length > 0 && !s.startsWith('//') && !s.startsWith('/*'));
}

function simulateSaveRestoreRoundtrip(engine) {
    const classFields = extractEngineClassFields();
    const safe = {};
    for (const key of Object.keys(engine)) {
        if (classFields.includes(key)) continue;
        try {
            const v = engine[key];
            if (typeof v === 'function') continue;
            if (v instanceof Map || v instanceof Set) continue;
            JSON.stringify(v);
            safe[key] = v;
        } catch { /* skip */ }
    }
    // Round-trip through JSON like real localStorage save.
    const serialized = JSON.parse(JSON.stringify(safe));
    const fresh = createEngine();
    for (const [key, val] of Object.entries(serialized)) {
        if (classFields.includes(key)) continue;
        try { fresh[key] = val; } catch { /* skip */ }
    }
    return fresh;
}

describe('BUG-083: save→reload preserves class instances on Engine', () => {
    let engine;

    beforeEach(() => {
        engine = createEngine();
        // initGame would create a real save scenario, but mere instantiation
        // is enough to expose the class-instance-loss bug.
        engine.teams = [];
        engine.tournaments = [];
    });

    test('ENGINE_CLASS_FIELDS includes llmNarrative (SPEC-167 service)', () => {
        const classFields = extractEngineClassFields();
        expect(classFields).toContain('llmNarrative');
    });

    test('ENGINE_CLASS_FIELDS covers every class instance on Engine', () => {
        const classFields = extractEngineClassFields();
        const e = createEngine();
        const missing = [];
        for (const key of Object.keys(e)) {
            const v = e[key];
            // Filter to actual class instances (skip primitives, plain objects,
            // arrays, null). A class instance has a prototype !== Object.prototype.
            if (v === null || typeof v !== 'object') continue;
            if (Array.isArray(v)) continue;
            const proto = Object.getPrototypeOf(v);
            if (!proto || proto === Object.prototype) continue;
            // Found a class instance — must be in the skip-list, otherwise
            // save→restore will replace it with a plain object and lose methods.
            if (!classFields.includes(key)) missing.push(key);
        }
        expect(missing, `class-instance fields missing from ENGINE_CLASS_FIELDS: ${missing.join(', ')}`).toEqual([]);
    });

    test('after save→restore, engine.llmNarrative remains an instance of LLMNarrativeService', () => {
        const restored = simulateSaveRestoreRoundtrip(engine);
        expect(restored.llmNarrative).toBeInstanceOf(LLMNarrativeService);
        expect(typeof restored.llmNarrative.managerAdviceSync).toBe('function');
        expect(typeof restored.llmNarrative.postMatchAnalysis).toBe('function');
    });

    test('after save→restore, llmNarrative.managerAdviceSync still callable (DashboardView path)', () => {
        const restored = simulateSaveRestoreRoundtrip(engine);
        // This is precisely the call DashboardView.handleAuxiliarAdvice makes
        // (sync template variant). Before fix this throws TypeError.
        expect(() => {
            restored.llmNarrative.managerAdviceSync({
                ownTeam: { name: 'Test', avgOvr: 50, formation: '4-4-2', currentTactic: 'normal' },
                opponent: { name: 'Opp', avgOvr: 50, recentForm: [] },
                position: 5,
                totalTeams: 20,
            });
        }).not.toThrow();
    });

    test('after save→restore, _matchSimulator stays a MatchSimulator (already in skip-list — regression sentinel)', () => {
        const restored = simulateSaveRestoreRoundtrip(engine);
        expect(restored._matchSimulator).toBeInstanceOf(MatchSimulator);
    });

    test('after save→restore, _weekProcessor stays a WeekProcessor (already in skip-list — regression sentinel)', () => {
        const restored = simulateSaveRestoreRoundtrip(engine);
        expect(restored._weekProcessor).toBeInstanceOf(WeekProcessor);
    });
});
