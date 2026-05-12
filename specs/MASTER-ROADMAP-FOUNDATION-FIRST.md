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

### Bloco 1 — Fundação (atualizado 2026-05-12 23:30)

#### RFCT-004 — MatchSimulator extract
- [x] AKITA-126 (Antigravity) — `src/services/MatchSimulator.js` 545 LOC

#### RFCT-005..016 — Services skeletons + reads
- [x] MythService 348 LOC + tests (RFCT-005/6/7 — Antigravity AKITA-211ish)
- [x] RelationshipService 267 LOC + tests (RFCT-008/9/10)
- [x] NarrativeService 304 LOC + tests (RFCT-011/12/13)
- [x] CareerService 231 LOC + tests (RFCT-014/15/16)
- [x] WeekProcessor + SeasonProcessor (delegators)

> **Atenção**: Skeletons existem e engine instancia. **Mas engine.js continua 1525 LOC**. Skeleton extract ≠ logic move. Real shrink ainda pendente.

#### RFCT-017 — UI hooks-fachada migration + SAVE_VERSION 2→3
- [ ] Pendente

#### RFCT-018 — AutoPlayService split (1905 → ≤400 LOC, atual 1280)
- [x] Phase 1: AutoPlayLLMBridge + AutoPlayPersistence (AKITA-213)
- [x] Phase 2: AutoPlayPacing 323 LOC (Antigravity AKITA-215)
- [x] Phase 3: AutoPlaySimulator 396 LOC (Antigravity AKITA-216)
- [ ] Phase 4: AutoPlayService orchestrator slim ≤400 LOC (atual 1280)

#### RFCT-019 — engine.js real shrink (NOVO — bloqueante crítico)
- [ ] Audit 47 métodos engine.js (já tem mapa)
- [ ] Identificar métodos a mover pra cada service
- [ ] advanceWeek 160 LOC → extract NPC logic + AI Director + player career
- [ ] Engine final ≤400 LOC com só orchestration

#### Bundle optimization
- [x] Player-data chunk separado (AKITA-213, Antigravity)
- [ ] EfButton 637KB audit (qual dep tá puxando)
- [ ] Tone.js lazy load

#### Doc auto-gen
- [ ] README badges via CI script (auto-gera test count, LOC, specs)
- [ ] CLAUDE.md métricas geradas, não manuais
- [ ] Pre-commit hook valida CLAUDE.md vs estado real

### Bloco 2 — Integração

- [ ] Feature audit planilha preenchida
- [ ] Gap fixes (40 features)
- [ ] LLM bridge 3 use cases reais
- [ ] 10+ E2E tests
- [ ] Tutorial 5min completável

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
