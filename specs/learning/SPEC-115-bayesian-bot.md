# SPEC-115 — Bayesian Win-Rate Bot Foundation

## Goal
Bot AutoPlay aprende quais ações historicamente trouxeram resultado positivo, ao invés de heurística hardcoded. Foundation para Q-learning (SPEC-116) e goal hierarchy (SPEC-117).

## Inputs
- Match outcome (W/D/L) + diff goals
- Action taken naquela week (tactic, training, formation)
- State snapshot (week, position, balance tier)

## Outputs
- Per-action win-rate Bayesian estimate (Beta distribution α/β)
- Action picker: highest expected reward + epsilon-greedy explore
- Persistence: localStorage `elifoot_autoplay_brain`

## Verification
- Após 200 weeks, bot deve preferir ação com maior win-rate em ≥70% das vezes
- Epsilon = 0.15 mantém exploração mínima
- Cold-start (zero data) → ação random
- Test: mock 100 outcomes para tactic="attacking" todas wins → bot deve escolher attacking ≥85%

## Open Questions
- Ações combinadas (tactic + training + formation simultâneos) tratam como tupla ou independent?
  → Independent v1 (cada ação own win-rate). Tupla v2 quando dados suficientes.
- Reward só W/L ou inclui balance/position delta?
  → v1 só match W=1, D=0.5, L=0. v2 reward shaping em SPEC-116.
