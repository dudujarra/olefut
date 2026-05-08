# SPEC-040: Tema 32-bit SNES

**Status**: IMPLEMENTADO (v1.0 Sprint 1)
**Versão**: 1.0
**Owner**: Dudu

## O que é

Terceiro tema visual ELIFOOT inspirado em SNES (16-bit / "32-bit" era), entre os temas modern (default) e 8-bit (NES). Cycle tri-state: 🎨 modern → 🕹️ 8-bit → 🎮 32-bit → 🎨.

## Input

- Body class: `theme-32bit`
- localStorage key: `elifoot_theme` (valores: `modern`|`8bit`|`32bit`)
- Toggle: header button cycle (App.jsx `cycleTheme()`)

## Output

CSS variables + classes scoped sob `body.theme-32bit`:
- 24 cores (5 grass + 3 leather + 3 sky + 6 acentos + 7 utility)
- Helpers: `.snes-border`, `.snes-card`, `.snes-button` (beveled outer-light/inner-dark + drop-shadow soft)
- Fonts: Pixelify Sans (headings), Courier Prime (body), IBM Plex Mono (stats)
- Min font-size floor: 0.85rem
- Image-rendering: crisp-edges (não pixelated agressivo)
- Subtle CRT scanlines (mais sutil que 8-bit)

## Validação

1. ✅ Build pass (43.28 KB CSS / 407 KB JS)
2. ✅ Tests pass (628/628)
3. ✅ Theme switch persists em localStorage
4. ✅ No regressão em modern/8-bit themes
5. ⏳ Visual smoke test 7 views × 3 themes = 21 screens (manual)

## Forbidden

- ❌ Pixel-art chunky NES style (use 8-bit theme)
- ❌ Hard-offset shadow (use soft drop-shadow)
- ❌ Font-size < 0.85rem em texto crítico
- ❌ Hardcoded colors em components (usar tokens)

## Files

- `src/styles/32bit-theme.css` (novo, ~430 linhas)
- `src/App.jsx` (theme tri-state state + cycleTheme())
- `src/index.css` (import + scoped tooltip variants)
