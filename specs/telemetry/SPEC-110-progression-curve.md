# SPEC-110: Progression Curve

## O que é

Mede progressão de XP/atributos dos jogadores ao longo de seasons. Detecta curva flat (sem desenvolvimento) ou exponencial (overpowered). Score 0-100 (alto = curva saudável progressiva).

## Input

```javascript
{
  engine,
  history: {
    squadOvrBySeason: { [season]: { avgOvr, topOvr, count } },
    growthEvents: [{ player, attr, from, to, season }]
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-110',
  name: 'Progression Curve',
  score: 0..100,
  signals: [
    { id: 'FLAT_CURVE', severity, msg: 'Squad OVR sem mudança' },
    { id: 'EXPONENTIAL', severity, msg: 'Squad OVR cresceu N pontos em M seasons' },
    { id: 'DECLINE', severity, msg: 'Squad OVR caindo' }
  ],
  curveSlope: number,
  growthEventCount: number,
  topSignal
}
```

## Validação

- Sem dados → score 50
- 0 growth events em 5+ seasons → FLAT_CURVE alto
- curveSlope finito sempre
- <10ms

## Forbidden

- Side effects
- Forçar regen
