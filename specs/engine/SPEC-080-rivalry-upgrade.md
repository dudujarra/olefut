# SPEC-080: Rivalry Upgrade — Rivalidades com Peso Narrativo Real

**Fase:** 5 — Rivalidades + Crise (v1.4)  
**Prioridade:** ALTA  
**Telemetria:** SPEC-108 Rivalry score=30 — REPEAT_OPPONENT sem criticalCount, zero momentos críticos em 203 seasons  
**Pré-requisito:** SPEC-017 Rivals Derby System + SPEC-078 Hall de Lendas  
**AKITA:** AKITA-055  
**SAVE_VERSION:** sobe pra 18

---

## O que é

Expansão de SPEC-017 (derby básico) para rivalidades com narrativa emergente, histórico de confrontos críticos, e 6 arcos nomeados. Resolve o problema central: rivais se enfrentam 11x mas `criticalCount=0` — nenhum jogo foi decisivo.

**O que SPEC-017 já tem (manter):**
- Vetor rivalry 0-100 por par de clubes
- Detecção de confronto direto

**O que SPEC-080 adiciona:**
- `criticalCount` real: contagem de confrontos em momentos decisivos
- Threshold narrativo: mídia nomeia rivalidade
- 6 arcos nomeados
- Histórico H2H visível (revenge games)

---

## Input

```typescript
{
  homeClubId: number,
  awayClubId: number,
  matchResult: { homeGoals: number, awayGoals: number },
  matchContext: {
    isFinalRound: boolean,       // última rodada da liga
    isRelegationBattle: boolean, // ambos no Z4 ou lutando por não cair
    isTitleDecider: boolean,     // vitória define campeão
    isCupMatch: boolean,
    leagueWeek: number,
    season: number
  },
  currentRivalry: {
    score: number,               // 0-100 atual
    h2hHistory: Array<{
      season: number,
      homeGoals: number,
      awayGoals: number,
      wasCritical: boolean
    }>,
    namedArc?: string,           // arco ativo se houver
    criticalCount: number
  }
}
```

---

## Output esperado

```typescript
{
  newRivalryScore: number,       // 0-100
  rivalryDelta: number,
  criticalCountDelta: number,    // 0 ou 1
  wasCritical: boolean,
  newNamedArc?: string,          // se threshold atingido
  arcActivated: boolean,
  narrativeEvents: Array<{
    type: 'rivalry_heated' | 'arc_named' | 'revenge_game' | 'title_decider_rivalry' | 'grudge_match',
    description: string
  }>,
  updatedH2H: Array<H2HRecord>
}
```

**criticalCount — quando um confronto é crítico:**
```
isTitleDecider=true          → crítico
isRelegationBattle=true      → crítico
isFinalRound=true + score diff ≤ 2  → crítico
isCupMatch=true + semifinal ou final → crítico
```

**Deltas de rivalry score:**
```
confronto normal:  +2
confronto crítico: +8
derrota vexatória (diff ≥ 4): +5 extra (infâmia)
série de 3+ confrontos críticos: +15 bonus
```

**Thresholds e arcos nomeados:**
```
score 50: mídia chama de "novo clássico" → narrativeEvent rivalry_heated
score 80: arco consolidado → um dos 6 arcos é nomeado

6 arcos disponíveis:
  "A Maldição dos Aflitos"    — quando time perde 5+ vezes seguidas H2H
  "Os Anos de Chumbo"         — quando serie de empates domina H2H (5+ empates)
  "A Vingança Lenta"          — quando time perde 3+ anos e finalmente vira
  "O Clássico Implacável"     — quando todo confronto é crítico por 3+ seasons
  "A Queda do Gigante"        — quando time grande perde para time pequeno em decisão
  "O Derby Eterno"            — rivalidade de 10+ seasons com score ≥ 80
```

**Seleção de arco:** baseada em padrão H2H (não aleatório).

---

## Regras de validação

- [ ] `criticalCount` só sobe quando `matchContext` tem condição crítica verdadeira
- [ ] `newRivalryScore` sempre 0-100
- [ ] `namedArc` só atribuído quando score ≥ 80 pela primeira vez
- [ ] Arco selecionado reflete padrão H2H real (não sorteado)
- [ ] Rivalry score não decai espontaneamente (só cresce)
- [ ] `wasCritical=true` → `criticalCountDelta=1` sempre
- [ ] H2H history atualizado com cada confronto
- [ ] `narrativeEvents` não vazio quando rivalry_heated ou arc_named

---

## Forbidden

- [ ] `criticalCount` subindo em jogo sem contexto crítico
- [ ] `newRivalryScore` acima de 100 ou abaixo de 0
- [ ] Arco nomeado antes de score ≥ 80
- [ ] Mesmo arco nomeado em dois pares de clubes simultaneamente (cada arco é único por save)
- [ ] H2H history perdido entre seasons

---

## Implementação

**Arquivo:** `src/engine/RivalrySystem.js` (expand de SPEC-017)  
**Schema save:** `save.rivalries[clubA_clubB] = { score, criticalCount, h2h, namedArc }`  
**UI:** `src/views/RivalsView.js` — tabela de rivalidades dinâmicas com H2H e arco

---

## Testes esperados

```javascript
describe('SPEC-080: Rivalry Upgrade', () => {
  test('criticalCount only rises on critical context (rule 1)', () => {
    const nonCritical = RivalrySystem.processMatch({ matchContext: { isTitleDecider: false, isRelegationBattle: false, isFinalRound: false, isCupMatch: false }, ...defaults });
    expect(nonCritical.criticalCountDelta).toBe(0);

    const critical = RivalrySystem.processMatch({ matchContext: { isTitleDecider: true }, ...defaults });
    expect(critical.criticalCountDelta).toBe(1);
  });

  test('rivalry score always 0-100 (rule 2)', () => {
    // Score já em 98, jogo crítico (+8) deve clampar em 100
    const result = RivalrySystem.processMatch({ currentRivalry: { score: 98, criticalCount: 5, h2hHistory: [] }, matchContext: { isTitleDecider: true }, ...defaults });
    expect(result.newRivalryScore).toBeLessThanOrEqual(100);
  });

  test('arc only named at score ≥ 80 (rule 3)', () => {
    const below80 = RivalrySystem.processMatch({ currentRivalry: { score: 75, criticalCount: 3, h2hHistory: [] }, matchContext: { isTitleDecider: true }, ...defaults });
    if (below80.newRivalryScore < 80) expect(below80.arcActivated).toBe(false);
  });

  test('arc reflects H2H pattern — maldição for losing streak (rule 4)', () => {
    const h2hLosing = Array(5).fill({ homeGoals: 0, awayGoals: 2, wasCritical: true, season: 1 });
    const result = RivalrySystem.processMatch({
      currentRivalry: { score: 79, criticalCount: 6, h2hHistory: h2hLosing, namedArc: null },
      matchContext: { isTitleDecider: true }, homeClubId: 1, awayClubId: 2, matchResult: { homeGoals: 0, awayGoals: 1 }, ...defaults
    });
    if (result.arcActivated) expect(result.newNamedArc).toBe('A Maldição dos Aflitos');
  });

  test('rivalry score never decays (rule 5)', () => {
    const score50 = { score: 50, criticalCount: 2, h2hHistory: [] };
    const result = RivalrySystem.processMatch({ currentRivalry: score50, matchContext: { isTitleDecider: false }, ...defaults });
    expect(result.newRivalryScore).toBeGreaterThanOrEqual(50);
  });

  test('wasCritical=true → criticalCountDelta=1 always (rule 6)', () => {
    const result = RivalrySystem.processMatch({ matchContext: { isTitleDecider: true }, ...defaults });
    expect(result.wasCritical).toBe(true);
    expect(result.criticalCountDelta).toBe(1);
  });

  test('narrativeEvents not empty when arc named (rule 8)', () => {
    const result = RivalrySystem.processMatch({ currentRivalry: { score: 79, criticalCount: 8, h2hHistory: [] }, matchContext: { isTitleDecider: true }, ...defaults });
    if (result.arcActivated) expect(result.narrativeEvents.length).toBeGreaterThan(0);
  });

  test('forbidden: criticalCount rises on non-critical match (rule forbidden 1)', () => {
    const result = RivalrySystem.processMatch({ matchContext: { isTitleDecider: false, isRelegationBattle: false, isFinalRound: false, isCupMatch: false }, ...defaults });
    expect(result.wasCritical).toBe(false);
    expect(result.criticalCountDelta).toBe(0);
  });
});
```

---

## Definition of Done
- [ ] `RivalrySystem.js` passa todos os 8 testes
- [ ] SPEC-108 Rivalry score > 60 no próximo playtest
- [ ] `criticalCount > 0` em saves com 5+ seasons de H2H
- [ ] RivalsView exibe H2H e arco ativo
- [ ] 6 arcos com descrição handwritten

## Definition of Stop
- Se rivalry score atinge 80 muito rápido (< 3 seasons): reduzir delta de confronto crítico para +5
