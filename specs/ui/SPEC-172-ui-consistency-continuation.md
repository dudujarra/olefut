# SPEC-172: B3.1 UI Consistency Continuation — Sidebar / Squad / Match / Press / PlayerDashboard

> **Status**: PROPOSED — continuation slice of Bloco 3.1 (5 views).
> **Author**: Claude (b31-cont worktree)
> **Date**: 2026-05-12
> **Branch**: `claude/b31-ui-continuation`
> **Depende de**: [`SPEC-170`](SPEC-170-ui-consistency-partial.md) (parent pattern + utility classes), [`SPEC-163`](SPEC-163-design-system-luxury-arcade.md) (Luxury Arcade design system)
> **Bloco**: 3.1 (UI consistency) — 5 views (continuation after SPEC-170 covered Dashboard/Market/Standings).

---

## O que é

Continuação disciplinada do pattern documentado em SPEC-170 para mais 5 components. Extração de inline styles repetitivos para classes CSS centralizadas em `src/styles/luxury-arcade.css`, sem mudança de comportamento.

Escopo:
1. `src/components/Sidebar.jsx` — 100+ LOC inline + JS hover handler
2. `src/components/SquadView.jsx`
3. `src/components/MatchView.jsx`
4. `src/components/PressView.jsx`
5. `src/components/PlayerDashboardView.jsx`

---

## Input

- Estado atual: 5 components com 409 `style={{...}}` blocos inline (Sidebar 6, Squad 105, Match 161, Press 30, PlayerDashboard 107).
- 159 referências `fontFamily` inline (Sidebar 2, Squad 32, Match 67, Press 14, PlayerDashboard 44).
- Sidebar com `onMouseEnter`/`onMouseLeave` handlers JS para hover state.
- Pattern canônico: SPEC-170 (utility classes `.ef-mono`, `.ef-sans`, `.ef-text-{accent,info,primary,danger,muted,main}`, `.ef-list-row`, `.ef-pos-badge`, `.ef-stat-cell`, etc).

---

## Output

### Novas classes utilitárias em `src/styles/luxury-arcade.css` (apêndice "B3.1 UI Consistency Continuation Utilities (SPEC-172)")

| Classe | Substitui inline pattern | Onde |
|--------|--------------------------|------|
| `.ef-sidebar` + `__inner` + `__mode` + `__item` + `__item--active` + `__icon` + `__label` | Toda inline + hover JS handler (`onMouseEnter`/`onMouseLeave`) → CSS `:hover` | Sidebar |
| `.ef-view-shell` + `--fixed` | `padding:24px; width:100%; min-height:100dvh; background:bg-dark; overflow-y:auto` (boilerplate inicial de view) | Squad, Match, PlayerDashboard |
| `.ef-view-container` + `--wide` + `--narrow` | `max-width:{800,1000,1200}; margin:0 auto; display:flex; flex-direction:column; gap:24px` | Todas |
| `.ef-section-header` | `<div style={{display:flex, align:center, gap:8, mb:16, font-sans, color:text}}><Icon/><h3 style={{m:0,fontSize:1.1}}>...</h3>` | Squad, Match, PlayerDashboard |
| `.ef-heading-xl` | `<h2 style={{font-sans, fontSize:2rem, weight:800, m:'0 0 8 0', color:#FDFBF7}}>` | Squad, PlayerDashboard |
| `.ef-tag-mono` + `--info` + `--accent` | Inline ícone + label mono uppercase com bg muted | Squad, PlayerDashboard |
| `.ef-sector-grid` + `.ef-sector-cell` + `__value` + `__value--lg` + `__label` | 4-column setores (GOL/DEF/MEI/ATA) | Match |
| `.ef-match-log-row` + `--goal` + `--card` + `--sub` + `--injury` + `__min` | Linha de evento na narração ao vivo (com classes por tipo) | Match |
| `.ef-score-box` + `--sm` + `__num` + `__num--md` + `__sep` + `__sep--sm` | Placar grande (scoreboard/half/fulltime) | Match |
| `.ef-clock` + `__time` + `__time--playing` + `__dot` | Display do minuto + pulse vermelho | Match |
| `.ef-stat-line` + `__label` + `__value` | Linha "label : valor" full-time stats | Match |
| `.ef-input` + `--search` + `.ef-select` + `.ef-search-wrap` + `__icon` | Search box + filtros position/sort | Squad |
| `.ef-st-toggle` + `--active` + `--disabled` | Checkbox-quadrado de titular/reserva | Squad |
| `.ef-health-pip` + `.ef-health-row` | 5-pip indicator de energia | Squad |
| `.ef-icon-btn` + `--info` + `--danger` | Botão pequeno emprestar/vender | Squad |
| `.ef-action-slot` + `--filled` | Pip de action slot do player | PlayerDashboard |
| `.ef-bar` + `--xs` + `__fill` + `--info` + `--accent` + `--danger` | Barra de progresso fina (XP/relacionamento) | PlayerDashboard |
| `.ef-press-option` + `__letter` + `__text` | Botão de resposta de coletiva (A/B/C/D) | Press |
| `.ef-shop-card` + `--owned` + `--disabled` | Card de trait/lifestyle na loja | PlayerDashboard |
| `.ef-overview-cell` + `__value` + `__label` | Stat compacto na barra superior (ENERGIA/STRESS/ENERGÉTICOS) | PlayerDashboard |
| `.ef-step` + `--active` + `--done` + `__bubble` | Step indicator do pre-match wizard | Match |

### Substituições nos 5 components

#### Sidebar.jsx
- **Removido**: bloco `colors` local (10 props), `onMouseEnter`/`onMouseLeave` handlers em cada item.
- **Trocado**: emojis `⚽ 🧑‍💼` no rótulo de modo → ícones Phosphor `SoccerBall` / `IdentificationBadge` com `aria-hidden`.
- **Hover**: agora 100% CSS via `.ef-sidebar__item:hover` (sem re-render por mouseEnter).
- **Active state**: preservado via class `ef-sidebar__item--active`.

#### SquadView.jsx
- **Removido**: 17 `fontFamily: 'var(--font-mono)'` + 15 `fontFamily: 'var(--font-sans)'` → `.ef-mono` / `.ef-sans` classes.
- **Tabela**: headers usam `.ef-text-{primary,muted}` baseado em sort ativo. Cells de OVR/contrato/wage usam `.ef-mono ef-text-{cor}`.
- **Filtros**: search input + selects de posição/ordenação → `.ef-input ef-input--search` + `.ef-select`.
- **Botões de ação** (loan/sell): `.ef-icon-btn--info` / `.ef-icon-btn--danger`.
- **Toggle titular**: `.ef-st-toggle` + `--active` + `--disabled`.
- **Health blocks**: `.ef-health-pip` + `.ef-health-row` (dinâmico color por threshold preservado inline).
- **Tag treinador**: `.ef-tag-mono ef-tag-mono--info`.

#### MatchView.jsx
- **Removido**: ~30 inline blocks `style={{fontFamily, color, padding, ...}}` em scoreboard, log de partida, half/fulltime, stats.
- **Step indicator** do pre-match: `.ef-step` + `--active` / `--done` + `__bubble` (substitui condicional ternário com 4 props inline cada).
- **Match log**: 4 variantes via `.ef-match-log-row--{goal,card,sub,injury}` ao invés de `if (isGoal) bgColor=...`.
- **Scoreboard**: `.ef-score-box` + `__num` + `__sep`; `.ef-clock` para o relógio com pulse.
- **Sector readout**: `.ef-sector-grid` + `.ef-sector-cell` (4 cells GOL/DEF/MEI/ATA).
- **Full-time stats**: `.ef-stat-line` + `__label` + `__value`.
- **Section headers**: 12 `<div style={...flex...}><Icon/><h3>` → `.ef-section-header`.

#### PressView.jsx
- **Removido**: bloco `colors` local; 14 `fontFamily` inline.
- **Question button**: 4 inline event handlers JS de hover (`onMouseEnter`/`onMouseLeave` mudando border + bg) → CSS `:hover` em `.ef-press-option`.
- **Effect chips** (repercussão): `.ef-text-primary` / `.ef-text-danger` baseado em sinal de `v`.
- **Tipografia mono/sans** padronizada via `.ef-mono` / `.ef-sans`.

#### PlayerDashboardView.jsx
- **RelBar**: barra de relacionamento agora usa `.ef-bar` + `.ef-bar__fill--{danger,accent,info}` ao invés de inline `background:` ternário.
- **Atributos principais**: idem (`.ef-bar` + cor dinâmica `s.color` preserved inline pra não bloquear thematization futura).
- **Action slots**: 5 pips usam `.ef-action-slot` + `--filled`.
- **Status bar**: 3 cells (ENERGIA/STRESS/ENERGÉTICOS) → `.ef-overview-cell` + `__value` + `__label`.
- **Shop cards** (Traits/Lifestyle): `.ef-shop-card` + `--owned` + `--disabled` (ao invés de inline 3-branch `background` + `border` + `opacity`).
- **Emojis decorativos** trocados: `'✓ '` em texto → `<CheckCircle weight="fill" size={14} />` Phosphor. Mantidos com `aria-hidden`: `pers.emoji` (personalidade), `it.emoji` (lifestyle item — dado da engine, não decoração).
- **Tags hero header**: `.ef-tag-mono` + `--accent`.

---

## Validação

```bash
cd /tmp/b31-cont
npm ci
npm test -- --reporter=dot      # 1085/1085 passing (4 skipped) — same as baseline
npm run lint                    # 0 errors, 120 warnings (same as baseline)
npm run build                   # clean ~1.0s; initial chunk 382KB (gzip 112KB)
```

### Métricas

| Métrica | Baseline | Pós-SPEC-172 | Δ |
|---------|----------|--------------|---|
| Tests passing | 1085/1085 | 1085/1085 | 0 |
| Lint errors | 0 | 0 | 0 |
| Lint warnings | 120 | 120 | 0 |
| Build time | ~1.0s | ~1.0s | 0 |
| Initial chunk | ~376KB | 382KB | +6KB (∝ CSS additions) |
| `style={{` blocks Sidebar | 6 | 1 | **−5** |
| `style={{` blocks SquadView | 105 | 88 | **−17** |
| `style={{` blocks MatchView | 161 | 99 | **−62** |
| `style={{` blocks PressView | 30 | 25 | **−5** |
| `style={{` blocks PlayerDashboardView | 107 | 87 | **−20** |
| **Total inline blocks removed** | — | — | **−109** |
| Inline `fontFamily:` Sidebar | 2 | 0 | **−2** |
| Inline `fontFamily:` SquadView | 32 | 0 | **−32** |
| Inline `fontFamily:` MatchView | 67 | 0 | **−67** |
| Inline `fontFamily:` PressView | 14 | 0 | **−14** |
| Inline `fontFamily:` PlayerDashboardView | 44 | 0 | **−44** |
| **Total fontFamily inline removed** | — | — | **−159** |
| `onMouseEnter`/`onMouseLeave` JS handlers | 4 (Sidebar 2 + Press 2) | 0 | **−4** |
| Emojis decorativos trocados | — | 4 (`⚽` `🧑‍💼` em Sidebar mode-label; `✓ ` em PlayerDashboard shop cards) | +4 swaps |

### Forbidden

- ❌ Mudar comportamento de qualquer handler (advanceWeek, handleAnswer, handleBuyTrait, etc).
- ❌ Mexer em components fora dos 5 listados.
- ❌ Adicionar dependências novas.
- ❌ Remover `pers.emoji`, `it.emoji` (vêm da engine — são dados semânticos, marcados `aria-hidden`).
- ❌ Quebrar active state highlighting da sidebar.

---

## Deviations from SPEC-170 pattern

1. **Sidebar `onMouseEnter`/`onMouseLeave` JS → CSS `:hover`**. Cleaner, no re-render per hover. Active state coexiste via `.ef-sidebar__item--active` que sobrescreve hover (mesma cor sempre quando ativo).
2. **PressView option button**: mesma técnica — hover JS handlers convertidos para CSS `:hover` em `.ef-press-option`.
3. **Cor dinâmica em barra de progresso de PlayerDashboardView "ATRIBUTOS PRINCIPAIS"** ficou inline (`style={{ background: s.color }}`) porque cada skill tem cor única no array (`#40BAF7`, `#39FF14`, `#FF3333`, `#FFD700`). Tokenizar isso exigiria 4 `.ef-bar__fill--{technique,pace,power,vision}` ou um lookup — não justifica o ruído pra 4 instâncias. SPEC-170 já tem `--accent`, `--info`, `--danger` se quiser substituir depois.
4. **MatchView log row**: criei 4 modifiers (`--goal`, `--card`, `--sub`, `--injury`) ao invés de generalizar — mantém o mesmo padrão semântico do código original (não generaliza prematuramente).

---

## Resultado

✅ 5 components mais visíveis (Sidebar, Squad, Match, Press, PlayerDashboard) padronizados sob pattern SPEC-170.
✅ 22 novas classes utilitárias documentadas em CSS (apêndice "B3.1 UI Consistency Continuation Utilities").
✅ Eliminado JS hover handler em Sidebar e PressView (CSS-only).
✅ 0 regressão funcional, 0 regressão de testes, 0 regressão de lint.
✅ Junto com SPEC-170, B3.1 cobre agora 8 components / ~20 — ~40% do bloco completo.

> **Nota Akita**: continuação do partial slice SPEC-170 (mesma justificativa: B3.1 inteiro está dentro do Foundation-First / BLOCO 1). Cada PR fica pequeno e revisável, pattern documentado, harness = tests verdes + lint clean + métricas mensuráveis.
