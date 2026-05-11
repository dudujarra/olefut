# SDD - Software Design Document (Elifoot RPG)

## Arquitetura

| Camada | Pasta | Responsabilidade |
|---|---|---|
| Database | `src/engine/db/` | Times reais (170 clubes, 13 zonas) |
| Tournaments | `src/engine/tournaments/` | League, KnockoutCup, ContinentalCup |
| RPG Decks | `src/engine/decks/` + `src/engine/` | 40 Match Cards (tiered), Bench, OffPitch |
| Player Career | `src/engine/PlayerCareer.js` | ProPlayer (slots, triângulo, renome, stress, flags, NPCs) |
| Orchestrator | `src/engine/engine.js` | Engine (game loop, playMatch, advanceWeek) |
| UI | `src/components/` | React (leitura apenas, zero lógica) |
| Context | `src/context/` | GameContext (ponte Engine↔React) |

## Mecânicas Implementadas

| Mecânica | Arquivo | Status |
|---|---|---|
| Round Robin (ida/volta) | `League.js` | ✅ |
| Mata-mata com bye | `KnockoutCup.js` | ✅ |
| Fase Grupos + Knockout | `ContinentalCup.js` | ✅ |
| Duelos Setoriais | `engine.js` | ✅ |
| Atributos Posicionais | `data.js` | ✅ |
| Slots de Ação (Persona 5) | `PlayerCareer.js` | ✅ |
| Triângulo Impossível | `PlayerCareer.js` | ✅ |
| Estrelas de Renome | `PlayerCareer.js` | ✅ |
| **Match Cards Tiered (40 cartas)** | `decks/*.js` + `MatchEventsDeck.js` | ✅ |
| **Weighted Draw + Renown Gate** | `MatchEventsDeck.drawCard()` | ✅ |
| Bench Events (6 cartas) | `BenchEventsDeck.js` | ✅ |
| OffPitch Events (7 cartas) | `OffPitchEventsDeck.js` | ✅ |
| **Personalidade (Maverick/Virtuoso/Heartbeat)** | `PlayerCareer.js` | ✅ |
| **Stress System (0-100 + Mental Break)** | `PlayerCareer.js` | ✅ |
| **Chain Event Flags** | `PlayerCareer.js` | ✅ |
| **NPCs Nomeados (6)** | `PlayerCareer.js` | ✅ |
| **Streak Tracking (gols/derrotas)** | `PlayerCareer.js` | ✅ |
| Traits/Estilos de Jogo | `PlayerCareer.js` | ✅ |
| Bench Status Automático | `PlayerCareer.js` | ✅ |

## Card Tiers (MatchEventsDeck)

| Posição | Comum | Incomum | Raro | Lendário | Total |
|---|---|---|---|---|---|
| ATA | 4 | 4 | 4 | 3 | 15 |
| MEI | 3 | 3 | 2 | 2 | 10 |
| DEF | 2 | 3 | 2 | 1 | 8 |
| GOL | 2 | 2 | 2 | 1 | 7 |
| **Total** | **11** | **12** | **10** | **7** | **40** |

Draw Weights: Common=60%, Uncommon=25%, Rare=12%, Legendary=3%.
Legendary cards gated by `minRenown` (3 ou 4 estrelas).

## Personalidades

| Tipo | Bônus | Malus |
|---|---|---|
| Maverick 🎭 | Fans 2x em sucesso | Boss 2x em falha |
| Virtuoso 🎯 | Treino XP +50% | Sponsors -50% |
| Heartbeat 🫀 | Teammates +1/semana | Fans cap 3/evento |

## NPCs

| NPC | Role | Unlock |
|---|---|---|
| Marcos Oliveira | Técnico | Início |
| Juliana Reis | Jornalista | Sem 3 |
| Tio Dinho | Líder Torcida | Sem 1 |
| Rafael Monteiro | Veterano | Sem 2 |
| Patrícia Lemos | Empresária | Renome ≥ 2 |
| Diego Costa | Rival | Sem 5 |

## Testes Headless

| Script | Valida | Status |
|---|---|---|
| `simulate_season.js` | Manager: 170 times, 16 torneios, 38 sem | ✅ 20ms |
| `simulate_player_career.js` | Cards, Personality, Stress, Flags, NPCs, Streaks | ✅ |

## Commits

| Tag | Descrição |
|---|---|
| AKITA-001 | Foundation: Engine OOP + DB + Tests |
| AKITA-002 | RPG Decks: Match + Bench + OffPitch |
| AKITA-003 | UI React: Manager + Player modes |
| AKITA-004 | RPG Deep: 40 tiered cards, Personality, Stress, Flags, NPCs |
| AKITA-200 | Ambition Engine + Schema Unification (Dudu, main) |
| AKITA-201 | Complete schema purge + NPC economy + contextual buyers (Dudu, main) |
| AKITA-202 | Systematic debugging — creativity decline bug + schema migrate (Dudu, main) |
| AKITA-203 (main) | Fix cross-test localStorage leak deep-soak + 100-season timeout (Dudu, main) |
| AKITA-203 (PR #105) | Doc canônica Akita — CLAUDE.md, LICENSE, CONTRIBUTING, GEMINI/CODEX, specs/generators |
| AKITA-204 | Bundle code-split (SPEC-153) + skipAutoRestore (SPEC-154) + test isolation (SPEC-155) + lint cleanup + cleanup |
| AKITA-205 | Gap fixes pós-audit: regression test SPEC-117 + sync docs (1044→1049 tests) |

## Mecânicas adicionadas via AKITA-204

| Mecânica | Arquivo | SPEC | Status |
|---|---|---|---|
| Bundle code-split de rotas (16 views via React.lazy) | `src/App.jsx` | SPEC-153 | ✅ |
| NPC brain `skipAutoRestore` opt-in | `src/services/learning/AdaptiveBrain.js` | SPEC-154 | ✅ |
| Test localStorage isolation setupFile | `tests/_setup-isolate-localstorage.js` | SPEC-155 | ✅ |
| ADR resolução conflito numbering AKITA paralelo | `specs/infra/SPEC-156-decision-akita-numbering-conflicts.md` | SPEC-156 | ✅ accepted |

## Backlog

| Mecânica | Prioridade | Status |
|---|---|---|
| Expandir BenchEventsDeck (6→12) | Camada 1 | ⚠️ |
| Expandir OffPitchEventsDeck (7→20) | Camada 1 | ⚠️ |
| ChainEventsDeck (15 cartas encadeadas) | Camada 1 | ⚠️ |
| Cartas de Treino Especializadas | Camada 2 | ❌ |
| Clima/Condições de Jogo | Camada 2 | ❌ |
| Janela de Transferência | Camada 2 | ❌ |
| Team Talks | Camada 2 | ❌ |
| Legado de Temporada | Camada 3 | ❌ |
| Sistema de Rivais | Camada 3 | ❌ |
| Lesões com Recovery | Camada 3 | ❌ |
| UX Review completa | — | ❌ |
| deep-soak suite separada `npm run test:soak` | infra | 📝 SPEC-157 / BUG-080 |
| Audit `react-hooks/set-state-in-effect` (14 warnings) | ui | 📝 SPEC-158 / BUG-081 |
| Build budget test (chunk ≤ 500KB CI gate) | infra | 📝 derivado SPEC-153 |
| Refactor engine.js god-class (17 PRs) | refactor | 📝 specs/refactor/AKITA-RFCT-000..017 |
