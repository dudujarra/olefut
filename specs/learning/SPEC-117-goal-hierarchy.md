# SPEC-117 — Goal Hierarchy

## Goal
Bot tem objetivos prioritizados. Action selection ponderada por goal weight + Q-value.

## Hierarchy (priority order)
1. AVOID_RELEGATION (weight 1.0 if posTier=bottom)
2. FINANCIAL_HEALTH (weight 0.8 if balanceTier=red)
3. CLIMB_POSITION (weight 0.6 if posTier=mid)
4. SQUAD_DEPTH (weight 0.4 if squad < 18)
5. WIN_TITLE (weight 0.3 if posTier=top4)

## Action scoring
```
score(action) = Q[state][action] * Σ(activeGoal.weight * actionRelevance(action, goal))
```

## actionRelevance examples
- TRAIN fitness ↔ AVOID_RELEGATION: 0.7
- UPGRADE_STADIUM ↔ FINANCIAL_HEALTH: -0.3 (gasta dinheiro)
- ACCEPT_TRANSFER (sell youth high) ↔ FINANCIAL_HEALTH: 0.9

## Verification
- Bot in posTier=bottom prefere defensive tactics + buy reposição
- Bot in balanceTier=red recusa upgrades
- Goals visible in AutoPlayView UI section "🎯 Bot Goals"

## Open Questions
- Goals dinamicamente from engine state ou hardcoded?
  → Detected each tick via state inspector.
