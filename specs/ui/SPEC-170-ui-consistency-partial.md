# SPEC-170: B3.1 UI Consistency Partial Pass — Dashboard / Market / Standings

> **Status**: PROPOSED — partial focused pass (3 of ~20 components).
> **Author**: Claude (b31-ui worktree)
> **Date**: 2026-05-12
> **Branch**: `claude/b31-ui-consistency`
> **Depende de**: [`SPEC-163`](SPEC-163-design-system-luxury-arcade.md) (Luxury Arcade design system)
> **Bloco**: 3.1 (UI consistency) — partial slice. Full B3.1 = 40h (20 components × 2h). Esta SPEC entrega ~6h focados nos 3 components mais visíveis.

---

## O que é

Extração disciplinada de **inline styles** repetitivos para classes CSS centralizadas em `src/styles/luxury-arcade.css`, alinhadas aos tokens já existentes do design system Luxury Arcade. Sem refactor funcional, sem mudança de comportamento — apenas reorganização de UI tokens.

Escopo limitado:
1. `src/components/DashboardView.jsx`
2. `src/components/MarketView.jsx`
3. `src/components/StandingsView.jsx`

---

## Input

- Estado atual: 3 components com centenas de blocos `style={{...}}` inline duplicando padrões (font-family mono, section labels, progress bars, list rows, form chips, stat cells).
- Design system canônico: `ELIFOOT_DESIGN_SYSTEM.md` + tokens em `src/styles/tokens/` + classes em `src/styles/luxury-arcade.css`.
- Mandamento brutal #4: zero inline style em código novo. Esta SPEC reduz o débito existente nos 3 components de maior visibilidade.

---

## Output

### Novas classes CSS em `src/styles/luxury-arcade.css` (apêndice "B3.1 UI Consistency Utilities (SPEC-170)")

| Classe | Substitui inline pattern |
|--------|--------------------------|
| `.ef-mono` | `fontFamily: "'JetBrains Mono', 'Geist Mono', monospace"` |
| `.ef-sans` | `fontFamily: 'Satoshi, sans-serif'` (heading sans) |
| `.ef-panel-section-label[--strong]` | section-header (icon + bold uppercase label dentro de panel) |
| `.ef-stat-cell` + `__value` + `__label` | bloco de stat numérica (GOL/DEF/MEI/ATA) |
| `.ef-text-{accent,info,primary,danger,muted,main}` | inline `color: '#...'` mapeado a tokens |
| `.ef-progress[--xs,--sm]` + `__fill[--accent,--info,--danger]` | barra de progresso fina (4-6px, sem gradient) |
| `.ef-form-chip[--w,--d,--l]` | chip W/D/L da forma recente |
| `.ef-pos-badge` | pill GOL/DEF/MEI/ATA |
| `.ef-player-name` + `.ef-player-meta` | linha de jogador (Market) |
| `.ef-list-row[--accent,--neutral,--primary]` | row de listagem (Market buy/sell/scout) |
| `.ef-empty-state` | bloco vazio dashed (Market) |
| `.ef-toast-success` | banner verde de feedback (Market) |
| `.ef-legend-chip` | chip de legenda (Standings) |

### Substituições nos 3 components

- **StandingsView**: removida variável local `fontMono`. Toda célula da tabela usa `.ef-mono` + `.ef-text-{cor}`. Legend chips usam `.ef-legend-chip`. Inline `fontFamily: 'Satoshi'` substituído por `.ef-sans`.
- **MarketView**: removida variável local `fontMono`. `fontMono`/`fontFamily` em ~25 sites → classes. Player rows (3 abas) usam `.ef-list-row[--variant]` + `.ef-player-name` + `.ef-player-meta` + `.ef-pos-badge`. Empty states → `.ef-empty-state`. Toast → `.ef-toast-success`. Section headers → `.ef-mono`. Emojis (`✅`, `💰`, `❌`) **removidos** do texto de `setLog()` (já existiam Phosphor icons no toast: `CheckCircle`). Único emoji **mantido**: `r.emoji` (bandeira de região — dado semântico, não decoração; marcado com `aria-hidden`).
- **DashboardView**: sector readout (4 stats) → `.ef-stat-cell`. Form chips W/D/L → `.ef-form-chip[--w|--d|--l]`. 4× barras de progresso → `.ef-progress`. 8× section headers `<div style={{...font-sans bold ...}}>` → `.ef-panel-section-label[--strong]`.

---

## Validação

```bash
cd /tmp/b31-ui
npm test -- --reporter=dot   # 1076/1076 passing (same as baseline)
npm run lint                 # 0 errors, 120 warnings (same as baseline)
npm run build                # clean ~1.2s; initial chunk 380KB (gzip 111KB)
```

### Métricas

| Métrica | Baseline | Pós-SPEC-170 |
|---------|----------|--------------|
| Tests passing | 1076/1076 | 1076/1076 |
| Lint errors | 0 | 0 |
| Lint warnings | 120 | 120 |
| Build time | ~1.2s | ~1.2s |
| Inline `fontFamily:` em DashboardView | 76 | 61 (−15) |
| Inline `fontFamily:` em MarketView | 6 | 0 (−6) |
| Inline `fontFamily:` em StandingsView | 3 | 0 (−3) |
| Inline `style={{...}}` blocks DashboardView | 150 | 140 (−10) |
| Inline `style={{...}}` blocks MarketView | 70 | 52 (−18) |
| Inline `style={{...}}` blocks StandingsView | 44 | 36 (−8) |
| Emojis decorativos em texto (`setLog`) | `✅` `💰` `❌` (3) | removidos (0) |
| Total inline blocks removed | — | **−36** |
| Total fontFamily inline removed | — | **−24** |

### Forbidden

- ❌ Mudar comportamento de qualquer função/handler (ex: `confirmSell`, `handleBuy`).
- ❌ Mexer em outros components fora dos 3 listados.
- ❌ Adicionar dependências novas.
- ❌ Remover `r.emoji` (é dado, não decoração) — apenas marcar com `aria-hidden`.
- ❌ Mexer em `var(--font-mono)` / `var(--font-sans)` em outros components (não estão definidos como CSS vars, mas isso é débito conhecido — não escopo desta SPEC).

---

## Pattern doc — para B3.1 continuação (outros components)

Para próximas PRs que estendam B3.1 aos outros ~17 components:

### Receita (por component)

1. **Ler** o component inteiro. Identificar todos `style={{...}}` inline.
2. **Categorizar** os inline styles em 3 buckets:
   - **(a) Reutilizáveis** (padrão idêntico em ≥2 lugares) → extrair para classe em `luxury-arcade.css`, usando os tokens canônicos.
   - **(b) Únicos mas tematizáveis** (cor, padding, font diferentes mas que mapeiam a tokens) → adicionar `className="ef-mono ef-text-X"` e deixar apenas o que é dinâmico no inline.
   - **(c) Verdadeiramente únicos** (e.g. `backgroundImage: url(...)`, dimensões one-off) → deixar inline.
3. **Trocar emojis decorativos** (🏆 ⚽ 💰 etc) por componentes Phosphor importados. Manter emojis **semânticos** (bandeira de região, dado vindo da engine) com `aria-hidden`.
4. **Verificar** que `.ef-btn`, `.ef-panel`, `.ef-mono`, `.ef-sans`, `.ef-text-X`, `.ef-progress`, `.ef-list-row`, `.ef-stat-cell`, `.ef-form-chip`, `.ef-pos-badge`, `.ef-panel-section-label`, `.ef-empty-state`, `.ef-toast-success`, `.ef-legend-chip` cobrem o caso. Se não, adicionar nova classe ao apêndice "B3.1 UI Consistency Utilities".
5. **Rodar** `npm test`, `npm run lint`, `npm run build` — todos verde. Se um deles regredir, reverter a alteração ofensora.
6. **Atualizar** a tabela "Métricas" desta SPEC ou criar SPEC-171 (continuação).

### Mapeamento canônico (cores → classes)

| Cor inline (hex) | Classe canônica | Token |
|------------------|----------------|-------|
| `#FFD700`, `#FBBF24` | `.ef-text-accent` | `var(--accent)` |
| `#39FF14`, `#10B981` | `.ef-text-primary` | `var(--primary)` |
| `#FF3333`, `#EF4444` | `.ef-text-danger` | `var(--danger)` |
| `#40BAF7`, `#3B82F6` | `.ef-text-info` | (não tokenizado — `#40BAF7` literal) |
| `#8E9E94`, `#94A3B8` | `.ef-text-muted` | `var(--text-muted)` |
| `#FDFBF7`, `#FFFFFF` | `.ef-text-main` | `var(--text-main)` |

### Anti-pattern (a evitar)

- **Variable local `const fontMono = { fontFamily: ... }`** + `...fontMono` em cada `style={{}}`. Substituir por `className="ef-mono"`.
- **Spread `...fontMono` + override `color`** → `className="ef-mono ef-text-X"` (composable).
- **Re-implementar barra de progresso** com `width: '100%', height: '6px', background: ..., overflow: 'hidden'` → usar `.ef-progress .ef-progress--sm`.

### Débito conhecido (não tratado nesta SPEC)

1. `var(--font-mono)` / `var(--font-sans)` são referenciados em ~10 components mas **não estão definidos** como CSS vars no `:root`. O fallback (sem CSS var) usa font do `body`. Sugestão: SPEC-171 adiciona definição em `:root` apontando para os tokens `--ef-font-family-mono` / `--ef-font-family-body`.
2. Sidebar.jsx tem 100+ linhas de inline style com hover handler manual em JS — candidato a próximo slice (B3.1 #4).
3. SquadView, MatchView, PressView, PlayerDashboardView ainda têm `fontMono` local pattern.

---

## Resultado

✅ 3 components mais visíveis (Dashboard, Market, Standings) padronizados sob SPEC-163.
✅ Novas classes utilitárias documentadas em CSS (apêndice "B3.1 UI Consistency Utilities").
✅ Pattern reprodutível para B3.1 #4..#20 (1-2h cada com base nesta receita).
✅ Zero regressão funcional ou de testes.

> **Nota Akita**: esta SPEC é **retroativa parcial** — partial slice de Bloco 3.1. Justificável porque B3.1 inteiro está dentro do Foundation-First (BLOCO 1) e a SPEC documenta o pattern para continuação. Não é vibe coding (existe critério mensurável + harness).
