# REFACTOR SPEC: AKITA-RFCT-017 — UI Hooks Cleanup + SAVE_VERSION 2→3

## 1. Identidade

- **ID:** AKITA-RFCT-017
- **Fase:** 17 de 17 (PR-5.1)
- **Pré-requisitos:** AKITA-RFCT-016
- **Estimativa:** 4h

## 2. Motivação

Final do refactor. Migrar componentes restantes para hooks-fachada. Bump SAVE_VERSION 2→3 com migration testada.

## 3. PROIBIDO

- Adicionar feature
- Quebrar saves v2 sem migration

## 4. PERMITIDO

- Criar `src/hooks/useRelationships.js`, `useNarrative.js`, `useCareer.js`
- Migrar componentes restantes
- Implementar `migrations[2] = (save) => migrateToV3(save)` em `saveMigrations.js`
- Bump SAVE_VERSION em GameContext.jsx (1 → 3, pulando 2 era hotfix BUG-021)

## 5. Test Harness

- [ ] Migration v2 → v3 round-trip ok (fixture v2 carrega como v3)
- [ ] 597 assertions passing
- [ ] Golden master idêntico
- [ ] CHANGELOG.md final do refactor escrito

## 6. Definition of Done

- 4 hooks criados (useMyth, useRelationships, useNarrative, useCareer)
- Components migrados
- SAVE_VERSION 3 deployed
- v1.0.5 release tag pronto

## 7. Stop

Se migration v2→v3 perder dados, reverter SAVE_VERSION para 2 + criar issue separado pra investigar.

## 8. Rollback

git revert PR + restaurar SAVE_VERSION 2.
