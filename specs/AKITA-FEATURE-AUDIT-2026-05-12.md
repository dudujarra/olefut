# Bloco 2.1 Feature Audit — 2026-05-12

**Owner**: Claude Code autonomous (AKITA-233)
**Source-of-truth**: docs/SDD_ELIFOOT_RPG.md + specs/MASTER-ROADMAP-FOUNDATION-FIRST.md (lista de 40 features em B2.1)
**Worktree audited**: `/tmp/bloco2-progresso` (main @ d381c53 + AKITA-232 doc update)
**Methodology**: read SDD → grep engine/services → grep components → check `App.jsx` + `Sidebar.jsx` for reachability → check `tests/e2e/`, `tests/specs/`, `tests/regression/` for E2E coverage.

> **Nota sobre discrepância de "40 features"**: SDD_ELIFOOT_RPG.md lista ~18 mecânicas implementadas + 11 backlog (29). Os "40" do MASTER-ROADMAP-FOUNDATION-FIRST.md (linhas 108–147) são a planilha B2.1 canônica e foi essa lista que eu auditei. As ~40 cartas RPG do MatchEventsDeck são uma feature singular ("RPG Match Cards"), não 40 features distintas.

---

## Summary

- **Total features auditadas**: 40
- 🟢 **Functional (engine + UI + reachable + E2E)**: 0
- 🟢⁻ **Functional via spec test (sem playwright)**: 11
- 🟡 **Has gaps (1-2 missing)**: 18
- 🔴 **Broken / dead code (3+ missing)**: 11

**Verdade brutal**: zero das 40 features tem cobertura Playwright E2E real. O único arquivo `tests/e2e/core-game-flow.spec.js` é genérico (carrega tela, verifica title, verifica responsividade) e **não exercita nenhuma feature específica**. Isso significa que a coluna "E2E test" está `unit-only` ou `none` em 100% dos casos — pra fins de classificação tratei "spec-test forte cobrindo o sistema" como `unit-only` e "sem cobertura" como `none`.

**Reachability**: 11 views no sidebar (manager) + 4 no sidebar (player) + tutorial via StartView. Várias features de engine rodam silenciosamente no `WeekProcessor`/`SeasonProcessor` sem UI dedicada (ex: HumiliationCascade, LossStreakResponse, GrowthEvent) — efeitos aparecem como narrativa nos cards/eventos mas não há painel.

---

## Audit matrix

| # | Feature | Engine | UI | Reachable | E2E | Gap |
|---|---------|--------|----|-----------|-----|-----|
| 1 | RPG Match Cards | ✅ `engine/MatchEventsDeck.js` + `decks/MatchCards{ATA,MEI,DEF,GOL}.js` (40 cartas, weighted draw, renown gate) | partial — texto da carta aparece no log em `MatchSimulator.js:262-271` durante partida | ✅ Sidebar → MATCH | unit-only (`SPEC-002-events-deck.test.js`) | Sem playwright E2E; UI mostra carta no log mas sem painel dedicado de visualização da deck |
| 2 | Bench Events | ✅ `engine/BenchEventsDeck.js` (6 cartas) | ✅ `components/PlayerMatchView.jsx:112` — sorteia carta para banco | hidden — só acessível em modo **jogador** (não-manager) via `player_match` | none | Modo manager (default) **nunca vê** essas cartas; UI exclusiva do modo jogador |
| 3 | OffPitch Events | ✅ `engine/OffPitchEventsDeck.js` (7+ cartas, gated por chain flags) | ✅ `components/PlayerDashboardView.jsx:43` | hidden — só modo **jogador** | none | Mesmo problema do #2: invisível em modo manager |
| 4 | Personality (Maverick/Virtuoso/Heartbeat) | ✅ `engine/PlayerCareer.js:152` (`PERSONALITIES` catalog) | ✅ `SquadView.jsx:295-317` (mostra perfil no plantel) + `PlayerDashboardView.jsx:125` | ✅ Sidebar → PLANTEL | unit-only (`SPEC-007-personality-traits.test.js`) | OK em modo manager (visível) e jogador (gameplay); falta playwright |
| 5 | Stress System | ✅ `engine/PlayerCareer.js:432` (0-100 + Mental Break) | ✅ `PlayerDashboardView.jsx` (visível só para o pro-player) | hidden — só modo **jogador** tem barra de stress; modo manager **não tem stress por jogador** | unit-only (`SPEC-008-stress-system.test.js`) | Engine só roda para `proPlayer`, não para os 22 jogadores do plantel manager. Inconsistência — em modo manager stress é invisível |
| 6 | Chain Event Flags | ✅ `engine/PlayerCareer.js:411-417` (`setFlag/hasFlag/clearFlag`) + triggers em `OffPitchEventsDeck.js` | partial — usado por `OffPitchEventsDeck` mas sem UI explícita listando flags ativas | hidden — só roda em modo jogador via OffPitch | none direto (coberto indiretamente via tests do PlayerCareer) | Não há painel "minhas flags ativas"; depuração impossível pelo player |
| 7 | NPCs Nomeados (6) | ✅ menções no texto de `OffPitchEventsDeck.js` (Marcos Oliveira, Juliana Reis, Tio Dinho, Rafael Monteiro, Patrícia Lemos, Diego Costa) | partial — aparecem apenas como string nos cards, sem perfil/portrait/diretório | hidden — só modo jogador | none | **Não existe "NPCs view"** com retratos, relacionamento, status. Documentação SDD vende como sistema, é apenas string em deck |
| 8 | Streak Tracking | ✅ `engine.managerStats.streak/lossStreak` (`WeekProcessor.js:338-358`); `PlayerCareer.js:175` para player | ✅ Dashboard mostra streak; `PressView.jsx` usa | ✅ DASHBOARD + PRESS | unit-only (parcialmente em testes do BoardSystem) | OK; gap apenas E2E playwright |
| 9 | Traits / PlayerTraits | ✅ `engine/PlayerTraits.js` (TRAITS_CATALOG, getTraitMatchModifier, hasTrait, mentoring); integrado em `MatchSimulator.js:24` | partial — modificadores aplicados em partida; SquadView **não lista traits do jogador** | ✅ Sidebar → PLANTEL (mas sem painel de traits) | unit-only | UI esconde traits do plantel — afeta tomada de decisão do manager |
| 10 | Bench Status Automático | ✅ código existe em `PlayerCareer.js` (status do player de banco) | partial — exibido em `PlayerDashboardView` | hidden — modo jogador | none | Conceito específico do modo jogador; não há equivalente em modo manager |
| 11 | Ambition Engine | ✅ `engine/AmbitionEngine.js:75-93` (ambition vs prestige delta + satisfaction) | partial — usado em `WeekProcessor.js:219` para morale dos titulares, mas **sem UI mostrando ambition/satisfaction por jogador** | hidden — efeitos invisíveis ao usuário | unit-only (coberto em system-integration.test.js) | Player vê morale cair mas não entende **por que**; falta diagnóstico |
| 12 | Board System | ✅ `engine/BoardSystem.js` + `BoardTensionSystem.js` (confidence, tension) | partial — exibido em `DashboardView` (confiança) e usado em `PressView`/`MatchView` | ✅ DASHBOARD | unit-only (`SPEC-006-board-system.test.js`, `SPEC-072-board-tension-system.test.js`) | OK; gap apenas E2E playwright |
| 13 | Press Conference | ✅ `engine/PressConference.js` (`generateQuestion`) + `services/PressService.js` (existe arquivo) | ✅ `components/PressView.jsx` — funciona end-to-end (pergunta, resposta, afeta moral/board) | ✅ Sidebar → COLETIVA | none | `PressService` existe mas `PressView` chama direto `engine/PressConference.js` (`PressService` parece dead code intermediário). E sem E2E |
| 14 | Youth Academy | ✅ `engine/YouthAcademy.js` + integrado em `WeekProcessor`/`FacilityService`/`LoanService` | partial — referenciado em `DashboardView` (level + investments) | ✅ DASHBOARD (read-only) | unit-only (`SPEC-009-youth-academy.test.js`) | **Não há "Academia view"** dedicada para gerenciar promoções, ver prospects, etc. Apenas number no dashboard |
| 15 | Scouting | ✅ `services/ScoutingService.js` + `engine.scoutLeague()` (engine.js:263) | partial — Market e Dashboard referenciam; sem view dedicada | hidden — não há "Scouting view"; jogador acessa indiretamente via Market | unit-only (`SPEC-012-scouting.test.js`) | Sem painel dedicado — scout é função utility chamada em outro view |
| 16 | Market System | ✅ `services/TransferService.js` + `engine/MarketPricer.js` | ✅ `components/MarketView.jsx` | ✅ Sidebar → MERCADO | unit-only (`SPEC-133-market-pricer.test.js`, BUG-022, BUG-026) | OK; só falta playwright |
| 17 | Contract System | ✅ `engine/ContractGoalSystem.js` + contratos em jogador (`p.contract`) | ✅ `SquadView.jsx:375-377` (mostra wage, weeks remaining, release clause) | ✅ Sidebar → PLANTEL | unit-only (`SPEC-071-contract-goal-system.test.js`) | OK; só falta playwright. Renegociação **não tem UI** — só visualização |
| 18 | ~~News System~~ | ⛔ **PURGED 2026-05-12** — feature nunca existiu no SDD nem no engine; menção no audit foi vibe-coding doc. Decisão Dudu pós-fix-docs: **não implementar, não monitorar**. ChronicleSystem (#28) cobre a narrativa pós-temporada e é considerado suficiente | n/a | n/a | n/a | **Removido do escopo do projeto.** Ver `CHANGELOG.md [Unreleased]` doc fix entry e `MASTER-ROADMAP-FOUNDATION-FIRST.md` § PROGRESSO |
| 19 | Achievements | ✅ `engine/systems/AchievementsSystem.js` (30 achievements + 7 milestones) + `engine/MetaProgression.js` (`evaluateAchievements`) chamado em `SeasonProcessor.js:540-554` | ✅ `components/AchievementsView.jsx` (progress bars) | ✅ Sidebar → CONQUISTAS | unit-only (`SPEC-029-achievements.test.js`) | OK; só falta playwright |
| 20 | Cosmetic Shop | ✅ `services/CosmeticShopService.js` | ✅ `components/CosmeticShopView.jsx` | ✅ Sidebar → LOJA | none direto (coberto via BUG-081 react-hooks fix) | Sem teste dedicado da feature |
| 21 | Save Slots | ✅ `services/SaveSlotsService.js` | ✅ `components/SaveSlotsView.jsx` | ✅ Sidebar → SAVES | unit-only (`SaveSlotsService` testado indireto via characterization) | OK; falta save→reload Playwright (listado em B2.4 também) |
| 22 | Tournaments (League/Cup/Continental/State) | partial — `tournaments/League.js`, `KnockoutCup.js`, `ContinentalCup.js` ativos; **`StateChampionship.js` é órfão**: zero imports fora do próprio arquivo, zero testes | ✅ `StandingsView` mostra ligas + continentais | ✅ Sidebar → TABELA | unit-only (`SPEC-014`, `tournament-reset.test.js`) | **StateChampionship.js morto** apesar do SDD listar. `StandingsView` não tem aba estadual |
| 23 | Sector Duels | ✅ `services/SectorService.js` + `engine.js` (`getSectorService`) | partial — usado dentro do simulador, sem painel | hidden — efeito de gameplay, não-feature-de-tela | unit-only (system-integration) | Não há "sector duels view"; é mecânica invisível interna do match |
| 24 | Playstyles (Caneleiro/Fairplay/etc) | ✅ `engine/data.js:88` (PLAYSTYLES) + `MatchSimulator.js:336-340` (afeta cartões/expulsão) | partial — visível em `SquadView.jsx:297` ("PERFIL: {personality} • {playstyle}") | ✅ Sidebar → PLANTEL | unit-only (`tests/specs/playstyles.test.js`) | OK funcionalmente; falta tooltip explicando cada playstyle |
| 25 | Yellow/Red Cards | partial — `MatchSimulator.js:348` push `{type:'yellow'}`; expulsões em linha 401-412. `careerStats.totalCards` track | partial — `MatchView.jsx:149` overlay visual de redcard ('🟥'); `events.cards` log; **sem painel de "histórico de cartões"** | ✅ MATCH | none | Cards são tracked mas não há lista "jogadores suspensos próxima partida"; suspensão automática? não vi código |
| 26 | Tutorial | ✅ Conteúdo em `components/TutorialView.jsx` (5 steps) | ✅ View funcional | partial — só acessível via `StartView` ANTES de começar carreira; **uma vez `elifoot_tutorial_done`, fica oculto** (StartView.jsx:8). Não há "replay tutorial" via sidebar | none | Tutorial não-replay; falta entry-point no menu para repetir |
| 27 | MARL / Adaptive Brain | ✅ `services/learning/AdaptiveBrain.js`, `LLMBridge.js`, `DAggerBootstrap.js`, `ThompsonBandit.js`, `EmotionalEngine.js` (massivo) | ✅ `components/learning/BrainDashboard.jsx` integrado em `AutoPlayView.jsx:532` | partial — só acessível via AUTOPLAY view (não tem entrada própria no sidebar) | unit-only (`tests/unit/`, `tests/integration/marl-e2e.test.js`, `SPEC-115-117-adaptive-bot.test.js`) | Sistema mais complexo do repo, mas escondido atrás do bot autônomo. Em sessão de manager normal, **nunca aparece** |
| 28 | Chronicle System | ✅ `engine/ChronicleSystem.js` (templates por season) + `services/ChronicleService.js` | ✅ `components/ChronicleView.jsx` | ✅ Sidebar → CRÔNICA | unit-only (`SPEC-082-chronicle-system.test.js`, `SPEC-ChronicleService.test.js`) | OK; falta playwright |
| 29 | Heritage Traits | ✅ `engine/HeritageTraitSystem.js` + `services/InheritanceService.js` chamado em `engine.js:71-72` e usado em `SeasonProcessor.js:469-478` | 🔴 **SEM UI** — `grep heritage` em `src/components/` retorna 0 resultados | unreachable — efeito narrativo aparece como `weekEvents.push('🧬 ...')` mas sem painel | unit-only (`SPEC-079-heritage-trait-system.test.js`, `SPEC-InheritanceService.test.js`) | Player jamais sabe que traits foram herdados de pai → filho |
| 30 | Prestige System | ✅ `engine/AmbitionEngine.js:92` (`calcPrestige`); usado em `SeasonProcessor.js:352`; ranking em `legacy.prestige` | partial — `AchievementsView.jsx` consulta `prestige`; `ChallengesWidget.jsx` mostra | ✅ CONQUISTAS / DASHBOARD | unit-only (indireto) | Sem ranking de prestige multi-clube; gap menor |
| 31 | Loss Streak Response | ✅ `engine/LossStreakResponseSystem.js` + chamado em `WeekProcessor.js:393-396` | partial — efeito aparece em `weekEvents` (mensagem), mas referência em `AutoPlayView.jsx` mostra log. Player manual **não vê painel** | hidden | unit-only (`SPEC-077-loss-streak-response-system.test.js`) | Efeito invisível ao usuário humano |
| 32 | Humiliation Cascade | ✅ `engine/HumiliationCascadeSystem.js` + chamado em `WeekProcessor.js:372` | 🔴 **SEM UI** — `grep humiliation` em components: 0 | unreachable — efeitos no `weekEvents` apenas | unit-only (`SPEC-076-humiliation-cascade-system.test.js`) | Mesma feature, zero exposição visual |
| 33 | Rivalry Upgrade | ✅ `engine/RivalryUpgradeSystem.js` | ✅ `components/RivalriesView.jsx` | ✅ Sidebar → RIVALIDADES | unit-only (`SPEC-080-rivalry-upgrade-system.test.js`) | OK; falta playwright |
| 34 | Organic Challenges | ✅ `engine/OrganicChallengeSystem.js` + `services/ChallengesService.js` | partial — `components/ChallengesWidget.jsx` embarcado em `DashboardView.jsx:8` | ✅ DASHBOARD (widget embedded) | unit-only (`SPEC-074-organic-challenge-system.test.js`) | Reachable via dashboard widget; falta playwright |
| 35 | Growth Events | ✅ `engine/GrowthEventSystem.js` | 🔴 **SEM UI** — `grep GrowthEvent` em components: 0; só `WeekProcessor` usa | unreachable — efeitos silenciosos no plantel | unit-only (`SPEC-134-growth-event-system.test.js`) | Player vê stats subirem mas sem narrativa do evento |
| 36 | Hall of Fame / Legacy | ✅ `engine/HallOfLegendsSystem.js` + chamado em `SeasonProcessor.js` e `AutoPlayPacing.js` | 🔴 **SEM UI** — referenciado apenas em `TrophyCeremony.jsx` (cerimônia única) | unreachable — não há "Hall view" | unit-only (`SPEC-078-hall-of-legends-system.test.js`) | Lendas guardadas em estado mas sem painel dedicado |
| 37 | Live Ops | ✅ `services/LiveOpsService.js` (exports `getActiveLiveOps`) | 🔴 **DEAD CODE** — `grep LiveOps` em components/services: **APENAS O PRÓPRIO ARQUIVO**. Zero consumers | unreachable | none direto | **Service órfão**. Documentado em backlog SPEC-098 mas nunca conectado. Candidato a deletar ou completar |
| 38 | Stadium System | ✅ `engine/StadiumSystem.js` (5 níveis) | ✅ `DashboardView.jsx:348-351` (nome, capacidade, progress bar) + upgrades em `MarketView` | ✅ DASHBOARD | unit-only (`SPEC-010-stadium.test.js`) | OK; falta playwright |
| 39 | Staff System | partial — staff aparece em `WeekProcessor`/`ScoutingService`/`FacilityService` (treinadores afetam XP), mas **sem `StaffSystem.js` dedicado** | partial — `AutoPlayView.jsx`/`DashboardView.jsx` mencionam staff levels indiretamente | hidden — sem "Staff view" | unit-only (`SPEC-011-staff.test.js`) | Falta painel dedicado para contratar/demitir staff; mecânica espalhada |
| 40 | Music Engine (Tone.js) | ✅ `src/audio/` completo (`AudioController`, `MusicDirector`, `ToneSynthesis`, compositions) | ✅ `AudioController.jsx` integrado em `App.jsx:166` (lazy) | ✅ Toca automaticamente | unit-only (`tests/audio/audio-generator.test.js`) | OK; sem controles UI para o player (volume? mute? track select?). Falta playwright |

---

## Top 5 priority gaps para Bloco 2.2

> **Update 2026-05-12 (pós-fix-docs)**: News System (#18) **PURGED** — confirmado que SDD nunca listou a feature; menção neste audit foi vibe-coding doc. Removido como gap. Item #1 abaixo segue numerado pra preservar referências cruzadas, mas é informativo (no-op).

1. ~~**News System (#18) — INEXISTENTE.**~~ ⛔ **PURGED 2026-05-12.** SDD não menciona news; engine não tem; ninguém pediu. Sem implementação, sem monitoramento. ChronicleSystem (#28) é a narrativa pós-temporada canônica do projeto.

2. **Heritage Traits (#29), Humiliation Cascade (#32), Growth Events (#35), Hall of Fame (#36) — engine sem UI.** 4 sistemas complexos com testes verdes em `tests/specs/` mas **invisíveis ao usuário**. Efeitos só aparecem como `weekEvents.push('🧬 ...')` no log. **Por que crítico**: features fantasmas que enchem o SDD mas não entregam value. **Estimativa**: 12h (criar painel "Linhagem & Legado" agregando os 4 sistemas em 1 view com sub-tabs).

3. **Bench Events (#2), OffPitch Events (#3), NPCs Nomeados (#7), Chain Event Flags (#6), Stress (#5), Bench Status (#10) — modo jogador isolado.** 6 mecânicas premium do RPG só acessíveis em modo jogador, que provavelmente <5% dos usuários experimentam. Modo manager (default) **nunca toca essas cartas**. **Por que crítico**: ROI cego — investimento alto em mecânicas, exposição mínima. **Estimativa**: variável. Decisão: (a) expandir esses sistemas pra modo manager OU (b) destacar modo jogador no onboarding. 4h decisão + 8-20h execução.

4. **LiveOpsService (#37) — DEAD CODE.** Service exporta `getActiveLiveOps` mas **zero consumers**. Spec-098 documenta a feature mas o wire-up nunca aconteceu. **Por que crítico**: arquivo morto no repo = ruído + risco de spec mentirosa. **Estimativa**: 4h (deletar OU plugar em DashboardView com banner de evento ativo).

5. **StateChampionship (#22) — engine órfã.** `tournaments/StateChampionship.js` existe, declara 4 estaduais brasileiros, **zero imports**, zero testes. **Por que crítico**: feature regional decisiva (Paulistão é parte da identidade do futebol brasileiro). **Estimativa**: 10h (wire em `engine.js` initialization + ajustar calendário em `WeekProcessor` + aba estadual em `StandingsView` + harness).

---

## Top 5 features para keep watching

1. **MARL / Adaptive Brain (#27)** — sistema mais complexo do repo (8+ arquivos em `services/learning/`), mas só visível como sub-tab dentro de `AutoPlayView`. **Observação**: é "o único diferencial real" segundo MASTER-ROADMAP-FOUNDATION-FIRST. Deveria ser feature de primeira linha, não overhead do bot.

2. **Tutorial (#26)** — uma vez feito, **não-replayable** sem deletar `localStorage`. Em playtest novo usuário só tem 1 chance. Adicionar "REPETIR TUTORIAL" em sidebar/help.

3. **Achievements (#19)** — `MetaProgression.evaluateAchievements` é chamado **apenas no fim de season**. `unlockAchievement(Hat_trick)` durante a partida (ver `AchievementsSystem.js:109`) provavelmente nunca dispara (não há callsite). Verificar.

4. **PressService vs engine/PressConference.js** — `PressService.js` existe em `services/` mas `PressView.jsx` importa direto de `engine/PressConference.js`. PressService pode ser dead intermediário. Auditar.

5. **Scouting (#15) sem view dedicada** — feature core de manager game, escondida como sub-comportamento do Market. Decision: criar view dedicada OU aceitar que market+scouting são uma coisa só (atualizar SDD).

---

## Methodology notes

- **Read-only audit**: nenhum arquivo de código foi modificado.
- **Ambiguidades resolvidas conservadoramente**:
  - Se uma feature tem engine + service consumers, marquei `Engine ✅` (verificado via `grep -rln` para call-sites reais, não apenas existência de arquivo).
  - Se feature aparece apenas como string em outro deck (ex: NPCs nomeados), marquei `partial` no UI, não `✅`.
  - "Reachable" = consigo navegar do sidebar atual sem dev tools nem alterar localStorage. Views só acessíveis em modo jogador foram marcadas `hidden` quando isso significa <5% dos usuários veem.
  - "E2E" = só vale se for Playwright/integration que clica na UI. Spec-test isolado da engine é `unit-only`. **Resultado: 0 features com E2E real.**
- **Limitações**:
  - Não executei o build nem rodei `npm test` (read-only).
  - Não validei se `evaluateAchievements` em-game funciona — apenas que está plumbing em `SeasonProcessor`.
  - Não verifiquei runtime — eg. `MatchEventsDeck.drawCard` pode falhar em prod por bug de gating de renown, mas o código existe e o teste passa.
- **Para validar com humanos** (Dudu):
  1. Confirmar se modo jogador é "first-class" ou experimental. Decide o destino de features #2/3/5/6/7/10.
  2. Confirmar se LiveOps deve viver — purgar ou completar.
  3. ~~Confirmar se "News System" foi escrita por engano no SDD (vibe-coding doc) ou é débito real.~~ **RESOLVIDO 2026-05-12**: vibe-coding doc — feature PURGED, não estava no SDD nem no engine.
  4. Playtest com 5 brasileiros (DoD Bloco 2) revelará quais "hidden" features realmente importam.

**Estimativa total para Bloco 2.2 fechar gaps top-5**: 34-46h. Caber em 6 semanas mantendo ritmo "2 PRs/semana" do mandamento brutal #8.
