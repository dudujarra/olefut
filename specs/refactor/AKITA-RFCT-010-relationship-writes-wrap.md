# REFACTOR SPEC: AKITA-RFCT-010 — Relationship Writes + Wrap Method

## 1. Identidade

- **ID:** AKITA-RFCT-010
- **Fase:** 10 de 17 (PR-2.3)
- **Pré-requisitos:** AKITA-RFCT-009
- **Estimativa:** 4h

## 2. Motivação

Move writes (recordTransfer, recordDerby, decayRivalry). Aplicar **Wrap Method** em `playMatch()` pra inserir hook RelationshipService sem mudar comportamento.

## 3. PROIBIDO

- Lógica nova
- Mudar resultado match

## 4. PERMITIDO

- engine.playMatch chama `this._relationshipService.recordDerby(...)` no fim
- Hook é write-only neste PR

## 5. Test Harness

- [ ] Golden master idêntico (registros não mudam standings, só Camada 3 vetor)
- [ ] save baseline novo campo `relations.club_club` opcional (não breaking)

## 6. Definition of Done

- writes movidos
- playMatch wrapped sem regression

## 7. Stop

Se wrap quebra match logic, reverter e investigar timing.

## 8. Rollback

git revert.
