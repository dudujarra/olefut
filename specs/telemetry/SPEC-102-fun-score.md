# SPEC-102: Fun Score

## O que é

Score composto de "diversão" por partida. Combina variância de gols, eventos surpresa (viradas, hat-tricks, derrotas dramáticas), e decisões bot impactantes. 0-100 por match (média rolling). Alto = jogo divertido.

## Input

```javascript
{
  engine,
  history: {
    matchOutcomes: [{ myGoals, oppGoals, events?: string[], hadComeback?: bool }],
    decisions: object[]
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-102',
  name: 'Fun Score',
  score: 0..100,                  // média rolling últimos 30 matches
  signals: [
    { id: 'GOAL_VARIANCE_HIGH', severity, msg },
    { id: 'COMEBACK_FREQUENCY', severity, msg },
    { id: 'BORING_STREAK', severity, msg }       // muitos 0-0 ou 1-0
  ],
  averagePerMatch: number,
  matchCount: number,
  topSignal
}
```

## Validação

- Sem matches → score 50 (neutro)
- 10× 0-0 seguidos → BORING_STREAK alta severidade, score < 30
- 10× partidas 5-3 com viradas → score > 70
- <10ms execução

## Forbidden

- Side effects
- Mutar history input
