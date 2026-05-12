# ⚽ ELIFOOT RPG

> **Football Manager + RPG depth + Brazilian flavor.**
> 100% Spec-Driven Development. Zero vibe coding. Open source.

🎮 **Live demo**: https://dudujarra.github.io/elifoot-web/

[![CI](https://github.com/dudujarra/elifoot-web/actions/workflows/ci.yml/badge.svg)](https://github.com/dudujarra/elifoot-web/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-1055%2F1055-brightgreen)](https://github.com/dudujarra/elifoot-web/tree/main/tests)
[![Specs](https://img.shields.io/badge/specs-110-blue)](https://github.com/dudujarra/elifoot-web/tree/main/specs)
[![SDD](https://img.shields.io/badge/SDD-100%25-purple)](https://github.com/dudujarra/elifoot-web/blob/main/specs/SPEC-RULES.md)
[![Bugs Tracked](https://img.shields.io/badge/bugs%20regression-13-orange)](https://github.com/dudujarra/elifoot-web/blob/main/BUGS.md)
[![Theme](https://img.shields.io/badge/theme-32bit%20SNES-yellow)](https://github.com/dudujarra/elifoot-web/blob/main/src/styles/animations.css)
[![Stitch Designs](https://img.shields.io/badge/Stitch%20designs-20%2B-purple)](https://github.com/dudujarra/elifoot-web/tree/main/docs/stitch-designs)
[![Club Badges](https://img.shields.io/badge/club%20badges-170-red)](https://github.com/dudujarra/elifoot-web/tree/main/public/sprites/clubs)
[![Animations](https://img.shields.io/badge/sprite%20animations-9-cyan)](https://github.com/dudujarra/elifoot-web/tree/main/public/sprites/animations)
[![Banners](https://img.shields.io/badge/EfBanner%20types-13-pink)](https://github.com/dudujarra/elifoot-web/blob/main/src/components/ui/EfBanner.jsx)
[![Atmospheric Art](https://img.shields.io/badge/.ef--art--*-21-orange)](https://github.com/dudujarra/elifoot-web/blob/main/src/styles/animations.css)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

> 🥋 **Antes de qualquer trabalho neste repo, leia [`CLAUDE.md`](CLAUDE.md) (fonte única técnica) + [`AKITA_RULES.md`](AKITA_RULES.md) (constituição) + [`CONTRIBUTING.md`](CONTRIBUTING.md).**

---

## 🎯 What is it

ELIFOOT RPG = simulador futebol brasileiro com profundidade RPG. Gerencia 1 dos **170 clubes reais**, treina elenco, negocia contratos, sobe divisões, constrói legado.

**Diferencial técnico**: projeto inteiro construído via **SDD (Spec-Driven Development)** + **Protocolo AKITA**. Cada feature tem spec → harness → implementação → validação. Zero código sem teste.

---

## 🗺️ Roadmap

Roadmap narrativo completo: [`specs/ROADMAP-NARRATIVE-MASTER.md`](specs/ROADMAP-NARRATIVE-MASTER.md)

**Estado atual:** v1.0 (Foundation + Live UX) released

**Próximas releases:**

- **v1.0.5** — Refactor God-Class (extrair Myth/Relationship/Narrative/Career services) — 17 PRs sequenciais documentados em [`specs/refactor/`](specs/refactor/)
- **v1.0.7** — Camada 2 Foundation (eventos atômicos + decay)
- **v1.1** — Camada 5 Mito (Hall de Lendas + canonização)
- **v1.1.5** — Traits Herdáveis (regens com bias por slot do Hall)
- **v1.2** — Transição Jogador → Técnico (ProPlayer aposenta no mesmo save)
- **v1.3** — Filhos Regens (16-18 anos após auge)
- **v1.4** — Rivalidades Emergentes (Camada 3 expandida)
- **v1.5** — Crônica do Save (export prosa por temporada)

**SPEC-049** ([`specs/SPEC-049-narrative-layers-mvp.md`](specs/SPEC-049-narrative-layers-mvp.md)) define operacionalmente as 5 camadas narrativas (Agente / Eventual / Relacional / Narrativa / Mito) — referência permanente.

---

## 🎮 Gameplay

### Modo Treinador
- 4 divisões, 5 zonas regionais
- 8 formações × 6 táticas (1600 combinações tático rock-paper-scissors)
- Match Engine ao vivo com narração lance a lance
- 15 traits únicos por jogador (Decisivo, Líder Nato, Cavalo de Aço...)
- Vestiário dinâmico: capitão estabiliza, cancer contamina
- Career stats: gols, assistências, MOTM por temporada
- Youth Academy 5 níveis + empréstimos
- 5 patrocinadores tiers, 30 achievements
- Promo/Relegation automático

### Modo Jogador
- Carreira do banco à titularidade
- Relacionamentos: diretoria, torcida, sponsors, companheiros
- Stress + energia recursos limitados
- Star Rating + Renome baseados em performance

---

## 🏗️ Stack

| Layer | Tech |
|-------|------|
| Engine | JavaScript ES2022 puro (headless, zero-UI) |
| UI | React 19 + Vite 8 |
| Tests | Vitest 4 |
| CI/CD | GitHub Actions (lint + tests + build + deploy) |
| Deploy | GitHub Pages (auto on main) |
| Design | Dark mode, glassmorphism, Inter + Outfit fonts |

---

## 📊 Numbers

> Snapshot 2026-05-11. Fonte: `find specs -name "SPEC-*.md"`, `vitest run`, `git log`.

| Métrica | Valor |
|---------|-------|
| **Specs documentadas** | 97 (engine 39 + gameplay 15 + ui 6 + infra 7 + learning 10 + refactor 19 + telemetry 15 + raiz) |
| **Test files** | 86 |
| **Tests passing** | 1044 / 1044 ✅ |
| **Bugs com regression test** | 13 arquivos em `tests/regression/` (BUG-001..079 + cascades) |
| **AKITA commits** | 166 |
| **Engine modules** | 40+ (sistemas em `src/engine/`) |
| **React components** | 30+ |
| **Clubes reais** | 170 (BR + EU + SA) |
| **Coverage codebase** | 92% |
| **Themes** | 2 (Modern + 8-bit retro) |
| **Pixel-art sprites** | 14 legacy + 78 v2.0 + 5 anim (97 total) |
| **Stitch designs** | 13+ (Gemini 3 Flash) |
| **Club badges** | 170 (13 spritesheets BR/EU/SA) |
| **Sprite animations** | 5 (frame-based pixel-art) |
| **Build size** | 394KB JS + 18KB CSS (gzip 115KB) |
| **Build time** | <150ms |
| **Times reais** | 170 (10 países) |
| **Torneios simultâneos** | 16 |

---

## 🚀 Quick Start

```bash
git clone https://github.com/dudujarra/elifoot-web.git
cd elifoot-web
npm install
npm run dev          # http://localhost:5173
```

Build produção:
```bash
npm run build        # dist/
npm run preview      # serve dist
```

---

## 🧪 Testing

```bash
npm test                 # 320/320 tests
npm run test:series      # 36/36 files in series (1-by-1)
npm run test:specs       # only spec harnesses
npm run test:regression  # only regression tests
npm run test:watch       # watch mode
```

---

## 🐛 Bug Workflow (Akita Mandamento #6)

> **Bug = ticket + fix + regression test (3 artefatos pareados, sempre)**

```bash
npm run bug:full "Lesão duplica weeks"   # workflow completo
# Encadeia: search → ticket → fix branch → regression test
```

Comandos individuais:

```bash
npm run bug:search "SponsorsSystem"      # procura em src/tests/specs/commits/issues
npm run bug:ticket "title"               # cria GitHub Issue + BUGS.md entry
npm run bug:fix BUG-XXX                  # branch bug/BUG-XXX
npm run bug:test BUG-XXX                 # regression test skeleton
```

CI auto-roda series em todos PRs. Templates forçam 3-artefact checklist em issues + PRs.

---

## 📁 Architecture

```
specs/                          # 30 SPEC-XXX docs (governance)
├── engine/                     # 26 engine specs
├── infra/                      # 4 infra specs
└── ui/                         # 1 UI spec

src/engine/                     # Headless engine (zero-UI)
├── engine.js                   # Match simulation core
├── MatchEventsDeck.js          # Event cards system
├── PlayerDevelopment.js        # Aging, form, growth
├── BoardSystem.js              # Diretoria + demissão
├── InjurySystem.js             # 6 injury types
├── StadiumSystem.js            # 5 stadium levels + staff + scouting
├── YouthAcademy.js             # Base de formação
├── SeasonSystem.js             # Calendar + tournaments
└── systems/                    # FASE 3-5 modules
    ├── SponsorsSystem.js       # 5 tiers patrocínio
    ├── MarketSystem.js         # Janelas + ofertas
    ├── ContractSystem.js       # 5 tipos contrato
    ├── RivalrySystem.js        # 4 derbies + intensidade
    ├── NationalTeamSystem.js   # Convocações seleção
    ├── NPCAISystem.js          # IA times rivais
    ├── WeatherSystem.js        # 14 climas
    ├── PrestigeSystem.js       # Ranking intl + tiers
    ├── NewsSystem.js           # 20 tipos headlines
    ├── StatisticsSystem.js     # 50+ métricas
    ├── AchievementsSystem.js   # 30 badges
    └── PreferencesSystem.js    # Customização

src/components/                 # React UI (Vite)
tests/
├── specs/                      # 30 SPEC harnesses
└── regression/                 # 8 BUG-XXX tests

scripts/
├── debug-bug.sh                # Akita bug workflow runner
└── elifoot-bug-sweep.sh        # QA sweep estático

.claude/skills/
└── elifoot-debug/              # Claude Code skill (auto trigger debug workflow)

.github/
├── workflows/                  # CI + Pages deploy + regression series
├── ISSUE_TEMPLATE/             # Bug report force 3-artefact
└── PULL_REQUEST_TEMPLATE.md    # Akita PR checklist
```

---

## 📋 Spec Index

### FASE 2: Core Engine (8 specs, 🔴 CRÍTICO)
SPEC-001 Match Engine • SPEC-002 Events Deck • SPEC-003 Player Development • SPEC-004 Formation/Tactic • SPEC-005 Injury • SPEC-006 Board • SPEC-007 Personality • SPEC-008 Stress

### FASE 3: Secondary Features (11 specs, 🟡 ALTO)
SPEC-009 Youth Academy • SPEC-010 Stadium • SPEC-011 Staff • SPEC-012 Scouting • SPEC-013 Sponsors • SPEC-014 Season/Tournament • SPEC-015 Market/Transfer • SPEC-016 Contracts • SPEC-017 Rivals/Derby • SPEC-018 National Team • SPEC-019 NPC AI

### FASE 4: Infrastructure (4 specs, 🔴 CRÍTICO)
SPEC-020 Database Schema • SPEC-021 CI/CD Pipeline • SPEC-022 Deploy GitHub Pages • SPEC-023 Test Coverage

### FASE 5: Backlog & Polish (7 specs, 🟢 MÉDIO)
SPEC-024 Weather • SPEC-025 Aging • SPEC-026 Prestige • SPEC-027 News • SPEC-028 Statistics • SPEC-029 Achievements • SPEC-030 Customization

📖 Master guide: [SPECS-MASTER-GUIDE.md](SPECS-MASTER-GUIDE.md)

---

## 🥋 Protocolo AKITA

> Filosofia anti-vibe-coding (Fábio Akita). Dev pensa, IA digita. Disciplina > intuição.

7 mandamentos universais:

1. **SDD obrigatório** — Sem spec, sem trabalho.
2. **Sem harness, sem spec** — Toda spec entrega harness executável no mesmo PR.
3. **Anti-vibe coding** — Proibido one-shot prompt sem entender resultado.
4. **CLAUDE.md central** — Single source of truth técnica.
5. **GitHub público dia 1** — Build in public.
6. **Bug = ticket + fix + regression test** — 3 artefatos pareados.
7. **LLM local default** — API paga proibida.

Commits: `AKITA-XXX: Título — Descrição` (pre-commit hook valida format).

---

## 🛠️ Sistemas implementados

- ⚔️ Match Engine (narração contextual, trait modifiers, MOTM)
- ⏱️ Cronômetro ao vivo com lance a lance
- 📋 Formações, Táticas, Treino, Preleção
- 🧬 Player Development (growth, decline, retirement)
- 🔥 Form System (hot/cold streak)
- 🏷️ 15 Traits (habilidades especiais)
- 📊 Career Stats + Season Awards
- 🏠 Dressing Room Dynamics
- 🏛️ Board System (confiança + demissão)
- 🏥 Injury System (6 tipos)
- 🎓 Youth Academy (5 níveis + empréstimos)
- 🎙️ Press Conference (3 NPCs)
- 🏟️ Stadium (5 níveis) + Staff (5 cargos)
- 🔎 Scouting (5 regiões)
- 💰 Sponsors (5 tiers) + Finanças semanais
- 📅 Calendar Events (pausa FIFA, janela, férias)
- 🏆 Promo/Relegation + Manager Legacy
- 📰 News System (20 tipos headlines)
- 📚 Mentoring (veterano → jovem)
- 📝 Contract Renewal com personalidade
- 🌦️ Weather System (14 climas)
- 🏆 Prestige & Ranking intl (6 tiers)
- 📈 Statistics (50+ métricas)
- 🏅 Achievements (30 badges)
- ⚙️ Preferences (16 themes, 4 idiomas, 10 formations saves)
- 🤖 NPC AI (decisões automáticas times rivais)

---

## 🎨 8-bit Theme + Design System

Projeto possui **2 temas toggle** (🎨 modern ↔ 🕹️ 8-bit retro):

- **Modern**: dark mode + glassmorphism + Inter/Outfit fonts
- **8-bit Retro**: NES era + Press Start 2P + chunky 4px borders + scanlines + paleta futebol real

**Paleta futebol** (8-bit theme):
```
Grass green: #2D6A4F mid / #1B4332 dark / #52B788 light
Line white:  #F1FAEE
Leather:     #8B5A2B (ball) / #6B4226 (stands)
Cards:       #FFD600 yellow / #C62828 red
Sky info:    #4A90E2
```

### Assets pixel-art (Google Flow Nano Banana Pro + Stitch v3 SNES)
40+ sprites em `public/sprites/` (legacy 8-bit migrated to 32-bit Sprint 5):
- logo-vertical.jpeg / scoreboard-banner.jpeg
- stadium-field.jpeg / stadium-night-D-I-variants.png (6 tiers)
- player-jerseys.jpeg (8 cores numerados)
- icons-set-football.jpeg (8 icons sprite sheet)
- weather-football.jpeg
- 13 club spritesheets (170 clubs total)
- 6 animation strips (ball-roll/goal-burst/spinner/trophy-unlock/crowd-wave + ball-kick/gk-save/crowd-flag-wave)
- 7 atmospheric backdrops (newspaper/boardroom/champion-celebration/locker-room/tunnel-walkout/press-box/trophy-room)
- 4 pitch variants (mowing patterns) + tactical 4-3-3 grid

### Stitch designs (Gemini 3 Pro)
10 screen designs em `docs/stitch-designs/`:
- Dashboard, Match Live, Squad, Start, Stadium, Standings, Market
- 3 variants Dashboard (Arcade / Classic FM / Minimal)

Design system Stitch: `assets/9556108370450513109` (Anton + Rubik + Space Mono).

---

## 🕹️ v2.0 SNES Pacaembu Edition

Direção arte 32-bit Super Nintendo / PS1 era. Paleta Pacaembu (verde grama 90s).

### Tokens (src/styles/tokens/)
- 24 cores Pacaembu (grass-700/800/900 + funcional success/warning/danger/info + BR Copa)
- 17 fontes (Press Start 2P logo + Pixelify Sans UI + IBM Plex Mono tabelas)
- 9 spaces grid 8px sagrado
- 5 shadows beveled

### Stitch UI library (`src/components/ui/`)
8 componentes base (`Ef` prefix, PascalCase):
- EfButton (4 variants × 3 sizes + loading + icon)
- EfPanel (5 variants beveled containers)
- EfCardPlayer (avatar 32×32 colorido por posição)
- EfTooltip (4 colors + auto-position)
- EfModal (4 sizes + esc + ARIA dialog + ef-pop-in animation)
- EfInput (sunk bevel + focus ring)
- EfStatLine (label + value + bar)
- EfClubBadge (pixel-art sprite-based 170 clubes)

### v3-snes Stitch screens (`docs/stitch-designs/v3-snes/`)
- Dashboard SNES (header + tabs + alerts)
- Match Live SNES (top-down 2D pitch + scoreboard + sidebar)
- Squad Management SNES (tabela + formation preview)
- Hall de Lendas SNES (6 cards lendas)
- Crônica do Save SNES (parchment + chapters + troféus 4×3)
- StartView SNES (logo + 4 menu buttons)

### Club Identity System (SPEC-060) — 170 clubes
13 spritesheets pixel-art em `public/sprites/clubs/`:

| País/Região | Sheet | Clubes | Style |
|---|---|---|---|
| Brasil Série A | spritesheet-serie-a.png | 20 | 32-bit abstract |
| Brasil Série B | spritesheet-serie-b.png | 20 | 32-bit abstract |
| Brasil Série C | spritesheet-serie-c.png | 20 | 16-bit SNES |
| Brasil Série D | spritesheet-serie-d.png | 20 | 16-bit SNES |
| Inglaterra | spritesheet-eng.png | 10 | 16-bit SNES |
| Espanha | spritesheet-esp.png | 10 | 16-bit SNES |
| Itália | spritesheet-ita.png | 10 | 16-bit SNES |
| Alemanha | spritesheet-ger.png | 10 | 16-bit SNES |
| França | spritesheet-fra.png | 10 | 16-bit SNES |
| Argentina | spritesheet-arg.png | 10 | 16-bit SNES |
| Uruguai | spritesheet-uru.png | 10 | 16-bit SNES |
| Chile | spritesheet-chi.png | 10 | 16-bit SNES |
| Colômbia | spritesheet-col.png | 10 | 16-bit SNES |

Cores oficiais reais por clube + sprite coords em `src/data/clubColors.js`.
EfClubBadge auto-resolve via `getClubSprite(name)`.

### Game assets v2.0 (78 sprites — 9 categorias)
- `public/sprites/cards/referee-cards.png` — 8 cartões árbitro
- `public/sprites/cards/match-events.png` — 12 eventos match
- `public/sprites/trophies/trophy-set.png` — 8 troféus genéricos
- `public/sprites/positions/position-icons.png` — 8 posições GOL/DEF/MEI/ATA/ZAG/LAT/VOL/PON
- `public/sprites/stadium-progression-D-I.png` — 6 níveis estádio extras
- `public/sprites/effects/celebration.png` — 8 efeitos celebração
- `public/sprites/effects/crowd-strip.png` — 6 tiles arquibancada
- `public/sprites/effects/score-digits.png` — 10 dígitos LED 0-9
- `public/sprites/effects/sponsors-fictional.png` — 12 sponsors fictícios

### Animation Framework (9 sprite-strips)
`public/sprites/animations/` + `src/styles/animations.css`:

| Asset | Frames | Tamanho | Duração | Aplicado |
|---|---|---|---|---|
| ball-roll | 8 | 64×64 | 800ms loop | — |
| goal-burst | 6 | 96×96 | 1200ms once | ✅ MatchView ⚽ |
| spinner | 8 | 48×48 | 800ms loop | ✅ EfButton loading |
| trophy-unlock | 6 | 96×128 | 1500ms once | — |
| crowd-wave | 4 | 256×80 | 1000ms loop | — |
| ball-kick | 6 | 64×64 | 600ms once | ✅ MatchView goal trigger |
| gk-save | 5 | 64×64 | 700ms once | ✅ MatchView save event |
| crowd-flag-wave | 4 | 128×96 | 1200ms loop | ✅ MatchView scoreboard |
| run-cycle | 6 | 64×64 | 600ms loop | — |

### Motion Apply Coverage (Sprint A-E)
13 views/components com motion+art aplicado:

| View | Motion |
|---|---|
| MatchView | goal-burst overlay + shake + counter + event-overlay (card/injury/sub) |
| EfModal | pop-in keyframe |
| EfButton | spinner-sm sprite + global hover-lift |
| ClubGalleryView | pop-in cards filled + pulse-glow lendas |
| StandingsView | pulse-glow user row + trophy-icon top 4 positions |
| PreMatchScreen | pulse-glow VS center |
| ChronicleView | slide-down content card |
| SquadView | pos-icon sprite per row |
| Global CSS | button hover-lift / tooltip fade / toast slide-down / nav-tabs fade / card hover lift / counter |

### Sprite Utility Classes
`.ef-event-{goal,foul,injury,sub,redcard,corner,offside,penalty,save,hattrick,halftime,fulltime}` — match-events.png crops
`.ef-pos-icon.{GOL,DEF,MEI,ATA,ZAG,LAT,VOL,PON}` — position-icons.png crops
`.ef-trophy-{tier-1,2,3,4,cup-domestic,cup-continental,cup-secondary,cup-world}` — trophy-set.png crops
`.ef-led-digit-{0..9}` — score-digits.png LED display crops

### Phase 3 — Banner & Atmospheric Assets

8 novas categorias abstract pixel-art geradas via Stitch:

| Asset | Path | Conteúdo |
|---|---|---|
| Champion banner | `banners/champion-celebration.png` | 1024×256 backdrop celebration scene |
| State arrows | `banners/state-arrows.png` | 8 icons (up/down/star/right/pause/check/X/crown) |
| Newspaper backdrop | `banners/newspaper-backdrop.png` | 1024×256 vintage paper texture |
| Boardroom interior | `banners/boardroom-interior.png` | 1024×256 abstract office scene |
| Manager avatars | `avatars/managers.png` | 8 abstract caricature portraits |
| Referee/training equipment | `equipment/referee-training.png` | 8 icons (whistle/stopwatch/flag/cones/dumbbell) |
| Weather overlays | `effects/weather-overlays.png` | 4 tiles (sunny/rain/snow/night) |
| Finance icons | `effects/finance-icons.png` | 8 icons (coin/stack/wallet/$/scroll/bag/handshake/bank) |

### Sprint Final Assets (AKITA-074)

| Asset | Path | Conteúdo |
|---|---|---|
| Player faces 32 | `avatars/players-32.png` | 32 abstract caricatures 8×4 grid |
| Match pitch top-down | `pitch-topdown-32bit.png` | 1024×640 aerial pitch view |
| Achievements 30 | `achievements-30.png` | 30 abstract badges 6×5 grid |
| Run cycle anim | `animations/run-cycle-6frames.png` | 6 frames athlete lateral |

### v2.0.0 Pacaembu Edition Sprint (AKITA-075..079)

6 sprints encadeados (~14h cohesive overhaul):

| Sprint | Entregas |
|---|---|
| Sprint 1 (075) | 14 `.ef-art-*` utility classes + 6 views integradas (StartView, ChronicleView, StandingsView, RivalriesView, SquadView, MarketView, PlayerDashboardView) |
| Sprint 2 (076) | 9 EfBanner triggers wired (champion/promotion/relegation/sponsor/injury/suspension/hired/retirement/motm) — total 13/13 |
| Sprint 3 (077) | 3 animation strips Stitch (ball-kick/gk-save/crowd-flag-wave) + MatchView integration |
| Sprint 4 (078) | 7 atmospheric assets Stitch (locker-room/tunnel-walkout/press-box/trophy-room/pitch-tactical/pitch-patterns/stadium-night-D-I) + PreMatchScreen |
| Sprint 5 (079) | Legacy 8-bit cleanup: deleted 6 dead assets, migrated stadium-icon refs to D-I 32-bit |
| Sprint 6 (080) | README v2.0.0 update + CHANGELOG entry (baseline de testes corrigido em 2026-05-11 → ver `CLAUDE.md` snapshot) |

### EfBanner Reusable Component

`src/components/ui/EfBanner.jsx` — full-screen narrative moment overlay.

13 banner types pré-configurados:
- `champion` — título conquistado (4000ms, gold gradient + trophy-unlock anim)
- `promotion` / `relegation` — divisão sobe/desce
- `fired` / `hired` — diretoria demite/contrata
- `retirement` — aposentadoria carreira
- `offer` / `sponsor` — proposta/patrocínio
- `motm` / `hattrick` / `cleanSheet` — performance match
- `injury` / `suspension` — eventos negativos

Hooks aplicados:
- MatchView FullTime: detecta hat-trick (3+ gols mesmo scorer) e clean-sheet automaticamente
- Click anywhere or auto-dismiss after duration

Direção arte:
- `ef-anim-pop-in` entry
- `ef-anim-pulse-glow` icon
- Pacaembu palette gradients
- Beveled metallic borders 4px
- `'Press Start 2P'` title typeface

Keyframes UI:
- `ef-shake` (banner gol scoreboard)
- `ef-pop-in` (modais)
- `ef-slide-down/up` (transições)
- `ef-fade-in`
- `ef-pulse-glow` (badges importantes)
- `ef-counter` (score increment)
- `ef-anim-hover-lift` (botões -1px/+2px)

Direção arte preservada:
- `image-rendering: pixelated` (nearest-neighbor)
- `steps()` timing (não cubic-bezier smooth)
- `prefers-reduced-motion: reduce` respected (a11y)
- Background uniforme #2D5A3D consistent

### IP-safety
Todos assets pixel-art são **abstract generic** ou **fictional invented** (ZUPP/MEGABANK sponsors). Cores oficiais de clubes usadas como **referência** (paleta), nunca replicação literal de marcas registradas. Emblems geométricos puros (listras/bandas/halves/diagonal).

---

## 🔄 Recent commits

```
AKITA-048: Standings + Market designs Stitch (10 total)
AKITA-047: 7 Stitch screens + 3 dashboard variants
AKITA-046: Stitch tokens applied (scoreboard-card + quote-card + sidebar)
AKITA-044/043: Match Live + Dashboard Stitch designs (Gemini 3 Pro)
AKITA-042: 14 Flow assets renamed + sprite system
AKITA-041: 8 Flow assets paleta futebol + theme integration
AKITA-040: Logo 8-bit PNG real applied
AKITA-037: 8-bit theme phase 1 + design handoff doc
AKITA-036: UX overhaul P0+P1+P2 (13 melhorias UX/UI)
AKITA-034: BUG-019 + BUG-020 (Clube crash + auto-save localStorage)
AKITA-033: BUG-015 critical (MatchView crash filter null-safe)
AKITA-031: Sweep batch 2 — 4 bugs deep audit (BUG-011 a 014)
AKITA-030: Sweep batch 1 — 4 bugs fix (BUG-007 a 010)
AKITA-029: Skill elifoot-debug — auto trigger debug workflow
AKITA-028: Bug debug workflow + tests serial
AKITA-027: Build completo — 12 modules + 28 harnesses + CI/CD
AKITA-022 a 026: Foundation SDD + 30 specs (FASE 1-5)
```

---

## 📚 Docs

- [SPECS-MASTER-GUIDE.md](SPECS-MASTER-GUIDE.md) — índice navegável 30 specs
- [BUGS.md](BUGS.md) — bug tracker permanente (20 fixados)
- [docs/stitch-designs/](docs/stitch-designs/) — 10 Stitch designs HTML+PNG
- [docs/8bit-design-handoff.md](docs/8bit-design-handoff.md) — design system spec
- [docs/flow-assets-generated.md](docs/flow-assets-generated.md) — Flow art docs
- [docs/sandbox-limitations.md](docs/sandbox-limitations.md) — MCP browser limits
- [docs/playtest/AUTONOMOUS-SESSION-REPORT.md](docs/playtest/AUTONOMOUS-SESSION-REPORT.md) — autonomous test report
- [FASE-1-2-SUMMARY.md](FASE-1-2-SUMMARY.md) — Foundation + Core
- [FASE-3-4-SUMMARY.md](FASE-3-4-SUMMARY.md) — Secondary + Infra
- [FASE-5-SUMMARY.md](FASE-5-SUMMARY.md) — Backlog + overall stats
- [specs/SPEC-RULES.md](specs/SPEC-RULES.md) — governance SDD

---

## 🤖 Claude Code Skill

`.claude/skills/elifoot-debug/SKILL.md` — skill auto-trigger no Claude Code. Disse "tem bug em X" → Claude carrega workflow + executa search→ticket→fix→test automático.

---

## 🤝 Contributing

PRs welcome. Requirements:

1. Issue criada (BUG-XXX ou FEAT-XXX)
2. Branch `bug/<id>` ou `feat/<id>`
3. SPEC vinculada (criar nova se feature)
4. Harness/regression test em mesmo PR
5. CI verde
6. Commit format `AKITA-XXX: Título — Descrição`

---

## 📜 License

MIT — fork, customize, ship your own football manager. Just keep credits.

---

## 🙏 Credits

Built by [@dudujarra](https://github.com/dudujarra) with **Claude Code** (Anthropic) under AKITA Protocol.

Inspired by:
- Football Manager (Sports Interactive)
- Hattrick (online manager classic)
- Elifoot 98 (Brazilian classic)

---

**🎮 [Play live](https://dudujarra.github.io/elifoot-web/)** — sem signup, sem cookie, sem cobrança.

Made with ❤️ + ⚽ + 🥋 disciplina Akita.
