# REFACTOR SPEC: AKITA-RFCT-003 — Stryker Mutation Baseline

## 1. Identidade

- **ID:** AKITA-RFCT-003
- **Tipo:** refactor (test infrastructure)
- **Escopo:** configurar `@stryker-mutator/vitest-runner` + rodar em engine.js + salvar baseline
- **Fase:** 3 de 17 (PR-0.3)
- **PR pré-requisitos:** AKITA-RFCT-001

## 2. Motivação

Mutation testing detecta cobertura efetiva. Baseline antes refactor = comparação válida.

- **Estimativa:** 2h

## 3. Comportamento — INVARIANTE

Stryker é dev tool, zero impact em produção.

## 4. PROIBIDO

- Modificar código de produção pra "passar" mais mutations
- Adicionar testes só pra subir score (deve refletir realidade)

## 5. PERMITIDO

- Adicionar `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` em devDependencies
- Criar `stryker.conf.json`
- Criar `npm run mutate` script

## 6. Test Harness

- [ ] Stryker config aceita engine.js como mutate target
- [ ] Roda em <10min local
- [ ] Score baseline salvo em `tests/characterization/stryker-baseline.json`
- [ ] Score reportado em CHANGELOG

## 7. Definition of Done

- Stryker rodando, baseline registrado
- npm script funcional
- Doc README seção "Mutation testing"

## 8. Definition of Stop

Se Stryker leva >30min ou flakey, considerar trade-off: testar apenas core methods (advanceWeek, playMatch) ao invés de todo engine.js.

## 9. Rollback Plan

Remover devDependency + config.
