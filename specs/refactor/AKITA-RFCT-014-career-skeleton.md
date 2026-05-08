# REFACTOR SPEC: AKITA-RFCT-014 — CareerService Skeleton + ProPlayer

## 1. Identidade

- **ID:** AKITA-RFCT-014
- **Fase:** 14 de 17 (PR-4.1)
- **Pré-requisitos:** AKITA-RFCT-013
- **Estimativa:** 5h

## 2. Motivação

Quarto service. ProPlayer career methods extraídos.

## 3. PERMITIDO

- Criar `src/services/CareerService.js`:
  - `getProPlayer(save)`
  - `advanceCareer(save, weeks)` (Player mode)
  - `retireProPlayer(save)` (placeholder, full impl em RFCT-016)

## 4. Test Harness

- [ ] Unit tests CareerService isolado
- [ ] Player mode tests não regridem

## 5. Definition of Done

- Service skeleton
- ProPlayer methods movidos

## 6. Stop

Anti-anemic.

## 7. Rollback

Delete file.
