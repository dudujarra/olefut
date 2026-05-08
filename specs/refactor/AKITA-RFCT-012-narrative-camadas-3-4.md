# REFACTOR SPEC: AKITA-RFCT-012 — Camadas 3-4 em NarrativeService

## 1. Identidade

- **ID:** AKITA-RFCT-012
- **Fase:** 12 de 17 (PR-3.2)
- **Pré-requisitos:** AKITA-RFCT-011
- **Estimativa:** 6h

## 2. Motivação

NarrativeService consulta `relationshipService.getModifier()`. Camada 4 (arcos) início.

## 3. PROIBIDO

- Tracery
- LLM
- Tags categóricas livres

## 4. PERMITIDO

- `src/services/NarrativeService.js`:
  - `getRelationalContext(save, actorA, actorB)` — chama RelationshipService
  - `openArc(save, arcType, actors)` — Camada 4
  - `getOpenArcs(save)` — read

## 5. Test Harness

- [ ] **Snapshot tests obrigatórios** pra outputs templated
- [ ] Round-trip save com arcos array
- [ ] madge --circular zero (sem ciclo Narrative ↔ Relationship)

## 6. Definition of Done

- Camadas 3-4 funcionais em service
- Snapshot tests passando
- Sem ciclos arquiteturais

## 7. Stop

Se ciclo emerge (NarrativeService chama RelationshipService que chama de volta), inverter dependency: Narrative consulta Relationship só, nunca contrário.

## 8. Rollback

git revert.
