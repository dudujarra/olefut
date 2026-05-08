# REFACTOR SPEC: AKITA-RFCT-015 — Manager Career

## 1. Identidade

- **ID:** AKITA-RFCT-015
- **Fase:** 15 de 17 (PR-4.2)
- **Pré-requisitos:** AKITA-RFCT-014
- **Estimativa:** 4h

## 2. Motivação

Manager career methods movidos pra CareerService.

## 3. PERMITIDO

- `getManagerCareer(save)`
- `signWithClub(save, clubId)` (placeholder, full em RFCT-016)
- `getOffers(save)` (placeholder)

## 4. Test Harness

- [ ] Manager mode golden master idêntico
- [ ] 597 assertions

## 5. Definition of Done

- Manager methods em service
- Tests passing

## 6. Rollback

git revert.
