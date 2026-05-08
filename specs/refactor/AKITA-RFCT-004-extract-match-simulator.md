# REFACTOR SPEC: AKITA-RFCT-004 — Extract MatchSimulator

## 1. Identidade

- **ID:** AKITA-RFCT-004
- **Tipo:** refactor (extract class)
- **Escopo:** mover ~600 linhas de `playMatch()` pra `src/services/MatchSimulator.js`
- **Fase:** 4 de 17 (PR-0.4)
- **PR pré-requisitos:** AKITA-RFCT-001, 002, 003

## 2. Motivação

`playMatch()` em engine.js tem 600+ linhas inline. Extract antes de NarrativeService — narrativa precisa hooks no flow do match (gols, cards, MOTM).

- **LOC partida:** engine.js 1.014 / playMatch ~600
- **LOC alvo:** engine.js ~414 (delegator) / MatchSimulator.js ~600
- **Estimativa:** 10h

## 3. Comportamento — INVARIANTE

`engine.playMatch(home, away)` retorna mesmo resultado bit-by-bit. Golden master snapshot inalterado.

## 4. PROIBIDO

- Mudar API pública `engine.playMatch()`
- Adicionar nova lógica (apenas mover)
- Mudar ordem chamadas RNG dentro do match

## 5. PERMITIDO

- Criar `src/services/MatchSimulator.js`
- `engine.playMatch()` vira delegator: `return this._matchSimulator.simulate(home, away, ctx)`
- Constructor injection: `engine._matchSimulator = new MatchSimulator()`
- Extrair sub-helpers privados (sectorsToChanceRatio, rollGoals, applyCards, etc.)

## 6. Test Harness

- [ ] Golden master snapshot idêntico antes/depois
- [ ] 597 assertions passing
- [ ] Save round-trip ok
- [ ] Stryker score ≥ baseline (alvo: melhorar pq MatchSimulator agora testável isolado)
- [ ] madge --circular zero

## 7. Definition of Done

- engine.js ≤500 LOC após este PR
- MatchSimulator.js ≤700 LOC
- 1+ test unit MatchSimulator isolado

## 8. Definition of Stop

Se mover funções rompe testes >5%, reverter. Considerar dividir em RFCT-004A (extract sub-helpers) + RFCT-004B (extract main loop).

## 9. Rollback Plan

git revert PR.
