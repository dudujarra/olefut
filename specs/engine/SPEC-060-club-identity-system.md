# SPEC-060 — Club Identity System

**Status**: APROVADA
**Criada**: 2026-05-08
**Owner**: Dudu
**Akita compliance**: spec + harness + docs

## Contexto

ELIFOOT v2.0 SNES tem 80 clubes em `src/engine/db/brazil.js` (Série A/B/C/D). Cada clube só tem `{name, budget, stadium}` — zero identidade visual. Dashboard genérico, Hall de Lendas sem cores clube, Match scoreboard sem branding. Sem identidade = sem nostalgia.

## Objetivo

Adicionar identidade visual completa a 100% dos 80 clubes:
1. Cores reais oficiais (primary, secondary, accent)
2. Badge pixel-art abstrato (IP-safe, evoca sem clonar)
3. Theming dinâmico clube-aware em views (header, badge cards, scoreboard)

## Escopo

### IN
- `src/data/clubColors.js` — 80 entries `{primary, secondary, accent, founded, nickname}`
- `src/components/ui/EfClubBadge.jsx` — render badge auto-gen iniciais + cores + shape escudo
- Tema dinâmico CSS vars `--ef-club-primary/secondary/accent` aplicadas em DashboardHeader
- Helpers: `getClubColors(name)` retorna defaults se clube não mapeado

### OUT (futuras specs)
- SPEC-061 jersey colors em sprites match
- SPEC-062 stadium color schemes
- SPEC-063 CBF crest (selecao) + estaduais

## Design

### Color palette por clube

```js
// src/data/clubColors.js
export const CLUB_COLORS = {
    "Flamengo": { primary: "#E32636", secondary: "#000000", accent: "#C0C0C0", nickname: "Mengão" },
    "Palmeiras": { primary: "#006437", secondary: "#FFFFFF", accent: "#FFD700", nickname: "Verdão" },
    // ... 78 more
};

export const DEFAULT_COLORS = {
    primary: "#2D5A3D",  // grass-700 fallback
    secondary: "#FFFFFF",
    accent: "#F4F1DE",
    nickname: ""
};

export function getClubColors(name) {
    return CLUB_COLORS[name] || DEFAULT_COLORS;
}
```

### EfClubBadge component

```jsx
<EfClubBadge name="Flamengo" size="md" />
```

Render pixel-art abstrato:
- Shape: shield SVG geométrico (não copia escudo real)
- Background: split horizontal/vertical com primary + secondary
- Foreground: iniciais (1-3 chars) em IBM Plex Mono uppercase white outline
- Border: 2px beveled (light + dark) consistent v3-snes
- Sizes: sm (24x24), md (48x48), lg (96x96), xl (128x128)

IP-safe rationale: cores autênticas + iniciais + shape genérico ≠ clonar logo.

### Tema dinâmico

DashboardHeader recebe `team.name`, calcula `colors = getClubColors(name)`, aplica CSS vars inline:

```jsx
<div style={{
    '--ef-club-primary': colors.primary,
    '--ef-club-secondary': colors.secondary,
    '--ef-club-accent': colors.accent
}}>
```

CSS class `.ef-dash-header` usa `var(--ef-club-primary)` no header bar background gradient.

## Validação (Akita harness)

`tests/regression/SPEC-060-club-identity.test.js`:

1. `getClubColors("Flamengo")` retorna `{primary: "#E32636", ...}`
2. `getClubColors("Inexistente")` retorna `DEFAULT_COLORS`
3. Todos 80 clubes em `BrazilDB` têm entry em `CLUB_COLORS` (test loop)
4. `EfClubBadge` renderiza SVG com width/height correto por size
5. `EfClubBadge` aplica primary/secondary do clube
6. Iniciais geradas: 1-3 chars uppercase (Flamengo→FLA, "São Paulo"→SAO, "Vasco da Gama"→VAS)

## Open questions

1. **Iniciais 2 vs 3 chars?** Recomendo: 3 chars padrão (FLA/PAL/COR), fallback 2 se nome curto (CSA/ABC).
2. **Acento iniciais?** Recomendo: strip accents (São Paulo→SAO, Atlético-MG→ATL).
3. **Times duplicados em séries diferentes?** (Botafogo + Botafogo-SP + Botafogo-PB). Recomendo: cada nome único = entry própria.
4. **Cores Série B/C/D nem todos verificáveis?** Recomendo: Série A/B verifico oficiais, C/D fallback genérico baseado em região.

## Deliverable

- `specs/engine/SPEC-060-club-identity-system.md` (este arquivo)
- `src/data/clubColors.js` (80 entries)
- `src/components/ui/EfClubBadge.jsx`
- `src/components/dashboard/DashboardHeader.jsx` (apply tema)
- `tests/regression/SPEC-060-club-identity.test.js`

## Referências

- BrazilDB: `src/engine/db/brazil.js`
- Stitch v3-snes header reference: `docs/stitch-designs/v3-snes/dashboard.png`
- Tokens Pacaembu: `src/styles/tokens/tokens.json`
