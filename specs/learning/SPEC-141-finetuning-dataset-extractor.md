# SPEC-141: Fine-Tuning Dataset Extractor

> **Origem**: deep soak gerou ~900 tuplas (estado → ação → resultado) nos arquivos de telemetria.
> Material ainda não formalizado. Extrair como dataset JSONL para fine-tuning supervisionado.

---

## O que é

Script que processa arquivos de telemetria do autoplay e extrai pares `(contexto, ação, reward)` formatados para fine-tuning. Cada tupla representa uma decisão do agente com contexto antes e resultado observável depois.

---

## Input

```typescript
// Arquivos de telemetria:
elifoot-telemetry-*.json  // campo decisions[]: ação + contexto por semana
elifoot-autoplay-*.json   // campo anomalies[] + successes[] como ground truth
```

---

## Output esperado

Arquivo `dataset-finetune.jsonl` com linhas no formato:
```jsonl
{"input": {"week": 10, "season": 3, "state": "o1|i1|c0", "emotion": "CALM", "tactic": "counter", "tacticStreak": 3, "position": 5, "balance": 12000000, "squadSize": 18, "division": 2}, "action": "TACTIC_CHANGE", "actionArgs": {"from": "counter", "to": "offensive"}, "outcome": {"rewardDelta": 6.0, "weeksLater": 3, "won": 1, "promoted": false}}
```

---

## Regras de validação

- [ ] Dataset tem ≥ 500 tuplas por arquivo de telemetria processado
- [ ] Cada tupla tem: `input`, `action`, `actionArgs`, `outcome`
- [ ] `outcome.rewardDelta` preenchido quando `ML_TRANSFER_REWARD` existe na janela +3 semanas
- [ ] `outcome.won` = 1/0/-1 baseado em resultado de partida na semana
- [ ] Tuplas com TACTIC_CHANGE têm `actionArgs.from` e `actionArgs.to`
- [ ] Tuplas com SQUAD_REPLENISH têm `actionArgs.before` (squadSize antes) e `actionArgs.after`
- [ ] Arquivo `.jsonl` uma linha por tupla, válido JSON em cada linha
- [ ] Metadata no header: `{"meta": {"source": "filename", "seasons": N, "totalDecisions": N}}`

---

## Forbidden

- [ ] Tuplas duplicadas (mesma semana+season+action)
- [ ] `outcome` vazio ou null
- [ ] NARRATIVE_EVENT incluído (ruído, não é decisão do agente)
- [ ] Dataset com < 100 tuplas (arquivo de telemetria inválido)

---

## Implementação

**Arquivo novo**: `scripts/extract-finetune-dataset.js`

```javascript
#!/usr/bin/env node
/**
 * SPEC-141: Fine-tuning dataset extractor
 * Usage: node scripts/extract-finetune-dataset.js <telemetry-glob> [autoplay-glob]
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const IGNORED_ACTIONS = new Set(['NARRATIVE_EVENT', 'PRESS_CONFERENCE_SKIP']);
const REWARD_WINDOW_WEEKS = 3;

function extractDataset(telemetryPath, autoplayPath) {
    const tele = JSON.parse(readFileSync(telemetryPath, 'utf-8'));
    const auto = autoplayPath ? JSON.parse(readFileSync(autoplayPath, 'utf-8')) : null;

    const decisions = tele.decisions || [];
    const rewardMap = buildRewardMap(decisions);
    const outcomeMap = buildOutcomeMap(auto);

    const tuples = [];

    for (let i = 0; i < decisions.length; i++) {
        const d = decisions[i];
        if (IGNORED_ACTIONS.has(d.action)) continue;

        const key = `${d.season}_${d.week}`;
        const tuple = {
            input: extractState(d),
            action: d.action,
            actionArgs: extractArgs(d),
            outcome: {
                rewardDelta: rewardMap[key] ?? null,
                won: outcomeMap[key]?.won ?? null,
                promoted: outcomeMap[key]?.promoted ?? null,
                weeksLater: REWARD_WINDOW_WEEKS,
            }
        };
        tuples.push(tuple);
    }

    return {
        meta: {
            source: telemetryPath,
            totalDecisions: decisions.length,
            extracted: tuples.length,
            actionBreakdown: countActions(tuples),
        },
        tuples,
    };
}

function extractState(decision) {
    const args = decision.args || {};
    return {
        week: decision.week,
        season: decision.season,
        state: args.state || null,
        emotion: args.emotion || null,
        tactic: args.tactic || args.currentTactic || null,
        tacticStreak: args.tacticStreak || 0,
        position: args.position || null,
        balance: args.balance || null,
        squadSize: args.squadSize || null,
        division: args.division || null,
        streak: args.streak || 0,
    };
}

function extractArgs(decision) {
    const args = decision.args || {};
    switch (decision.action) {
        case 'TACTIC_CHANGE': return { from: args.from, to: args.to, source: args.source };
        case 'SQUAD_REPLENISH': return { before: args.before, after: args.after };
        case 'TRAIN': return { trainingId: args.trainingId, picked: args.picked };
        case 'TEAM_TALK': return { talkId: args.talkId };
        default: return args;
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

function buildOutcomeMap(auto) {
    if (!auto) return {};
    const map = {};
    // usar successes como vitórias/promoções
    (auto.successes || []).forEach(s => {
        const key = `${s.season}_${s.week}`;
        if (s.type === 'WIN_STREAK') map[key] = { won: 1, promoted: false };
        if (s.type === 'PROMOTION') map[key] = { won: 1, promoted: true };
    });
    (auto.anomalies || []).forEach(a => {
        const key = `${a.season}_${a.week}`;
        if (a.type === 'LOSS_STREAK') map[key] = { won: -1, promoted: false };
        if (a.type === 'VEXAME') map[key] = { won: -1, promoted: false };
    });
    return map;
}

function countActions(tuples) {
    const counts = {};
    tuples.forEach(t => { counts[t.action] = (counts[t.action] || 0) + 1; });
    return counts;
}

// CLI
const [,, teleGlob, autoGlob] = process.argv;
const dir = teleGlob || 'docs/playtest/20250610/07';

const teleFiles = readdirSync(dir).filter(f => f.startsWith('elifoot-telemetry'));
const autoFiles = readdirSync(dir).filter(f => f.startsWith('elifoot-autoplay'));

const allTuples = [];
const metas = [];

teleFiles.forEach((tf, i) => {
    const af = autoFiles[i];
    const result = extractDataset(join(dir, tf), af ? join(dir, af) : null);
    metas.push(result.meta);
    allTuples.push(...result.tuples);
});

const output = [
    JSON.stringify({ meta: { files: metas, total: allTuples.length } }),
    ...allTuples.map(t => JSON.stringify(t))
].join('\n');

writeFileSync('docs/dataset-finetune.jsonl', output);
console.log(`Extracted ${allTuples.length} tuples → docs/dataset-finetune.jsonl`);
```

---

## Testes esperados

```javascript
describe('SPEC-141: Fine-Tuning Dataset Extractor', () => {
  test('extrai >= 500 tuplas por arquivo de telemetria', () => { ... });
  test('cada tupla tem input, action, actionArgs, outcome', () => { ... });
  test('NARRATIVE_EVENT não incluído', () => { ... });
  test('TACTIC_CHANGE tem from e to', () => { ... });
  test('output é JSONL válido (uma linha por tupla)', () => { ... });
  test('sem tuplas duplicadas por semana+season+action', () => { ... });
  test('rewardDelta preenchido onde ML_TRANSFER_REWARD existe', () => { ... });
  test('metadata no header com totalDecisions', () => { ... });
});
```

---

## Harness
```bash
cd /Users/dudujarra/Documents/ELIFOOT
node scripts/extract-finetune-dataset.js docs/playtest/20250610/07
wc -l docs/dataset-finetune.jsonl  # deve ser >= 500
```
