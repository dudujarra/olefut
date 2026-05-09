# SPEC-107: Player Identity

## O que é

Detecta se top scorer / vilão / herói surgem organicamente do squad. Identifica concentração de gols/eventos em poucos jogadores (identidade forte) vs dispersão total (identidade fraca). Score 0-100.

## Input

```javascript
{
  engine,
  history: {
    playerGoals: { [playerId]: count },
    playerCareer: [{ id, name, goals, hatTricks, redCards }]
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-107',
  name: 'Player Identity',
  score: 0..100,
  signals: [
    { id: 'NO_TOP_SCORER', severity, msg: 'Sem artilheiro destacado' },
    { id: 'CRAQUE_EMERGED', severity, msg: 'X marcou Y de Z gols (P%)' },
    { id: 'VILLAIN_EMERGED', severity, msg: 'Jogador X expulso N vezes' }
  ],
  topScorer: { name, goals, percentage }|null,
  topVillain: { name, redCards }|null,
  giniCoefficient: number,           // 0 dispersão / 1 concentração
  topSignal
}
```

## Validação

- Sem gols → score 0, NO_TOP_SCORER ativo
- 1 jogador 50%+ dos gols → CRAQUE_EMERGED + score alto
- gini sempre 0..1
- <10ms

## Forbidden

- Side effects
- Mutar squad
