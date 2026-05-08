# REFACTOR SPEC MASTER: AKITA-RFCT-000

## 1. Identidade

- **ID:** AKITA-RFCT-000 (master)
- **Tipo:** refactor master (orchestration, sem código)
- **Escopo:** sequência completa 17 PRs do v1.0.5 refactor
- **Fase:** orchestrator
- **Pré-requisitos:** v1.0.1 hotfix (BUG-021) merged

## 2. Motivação

`engine.js` god class 1.014 LOC com ~44 métodos públicos. State mutation in-place. `playMatch()` 600+ linhas inline. Refactor obrigatório antes v1.2 (transição) pra evitar dívida geométrica.

**Métricas partida:**
- engine.js: 1.014 LOC
- Methods: ~44 públicos / 168 method-shape
- State attrs: 19+

**Métricas alvo:**
- engine.js: ≤400 LOC (orchestrator only)
- Services: 4 (Myth/Relationship/Narrative/Career), cada ≤300 LOC
- MatchSimulator extracted: ≥500 LOC out

## 3. Sequência PRs

| PR | ID | Escopo | Horas | Pré-req |
|----|-----|--------|-------|---------|
| PR-0.1 | RFCT-001 | Characterization tests + Golden Master | 5 | nenhum |
| PR-0.2 | RFCT-002 | Save baseline + round-trip test | 2 | RFCT-001 |
| PR-0.3 | RFCT-003 | Stryker mutation baseline | 2 | RFCT-001 |
| PR-0.4 | RFCT-004 | Extract MatchSimulator (600 LOC) | 10 | RFCT-001/002/003 |
| PR-1.1 | RFCT-005 | MythService skeleton + reads | 4 | RFCT-004 |
| PR-1.2 | RFCT-006 | Move read methods to MythService | 3 | RFCT-005 |
| PR-1.3 | RFCT-007 | Move writes + saveSerializer registry | 4 | RFCT-006 |
| PR-2.1 | RFCT-008 | RelationshipService skeleton | 4 | RFCT-007 |
| PR-2.2 | RFCT-009 | Move read methods | 3 | RFCT-008 |
| PR-2.3 | RFCT-010 | Move writes + Wrap Method playMatch | 4 | RFCT-009 |
| PR-3.1 | RFCT-011 | NarrativeService skeleton + Camadas 1-2 | 6 | RFCT-010 |
| PR-3.2 | RFCT-012 | Camadas 3-4 em NarrativeService | 6 | RFCT-011 |
| PR-3.3 | RFCT-013 | Camada 5 + integration MythService | 4 | RFCT-012 |
| PR-4.1 | RFCT-014 | CareerService skeleton + ProPlayer | 5 | RFCT-013 |
| PR-4.2 | RFCT-015 | Manager career | 4 | RFCT-014 |
| PR-4.3 | RFCT-016 | Transição Replace Method with Method Object | 6 | RFCT-015 |
| PR-5.1 | RFCT-017 | UI hooks-fachada migration + SAVE_VERSION 2→3 | 4 | RFCT-016 |

**Total:** 76h ≈ 12-13 semanas a 6h/sem

## 4. Comportamento — INVARIANTE

- 597 assertions verdes em todos PRs
- Golden master snapshot idêntico
- Save baseline round-trip ok
- Stryker mutation score ≥ baseline em todos PRs
- madge --circular zero ciclos sempre

## 5. Stop Conditions

- engine.js >1500 LOC durante refactor → PARE
- Save break em qualquer fase → PARE
- Mutation score cair >5pp → PARE
- 14+ semanas sem terminar → REVISAR ESCOPO
- Service anemic (só CRUD) → INLINE DE VOLTA
- Não tocar em feature por >4 sem → REVISAR PRIORIDADES

## 6. Definition of Done (master)

- Todos 17 PRs merged
- engine.js ≤400 LOC
- 4 services criados em src/services/
- SAVE_VERSION 2 → 3
- Migration v2→v3 testada
- CHANGELOG.md final do refactor

## 7. Definition of Stop (master)

Se após 14 semanas refactor não terminar, reverter PRs ainda não merged e priorizar v1.1 features sobre engine "puro" — aceitar dívida técnica residual.

## 8. Rollback Plan

Cada PR é atômico, revertível independentemente. Master = sequência. Se PR específico falha, retomar da última sucessor estável.
