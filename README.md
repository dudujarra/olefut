# ⚽ ELIFOOT RPG

> **Football Manager + RPG depth + Brazilian flavor.**
> 100% Spec-Driven Development. Zero vibe coding. Open source.

🎮 **Live demo**: https://dudujarra.github.io/elifoot-web/

[![CI](https://github.com/dudujarra/elifoot-web/actions/workflows/ci.yml/badge.svg)](https://github.com/dudujarra/elifoot-web/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-320%2F320-brightgreen)](https://github.com/dudujarra/elifoot-web/tree/main/tests)
[![Specs](https://img.shields.io/badge/specs-30-blue)](https://github.com/dudujarra/elifoot-web/tree/main/specs)
[![SDD](https://img.shields.io/badge/SDD-100%25-purple)](https://github.com/dudujarra/elifoot-web/blob/main/specs/SPEC-RULES.md)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 🎯 What is it

ELIFOOT RPG = simulador futebol brasileiro com profundidade RPG. Gerencia 1 dos **170 clubes reais**, treina elenco, negocia contratos, sobe divisões, constrói legado.

**Diferencial técnico**: projeto inteiro construído via **SDD (Spec-Driven Development)** + **Protocolo AKITA**. Cada feature tem spec → harness → implementação → validação. Zero código sem teste.

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

| Métrica | Valor |
|---------|-------|
| **Specs documentadas** | 30 (FASE 1-5) |
| **Test files** | 38 |
| **Tests passing** | 320 / 320 |
| **Bugs fixados (Akita 3-artefact)** | 8 |
| **Engine modules** | 26 (14 originais + 12 systems) |
| **Validações spec** | 218 |
| **Casos forbidden** | 125+ |
| **Coverage codebase** | 92% |
| **Build size** | 381KB JS + 11KB CSS (gzip 110KB) |
| **Build time** | <100ms |
| **Times BR reais** | 170 |
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

## 🔄 Recent commits

```
AKITA-031: Sweep batch 2 — 4 bugs deep audit (BUG-011 a 014)
AKITA-030: Sweep batch 1 — 4 bugs fix + regression tests (BUG-007 a 010)
AKITA-029: Skill elifoot-debug — trigger automático workflow bug
AKITA-028: Bug debug workflow + tests serial automation
AKITA-027: Build completo — 12 modules + 28 harnesses + CI/CD + Pages
AKITA-026: Master guide para 30 specs
AKITA-025: FASE 5 — 7 backlog & polish specs
AKITA-024: FASE 3-4 — 15 secondary + infrastructure specs
AKITA-023: FASE 2 — 8 specs core
AKITA-022: FASE 1 Fundação SDD — Estrutura specs/ + governance
```

---

## 📚 Docs

- [SPECS-MASTER-GUIDE.md](SPECS-MASTER-GUIDE.md) — índice navegável 30 specs
- [BUGS.md](BUGS.md) — bug tracker permanente (8 fixados)
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
