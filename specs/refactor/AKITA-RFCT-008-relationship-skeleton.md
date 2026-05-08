# REFACTOR SPEC: AKITA-RFCT-008 — RelationshipService Skeleton

## 1. Identidade

- **ID:** AKITA-RFCT-008
- **Fase:** 8 de 17 (PR-2.1)
- **Pré-requisitos:** AKITA-RFCT-007
- **Estimativa:** 4h

## 2. Motivação

Segundo service. Camada 3 (Relacional). Stateless skeleton.

## 3. PROIBIDO

- Tocar engine ainda
- Feature nova

## 4. PERMITIDO

- Criar `src/services/RelationshipService.js`:
  - `getRivalry(save, clubA, clubB)`
  - `getAlliance(save, clubA, clubB)` (placeholder)
  - `getCoachReputation(save, coachId)` (placeholder)

## 5. Test Harness

- [ ] Unit tests skeleton
- [ ] Engine inalterado

## 6. Definition of Done

- Service criado, 3 métodos read
- Unit tests

## 7. Stop

Anti-anemic check: se só CRUD, considerar inline.

## 8. Rollback

Delete file.
