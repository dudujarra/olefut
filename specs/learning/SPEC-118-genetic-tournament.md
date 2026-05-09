# SPEC-118 — Genetic Tournament (Multi-Bot Evolution)

## Goal
N=8 bots paralelo cada um com Q-table inicial random. Run 1 season cada. Top 2 cross-breed → 8 new generation. Identifica strategies emergentes.

## Workflow
```
Generation 0: 8 bots random Q-tables
For each season:
  - Run all 8 in parallel (separate engines)
  - Score by: title > promotion > final position > balance
  - Top 2 → parents
  - 8 children = crossover(parent1, parent2) + mutation 5%
  - Replace generation
Track: best strategy per generation
```

## Implementation note
Heavy compute. Run in Web Worker if available, else sequential time-sliced.

## Verification
- After 5 generations, average score should improve
- Best Q-table dominant strategies surface (e.g., "defensive 4-3-3 + youth-heavy")
- AutoPlayView "🧬 Evolution" tab shows generation chart

## Deferred
SPEC-118 é v4 (24h). Pode ser opt-in toggle.
