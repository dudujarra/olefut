# SPEC-041: Tooltip System Universal

**Status**: IMPLEMENTADO (v1.0 Sprint 1)
**Versão**: 1.0
**Owner**: Dudu

## O que é

Sistema de tooltips reusável para explicar todo elemento interativo do ELIFOOT (stats, botões, badges, traits, tabs). Resolve gap user "TUDO precisa ter explicação no mouse hover".

## Input

- `<Tooltip content="..." position="auto|top|bottom|left|right" delay={300}>{children}</Tooltip>`
- `<Help id="stat.ovr">{children}</Help>` — pulls content from `tooltips.json` by ID

## Output

Tooltip bubble com:
- Posicionamento auto (top default, flip bottom se cramped)
- 300ms hover delay
- Acessível via aria-describedby + keyboard focus
- Theme-aware (modern/8-bit/32-bit styling distinto)
- Custom CSS-only (zero deps, ~3KB)

## Validação

1. ✅ Build pass
2. ✅ Tests pass (628/628 incluindo P1-7 atualizado)
3. ✅ 78 entries em `tooltips.json` (locale pt)
4. ✅ Applied: DashboardView (sectors/moral/energia/board), SquadView (traits, captain, loan/sell/renew), MarketView (traits), StandingsView (column headers + zone legend)
5. ⏳ Audit script: zero `title=""` HTML em components (legacy 4 ainda em SquadView captain emoji)

## Forbidden

- ❌ HTML `title=""` nativo em components (browser tooltip ugly)
- ❌ Bibliotecas externas (Radix +15KB) — usar custom
- ❌ Hardcoded tooltip text em JSX (usar `tooltips.json` + Help)

## Files

- `src/components/Tooltip.jsx` (novo, ~80 linhas)
- `src/components/Help.jsx` (novo, ~24 linhas)
- `src/data/tooltips.json` (novo, 78 entries pt + schema multi-locale)
- `src/data/tooltipsLoader.js` (novo, getTooltip/tooltipCount/allTooltipIds)
- `src/index.css` (CSS tooltip-bubble + theme variants)

## Tooltip Categorias

| Prefixo | Count | Cobertura |
|---------|-------|-----------|
| stat.* | 15 | OVR, MORAL, ENERGIA, FOR, AGI, VEL, FIN, CRI, DEF, GOL, CTRL, AÉREO, IDADE, SALARIO, CONTRATO |
| sector.* | 5 | gol, def, mei, ata, moral_avg |
| pos.* | 4 | GOL, DEF, MEI, ATA |
| btn.* | 13 | train, release, renew, sell, buy, loan, bid, scout, upgrade_stadium, hire_staff, set_tactics, set_lineup, press_conf, save, bankruptcy_warning |
| btnp.* | 8 | Player mode actions |
| ind.* | 12 | Streaks, lesão, cansado, traits, live |
| trait.* | 15 | captain, golden_boot, workhorse, fragile, etc |
| tab.* | 5 | plantel, mercado, tabela, clube, ofertas |
