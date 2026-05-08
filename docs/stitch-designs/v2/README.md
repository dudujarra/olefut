# Stitch v2 — Gemini 3 Flash redesign (2026-05-08)

Project: `15832734057756371692` ELIFOOT 8-bit Football Manager
Model: GEMINI_3_FLASH
Theme: NES-era retro + football palette (grass/leather/lines/cards)

## Screens

| Screen | ID | HTML | PNG | Applied |
|--------|----|----|-----|---------|
| Dashboard | b175f2d770ca406c8550c5eb3b763a72 | dashboard.html | dashboard.png | ✅ status-footer + tokens |
| Match Live | 63622239429d40a693cc9a21f3601b1f | match.html | match.png | ⏳ tokens disponíveis |
| Squad Mgmt | facb042b65b444e083dc6d6e2991c2f7 | squad.html | squad.png | ⏳ tokens disponíveis |

## Tokens novos em `src/styles/8bit-theme.css`

- `.retro-border` — universal black border 4px + offset shadow
- `.stat-card-v2` — pitch-green panel + bar progress (dashboard stats)
- `.nav-tab-v2` — translate-y[4px] active state
- `.status-footer` — liga/rodada/build status bar
- `.event-row-v2` — left accent border (lesão/treino/patrocínio)
- `.finance-row` — saldo/salários/receita rows
- `.finance-row.balance` — black bg + 4px green border highlight
- `.mini-chart` + `.mini-chart .bar` — finance history graph

## Apply roadmap

1. ✅ DashboardView: `.status-footer` no rodapé com LIGA/RODADA/TEMP/BUILD
2. ⏳ MatchView: replace narration log com `.bg-pitch-green retro-border` + speed buttons
3. ⏳ SquadView: filter bar v2 + table rows com `.event-row-v2` style
4. ⏳ App.jsx: tab nav usar `.nav-tab-v2` quando theme=8bit

## Notas

- Stitch generate timeout 1x em match (retried com prompt menor — funcionou)
- Squad generate first-try success (prompt curto + claro)
- Build size: 25.10 kB CSS / 395 kB JS (mantido)
- Tests: 628/628 passed após apply
