# ⚽ ELIFOOT RPG

> **Manager brasileiro + RPG depth + narrativa emergente.**
> Open source. Browser-zero-install. Spec-Driven Development discipline.

🎮 **[Jogue agora](https://dudujarra.github.io/elifoot-web/)** — sem download, sem login.

[![CI](https://github.com/dudujarra/elifoot-web/actions/workflows/ci.yml/badge.svg)](https://github.com/dudujarra/elifoot-web/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-1157%2F1157-brightgreen)](https://github.com/dudujarra/elifoot-web/tree/main/tests)
[![Specs](https://img.shields.io/badge/specs-124-blue)](https://github.com/dudujarra/elifoot-web/tree/main/specs)
[![Bugs regression](https://img.shields.io/badge/bugs%20regression-17-orange)](https://github.com/dudujarra/elifoot-web/blob/main/BUGS.md)
[![Clubes BR](https://img.shields.io/badge/clubes%20BR-88-green)](https://github.com/dudujarra/elifoot-web/blob/main/src/engine/db/brazil.js)
[![License](https://img.shields.io/badge/license-MIT-purple)](LICENSE)

---

## O que é

Simulador de carreira de técnico/jogador no futebol brasileiro. Pega 1 dos **170 clubes reais** (BR + EU + SA), gerencia plantel, finanças, tática e diretoria. Cada save vira uma **história única** via:

- **Sistema de cartas RPG** — 40 cartas tieradas (comum/incomum/raro/lendária) com weighted draw + renown gate
- **Crônica do Save** — narrativa auto-gerada exportável (PNG/PDF) por temporada
- **Hall de Lendas** — 6 slots permanentes por clube (Ídolo Eterno, Carrasco, Cria da Base, Traidor, etc) + Heritage Traits herdáveis em regens
- **LLM Bridge offline** — WebLLM browser-side para narrativa contextual (opt-in, sem API paga)
- **5 camadas narrativas** — Agente / Eventual / Relacional / Narrativa / Mito (SPEC-049)

**Diferencial**: nicho **"manager BR + RPG + narrativa emergente + open source + zero install"** — vago entre Brasfoot (nostalgia arcade) e Football Manager (simulação enciclopédica).

**Status**: v1.0 released. Próxima fase = polish gameplay (ver [GAME-DESIGN-ROADMAP](specs/GAME-DESIGN-ROADMAP-2026-05-12.md)).

---

## Quick Start

```bash
git clone https://github.com/dudujarra/elifoot-web.git
cd elifoot-web
npm install
npm run dev          # http://localhost:5173
```

Build + preview:
```bash
npm run build
npm run preview
```

---

## Stack

| Camada | Tech |
|--------|------|
| Engine | JavaScript ES2022 puro (headless, zero React) |
| UI | React 19 + Vite 8 |
| Tests | Vitest 4 + Playwright (E2E) |
| LLM | @mlc-ai/web-llm (offline browser-side) |
| CI/CD | GitHub Actions → GitHub Pages |
| Design | 32-bit SNES theme (Pacaembu palette) |

---

## Roadmap (game design first)

Após 37+ PRs de refactor técnico (engine 1525→437 LOC, AutoPlay 1280→490 LOC), foco muda para **gameplay**:

- **Fase A (15h) — Jogável**: sidebar reduzida, onboarding 90s, PreMatch decision-ready, PostMortem painel
- **Fase B (35h) — Prazeroso**: match dramatization, mid-match decisions, Crônica fim-temporada
- **Fase C (60h) — Memorável**: LLM real (3 use cases), modo unificado, StateChamp wire-up, mod hooks
- **Fase D — Launch**: marketing histórias, Discord, content trimestral

Roadmap completo: [`specs/GAME-DESIGN-ROADMAP-2026-05-12.md`](specs/GAME-DESIGN-ROADMAP-2026-05-12.md)

5 camadas narrativas operacionais: [`specs/SPEC-049-narrative-layers-mvp.md`](specs/SPEC-049-narrative-layers-mvp.md)

---

## Testing

```bash
npm test                  # default suite (1157 tests)
npm run test:regression   # bugs regression
npm run test:specs        # spec harnesses
npm run test:soak         # deep soak (100 seasons isolated)
npm run test:e2e          # Playwright E2E (8 flows)
```

---

## Architecture

```
src/
├── engine/              # Headless simulation (zero React)
│   ├── engine.js        # Orchestrator (437 LOC, refactored from 1525)
│   ├── data.js          # Player/squad generation
│   ├── db/              # 170 clubes (BR/EU/SA)
│   ├── tournaments/     # League, KnockoutCup, ContinentalCup, StateChampionship
│   ├── decks/           # MatchCards (40 cartas tieradas)
│   └── systems/         # 40+ sistemas (Achievements, ChallengeModes, etc)
├── services/            # 64 services (extracted from engine)
│   ├── MatchSimulator.js
│   ├── AutoPlayService.js (490 LOC, refactored from 1280)
│   ├── LLMNarrativeService.js
│   ├── ChronicleService.js
│   └── ...
├── components/          # React UI (20+ views)
└── styles/              # luxury-arcade.css + design tokens

specs/                   # 124 SPECs (SDD source of truth)
├── GAME-DESIGN-ROADMAP-2026-05-12.md   # game design master
├── MASTER-ROADMAP-FOUNDATION-FIRST.md  # technical foundation
├── SPEC-049-narrative-layers-mvp.md    # 5 camadas
├── refactor/            # 21 RFCT specs
└── ui/                  # 7 UI specs

tests/
├── unit/                # vitest
├── specs/               # SPEC-XXX harnesses
├── regression/          # BUG-XXX (17 files)
├── e2e/                 # Playwright (8 flows)
└── characterization/    # golden master
```

---

## Bug workflow (Akita Mandamento #6)

> **Bug = ticket + fix + regression test (3 artefatos pareados)**

```bash
npm run bug:full "lesão duplica weeks"   # ciclo completo
```

CI auto-roda regression em todos PRs. Templates forçam 3-artefact checklist.

Tracker: [`BUGS.md`](BUGS.md) | Changelog: [`CHANGELOG.md`](CHANGELOG.md)

---

## Protocolo AKITA

7 mandamentos universais (filosofia anti-vibe-coding):

1. **SDD obrigatório** — sem spec, sem trabalho
2. **Sem harness, sem spec** — toda spec entrega harness executável no mesmo PR
3. **Anti-vibe coding** — proibido one-shot prompt sem entender resultado
4. **CLAUDE.md central** — single source of truth técnica
5. **GitHub público dia 1** — build in public
6. **Bug = ticket + fix + regression test** — 3 artefatos pareados
7. **LLM local default** — API paga proibida

Detalhes: [`AKITA_RULES.md`](AKITA_RULES.md) | Contribuindo: [`CONTRIBUTING.md`](CONTRIBUTING.md)

Commits: `AKITA-XXX: Título — Descrição` (pre-commit hook valida).

---

## Docs

| Documento | Função |
|-----------|--------|
| [`CLAUDE.md`](CLAUDE.md) | Fonte única técnica (agentes leem primeiro) |
| [`AKITA_RULES.md`](AKITA_RULES.md) | Constituição (7 mandamentos) |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Workflow contribuidores |
| [`specs/GAME-DESIGN-ROADMAP-2026-05-12.md`](specs/GAME-DESIGN-ROADMAP-2026-05-12.md) | Game design master |
| [`specs/SPEC-RULES.md`](specs/SPEC-RULES.md) | Governance SDD |
| [`docs/SDD_ELIFOOT_RPG.md`](docs/SDD_ELIFOOT_RPG.md) | Mecânicas implementadas |
| [`docs/MANUAL_COMPLETO.md`](docs/MANUAL_COMPLETO.md) | Manual do jogador |
| [`BUGS.md`](BUGS.md) | Bug tracker |
| [`CHANGELOG.md`](CHANGELOG.md) | Histórico de releases |

---

## License

MIT © Eduardo Jarra (Dudu) — dudujarra@corapost.com
