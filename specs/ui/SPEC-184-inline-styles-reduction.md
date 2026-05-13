# SPEC-184 — Inline styles reduction (AutoPlay/PlayerDashboard)

> **Status**: PROPOSED
> **Owner**: Dudu (Eduardo Jarra)
> **Branch**: `claude/cranky-antonelli-72155b`
> **PR**: TBD
> **Date**: 2026-05-13
> **Linked specs**: SPEC-163 (forbids inline styles in novo code), SPEC-178 (three-layer design tokens), SPEC-183 (brand alignment pós-ckm)

---

## O que é

Refactor mecânico para reduzir `style={{ }}` count em dois views de alta densidade
(`AutoPlayView` e `PlayerDashboardView`) onde inline styles acumularam acima de 50
por arquivo. Trabalho extrai padrões **estáticos** (literais ou `var(--token)`,
zero ternário) para classes CSS via `src/styles/autoplay-view.css` e
`src/styles/player-dashboard-view.css` (arquivos pré-existentes).

Mantém inline styles **dinâmicos** (ternário, valores derivados de state, props
ou cálculo) — só vale extrair o que é literal.

Zero mudança de comportamento, zero novos tokens, zero novos arquivos CSS.

---

## Input

### Arquivos a modificar
- `src/components/AutoPlayView.jsx` — 72 inline styles → ≤ 35 target (alvo 50% cut)
- `src/components/PlayerDashboardView.jsx` — 58 inline styles → ≤ 29 target (50% cut)
- `src/styles/autoplay-view.css` — adicionar classes BEM para padrões extraídos
- `src/styles/player-dashboard-view.css` — adicionar classes BEM para padrões extraídos

### Arquivos NOVOS
- `specs/ui/SPEC-184-inline-styles-reduction.md` (este arquivo)
- `tests/specs/SPEC-184.test.js` (harness Akita Rule 0)

### Constraints
- Zero behavior change. Pure CSS class swap.
- Não inventar cores; só usar `.ef-ap` scoped vars + tokens globais existentes.
- Não criar novos arquivos CSS.
- Não tocar em outros components.
- Não refatorar lógica, hooks ou JSX estrutural além de `style={}` → `className`.
- EfButton/EfPanel aceitam `className` — usar (merge com existente).

---

## Output

### AutoPlayView
- Inline count após refactor ≤ 35.
- Inline restante = apenas dinâmico (background image URL, cores via `scoreColor()`,
  `borderColor` baseado em severity, etc).

### PlayerDashboardView
- Inline count após refactor ≤ 29.
- Inline restante = apenas dinâmico (skill progress bar width/color via prop iter,
  stress color ternário, etc).

### CSS classes adicionadas
Total ~80 classes BEM novas em `autoplay-view.css` (e.g. `ef-ap__llm-panel`,
`ef-ap__stats-grid`, `ef-ap__telemetry-card`) e `player-dashboard-view.css`
(e.g. `ef-player-dashboard__training-btn`, `ef-player-dashboard__store-card-btn`,
`ef-player-dashboard__modal-stack`).

---

## Validação

### Harness obrigatório (Akita Rule 0)
`tests/specs/SPEC-184.test.js` falha se qualquer um:

1. `src/components/AutoPlayView.jsx` tem mais que 35 `style={{`
2. `src/components/PlayerDashboardView.jsx` tem mais que 29 `style={{`

### CI gate
- `npm run lint` — 0 errors
- `npm test` — todos testes passam (mínimo 1619 verdes)
- `npm run build` — build limpo, bundle ≤500KB initial chunk
- `npm test -- SPEC-184` — harness passa

---

## Forbidden

- Extrair patterns dinâmicos (ternário, `${var}` interpolation com state) — apenas
  static.
- Criar novos arquivos `.css` — só editar os pré-existentes.
- Inventar tokens ou cores novas — só reusar.
- Tocar em outros components (`SquadView`, `MatchView` etc) — outro escopo.
- Refatorar JSX estrutural além de `style={}` → `className`.
- Adicionar dependências (clsx, classnames) — usar template strings nativos.

---

## How to apply (passos de execução)

1. Auditar `style={{ }}` por arquivo — listar quais são static (literal/token only).
2. Adicionar classes BEM novas em `autoplay-view.css` na seção SPEC-184.
3. Trocar `style={}` por `className=` no JSX (preservar dinâmicos).
4. Mesmo processo para `player-dashboard-view.css` + `PlayerDashboardView.jsx`.
5. Escrever harness `tests/specs/SPEC-184.test.js`.
6. Rodar `npm run lint && npm test && npm run build`.
7. Commit + PR.

---

## Why this matters

SPEC-163 baniu inline styles em código novo desde 2026-05-12. Os 130 inline styles
restantes em `AutoPlayView` + `PlayerDashboard` são debt legacy (pré-SPEC-163).
Manter dilui o gate — devs novos viraram a regra "inline OK porque main tem inline".
Refactor mecânico fecha o gap antes de polish/launch (Bloco 3).

Outras vantagens:
- Theming/dark mode futuro fica trivial via CSS vars overrideable
- Re-renders ficam mais baratos (style object identity churn elimina-se)
- Diff PRs menores (mudança de tom = mudança 1 linha CSS, não N linhas JSX)
