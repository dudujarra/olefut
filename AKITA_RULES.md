# MODO AKITA — Constituição do Projeto OléFUT

> **⚠️ AVISO PARA A INTELIGÊNCIA ARTIFICIAL:**
> Antes de executar qualquer alteração neste repositório, você **deve** ativar o Modo Akita.
> O descumprimento destas regras caracteriza "Vibe Coding" e é estritamente proibido.

> **Filosofia Fábio Akita anti-vibe-coding**: dev pensa, IA digita. Disciplina > intuição.
> Spec + harness + docs + público sempre.

---

## Os 7 Mandamentos (sem exceção)

### 1. SDD obrigatório (Spec-Driven Development)

Nada é construído, modificado, pesquisado ou gerado sem **spec escrita e aprovada**.

Ciclo:
```
SPEC → BUILD → VALIDATE → DEPLOY
```

Gate:
```bash
spec-check.sh "<descrição do trabalho>"
# exit 0 = liberado
# exit 1 = BLOQUEADO — spec não existe
# exit 2 = BLOQUEADO — spec incompleta
```

Geradores em [`specs/generators/`](specs/generators/) — `code.md`, `research.md`, `pipeline.md`, `decision.md`.

Governance: [`specs/SPEC-RULES.md`](specs/SPEC-RULES.md).

---

### 2. Regra 0 — Sem harness, sem spec

Toda spec entrega **no mesmo PR** um harness executável (script + teste + gate CI) que valida o que a spec afirma.

**Sem harness = mentira viva. Spec rejeitada.**

Aplicação:
- SPEC de código → `tests/specs/SPEC-XXX.test.js`
- SPEC de bug → `tests/regression/BUG-XXX.test.js`
- SPEC de pipeline → workflow `.github/workflows/*.yml` rodável local
- SPEC de pesquisa → script reprodutível em `scripts/` ou `src/engine/simulate_*.js`

Falsa propaganda em docs/README também viola este mandamento (números fantasiosos = mentira viva).

---

### 3. Anti-Vibe Coding (zero adivinhação)

Proibido one-shot prompt sem entender resultado. Arquitetura desenhada → IA preenche órgãos.

Se você não entende perfeitamente o fluxo de dados, a arquitetura e os efeitos colaterais de uma função, **NÃO ESCREVA CÓDIGO**. Pare, pesquise, use ferramentas de mock e tenha certeza matemática da sua alteração.

**Build to Earn ≠ Build to Learn** — produção exige rigor.

---

### 4. Documentação central (CLAUDE.md fonte única)

[`CLAUDE.md`](CLAUDE.md) no root = **fonte única de verdade técnica**.

Toda decisão arquitetural, comando, fluxo, dependência vive lá ou linkada de lá.

README humano-amigável aponta pro CLAUDE.md.

`GEMINI.md` e `CODEX.md` na raiz são **espelhos slim** do CLAUDE.md para outras IAs partirem do mesmo lugar.

---

### 5. GitHub público dia 1

Todo projeto novo nasce em repo GitHub público. **Build in public.**

- Commits frequentes (`AKITA-XXX: ...` — pre-commit hook valida format)
- Branches por SPEC (`spec/SPEC-XXX-nome`) ou BUG (`bug/BUG-XXX`)
- PRs revisáveis, linkados a SPEC/BUG
- CI rodando em cada PR (lint + test + build)
- Demo pública (`https://dudujarra.github.io/olefut/`)

---

### 6. Bug = ticket + fix + regression test

Três artefatos pareados, sempre:

1. **GitHub Issue** com repro mínimo (template `.github/ISSUE_TEMPLATE/bug_report.md`)
2. **PR de fix** linkado à issue (Closes #N)
3. **Teste automatizado** em `tests/regression/BUG-XXX.test.js` que pega o bug se voltar

PR não merge sem os 3.

Workflow runner: `npm run bug:full` (ou `bash scripts/debug-bug.sh full`).

Tracker: [`BUGS.md`](BUGS.md) — atualizado a cada bug fechado.

---

### 7. LLM local default. Haiku via Max20 fallback. API paga PROIBIDA

- **Local**: Ollama (`qwen3:14b`, `gemma4:e4b` instalados no M4 Pro 48GB)
- **Fallback**: `claude -p "prompt"` subprocess (consome quota Max20, custo zero)
- **Proibido**: chamada a `https://api.anthropic.com` com API key (pay-per-token)

Aplica a scripts, harnesses, CI, qualquer integração de LLM dentro do repo.

A integração de LLM **dentro do jogo** (SPEC-119, WebLLM bridge) usa `@mlc-ai/web-llm` que roda no browser do jogador — cliente, não servidor.

---

## Restrições específicas (arquitetura)

### Isolamento estrito da Engine (Separation of Concerns)

O Motor de Simulação ([`src/engine/`](src/engine/)) e a Interface Visual (React) são dimensões paralelas.

- `src/engine/` **não** pode ter chamadas para o DOM, não pode ter dependências de `useState` ou `useEffect`.
- `src/components/` **não** pode possuir lógica matemática de jogo ou cálculo de tabelas. Existe única e exclusivamente para **ler** dados da Engine e desenhá-los.
- Ponte Engine ↔ React: `src/context/GameContext`.

### Testabilidade sem tela

Toda mecânica nova de jogo (mercado, lesões, copas, transferências) deve ser construída de tal forma que possa ser completamente simulada, do começo ao fim da temporada, rodando apenas no terminal do Node.js:

```bash
npx tsx src/engine/simulate_season.js
```

…**sem abrir o navegador**.

### Estrutura Orientada a Objetos (OOP) limpa

Uso desenfreado de Arrays soltos é **proibido** na lógica do Motor.

Entidades complexas (Ligas, Copas Nacionais, Sistemas) são instâncias de classes abstratas (ex: `Tournament`) para garantir polimorfismo e simplificar o "Main Loop" de orquestração temporal do calendário.

### Padronização estrutural de dados

Para evitar que o motor de torneios crashe ao sortear times ímpares ou montar chaves defeituosas:

- Quantia de Ligas Nacionais pode ser flexível.
- Quantidade de times por Divisão **nunca pode ser menor que 10**. Se houver menos times disponíveis, criar times artificiais para fechar o número.
- Sempre priorizar quantias pares.

### Build validation obrigatória

Nenhuma sessão de trabalho pode ser considerada "completa" sem:

```bash
npm run lint    # 0 erros
npm test        # tudo passa
npm run build   # 0 erros
```

Se quebrar, agente para tudo e corrige antes de prosseguir. Entregar código que não compila é proibido.

### SDD vivo

Toda mecânica nova é registrada em [`docs/SDD_OléFUT_RPG.md`](docs/SDD_OléFUT_RPG.md) com:

- Nome da mecânica
- Arquivo e método onde foi implementada
- Status (✅ / ⚠️ / ❌)
- Riscos e débitos técnicos identificados

**O SDD é o contrato de verdade do projeto. Se não está no SDD, não existe.**

---

## Setup obrigatório de projeto novo (para referência)

```bash
cd /path/to/novo-projeto
spec-check.sh --init                           # SDD + specs/generators/
gh repo create <org>/<nome> --public --clone   # GitHub público
# CLAUDE.md root: filosofia + arquitetura + comandos
# GEMINI.md, CODEX.md: espelhos slim
# AKITA_RULES.md root: este arquivo (constituição)
# CONTRIBUTING.md root: workflow Akita p/ humanos e IAs
# .github/ISSUE_TEMPLATE/bug_report.md → exige repro + fix + teste
# .github/PULL_REQUEST_TEMPLATE.md → exige spec linkada + harness + issue fechada
# .github/workflows/ci.yml → roda harnesses
# Commit inicial estabelecendo Akita compliance
```

---

## Como o agente aplica isso conversando com Dudu

- Dudu pede algo → roda `spec-check.sh` → se vibe coding (ex: "faz X agora sem spec") → **recusa** e propõe spec primeiro.
- Honestidade brutal sobre tradeoffs (Dudu prefere ser contrariado com razão).
- Aponta quando o pedido viola Akita; sugere caminho compliant.

---

*Assinado: O Arquiteto (Modo Akita Ativado).*
*Última revisão: 2026-05-13 — alinhado com regras globais do Dudu.*
