# REFACTOR SPEC: AKITA-RFCT-005 — MythService Skeleton + Read Methods

## 1. Identidade

- **ID:** AKITA-RFCT-005
- **Tipo:** refactor (extract service, skeleton)
- **Escopo:** criar `src/services/MythService.js` stateless com métodos read-only
- **Fase:** 5 de 17 (PR-1.1)
- **PR pré-requisitos:** AKITA-RFCT-004

## 2. Motivação

Primeiro service. Stateless. Engine permanece intocado (paralelo). Próximo PR move métodos.

- **Estimativa:** 4h

## 3. PROIBIDO

- Tocar engine.js neste PR
- Adicionar feature nova

## 4. PERMITIDO

- Criar `src/services/MythService.js`:
  - `getLegends(save)` → array
  - `getHallOfFame(save, clubId)` → array
  - `getRegenChildren(save)` → array (placeholder, retorna [])

## 5. Test Harness

- [ ] Unit test MythService isolado
- [ ] Engine inalterado, golden master idêntico

## 6. Definition of Done

- MythService.js criado com 3 métodos read
- Tests unitários passando
- Engine não modificado

## 7. Definition of Stop

Se service ficar trivial (<50 LOC), inline de volta no engine — não vale extract.

## 8. Rollback Plan

Deletar service file.
