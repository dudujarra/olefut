# REFACTOR SPEC: AKITA-RFCT-007 — Move Writes + saveSerializer Registry

## 1. Identidade

- **ID:** AKITA-RFCT-007
- **Fase:** 7 de 17 (PR-1.3)
- **Pré-requisitos:** AKITA-RFCT-006
- **Estimativa:** 4h

## 2. Motivação

Mover writes (addLegend, promoteToHallOfFame, generateRegenChild) + criar `saveSerializer.js` com registry de tipos.

## 3. PROIBIDO

- Mudar SAVE_VERSION ainda (próximo PR final)
- Adicionar feature

## 4. PERMITIDO

- Criar `src/services/saveSerializer.js`:
  - `register(typeName, classRef)` 
  - `serialize(obj)` / `deserialize(data)` com prototype restoration genérico
- MythService writes movidos
- Migrar 13 components useGame() → useMyth() onde aplicável
- Hook `src/hooks/useMyth.js` criado

## 5. Test Harness

- [ ] saveSerializer round-trip preserva prototypes
- [ ] BUG-021 regression test ainda passa
- [ ] Components migrados renderizam OK
- [ ] Golden master idêntico

## 6. Definition of Done

- MythService completo (read + write)
- saveSerializer registry funcional
- useMyth hook criado
- 13 components migrados (ou subset razoável)

## 7. Definition of Stop

Se migração 13 components leva >2h, dividir em RFCT-007A (writes only) + RFCT-007B (component migration).

## 8. Rollback

git revert PR atomic.
