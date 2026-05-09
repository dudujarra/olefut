# SPEC-111: Market Liquidity

## O que é

Mede saúde do mercado de transferências: tempo médio até oferta, spread bid/ask, % aceitação. Score 0-100 (alto = mercado fluido).

## Input

```javascript
{
  engine,
  history: {
    offers: [{ amount, playerValue, week, accepted: bool }],
    transfers: [{ amount, value, week }]
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-111',
  name: 'Market Liquidity',
  score: 0..100,
  signals: [
    { id: 'NO_OFFERS', severity, msg: 'Sem ofertas em N semanas' },
    { id: 'LOWBALL', severity, msg: 'Ofertas média X% do valor' },
    { id: 'OVERPAY', severity, msg: 'Ofertas média X% acima do valor' }
  ],
  acceptanceRate: number,         // 0..1
  avgSpread: number,              // (offer/value) - 1
  offerCount: number,
  topSignal
}
```

## Validação

- Sem ofertas → score 0, NO_OFFERS ativo
- Spread médio < 0.5 → LOWBALL
- acceptanceRate sempre 0..1
- <10ms

## Forbidden

- Side effects
