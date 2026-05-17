# CLAUDE.md — OléFUT (fonte única de verdade técnica)

> **Mandamento Akita #4**: `CLAUDE.md` no root = fonte única de verdade técnica.
> Toda decisão arquitetural, comando, fluxo, dependência mora aqui.
> README humano-amigável aponta pra cá.

**Última atualização**: 2026-05-16 (post AKITA-411)
**Owner**: Dudu (Eduardo Jarra) — dudujarra@corapost.com
**Repo público**: https://github.com/dudujarra/olefut
**Demo**: https://dudujarra.github.io/olefut/

---

## 🚨 LEIA ANTES DE QUALQUER AÇÃO — FOUNDATION-FIRST ATIVO

> **Status**: 🟢 Foundation-First Roadmap ATIVO desde 2026-05-12 (pós-análise brutal AKITA-207..214).
> **Fonte estratégica única**: [`specs/MASTER-ROADMAP-FOUNDATION-FIRST.md`](specs/MASTER-ROADMAP-FOUNDATION-FIRST.md)

### Os 10 mandamentos brutais (sobrepõem-se a qualquer outro plano)

1. **Zero feature nova até BLOCO 1 (Fundação) terminar.** Engine refactor + AutoPlayService split + bundle optimization + doc auto-gen vêm primeiro. Qualquer feature nova é **REJEITADA** automaticamente.
2. **Zero spec retroativa.** Feature sem spec PRÉ não entra no repo. Specs retroactivas pra cobrir vibe coding são proibidas a partir desta data.
3. **Zero emoji em código novo.** Audit existente fica na lista B3.1 (UI consistency). Código novo: Phosphor icons apenas.
4. **Zero inline style em código novo.** CSS classes (`.btn-primary`, `.card`, etc) per SPEC-163. Inline style em código novo = PR bloqueado.
5. **Cada PR**: lint 0 errors + tests verdes + build ≤1.5s + CHANGELOG entry + SPEC linkada. Sem um destes = não merge.
6. **README/CLAUDE.md auto-atualizados via script.** Métricas (test count, LOC, specs) **NÃO** devem ser editadas manualmente. Script CI atualiza.
7. **Playtest obrigatório por bloco.** Bloco não termina sem 5 humanos brasileiros testarem.
8. **Sem cascata AKITA-XXX frenética.** Máximo 2 PRs/semana, bem cozidos. Numbering rápido = sinal de vibe coding.
9. **Sessões paralelas (Claude Code + Antigravity)** seguem mesma ordem de blocos. Coordenar via `MASTER-ROADMAP-FOUNDATION-FIRST.md` seção PROGRESSO.
10. **Domingo OFF.** Burnout é o maior risco de morte do projeto.

### Fluxo obrigatório no início de cada sessão (agentes)

```
1. Ler CLAUDE.md (este arquivo) — entender estado e regras
2. Ler MASTER-ROADMAP-FOUNDATION-FIRST.md — entender bloco atual
3. Rodar spec-check.sh "<descrição>" — validar SDD
4. Se feature nova: REJEITAR se BLOCO 1 não tá done
5. Se foundation work: confirmar qual sub-task do bloco atual
6. Implementar contra spec + harness no mesmo PR
7. Atualizar seção PROGRESSO do MASTER-ROADMAP
```

### Estado atual do roadmap (snapshot 2026-05-13)

| Bloco | Status | Notas |
|-------|--------|-------|
| 1 Fundação | ✅ DONE | engine 1525→431, AutoPlay 1280→490, doc auto-gen |
| 2 Integração | ✅ DONE | feature audit, gap fixes, LLM bridge, E2E tests, tutorial |
| 3 Polish + Launch | 🟡 PARTIAL | UI sweep + perf done; playtest + launch pendentes |
| Pós-Foundation V1 | ✅ DONE | Game Design Fase A/B/C (26 PRs) |
| Pós-Foundation V2 | ✅ DONE | F1-F6 brutal-driven (sabor BR, star player, win streak, legends, handicap, mid-match) |
| Reliability Hardening | ✅ DONE | EngineLogger telemetry (AKITA-408/409), Result standardization (AKITA-410), 252 unit tests (AKITA-411) |
| AutoPlayLab Platform | ✅ DONE | 46 presets, 9 categorias |
| Rebrand OléFUT | ✅ DONE | repo renomeado, 176 arquivos, storage migration shim |

**Pendente real**: playtest 5 humanos BR (mandamento brutal #7), browser smoke test manual, launch real (Fase D).

**Repo público**: https://github.com/dudujarra/olefut · **Live**: https://dudujarra.github.io/olefut/

---

## 🥋 Constituição (não negociável)

Antes de tocar em qualquer linha de código deste repo, leia [`AKITA_RULES.md`](AKITA_RULES.md). Resumo dos 7 mandamentos:

1. **SDD obrigatório** — sem spec, sem trabalho. Roda `spec-check.sh "<descrição>"` antes de qualquer ação produtiva.
2. **Regra 0 — sem harness, sem spec.** Toda spec entrega no mesmo PR um harness executável (teste/script) que valida o que afirma. Sem harness = mentira viva.
3. **Zero vibe coding.** Dev pensa, IA digita. Arquitetura desenhada → IA preenche órgãos. Proibido one-shot prompt sem entender resultado.
4. **`CLAUDE.md` é fonte única.** Este arquivo. Tudo aqui ou linkado daqui.
5. **GitHub público dia 1.** Build in public. Commits frequentes, branches por SPEC, PRs revisáveis.
6. **Bug = ticket + fix + regression test.** Três artefatos pareados. PR não merge sem os 3.
7. **LLM local default. Haiku via Max20 fallback. API paga PROIBIDA.**

Detalhes de isolamento de engine, OOP, padronização de dados, build validation e SDD vivo em [`AKITA_RULES.md`](AKITA_RULES.md).

**Os 7 mandamentos Akita CONTINUAM válidos. Os 10 mandamentos brutais (acima) SOMAM com eles, não substituem. Em caso de conflito, mandamentos brutais vencem (são mais específicos pro momento atual).**

---

## 🏗️ Stack

| Camada | Tech | Versão |
|--------|------|--------|
| Engine | JavaScript ES2022 puro (headless, zero-UI) | — |
| UI | React + Vite | React 19.2, Vite 8 |
| Audio | Tone.js | 14.9 |
| Tests | Vitest | 4.1 |
| E2E | Playwright | 1.59 |
| Lint | ESLint + react-hooks + react-refresh | 10 |
| Mutation | Stryker (vitest runner) | 9.6 |
| CI/CD | GitHub Actions (lint + tests + build + deploy) | — |
| Deploy | GitHub Pages (branch `main`) | — |
| LLM bridge | `@mlc-ai/web-llm` (browser-side, SPEC-119) | 0.2.83 |

---

## 📂 Arquitetura

```
src/
├── engine/                   # Motor de simulação (headless, zero React)
│   ├── engine.js             # Thin facade (323L — pure state + delegators, AKITA-406)
│   ├── data.js               # Geração de jogadores/times (OVR, nomes)
│   ├── rng.js                # PRNG determinístico
│   ├── db/                   # Times reais (170 clubes) + dados estáticos
│   │   ├── brazil.js
│   │   ├── europe.js
│   │   ├── south_america.js
│   │   ├── club-voices.json  # Vozes regionais (ex-ClubVoiceSystem 1700L→JSON)
│   │   └── index.js
│   ├── tournaments/          # Tournament (abstract), League, KnockoutCup, ContinentalCup, StateChampionship
│   ├── decks/                # MatchCards (GOL/DEF/MEI/ATA)
│   ├── systems/              # AchievementsSystem, DifficultyModes, FormSystem, DressingRoomSystem
│   ├── simulate_season.js    # Harness Node (Mandamento #3 — testabilidade sem tela)
│   ├── simulate_player_career.js
│   └── [40+ sistemas]        # PlayerCareer, InjurySystem, BoardSystem, YouthAcademy, etc.
├── components/               # React UI (read-only, zero lógica)
│   ├── dashboard/
│   ├── learning/
│   ├── ui/
│   └── [views]               # SquadView, MatchView, MarketView, StandingsView, etc.
├── context/                  # GameContext (ponte Engine↔React)
├── data/                     # Static data (fora da engine)
├── hooks/
├── services/                 # WeekProcessor, WeekMatchResult, MatchSimulator, MatchPostMatch,
│                             # SeasonProcessor + 14 season/ modules, AutoPlayService, CareerService,
│                             # TransferService, FormationService, ScoutingService
├── audio/
├── styles/                   # design-tokens.css, animations.css (32bit SNES theme)
├── utils/
├── assets/
├── App.jsx
├── main.jsx
└── index.css

specs/                        # 97 SPECs (SDD source of truth)
├── SPEC-RULES.md             # Governance
├── SPEC-TEMPLATE.md
├── ROADMAP-NARRATIVE-MASTER.md
├── engine/                   # 39 specs
├── gameplay/                 # 15 specs
├── ui/                       # 6 specs
├── infra/                    # 7 specs
├── learning/                 # 10 specs
├── refactor/                 # 19 specs
├── telemetry/                # 15 specs
└── generators/               # Templates pra novas specs (code/research/pipeline/decision)

tests/
├── unit/                     # 252 tests — top 10 módulos (AKITA-411)
├── integration/
├── regression/               # BUG-XXX.test.js (Mandamento #6)
├── specs/                    # SPEC-XXX.test.js (harness por spec)
├── characterization/         # Golden master, Stryker
├── statistical/
├── e2e/
├── audio/
├── design/
├── engine.test.js
└── static-checks.test.js

docs/                         # Doc auxiliar (não-canônica)
├── MANUAL_COMPLETO.md
├── SDD_OléFUT_RPG.md
├── brand-guidelines.md
├── design-tokens.css/.json
├── art-direction-bible.md
├── stitch-designs/
└── playtest/

scripts/                      # Harnesses + automação
├── debug-bug.sh              # `npm run bug:full` (Akita workflow)
├── generate-audio.js
└── render-*.js               # Music engine (SPEC-051)
```

---

## ⚙️ Comandos

### Dev loop
```bash
npm run dev                   # Vite dev server
npm run build                 # Produção (Mandamento #6 — deve passar 0 erros)
npm run preview               # Preview do build
npm run lint                  # ESLint (deve passar 0 erros)
```

### Testes
```bash
npm test                      # Vitest run (1814+ testes)
npm run test:watch            # Watch mode
npm run test:ci               # Verbose + build (gate CI)
npm run test:series           # 1 arquivo por vez (isolamento)
npm run test:regression       # tests/regression/ (BUGs)
npm run test:specs            # tests/specs/ (harnesses por SPEC)
npm run test:audio            # tests/audio/
npm run mutate                # Stryker mutation testing
npm run mutate:report         # Abre relatório
```

### Akita bug workflow (Mandamento #6)
```bash
npm run bug:search            # Busca evidência
npm run bug:ticket            # Cria issue padronizada
npm run bug:fix               # Branch + fix loop
npm run bug:test              # Regression test
npm run bug:full              # Ciclo completo (ticket → fix → test)
```

### SDD enforcement (Mandamento #1)
```bash
spec-check.sh "<descrição>"   # Antes de qualquer trabalho. Exit 0 libera, 1/2 bloqueia.
spec-check.sh --list          # Lista specs do projeto
spec-check.sh --init          # Inicializa SDD (specs/generators/) num projeto novo
spec-check.sh validate        # Roda harnesses contra specs
```

### Music engine (SPEC-050/051)
```bash
npm run generate:audio        # Gera sample bank
npm run render:stems          # Renderiza stems
npm run render:fase1          # Render fase 1
npm run render:tech           # Tech-house
npm run render:all            # Todos subgenres
```

---

## 🔄 Workflow Akita

```
Pedido do Dudu
    ↓
spec-check.sh "descrição"
    ↓
exit 0 → segue spec existente
exit 1/2 → escreve spec via specs/generators/<tipo>.md
    ↓
Dudu aprova spec
    ↓
Implementa contra spec + escreve harness no MESMO PR (Regra 0)
    ↓
npm run lint && npm test && npm run build   (Mandamento #6 — 0 erros)
    ↓
Bug? → cria issue + regression test + fix (3-artefact)
    ↓
PR linkado a SPEC-XXX / BUG-XXX → CI verde → merge
```

---

## 📊 Estado do projeto (snapshot 2026-05-16)

| Métrica | Valor | Fonte |
|---------|-------|-------|
| Tests | **1814/1834** ✅ (20 pre-existing spec audit failures) | `vitest run` 2026-05-16 |
| Unit tests (top 10 módulos) | **252/252** ✅ | `tests/unit/` AKITA-411 |
| Core regression suite | **61/61** ✅ (system-integration + engine-golden + marl-e2e) | 23.7s |
| Test files | 154 | `find tests -name "*.test.js"` |
| Specs totais | **145** | `find specs -name "SPEC-*.md"` |
| Bugs com regression test | 17 arquivos em `tests/regression/` | — |
| AKITA commits | **411+** | `git log --grep AKITA` |
| Clubes | 170 (BR + EU + SA) | `src/engine/db/` |
| Backend total | **~30.924 linhas** (engine/ + services/) | `wc -l` |
| Maior arquivo backend | 643L (AutoPlayDecisions) | engine.js saiu do top 6 |
| Dead imports | **0** | auditado AKITA-404 |
| CJS require() | **0** | migrado para ESM puro |
| EngineResult contract | **100%** services padronizados | AKITA-410 |
| EngineLogger coverage | **21 catch blocks** instrumentados | AKITA-408/409 |
| Build | ✅ limpo, ~1.1s, initial chunk **376KB** (gzip 110KB) | `vite build` |
| Build budget gate | ✅ 4/4 tests (initial ≤500KB, chunk ≤800KB, total ≤3MB) | `tests/integration/build-budget.test.js` |
| Lint | ✅ 0 erros | `eslint .` |

### ⚠️ Débitos atuais (2026-05-16)
- ~~marl-e2e `NPC EmotionalEngine` failing~~ **resolvido AKITA-107**
- ~~Bundle 1.56MB sem code-split~~ **resolvido AKITA-108**: 376KB (-76%)
- ~~MarketView rules-of-hooks bugs~~ **resolvido AKITA-108**
- ~~180+ lint warnings~~ **resolvido**: 0 errors, warnings cosméticos
- ~~God Object ClubVoiceSystem 1700L~~ **resolvido AKITA-404**: extraído para JSON (51L loader)
- ~~MatchSimulator God Object~~ **resolvido AKITA-404**: MatchPostMatch extraído (148L)
- ~~WeekProcessor 605L monolítico~~ **resolvido AKITA-404**: WeekMatchResult extraído (241L + 414L)
- ~~370 dead imports~~ **resolvido AKITA-404**: zero dead imports em engine/ + services/
- ~~CJS require() em ES modules~~ **resolvido AKITA-404**: MarketPricer + processNPCSeasonEnd convertidos
- ~~weekEvents unbounded growth~~ **resolvido AKITA-404**: hard cap 50 eventos/semana
- ~~`engine.js` 540 linhas~~ **resolvido AKITA-406**: thin facade 323L (-40%). Zero lógica inline. Pure state + delegators.
- ~~Unit tests para módulos críticos~~ **resolvido AKITA-411**: 252 testes cobrindo top 10 módulos (PlayerCareer, AmbitionEngine, TransferService, FormationService, WeekMatchResult, BanditCoordinator, ManagerSystems, MatchSimulator, AutoPlayDecisions, PlayerTraits)
- ~~EngineResult inconsistente~~ **resolvido AKITA-410**: 6 services padronizados para `{ success, msg }`
- ~~Catches silenciosos~~ **resolvido AKITA-408/409**: 21 catch blocks instrumentados com EngineLogger
- **EfButton chunk 652KB** — contém player DB inteiro. Candidato a SPEC-160 (code-split DB).

---

## 🗺️ Roadmap

Fonte canônica: [`specs/ROADMAP-NARRATIVE-MASTER.md`](specs/ROADMAP-NARRATIVE-MASTER.md).

| Versão | Tema |
|--------|------|
| v1.0 | Foundation + Live UX (released) |
| v1.0.5 | Refactor god-class (17 PRs em `specs/refactor/`) |
| v1.0.7 | Camada 2 Foundation (eventos atômicos + decay) |
| v1.1 | Camada 5 Mito (Hall de Lendas) |
| v1.1.5 | Traits Herdáveis |
| v1.2 | Transição Jogador → Técnico |
| v1.3 | Filhos Regens |
| v1.4 | Rivalidades Emergentes |
| v1.5 | Crônica do Save |

5 camadas narrativas (Agente / Eventual / Relacional / Narrativa / Mito) — ver [`specs/SPEC-049-narrative-layers-mvp.md`](specs/SPEC-049-narrative-layers-mvp.md).

---

## 🔗 Docs canônicas

| Doc | Função |
|-----|--------|
| [`AKITA_RULES.md`](AKITA_RULES.md) | Constituição (7 mandamentos) |
| [`specs/SPEC-RULES.md`](specs/SPEC-RULES.md) | Governance SDD |
| [`specs/SPEC-TEMPLATE.md`](specs/SPEC-TEMPLATE.md) | Template para novas specs |
| [`specs/ROADMAP-NARRATIVE-MASTER.md`](specs/ROADMAP-NARRATIVE-MASTER.md) | Roadmap |
| [`BUGS.md`](BUGS.md) | Bug tracker (Mandamento #6) |
| [`CHANGELOG.md`](CHANGELOG.md) | Histórico de releases |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Workflow para contribuidores |
| [`docs/SDD_OléFUT_RPG.md`](docs/SDD_OléFUT_RPG.md) | SDD vivo (Mandamento #7) — mecânicas implementadas |
| [`docs/MANUAL_COMPLETO.md`](docs/MANUAL_COMPLETO.md) | Manual do jogador |
| [`docs/brand-guidelines.md`](docs/brand-guidelines.md) | Identidade visual |
| [`README.md`](README.md) | Apresentação humano-amigável |

`GEMINI.md` e `CODEX.md` na raiz são espelhos slim deste arquivo para outras IAs.

---

## 🚫 Forbidden cases (não fazer)

1. Código sem spec aprovada.
2. Spec sem harness no mesmo PR.
3. Lógica de jogo em componente React (Mandamento #2 — isolamento de engine).
4. Chamadas DOM / `useState` / `useEffect` dentro de `src/engine/`.
5. Arrays soltos onde deveria haver classe (Mandamento #4 — OOP).
6. Divisão com <10 times (Mandamento #5 — padronização).
7. Merge com build/lint/test quebrado (Mandamento #6).
8. Bug fix sem issue + regression test pareados.
9. Chamada `https://api.anthropic.com` com API key (Mandamento #7 — usar Ollama local ou `claude -p` subprocess).
10. README/docs com números fantasiosos (Regra 0 — mentira viva).
