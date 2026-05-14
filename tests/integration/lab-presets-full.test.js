/**
 * Lab Presets Full — Roda TODOS os 46 presets do AutoPlayLab headless
 * 
 * Cada preset roda com saves reduzidos (5) e weeks curtos (10) pra validar
 * que a pipeline snapshot→analyze funciona sem crash pra todos.
 * Resultados completos de cada preset são logados no console.
 * 
 * Executar: SOAK=1 npx vitest run tests/integration/lab-presets-full.test.js --testTimeout=300000
 */

import { describe, it, expect } from 'vitest';
import { runBatch, seedRange } from '../../src/services/AutoPlayLab/BatchRunner.js';
import { PRESETS, PRESET_CATEGORIES } from '../../src/services/AutoPlayLab/presets.js';

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

const PRESET_IDS = Object.keys(PRESETS);
const FAST_SAVES = 5;
const FAST_WEEKS = 10;

// Acumula resultados pra dump final
const allResults = {};

describe('🧪 Lab Presets Full — All 46 Presets Headless', () => {

    it(`registry has ${PRESET_IDS.length} presets`, () => {
        console.log(`\n${'═'.repeat(70)}`);
        console.log(`🧪 LAB PRESETS FULL — ${PRESET_IDS.length} presets × ${FAST_SAVES} saves × ${FAST_WEEKS} weeks`);
        console.log(`${'═'.repeat(70)}`);
        expect(PRESET_IDS.length).toBeGreaterThanOrEqual(40);
    });

    it('all categories mapped', () => {
        const used = new Set(Object.values(PRESETS).map(p => p.category));
        const categories = [...used];
        console.log(`  Categories: ${categories.map(c => `${c} (${PRESET_CATEGORIES[c]})`).join(', ')}`);
        used.forEach(c => expect(PRESET_CATEGORIES[c]).toBeDefined());
    });

    // Roda cada preset individualmente
    for (const presetId of PRESET_IDS) {
        const preset = PRESETS[presetId];

        it(`preset: ${preset.label} [${preset.category}] (${presetId})`, async () => {
            const seeds = seedRange(
                preset.defaultConfig.seedStart,
                preset.defaultConfig.seedStart + FAST_SAVES
            );

            // 1. Roda batch headless
            const t0 = performance.now();
            const results = await runBatch({
                seeds,
                weeks: FAST_WEEKS,
            });
            const elapsed = performance.now() - t0;

            expect(results).toBeDefined();
            expect(results.length).toBe(FAST_SAVES);

            // 2. Conta crashes
            const crashes = results.filter(r => r.crash);
            const okSaves = results.filter(r => !r.crash);

            // 3. Roda analyze sem throw
            let analysis;
            expect(() => {
                analysis = preset.analyze(results, preset);
            }).not.toThrow();

            expect(analysis).toBeDefined();
            expect(typeof analysis).toBe('object');

            // 4. Log resultado completo
            console.log(`\n  ┌─ ${preset.label} (${presetId}) ─────────────────────`);
            console.log(`  │ Category: ${preset.category} | ${preset.description}`);
            console.log(`  │ Saves: ${FAST_SAVES} OK: ${okSaves.length} Crashes: ${crashes.length} | ${elapsed.toFixed(0)}ms`);
            console.log(`  │`);
            console.log(`  │ 📊 Analysis:`);
            
            // Dump cada campo da análise
            for (const [key, value] of Object.entries(analysis)) {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Objeto stats (avg/min/max/etc)
                    const parts = Object.entries(value)
                        .map(([k, v]) => `${k}=${typeof v === 'number' ? v.toFixed?.(2) ?? v : v}`)
                        .join(' ');
                    console.log(`  │   ${key}: { ${parts} }`);
                } else if (Array.isArray(value)) {
                    console.log(`  │   ${key}: [${value.length} items]${value.length <= 5 ? ' ' + JSON.stringify(value) : ''}`);
                } else {
                    console.log(`  │   ${key}: ${value}`);
                }
            }
            console.log(`  └${'─'.repeat(50)}`);

            // Crash details
            if (crashes.length > 0) {
                console.warn(`  ⚠️  Crashes:`);
                crashes.forEach(c => console.warn(`    seed=${c.seed}: ${c.crash?.message}`));
            }

            // 5. Salva pra dump final
            allResults[presetId] = {
                label: preset.label,
                category: preset.category,
                saves: FAST_SAVES,
                ok: okSaves.length,
                crashes: crashes.length,
                elapsedMs: Math.round(elapsed),
                analysis,
            };
        }, 30000); // 30s por preset
    }

    // Dump final consolidado
    it('📋 DUMP FINAL — Todos os resultados consolidados', () => {
        const presetCount = Object.keys(allResults).length;
        const totalCrashes = Object.values(allResults).reduce((s, r) => s + r.crashes, 0);
        const totalMs = Object.values(allResults).reduce((s, r) => s + r.elapsedMs, 0);

        console.log(`\n${'═'.repeat(70)}`);
        console.log(`📋 CONSOLIDADO — ${presetCount} presets executados`);
        console.log(`   Total time: ${(totalMs / 1000).toFixed(1)}s | Total crashes: ${totalCrashes}`);
        console.log(`${'═'.repeat(70)}`);

        // Tabela por categoria
        const byCategory = {};
        for (const [id, r] of Object.entries(allResults)) {
            if (!byCategory[r.category]) byCategory[r.category] = [];
            byCategory[r.category].push({ id, ...r });
        }

        for (const [cat, items] of Object.entries(byCategory).sort()) {
            const catLabel = PRESET_CATEGORIES[cat] || cat;
            const catCrashes = items.reduce((s, i) => s + i.crashes, 0);
            const status = catCrashes === 0 ? '✅' : '⚠️';
            console.log(`\n  ${status} ${catLabel} (${items.length} presets, ${catCrashes} crashes)`);
            for (const item of items) {
                const mark = item.crashes === 0 ? '✓' : '✗';
                console.log(`    ${mark} ${item.label}: ${item.ok}/${item.saves} OK, ${item.elapsedMs}ms`);
            }
        }

        console.log(`\n${'═'.repeat(70)}`);

        // Dump JSON completo
        console.log(`\n📊 FULL JSON RESULTS:`);
        console.log(JSON.stringify(allResults, null, 2));
        console.log(`\n${'═'.repeat(70)}`);

        expect(presetCount).toBeGreaterThanOrEqual(40);
    });
});
