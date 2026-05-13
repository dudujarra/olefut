# Stitch Designs v1.1 — FINAL (brand-locked)

> **Brand v1.1 Pixelify Sans validado** após 2 rodadas Dudu feedback (2026-05-13).
> Mockups Stitch das 10 hero screens — fonte de referência visual pra implementação React.

**Stitch project**: https://stitch.withgoogle.com/projects/2768243260696315508
**DS asset**: `assets/67fd443e10d643409003d98aa9d55c17`
**Brand source**: `docs/brand-guidelines.md` v1.1 (SPEC-176)

---

## Inventário (10 hero screens)

| # | View | HTML | PNG | React component |
|---|------|------|-----|-----------------|
| 1 | Dashboard | [dashboard.html](dashboard.html) | [dashboard.png](dashboard.png) | `src/components/DashboardView.jsx` |
| 2 | Match (Ao Vivo) | [match.html](match.html) | [match.png](match.png) | `src/components/MatchView.jsx` |
| 3 | Squad (Plantel) | [squad.html](squad.html) | [squad.png](squad.png) | `src/components/SquadView.jsx` |
| 4 | Market (Mercado) | [market.html](market.html) | [market.png](market.png) | `src/components/MarketView.jsx` |
| 5 | Standings (Classificação) | [standings.html](standings.html) | [standings.png](standings.png) | `src/components/StandingsView.jsx` |
| 6 | PreMatch (Pré-jogo) | [prematch.html](prematch.html) | [prematch.png](prematch.png) | `src/components/PreMatchScreen.jsx` |
| 7 | Trophy (Cerimônia) | [trophy.html](trophy.html) | [trophy.png](trophy.png) | `src/components/TrophyCeremony.jsx` |
| 8 | Press (Coletiva) | [press.html](press.html) | [press.png](press.png) | `src/components/PressView.jsx` |
| 9 | Tutorial Step 1 | [tutorial-step1.html](tutorial-step1.html) | [tutorial-step1.png](tutorial-step1.png) | `src/components/TutorialView.jsx` |
| 10 | Achievements | [achievements.html](achievements.html) | [achievements.png](achievements.png) | `src/components/AchievementsView.jsx` |

---

## Como usar

### Como reference durante refactor visual
```bash
# Abrir HTML local
open docs/stitch-designs/v1.1-final/dashboard.html

# Compare side-by-side com app rodando
npm run dev  # http://localhost:5173
```

### Como spec visual pra translation React
Cada HTML contém:
- Layout completo (containers, grids)
- Tipografia exata (Pixelify Sans / Press Start 2P / IBM Plex Mono)
- Cores brand v1.1 (neon #39FF14, gold #FFD700, etc)
- Bevel/border patterns ISSSD

Pra portar pra React:
1. Inspecionar HTML structure
2. Mapear componentes existentes (`EfPanel`, `EfButton`)
3. Aplicar classes/tokens existentes (`docs/brand-guidelines.md`)
4. Validar contra `assets/design-tokens.css`

---

## Limitações conhecidas

1. **Hallucinations Stitch**: headers podem mostrar "Ultimate Manager" em vez de "OléFUT". App React real tem `{team.name}` dinâmico — corrigir em translation.
2. **Mutual-exclusive panels juntos**: Stitch pode renderizar painéis que no React são `ternary !answered ? A : B`. Ver `PressView.jsx` exemplo.
3. **Dados estáticos**: Stitch usa nomes/scores fake. App tem dados engine reais.

---

## Pipeline

```
Brand source → Stitch DS → Stitch screens → HTML download → React translation → App
docs/brand-guidelines.md v1.1
        ↓
DS asset 67fd443e (Stitch)
        ↓
Apply nas 10 hero screens
        ↓
HTML/PNG aqui (THIS DIR) ← snapshot final 2026-05-13
        ↓
[FUTURE] React translation (incremental, per-screen PRs)
```

---

## Próximo passo

**Translation Stitch → React** (opcional, alta esforço):
- 1 PR por tela (10 PRs)
- Comparar HTML vs JSX existente
- Adotar layouts/spacing Stitch onde melhorar
- Manter dados reais via props
- Não reinventar componentes existentes (`EfPanel`, `EfButton`)

OU usar como **reference apenas** durante playtest — se feedback indicar gap visual, então portar.

---

**Generated**: 2026-05-13 (sessão pós-PR #156 merge)
**Last applied DS**: v1.1 Pixelify, asset `67fd443e`, 2026-05-13 18:27:39 UTC
