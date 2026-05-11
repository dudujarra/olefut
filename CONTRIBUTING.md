# CONTRIBUTING — ELIFOOT RPG

> **Antes de tudo**: leia [`CLAUDE.md`](CLAUDE.md) (arquitetura) e [`AKITA_RULES.md`](AKITA_RULES.md) (constituição).
> Este projeto opera 100% sob **SDD (Spec-Driven Development) + Protocolo AKITA**.
> Sem spec, sem trabalho. Sem harness, sem spec. Sem exceção.

---

## 🥋 As 3 perguntas antes de abrir PR

1. **Existe spec aprovada?** Se não → cria spec primeiro em `specs/<categoria>/SPEC-XXX-<nome>.md` usando o gerador correto em `specs/generators/`.
2. **Existe harness no mesmo PR?** (Regra 0) Toda spec entrega um teste/script executável que valida o que afirma. Se a spec diz "X passa Y", existe `tests/specs/SPEC-XXX.test.js` (ou equivalente) que prova.
3. **CI verde local?**
   ```bash
   npm run lint && npm test && npm run build
   ```

Se as 3 são "sim" → abre PR. Senão → não abre.

---

## 🔁 Workflow padrão

### Feature nova (SPEC)

```bash
# 1. SDD gate
spec-check.sh "minha feature X"
# exit 1 → escreve spec usando specs/generators/code.md
# exit 0 → segue

# 2. Branch por SPEC
git checkout -b spec/SPEC-XXX-nome-curto

# 3. Implementa + harness
# - Código em src/engine/ (zero React) ou src/components/ (zero lógica)
# - Harness em tests/specs/SPEC-XXX.test.js

# 4. Gates locais (Mandamento #6)
npm run lint
npm test
npm run build

# 5. Commit Akita
git commit -m "AKITA-XXX: SPEC-XXX — descrição curta"
# (pre-commit hook valida format)

# 6. PR linkado à SPEC, com checklist preenchido
gh pr create
```

### Bug (Mandamento #6 — 3-artefact)

```bash
# 1. Issue
gh issue create --template bug_report.md
# Cria BUG-XXX

# 2. Branch
git checkout -b bug/BUG-XXX

# 3. Regression test PRIMEIRO (red)
# tests/regression/BUG-XXX.test.js

# 4. Fix (green)

# 5. Atualiza BUGS.md (entry com arquivo + fix + teste)

# 6. PR linkado à issue (Closes #N)
# Os 3 artefatos têm que estar presentes ou PR é rejeitado:
#   - Issue BUG-XXX
#   - tests/regression/BUG-XXX.test.js
#   - Fix em código + entrada no BUGS.md
```

Atalho:
```bash
npm run bug:full   # Akita workflow runner (scripts/debug-bug.sh)
```

### Refactor

- Refactors maiores moram em `specs/refactor/SPEC-XXX-*.md`.
- Sem mudança de comportamento → testes existentes devem continuar passando.
- Golden master (`tests/characterization/engine-golden.test.js`) é o oráculo: se quebra, ou o refactor está errado, ou foi mudança intencional e precisa regenerar golden + justificar na PR.

---

## 📐 Estilo de código

### Engine (`src/engine/`)
- **Zero React.** Sem `useState`, `useEffect`, sem DOM, sem `window`.
- **OOP onde faz sentido.** Entidades complexas (torneios, sistemas) são classes. Arrays soltos só para listas simples.
- **Headless rodável.** `npx tsx src/engine/simulate_season.js` deve simular temporada inteira sem browser.
- **RNG determinístico.** Tudo aleatório passa por `src/engine/rng.js` com seed. Reprodutibilidade > "ah é random".

### UI (`src/components/`)
- **Read-only.** Componente lê do `GameContext` e desenha. Zero cálculo de tabela, OVR, partida.
- **Bridge é `src/context/`.** Engine fala com React via context, nunca direto.

### Naming
- Arquivos: `PascalCase.js` para classes/sistemas, `camelCase.js` para utilitários.
- Specs: `SPEC-XXX-kebab-case.md`. XXX = ID único, sequencial por área.
- Bugs: `BUG-XXX`.
- Commits: `AKITA-XXX: SPEC-XXX|BUG-XXX — descrição` (pre-commit hook valida).

---

## ✅ PR checklist (resumo)

Já vem no template `.github/PULL_REQUEST_TEMPLATE.md`. Linha mestre:

- [ ] SPEC-XXX ou BUG-XXX linkado
- [ ] Harness no mesmo PR (Regra 0)
- [ ] `npm run lint` 0 erros
- [ ] `npm test` passa
- [ ] `npm run build` 0 erros
- [ ] `BUGS.md` / `CHANGELOG.md` atualizados quando relevante
- [ ] Forbidden cases da spec não introduzidos

---

## 🚫 O que NÃO fazer

- Abrir PR sem spec linkada ("vou criar a spec depois" — não cria).
- Spec sem harness ("os testes vêm na próxima PR" — Regra 0 proíbe).
- Mexer em `src/engine/` importando React.
- Calcular tabela / OVR / partida em componente React.
- Mergear com testes vermelhos ou build quebrado.
- Pull `--rebase` sobre commits compartilhados sem alinhar com o owner.
- Usar `https://api.anthropic.com` com API key em qualquer script (Mandamento #7).
- Adicionar dep nova sem registrar em `CLAUDE.md` e justificar na PR.

---

## 🆘 Dúvidas

- Arquitetura: [`CLAUDE.md`](CLAUDE.md)
- Mandamentos: [`AKITA_RULES.md`](AKITA_RULES.md)
- SDD: [`specs/SPEC-RULES.md`](specs/SPEC-RULES.md)
- SDD vivo (o que está implementado): [`docs/SDD_ELIFOOT_RPG.md`](docs/SDD_ELIFOOT_RPG.md)
- Bug aberto: [`BUGS.md`](BUGS.md)
- Roadmap: [`specs/ROADMAP-NARRATIVE-MASTER.md`](specs/ROADMAP-NARRATIVE-MASTER.md)

Owner: Dudu — dudujarra@corapost.com
