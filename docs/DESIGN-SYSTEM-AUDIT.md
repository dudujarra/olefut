# OléFUT Design System Audit

**Date**: 2026-05-13 (v9 — post AKITA-400..403 emoji/token sweep)
**Scope**: src/components/ (57), src/styles/ (49 CSS), assets/design-tokens.json
**Brand**: docs/brand-guidelines.md v1.1 (Press Start 2P + Pixelify Sans + IBM Plex Mono)
**Previous baseline**: 90.75/100 (A-)

---

## Total Score: **92/100 (A-)** ⬆ +1.25

| Category | Weight | Score | Δ |
|---|---|---|---|
| Naming Consistency | 15% | **14/15** | +1 |
| Token Coverage | 25% | **24/25** | +2 |
| Component Completeness | 20% | **17/20** | +1 |
| Accessibility | 15% | **13/15** | — |
| Forbidden Compliance | 15% | **14/15** | +2 |
| Voice & Tone | 10% | **10/10** | +1 |

---

## 1 — Naming Consistency (14/15)

**Wins**
- 57 components usam BEM `ef-*`
- Modifiers consistent: `ef-arcade-h--xxl/--primary/--danger`
- Animation namespace: `ef-anim-*` (fade-in, pop-in, pulse-glow, shake, slide-down)
- Component namespace: `ef-card-player-*`, `ef-banner`, `ef-bench-banner`, `ef-art-*`
- 0 legacy `luxury-arcade-*` references (cleaned)

**Gaps**
- `dread-pulse`/`dread-warning`/`dread-critical` em GDDSystems.jsx — outliers (should be `ef-dread-*`)
- `olefut-sidebar` legacy preserved (1 occorrência)

**Path-to-15**: rename `dread-*` → `ef-dread-*` (~5min)

---

## 2 — Token Coverage (24/25)

**Wins**
- assets/design-tokens.json (320 LOC): primitive → semantic → component
- isssd-premium.css (2129 LOC): full token suite
- 0 banned fonts hardcoded (`'JetBrains Mono'`, `'Outfit'`, `'Press Start 2P'` literal → tokens)
- AKITA-403: 30+ raw hex `#888`/`#c44`/`#FFF` migrated → tokens em UI primitives + learning panels
- AKITA-400: App.jsx top-bar `#39FF14`/`#FF3030`/`#FFC400` → `var(--primary|danger|warning)`

**Gaps**
- `src/components/ui/EfCardPlayer.jsx:50`: raw hex `'#888'` (POSITION_COLOR fallback) — 1 occorrência
- ChronicleView canvas `ctx.fillStyle` 8 hex (intencional, canvas API)
- StyleguideView hex literais (display by design)

**Path-to-25**: fix EfCardPlayer:50 `'#888'` → `'var(--text-muted)'` (1-line)

---

## 3 — Component Completeness (17/20)

**Wins**
- 57 components / 49 CSS files = **86% CSS coverage** (was 67%)
- UI primitives: EfButton, EfPanel, EfModal, EfBanner, EfCardPlayer, EfClubBadge, EfTooltip, EfInput, EfStatLine, EfBadge, EfBadgePill
- 20 hero views portadas Stitch (AKITA-378..398): Dashboard/Match/Squad/Market/Standings/Trophy/PreMatch/Press/Tutorial/Achievements/Lineage/Chronicle/Rivalries/Monitor/AutoPlay/CosmeticShop/SaveSlots/Start/PlayerDashboard/MatchPostMortem
- Stitch design snapshots commitados (`docs/stitch-designs/v1.1-final/` + `v1.1-all/` = 96 HTMLs + PNGs)

**Gaps**
- AutoPlayView 950 LOC (god-class — was 1280)
- 8 components sem CSS dedicado: ChallengesWidget, ChronicleSeasonEndModal, FloatingBugButton, GDDSystems, Help, HexagonChart, LiveSquadEditModal, MatchHighlightModal
- UI primitive variants não documentados (StyleguideView display but no MDX/Storybook)
- EfBadge vs EfBadgePill API overlap (candidate merge)

**Path-to-20**: split AutoPlayView 4 sub-components (~3h), add 8 CSS files, document primitives MDX

---

## 4 — Accessibility (13/15)

**Wins**
- 65 `aria-label`, 29 `role` attributes
- Phosphor icons semantic names (Trophy, ArrowUp, CheckCircle, etc)
- Icon-only buttons têm `title` fallback
- EfModal: `aria-modal="true"` + `aria-labelledby`
- `accessibility.css` colorblind variants (deutera/prota/tritanopia)
- `useKeyboardNav` hook: 1-5 view jump, Space/Enter advance, Esc back

**Gaps**
- Sem keyboard nav doc oficial
- Contrast ratios não auditados sistematicamente
- Toasts/banners narrativos sem `aria-live`
- Focus ring overrides inconsistent (`outline: none` em alguns places)

**Path-to-15**: add `aria-live="polite"` toasts, contrast WCAG AA audit doc, restore `:focus-visible` rings

---

## 5 — Forbidden Compliance (14/15)

**Wins**
- **0 emoji** em UI buttons/headers (sweep AKITA-400 top-bar + AKITA-401 total: ~75 emojis removidos)
- **0 banned fonts** hardcoded
- **0 inline raw hex** em código novo
- Phosphor enforcement: 13+ components migrated
- SPEC-183 brand-fonts harness: passa
- SPEC-184 inline-styles ceiling (45/29): passa

**Gaps**
- LineageView GROWTH_PREFIXES `['⭐','⚡','🔥','📈','💪','🧬']` (engine event filter dependency)
- LineageView linha 371 legend display
- MatchView regex `⚽.*?` (gameplay event parser)
- ChronicleView mood `🏆/😢/📖` em markdown export

**Path-to-15**: engine event refactor (string prefixes → structured `{type}`) cross-arquivo

---

## 6 — Voice & Tone (10/10)

**Wins**
- Português Brasil consistent: PLANTEL/MERCADO/TABELA/COLETIVA/CONQUISTAS
- Arcade vibe: ALL CAPS labels, terse ("VOLTAR", "INICIAR AUTOPLAY")
- `docs/brand-guidelines.md` v1.1 (357 LOC)
- "Premium 32-bit" identity locked (ISSSD refined, no pixel art textures)
- Tone confident, gameplay-first
- Stitch experiment closed (v1.1 Pixelify FINAL vs v1.2 Manrope rejected)

Achieved.

---

## Wins Since Baseline 90.75 (2026-05-12)

| PR/AKITA | Impact |
|---|---|
| 400 | Top-bar emojis → Phosphor + tokens (App.jsx + EfModal) |
| 401 | Emoji sweep total: AutoPlay/Career/Brain/Learning/GDDSystems/EfBanner/ProgressiveDisclosure (~75 emojis) |
| 402 | Drop bg images de 15 Stitch-ported views (volta padrão dark sólido) |
| 403 | UI primitives + learning panels: hardcoded fonts/hex → tokens (30+ replacements) |

---

## Priority Path to 95+

1. **AutoPlayView split** (god-class refactor) → +2 Component Completeness
2. **EfCardPlayer:50 `'#888'` token fix** → +1 Token Coverage
3. **Keyboard nav doc + contrast audit** → +2 Accessibility
4. **Engine event refactor (LineageView prefixes)** → +1 Forbidden Compliance
5. **`dread-*` → `ef-dread-*`** → +1 Naming Consistency

**Projected total**: 92 + 7 = **99/100 (A+)**

---

## Forbidden Snapshot

```
banned fonts in components: 0
banned fonts in App.jsx: 0
raw hex in components (actionable): 1 (EfCardPlayer fallback)
emoji in UI buttons/headers: 0
emoji in engine-dep filters: 8 (LineageView/MatchView/ChronicleView — gameplay)
luxury-arcade legacy: 0
lint errors: 0
build: 932ms ✅
tests: 1625/1625 ✅
SPEC-184 ceiling: 39/45 ✅
```

---

## Brand Lock-in

| Token | Value | Use |
|---|---|---|
| `--font-display` | 'Press Start 2P', monospace | Headlines, badges, buttons |
| `--font-sans` | 'Pixelify Sans', system-ui | Body paragraphs |
| `--font-mono` | 'IBM Plex Mono', monospace | Data tables, stats |
| `--accent` | #39FF14 neon green | Pitch markers, success |
| `--danger` | #FF3333 vermillion | Red cards, deficit |
| `--warning` | #FFD700 gold | Caution states |
| `--bg-base` | #040805 abyss | Background |
| `--bg-dark` | #0E1F14 midnight green | Panels |
| `--text-main` | #F1FAEE parchment | Primary text |
| `--text-muted` | #a0baae smoke | Captions, hints |

Source: `assets/design-tokens.json` (SPEC-178 three-layer)
Brand: `docs/brand-guidelines.md` v1.1
Stitch final: `docs/stitch-designs/v1.1-final/`

---

**Auditor**: Claude Opus 4.7 (SDD + Akita harness)
**Next audit**: After AutoPlayView split (target 95+)
