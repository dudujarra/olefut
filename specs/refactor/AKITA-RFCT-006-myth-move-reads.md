# REFACTOR SPEC: AKITA-RFCT-006 — Move Read Methods to MythService

## 1. Identidade

- **ID:** AKITA-RFCT-006
- **Fase:** 6 de 17 (PR-1.2)
- **Pré-requisitos:** AKITA-RFCT-005
- **Estimativa:** 3h

## 2. Motivação

Move read-only methods do engine pra MythService. engine vira delegator.

## 3. PROIBIDO

- Mudar comportamento
- Mudar assinatura métodos públicos

## 4. PERMITIDO

- `engine.getLegends()` vira: `return this._mythService.getLegends(this);`
- Mesmo pra getHallOfFame, getRegenChildren

## 5. Test Harness

- [ ] Golden master snapshot idêntico
- [ ] 597 assertions passing
- [ ] Components que usam engine.getLegends ainda funcionam

## 6. Definition of Done

- Engine delegators thin
- MythService recebe chamadas

## 7. Definition of Stop

Se delegator overhead degrada perf >10%, considerar inline.

## 8. Rollback

git revert.
