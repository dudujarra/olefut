# SPEC-106: Emotional Arc

## O que é

Detecta peaks (vitórias clutch, viradas) e valleys (derrotas humilhantes) numa season. Mede amplitude emocional total. Score 0-100 (alto = arco emocional rico).

## Input

```javascript
{
  history: {
    matchOutcomes: [{ week, season, myGoals, oppGoals, isImportant?, hadComeback? }],
    titlesByDivision: object,
    standingsByWeek: number[]
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-106',
  name: 'Emotional Arc',
  score: 0..100,
  signals: [
    { id: 'FLAT_ARC', severity, msg: 'Sem peaks/valleys notáveis' },
    { id: 'CLUTCH_PEAK', severity, msg: 'Vitória clutch X-Y' },
    { id: 'HUMILIATION_VALLEY', severity, msg: 'Derrota humilhante 0-X' }
  ],
  peaks: [{ week, score, type }],
  valleys: [{ week, score, type }],
  amplitude: number,
  topSignal
}
```

## Validação

- Sem matches → score 0, FLAT_ARC ativo
- Match 5-0 a favor → contribui CLUTCH_PEAK
- Match 0-5 contra → contribui HUMILIATION_VALLEY
- <10ms

## Forbidden

- Side effects
