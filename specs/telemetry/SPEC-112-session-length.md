# SPEC-112: Session Length

## O que é

Mede ticks por dia simulado, projetando duração de session real. Confirma alvo: PC 30-90min/season, mobile 5-10min/season. Score 0-100.

## Input

```javascript
{
  engine,
  history: {
    weeksPlayed: number,
    elapsedMs: number,
    weekDelay: number
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-112',
  name: 'Session Length',
  score: 0..100,
  signals: [
    { id: 'TOO_FAST', severity, msg: 'Season em <5min' },
    { id: 'TOO_SLOW', severity, msg: 'Season em >90min' },
    { id: 'SWEET_SPOT', severity, msg: 'Season ~Nmin (alvo PC)' }
  ],
  weeksPerSec: number,
  projectedSeasonMinutes: number,
  topSignal
}
```

## Validação

- elapsedMs 0 → score 50
- Projection <5min → TOO_FAST
- Projection >90min → TOO_SLOW
- <10ms

## Forbidden

- Side effects
