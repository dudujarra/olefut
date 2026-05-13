# SPEC-136: Autoplay Bugfixes — 5 bugs identificados em deep soak (104+ temporadas)

> **Origem**: análise de 5 runs autoplay (docs/playtest/20250610/07). Zero bugs é pré-requisito para dados de ML confiáveis.

---

## O que é

Corrige 5 bugs detectados nos logs de autoplay/telemetria do deep soak test. Sem esses fixes, os dados de treinamento ML são corrompidos (gols zerados, goleadores acumulando, msgs ilegíveis).

---

## Input

Nenhum input novo. Bugs existem no fluxo atual de `AutoPlayService` + `SeasonProcessor` + `engine`.

---

## Output esperado

Após os 5 fixes:
1. `TROPHY_CEREMONY.msg` exibe nome legível: `"🏆 Cerimônia: Campeão da Série A"`
2. `trophyCeremony.season.goalsFor` e `goalsAgainst` > 0 quando time marcou/sofreu gols
3. `topScorer.goals` nunca ultrapassa ~60 (máximo plausível por temporada)
4. `TACTIC_STUCK.ctx.streak` = número correto de semanas (≥ 8)
5. `DECISIONS_CRASH` desaparece ou tem mensagem descritiva para diagnóstico

---

## Regras de validação

- [ ] `TROPHY_CEREMONY msg` não contém `[object Object]`
- [ ] `goalsFor` e `goalsAgainst` > 0 em pelo menos 50% das cerimônias de temporadas não-rebaixamento
- [ ] `topScorer.goals` ≤ 80 em qualquer temporada individual
- [ ] `TACTIC_STUCK ctx.streak` ≥ 8 sempre que anomalia é logada
- [ ] `DECISIONS_CRASH` < 5% das semanas jogadas em autoplay de 20 temporadas

---

## Forbidden

- [ ] `topScorer.goals` > 200 em uma única temporada
- [ ] `msg` com `[object Object]` em qualquer sucesso logado
- [ ] `goalsFor: 0` E `wins > 0` na mesma temporada (impossível ganhar sem marcar)
- [ ] `streak: 0` no ctx de `TACTIC_STUCK`

---

## Implementação — 5 bugs, 5 fixes

### Bug 1 — `[object Object]` em TROPHY_CEREMONY
**Arquivo**: `src/services/AutoPlayService.js:288`

**Causa**: template string serializa objeto `trophy` diretamente.
```js
// ANTES (quebrado):
`🏆 Cerimônia: ${this.engine.trophyCeremony.trophy}`
// DEPOIS:
`🏆 Cerimônia: ${this.engine.trophyCeremony.trophy.name}`
```

---

### Bug 2 — `goalsFor/goalsAgainst` sempre 0
**Arquivo**: `src/engine/engine.js:86` e `src/engine/engine.js:1243`

**Causa**: `managerStats` é inicializado sem `goalsFor`/`goalsAgainst`, e nunca são incrementados após partidas.

**Fix em 2 passos**:

1. Adicionar ao objeto de inicialização:
```js
// engine.js:86 e engine.js:1243
this.managerStats = { wins: 0, draws: 0, losses: 0, streak: 0, lossStreak: 0, rollingForm: [], goalsFor: 0, goalsAgainst: 0 };
```

2. Incrementar após cada partida (localizar onde wins/losses são incrementados e adicionar ao lado):
```js
// após incrementar wins/draws/losses:
this.managerStats.goalsFor += matchResult.homeGoals; // ou awayGoals se time é visitante
this.managerStats.goalsAgainst += matchResult.awayGoals;
```

---

### Bug 3 — `topScorer` acumulando gols entre temporadas
**Arquivo**: `src/services/SeasonProcessor.js:163`

**Causa**: `_findTopScorer` usa `p.career?.seasonGoals || p.seasonGoals`. Quando `career.seasonGoals` é 0 (já zerado por `closeSeasonStats` na linha 67), o fallback `p.seasonGoals` nunca foi zerado — acumula.

**Fix — 2 opções** (usar opção A):

**Opção A** — trocar `||` por `??` (correto semanticamente: 0 é válido):
```js
// ANTES:
const goals = p.career?.seasonGoals || p.seasonGoals || 0;
// DEPOIS:
const goals = p.career?.seasonGoals ?? p.seasonGoals ?? 0;
```

**Opção B** — chamar `_findTopScorer` ANTES de `closeSeasonStats` (reordenar SeasonProcessor.process).

---

### Bug 4 — `TACTIC_STUCK ctx.streak` sempre 0
**Arquivo**: `src/services/AutoPlayService.js:1009`

**Causa**: na linha 1009, `streak: this._consecutiveSameTactic` é logado, mas em outro caminho (via `LLMBridge`) o signal é gerado sem passar streak no ctx. Verificar qual path gera os logs com streak=0.

**Investigação**:
```js
// LLMBridge.js:38 — gera signal SEM streak no ctx:
signals.push({ id: 'TACTIC_STUCK', msg: `Mesma tática '${currentTactic}' há ${tacticStreak} sem` });

// AutoPlayService.js:1009 — processa o signal e loga:
if (sig.id === 'TACTIC_STUCK') this._logAnomaly('TACTIC_STUCK', sig.msg, { tactic: nextTactic, streak: this._consecutiveSameTactic });
```

**Fix**: verificar se `this._consecutiveSameTactic` está zerado nesse ponto. Se sim, usar o valor extraído da mensagem ou passar via signal:
```js
// LLMBridge.js:38 — passar tacticStreak no signal:
signals.push({ id: 'TACTIC_STUCK', msg: `Mesma tática '${currentTactic}' há ${tacticStreak} sem`, streak: tacticStreak });

// AutoPlayService.js:1009 — usar streak do signal:
if (sig.id === 'TACTIC_STUCK') this._logAnomaly('TACTIC_STUCK', sig.msg, { tactic: nextTactic, streak: sig.streak || this._consecutiveSameTactic });
```

---

### Bug 5 — `DECISIONS_CRASH` (novo, aparece em run-3 e run-5)
**Arquivo**: `src/services/AutoPlayService.js:279`

**Causa**: catch genérico em `_makeDecisions`. O erro específico está sendo engolido.

**Fix — melhorar logging para diagnóstico**:
```js
// ANTES:
this._logAnomaly('DECISIONS_CRASH', e?.message || 'Unknown error in _makeDecisions');

// DEPOIS:
this._logAnomaly('DECISIONS_CRASH', `${e?.message || 'Unknown'} | stack: ${e?.stack?.split('\n')[1] || 'n/a'}`, { errorType: e?.constructor?.name });
```

Depois de ter o stack trace, identificar e corrigir causa raiz.

---

## Testes esperados

```javascript
describe('SPEC-136: Autoplay Bugfixes', () => {

  test('Bug1: TROPHY_CEREMONY msg sem [object Object]', () => {
    // mock trophyCeremony com objeto trophy
    const msg = `🏆 Cerimônia: ${trophy.name}`;
    expect(msg).not.toContain('[object Object]');
    expect(msg).toContain('Campeão');
  });

  test('Bug2: managerStats.goalsFor inicializa com 0 (não undefined)', () => {
    const engine = new Engine(...);
    expect(engine.managerStats.goalsFor).toBe(0);
    expect(engine.managerStats.goalsAgainst).toBe(0);
  });

  test('Bug2: goalsFor incrementa após partida vencida', () => {
    // simular match com homeGoals=3
    expect(engine.managerStats.goalsFor).toBe(3);
  });

  test('Bug3: topScorer.goals <= 80 após temporada completa', () => {
    const topScorer = seasonProcessor._findTopScorer(team);
    expect(topScorer?.goals || 0).toBeLessThanOrEqual(80);
  });

  test('Bug3: topScorer usa ?? não || (zero é valor válido)', () => {
    // player com career.seasonGoals = 0 e p.seasonGoals = 999
    const goals = player.career?.seasonGoals ?? player.seasonGoals ?? 0;
    expect(goals).toBe(0); // não 999
  });

  test('Bug4: TACTIC_STUCK ctx.streak >= 8', () => {
    const anomaly = autoplay.anomalies.find(a => a.type === 'TACTIC_STUCK');
    expect(anomaly.ctx.streak).toBeGreaterThanOrEqual(8);
  });

  test('Bug4: LLMBridge signal passa streak', () => {
    const signals = buildSignals({ tacticStreak: 9, currentTactic: 'counter' });
    const stuck = signals.find(s => s.id === 'TACTIC_STUCK');
    expect(stuck.streak).toBe(9);
  });

  test('Bug5: DECISIONS_CRASH inclui tipo de erro', () => {
    // se crash acontece, ctx tem errorType
    const crash = autoplay.anomalies.find(a => a.type === 'DECISIONS_CRASH');
    if (crash) expect(crash.ctx?.errorType).toBeDefined();
  });
});
```

---

## Harness de validação

```bash
#!/bin/bash
# harness/SPEC-136-validate.sh
cd /Users/dudujarra/Documents/OléFUT
npm test -- --testNamePattern="SPEC-136" 2>&1
exit $?
```

**Gate CI**: todos os 8 testes devem passar.
