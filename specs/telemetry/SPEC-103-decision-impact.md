# SPEC-103: Decision Impact

## O que é

Avalia toda decisão do bot (training, tactic, formation, transfer, upgrade) contra um counterfactual simples (decisão neutra/default). Mede delta de resultado nas 3 semanas seguintes. Retorna score 0-100 (alto = decisões impactantes / não-cosmetic).

## Input

```javascript
{
  history: {
    decisions: [{ action, args, week, season }],
    matchOutcomes: [{ week, result, myGoals, oppGoals }],
    balanceByWeek: number[]
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-103',
  name: 'Decision Impact',
  score: 0..100,
  signals: [
    { id: 'COSMETIC_DECISIONS', severity, msg: 'X% decisões sem impacto medível' },
    { id: 'HIGH_LEVERAGE', severity, msg: 'Decisão tipo Y muda balance R$ Nm' }
  ],
  byActionType: {
    TRAIN: { count, avgDelta },
    FORMATION: { count, avgDelta },
    ACCEPT_OFFER: { count, avgDelta },
    UPGRADE_STADIUM: { count, avgDelta }
  },
  topSignal
}
```

## Validação

- Sem decisões → score 50
- 100% decisões cosmetic → COSMETIC_DECISIONS severity ~1
- byActionType sempre objeto
- <10ms

## Forbidden

- Re-rodar match engine (custo proibitivo). Counterfactual = baseline histórico.
- Side effects
