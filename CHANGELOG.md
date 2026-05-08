# Changelog ELIFOOT RPG

Todas mudanças notáveis seguem [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) + [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### [feat] v1.0.7 — Camada 2 Foundation (AKITA-050) (2026-05-08)

- `src/data/eventTemplates.js`: **66 templates handwritten** em 15 categorias de eventos
  - PLAYER_GOAL_DECISIVE (8), PLAYER_RED_CARD (5), PLAYER_TRANSFER_TO_RIVAL (5)
  - PLAYER_INJURY_LONG_TERM (4), PLAYER_RETIRED (4), PLAYER_CANONIZED (3)
  - TITLE_WON (5), TITLE_LOST_DRAMATICALLY (4)
  - DERBY_VICTORY (5), DERBY_DEFEAT (5)
  - TORCIDA_PROTEST (4), PRESIDENT_CONFRONTATION (5)
  - STAFF_HIRED (3), STAFF_FIRED (3), TACTIC_CHANGED_DRAMATICALLY (3)
- Vocabulário fixo: cada template usa apenas `EVENT_TYPES` + `EVENT_TAGS` defined (validation in tests)
- Schema: `{id, type, defaults: {valence, intensity, tags, narrativeWeight}, headline}`
- `NarrativeService.appendEventFromTemplate(save, templateId, ctx)` aplica defaults + fills slots
- `NarrativeService.appendRandomEvent(save, eventType, ctx)` picks random template
- Lookup helpers: `getEventTemplate`, `getTemplatesByType`, `pickRandomTemplate`
- SAVE_VERSION 3 → 4 (saves v<4 auto-invalidados)
- 429 tests passing (414 + 15 new)
- Build: 43.28 KB CSS / 456.41 KB JS (+16 KB pelos 66 templates)

**v1.0.7.1 backlog:** expandir 66 → 80+ templates (4 templates por tipo mínimo).

**Próximo PR:** v1.1 — Camada 5 Mito (Hall de Lendas + canonização)


### [refactor] AKITA-RFCT-001 — Characterization Tests / Golden Master (2026-05-08)

- `tests/characterization/engine-golden.test.js` implementado
- Mock global `Math.random` com seeded RNG (Mulberry32-like, seed=42)
- 4 tests:
  - 5-season simulation snapshot (toMatchSnapshot)
  - Determinismo cross-instance (3 runs idênticos)
  - initGame deterministic team count
  - 40-week simulation completes without throwing
- Snapshot file: `tests/characterization/__snapshots__/engine-golden.test.js.snap` (170 teams, top5 BRA div1)
- 318 tests passing (314 + 4 new)
- Duration: 536ms (target <10s ✅)
- Engine NÃO modificado (RFCT-001 invariante preservado)
- Build inalterado: 43.28 KB CSS / 427.34 KB JS

**Próximo PR:** AKITA-RFCT-002 — Save baseline + round-trip test

### [refactor] AKITA-RFCT-002 — Save Baseline + Round-trip Test (2026-05-08)

- `tests/characterization/save-roundtrip.test.js` (6 tests)
- BUG-021 regression embedded (tournament prototype)
- Fixture `__fixtures__/save-baseline-v2.json` regenerado em runtime (.gitignored, 11MB)
- 324 tests passing (318 + 6 new)
- Engine NÃO modificado

**Próximo PR:** AKITA-RFCT-003 — Stryker mutation baseline

### [refactor] AKITA-RFCT-003 — Stryker Mutation Baseline (DEFERRED) (2026-05-08)

- `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` instalados (devDeps)
- `stryker.conf.json` configurado (mutate engine.js + MatchEventsDeck + PlayerDevelopment)
- npm scripts `mutate` + `mutate:report` adicionados
- Baseline run **deferred:** initial run took >11min, exceeded RFCT-003 Definition of Stop (30min threshold preventivo). Setup pronto, baseline será capturado on-demand quando manageable
- `.gitignore` updated (.stryker-tmp/, reports/, stryker-report/)

**Próximo PR:** AKITA-RFCT-004 — Extract MatchSimulator (10h, **HIGH RISK**)

### [refactor] AKITA-RFCT-004 — Extract MatchSimulator (2026-05-08)

- `src/services/MatchSimulator.js` criado (extracted ~220 LOC de playMatch)
- `engine.playMatch()` vira delegator de 1 linha: `return this._matchSimulator.simulate(this, homeId, awayId, isCup);`
- Constructor injection: `this._matchSimulator = new MatchSimulator()`
- Engine.js: 1.014 → 794 LOC (-220, -22%)
- Imports MatchSimulator: TACTICS + TACTIC_COUNTERS + TACTIC_NARRATION + getFormModifier + getTraitMatchModifier + hasTrait + initCareerStats + recordMatchStats

**Invariante RFCT-004 preservado:**
- ✅ Golden master snapshot IDÊNTICO (snapshot file não modificado)
- ✅ 324/324 tests passing
- ✅ Build inalterado: 43.28 KB CSS / 427.40 KB JS
- ✅ Math.random ordem preservada
- ✅ Mutações in-place no engine state preservadas (squad energy/moral, teamTalkModifiers reset, career stats)

**Próximo PR:** AKITA-RFCT-005 — MythService skeleton (4h, baixo risco)

### [refactor] AKITA-RFCT-005 — MythService Skeleton + Read Methods (2026-05-08)

- `src/services/MythService.js` upgraded skeleton → reads funcionais
- Vocabulários exportados: `MYTH_SLOTS` (6) + `INHERITABLE_TRAITS` (4) — Object.freeze imutáveis
- Reads: `getLegends`, `getHallOfFame`, `getRegenChildren`, `isCanonized`, `countHallSlots`
- Writes: ainda placeholders (RFCT-007)
- `tests/specs/SPEC-MythService.test.js`: 20 unit tests
- 344 tests passing (324 + 20 new)
- Engine NÃO modificado (skeleton em paralelo)

**Próximo PR:** AKITA-RFCT-006 — Move read methods to MythService

### [refactor] AKITA-RFCT-006 — SKIPPED (collapsed into RFCT-005)

Razão: engine.js não tinha métodos getLegends/getHallOfFame/getRegenChildren pré-refactor. RFCT-006 spec presumia existência. Sem nada pra mover, collapsed em RFCT-005 (skeleton já populado com reads).

### [refactor] AKITA-RFCT-007 — MythService Writes + saveSerializer Registry + useMyth Wiring (2026-05-08)

- `MythService.addLegend()` implementado: dedup por playerId+slot, valid slot check, returns {success, msg}
- `MythService.promoteToHallOfFame()` implementado: substitui ocupante anterior em slot
- `MythService.generateRegenChild()` permanece placeholder (v1.3)
- `src/services/saveSerializer.js` upgraded skeleton → registry-based:
  - `register(typeName, classRef)` + `serialize(obj)` + `deserialize(data)`
  - Walk recursive arrays + plain objects
  - Cycle protection via WeakSet
  - Skip Map/Set + functions
- `engine.js`: constructor inicializa `this._mythService = new MythService()`
- `src/hooks/useMyth.js` wired (consume MythService via engine)
- `tests/specs/SPEC-saveSerializer.test.js`: 14 tests (9 saveSerializer + 5 MythService writes)
- 358 tests passing (344 + 14 new)
- Build: 43.28 KB CSS / 429.01 KB JS (+1.61 KB pelo MythService + saveSerializer)

**Próximo PR:** AKITA-RFCT-008 — RelationshipService skeleton

### [refactor] AKITA-RFCT-008+009+010 COLLAPSED — RelationshipService completo (2026-05-08)

3 PRs originais collapsed em 1 (RFCT-009 SKIPPED — no engine reads to move).

- `src/services/RelationshipService.js` upgraded skeleton → reads + writes
- `RELATIONSHIP_RANGE` (-100..+100) + `THRESHOLDS` (LOW=30, MID=60, HIGH=80) Object.freeze
- Reads: `getRivalry`, `getAlliance`, `getCoachReputation`, `getPresidentPatience`
- Writes: `recordDerby` (+5 normal, +10 dramatic, max 100), `recordTransfer` (+8 se rival), `decayRivalry` (half-life 540 dias, floor 10), `adjustTrust`, `adjustPatience`
- Symmetric pair keys (clubA-clubB === clubB-clubA)
- `engine.js` constructor: `this._relationshipService = new RelationshipService()`
- `useRelationships` hook wired
- `tests/specs/SPEC-RelationshipService.test.js`: 18 tests
- 376 tests passing (358 + 18 new)

**Wrap Method em playMatch DIFERIDO:** auto-recording de derbies precisa detection logic ("este é um derby?") — implementação completa em v1.4 EmergentRivalries (SPEC-055). RelationshipService está disponível pra ser chamado quando esse logic existir.

**Próximo PR:** AKITA-RFCT-011 — NarrativeService skeleton + Camadas 1-2

### [refactor] AKITA-RFCT-011+012+013 COLLAPSED — NarrativeService completo (2026-05-08)

3 PRs collapsed em 1.

- `src/services/NarrativeService.js` upgraded skeleton → 5 Camadas funcionais
- **Camada 1 AGENTE:** recordDecision + getDecisions
- **Camada 2 EVENTUAL:** appendEvent (com vocab fixo eventTypes/eventTags), getDecayedEvents (half-life decay), queryEvents (filter by type/tag/actor)
- **Camada 3 RELACIONAL integration:** getRelationalContext via RelationshipService injected
- **Camada 4 NARRATIVA:** openArc, getOpenArcs, closeArc, addMilestone (arcos nomeados)
- **Camada 5 MITO integration:** canonize → MythService.addLegend, promoteToHall → MythService.promoteToHallOfFame
- Constructor injection: `new NarrativeService({ relationshipService, mythService })`
- HALF_LIFE_DAYS table conforme SPEC-049 (TITLE_WON 1095/0.20, PLAYER_RED_CARD 90/0.0, etc.)
- `engine.js` constructor wires `_narrativeService` com deps injected
- `useNarrative` hook wired (12 methods)
- `tests/specs/SPEC-NarrativeService.test.js`: 21 tests (todas 5 camadas + sem ciclos arquiteturais)
- 397 tests passing (376 + 21 new)
- Build: 43.28 KB CSS / 435.64 KB JS (+4.36 KB pelo NarrativeService)

**Verificado:** sem ciclos arquiteturais (Narrative → Relationship → ø, Narrative → Myth → ø).

**Próximo PR:** AKITA-RFCT-014+015+016 — CareerService completo

### [refactor] AKITA-RFCT-014+015+016 COLLAPSED — CareerService + Transição (2026-05-08)

3 PRs collapsed.

- `src/services/CareerService.js`:
  - **RFCT-014:** getProPlayer, advanceCareer (Player mode)
  - **RFCT-015:** getManagerCareer, signWithClub, getOffers, addOffer
  - retireProPlayer delega a CareerTransition
- `src/services/CareerTransition.js` (Replace Method with Method Object pattern):
  - **RFCT-016:** 5 private steps:
    1. _validateRetirementEligible (35+ anos OU 12+ temps)
    2. _snapshotPlayerCareer (persiste em retiredPlayers)
    3. _promoteToManager (init managerCareer + flag retired)
    4. _inheritRelationships (ex-clubes +5 trust, hall slots ≥2 +10 trust)
    5. _calculateInitialReputation (Tier S +20 each, A +10, B +5, 200+ goals +10, 100+ assists +5, cap 100)
- `engine.js` constructor wires `_careerService` com 3 deps injected
- `useCareer` hook wired (7 methods)
- `tests/specs/SPEC-CareerService.test.js`: 17 tests
- 414 tests passing (397 + 17 new)
- Build: 43.28 KB CSS / 439.16 KB JS

**Próximo PR:** AKITA-RFCT-017 — SAVE_VERSION 2→3 + final cleanup (FIM v1.0.5)

### [refactor] AKITA-RFCT-017 — SAVE_VERSION 2→3 + Final Cleanup (2026-05-08) — **FIM v1.0.5**

- `SAVE_VERSION` bumped 1 → 3 (saves v<3 auto-invalidados)
- `GameContext.jsx`:
  - Imports tournament classes (Tournament, League, KnockoutCup, ContinentalCup)
  - `tournamentClassFromShape()` heurística pra prototype restore
  - `ENGINE_CLASS_FIELDS` expandido com todos services (`_matchSimulator`, `_mythService`, `_relationshipService`, `_narrativeService`, `_careerService`) — recriados em constructor
  - BUG-021 fix incorporado oficialmente (tournament prototype restoration)
  - Console info on version mismatch
- 414 tests passing
- Build: 43.28 KB CSS / 439.90 KB JS

## v1.0.5 — REFACTOR COMPLETO ✅

| Métrica | Antes | Depois | Delta |
|---------|-------|--------|-------|
| engine.js LOC | 1.014 | 794 | -220 (-22%) |
| Services criados | 0 | 5 (MatchSimulator + Myth + Relationship + Narrative + Career) | +5 |
| Tests passing | 314 | 414 | +100 (+32%) |
| Build CSS | 25 KB | 43 KB | +18 KB (themes) |
| Build JS | 394 KB | 440 KB | +46 KB (services + tooltips) |
| PRs merged | — | 11 (RFCT-001 a RFCT-017) | — |

**Princípios mantidos:**
- ✅ Bottom-up isolated → entrelaçado
- ✅ Testes verdes contínuos (414/414)
- ✅ Composição manual + constructor injection
- ✅ Services stateless
- ✅ Chamadas diretas síncronas (sem EventBus)
- ✅ SAVE_VERSION sequencial 1→3
- ✅ Sem ciclos arquiteturais (madge clean)

**Próximas releases:**
- v1.0.7 — Camada 2 Foundation (eventos atômicos + 80 manchetes handwritten)
- v1.1 — Camada 5 Mito (Hall de Lendas + canonização)
- v1.1.5 — Traits Herdáveis
- v1.2 — Transição Jogador→Técnico (ProPlayer aposenta no mesmo save)
- v1.3 — Filhos Regens
- v1.4 — Rivalidades Emergentes
- v1.5 — Crônica do Save

---

## [1.0.0] — 2026-05-08

**Marco oficial v1.0** — Foundation + Live UX completo. Roadmap → v2.0 em https://github.com/dudujarra/elifoot-web.

### Added

**Sprint 1 — Foundation:**
- Tema 32-bit SNES novo (`src/styles/32bit-theme.css`): paleta 24 cores, beveled borders, soft drop-shadow, fonts Pixelify Sans + Courier Prime + IBM Plex Mono. Min font-size floor 0.85rem.
- Theme tri-state cycle: 🎨 modern → 🕹️ 8-bit → 🎮 32-bit → 🎨 (button no header).
- Tooltip system universal (`Tooltip.jsx` + `Help.jsx`) custom CSS-only, zero deps. 78 entries em `src/data/tooltips.json` cobrindo stats/sectors/pos/btns/indicators/traits/tabs.
- Standings color zones FM-classic: Libertadores (verde), Sul-Americana (azul), Promotion (amarelo), Rebaixamento (vermelho). Legend + column header tooltips.
- SPEC-040 (32-bit theme) + SPEC-041 (Tooltip system).

**Sprint 2 — Live UX:**
- Live substitutions durante partida: pause button (1x/2x/5x/⏸️/▶️), `<LiveSquadEditModal>` com 5 subs/jogo (FIFA realista), tactic switch live (`engine.applyLiveSubstitution()`).
- Formation editor visual drag/drop (`<FormationBoard>`): SVG campo 600×400, 11 jerseys posicionáveis com pointer events, 5 formações preset (4-3-3, 4-4-2, 4-2-4, 3-5-2, 5-3-2), reset to preset. `team.formationLayout = { slot: {playerId, x, y, role} }`.
- Pre-match adversary info (`<PreMatchScreen>`): 3-painel layout estilo ELIFOOT clássico — nosso time (esquerda) / VS+CASA/FORA+rodada (centro) / adversário (direita) com sectors, formação, estilo derivado, H2H últimos 5 color-coded, torneio.
- Engine: `applyLiveSubstitution()`, `saveFormationLayout()`, `getMatchContext()`.
- SPEC-042 (Formation Editor) + SPEC-043 (PreMatch Screen) + SPEC-044 (Live Subs).

### Changed
- DashboardView, SquadView, MarketView, StandingsView: trocados `title=""` HTML por `<Help>`/`<Tooltip>` components.
- Theme switch state: boolean → string tri-state ('modern'|'8bit'|'32bit').
- `package.json` 0.0.0 → 1.0.0.

### Tests
- 628 tests passing.
- P1-7 atualizado pra checar `<Help id=...>` ao invés de legacy `title=`.

### Build
- CSS: 25 KB → 43 KB (theme 32-bit + tooltip styles + zone classes)
- JS: 394 KB → 427 KB (Tooltip + Help + LiveSquadEditModal + FormationBoard + PreMatchScreen + FormationLayout + engine methods)

### Limitação Conhecida
- **Live subs não recalculam resultado:** engine simulação é sync pré-computada. Refactor para generator/state-machine planejado em v1.3.

---

## Pre-1.0 (beta funcional)

20 bugs corrigidos via AKITA 3-artefact protocol (issue + fix + regression test). 30 specs SDD + CI/CD GitHub Actions + auto-deploy GitHub Pages. 14 sprites pixel-art via Google Flow Nano Banana Pro. 10 Stitch designs (Dashboard/Match/Squad/Stadium/Market/Standings + 3 variants).

Ver `BUGS.md` + git log AKITA-001 a AKITA-051 para detalhes completos.
