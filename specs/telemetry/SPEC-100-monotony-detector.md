# SPEC-100: Monotony Detector

## O que é

Detecta padrões de monotonia durante soak test do AutoPlay. Avalia 8 sinais simultâneos: narração repetida, tactic stagnation, baixa variância de stats, mercado morto, freeze de standings, drought de eventos, dominância de decisões e financial freeze. Retorna score 0-100 (alto = mais monótono = pior).

## Input

```javascript
detect(state) — onde state é snapshot do engine + histórico TelemetryAggregator
{
  engine: Engine,         // currentWeek, seasonNumber, weekEvents, transferOffers, teams
  history: {
    weekEvents: string[][],     // últimas N semanas de events
    standings: object[][],      // posição do time-jogador por semana
    balance: number[],          // balance do time-jogador por semana
    decisions: object[],        // decisões do bot
    tactics: string[],          // tactic usada por semana
    matchNarrations: string[]   // últimos 50 narrators
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-100',
  name: 'Monotony Detector',
  score: 0..100,                // 0 = saudável, 100 = monotonia máxima
  signals: [                     // até 8 sinais ativos
    { id: 'NARRATION_REPEAT', severity: 0..1, msg: '...' },
    { id: 'TACTIC_STUCK', severity: 0..1, msg: '...' },
    { id: 'STAT_VARIANCE_LOW', severity: 0..1, msg: '...' },
    { id: 'MARKET_DEAD', severity: 0..1, msg: '...' },
    { id: 'STANDING_FREEZE', severity: 0..1, msg: '...' },
    { id: 'EVENT_DROUGHT', severity: 0..1, msg: '...' },
    { id: 'DECISION_DOMINANCE', severity: 0..1, msg: '...' },
    { id: 'FINANCIAL_FREEZE', severity: 0..1, msg: '...' }
  ],
  topSignal: 'NARRATION_REPEAT'
}
```

## Validação

- `detect(emptyState)` → score 0, signals []
- `detect(stuckState)` com 30 semanas mesma tática → score >= 30, sinal TACTIC_STUCK ativo
- Detector deve completar em <10ms para state com 100 semanas histórico
- Output sempre tem shape `{spec, name, score, signals[], topSignal}`

## Forbidden

- Modificar engine state (detector é puro)
- Throw em qualquer state malformado — retornar score 0 + sinal `STATE_INVALID`
- Mais que 10ms de execução
