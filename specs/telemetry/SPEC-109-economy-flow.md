# SPEC-109: Economy Flow

## O que é

Audita inflow/outflow por categoria (salaries, sponsor, ticket, transfer, staff, stadium). Detecta money sinks (categoria que só drena sem retorno). Score 0-100 (alto = economia saudável).

## Input

```javascript
{
  engine,
  history: {
    weeklyFinances: [{ week, income, expenses, details: [{ label, amount, type }] }],
    balanceByWeek: number[]
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-109',
  name: 'Economy Flow',
  score: 0..100,
  signals: [
    { id: 'MONEY_SINK', severity, msg: 'Categoria X drena R$ N/sem sem inflow' },
    { id: 'SPONSOR_DOMINANT', severity, msg: 'Sponsor cobre N% das despesas' },
    { id: 'TRANSFER_ENGINE', severity, msg: 'Vendas geram R$ N por season' }
  ],
  byCategory: {
    [label]: { totalIn: n, totalOut: n, netFlow: n, weeks: n }
  },
  totalIn: number,
  totalOut: number,
  topSignal
}
```

## Validação

- Sem finances → score 50
- Categoria 100% outflow → MONEY_SINK
- byCategory sempre objeto
- <10ms

## Forbidden

- Side effects
