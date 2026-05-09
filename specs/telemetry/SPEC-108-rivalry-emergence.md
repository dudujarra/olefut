# SPEC-108: Rivalry Emergence

## O que é

Detecta padrões de "clássico emergente": mesmo adversário enfrentado >=3 vezes em momentos críticos (final, decisão de título, derbi). Mede emergência orgânica de rivalidade. Score 0-100.

## Input

```javascript
{
  engine,
  history: {
    matchOutcomes: [{ oppId, oppName, week, season, isImportant?, myGoals, oppGoals }]
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-108',
  name: 'Rivalry Emergence',
  score: 0..100,
  signals: [
    { id: 'RIVAL_DETECTED', severity, msg: 'Time X enfrentado N vezes em momentos críticos' },
    { id: 'REPEAT_OPPONENT', severity, msg: 'Time Y enfrentado N vezes total' }
  ],
  topRivals: [{ oppName, encounters, criticalCount, headToHead: { W, D, L } }],
  topSignal
}
```

## Validação

- Sem matches → score 0
- Mesmo opponent em 3+ matches críticos → RIVAL_DETECTED severity alta
- topRivals até 3 entradas
- <10ms

## Forbidden

- Side effects
