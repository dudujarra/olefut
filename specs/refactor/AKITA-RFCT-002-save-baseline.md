# REFACTOR SPEC: AKITA-RFCT-002 — Save Baseline + Round-trip Test

## 1. Identidade

- **ID:** AKITA-RFCT-002
- **Tipo:** refactor (test infrastructure)
- **Escopo:** salvar `__fixtures__/save-baseline-v2.json` + teste round-trip
- **Fase:** 2 de 17 (PR-0.2)
- **PR pré-requisitos:** AKITA-RFCT-001

## 2. Motivação

Garantir que future refactors não quebrem serialização. Save format v2 (atual) deve round-trip preservar todos campos sem loss.

- **Estimativa:** 2h

## 3. Comportamento — INVARIANTE

Save round-trip 100% idêntico (deep equal).

## 4. PROIBIDO

- Mudar serializeEngine/restoreEngine em GameContext.jsx
- Modificar SAVE_VERSION

## 5. PERMITIDO

- Criar fixture `__fixtures__/save-baseline-v2.json`
- Criar `tests/characterization/save-roundtrip.test.js`

## 6. Test Harness

- [ ] save-baseline-v2.json gerado de save real (5 temps simuladas)
- [ ] Round-trip: serialize → JSON.stringify → parse → deserialize → deep equal original
- [ ] Tournament prototypes preservados (BUG-021 regression)
- [ ] Class instances skip (staff/board/legacy) verificado

## 7. Definition of Done

- Fixture commitado
- Round-trip test passing
- Snapshot diff zero

## 8. Definition of Stop

Se round-trip falha em campo específico não-trivial, documentar em test.skip + criar issue separado. Não bloquear refactor.

## 9. Rollback Plan

Deletar fixture + test file.
