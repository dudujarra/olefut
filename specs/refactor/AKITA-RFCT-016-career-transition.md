# REFACTOR SPEC: AKITA-RFCT-016 — Transição (Replace Method with Method Object)

## 1. Identidade

- **ID:** AKITA-RFCT-016
- **Fase:** 16 de 17 (PR-4.3)
- **Pré-requisitos:** AKITA-RFCT-015
- **Estimativa:** 6h

## 2. Motivação

Transição ProPlayer → Manager é caso mais complexo (~10 atributos state envolvidos). Usar **Replace Method with Method Object** pattern.

## 3. PROIBIDO

- Adicionar UI ainda (v1.2 fará isso)
- Mudar fluxo observável (ainda)

## 4. PERMITIDO

- Criar class `CareerTransition` em `src/services/CareerTransition.js`:
  ```js
  class CareerTransition {
      constructor(save, careerService, mythService, relationshipService) {...}
      execute() {
          this._validateRetirementEligible();
          this._snapshotPlayerCareer();
          this._promoteToManager();
          this._inheritRelationships();
          this._calculateInitialReputation();
          return this._save;
      }
  }
  ```
- CareerService.retireProPlayer() instancia + executa CareerTransition

## 5. Test Harness

- [ ] Unit test CareerTransition isolado
- [ ] Integration: ProPlayer aposenta → Manager state válido
- [ ] Save round-trip preserva transition state

## 6. Definition of Done

- CareerTransition class extracted
- Methods chunked (5+ private steps)
- Tests cobrem cada step isolado

## 7. Stop

Se transition tem dependency cíclica com 4 services, considerar dividir em sub-transitions (Hierarchy, Relationships, Reputation cada uma própria).

## 8. Rollback

git revert.
