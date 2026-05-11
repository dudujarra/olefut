---
name: 🐛 Bug Report
about: Reporta bug seguindo Akita Mandamento #6 (ticket + fix + regression test)
title: "BUG-XXX: <descrição curta>"
labels: bug
---

> 🥋 Antes de abrir: lê [`AKITA_RULES.md`](../../AKITA_RULES.md) Mandamento #6.
> Sem regression test = bug não fechado.

## Repro mínimo (passo a passo, determinístico)
1.
2.
3.

## Expected
<!-- O que deveria acontecer (referência à SPEC se houver) -->

## Actual
<!-- O que está acontecendo -->

## Files affected
<!-- Caminhos prováveis -->
- `src/...`

## SPEC violada
<!-- Qual SPEC-XXX define comportamento correto. Se não existe, criar primeiro. -->
- SPEC-XXX

## Environment
- Browser/OS:
- Branch:
- Commit:
- Seed (se determinístico):

---

## 🚨 Regra 0 — Harness no mesmo PR

- [ ] **Regression test `tests/regression/BUG-XXX.test.js`** existe e falha (red) antes do fix
- [ ] Após o fix, esse mesmo test passa (green)
- [ ] Sem teste = bug não fechado

## 🥋 Akita 3-artefact (Mandamento #6)

- [ ] Branch: `bug/BUG-XXX`
- [ ] `tests/regression/BUG-XXX.test.js` criado
- [ ] PR linkado a esta issue (`Closes #N`)
- [ ] CI verde antes de merge
- [ ] [`BUGS.md`](../../BUGS.md) atualizado com entrada do BUG-XXX

## Risco / impacto
- Bloqueador: sim / não
- Afeta save em produção: sim / não
- Workaround conhecido:
