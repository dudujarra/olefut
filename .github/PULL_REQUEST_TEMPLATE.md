# PR — Akita compliance required

> Antes de abrir: confirma [`CLAUDE.md`](../CLAUDE.md) lido, [`AKITA_RULES.md`](../AKITA_RULES.md) seguido, [`CONTRIBUTING.md`](../CONTRIBUTING.md) entendido.

## Summary
<!-- 1-2 frases. O que mudou e por quê. -->

## Linked issue / spec
- Closes #
- SPEC-XXX:
- BUG-XXX:

## Type
- [ ] Bug fix (BUG-XXX) — exige 3-artefact
- [ ] Feature (SPEC-XXX) — exige Regra 0 (harness no mesmo PR)
- [ ] Refactor (sob `specs/refactor/`)
- [ ] Docs/CI/infra

---

## 🚨 Regra 0 — Sem harness, sem spec

Toda mudança de comportamento entrega no mesmo PR um harness executável que prova a afirmação da spec:

- [ ] Harness existe: `tests/specs/SPEC-XXX.test.js` (ou `tests/regression/BUG-XXX.test.js`)
- [ ] Harness é executável local (`npx vitest run <arquivo>`)
- [ ] Harness cobre todos forbidden cases listados na spec
- [ ] Sem harness → PR é rejeitado, sem exceção

## 🥋 Akita 3-artefact (bugs only)

- [ ] Issue `BUG-XXX` criada com repro mínimo
- [ ] `tests/regression/BUG-XXX.test.js` existe e roda
- [ ] Fix linkado à issue (`Closes #N`)
- [ ] `BUGS.md` atualizado

## ✅ SDD compliance

- [ ] SPEC-XXX vinculada e aprovada antes desta PR
- [ ] Validações da spec todas marcadas
- [ ] Forbidden cases da spec não introduzidos
- [ ] `docs/SDD_ELIFOOT_RPG.md` atualizado se mecânica nova foi adicionada

## 🏗️ Isolamento (Mandamento Engine ↔ UI)

- [ ] `src/engine/` continua sem React/DOM/`useState`
- [ ] `src/components/` continua sem lógica de jogo/cálculo

## 🧪 Gates locais (rodados antes de abrir esta PR)

- [ ] `npm run lint` → 0 erros
- [ ] `npm test` → tudo passa (não merge com vermelho)
- [ ] `npm run test:series` → passa (1 file at a time)
- [ ] `npm run test:regression` → passa
- [ ] `npm run build` → 0 erros

## 📜 Docs

- [ ] `CLAUDE.md` continua refletindo a realidade (estado, stack, comandos)
- [ ] `README.md` sem números fantasiosos (Regra 0 — mentira viva)
- [ ] `CHANGELOG.md` atualizado (se release)

## 🚫 Forbidden no PR

- [ ] Nenhuma chamada a `https://api.anthropic.com` com API key (Mandamento #7)
- [ ] Sem `--no-verify` em commit
- [ ] Sem `// removed`, `_unused`, re-exports vazios apenas para placeholder

## Test plan (curto)
- [ ]
- [ ]
