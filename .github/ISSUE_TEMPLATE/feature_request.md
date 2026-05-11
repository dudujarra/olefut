---
name: ✨ Feature Request (SPEC-first)
about: Propõe feature nova seguindo SDD (Mandamento #1)
title: "SPEC-XXX: <descrição curta>"
labels: spec, feature
---

> 🥋 Antes de abrir: lê [`specs/SPEC-RULES.md`](../../specs/SPEC-RULES.md) e [`AKITA_RULES.md`](../../AKITA_RULES.md) Mandamento #1.
> Sem spec aprovada = sem código.

## Pergunta / objetivo (1 frase)
<!-- O que esta feature faz. -->

## Por quê
<!-- Que problema resolve. Que dor remove. Qual decisão estratégica suporta. -->

## Categoria
- [ ] engine
- [ ] gameplay
- [ ] ui
- [ ] infra
- [ ] learning
- [ ] refactor
- [ ] telemetry

## Spec proposta

Caminho proposto: `specs/<categoria>/SPEC-XXX-<nome>.md`

- [ ] Vou usar [`specs/generators/code.md`](../../specs/generators/code.md) (feature de código)
- [ ] Vou usar [`specs/generators/research.md`](../../specs/generators/research.md) (descoberta antes de código)
- [ ] Vou usar [`specs/generators/pipeline.md`](../../specs/generators/pipeline.md) (CI/infra)
- [ ] Vou usar [`specs/generators/decision.md`](../../specs/generators/decision.md) (ADR / decisão arquitetural)

## SPECs relacionadas
- Parent: SPEC-YYY
- Dependências: SPEC-ZZZ

## Harness previsto (Regra 0)

Como vai ser validada? Arquivo `tests/specs/SPEC-XXX.test.js` cobrindo:
- [ ] Input X → output Y
- [ ] Edge case A
- [ ] Forbidden case Z não passa

## Forbidden cases iniciais
- ❌ ...
- ❌ ...

## Riscos
- Performance:
- Compatibilidade:
- Bundle size:

## Definition of done
- [ ] Spec aprovada pelo Dudu
- [ ] Implementação contra spec
- [ ] Harness no mesmo PR (Regra 0)
- [ ] `npm run lint && npm test && npm run build` 0 erros
- [ ] `docs/SDD_ELIFOOT_RPG.md` atualizado se mecânica nova
