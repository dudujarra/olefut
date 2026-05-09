# SPEC-101: Balance Audit

## O que é

Audita balance gameplay agregado: histograma de vitórias/derrotas/títulos por divisão e métricas econômicas. Detecta zonas easy (>70% wins) ou grind (>70% losses). Retorna score 0-100 (alto = bem balanceado, baixo = desbalanceado).

## Input

```javascript
{
  engine: Engine,
  history: {
    matchOutcomes: [{ division, result: 'W'|'D'|'L', myGoals, oppGoals }],
    titlesByDivision: { 1: n, 2: n, 3: n, 4: n },
    balanceByWeek: number[]
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-101',
  name: 'Balance Audit',
  score: 0..100,                  // 100 = balanceado
  signals: [
    { id: 'EASY_DIVISION', severity: 0..1, msg: 'Série X: 80% vitórias' },
    { id: 'GRIND_DIVISION', severity: 0..1, msg: 'Série Y: 75% derrotas' },
    { id: 'ECONOMY_INFLATION', severity: 0..1, msg: 'Balance dobrou em N temporadas' },
    { id: 'ECONOMY_DEATH', severity: 0..1, msg: 'Balance só desce' }
  ],
  histogram: {
    1: { W: n, D: n, L: n, total: n },
    2: { ... },
    3: { ... },
    4: { ... }
  },
  topSignal: string|null
}
```

## Validação

- Sem matches no histórico → score 100 (não há evidência de desbalanceamento)
- 80%+ wins em uma divisão → EASY_DIVISION ativo
- Histogram sempre tem chaves 1..4
- Detector deve completar em <10ms

## Forbidden

- Side effects no engine
- Throw em state vazio
