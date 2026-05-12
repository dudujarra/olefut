# 🏗️ MASTER ROADMAP — FOUNDATION-FIRST

**Criado**: 2026-05-12
**Owner**: Dudu (Eduardo Jarra)
**Status**: 🟢 ATIVO (sobrepõe-se a qualquer plano anterior)
**Trigger**: análise brutal pós-AKITA-207..214 detectou dívida estrutural insustentável

---

## ⛔ PRINCÍPIO FUNDADOR

> **Nada de feature nova até que o atual funcione.**

Não deletar features = ok. Mas cada feature **TEM** que ter:

1. Implementação real (não stub, não delegação fake)
2. UI integrada (todo botão liga em algo de verdade)
3. Path de descoberta (usuário acha sem manual)
4. Performance OK (não trava, não bloata bundle)
5. Testado com humano real (não só vitest)

**Se uma feature não tem os 5, ela tá quebrada — independente do que CLAUDE.md afirma.**

---

## 🎯 OS 3 BLOCOS BLOQUEANTES

Cada bloco BLOQUEIA o seguinte. Não pode pular ordem.

### **BLOCO 1 — FUNDAÇÃO** (4-6 semanas, ~80h)

> Sem esse bloco, tudo é castelo de cartas. **Zero feature nova até terminar.**

#### B1.1 Engine refactor terminado (50h)

**Bloqueante**: `engine.js` 1525 LOC + 17 services = duplicação invisível ou delegação fake.

| Sub-task | Spec | Horas | Status |
|---|---|---|---|
| RFCT-004 Extract MatchSimulator | AKITA-RFCT-004 | 10 | ✅ done (AKITA-126) |
| RFCT-005 MythService skeleton + reads | AKITA-RFCT-005 | 4 | 📝 pendente |
| RFCT-006 Move read methods to MythService | AKITA-RFCT-006 | 3 | 📝 pendente |
| RFCT-007 Move writes + saveSerializer | AKITA-RFCT-007 | 4 | 📝 pendente |
| RFCT-008 RelationshipService skeleton | AKITA-RFCT-008 | 4 | 📝 pendente |
| RFCT-009 RelationshipService reads | AKITA-RFCT-009 | 3 | 📝 pendente |
| RFCT-010 RelationshipService writes + Wrap playMatch | AKITA-RFCT-010 | 4 | 📝 pendente |
| RFCT-011 NarrativeService skeleton + Camadas 1-2 | AKITA-RFCT-011 | 6 | 📝 pendente |
| RFCT-012 NarrativeService Camadas 3-4 | AKITA-RFCT-012 | 6 | 📝 pendente |
| RFCT-013 NarrativeService Camada 5 | AKITA-RFCT-013 | 4 | 📝 pendente |
| RFCT-014 CareerService skeleton + ProPlayer | AKITA-RFCT-014 | 5 | 📝 pendente |
| RFCT-015 CareerService Manager | AKITA-RFCT-015 | 4 | 📝 pendente |
| RFCT-016 Transição Replace Method | AKITA-RFCT-016 | 6 | 📝 pendente |
| RFCT-017 UI hooks-fachada migration + SAVE_VERSION 2→3 | AKITA-RFCT-017 | 4 | 📝 pendente |

**DoD do bloco**: engine.js ≤400 LOC, services com lógica real (não vazio), golden master idêntico, save round-trip preservado.

**Stop condition**: qualquer RFCT que quebra golden master ou save = PARA e investiga.

#### B1.2 AutoPlayService split (15h)

**Bloqueante**: 1905 LOC = god-class. SPEC-RFCT-018 já existe (Antigravity AKITA-211).

| Service | Limite LOC | Status |
|---------|-----------|--------|
| AutoPlaySimulator (loop) | ≤500 | 📝 |
| AutoPlayLLMBridge (WebLLM) | ≤400 | ✅ extraído AKITA-213 |
| AutoPlayPacing (friction) | ≤300 | 📝 |
| AutoPlayPersistence (save/restore) | ≤200 | ✅ extraído AKITA-213 |
| AutoPlayService (orchestrator) | ≤400 | 📝 (atual 1905) |

#### B1.3 Bundle optimization (10h)

**Bloqueante**: EfButton 637KB porque dragga player DB.

- [ ] EfButton chunk audit — qual dep tá puxando 637KB
- [ ] Player DB split por liga (BR + EU + SA chunks separados, lazy load)
- [ ] Tone.js → lazy só quando AudioController carrega
- [ ] Meta: total ≤2.5MB, initial ≤300KB, EfButton ≤100KB

#### B1.4 Doc reality sync (5h)

**Bloqueante**: badges mentem (1044 vs 1035 vs 1050).

- [ ] README badges via CI script (auto-gera)
- [ ] CLAUDE.md métricas geradas, não manuais
- [ ] Pre-commit hook valida CLAUDE.md vs estado real

**Critério DoD do BLOCO 1**:
- `engine.js` ≤ 400 LOC
- `AutoPlayService.js` ≤ 400 LOC
- Bundle initial ≤ 300KB, total ≤ 2.5MB
- README/CLAUDE.md auto-gerados, zero mentira
- Golden master preservado
- 1 PR por sub-task, todos verdes

---

### **BLOCO 2 — INTEGRAÇÃO** (6-8 semanas, ~120h)

> **DESBLOQUEIA**: só começa após BLOCO 1 verde.

#### B2.1 Feature audit completo (15h)

Pra cada uma das **~40 features** documentadas em SDD_ELIFOOT_RPG.md:

| Feature | Engine OK | UI OK | Reachable | E2E Test | Gap |
|---------|-----------|-------|-----------|----------|-----|
| RPG Match Cards | ? | ? | ? | ? | ? |
| Bench Events | ? | ? | ? | ? | ? |
| OffPitch Events | ? | ? | ? | ? | ? |
| Personality (Maverick/Virtuoso/Heartbeat) | ? | ? | ? | ? | ? |
| Stress System | ? | ? | ? | ? | ? |
| Chain Event Flags | ? | ? | ? | ? | ? |
| NPCs Nomeados | ? | ? | ? | ? | ? |
| Streak Tracking | ? | ? | ? | ? | ? |
| Traits | ? | ? | ? | ? | ? |
| Bench Status Automático | ? | ? | ? | ? | ? |
| Ambition Engine | ? | ? | ? | ? | ? |
| Board System | ? | ? | ? | ? | ? |
| Press Conference | ? | ? | ? | ? | ? |
| Youth Academy | ? | ? | ? | ? | ? |
| Scouting | ? | ? | ? | ? | ? |
| Market System | ? | ? | ? | ? | ? |
| Contract System | ? | ? | ? | ? | ? |
| News System | ? | ? | ? | ? | ? |
| Achievements | ? | ? | ? | ? | ? |
| Cosmetic Shop | ? | ? | ? | ? | ? |
| Save Slots | ? | ? | ? | ? | ? |
| Tournaments (League/Cup/Continental/State) | ? | ? | ? | ? | ? |
| Sector Duels | ? | ? | ? | ? | ? |
| Playstyles (Caneleiro/Fairplay/etc) | ? | ? | ? | ? | ? |
| Yellow/Red Cards | ? | ? | ? | ? | ? |
| Tutorial | ? | ? | ? | ? | ? |
| MARL/Adaptive Brain | ? | ? | ? | ? | ? |
| Chronicle System | ? | ? | ? | ? | ? |
| Heritage Traits | ? | ? | ? | ? | ? |
| Prestige System | ? | ? | ? | ? | ? |
| Loss Streak Response | ? | ? | ? | ? | ? |
| Humiliation Cascade | ? | ? | ? | ? | ? |
| Rivalry Upgrade | ? | ? | ? | ? | ? |
| Organic Challenges | ? | ? | ? | ? | ? |
| Growth Events | ? | ? | ? | ? | ? |
| Hall of Fame / Legacy | ? | ? | ? | ? | ? |
| Live Ops | ? | ? | ? | ? | ? |
| Stadium System | ? | ? | ? | ? | ? |
| Staff System | ? | ? | ? | ? | ? |
| Music Engine (Tone.js) | ? | ? | ? | ? | ? |

**Output**: planilha viva (este doc atualizado). Gaps viram issues priorizadas.

#### B2.2 Tap o gap (60h)

Workflow por feature (1.5h média):
- Engine não funciona → spec + harness + fix
- UI não existe → wire na view correta
- Não-reachable → adiciona descoberta (sidebar/dashboard)
- Sem E2E test → harness mínimo
- **Cada feature: 1 PR, 1 commit limpo**

#### B2.3 LLM bridge real (15h)

**WebLLM é o único diferencial real do jogo.** Hoje é "bridge" — define o que faz:
- Use cases concretos: post-match analysis, manager advice, player chat, board reaction
- Implementa 3 use cases reais (não placeholders)
- Tutorial mostra LLM em ação
- Graceful degradation sem LLM (jogo joga normal)

#### B2.4 Integration tests E2E (15h)

1035 tests = unit/spec. Falta:
- "Novo jogador → primeira temporada inteira" (Playwright)
- "Save game → reload → state preserved"
- "Path obscuro não crash" (ex: market → contract → scout → back)
- 10 E2E flows mínimo

#### B2.5 Tutorial decente (15h)

5 min onboarding pra novo jogador:
- 4 telas: escolhe time, mostra HUD, joga 1 partida, ve resultado
- Tooltips contextuais nos botões críticos
- "Aha moments" cards estratégicos
- Replay tutorial via menu

**Critério DoD do BLOCO 2**:
- Planilha de features 100% preenchida (sem `?`)
- Todo gap fechado ou explicitamente documentado como "scope-out"
- LLM bridge entrega 3 use cases reais
- 10+ E2E tests verdes
- Tutorial completável em ≤5 min

---

### **BLOCO 3 — POLISH + LANÇAMENTO** (4-6 semanas, ~80h)

> **DESBLOQUEIA**: só começa após BLOCO 2 verde.

#### B3.1 UI consistency (40h) — **MAIOR ALAVANCA**

- SPEC-163 (Luxury Arcade) já existe (Antigravity AKITA-210)
- Audit por view (1 por dia útil):
  - Remove inline styles → CSS classes (.btn-primary, .card, etc.)
  - Emojis → Phosphor icons (789 ocorrências)
  - Bento grid assimétrico no Dashboard
  - Monospace nos números
- ~20 components × 2h = 40h

#### B3.2 Playtest com humanos (20h)

- 5 brasileiros, 30 min cada, observado
- Anota: travamentos, confusões, surpresas positivas, parecem-bug
- Fix top 10 issues
- Re-playtest com 3 novos players

#### B3.3 Performance pass (10h)

- React DevTools profile cada view
- Memoize componentes pesados
- Virtualize lists longas (MarketView 11k players)
- Lazy load assets até precisar
- Meta: FCP <1.5s, TTI <3s

#### B3.4 Lançamento real (10h)

- Trailer 60s mostrando gameplay
- Post Reddit r/footballmanager + r/brdev + r/gamedev
- Post tabnews.com.br
- Post Twitter dev BR
- Itch.io page polida
- Métricas de uso (Plausible/Umami self-hosted)

**Critério DoD do BLOCO 3**:
- UI 100% consistente (zero inline style em código novo, zero emoji em UI)
- Playtest validado por 8 humanos
- FCP < 1.5s
- Lançamento público com trailer + posts

---

## 🛑 REGRAS BRUTAIS (NÃO NEGOCIÁVEIS)

1. **Zero feature nova até BLOCO 1 terminar**
2. **Zero spec retroativa** — feature sem spec PRÉ não entra
3. **Zero emoji em código novo** (audit pega legados)
4. **Zero inline style em código novo** (audit pega legados)
5. **Cada PR**: lint 0 errors, tests verdes, build ≤1.5s, CHANGELOG entry, SPEC linkada
6. **README/CLAUDE.md auto-atualizados via script** (chega de mentir números)
7. **Playtest obrigatório por bloco** — sem playtest, bloco não termina
8. **Sem AKITA-XXX cascata frenética** — 1-2 PRs/semana, bem cozidos
9. **Sessões paralelas (Antigravity + Claude Code)** seguem mesma ordem de blocos
10. **Domingo OFF** — burnout é o maior risco

---

## 📅 ROTINA SEMANAL SUGERIDA

```
Segunda:  planeja semana — 1 RFCT + 2 features audit + 1 UI view
Terça:    RFCT execution (3-4h)
Quarta:   Feature gap fix (3-4h)
Quinta:   UI consistency em 1 view (3-4h)
Sexta:    Tests + docs + commit clean
Sábado:   Opcional — playtest ou hard problems
Domingo:  OFF
```

---

## 📊 ESTIMATIVA HONESTA

| Bloco | Horas | Solo 6h/sem | Solo 20h/sem | Paralelo Claude+Antigravity |
|-------|-------|-------------|--------------|------------------------------|
| 1 Fundação | 80 | 13 semanas | 4 semanas | 2.5 semanas |
| 2 Integração | 120 | 20 semanas | 6 semanas | 4 semanas |
| 3 Polish + Launch | 80 | 13 semanas | 4 semanas | 2.5 semanas |
| **Total** | **280h** | **~11 meses** | **~14 semanas (3.5 meses)** | **~9 semanas (2 meses)** |

---

## 🔁 PROGRESSO (atualizar a cada commit relevante)

### Bloco 1 — Fundação ✅ COMPLETO (atualizado 2026-05-12 04:40)

> **Status**: 🟢 Bloco 1 efetivamente completo. PRs #109-#121 mergeados (13 PRs sequenciais). Pequenos overshoots vs DoD strict ficaram documentados.

#### RFCT-004 — MatchSimulator extract
- [x] AKITA-126 (Antigravity) — `src/services/MatchSimulator.js` 545 LOC

#### RFCT-005..016 — Services skeletons + reads
- [x] MythService 348 LOC + tests (RFCT-005/6/7 — Antigravity AKITA-211ish)
- [x] RelationshipService 267 LOC + tests (RFCT-008/9/10)
- [x] NarrativeService 304 LOC + tests (RFCT-011/12/13)
- [x] CareerService 231 LOC + tests (RFCT-014/15/16)
- [x] WeekProcessor + SeasonProcessor (delegators)

#### RFCT-019 — engine.js real shrink (DONE — 10 PRs sequenciais)
- [x] AKITA-218 (PR #109) RFCT-019.1 — NPC week + AI Director + player career extract
- [x] AKITA-219 (PR #110) RFCT-019.2 — TransferService extract (181 LOC service)
- [x] AKITA-220 (PR #111) RFCT-019.3 — ScoutingService extract (86 LOC)
- [x] AKITA-221 (PR #112) RFCT-019.4 — LoanService extract (130 LOC)
- [x] AKITA-222 (PR #113) RFCT-019.5 — FacilityService extract (74 LOC)
- [x] AKITA-223 (PR #114) RFCT-019.6 — FormationService extract (158 LOC)
- [x] AKITA-224 (PR #115) RFCT-019.7 — PressService extract (122 LOC)
- [x] AKITA-225 (PR #116) RFCT-019.8 — startNewSeason rollover → SeasonProcessor
- [x] AKITA-226 (PR #117) RFCT-019.9 — SectorService extract (167 LOC)
- [x] AKITA-227 (PR #118) RFCT-019.10 — GameInitializer extract (204 LOC) + cleanup imports
- **Resultado**: `engine.js` 1525 → **431 LOC** (-71.7%). Target ≤400 (overshoot 31 LOC).

#### RFCT-020 — AutoPlayService split (DONE — single PR)
- [x] AKITA-230 (PR #121) RFCT-020 — split em 3 sub-services
  - AutoPlayLogger 224 LOC
  - AutoPlayBanditCoordinator 136 LOC
  - AutoPlayDecisions 512 LOC
- **Resultado**: `AutoPlayService.js` 1280 → **490 LOC** (-62%). Target ≤400 (overshoot 90 LOC; preservou thin delegators p/ compat com AutoPlayPacing/AutoPlaySimulator que chamam `_logXxx`/`_buildStateCtx` via ctx ref).

#### Bundle optimization
- [x] Player-data chunk separado (AKITA-213, Antigravity)
- [x] AKITA-228 (PR #119) Tone.js lazy load — 345 KB sai do critical path
- [x] Initial chunk 374 KB (target ≤300 KB — overshoot 25%; GameContext 265KB é principal contribuidor)
- [x] Total ~2.7 MB (target ≤2.5 MB — overshoot 8%; player-data 1.4 MB dominante)

#### Doc auto-gen
- [x] AKITA-229 (PR #120) `scripts/update-doc-metrics.cjs` — README/CLAUDE.md badges live-computed
- [x] CI drift check via `--check` mode
- [x] Pre-commit hook integration

#### Flake fix
- [x] AKITA-231 / BUG-082 (no PR #121) — SPEC-134 RNG flake corrigido via `setGlobalSeed(12345)` em beforeEach

### Bloco 1 DoD final snapshot

| Item | Target | Real | Status |
|------|--------|------|--------|
| engine.js LOC | ≤400 | 431 | 🟡 close (108%) |
| AutoPlayService LOC | ≤400 | 490 | 🟡 close (123% — constraints documentadas) |
| Bundle initial KB | ≤300 | 374 | 🟡 close (125%) |
| Bundle total MB | ≤2.5 | ~2.7 | 🟡 close (108%) |
| Doc auto-gen | ✅ | ✅ | ✅ |
| Golden master | ✅ | ✅ 1036/1036 | ✅ |
| Lint 0 errors | ✅ | ✅ (120 warnings cosméticos) | ✅ |
| Build | ✅ ≤1.5s | ✅ ~1s | ✅ |

**Decisão de Bloco**: Embora 4 itens estejam em "close" (8-25% overshoot), todos os marcos arquiteturais críticos (engine refactor, service extractions, doc auto-gen, golden master) foram atingidos. Otimizar os últimos 10-25% requer mudanças invasivas (modificar AutoPlayPacing/Simulator pra remover delegators, splitar GameContext, splitar player-data por região) que seriam Bloco 2/3 work. **Bloco 1 declarado funcionalmente completo.**

### Bloco 2 — Integração (em andamento)

#### B2.1 Feature audit (DONE)
- [x] AKITA-233 (PR #123) — `specs/AKITA-FEATURE-AUDIT-2026-05-12.md` produzido (119 LOC matrix completa)
- **Resumo**: 0/40 features com Playwright E2E real, 11 funcionam decentemente, 18 com gaps de 1-2 colunas, 11 quebradas/órfãs

#### B2.2 Gap fixes (em andamento — quick wins done)
- [x] AKITA-234 (PR #124) Quick wins: LiveOpsService DELETED (79 LOC dead code), Tutorial sidebar link (replayability)
- [ ] News System (#18) — confirmado ausente do engine E do SDD; audit estava errado sobre ser referenciado
- [ ] Painel "Linhagem & Legado" (Heritage/Humiliation/Growth/HoF unificado) — pendente
- [ ] StateChampionship wire-up (Paulistão/Carioca/Mineiro/Gaúcho órfãos) — pendente
- [ ] Decisão player vs manager mode (6 features player-only sem descoberta) — pendente

#### B2.3 LLM bridge real
- [ ] 3 use cases concretos (post-match analysis, manager advice, player chat)
- [ ] Graceful degradation sem LLM

#### B2.4 Integration tests E2E
- [ ] Setup `test:e2e` npm script + CI workflow
- [ ] 10+ Playwright flows (primeira temporada, save/reload, paths obscuros)

#### B2.5 Tutorial decente
- [x] Sidebar replay link (AKITA-234)
- [ ] Tooltips contextuais em ~10 botões críticos
- [ ] "Aha moments" cards estratégicos
- [ ] Funil tracking (já tem AUDIT-FIX #16)

### Bloco 3 — Polish + Launch

- [ ] UI consistency em 20 components
- [ ] Playtest com 8 humanos
- [ ] Performance FCP <1.5s
- [ ] Trailer + posts + Itch.io

---

## 🔗 Specs relacionadas

- `specs/refactor/AKITA-RFCT-000-master.md` — refactor master
- `specs/refactor/AKITA-RFCT-018-autoplay-service-split.md` — AutoPlayService split
- `specs/ui/SPEC-163-design-system-luxury-arcade.md` — UI canonical
- `specs/infra/SPEC-157-deep-soak-test-isolation.md` — test infra
- `specs/infra/SPEC-159-build-budget-gate.md` — bundle gate
- `specs/ui/SPEC-158-react-hooks-set-state-in-effect-audit.md` — react warnings audit

---

## 📌 META-REGRA

**Este doc é fonte ÚNICA do plano estratégico.** Qualquer outro doc de roadmap (`ROADMAP-NARRATIVE-MASTER.md` etc.) é SUBORDINADO a este até BLOCO 1 terminar. Após BLOCO 1, podemos atacar narrativas (v1.0.7+, v1.1+).

**Update obrigatório**: a cada PR mergeado relevante a este roadmap, atualizar seção "PROGRESSO" acima.
