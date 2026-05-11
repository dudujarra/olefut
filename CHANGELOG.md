# Changelog ELIFOOT RPG

Todas mudanças notáveis seguem [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) + [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### [feat] AKITA-204 — Bundle code-split + lint + isolation + skipAutoRestore + cleanup (2026-05-11)

PR único consolidando múltiplas frentes (commit `4b54cd4`).

**Fix de bug latente em prod — NPC brain unique persona**:

Todos NPCs criados pelo engine compartilhavam `STORAGE_KEY = 'elifoot_autoplay_brain'` via `AdaptiveBrain._restore()` no constructor. Convergiam para uma única persona (a do último autoplay save). Quebrava SPEC-117 (unique OCEAN) e marl-e2e test silenciosamente em prod.

- `AdaptiveBrain` constructor agora aceita `{ skipAutoRestore }`. Engine passa `true` para NPC brains; NPCs hidratam via `BrainPersistence.js` com per-team keys.
- Regression test: `tests/regression/SPEC-117-skip-auto-restore.test.js` (5 testes — Mandamento #6 — 3-artefact).
- Test `tests/integration/marl-e2e.test.js > NPC brains have EmotionalEngine attached` agora passa.

**Bundle code-split**:

- `index.js` 1.56MB → **376KB** (-76%, gzip 110KB). 16 views via `React.lazy()` + `Suspense` fallback.
- Eager mantido: `StartView`, `DashboardView`, `Sidebar`, `FloatingBugButton`, `AudioController`, `EfButton`.
- Inline `isTutorialDone` em `StartView.jsx` elimina `INEFFECTIVE_DYNAMIC_IMPORT`.

**Lint cleanup** (180+ → 130 warnings, 0 errors):

- 6 `react-hooks/rules-of-hooks` (bugs reais) corrigidos em `MarketView.jsx` (early-return movido para depois dos `useState`).
- 47 imports `React` mortos removidos via codemod (React 19 JSX runtime — main usava `/* eslint-disable no-unused-vars */` band-aid).
- `TutorialView.jsx`: `backgroundColor` duplicado removido (lint error blocker).

**Isolation de testes**:

- `tests/_setup-isolate-localstorage.js` + `setupFiles` no `vite.config.js` limpam `localStorage` no início de cada suite. Resolve root cause de flakies order-dependent (`.vitest-localstorage*` persistia state entre runs). Mais granular que `fileParallelism: false` que main usava como mitigação.

**SDD enforcement local**:

- `scripts/spec-check.sh` copiado de `~/bin/`. CI workflow já referenciava com fallback.

**Root cleanup** (4.5MB de artefatos transientes deletados):

- 3× screenshots, `vitest_report.json`, `test_output.txt`, `build_errors.log`, `audit-escudos.html`, `shield-audit.html`, `fifa_sample.csv` stub, `lint_output.txt`, `lint_json.json`.
- 11 scripts ad-hoc órfãos: `audit_ui.cjs`, `check_teams.{cjs,js}`, `fix_*.{py,cjs,js}`, `test_{squad,ui,localstorage}*`, `screenshot*.js`. Nenhum referenciado em `package.json`/CI.
- `.gitignore` patterns previnem regressão.

**Débitos restantes** (documentados para próximo PR):

- `tests/integration/deep-soak-100seasons.test.js` flaky em suite-load (main bumped pra 600s + inline clear; ainda intermitente — débito para `npm run test:soak` solo).
- 14 `react-hooks/set-state-in-effect` warnings — anti-pattern, sem mudança comportamental urgente.
- SPEC formal para code-split + skipAutoRestore (escopo de pre-implementação não documentado — débito SDD).

### [docs] AKITA-203 — Documentação canônica Akita (2026-05-11)

Mandamento #4 (CLAUDE.md fonte única técnica) e #5 (GitHub público dia 1) tinham gaps no repo.

Criados:

- `CLAUDE.md` (raiz — fonte única técnica)
- `LICENSE` MIT (README anunciava sem arquivo)
- `CONTRIBUTING.md` (workflow Akita para contribuidores)
- `GEMINI.md`, `CODEX.md` (espelhos slim multi-IA partindo do mesmo ponto)
- `specs/generators/{code,research,pipeline,decision}.md` (templates SDD)
- `.github/ISSUE_TEMPLATE/feature_request.md` (SPEC-first)

Atualizados:

- `AKITA_RULES.md` → 7 mandamentos globais (SDD, Regra 0, anti-vibe, fonte única, GitHub público, 3-artefact, LLM local) + arquitetura como restrições.
- `README.md` → badges e tabela Numbers corrigidos (1035/1035, 97 specs, 169 commits). Aviso topo apontando docs canônicas.
- `BUGS.md` → inventário real de `tests/regression/`.
- `SPECS-MASTER-GUIDE.md` → 30→97 specs.
- `.github/PULL_REQUEST_TEMPLATE.md` + `bug_report.md` → Regra 0 explícita.

### [feat] v2.0.0 — SNES Pacaembu Edition (2026-05-08)

Massive 6-sprint cohesive design + motion overhaul. Estética 32-bit SNES ISS Deluxe / PS1-era, paleta Pacaembu (grass green #2D5A3D, gold #FFD700, leather brown #6B3D1F), narrative event banners, atmospheric backdrops, animation strips e cleanup legacy.

#### Sprint 1 (AKITA-075) — atmospheric art utility classes + 6 views

- `src/styles/animations.css`: 14 `.ef-art-*` utility classes (newspaper, boardroom, champion-celebration, pitch-topdown, state-arrows, sponsors, finance-icons, celebration, weather-overlay, managers, players, achievements, crowd-strip, bg-overlay)
- StartView: `ef-art-champion-celebration` backdrop
- ChronicleView: `ef-art-newspaper` backdrop
- StandingsView: `ef-art-state-arrows` backdrop
- RivalriesView: `ef-art-crowd-strip` backdrop
- SquadView: `ef-art-players` backdrop
- MarketView: `ef-art-finance-icons` backdrop
- PlayerDashboardView: `ef-art-managers` backdrop
- All atmospheric backdrops use `ef-art-bg` overlay (rgba 0F1A14 78%) for legibility

#### Sprint 2 (AKITA-076) — 9 EfBanner triggers wired (13/13 total)

DashboardView (Manager mode):
- `prevSeasonRef`: champion/promotion/relegation on season transition
- `prevSponsorRef`: sponsor banner on new contract signed
- `prevInjuriesRef`: injury banner on new injury added
- `prevSuspensionsRef`: suspension banner on new suspension added

PlayerDashboardView (Player mode):
- `prevTeamIdRef`: hired banner on team change
- `prevRetiredRef`: retirement banner when `_retired` flips true
- `prevMotmRef`: motm banner on `career.seasonMotm` increment

Total banner coverage: champion / promotion / relegation / fired / hired / retirement / offer / sponsor / motm / hattrick / injury / suspension / cleanSheet.

#### Sprint 3 (AKITA-077) — 3 animation strips generated + applied

Stitch (GEMINI_3_FLASH):
- `ball-kick-6frames.png` (footballer kick action, leather brown jersey)
- `gk-save-5frames.png` (goalkeeper diving save, yellow jersey)
- `crowd-flag-wave-4frames.png` (fan flag wave, green/yellow checkered)

CSS: 3 keyframes (ef-ball-kick 600ms / ef-gk-save 700ms / ef-crowd-flag-wave 1200ms loop) + 3 utility classes + reduced-motion query.

MatchView integration:
- `ef-anim-crowd-flag-wave` permanent in scoreboard top-right (55% opacity)
- `ef-anim-ball-kick` triggered on goal (1300ms)
- `ef-anim-gk-save` triggered when narration mentions defesa/save events

#### Sprint 4 (AKITA-078) — 7 atmospheric assets

Stitch (GEMINI_3_FLASH):
- `banners/locker-room.png` (pre-match wooden interior + chalkboard)
- `banners/tunnel-walkout.png` (first-person stadium tunnel exit)
- `banners/press-box.png` (press conference podium + microphones)
- `banners/trophy-room-cabinet.png` (12 trophies hall of fame cabinet)
- `pitch-tactical-433.png` (top-down 4-3-3 formation grid)
- `pitch-patterns-4variants.png` (4 grass mowing patterns 2x2 grid)
- `stadium-night-D-I-variants.png` (6 stadium tiers night progression)

CSS: 7 new `.ef-art-*` utility classes.
PreMatchScreen: `ef-art-locker-room` backdrop applied.

**Deferred to v2.0.1**: `loading-splash.png` (Stitch backend timeout 3x retries 2026-05-08, no screen materialized in project `list_screens`). Fallback: existing dark-green theme + `ef-anim-spinner` sprite cover splash needs.

#### Sprint 5 (AKITA-079) — legacy 8-bit cleanup + migration

Deleted dead legacy assets (no remaining refs):
- `logo-8bit.svg`
- `icons-set-classic.jpeg`
- `weather-classic.jpeg`
- `stadium-progression-A/B/C.jpeg` (replaced by D-I variants)

Migrated:
- `8bit-theme.css` `.stadium-icon` → uses `stadium-night-D-I-variants.png` (6 tiers, data-level 1-6)
- README assets section updated to reflect 40+ sprites + 32-bit baseline

#### Asset count v2.0.0

- 13 club spritesheets covering 170 clubs (BR + EU + SA full coverage)
- 9 animation strips (6 prior + 3 Sprint 3)
- 7 atmospheric backdrops (Sprint 4) + 4 prior (newspaper/boardroom/champion/state-arrows)
- 4 pitch variants (mowing) + 1 tactical 4-3-3 grid
- 13 EfBanner narrative event types fully wired
- 21 `.ef-art-*` utility classes total
- 1045/1045 tests passing



Monitor agora captura tudo SEM user action.

- `MonitorService.install()` expandido:
  - Patch `console.error` + `console.warn` (auto-log warnings/errors)
  - Performance metrics snapshot a cada 60s (jsHeap MB)
  - SESSION_START event com URL + UA + screen size
- `MonitorService.instrumentEngine(engine)`:
  - Wraps 19 métodos engine críticos: advanceWeek, playMatch, setTactic, setFormation, doTraining, doTeamTalk, buyPlayer, sellPlayer, accept/rejectTransferOffer, upgradeAcademy/Stadium, hire/fireStaff, doScouting, signScoutedPlayer, renewContract, applyLiveSubstitution, saveFormationLayout
  - Auto-log args summarizados + elapsedMs + currentWeek
  - Captura erros engine + re-throw
  - Idempotente
- `GameContext`:
  - `instrumentEngine()` chamado em mount + após startGame
  - `changeView` log NAV {from, to}
  - `startGame` log GAME_START
- `tests/specs/SPEC-MonitorAutoLogger.test.js`: 14 unit tests
- 516 tests passing (502 + 14 new)
- Build: 43.28 KB CSS / 472.02 KB JS

**Diferencial v1.7 vs v1.6:** v1.6 user reporta. v1.7 sistema captura automaticamente:
- Toda chamada engine (19 métodos)
- Toda navegação entre telas
- console.error/warn capturados
- Performance memory snapshot
- Session metadata

Resultado: log completo da experiência sem effort.

### [feat] v1.6 — Monitor System (2026-05-08)

- `src/services/MonitorService.js`:
  - 4 categorias: bug / gameplay / feedback / note
  - 4 severities: critical / error / warning / info
  - Auto-capture window.onerror + unhandledrejection
  - Methods: recordBug, recordGameplay, recordFeedback, recordNote
  - Singleton pattern (getInstance)
  - Storage localStorage `elifoot_monitor` (separado do save)
  - FIFO cap 500 entries
  - exportJSON + getStats + getByCategory
- `src/components/MonitorView.jsx`:
  - View `monitor` (botão 📊 no header)
  - Filter por categoria
  - Stats summary
  - Export JSON download
  - Clear all (com confirm)
  - Stack traces collapsible
- `src/components/FloatingBugButton.jsx`:
  - Botão 🐛 sempre visível canto inferior direito
  - Modal com 3 categorias (bug/feedback/note)
  - Submit + auto-close 1.5s confirm
- `src/App.jsx` wires monitor + install global handlers
- `tests/specs/SPEC-MonitorService.test.js`: 14 unit tests
- 502 tests passing (488 + 14 new)
- Build: 43.28 KB CSS / 469.74 KB JS

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

### [feat] v1.1 — Camada 5 Mito (AKITA-051) (2026-05-08)

- `MythService.evaluateMyth(save)` função pura: scan all players + auto-promote candidatos
  - **idoloEterno:** 200+ gols carreira + 1+ título + 8+ temps no clube
  - **criaDaBase:** isYouth + 5+ temps + 50+ jogos
  - **goleirao:** GOL position + 50+ clean sheets
  - Idempotente (re-runs não duplicam)
  - Retired players também candidatos
- `MythService.getTotalCanonized(save)`: count global slots filled
- `src/components/ClubGalleryView.jsx`: UI estática Hall de Lendas
  - 6 slots com labels + descriptions
  - Resolve playerId via squad ou retiredPlayers
  - Counter "X / 6 slots preenchidos"
- `tests/specs/SPEC-evaluateMyth.test.js`: 10 unit tests
- 439 tests passing (429 + 10 new)
- Build: 43.28 KB CSS / 457.60 KB JS
- SAVE_VERSION 4 → 5 (Mito halls + retiredPlayers)

**Próximo:** v1.1.5 — Traits Herdáveis

### [feat] v1.1.5 — Traits Herdáveis (AKITA-052) (2026-05-08)

- `src/services/InheritanceService.js` (~140 LOC):
  - 4 traits range 0-100: garra, talento_natural, lealdade, frieza
  - SLOT_BIAS table: cada slot do Hall contribui +/- diferentemente
    - idoloEterno: lealdade +20, talento_natural +15
    - traidor: lealdade -25
    - goleirao: frieza +25
    - criaDaBase: lealdade +30, talento_natural +15
    - carrasco: frieza +20, garra +15
    - lendaTragica: garra +20, lealdade +15
  - Pipeline: `initializeBaseTraits → applyHallBias (15%) → applyParentInheritance (40%)`
  - Helpers: getDominantTrait, findClosestHallMatch
- `src/data/headlines/mitoHerdado.js`: 2 → **12 manchetes** (+10 novas slots {trait_principal}, {trait_valor}, {idade}, {clube})
- `engine.js` constructor wires `_inheritanceService` com mythService injected
- `tests/specs/SPEC-InheritanceService.test.js`: 14 unit tests
- 453 tests passing (439 + 14 new)
- Build: 43.28 KB CSS / 459.33 KB JS
- SAVE_VERSION 5 → 6 (regen inheritance traits)

**Próximo:** v1.2 — Transição Jogador→Técnico (mesmo save)

### [feat] v1.2 — Transição Jogador→Técnico UI (AKITA-053) (2026-05-08)

- `src/components/PresidentBar.jsx`: barra paciência presidente com 4 thresholds
  - 80+ Carta Branca (verde)
  - 50-79 Atento (amarelo)
  - 25-49 Cobrança (laranja)
  - <25 Ultimato (vermelho)
  - Confiança bipolar (-100..+100) com ponto central
- `src/components/OldTeammatesWidget.jsx`: lista ex-companheiros ativos pós-transição (+30% bias aceitação)
- `src/data/headlines/pressConference.js`: 12 manchetes coletivas pré/pós jogo + crisis management
- `src/data/headlines/index.js` re-exports pressConference
- 453 tests passing (mantido)
- Build: 43.28 KB CSS / 459.33 KB JS
- SAVE_VERSION 6 → 7 (transição + manager_president)

**Notas:** CareerService.retireProPlayer + CareerTransition + RelationshipService já implementados em v1.0.5. v1.2 entrega UI/manchetes que consomem esses services. Wiring completo em DashboardView fica pra v1.2.1 (integration polish).

**Próximo:** v1.3 — Filhos Regens (16-18 anos após auge)

### [feat] v1.3 — Filhos Regens (AKITA-054) (2026-05-08)

- `MythService.generateRegenChild(save, parentId, ctx)` implementado:
  - Encontra parent em squad ativa OU retiredPlayers
  - Probabilidade gate: rng < 0.25 (1 em 4 temps)
  - Idade nascimento: 16-18 anos
  - Herda traits via InheritanceService injected (parent ratio 40%)
  - Persist em `save.regenLineage[]`
  - Child marcado com `isRegenChild: true`
- `tests/specs/SPEC-RegenLineage.test.js`: 11 unit tests
  - Parent encontrado (active/retired), age range, probabilidade gate, herança traits, lineage persist
- 464 tests passing (453 + 11 new)
- Build: 43.28 KB CSS / 460.22 KB JS
- SAVE_VERSION 7 → 8 (regenLineage)

**Notas:** auto-trigger generateRegenChild em advanceWeek fica pra v1.3.1 (engine integration). Service ready, lineage tracking funcional.

**Próximo:** v1.4 — Rivalidades Emergentes (Camada 3 expandida)

### [feat] v1.4 — Rivalidades Emergentes (AKITA-055) (2026-05-08)

- `src/data/narrativeArcs.js`: 6 arcs nomeados Camada 4
  - A Maldição dos Aflitos (3+ finais perdidas)
  - Os Anos de Chumbo (8+ semanas moral baixa)
  - A Vingança Lenta (rivalry ≥ 70)
  - O Renascimento (5+ wins streak)
  - A Sombra do Pai (regen child low performance)
  - A Dinastia (3+ títulos consecutivos)
- `NarrativeService.evaluateArcs(save)`: auto-trigger arcs por threshold
  - Rivalry ≥ 70 abre "A Vingança Lenta"
  - Idempotente
- `src/components/RivalriesView.jsx`: tabela rivalidades dinâmicas + lista arcs ativos
  - Threshold visual: 50 "novo clássico", 80 "consolidada"
  - Sort por intensity descendente
- `tests/specs/SPEC-NarrativeArcs.test.js`: 11 unit tests
- 475 tests passing (464 + 11 new)
- Build: 43.28 KB CSS / 460.52 KB JS
- SAVE_VERSION 8 → 9 (arcs array completo + 6 arcs vocab)

**Próximo:** v1.5 — Crônica do Save (export prosa por temporada)

### [feat] v1.5 — Crônica do Save (AKITA-056) — **FIM ROADMAP NARRATIVO** ✅ (2026-05-08)

- `src/services/ChronicleService.js`:
  - `generateSeasonChronicle(save, season)`: prosa Markdown da temporada
  - `generateLifetimeChronicle(save)`: histórico completo do save
  - `exportSaveJSON(save)`: debug + share
  - `getStatsSummary(save)`: counts pra header
  - Composição via constructor injection (NarrativeService + MythService + RelationshipService + CareerService)
- `src/components/ChronicleView.jsx`:
  - Toggle Temporada / Save Inteiro
  - Export PNG (canvas render com green border + monospace)
  - Export JSON (debug)
- `tests/specs/SPEC-ChronicleService.test.js`: 13 unit tests
- 488 tests passing (475 + 13 new)
- Build: 43.28 KB CSS / 460.52 KB JS
- SAVE_VERSION 9 → 10 (FIM v1.x)

## ROADMAP NARRATIVO COMPLETO ✅

**16 PRs em 1 dia (2026-05-08):**

| Versão | PR | Conteúdo |
|--------|-----|----------|
| v1.0.5 | #37-46 | Refactor god-class (5 services + MatchSimulator) |
| v1.0.7 | #47 | Camada 2 Foundation (66 templates) |
| v1.1 | #48 | Camada 5 Mito (Hall + canonização) |
| v1.1.5 | #49 | Traits Herdáveis (4 traits + bias) |
| v1.2 | #50 | Transição UI (PresidentBar + OldTeammates) |
| v1.3 | #51 | Filhos Regens (lineage tracking) |
| v1.4 | #52 | Rivalidades Emergentes (6 arcs nomeados) |
| v1.5 | #53 | Crônica do Save (export PNG/JSON) |

**Métricas finais v1.x:**

- Tests: 314 → **488** (+55%)
- engine.js: 1014 → **794 LOC** (-22%)
- Services: 0 → **7** (MatchSimulator + Myth + Relationship + Narrative + Career + Inheritance + Chronicle)
- SAVE_VERSION: 1 → **10**
- 5 Camadas SPEC-049 implementadas
- 16 manchetes mitoHerdado + 12 pressConference + 66 event templates
- 6 narrative arcs nomeados


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
