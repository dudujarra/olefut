# SPEC-116 — Q-Learning Tabular State Encoding

## Goal
Build sobre SPEC-115. Adiciona state encoding + Bellman update. Bot considera contexto (posição liga, fase season, balance tier) ao escolher ação.

## State encoding
```
state = `${formTier}|${posTier}|${balanceTier}|${weekPhase}|${lastResult}`
formTier: poor (<40), avg (40-70), good (>70)
posTier: top4 (≤4), mid (5-12), bottom (>12)
balanceTier: red (<0), low (<5M), mid (<50M), rich (>50M)
weekPhase: early (1-12), mid (13-25), late (26-38)
lastResult: W/D/L/-
```

≈ 3×3×4×3×4 = 432 buckets. Tabular cabe.

## Action space
```
action = { tactic, training, formation, transfer, upgrade }
```

## Update rule (Bellman)
```
Q[s][a] += α(reward + γ * max(Q[s'][a']) - Q[s][a])
α = 0.1
γ = 0.9
```

## Reward
- match win: +10
- draw: +2
- loss: -5
- balance delta: +1 per R$ 1M positive
- promotion: +50
- relegation: -100
- title: +200

## Verification
- Q-table grows over time
- Specific state-action shows monotone improvement
- ε-greedy: 15% explore, 85% exploit
- localStorage size <2KB after 1000 weeks (compressed JSON)

## Open Questions
- State explosion? → cap buckets em 500 max, evict LRU.
- Bellman max-future-reward com finite horizon → discount γ=0.9 sufficient.
