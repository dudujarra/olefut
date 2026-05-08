# Stitch v3-SNES — Gemini 3 Flash + Pacaembu Palette

**Project ID:** `5927806759385939253`
**Design System:** `assets/9225466913965936462`
**Theme:** ELIFOOT v2.0 SNES Soccer Brasileiro Moderno
**Generated:** 2026-05-08

## Screens

| Screen | Status | File |
|--------|--------|------|
| Dashboard | ✅ Generated | dashboard.html / dashboard.png (project anterior `3610899650470989220`) |
| Match Live | ✅ Generated | match.html / match.png |
| Squad | ✅ Generated | squad.html / squad.png |
| Hall de Lendas | ✅ Generated | hall.html / hall.png |
| Crônica do Save | ✅ Generated | cronica.html / cronica.png |
| StartView | ✅ Generated | startview.html / startview.png |
| PlayerDashboard | — pending | — |
| PlayerMatch | — pending | — |

## Match Live Screenshot Notes

Stitch correctly rendered:
- Pixel-art top-down 2D pitch
- Scoreboard 1-0 minute 72'
- Right sidebar: speed buttons (1x/3x/5x/PAUSE), tactic 4-3-3, subs 2/3
- Narration log: 68' yellow card, 70' substituição, 72' GOL HOME
- Verde Pacaembu palette
- Beveled 2px borders

## Design System Tokens

```
displayName: ELIFOOT SNES v2.0
colorMode: DARK
colorVariant: VIBRANT
customColor: #2D5A3D (Pacaembu)
overridePrimary: #6ABC3A (success)
overrideSecondary: #F7B538 (warning)
overrideTertiary: #7B2CBF (mute lendário)
overrideNeutral: #0F1A14 (bg infill)
headlineFont: ANTON
bodyFont: IBM_PLEX_SANS
roundness: ROUND_TWO (2px borders)
```

## Notes per asset

- **Dashboard**: project anterior `3610899650470989220`. Reference for header/balance/tabs.
- **Match**: top-down 2D pitch + scoreboard + sidebar speed/tactic/subs + narration log. Reference for MatchView refactor.
- **Squad**: tabela jogadores + formação preview left panel. Reference for SquadView tabs+list.
- **Hall de Lendas**: 6 cards lendas grid + faces ASCII + categorias (Idolo/Carrasco/Cria). Reference for SPEC-052 myth layer UI.
- **Crônica**: parchment central com chapters + pixel icons + grid 4x3 conquistas + 3 export buttons. Reference for SPEC-057 chronicle export.
- **StartView**: ELIFOOT Press Start 2P logo + 4 menu buttons (NOVO JOGO/CARREGAR SAVE/MODO JOGADOR/OPCOES) + version footer.

## Próximos passos

1. Apply Match HTML como base pra refactor `MatchView.jsx` (66 inline styles → 0)
2. Apply Squad refs pra SquadView
3. Generate PlayerDashboard + PlayerMatch SNES (v1.2 player mode)
4. Apply em `src/components/<View>.jsx` mantendo Stitch UI library

## Comparativo v2 vs v3

| | v2 (8-bit NES) | v3 (SNES) |
|---|---|---|
| Borders | hard 4px chunky | beveled 2px soft |
| Fonts | Press Start 2P body | Pixelify Sans body |
| Palette | NES 8 cores | SNES 24 cores |
| Pitch | placeholder | top-down 2D pixel-art |
| Densidade | low | high (ISS-style) |
