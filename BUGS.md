# 🐛 Bug Tracker — OléFUT

> Atualizado: 2026-05-13 | Protocolo: AKITA Mandamento #6 (ticket + fix + regression test)
> Fonte canônica: arquivos em `tests/regression/`. Cada BUG-XXX precisa ter os 3 artefatos.

## Estado

| | |
|---|---|
| Bugs com regression test em `tests/regression/` | **17 arquivos** (alguns cobrem cascatas) |
| Bugs resolvidos com 3-artefact completo | Ver tabela abaixo |
| Bugs abertos / regressões ativas (2026-05-13) | ✅ 1619/1619 verde após AKITA-313 systematic debug + AKITA-317 rebrand |
| V11 latentes fixados (AKITA-313) | ModLoader fetch storm + setState após unmount AutoPlayLabView |

## Inventário de regression tests

| Arquivo | Cobre | Status atual |
|---------|-------|--------------|
| `tests/regression/BUG-010.test.js` | BUG-010 | ✅ |
| `tests/regression/BUG-011.test.js` | BUG-011 | ✅ |
| `tests/regression/BUG-015.test.js` | BUG-015 | ✅ |
| `tests/regression/BUG-019.test.js` | BUG-019 | ✅ |
| `tests/regression/BUG-020.test.js` | BUG-020 | ✅ |
| `tests/regression/BUG-021.test.js` | BUG-021 | ✅ |
| `tests/regression/BUG-022.test.js` | BUG-022 | ✅ |
| `tests/regression/BUG-026-029-autoplay.test.js` | BUG-026 → BUG-029 | ✅ |
| `tests/regression/BUG-032-034-cascade.test.js` | BUG-032 → BUG-034 | ✅ (AKITA-104: `YouthAcademy.js:49` fix — stats flat) |
| `tests/regression/BUG-040-043-cascade.test.js` | BUG-040 → BUG-043 | ✅ (AKITA-104: `encodeState` realinhado com SPEC-116) |
| `tests/regression/BUG-055-draws-only.test.js` | BUG-055 | ✅ |
| `tests/regression/BUG-078.test.js` | BUG-078 | ✅ |
| `tests/regression/BUG-079.test.js` | BUG-079 | ✅ |
| `tests/regression/BUG-083-save-reload-error-boundary.test.js` | BUG-083 | ✅ (save→reload error boundary — `llmNarrative` + services RFCT-019.* faltavam em `ENGINE_CLASS_FIELDS`) |
| `tests/regression/BUG-084-standings-hydration.test.js` | BUG-084 | ✅ (StandingsView `<Tooltip><th>` injetava `<span>` em `<tr>` — React hydration warning) |
| `tests/regression/SPEC-117-skip-auto-restore.test.js` | AKITA-204 NPC brain bug (5 testes) | ✅ (Mandamento #6 — 3-artefact completo via SPEC-154) |

**Bugs abertos (Akita 3-artefact pendente — Mandamento #6)**:

| BUG | Issue | Spec | Status |
|-----|-------|------|--------|
| BUG-080 | deep-soak-100seasons flaky em suite-load | SPEC-157 | ✅ resolvido AKITA-207 (mov pra `npm run test:soak`) |
| BUG-081 | 14 react-hooks/set-state-in-effect warnings | SPEC-158 | ✅ resolvido AKITA-207 (3 refactor + 11 doc/silence) |
| BUG-085 | Audit suspeitou PressService morto (era falso positivo) | n/a (auditoria) | ✅ resolvido (verificação + comentário arquitetural) |
| BUG-086 | Hat_trick achievement sem callsite real durante partida | n/a (callsite) | ⚠️ parcial — Hat_trick hooked; ~15 outros achievements ainda sem progress callsite (backlog) |

**Regressões em SPECs (mesmo arquivo de regression cobre):**
- `tests/regression/SPEC-060-club-identity.test.js` — ✅ (AKITA-104: Proxy alias 88 DB→canonical)
- `tests/regression/SPEC-115-117-adaptive-bot.test.js` — ✅ (AKITA-104: encodeState 6-dim)

**Outros vermelhos (não regression) — resolvidos em AKITA-104:**
- `tests/specs/SPEC-009-youth-academy.test.js` — ✅ stats flat
- `tests/characterization/engine-golden.test.js` — ✅ skip restoreAllBrains em test env
- `tests/integration/marl-e2e.test.js` — ✅ AdaptiveBrain `skipAutoRestore` opt-in
- `tests/integration/seasonhistory-data.test.js` — ✅ resolvido pela cascata
- `tests/specs/SPEC-025-aging.test.js` — ✅ pin seed
- `tests/specs/SPEC-134-growth-event-system.test.js` — ✅ pin seed
- `tests/integration/autoplay-full-audit.test.js` — ✅ pin seed

---

## Tickets resolvidos (detalhado)

### BUG-001 ✅ RESOLVIDO — `scoutRegionAction` não existia na engine
- **Arquivo:** `engine.js:312`
- **Fix:** Adicionado `scoutRegionAction()` como alias de `doScouting()`
- **Teste:** `engine.test.js > BUG-001` (2 assertions)

---

### BUG-002 ✅ RESOLVIDO — `signScoutedPlayer` não existia na engine
- **Arquivo:** `engine.js:318`
- **Fix:** Implementado `signScoutedPlayer(index)` com validação de saldo, contrato, moral
- **Teste:** `engine.test.js > BUG-002` (5 assertions)

---

### BUG-003 ✅ RESOLVIDO — Speed control não mudava velocidade do ticker ativo
- **Arquivo:** `MatchView.jsx:42-80`
- **Fix:** `speedRef` + `tickerStateRef` + `useEffect` que reinicia interval ao mudar speed
- **Teste:** `static-checks.test.js > BUG-003` (3 assertions)

---

### BUG-004 ✅ RESOLVIDO — preStep/talkDone não resetavam entre partidas
- **Arquivo:** `MatchView.jsx:531`
- **Fix:** Adicionado `setPreStep(1); setTalkDone(false)` no onClick do "VOLTAR AO DASHBOARD"
- **Teste:** `static-checks.test.js > BUG-004` (3 assertions)

---

### BUG-005 ✅ RESOLVIDO — Import morto `generateCounterOffer` no MarketView
- **Arquivo:** `MarketView.jsx:5`
- **Fix:** Removido import
- **Teste:** `static-checks.test.js > BUG-005` (1 assertion)

---

### BUG-006 ✅ RESOLVIDO — MarketView mutava `team.squad` diretamente
- **Arquivo:** `MarketView.jsx:38`, `engine.js:348`
- **Fix:** Criado `engine.sellPlayer(playerId, amount)`, MarketView usa via engine
- **Teste:** `engine.test.js > BUG-006` (3 assertions) + `static-checks.test.js > BUG-006` (2 assertions)

---

## Resultado dos Testes

```
✓ 30/30 testes passando
✓ 2 arquivos de teste (engine.test.js + static-checks.test.js)
✓ Build limpo (0 erros, 381KB)
✓ Tempo: 277ms
```

## Comandos

```bash
npm test          # roda todos os testes uma vez
npm run test:watch # roda testes em modo watch
npm run test:ci    # roda testes + build (pipeline)
```

---

### BUG-007 ✅ RESOLVIDO — Statistics topScorer ownerTeam sempre homeTeam (bug logic)
- **Issue:** https://github.com/dudujarra/olefut/issues/2
- **Branch:** `bug/BUG-007`
- **Fix:** Aplicado (ver tests/regression/)
- **Teste:** `tests/regression/BUG-007.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-008 ✅ RESOLVIDO — MarketSystem makeOffer aceita oferta sem listing existir
- **Issue:** https://github.com/dudujarra/olefut/issues/3
- **Branch:** `bug/BUG-008`
- **Fix:** Aplicado (ver tests/regression/)
- **Teste:** `tests/regression/BUG-008.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-009 ✅ RESOLVIDO — ContractSystem bonus duplicado se goalNumber distinto
- **Issue:** https://github.com/dudujarra/olefut/issues/4
- **Branch:** `bug/BUG-009`
- **Fix:** Aplicado (ver tests/regression/)
- **Teste:** `tests/regression/BUG-009.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-010 ✅ RESOLVIDO — Script debug-bug.sh octal error em BUG-008+
- **Issue:** https://github.com/dudujarra/olefut/issues/5
- **Branch:** `bug/BUG-010`
- **Fix:** Aplicado (ver tests/regression/)
- **Teste:** `tests/regression/BUG-010.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-011 ✅ RESOLVIDO — regression.yml falta pull-requests write permission (403 comment)
- **Issue:** https://github.com/dudujarra/olefut/issues/7
- **Branch:** `bug/BUG-011`
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-011.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-012 ✅ RESOLVIDO — PrestigeSystem decay Math.floor zera valores < 20 permanente
- **Issue:** https://github.com/dudujarra/olefut/issues/8
- **Branch:** `bug/BUG-012`
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-012.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-013 ✅ RESOLVIDO — NPCAISystem rngState global compartilhado entre instances
- **Issue:** https://github.com/dudujarra/olefut/issues/9
- **Branch:** `bug/BUG-013`
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-013.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-014 ✅ RESOLVIDO — NewsSystem news array unbounded memory leak
- **Issue:** https://github.com/dudujarra/olefut/issues/10
- **Branch:** `bug/BUG-014`
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-014.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-015 ✅ RESOLVIDO — MatchView crash TypeError minute undefined em filter
- **Issue:** https://github.com/dudujarra/olefut/issues/12
- **Branch:** `bug/BUG-015`
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-015.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-019 ✅ RESOLVIDO — Tab Clube crash - StaffManager falta getStaff method
- **Issue:** https://github.com/dudujarra/olefut/issues/17
- **Branch:** `bug/BUG-016`
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-016.test.js`
- **Status:** OPEN (2026-05-08)


---

### BUG-020 ✅ RESOLVIDO — App não persiste state (sem auto-save)
- **Issue:** https://github.com/dudujarra/olefut/issues/18
- **Branch:** `bug/BUG-017`
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-017.test.js`
- **Status:** OPEN (2026-05-08)


---

### BUG-021 ⏳ ABERTO — React error #310 — early return between hooks (DashboardView + PlayerDashboardView)
- **Issue:** https://github.com/dudujarra/olefut/issues/60
- **Branch:** `bug/BUG-021`
- **Fix:** TODO
- **Teste:** `tests/regression/BUG-021.test.js`
- **Status:** OPEN (2026-05-08)


---

### BUG-022 ⏳ ABERTO — BUG-077 Série B encolhe: processPromoRelegation só roda pra divisão do bot
- **Issue:** https://github.com/dudujarra/olefut/issues/93
- **Branch:** `bug/BUG-022`
- **Fix:** TODO
- **Teste:** `tests/regression/BUG-022.test.js`
- **Status:** OPEN (2026-05-09)


---

### BUG-078 ⏳ ABERTO — SPEC-111 market offers not tracked — buy offers never reach history.offers (only MARKET_INQUIRY probes do)
- **Issue:** https://github.com/dudujarra/olefut/issues/94
- **Branch:** `bug/BUG-078`
- **Fix:** TODO
- **Teste:** `tests/regression/BUG-078.test.js`
- **Status:** OPEN (2026-05-10)


---

### BUG-079 ⏳ ABERTO — Player immortality — high-OVR titular players accumulate totalGoals indefinitely (7269 in 203 seasons) because age/retirement system fails for long-lived squad members
- **Issue:** https://github.com/dudujarra/olefut/issues/95
- **Branch:** `bug/BUG-079`
- **Fix:** TODO
- **Teste:** `tests/regression/BUG-079.test.js`
- **Status:** OPEN (2026-05-10)


---

### BUG-083 ✅ RESOLVIDO — save→reload error boundary em DashboardView (`llmNarrative` perdia métodos após restore)
- **Arquivo:** `src/context/GameContext.jsx:113` (`ENGINE_CLASS_FIELDS`)
- **Branch:** `claude/spec171-save-reload-fix`
- **Repro:** Start career → save via botão 💾 → F5 → DashboardView crashava com "An error occurred in component"
- **Root cause:** `engine.llmNarrative` (LLMNarrativeService, SPEC-167) e os services `_npcWeekProcessor`, `_transferService`, `_scoutingService`, `_loanService`, `_facilityService`, `_formationService`, `_pressService`, `_sectorService`, `_gameInitializer` (RFCT-019.*) **não estavam** em `ENGINE_CLASS_FIELDS`. O JSON round-trip transformava as instâncias em plain objects (`{}` após serialização), perdendo métodos. Primeiro consumer (`DashboardView.handleAuxiliarAdvice` → `engine.llmNarrative.managerAdvice(...)`) crashava com `TypeError: ...is not a function`.
- **Fix:** Adicionado todos esses fields à `ENGINE_CLASS_FIELDS`. Save os pula; constructor da Engine recria-os frescos no reload.
- **Teste:** `tests/regression/BUG-083-save-reload-error-boundary.test.js` (6 testes — Mandamento #6 — 3-artefact completo). Inclui sentinel que detecta automaticamente qualquer nova class-instance field ausente do skip-list.
- **Status:** CLOSED (2026-05-12)


<<<<<<< HEAD
---

### BUG-084 ✅ RESOLVIDO — StandingsView React hydration warning (`<span>` inside `<tr>`)
- **Arquivo:** `src/components/StandingsView.jsx:189` (header `<tr>`)
- **Branch:** `claude/fix-standings-hydration`
- **Repro:** Abrir o jogo em produção → navegar para a tabela → console emite `Warning: validateDOMNesting(...): <span> cannot appear as a child of <tr>` e (em React 19 produção) erro de hydration mismatch.
- **Root cause:** `<Tooltip>` (`src/components/Tooltip.jsx`) renderiza um `<span>` wrapper ao redor dos children. StandingsView envolvia cada `<th>` com `<Tooltip content="Pontos"><th>P</th></Tooltip>`, expandindo para `<span><th>P</th></span>` dentro de `<tr>` — HTML inválido.
- **Fix:** Substituí cada `<Tooltip><th>...</th></Tooltip>` pelo atributo nativo `title=` no próprio `<th>`. Zero wrapper, zero JS extra, mesma UX (hover hint) e acessível via assistive tech sem ARIA custom. Import de `Tooltip` removido do arquivo.
- **Teste:** `tests/regression/BUG-084-standings-hydration.test.js` (5 static checks). Falha se alguém re-introduzir `<Tooltip><th>`, `<Tooltip><td>`, `<Tooltip><tr>`, remover os `title=` de P/V/Saldo, ou re-importar `Tooltip` em StandingsView.
- **Safety net:** SPEC-176 (`tests/e2e/_fixtures.js`) — todas as E2E specs agora capturam `pageerror` + `console.error` e falham se hydration warning (ou qualquer erro não-whitelist) ocorrer durante o flow. Esta classe inteira de bug não passa silenciosa de novo.
- **Status:** CLOSED (2026-05-12)

=======

---

### BUG-085 ✅ RESOLVIDO — Audit suspeita PressService morto (falso positivo)
- **Arquivo:** `src/services/PressService.js`
- **Branch:** `claude/pressservice-achievements`
- **Repro:** Brutal audit AKITA-233 sugere que `src/services/PressService.js` é intermediário morto porque `PressView.jsx` importa direto de `src/engine/PressConference.js`.
- **Investigação:** PressService **está vivo e é load-bearing**. 5 métodos (`checkPressConference`, `answerPress`, `getRenewalOffer`, `renewContract`, `respondCoachProposal`) são delegados pela engine para múltiplos consumers reais:
    - `src/components/DashboardView.jsx` (linhas 186, 502, 567) — UI manual no dashboard
    - `src/services/AutoPlayService.js` (241-246) — autoplay headless
    - `src/services/AutoPlayPacing.js` (64-105) — renewContract + respondCoachProposal automáticos
    - `src/services/MonitorService.js` (180) — observabilidade
    - `tests/integration/autoplay-gdd-proof.test.js` (84-85)
- **Por que PressView não usa:** PressView precisa de reactividade React (`useState` initializer com `generateQuestion`). O caminho UI manual e o caminho headless/autoplay são **intencionalmente separados** — isso é boa arquitetura, não duplicação.
- **Fix:** Adicionado comentário arquitetural no topo de `src/services/PressService.js` documentando consumers reais + por que PressView bypassa.
- **Teste:** `tests/regression/BUG-085-press-service-dead.test.js` (assertions de que classe + 5 métodos existem; engine delega corretamente; PressService **NÃO** pode ser deletado).
- **Status:** CLOSED (2026-05-12)


---

### BUG-086 ⚠️ PARCIAL — Achievements declarados sem callsite real (Hat_trick, Iron_man, e ~15 outros)
- **Arquivos:** `src/engine/PlayerTraits.js`, `src/services/MatchSimulator.js` (via `recordMatchStats`), `src/services/CareerService.js`, `src/components/AchievementsView.jsx`
- **Branch:** `claude/pressservice-achievements`
- **Repro:** Brutal audit aponta `Hat_trick` e `Iron_man` em `AchievementsSystem.ACHIEVEMENTS` sem hook real durante partida.
- **Investigação:** Existem **2 sistemas de achievements** em paralelo:
    1. `src/engine/MetaProgression.js` — **ATIVO**. 10 achievements cross-career, called via `evaluateAchievements()` em `SeasonProcessor._processMetaProgression`. Funciona.
    2. `src/engine/systems/AchievementsSystem.js` — **ZUMBI**. Classe nunca instanciada em produção (zero `new AchievementsSystem()` em `src/`). Apenas o dict `ACHIEVEMENTS` (27 achievements) é importado por `AchievementsView.jsx` para renderizar a tela de conquistas. `checkAchievements()` da classe só roda em unit tests.
    
    `AchievementsView.computeProgress()` calcula progresso client-side via heurísticas em cima do `engine.managerStats` + `engine.legacy` + `engine.proPlayer.career`. Apenas ~11 dos 27 achievements têm `case` no switch; o resto cai em `default: 0` (locked forever).
- **Especificamente:**
    - `Hat_trick`: lê `engine.proPlayer?.career?.hatTricks` — **nunca escrito** em lugar nenhum antes deste fix.
    - `Iron_man`: lê `matchesPlayed = managerStats.wins + draws + losses` — **funciona** (achievement chega a 100% em ~50 jogos com manager team).
- **Fix aplicado (parcial — Hat_trick):**
    - `src/engine/PlayerTraits.initCareerStats`: adiciona `hatTricks: 0` + backfill em saves antigos.
    - `src/engine/PlayerTraits.recordMatchStats`: incrementa `player.career.hatTricks` quando `goals >= 3` na partida (caminho squad real, via MatchSimulator).
    - `src/services/CareerService` (proPlayer mode): refatorado simulador semanal para acumular `matchGoals` por partida e incrementar `proPlayer.career.hatTricks` se chegar a 3.
- **Achievements restantes sem callsite real (backlog — não fixados neste PR):** `Golden_boot`, `Overhead`, `National_hero`, `Club_legend`, `Veteran_15` (apenas seasonNumber ≠ 15 anos jogador), `Perfect_season`, `Cinderella`, `Comeback`, `Defensive_masterclass`, `Flawless_match`, `From_zero`, `Winter_champion`, `Spring_winner`, `Rival_slayer`, `Underdog`, `Rivalry_master`, `Legend_tier` (depende `engine.legacy.prestige` que talvez não exista), `Survivor` (placeholder simplificado), `Cup_winner` (depende `engine.legacy.cupTitles` placeholder).
    - **Decisão estratégica:** consolidar em SPEC futura. Opções: (a) deletar `src/engine/systems/AchievementsSystem.js` + sua `AchievementsView` e usar apenas `MetaProgression`, ou (b) hookar cada achievement num evento real do match/season pipeline. Akita Mandamento #4 sugere (a) — não manter sistema fantasma + UI fantasma.
- **Teste:** `tests/regression/BUG-086-achievement-callsites.test.js` (asserts `Hat_trick` é incrementado em hat-trick real via `recordMatchStats` e via CareerService proPlayer mode; lista achievements restantes pendentes para forçar consciência).
- **Status:** PARCIAL (2026-05-12) — Hat_trick corrigido; demais documentados como backlog.
>>>>>>> b00e7cf (AKITA-259: BUG-085 PressService kept + BUG-086 Hat_trick callsite)
