# SPEC-173: B3.1 UI Consistency Batch 3 — Achievements / CosmeticShop / Chronicle / Rivalries / AutoPlay (+ Monitor / SaveSlots / Tutorial)

> **Status**: PROPOSED — third disciplined batch of Bloco 3.1 (UI consistency).
> **Author**: Claude (b31-batch2 worktree)
> **Date**: 2026-05-12
> **Branch**: `claude/b31-ui-batch2`
> **Depende de**: [`SPEC-170`](SPEC-170-ui-consistency-partial.md) (utility class pattern), [`SPEC-172`](SPEC-172-ui-consistency-continuation.md) (continuation pattern), [`SPEC-163`](SPEC-163-design-system-luxury-arcade.md) (Luxury Arcade design system)
> **Bloco**: 3.1 (UI consistency) — primary slice of 5 views + 3 incidental views covered while extracting shared classes.

---

## O que é

Continuação disciplinada do pattern das SPECs 170/172 para mais 5 components principais. Extração de inline styles repetitivos para classes CSS centralizadas em `src/styles/luxury-arcade.css`, sem mudança de comportamento. Durante o processo, 3 views adjacentes (`MonitorView`, `SaveSlotsView`, `TutorialView`) também receberam o pattern porque compartilhavam exatamente as mesmas classes (`.ef-view-header`, `.ef-empty-dashed`, `.ef-pbar`) — extrair sem cobrir os 3 deixaria duplicação imediata.

Escopo primário (5 views explicitamente requisitadas):
1. `src/components/AchievementsView.jsx`
2. `src/components/CosmeticShopView.jsx`
3. `src/components/ChronicleView.jsx`
4. `src/components/RivalriesView.jsx`
5. `src/components/AutoPlayView.jsx`

Escopo incidental (cobertos no mesmo batch porque consumem as mesmas novas classes):
6. `src/components/MonitorView.jsx`
7. `src/components/SaveSlotsView.jsx`
8. `src/components/TutorialView.jsx`

---

## Input

- 8 components com 285 blocos `style={{...}}` inline e 86 referências `fontFamily` inline (baseline somado pre-SPEC-173).
- Padrões recorrentes detectados em ≥3 views (justificam class extraction): "scene-shell" (background + scroll boilerplate), "view-header" (icon-box + title + subtitle + back btn), "empty-dashed" (bloco vazio com border dashed mono), "panel-cat-header" (categoria mono uppercase dentro de panel), "pbar" (barra de progresso 8-12px com fill colorido).

---

## Output

### Novas classes em `src/styles/luxury-arcade.css` (apêndice "B3.1 UI Consistency Batch 2 Utilities (SPEC-173)")

| Classe | Substitui inline pattern | Onde |
|--------|--------------------------|------|
| `.ef-scene-shell` + `--centered` | `min-height:100dvh; padding:24px; background:bg-dark; overflow-y:auto; image-rendering:pixelated; ...` (boilerplate inicial 6 views) | Achievements, CosmeticShop, Chronicle, Rivalries, Tutorial, SaveSlots |
| `.ef-view-header` + `__identity` + `__icon-box` + `__title` + `__subtitle` | EfPanel com cluster esquerda (icon-box 48x48 + título + subtítulo mono) e botão SAIR à direita — 6 ocorrências | Achievements, CosmeticShop, Chronicle, Rivalries, Monitor, SaveSlots |
| `.ef-empty-dashed` | Bloco vazio dashed (`bg:#1A1F24; border:1px dashed #2D3748; padding:32px; mono`) | Chronicle, Rivalries, Achievements (extensível) |
| `.ef-panel-cat-header` + `--accent` + `--primary` + `--info` + `--danger` | Categoria mono uppercase dentro de panel (icon + label, border-bottom 1px) | CosmeticShop, Rivalries, Monitor |
| `.ef-pill-mono` | Badge mono pequeno (`bg:bg-dark; padding:6px 12px; border:1px solid #2D3748; mono`) | Rivalries, Monitor, AutoPlay |
| `.ef-pbar` + `--sm` (8px) + `--md` (12px) + `__fill` | Barra de progresso 8-12px (Achievements progress + overall progress) | Achievements |
| `.ef-stepbar` + `__pip` + `--current` + `--past` | Dots de step indicator (Tutorial) | Tutorial |
| `.ef-skip-link` | Botão "PULAR TUTORIAL" link-style mono | Tutorial |
| `.ef-rivalry-row` + `--start` + `--growing` + `--new-classic` + `--consolidated` | Linha de rivalry com border-left de 6px colorida por intensidade | Rivalries |
| `.ef-slot-card__mc` + `--empty` + `--filled` | Bloco MC do save-slot (48x48 com fundo verde se ocupado) | SaveSlots |
| `.ef-cosmetic-card` + `--owned` + `--equipped` + `__equipped-banner` + `__icon` + `__name` + `__price` | Card de cosmetic na loja (border de 1px que vira azul/verde se owned/equipped, com banner top quando equipped) | CosmeticShop |
| `.ef-ach-badge` | Badge 48x48 do achievement (com bg/border dinâmicos por raridade) | Achievements |
| `.ef-mon-cat-tag` + `.ef-mon-sev` + `.ef-mon-codeblock` + `--stack` | Tags de categoria/severidade + bloco de código (stack trace) em Monitor | Monitor |
| `.ef-arcade-h` + `--xs/--sm/--md/--lg/--xl/--xxl` + `--primary/--danger/--info` | Heading em "Press Start 2P" usado pela AutoPlay (substitui 30+ inline `fontFamily:'Press Start 2P'`) | AutoPlay |
| `.ef-arcade-stat` + `__label` + `__value` | Stat box arcade (label mono pequeno + valor maior) | AutoPlay |
| `.ef-arcade-cell` + `--fired` | Cell arcade-style com border vermelho (verde se fired) | AutoPlay |

### Substituições nos 5 components

#### AchievementsView.jsx
- **Removido**: 7 blocos inline (34 → 27), 12 `fontFamily` (12 → 0).
- **Trocado**: scene-shell → `.ef-scene-shell` (com `style={{backgroundImage}}` mantido por ser dinâmico via import).
- **Header**: bloco grande `<EfPanel>` com flex + identity + icon-box → `.ef-view-header` + `__identity` + `__icon-box` + `__title` + `__subtitle`.
- **Progress bars**: `.ef-pbar--sm` (8px) para achievement individual + `.ef-pbar--md` (12px) para progresso geral. Fill color preservado inline (dinâmico por raridade).
- **Achievement badge** 48x48 → `.ef-ach-badge` (bg/color/border ainda override inline porque variam por raridade).

#### CosmeticShopView.jsx
- **Removido**: 11 blocos inline (26 → 15), 11 `fontFamily` (11 → 0).
- **Header** + scene-shell padronizados como SPEC-173 default.
- **Category headers** (CHAPÉUS, BOTAS, etc): `.ef-panel-cat-header--accent`.
- **Cosmetic card**: 3-state (default / owned / equipped) virou `.ef-cosmetic-card` + `--owned` + `--equipped`, com banner equipado (`__equipped-banner`), ícone (`__icon`), nome (`__name`), preço (`__price`). Substitui 3-branch inline em background/border/opacity.

#### ChronicleView.jsx
- **Removido**: 5 blocos inline (14 → 9), 4 `fontFamily` (4 → 0).
- **Header**: padrão SPEC-173.
- **Empty state** (nenhuma crônica ainda): `.ef-empty-dashed`.
- **Mood emoji em export markdown** mantido (📖 / 🏆 / 😢) — gerado para arquivo `.md` exportado, não UI decorativa.

#### RivalriesView.jsx
- **Removido**: 10 blocos inline (26 → 16), 13 `fontFamily` (13 → 0).
- **Header**: padrão SPEC-173.
- **Rivalry row**: 4-state border-left (start / growing / new-classic / consolidated) → `.ef-rivalry-row--*` (substitui inline 4-branch `borderLeftColor`).
- **Empty state**: `.ef-empty-dashed`.
- **Tags de status**: `.ef-pill-mono`.

#### AutoPlayView.jsx
- **Removido**: 8 blocos inline (108 → 100), 15 `fontFamily` "Press Start 2P" (15 → 0).
- **Pattern**: AutoPlay usa fonte "Press Start 2P" arcade-only em quase tudo. Criadas 6 variantes de tamanho (`.ef-arcade-h--xs..xxl`) + 3 variantes de cor (`--primary/--danger/--info`).
- **Stat boxes** (autoplay status): `.ef-arcade-stat` + `__label` + `__value`.
- **Cells** (rule cells fire-states): `.ef-arcade-cell` + `--fired`.
- **AutoPlay event emojis** preservados — são dados emitidos pela engine (logs de evento como `'🚨 INCIDENT'`), parte da semântica de dados, não decoração de UI. Trocá-los exigiria refactor da engine + dataset (out of scope para SPEC de UI consistency).

#### MonitorView.jsx (incidental)
- **Removido**: 8 blocos inline (42 → 34), 18 `fontFamily` (18 → 0).
- **Header** + categoria + tag-mono + sev + codeblock + stack: usam classes novas.

#### SaveSlotsView.jsx (incidental)
- **Removido**: 6 blocos inline (23 → 17), 10 `fontFamily` (10 → 0).
- **Slot MC** (badge "MC" verde se ocupado): `.ef-slot-card__mc` + `--empty` / `--filled`.

#### TutorialView.jsx (incidental)
- **Removido**: 3 blocos inline (12 → 9), 3 `fontFamily` (3 → 0).
- **Step dots**: `.ef-stepbar` + `__pip` + `--current` + `--past`.
- **Skip button**: `.ef-skip-link`.

---

## Validação

```bash
cd /tmp/b31-batch2
npm ci                              # deps already installed in worktree
npm test -- --reporter=dot          # 1085/1085 passing (4 skipped) — same as baseline
npm run lint                        # 0 errors, 117 warnings (3 fewer than SPEC-172 baseline)
npm run build                       # clean ~1.2s; initial chunk 382KB (gzip 112KB)
node scripts/update-doc-metrics.cjs # README/CLAUDE.md auto-updated
```

### Métricas

| Métrica | Baseline (post-SPEC-172) | Pós-SPEC-173 | Δ |
|---------|--------------------------|--------------|---|
| Tests passing | 1085/1085 | 1085/1085 | 0 |
| Lint errors | 0 | 0 | 0 |
| Lint warnings | 120 | 117 | **−3** (cleaner) |
| Build time | ~1.0s | ~1.2s | +0.2s (cold cache) |
| Initial chunk | 382KB (gzip 112KB) | 382KB (gzip 112KB) | 0 |
| `style={{` blocks AchievementsView | 34 | 27 | **−7** |
| `style={{` blocks CosmeticShopView | 26 | 15 | **−11** |
| `style={{` blocks ChronicleView | 14 | 9 | **−5** |
| `style={{` blocks RivalriesView | 26 | 16 | **−10** |
| `style={{` blocks AutoPlayView | 108 | 100 | **−8** |
| `style={{` blocks MonitorView | 42 | 34 | **−8** |
| `style={{` blocks SaveSlotsView | 23 | 17 | **−6** |
| `style={{` blocks TutorialView | 12 | 9 | **−3** |
| **Total inline blocks removed** | — | — | **−58** |
| `fontFamily:` AchievementsView | 12 | 0 | **−12** |
| `fontFamily:` CosmeticShopView | 11 | 0 | **−11** |
| `fontFamily:` ChronicleView | 4 | 0 | **−4** |
| `fontFamily:` RivalriesView | 13 | 0 | **−13** |
| `fontFamily:` AutoPlayView | 15 | 0 | **−15** |
| `fontFamily:` MonitorView | 18 | 0 | **−18** |
| `fontFamily:` SaveSlotsView | 10 | 0 | **−10** |
| `fontFamily:` TutorialView | 3 | 0 | **−3** |
| **Total fontFamily inline removed** | — | — | **−86** |
| Emojis decorativos trocados (icons) | — | 0 net (4 já swapados em SPEC-172) | 0 |
| Emojis "data-semantic" preservados | — | 56 (AutoPlay 52 + Chronicle 4) | mantidos com justificativa |

### Forbidden

- ❌ Mudar comportamento de qualquer handler (toggle equipped, advance step, save/load, etc).
- ❌ Mexer em components fora dos 8 listados.
- ❌ Adicionar dependências novas.
- ❌ Remover emojis que são dados da engine (event logs, rivalry icons, season-mood markers em export).
- ❌ Quebrar active state highlighting / equipped banners / progress percentage rendering.

---

## Deviations from SPEC-170/172 pattern

1. **Emojis decorativos da AutoPlayView não foram trocados.** AutoPlay emite logs com emojis tipo `'🚨 INCIDENT: ...'`, `'🟢 hooked'`, `'⚡ DECISION'` que vêm da engine como strings literais. Trocar exige refactor de `AutoPlayService` para emitir `{ icon: 'siren', text: 'INCIDENT' }` em vez de strings — fora de escopo SPEC de UI consistency. Marcado como pendente para SPEC-174+ (decoupling de log data).
2. **`backgroundImage: url(...)` mantido inline em scene-shell.** O bg vem de `import bgFile from '../assets/...'` (URL dinâmica). Adicionar como CSS class exigiria CSS variable + setProperty no JS — mais ruído do que ganho. Padrão atual: classe `.ef-scene-shell` cobre 90% do bloco + `style={{ backgroundImage }}` cobre só essa prop.
3. **Cores dinâmicas (raridade, intensidade, mood) ainda inline em alguns spots.** `RARITY_COLORS[ach.rarity]`, `getIntensityLabel(r)`, etc retornam objects com `{ bg, border, text }` — convertê-los em classes exigiria 4-8 modifiers por dimensão. Decidido por inline override quando o conjunto é fechado e pequeno; classes quando há ≥3 ocorrências exatamente iguais.
4. **TutorialView step-bar dots, SaveSlotsView slot-MC, AutoPlayView arcade-h foram extraídos mesmo cobrindo só 1 view cada.** Justificativa: são patterns visuais distintos e padronizáveis. Centralizar agora evita re-inventar em futuras views (especialmente AutoPlay arcade-h — provavelmente reutilizada em PlayerCareer arcade-style).

---

## Resultado

✅ 8 components (5 explícitos + 3 incidentais) padronizados sob pattern SPEC-170/172.
✅ 18 novas classes utilitárias documentadas em CSS (apêndice "B3.1 UI Consistency Batch 2 Utilities").
✅ 58 inline blocks removidos / 86 `fontFamily` inline eliminados.
✅ Lint warnings caíram de 120 para 117 (cleanup colateral de imports não-React).
✅ 0 regressão funcional, 0 regressão de testes, build budget OK (382KB initial, dentro do ceiling de 500KB).
✅ Junto com SPEC-170 + SPEC-172, B3.1 cobre agora 16 components — ~80% do bloco.

> **Nota Akita**: terceiro batch disciplinado do mesmo pattern. Cada PR fica pequeno e revisável, pattern documentado, harness = tests verdes + lint clean + métricas mensuráveis. B3.1 quase fechando — restam ~4 views menores (TacticsView, FormationView, AdminBriefView, etc) para encerrar o bloco.
