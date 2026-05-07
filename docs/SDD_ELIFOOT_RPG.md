# SDD - Software Design Document (Elifoot RPG)

## Arquitetura

| Camada | Pasta | Responsabilidade |
|---|---|---|
| Database | `src/engine/db/` | Times reais (170 clubes, 13 zonas) |
| Tournaments | `src/engine/tournaments/` | League, KnockoutCup, ContinentalCup |
| RPG Decks | `src/engine/` | MatchEventsDeck, BenchEventsDeck, OffPitchEventsDeck |
| Player Career | `src/engine/PlayerCareer.js` | ProPlayer (slots, triângulo, renome) |
| Orchestrator | `src/engine/engine.js` | Engine (game loop, playMatch, advanceWeek) |
| UI | `src/components/` | React (leitura apenas, zero lógica) |
| Context | `src/context/` | GameContext (ponte Engine↔React) |

## Mecânicas Implementadas

| Mecânica | Arquivo | Método | Status |
|---|---|---|---|
| Round Robin (ida/volta) | `League.js` | `generateRoundRobin()` | ✅ |
| Mata-mata com bye | `KnockoutCup.js` | `createKnockoutRound()` | ✅ |
| Fase Grupos + Knockout | `ContinentalCup.js` | `createGroups()` + `advanceWeek()` | ✅ |
| Duelos Setoriais | `engine.js` | `playMatch()` | ✅ |
| Atributos Posicionais | `data.js` | `generatePlayer()` | ✅ |
| Slots de Ação (Persona 5) | `PlayerCareer.js` | `train()`, `rest()` | ✅ |
| Triângulo Impossível | `PlayerCareer.js` | Trade-offs em `train()`/`rest()` | ✅ |
| Estrelas de Renome | `PlayerCareer.js` | `updateStarRating()` | ✅ |
| Match Events Deck (16 cartas) | `MatchEventsDeck.js` | `drawCard()` | ✅ |
| Bench Events Deck (6 cartas) | `BenchEventsDeck.js` | Array simples | ✅ |
| OffPitch Events (7 cartas) | `OffPitchEventsDeck.js` | Triggers contextuais | ✅ |
| Traits/Estilos de Jogo | `PlayerCareer.js` | `buyTrait()` | ✅ |
| Bench Status Automático | `PlayerCareer.js` | `checkBenchStatus()` | ✅ |

## Testes Headless

| Script | Valida | Status |
|---|---|---|
| `simulate_season.js` | Manager: 170 times, 16 torneios, 38 sem | ✅ 20ms |
| `simulate_player_career.js` | Player: slots, treino, fadiga, facções | ✅ |

## Backlog

| Mecânica | Inspiração | Prioridade |
|---|---|---|
| Arquétipos de Carreira | Slay the Spire | #4 |
| Legado de Temporada | Hades | #5 |
| Bomba-Relógio (consequências atrasadas) | Crusader Kings | #6 |

## Commits

| Tag | Descrição |
|---|---|
| AKITA-001 | Foundation: Engine OOP + DB + Tests |
| AKITA-002 | RPG Decks: Match + Bench + OffPitch |
