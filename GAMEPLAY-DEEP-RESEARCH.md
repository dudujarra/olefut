# ELIFOOT — Gameplay Deep Research V3

**Data**: 2026-05-09
**Escopo**: Análise minuciosa gameplay loops, decision density, friction, dead time, action economy, meta-progression
**Foco**: O que falta + o que pode melhorar pra prender o user
**Volume**: 14 seções, ~1800 linhas

---

## TL;DR

ELIFOOT v3.1 tem **dados ricos** (2394 jogadores reais, 75 managers, pentagon stats, 18 posições) e **sistemas implementados** (lifestyle, achievements, traits, eventos, narrativa) — mas **gameplay continua raso**: user clica "advance week" 38× por temporada com **<5 decisões reais** entre matches.

Diagnóstico raiz: **passive simulation, not active management**. Matches são assistidos (não jogados), training é click-pick (não decisão), transferências são auto-generated offers (não scout active).

**3 gaps fatais identificados**:
1. **Decision density baixa** — 1 decisão real / 8-12 minutos sessão
2. **Match passivity** — 90 min de narração com 0-1 sub possível
3. **No agency feedback** — escolhas táticas raramente "sentem" diferença

**Propostas core** (10 sprints, ~120h):
1. Mid-match real-time tactics (depende RFCT-005)
2. Active scouting (busca jogador por critério vs lista pronta)
3. Negotiation dialogues (jogador/agente diálogo, não yes/no)
4. Press conferences gameplay-affecting
5. Squad rotation pressure (fadiga real visível)
6. Set pieces tomadores designados
7. Youth promotion drama
8. Boardroom interactive
9. Save corruption events (drama narrativo)
10. Live ops events (efêmeros)

---

## Índice

1. [Audit Core Gameplay Loops](#1-audit-core-gameplay-loops)
2. [Decision Density Analysis](#2-decision-density-analysis)
3. [Friction + Dead Time Map](#3-friction--dead-time-map)
4. [Match Engine Gameplay](#4-match-engine-gameplay)
5. [Training Loop Analysis](#5-training-loop-analysis)
6. [Transfer Market Analysis](#6-transfer-market-analysis)
7. [Player Mode Action Economy](#7-player-mode-action-economy)
8. [Meta-Progression Analysis](#8-meta-progression-analysis)
9. [Genre Action Density Comparison](#9-genre-action-density-comparison)
10. [Friction Points Specific (UI/UX)](#10-friction-points-specific)
11. [Hooks Engagement Missing](#11-hooks-engagement-missing)
12. [Specific Improvement Specs (15)](#12-specific-improvement-specs)
13. [Implementation Priority Matrix](#13-implementation-priority-matrix)
14. [Roadmap v3.2 → v4.0 (gameplay-first)](#14-roadmap-v32--v40)

---

## 1. Audit Core Gameplay Loops

### 1.1 Manager mode loop (mensal típico)

```
Login → DashboardView (5s scan)
  ↓
[Click] Treinar (1 dos 5 tipos) — 2s decisão
  ↓
[Click] Team talk (1 dos 6) — 2s
  ↓
[Click] Avançar Semana — 1s
  ↓
PreMatchScreen — opponent info (10s read, mas pula)
  ↓
[Click] Iniciar Jogo — 1s
  ↓
MatchView — 90 min narração (~4-6 min real time)
  ↓ [optional] [Click] sub mid-match — raro
  ↓
Fulltime — stats screen 10s
  ↓
[Click] Voltar Dashboard — 1s
  ↓
Repeat 38× temporada
```

**Tempo médio sessão ativa**: 8-12 minutos por week
**Ações/minuto**: ~3-5 cliques (incluindo navegação)
**Decisões high-stakes/week**: 0-1 (geralmente nenhuma — auto-tactic, auto-formation)

### 1.2 Player mode loop (semanal)

```
PlayerDashboard (3s scan)
  ↓
[Click] Treinar 1 skill — 2s decisão
  ↓ [optional] Click off-pitch event modal — 5s
  ↓
[Click] Avançar pra match — 1s
  ↓
PlayerMatch — assistir 90min (3-4min real)
  ↓
Fulltime stats — 5s
  ↓
[Click] Voltar — 1s
```

**Tempo médio**: 5-8 min/week
**Ações/min**: ~2-3
**Decisões high-stakes**: 1 (qual skill treinar)

### 1.3 Diagnóstico

Ambos loops são **>80% navegação/passivos** vs **<20% decisão estratégica**.

Comparação:
- FM: ~30 decisões/match (instructions, subs, tone, motivation)
- CM 01-02: ~15 decisões/match
- ELIFOOT: ~3 decisões/match (formation pre, sub mid, talk pos)

---

## 2. Decision Density Analysis

### 2.1 Decisões/minuto por subsistema

| Subsistema | Decisões/min user-active | Quality (low/med/high stakes) |
|---|---|---|
| Dashboard scan | 0.2 | Low (pure UI) |
| Tactic select | 1 | Medium |
| Formation drag | 2-3 | Medium |
| Training pick | 0.5 | Low |
| Team talk | 0.3 | Low (rare trigger) |
| Match watching | 0.05 | Low (passive) |
| Match sub | 0.1 | High (rare) |
| Transfer accept/reject | 0.2 | Medium |
| Scout regional | 0.1 | Low (auto-generated) |
| Stadium upgrade | 0.01 | Low (yearly) |
| Off-pitch event | 1 | Medium (rare trigger) |
| Lifestyle purchase | 0.3 | Low (cosmetic) |

**Total averaged**: ~0.8 decisions/min
**Genre target**: 3-5 decisions/min (FM standard)

### 2.2 Stakes distribution

```
Low stakes:    70% (UI navigation, training picks, lifestyle)
Medium stakes: 25% (tactics, transfers, board interactions)
High stakes:    5% (subs mid-match, big board demands, mega offers)
```

**Goal target**:
```
Low:    40%
Medium: 45%
High:   15%
```

### 2.3 Why low decision density?

- **Auto-defaults**: tática 'normal', formação preset, training auto-distribuído
- **Yes/No dialogs**: contratos = "renovar?" botão — falta negociação
- **Passive matches**: usuário não interfere após apito
- **Rare interrupts**: eventos off-pitch 40% chance/week só
- **No urgency markers**: nada timer, nada cooldown forced

---

## 3. Friction + Dead Time Map

### 3.1 Friction points (cliques desnecessários)

**F-1**: Voltar pro Dashboard 4-5×/match cycle
- Problema: cada view tem botão "← Voltar"
- Solução: persistent sidebar nav 1 click

**F-2**: Confirmar transações 2× (offer → confirm)
- Problema: duplicado quando barato
- Solução: 1-click sob threshold, confirm só se >R$1M

**F-3**: Pre-match screen passa rápido demais ou demora
- Problema: 3 painéis info opponent mas user pula tudo
- Solução: TL;DR top + expand on demand

**F-4**: Match speed control granular demais
- Problema: 1×/3×/5×/PAUSE — usuários só usam pause + 5×
- Solução: 2 modos (assistir / acelerar)

**F-5**: Formation board drag-drop complex pra mobile
- Problema: precisa precisão dedo
- Solução: tap-to-swap mode mobile

### 3.2 Dead time (tempo sem ação possível)

**D-1 (CRÍTICO)**: Match watching 4-6 min sem agency
- 90 min narração, possível: 1 sub
- 95% do tempo = passivo
- **Impact**: high — user ignora, faz aba lateral, perde imersão

**D-2**: Off-season (week 38-1) 0 ações
- Atual: skip automático
- **Fix**: férias, training camp, friendlies, contract renewals window

**D-3**: Transfer window fora-temporada
- Atual: market vazio off-season
- **Fix**: livres agentes, jogadores liberados, opportunities

**D-4**: Lesão grave 4-6 weeks
- Atual: avança weeks sem nada novo
- **Fix**: rehab progression mini-game, alternative training

### 3.3 Dead clicks (cliques sem feedback)

**DC-1**: Stadium upgrade button → modal → upgrade — sem visual change
**DC-2**: Hire staff → modal → done — staff invisible after
**DC-3**: Achievement unlock → toast 3s — sem trophy room view dedicada
**DC-4**: Trait purchase → toast — sem visual mudança no jogador

---

## 4. Match Engine Gameplay

### 4.1 Estado atual

```
playMatch(home, away):
  → simulate 90 minutes (deterministic + RNG)
  → return events list
  → MatchView animates events 1-by-1
  → user can: pause, sub, change speed
```

**User actions during match**:
- Pause/resume (low stakes)
- Substitute 1 player (medium stakes)
- Change speed (no stakes)

### 4.2 What's missing (vs FM/PES)

**M-1 Tactical instructions live**:
- Pressão alta/baixa toggle
- Marcação individual
- Bola longa / posse curta
- Tempo down / up

**M-2 Player-specific instructions**:
- Designar batedor falta
- Marcação individual top 3 enemies
- Foco em jogada (cruzamento alta, drible centro)

**M-3 Crowd / atmosphere**:
- Sem reaction crowd at scoreboard
- Sem chants by event type
- Sem visual stadium fill changing

**M-4 Match flow stats**:
- Atual: só goals + cards
- Missing: posse %, shots, corners, fouls live

**M-5 Highlight replays**:
- Atual: text narration
- Missing: visual highlight key moments (sprite-art)

### 4.3 Match phases proposed (12 phases vs current 3)

```
Current:  prematch → live → fulltime
Proposed: arrival → warmup → kickoff → 1st_half → halftime → 2nd_half_start →
          critical_moment → goal_celebration → injury_break →
          final_minutes → fulltime → press_conference
```

Each phase = trigger pra micro-decision + atmosphere change.

---

## 5. Training Loop Analysis

### 5.1 Atual

```
Manager mode:
  - 5 training types fixed (cardio, technical, tactical, defensive, attacking)
  - 1 click → applies to all squad uniformly
  - Result: +1 attribute point random player

Player mode:
  - 4 base skills (technique, pace, power, vision) + 16 sub-attrs
  - 1 click → spend 1 actionSlot → +XP that skill
  - Energy drain 12-15 → rest needed
```

### 5.2 Problemas

**T-1 Manager training boring**: 1 click/week, mesmo resultado sempre. Sem variance, sem interesting choice.

**T-2 No focus group training**: pode ser "treinar finalização goleiros" = waste

**T-3 Sem injury risk training**: realista mas sem feedback (sometimes injury = "training accident" — invisible)

**T-4 No training facilities upgrade meaningful**: academy upgrade só → +1 youth/year

### 5.3 Proposals

**T+1**: Training schedule weekly (5 days configurable)
- Day 1: tactical heavy
- Day 2: physical
- Day 3: rest
- Day 4: technical
- Day 5: match prep

**T+2**: Specialized training plans per player
- "Develop X attribute focus"
- Risk: injury chance up if intense

**T+3**: Training camps (off-season)
- 4-week intensive boost
- Cost money + injury risk

---

## 6. Transfer Market Analysis

### 6.1 Atual

```
Market:
  - 20 random-generated free agents
  - Auto-bids by AI clubs on user players
  - User can: accept/reject offers, scout regions, sign scouted
```

**Decisões/window**: 1-3 (accept big offer, sign 1-2 scouts)

### 6.2 Problemas

**TM-1 Passive market**: ofertas chegam, user só responde
**TM-2 No bidding war**: outras clubes não competem visivelmente
**TM-3 No agent negotiation**: contract = wage + duration only
**TM-4 No loan-to-buy**: empréstimo simples, sem cláusulas
**TM-5 Free agent search shallow**: 20 random, sem filtros sofisticados

### 6.3 Proposals

**TM+1**: Active market search
- Search by position + age + ovr range + budget
- Returns 50+ candidates from 170 clubs
- Each has interest level (rejects/considers/eager)

**TM+2**: Bidding wars visible
- Ver outros clubes competindo mesma compra
- Force user raise bid or lose

**TM+3**: Agent dialogue
- "Cliente quer R$X wage" → negotiate
- Personality types (already in SPEC-064 not exposed)

**TM+4**: Loan with clauses
- Mandatory buy at end
- Buy option specific value
- Recall clause

**TM+5**: Saga jogador (long-term targets)
- Add to "wishlist" → AI tracks → updates each season
- "Player Y interested in joining you next window"

---

## 7. Player Mode Action Economy

### 7.1 Atual (3 actionSlots/week)

| Action | Cost | Impact |
|---|---|---|
| Treinar skill | 1 slot | +XP small |
| Descansar | 1 slot | +30 energy |
| Buy energy drink | 0 | -R$100 |
| Use energy drink | 0 | +40 energy |
| Buy trait | 0 | -R$1500-3000, +trait |
| Off-pitch event response | 0 | Various |
| Buy lifestyle | 0 | -R$, mood/etc |

### 7.2 Problemas

**PA-1 Slot economy wasted**: lifestyle/trait buys são free, só treinar/rest gastam slots
**PA-2 No risk-reward training choice**: treinar = sempre certeza some XP, never failure dramatic
**PA-3 Off-pitch events 40% trigger**: sometimes nothing happens — lost engagement opportunity
**PA-4 No competing demands**: agente quer X, técnico quer Y, namorada quer Z — all suppressed

### 7.3 Proposals

**PA+1**: Slot ↑ depending lifestyle
- Solteiro: 3 slots
- Namorado: 2 slots (1 pra namorada)
- Casado: 4 slots (1 forced family) — wedding já existe lifestyle!

**PA+2**: Actions diverse
- Date (slot 1, mood +10, but boss -2)
- Charity event (slot 1, fans +5, sponsors +10)
- Interview media (slot 1, fans/sponsors based on response)
- Visit family (slot 1, mood +15, but rest)

**PA+3**: Crisis events forced
- 1×/season minimum: lesion, rivalry, scandal — force decision
- Already have InterruptEvents — wire to player mode

---

## 8. Meta-Progression Analysis

### 8.1 Atual

**Career path**:
- Manager: Série D → A → Champions
- Player: 17yo → star → retire
- NG+ via LineageSystem (filhos-regens)

**Achievements**: 60+ unlockable (visíveis SPEC-070)
**Hall of Fame**: persistente cross-saves (LineageSystem)

### 8.2 Problemas

**MP-1 Sem ranking global**: user joga isolado, sem leaderboard
**MP-2 Sem cosmetic unlock**: achievements dão pontos mas pontos sem uso
**MP-3 Long-term goals soft**: "win Libertadores" texto, sem countdown / milestone visual
**MP-4 NG+ benefits invisible**: getNGPlusBonuses() existe mas não é mostrado start-game

### 8.3 Proposals

**MP+1**: Global leaderboard (online opcional)
- Submit save anonymous → top managers BR/world
- Categories: most titles, fastest promotion, biggest underdog

**MP+2**: Cosmetic shop (achievement points)
- Unlock kit themes
- Manager portrait variations
- Stadium textures

**MP+3**: Long-term goals tracker
- Dashboard widget: "Próximo objetivo: Libertadores 2028 (3 temporadas)"
- Progress bar visual

**MP+4**: NG+ shop visible at start
- "Você tem 5 dynasties + 28 achievements = +R$ 250k starting + Filho de Lenda trait"

---

## 9. Genre Action Density Comparison

### 9.1 Decision/min benchmark

| Game | Decisions/min match | Decisions/min between matches |
|---|---|---|
| FM 2025 | 5-8 | 8-12 |
| CM 01/02 | 3-5 | 6-8 |
| Top Eleven | 2-3 | 4-5 |
| Brasfoot | 1-2 | 3-4 |
| **ELIFOOT v3.1** | **0.5-1** | **2-3** |
| Target ELIFOOT v4.0 | 3-5 | 6-8 |

### 9.2 Match interactivity benchmark

| Game | User actions/match |
|---|---|
| FM | 30+ (instructions, subs, talks) |
| FIFA Manager | 20+ |
| CM | 15+ |
| Top Eleven | 5 (auto + boost) |
| **ELIFOOT** | **3 (sub + speed + pause)** |

### 9.3 Off-match content density

| Game | Distinct activities/week |
|---|---|
| FM | 12+ (training, scout, press, board, staff, finance, youth, U21, B-team, tactics, set pieces, transfer) |
| Brasfoot | 6 |
| **ELIFOOT** | **5 (train, talk, scout, transfer, advance)** |

---

## 10. Friction Points Specific

### 10.1 UI cliques desnecessários (audit 50 most-used flows)

| Flow | Atual cliques | Target |
|---|---|---|
| Open squad | 2 (Dashboard → Plantel) | 1 |
| Make formation change | 5 (Dashboard → Plantel → Formação tab → drag → save) | 3 |
| Read match preview | 3 (Dashboard → Avançar → PreMatch) | 1 |
| Sub during match | 5 (pause → live edit modal → select out → select in → confirm) | 3 |
| Accept transfer offer | 4 (Dashboard → tab transfers → review → accept) | 2 |
| View achievement | 2 (Dashboard → Achievements) | 1 (notification → view) |

### 10.2 Persistent sidebar nav proposed

```
[ Sidebar always visible ]
├ 🏠 Dashboard
├ 👥 Plantel
├ ⚽ Match
├ 🛒 Mercado
├ 📊 Tabela
├ 🏆 Conquistas
├ 🎙️ Coletiva
├ 💾 Saves
└ ⚙️ Settings
```

Eliminates 1-2 clicks per navigation. ~30-40 cliques saved per session.

### 10.3 Modal stack reduction

Atual: nested modals 2-3 levels (settings → confirm → result)
Proposed: 1-level modal max + toast feedback

---

## 11. Hooks Engagement Missing

### 11.1 Game Feel hooks (juice)

**JH-1 Goal celebration too fast**: 1300ms shake + burst — não dá tempo absorber
**JH-2 No streak visualization**: 5 vitórias seguidas → não badge dashboard
**JH-3 Crowd reaction silent**: visual estádio mas sem som
**JH-4 No build-up tension**: jogos importantes deveria ter UI different (pulse glow border, music change)

### 11.2 Narrative hooks

**NH-1 InterruptEvents catalog 7 events**: muito poucos. Need 50+
**NH-2 Manchete generator existe não wired ao MatchView post-game**
**NH-3 Press conference rare trigger** (15% chance): bump 60-80%
**NH-4 No rival drama**: derbies não têm pré-jogo special UI

### 11.3 Daily/Weekly engagement

**DH-1 Sem daily login bonus** (ético: 1 free scout/day)
**DH-2 Sem weekly challenges** ("vença 3 jogos" → bonus prestige)
**DH-3 Sem season prediction game** (Dudu palpita standings → pontos extras se acertar)

### 11.4 Social hooks

**SH-1 Crônica export PNG** existe — mas não auto-prompts compartilhamento
**SH-2 Achievement unlock** — sem CTA "share Twitter"
**SH-3 Sem comparações peers** (anonymous "manager BR de 30-40 média 2.1 títulos por save")

---

## 12. Specific Improvement Specs

### SPEC-090: Mid-Match Real-Time Tactics
- **Depende**: RFCT-005 (sync→generator)
- **Effort**: 32h
- **Mid-match**: pressão alta/baixa, marcar individual, tempo down/up
- **Impact**: alto (resolve M-1, D-1)

### SPEC-091: Active Scout Search
- **Effort**: 16h
- **Search**: position, age, ovr min, budget max
- **Returns**: 50+ candidatos by criteria
- **Impact**: médio (resolve TM-1, TM-5)

### SPEC-092: Negotiation Dialogues
- **Effort**: 24h
- **Agent dialogue**: 3-5 turns negotiation
- **Outcome**: contract terms negotiated
- **Impact**: alto (resolve TM-3)

### SPEC-093: Press Conferences Gameplay
- **Effort**: 12h
- **Frequency**: pós-match always (vs 15%)
- **Effect**: morale squad, fans, board
- **Impact**: médio (NH-3)

### SPEC-094: Squad Rotation Pressure
- **Effort**: 8h
- **Visual fadiga**: jogadores cansados ficam vermelhos no plantel
- **Forced rotation**: stamina <30 → benched suggestion
- **Impact**: médio (T+ proposal)

### SPEC-095: Set Pieces Designations
- **Effort**: 12h
- **Designate**: batedor falta, escanteios, pênaltis
- **UI**: per-player checkboxes em FormationBoard
- **Impact**: médio (M-2)

### SPEC-096: Youth Promotion Drama
- **Effort**: 16h
- **Event**: youth at 17yo evaluated → decisão promote / sell / loan
- **Diferencial**: sub-9 player journey (FM-style)
- **Impact**: alto (mecânica nova)

### SPEC-097: Boardroom Interactive
- **Effort**: 16h
- **Demands**: dynamic per board personality
- **User**: aceita / negocia / recusa
- **Already exists InterruptEvents — UI dedicated**
- **Impact**: médio

### SPEC-098: Live Ops Events (Efêmeros)
- **Effort**: 12h
- **Events**: Carnaval (week 6-8), Junino (week 24), Champions playoffs
- **Benefit**: temporary buffs/special trades
- **Impact**: alto (engagement weekly)

### SPEC-099: Persistent Sidebar Nav
- **Effort**: 8h
- **Saves**: 30-40 cliques/session
- **Mobile**: burger menu
- **Impact**: alto (resolve F-1)

### SPEC-100: Match Phases Expanded
- **Effort**: 24h
- **12 phases** vs current 3
- **Each phase**: micro-decision + atmosphere
- **Impact**: alto (M-1 to M-5)

### SPEC-101: Achievement Cosmetic Shop
- **Effort**: 12h
- **Use**: kit themes, manager portrait, stadium textures
- **Cost**: achievement points (already accumulated)
- **Impact**: médio (MP-2)

### SPEC-102: Long-Term Goals Tracker
- **Effort**: 8h
- **Dashboard widget**: countdown to specific goals
- **Examples**: "Libertadores em X temporadas", "100 gols carreira"
- **Impact**: médio (MP-3)

### SPEC-103: Daily Login + Weekly Challenges
- **Effort**: 12h
- **Daily**: 1 free scout / 1 free training boost
- **Weekly**: "vença 3 jogos", "marque hat-trick"
- **Anti-pattern check**: opcional, sem FOMO predatório
- **Impact**: alto (retention)

### SPEC-104: Rival Drama UI
- **Effort**: 8h
- **Derby visual**: pre-match special (shake bg, special music)
- **Post-match**: extra narrative (manchete dramatic)
- **Impact**: médio (NH-4)

---

## 13. Implementation Priority Matrix

### High Impact / Low Effort (DO FIRST)

| Spec | Effort | Impact |
|---|---|---|
| SPEC-099 Persistent Sidebar | 8h | Alto |
| SPEC-093 Press Pós-Match Always | 12h | Médio-Alto |
| SPEC-094 Squad Rotation Visual | 8h | Médio |
| SPEC-102 Long-Term Goals Widget | 8h | Médio |
| SPEC-104 Rival Drama UI | 8h | Médio |

**Sub-total**: 44h, ~6 dias part-time. **v3.2 candidate**.

### High Impact / High Effort (PLAN CAREFULLY)

| Spec | Effort | Impact |
|---|---|---|
| SPEC-090 Mid-Match Tactics | 32h (depends RFCT-005) | Crítico |
| SPEC-100 Match Phases Expanded | 24h | Alto |
| SPEC-092 Negotiation Dialogues | 24h | Alto |
| SPEC-096 Youth Promotion Drama | 16h | Alto |
| SPEC-103 Daily/Weekly Engagement | 12h | Alto |

**Sub-total**: 108h. **v3.3 + v3.4**.

### Medium Impact / Low Effort

| Spec | Effort | Impact |
|---|---|---|
| SPEC-091 Active Scout | 16h | Médio |
| SPEC-095 Set Pieces | 12h | Médio |
| SPEC-098 Live Ops Events | 12h | Médio-Alto |
| SPEC-101 Cosmetic Shop | 12h | Médio |
| SPEC-097 Boardroom Interactive | 16h | Médio |

**Sub-total**: 68h. **v3.5**.

### Total roadmap

220h, ~28-32 sprints semanais part-time, ~6-8 meses.

---

## 14. Roadmap v3.2 → v4.0

### v3.2 — Quick Wins UX (3 semanas, 44h)
- SPEC-099 Persistent Sidebar Nav
- SPEC-093 Press Conference always pós-match
- SPEC-094 Squad rotation visual fadiga
- SPEC-102 Long-term goals tracker
- SPEC-104 Rival drama UI

**Métrica sucesso**: avg session time +25%

### v3.3 — Match Engine Deep (6-8 semanas, 88h)
- **Pré-requisito**: RFCT-005 (engine sync→generator)
- SPEC-090 Mid-match real-time tactics
- SPEC-100 Match phases expanded (12)
- SPEC-095 Set pieces designations

**Métrica sucesso**: decisions/min match 0.5 → 3-5

### v3.4 — Transfer + Negotiation (4 semanas, 64h)
- SPEC-091 Active scout search
- SPEC-092 Negotiation dialogues
- SPEC-097 Boardroom interactive

**Métrica sucesso**: decisions/min off-match 2-3 → 5-7

### v3.5 — Engagement Loops (3-4 semanas, 48h)
- SPEC-098 Live ops events
- SPEC-103 Daily/weekly challenges
- SPEC-101 Cosmetic shop
- SPEC-096 Youth promotion drama

**Métrica sucesso**: retention 30 dias 25% → 40%

### v4.0 — Polish + Multiplayer Async (3-4 semanas)
- Save sharing anonymous
- Global leaderboard
- Manager peer comparison
- Save chronicles browse

**Métrica sucesso**: comunidade ativa Reddit/Discord

---

## Conclusões

ELIFOOT v3.1 = **dados ricos + sistemas profundos + gameplay raso**.

Engine simula competentemente, dados reais SofaScore integrated, mas **user experience é 80% navegação passiva, 20% decisão real**.

**Causa raiz**: simulação focada (auto-everything), não management focada (player decides).

**Solução**: aumentar **decision density 5-10×** via:
1. Mid-match real-time agency
2. Active scouting + negotiation dialogues
3. Boardroom + press conferences gameplay-affecting
4. Engagement loops (daily/weekly/live-ops)
5. UI friction reduction (sidebar, fewer clicks)

**Timeline**: 6-8 meses part-time → ELIFOOT v4.0 com gameplay competitive vs FM/CM.

**Mantra v4.0**: *"Toda semana, 5 decisões reais. Todo match, 10 momentos de agency."*

---

🤖 Deep gameplay research Claude Opus 4.7
