---
name: elifoot-debug
description: |
  Workflow Akita Mandamento #6 para debug de bugs no ELIFOOT RPG.
  Bug = ticket + fix + regression test (3 artefatos pareados sempre).

  Trigger quando Dudu mencionar: "debug elifoot", "bug elifoot", "tem bug", "achei bug",
  "quebrou", "não funciona", "está errado", "regression", "rodar tests serial",
  "criar ticket", "novo bug", "fix bug", "BUG-XXX", ou qualquer suspeita de bug
  no engine/UI do ELIFOOT.

  Também trigger quando rodar tests em série, criar issue GitHub, ou validar fix
  contra suite completa.

  Em dúvida: trigger. Skill é cérebro do bug workflow do projeto.
---

# ELIFOOT Debug Skill — Akita Bug Workflow

Operating bug workflow do ELIFOOT RPG. Mandamento Akita #6: **Bug = ticket + fix + regression test (3 artefatos pareados, sempre)**.

## Translation Table

| Dudu diz... | Você executa... |
|-------------|-----------------|
| "debug elifoot" | → **Workflow detection** + perguntar o que rodar |
| "achei bug X" / "tem bug em Y" | → **Full workflow**: search→ticket→fix→test |
| "procura bug X" / "search X" | → `bash scripts/debug-bug.sh search "X"` |
| "cria ticket X" / "novo bug X" | → `bash scripts/debug-bug.sh ticket "X"` |
| "fix BUG-XXX" / "começa fix" | → `bash scripts/debug-bug.sh fix BUG-XXX` |
| "gera teste BUG-XXX" | → `bash scripts/debug-bug.sh test BUG-XXX` |
| "roda tests serial" / "test serial" | → `npm run test:series` |
| "valida fix" / "todos tests" | → `npm test && npm run test:series` |
| "watch tests" | → `npm run test:watch` |
| "lista bugs abertos" | → `gh issue list --label bug` |

## Decision Tree

### 1. User reporta bug novo

```
1. SEARCH first — confirm não é duplicate
   → bash scripts/debug-bug.sh search "<termo>"

2. Se não existe issue, CREATE TICKET
   → bash scripts/debug-bug.sh ticket "<title>"
   (cria GitHub Issue + BUG-XXX em BUGS.md)

3. CREATE FIX BRANCH
   → bash scripts/debug-bug.sh fix BUG-XXX

4. GENERATE REGRESSION TEST
   → bash scripts/debug-bug.sh test BUG-XXX
   (cria tests/regression/BUG-XXX.test.js skeleton)

5. EDIT código pra fixar (você faz Edit/Write nos files)

6. EDIT regression test para validar fix
   (você completa skeleton com asserts reais)

7. RUN suite completa
   → npm run test:series

8. COMMIT + PR
   → git commit -m "AKITA-XXX: BUG-XXX <fix description>"
   → gh pr create (template Akita force checklist)
```

### 2. User pede só search

Apenas: `bash scripts/debug-bug.sh search "<termo>"`. Reporta resultados.

### 3. User pede tests serial

Apenas: `npm run test:series`. Reporta passed/failed.

### 4. User pede full workflow one-shot

```
bash scripts/debug-bug.sh full "<title>"
```
Encadeia search→ticket→fix→test automatic.

## Constraints

- **NUNCA** pular criação ticket. Sem issue = sem fix.
- **NUNCA** commitar fix sem regression test.
- **NUNCA** marcar bug fixed sem `npm run test:series` verde.
- **SEMPRE** linkar PR a issue (Closes #N).
- **SEMPRE** atualizar BUGS.md com status final.

## Files relevantes

- `scripts/debug-bug.sh` — workflow runner
- `tests/regression/` — regression tests por BUG-XXX
- `tests/specs/` — SPEC harnesses (não tocar em bug fix)
- `BUGS.md` — bug tracker permanente
- `.github/ISSUE_TEMPLATE/bug_report.md` — template forçado
- `.github/PULL_REQUEST_TEMPLATE.md` — checklist 3-artefact
- `.github/workflows/regression.yml` — CI auto-roda em PR

## Quick Reference

```bash
# Discovery
bash scripts/debug-bug.sh search "termo"

# 3-artefact workflow
bash scripts/debug-bug.sh ticket "title"     # 1. issue
bash scripts/debug-bug.sh fix BUG-XXX        # 2. branch
bash scripts/debug-bug.sh test BUG-XXX       # 3. regression test

# Validation
npm test                                     # quick all
npm run test:series                          # serial 1-by-1
npm run test:regression                      # only regression
npm run test:specs                           # only spec harnesses

# Watch
npm run test:watch
```

## Behavior Examples

### Example 1
```
Dudu: "achei bug, lesão duplica weeks"

Você:
1. bash scripts/debug-bug.sh search "lesão weeks duration"
2. Reporta achados
3. bash scripts/debug-bug.sh full "Lesão duplica weeks recovery"
4. Edit src/engine/InjurySystem.js (você identifica fix)
5. Edit tests/regression/BUG-XXX.test.js (validate fix)
6. npm run test:series
7. git commit + push
```

### Example 2
```
Dudu: "roda tests serial"

Você: npm run test:series
Reporta: 28/28 passed (ou lista failures)
```

### Example 3
```
Dudu: "procura bug em SponsorsSystem"

Você: bash scripts/debug-bug.sh search "SponsorsSystem"
Reporta: 5 fontes (src/tests/specs/commits/issues)
```

## Reminders

- AKITA-XXX format obrigatório em todos commits
- SPEC violado deve ser citado no issue (qual spec define correto?)
- Pre-commit hook valida AKITA format (não pular)
- Tests determinísticos (sem flaky)
