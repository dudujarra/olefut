#!/usr/bin/env node
/**
 * SPEC-141: Fine-tuning dataset extractor
 *
 * Processa arquivos de telemetria + autoplay do deep soak e extrai
 * tuplas (estado → ação → reward) para fine-tuning supervisionado.
 *
 * Usage:
 *   node scripts/extract-finetune-dataset.js [dir]
 *   node scripts/extract-finetune-dataset.js docs/playtest/20250610/07
 *
 * Output: docs/dataset-finetune.jsonl
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ações que são ruído — não são decisões reais do agente
const IGNORED_ACTIONS = new Set([
    'NARRATIVE_EVENT',
    'PRESS_CONFERENCE_SKIP',
    'PRESS_CONFERENCE',
]);

// Janela de semanas para buscar reward após ação
const REWARD_WINDOW = 3;

// ─── Main ────────────────────────────────────────────────────────────────────

const dir = process.argv[2] || join(__dirname, '../docs/playtest/20250610/07');

console.log(`\n📂 Lendo arquivos de: ${dir}\n`);

const teleFiles = readdirSync(dir)
    .filter(f => f.startsWith('elifoot-telemetry') && f.endsWith('.json'))
    .sort();
const autoFiles = readdirSync(dir)
    .filter(f => f.startsWith('elifoot-autoplay') && f.endsWith('.json'))
    .sort();

if (teleFiles.length === 0) {
    console.error('❌ Nenhum arquivo de telemetria encontrado em:', dir);
    process.exit(1);
}

console.log(`📊 Telemetria: ${teleFiles.length} arquivos`);
console.log(`🎮 Autoplay:   ${autoFiles.length} arquivos\n`);

const allTuples = [];
const allMetas = [];

teleFiles.forEach((tf, i) => {
    const af = autoFiles[i];
    const tPath = join(dir, tf);
    const aPath = af ? join(dir, af) : null;

    try {
        const result = extractDataset(tPath, aPath);
        allMetas.push(result.meta);
        allTuples.push(...result.tuples);
        console.log(`  ✅ ${tf}: ${result.tuples.length} tuplas extraídas`);
    } catch (e) {
        console.error(`  ❌ ${tf}: ${e.message}`);
    }
});

// Build output JSONL
const outDir = join(__dirname, '../docs');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'dataset-finetune.jsonl');

const lines = [
    JSON.stringify({
        meta: {
            generated: new Date().toISOString(),
            sourceDir: dir,
            files: allMetas,
            totalTuples: allTuples.length,
            actionBreakdown: countActions(allTuples),
        }
    }),
    ...allTuples.map(t => JSON.stringify(t)),
];

writeFileSync(outPath, lines.join('\n') + '\n');

console.log(`\n✅ Dataset gerado: ${outPath}`);
console.log(`   Total tuplas: ${allTuples.length}`);
console.log(`   Distribuição de ações:`);
const breakdown = countActions(allTuples);
Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([action, count]) => console.log(`     ${action}: ${count}`));

// ─── Core extraction ─────────────────────────────────────────────────────────

function extractDataset(telemetryPath, autoplayPath) {
    const tele = JSON.parse(readFileSync(telemetryPath, 'utf-8'));
    const auto = autoplayPath ? JSON.parse(readFileSync(autoplayPath, 'utf-8')) : null;

    const decisions = tele.history?.decisions || tele.decisions || [];
    const rewardMap = buildRewardMap(decisions);
    const outcomeMap = buildOutcomeMap(auto);

    const seen = new Set();
    const tuples = [];

    for (const d of decisions) {
        if (IGNORED_ACTIONS.has(d.action)) continue;
        if (!d.action) continue;

        // dedupe por semana+season+action
        const dedupeKey = `${d.season}_${d.week}_${d.action}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const weekKey = `${d.season}_${d.week}`;
        const rewardKey = findRewardInWindow(rewardMap, d.season, d.week, REWARD_WINDOW);

        tuples.push({
            input:      extractState(d),
            action:     d.action,
            actionArgs: extractArgs(d),
            outcome: {
                rewardDelta:  rewardKey !== null ? rewardMap[rewardKey] : null,
                won:          outcomeMap[weekKey]?.won    ?? null,
                promoted:     outcomeMap[weekKey]?.promoted ?? null,
                weeksLater:   REWARD_WINDOW,
            },
        });
    }

    const actionCounts = countActions(tuples);

    return {
        meta: {
            source:         telemetryPath,
            totalDecisions: decisions.length,
            extracted:      tuples.length,
            actionBreakdown: actionCounts,
        },
        tuples,
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractState(d) {
    const a = d.args || {};
    return {
        week:        d.week        ?? null,
        season:      d.season      ?? null,
        state:       a.state       ?? null,
        emotion:     a.emotion     ?? null,
        tactic:      a.tactic      ?? a.currentTactic ?? null,
        tacticStreak: a.tacticStreak ?? 0,
        position:    a.position    ?? null,
        balance:     a.balance     ?? null,
        squadSize:   a.squadSize   ?? null,
        division:    a.division    ?? null,
        streak:      a.streak      ?? 0,
        avgOvr:      a.avgOvr      ?? null,
    };
}

function extractArgs(d) {
    const a = d.args || {};
    switch (d.action) {
        case 'TACTIC_CHANGE':     return { from: a.from, to: a.to, source: a.source };
        case 'SQUAD_REPLENISH':   return { before: a.before, after: a.after };
        case 'TRAIN':             return { trainingId: a.trainingId, picked: a.picked };
        case 'TEAM_TALK':         return { talkId: a.talkId };
        case 'ML_TRANSFER_REWARD': return { reward: a.reward, epsilonMod: a.epsilonMod };
        default:                  return a;
    }
}

function buildRewardMap(decisions) {
    const map = {};
    decisions
        .filter(d => d.action === 'ML_TRANSFER_REWARD')
        .forEach(d => {
            const key = `${d.season}_${d.week}`;
            map[key] = (map[key] || 0) + (d.args?.reward || 0);
        });
    return map;
}

function findRewardInWindow(rewardMap, season, week, window) {
    for (let w = week; w <= week + window; w++) {
        const key = `${season}_${w}`;
        if (rewardMap[key] !== undefined) return key;
    }
    return null;
}

function buildOutcomeMap(auto) {
    if (!auto) return {};
    const map = {};

    (auto.successes || []).forEach(s => {
        const key = `${s.season}_${s.week}`;
        if (s.type === 'WIN_STREAK')  map[key] = { won:  1, promoted: false };
        if (s.type === 'PROMOTION')   map[key] = { won:  1, promoted: true  };
        if (s.type === 'GOLEADA')     map[key] = { won:  1, promoted: false };
        if (s.type === 'TITLE_WON')   map[key] = { won:  1, promoted: true  };
    });

    (auto.anomalies || []).forEach(a => {
        const key = `${a.season}_${a.week}`;
        if (a.type === 'LOSS_STREAK') map[key] = { won: -1, promoted: false };
        if (a.type === 'VEXAME')      map[key] = { won: -1, promoted: false };
        if (a.type === 'RELEGATION')  map[key] = { won: -1, promoted: false };
    });

    return map;
}

function countActions(tuples) {
    const counts = {};
    tuples.forEach(t => {
        counts[t.action] = (counts[t.action] || 0) + 1;
    });
    return counts;
}
