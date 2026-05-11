# SPEC-143: Deep Soak v2 — Validação das Correções + Métricas Melhoradas

> **Origem**: após SPEC-136/137/138/139/140/141/142, precisamos re-rodar o deep soak para validar
> que as correções melhoraram os indicadores. Também adicionar métricas que faltavam no v1:
> goalsFor/goalsAgainst reais, distribuição de estados emocionais, preços de transferência.

---

## O que é

Nova rodada de autoplay soak (20 temporadas mínimo) com instrumentação melhorada para validar todas as correções das SPECs anteriores e gerar dataset de fine-tuning mais rico.

---

## Input

```bash
npm run autoplay -- --seasons 20 --export-telemetry --export-dataset
```

---

## Output esperado

Arquivo `elifoot-autoplay-v2-*.json` com campos validados:

```json
{
  "version": 2,
  "seasonsPlayed": 20,
  "wins": X, "draws": Y, "losses": Z,
  "winRate": "~42-50%",
  "goalsFor": ">0",
  "goalsAgainst": ">0",
  "emotionalDistribution": {
    "CALM": ">=25%",
    "ANXIOUS": "<=35%",
    "CONFIDENT": ">=10%",
    "EUPHORIC": ">=2%",
    "TILTED": "<=15%"
  },
  "transferPrices": {
    "avgOvr76SellPrice": ">=R$2M",
    "avgOvr82SellPrice": ">=R$5M"
  },
  "tacticDiversity": {
    "uniqueTacticsUsed": ">=3",
    "maxConsecutiveSameTactic": "<=12"
  },
  "topScorer": {
    "goals": "<=80 (reset por temporada)"
  }
}
```

---

## Regras de validação

- [ ] `goalsFor > 0` em 100% das temporadas com pelo menos 1 vitória
- [ ] `topScorer.goals <= 80` em qualquer temporada individual
- [ ] `TROPHY_CEREMONY.msg` não contém `[object Object]`
- [ ] `TACTIC_STUCK ctx.streak >= 8` em todos os alertas
- [ ] `emotionalDistribution.ANXIOUS <= 35%`
- [ ] `transferPrices.avgOvr76SellPrice >= R$2M`
- [ ] `tacticDiversity.uniqueTacticsUsed >= 3` em 20 temporadas
- [ ] `tacticDiversity.maxConsecutiveSameTactic <= 12` (SPEC-138 reduz de 15+ para ≤12)
- [ ] `errorCount == 0` ou `DECISIONS_CRASH` com stack trace útil
- [ ] Monotony SPEC-100 score ≥ 40 (era 0-22 no v1)

---

## Forbidden

- [ ] `goalsFor: 0` com wins > 0 (bug 2 deve estar corrigido)
- [ ] `topScorer.goals > 200` (bug 3 deve estar corrigido)
- [ ] `[object Object]` em qualquer msg (bug 1 deve estar corrigido)
- [ ] ANXIOUS > 60% do tempo emocional (estado pré-fix)
- [ ] Todos os transfer sells por < R$500k (preços antigos)

---

## Implementação

Modificar `src/services/AutoPlayService.js` para exportar métricas extras no relatório final:

```javascript
// No método _buildReport() ou equivalente, adicionar:
emotionalDistribution: this._computeEmotionalDistribution(),
transferPrices: this._computeTransferStats(),
tacticDiversity: this._computeTacticDiversity(),
```

```javascript
_computeEmotionalDistribution() {
    const counts = this._emotionLog || {};
    const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
    return Object.fromEntries(Object.entries(counts).map(([k,v]) => [k, `${(v/total*100).toFixed(1)}%`]));
}

_computeTransferStats() {
    const sells = this._transferLog || [];
    const byOvr = {};
    sells.forEach(s => {
        const bucket = Math.floor(s.ovr / 5) * 5;
        if (!byOvr[bucket]) byOvr[bucket] = [];
        byOvr[bucket].push(s.price);
    });
    return Object.fromEntries(Object.entries(byOvr).map(([ovr, prices]) => [
        `ovr${ovr}`, prices.reduce((s, p) => s + p, 0) / prices.length
    ]));
}
```

Adicionar log de emoção em cada semana:
```javascript
// após processEvent emocional:
if (!this._emotionLog) this._emotionLog = {};
const state = this.brain?.emotions?.state || 'CALM';
this._emotionLog[state] = (this._emotionLog[state] || 0) + 1;
```

---

## Testes esperados

Não são testes unitários — são assertions no relatório do soak:
```javascript
describe('SPEC-143: Deep Soak v2 Assertions', () => {
  let report;
  beforeAll(async () => { report = await runDeepSoak(20); });

  test('goalsFor > 0 em todas temporadas com wins', () => { ... });
  test('topScorer.goals <= 80', () => { ... });
  test('ANXIOUS <= 35%', () => { ... });
  test('transferPrices OVR76 >= R$2M', () => { ... });
  test('tacticDiversity >= 3 táticas únicas', () => { ... });
  test('Monotony SPEC-100 >= 40', () => { ... });
  test('zero [object Object] em msgs', () => { ... });
  test('TACTIC_STUCK streak sempre >= 8', () => { ... });
});
```

---

## Dependências

**Deve ser executada APÓS** todas estarem implementadas:
- SPEC-136 (bugfixes) ✅
- SPEC-137 (4 NPC levels) ✅
- SPEC-138 (monotony penalty) ✅
- SPEC-139 (emotional fix)
- SPEC-140 (transfer prices)
- SPEC-141 (dataset extractor)
- SPEC-142 (OVR calibration)

---

## Harness
```bash
cd /Users/dudujarra/Documents/ELIFOOT
npm run autoplay:soak -- --seasons 20 2>&1
node scripts/extract-finetune-dataset.js docs/playtest/latest
```
