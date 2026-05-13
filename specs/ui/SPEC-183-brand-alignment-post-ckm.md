# SPEC-183 — Brand alignment pós-ckm (font + token cleanup)

> **Status**: PROPOSED
> **Owner**: Dudu (Eduardo Jarra)
> **Branch**: `claude/cranky-antonelli-72155b`
> **PR**: TBD
> **Date**: 2026-05-13
> **Linked specs**: SPEC-176 (brand ISSSD-Premium), SPEC-178 (three-layer tokens), SPEC-163 (design system luxury-arcade — superseded by SPEC-176)

---

## O que é

Polish pós-rebrand. Trabalho ckm-brand de 2026-05-12 deixou `docs/brand-guidelines.md` v1.1 + `DESIGN.md` + `assets/design-tokens.json` alinhados a **OléFUT ISSSD-Premium 32-bit** (3 fontes: Press Start 2P / Pixelify Sans / IBM Plex Mono). Mas auditoria 2026-05-13 detectou 4 inconsistências residuais:

1. `src/styles/isssd-premium.css` mantém 49 refs a fontes órfãs (Satoshi, Outfit, Geist Mono, JetBrains Mono, Courier Prime) — arquivo foi *renomeado* de `luxury-arcade.css` mas conteúdo não foi reescrito.
2. `src/index.css:1` importa Google Fonts `Inter` + `Outfit` (não-brand).
3. `docs/design-tokens.json` e `docs/design-tokens.css` são duplicatas no formato OLD flat (pre-SPEC-178). Source of truth é `assets/design-tokens.*`.
4. `src/components/dashboard/dashboard.css` tem 20 raw hex codes (deveria usar tokens).

Esta SPEC alinha tudo a brand-guidelines v1.1.

---

## Input

### Arquivos a modificar
- `src/styles/isssd-premium.css` — substituir 49 font-family órfãs por brand fonts
- `src/index.css` — substituir Google Fonts import por brand fonts (Press Start 2P, Pixelify Sans, IBM Plex Mono)
- `src/components/dashboard/dashboard.css` — substituir 20 raw hex por var(--token)
- (opcional) novos tokens em `src/styles/isssd-premium.css` para suportar dashboard

### Arquivos a deletar
- `docs/design-tokens.json` (duplicate OLD)
- `docs/design-tokens.css` (duplicate OLD)

### Constraints
- Nenhuma feature nova
- Zero mudança em components React (só CSS + index.css)
- Zero quebra de testes existentes
- Build/lint/test devem permanecer verdes

---

## Output

### Fontes (single source of truth = brand-guidelines.md v1.1)
Toda font-family em `src/**/*.css` resolve para um de:
- `'Press Start 2P', monospace` (display)
- `'Pixelify Sans', system-ui, sans-serif` (body)
- `'IBM Plex Mono', monospace` (mono)

System fallbacks permitidos: `system-ui`, `-apple-system`, `sans-serif`, `monospace`, `'SF Mono'`, `Consolas`.

### Tokens
- `assets/design-tokens.{json,css}` = source of truth (SPEC-178)
- `docs/design-tokens.*` = removido

### Dashboard
- `src/components/dashboard/dashboard.css` = zero raw hex `#[0-9a-fA-F]{3,8}` fora de comentários
- Todos colors via `var(--token)` apontando para isssd-premium.css `:root`

---

## Validação

### Harness obrigatório (Akita Rule 0)
`tests/specs/SPEC-183.test.js` falha se qualquer um:

1. `src/**/*.css` contém uma de: `Satoshi`, `Outfit`, `'Geist Mono'`, `'JetBrains Mono'`, `'Courier Prime'`
2. `src/index.css` importa `family=Inter` OR `family=Outfit` OR `family=Satoshi`
3. `docs/design-tokens.json` OR `docs/design-tokens.css` existe
4. `src/components/dashboard/dashboard.css` contém regex `#[0-9a-fA-F]{6}\b` fora de linha começando com `*` (comment) OR `:root`

### CI gate
- `npm run lint` — 0 errors
- `npm test` — todos testes passam (mínimo 1619 verdes)
- `npm run build` — build limpo, bundle ≤500KB initial chunk
- `npm test -- SPEC-183` — harness passa

---

## Forbidden

- Adicionar nova fonte ao brand (apenas 3 oficiais)
- Editar `assets/design-tokens.*` (já correto)
- Editar `docs/brand-guidelines.md` (já correto)
- Modificar `DESIGN.md` (auto-gerado)
- Mexer em components React JSX (escopo só CSS)
- Re-criar `docs/design-tokens.*` (duplicação banida)
- Manter qualquer ref a "Luxury Arcade", "luxury-arcade" em CSS active code (legacy comment-only OK)

---

## How to apply (passos de execução)

1. Adicionar novos tokens em `src/styles/isssd-premium.css :root` para suportar dashboard
2. Substituir 4 padrões de font-family em `isssd-premium.css` via `Edit replace_all`
3. Atualizar token declarations `--font-mono` e `--font-sans` (linhas 92-93)
4. Substituir Google Fonts import em `src/index.css:1`
5. Substituir 20 hex em `dashboard.css` por var()
6. Deletar `docs/design-tokens.{json,css}`
7. Escrever harness `tests/specs/SPEC-183.test.js`
8. Rodar `npm run lint && npm test && npm run build`
9. Commit + PR

---

## Why this matters

ckm-brand definiu brand. Sem este polish:
- 49 fontes ghost continuam carregando se browser tiver Geist/Satoshi instalado (rare mas possível)
- Stitch-generated screens divergem do app real (Stitch usa brand puro, app usa híbrido legacy)
- Devs novos confusos sobre fonte canônica (qual usar?)
- SPEC-178 broken — assets/ é canônico mas docs/ tem duplicata old

Pré-launch é hora certa. Pós-launch = aged code.
