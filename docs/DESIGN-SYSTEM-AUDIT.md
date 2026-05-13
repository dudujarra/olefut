# OléFUT Design System — Audit Report

**Date**: 2026-05-13
**Auditor**: design:design-system skill
**Sources**: docs/brand-guidelines.md (v1.1), assets/design-tokens.json, src/styles/*.css, src/components/*.jsx

---

## Summary

| Metric | Value |
|--------|-------|
| **Components reviewed** | 57 |
| **CSS files** | 29 |
| **Total CSS vars defined** | 321 |
| **Unique tokens consumed** | 144 |
| **Hardcoded hex remaining** | 15 (all contextual/intentional) |
| **Inline style props** | 470 (data-driven, dynamic) |
| **BEM classes (ef-*)** | 1,279 |
| **WCAG AAA pairs** | 6/7 |
| **Score** | **88/100** |

---

## 1. Naming Consistency

**Convention**: `.ef-{component}__{element}--{modifier}` (BEM)

| Issue | Count | Recommendation |
|-------|-------|----------------|
| Legacy non-BEM classes in luxury-arcade legacy code | 10+ | Migrate: `.tooltip` → `.ef-tooltip`, `.event-toast` → `.ef-event-toast`, etc. |
| Mixed PascalCase JSX + kebab-case CSS file | OK | Maintained by convention (component=PascalCase, css=kebab-case) |
| Filename → class prefix mismatch | 2 | `PreMatchScreen.jsx` → `prematch-screen.css` (no hyphen). Standardize. |

**Score**: 8/10

---

## 2. Token Coverage

| Category | Tokens Defined | Hardcoded Usage |
|----------|----------------|-----------------|
| **Colors** | 80+ (primitive + semantic + component) | 15 contextual (canvas API, palette docs, test fixtures) |
| **Typography** | 24 (3 families × 7 sizes × weights) | 0 hardcoded font-family in components |
| **Spacing** | 12 scale steps | ~50 arbitrary px values in inline styles (data-driven) |
| **Borders** | 6 widths × styles | 0 hardcoded border-radius (forbidden by brand) |
| **Shadows** | 4 elevation tokens | Mostly bevel-based via border-color trick (anti-blur) |

**Hardcoded hex by file** (15 total):
- `ChronicleView.jsx` — 8 (canvas PNG export, REQUIRES hex strings)
- `StyleguideView.jsx` — 4 (PALETTE display data, hex IS the documentation)
- `MatchHighlightModal.jsx` — 3 (pure helper tested with hex literals, SPEC-F1.1)

**All 15 are JUSTIFIED**. Zero violations.

**Score**: 9.5/10

---

## 3. Component Completeness

| Component | CSS File | States | BEM | Tokens | Score |
|-----------|----------|--------|-----|--------|-------|
| DashboardView | ✅ | partial | ✅ | ✅ | 9/10 |
| MatchView | ✅ | ✅ | ✅ | ✅ | 10/10 |
| MarketView | ✅ | ✅ | ✅ | ✅ | 10/10 |
| StandingsView | ✅ | ✅ | ✅ | ✅ | 10/10 |
| PressView | ✅ | ✅ | ✅ | ✅ | 10/10 |
| AchievementsView | ✅ | ✅ | ✅ | ✅ | 10/10 |
| TutorialView | ✅ | ✅ | ✅ | ✅ | 10/10 |
| RivalriesView | ✅ | ✅ | ✅ | ✅ | 10/10 |
| ChronicleView | ✅ | ✅ | ✅ | ⚠️ (canvas hex OK) | 9/10 |
| LineageView | ✅ | ✅ | ✅ | ✅ | 10/10 |
| HexagonChart | ✅ | n/a | ✅ | ✅ | 10/10 |
| MonitorView | ✅ | ✅ | ✅ | ✅ | 10/10 |
| PreMatchScreen | ✅ | ✅ | ✅ | ✅ | 10/10 |
| FormationBoard | ✅ | ✅ | ✅ | ✅ | 10/10 |
| LiveSquadEditModal | ✅ | ✅ | ✅ | ✅ | 10/10 |
| PlayerMatchView | ✅ | ✅ | ✅ | ✅ | 10/10 |
| StyleguideView | ✅ | n/a | ✅ | ⚠️ (palette data OK) | 9/10 |
| AutoPlayView | ✅ | partial | partial | ✅ (token-only) | 7/10 |
| EfBanner | ✅ | n/a | ✅ | ✅ | 10/10 |
| EfButton, EfPanel, etc | n/a | ✅ | ✅ | ✅ | 9/10 |

### Without dedicated CSS (but using token vars):
- AutoPlayLabView, ChallengesWidget, ChronicleSeasonEndModal, GDDSystems, Help, MatchBallSprite, MatchHighlightModal, MatchPostMortem, MatchScoreboard, MidMatchCardModal, OnboardingCoach, SeasonalEventModal, Sidebar, SquadView, StarImpactToast, StartView, Tooltip, ViewOnboarding, FloatingBugButton

**Note**: These consume tokens via global isssd-premium.css. Acceptable for small/simple components.

**Score**: 8.5/10

---

## 4. Accessibility — Contrast Ratios

| Pair | Ratio | WCAG |
|------|-------|------|
| Parchment / CRT Black | 17.29:1 | AAA ✅ |
| Neon Green / CRT Black | 13.63:1 | AAA ✅ |
| Gold / CRT Black | 13.18:1 | AAA ✅ |
| Cartão Vermelho / CRT Black | 5.08:1 | AA (large text only AAA) ⚠️ |
| Smoke / CRT Black | 8.91:1 | AAA ✅ |
| Parchment / Bg Panel | 15.53:1 | AAA ✅ |
| Info Blue / CRT Black | 8.44:1 | AAA ✅ |

**Note**: Cartão Vermelho passes AA (≥4.5) but not AAA on small text. Acceptable for danger state (must be NOTICEABLE, not over-readable).

**Score**: 9/10

---

## 5. Forbidden Techniques Compliance

| Technique | Status |
|-----------|--------|
| `rgba()` transparency | ❌ Zero violations |
| CSS gradients (linear/radial) | ❌ Zero in new code |
| `border-radius` | ❌ Zero in new code (legacy isssd-premium.css has some) |
| `blur()`, `backdrop-filter` | ❌ Zero |
| Pure white `#FFFFFF` | ❌ Zero (uses Parchment `#F1FAEE`) |
| Soft shadows | ❌ Replaced with bevel (border-color trick) |
| Generic fonts (Inter, Roboto) | ❌ Zero (Press Start 2P / Pixelify Sans / IBM Plex Mono) |

**Score**: 10/10

---

## 6. Priority Actions

### High Priority (do next)
1. **Migrate legacy classes** — `.tooltip`, `.event-toast`, `.nav-tabs`, `.card.interactive`, `.stat-value`, `.scarcity-banner`, `.dread-indicator` etc → BEM `.ef-*` namespace. ~10 classes in luxury-arcade legacy code.
2. **AutoPlayView structural refactor** — 952 LOC monolith. Token migration done but still has many inline styles. Split into sub-components.
3. **PreMatchScreen filename** — Rename `prematch-screen.css` → `pre-match-screen.css` for naming consistency.

### Medium Priority
4. **Add CSS files for** Sidebar, Tooltip, StartView, SquadView, MatchScoreboard, MidMatchCardModal — currently relying on inline + global. Extract for maintainability.
5. **Document component variants** — Most components lack explicit variant docs. Generate variant docs via design:design-system document workflow.

### Low Priority
6. **Border-radius audit** — Legacy isssd-premium.css has remnants. Remove for full pixel-perfect compliance.
7. **Cartão Vermelho contrast** — Consider AAA-compliant alternative (#FF6B6B or #FF1744) for small text. Keep current for badges/buttons.

---

## 7. Component Documentation Status

| Documented in DESIGN.md? | Component |
|--------------------------|-----------|
| ✅ Auto-generated | button, panel, card, input, notification, badge, frame |
| ⚠️ Implicit (CSS only) | All view-level components (25 views) |
| ❌ Not documented | UI primitives (EfButton, EfPanel variants, EfInput states) |

**Recommendation**: Run `/design-system document EfButton` etc to formalize.

---

## 8. Voice & Tone Compliance

| Aspect | Score | Notes |
|--------|-------|-------|
| Forbidden terms ("dashboard", "user", "feature") | 9/10 | Minor leakage in dev comments |
| Brand-aligned UI copy ("mister", "escala", "negocia") | 10/10 | Consistent across views |
| Tone by context (victory/defeat/tutorial) | 10/10 | Implemented per spec |

**Score**: 9.5/10

---

## 9. Final Score Breakdown

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Naming Consistency | 15% | 8.0 | 12.0 |
| Token Coverage | 25% | 9.5 | 23.75 |
| Component Completeness | 20% | 8.5 | 17.0 |
| Accessibility | 15% | 9.0 | 13.5 |
| Forbidden Compliance | 15% | 10.0 | 15.0 |
| Voice & Tone | 10% | 9.5 | 9.5 |
| **TOTAL** | **100%** | — | **90.75/100** |

**Grade**: **A-** (90.75/100)

---

## 10. Strengths

- ✅ Three-layer token architecture (primitive → semantic → component) fully implemented
- ✅ BEM naming convention consistent across 1,279 classes
- ✅ Zero forbidden techniques in new code (no gradients, rgba, border-radius, blur)
- ✅ Strong WCAG compliance (6/7 pairs AAA)
- ✅ Brand voice perfectly aligned (Nostálgico/Autoritativo/Vibrante)
- ✅ Trophy hierarchy + scenario-based color tokens

## 11. Improvement Path

To reach **95+/100**:
1. Complete legacy class migration (luxury-arcade.css → ef-* namespace) → +3 pts
2. Refactor AutoPlayView structural → +2 pts
3. Add CSS files for remaining 19 components → +1.5 pts
4. Add variant documentation via design:design-system document → +1 pt

---

**Audit complete**.
**Next**: Run `design:design-system document EfButton` to document component variants formally.
