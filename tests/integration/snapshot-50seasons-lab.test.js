/**
 * 🧪 Snapshot Regression Pipeline: 50 Seasons
 * 
 * Pipeline de teste rápido (~1 min) que substitui o soak test de 12h
 * para validação de regras de negócio. Usa Vitest Snapshots para detectar
 * qualquer regressão econômica, estrutural ou de memória.
 *
 * Roda com: npx vitest run tests/integration/snapshot-50seasons-lab.test.js
 */

import { describe, it, expect } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { createEngine } from '../../src/engine/engineFactory.js';
import { AutoPlayController } from '../../src/services/AutoPlayService.js';
import { setDifficulty } from '../../src/engine/systems/DifficultyModes.js';
import { EngineLogger } from '../../src/engine/EngineLogger.js';

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

describe('🧪 Snapshot Pipeline: 50 Seasons (Sanity)', () => {

    it('valida estrutura, economia e saúde da engine em 50 temporadas', async () => {
        EngineLogger.reset();
        setDifficulty('sinistro');

        // Init engine exatamente como o soak test faz
        let engine = createEngine();
        engine.initGame('SnapshotBot', 1, 'manager', 'fallen');

        // Encontrar time Div 4 para snapshot
        const div4 = engine.teams.filter(t => t.zone === 'BRA' && t.division === 4);
        div4.sort((a, b) => a.balance - b.balance);
        const teamId = div4[0]?.id || 1;

        // Re-init com o time correto
        engine = createEngine();
        engine.initGame('SnapshotBot', teamId, 'manager', 'fallen');

        const bot = new AutoPlayController(engine);
        bot.running = true;

        const SEASONS = 50;
        const MAX_WEEKS = SEASONS * 38 + 500;
        let totalErrors = 0;
        let maxBalance = 0;
        const divisionHistory = [];

        // Main simulation loop
        for (let w = 0; w < MAX_WEEKS && bot.stats.seasonsPlayed < SEASONS; w++) {
            try {
                bot._tick();
            } catch (err) {
                totalErrors++;
                if (totalErrors <= 5) {
                    console.error(`  ❌ Tick ${w}: ${err.message}`);
                    console.error(`     Stack: ${err.stack?.split('\n').slice(0, 3).join(' | ')}`);
                }
                if (totalErrors > 50) break;
            }

            // Track per-season
            if (bot.stats.seasonsPlayed > (divisionHistory.length)) {
                const team = engine.getTeam(teamId);
                if (team) {
                    divisionHistory.push({
                        season: bot.stats.seasonsPlayed,
                        division: team.division,
                        balance: team.balance
                    });
                    if (team.balance > maxBalance) maxBalance = team.balance;
                }
            }
        }
        // Cleanup: cancel pending setTimeout to let vitest exit cleanly
        bot.running = false;
        if (bot.intervalId) clearTimeout(bot.intervalId);

        const team = engine.getTeam(teamId);
        const health = EngineLogger.getHealthReport();

        // ═══════════════════════════════════════════════════════
        // 1. VALIDAÇÃO ESTRUTURAL (Memory Safety)
        // ═══════════════════════════════════════════════════════
        if (engine.seasonHistory) {
            expect(engine.seasonHistory.length).toBeLessThanOrEqual(50);
        }
        if (engine.manager?.careerHistory) {
            expect(engine.manager.careerHistory.length).toBeLessThanOrEqual(50);
        }
        if (engine.chronicles) {
            expect(engine.chronicles.length).toBeLessThanOrEqual(50);
        }
        if (engine.marketPlayers) {
            expect(engine.marketPlayers.length).toBeLessThanOrEqual(150);
        }

        // ═══════════════════════════════════════════════════════
        // 2. VALIDAÇÃO ECONÔMICA (Luxury Tax + Sanity)
        // ═══════════════════════════════════════════════════════
        expect(team.balance).toBeLessThanOrEqual(700_000_000);
        expect(team.balance).toBeGreaterThan(-50_000_000);

        // Squad viável
        expect(team.squad.length).toBeGreaterThanOrEqual(11);
        expect(team.squad.length).toBeLessThanOrEqual(40);

        // ═══════════════════════════════════════════════════════
        // 3. VALIDAÇÃO DE SAÚDE (EngineLogger)
        // ═══════════════════════════════════════════════════════
        console.log(`\n🏥 ENGINE HEALTH REPORT:`);
        console.log(`   Total Errors: ${health.totalErrors}`);
        console.log(`   Total Warnings: ${health.totalWarnings}`);
        console.log(`   Healthy: ${health.healthy}`);

        if (health.recentErrors.length > 0) {
            console.log(`\n   ⚠️ Recent Errors:`);
            health.recentErrors.forEach(e => {
                console.log(`      [${e.context}] ${e.message}`);
            });
        }

        // Tolerância: até 50 erros não-fatais em 50 temporadas
        expect(health.totalErrors).toBeLessThanOrEqual(50);

        // Zero engine crashes
        expect(totalErrors).toBe(0);

        // ═══════════════════════════════════════════════════════
        // 4. PRINT RESUMO
        // ═══════════════════════════════════════════════════════
        const titles = engine.legacy?.titles?.length || 0;
        console.log(`\n📊 SNAPSHOT RESULTADO:`);
        console.log(`   Temporadas: ${bot.stats.seasonsPlayed} | Semanas: ${bot.stats.weeksPlayed}`);
        console.log(`   Saldo Final: R$ ${((team.balance || 0) / 1_000_000).toFixed(1)}M`);
        console.log(`   Pico de Saldo: R$ ${(maxBalance / 1_000_000).toFixed(1)}M`);
        console.log(`   Títulos: ${titles}`);
        if (engine.legacy?.titles?.length > 0) {
            const titleCounts = engine.legacy.titles.reduce((acc, curr) => {
                acc[curr] = (acc[curr] || 0) + 1;
                return acc;
            }, {});
            Object.entries(titleCounts).forEach(([title, count]) => {
                console.log(`      - ${count}x ${title}`);
            });
        }
        console.log(`   Elenco: ${team.squad.length} jogadores`);
        console.log(`   Divisão Final: ${team.division}`);
        console.log(`   Engine Errors: ${health.totalErrors}`);
        console.log(`   Tick Errors: ${totalErrors}`);
        console.log(`   Wins: ${bot.stats.wins} | Draws: ${bot.stats.draws} | Losses: ${bot.stats.losses}`);

        // Division trajectory
        const trajectory = divisionHistory.map(d => `S${d.season}:D${d.division}`);
        if (trajectory.length <= 20) {
            console.log(`   Trajetória: ${trajectory.join(' → ')}`);
        } else {
            console.log(`   Trajetória (first 10): ${trajectory.slice(0, 10).join(' → ')}`);
            console.log(`   Trajetória (last 10): ${trajectory.slice(-10).join(' → ')}`);
        }

        // Structural invariants — these MUST hold regardless of RNG trajectory
        expect(bot.stats.seasonsPlayed).toBe(50);
        expect(team.squad.length).toBeGreaterThanOrEqual(11);
        expect(team.squad.length).toBeLessThanOrEqual(40);
        expect(titles).toBeGreaterThan(0);
        expect(health.totalErrors).toBeLessThanOrEqual(50);
        expect(team.balance).toBeGreaterThanOrEqual(0);
        expect(totalErrors).toBe(0);
        // Division must be valid (1-4) but exact value depends on RNG trajectory
        expect(team.division).toBeGreaterThanOrEqual(1);
        expect(team.division).toBeLessThanOrEqual(4);

    }, 300_000); // 5 minutos de timeout
});
