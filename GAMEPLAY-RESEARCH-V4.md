# ELIFOOT — Gameplay Research V4 (Pós v3.5)

**Data**: 2026-05-09
**Estado**: Pós v3.2-v3.5 mass-shipped (PR #68)
**Foco**: Próxima fronteira gameplay — mid-match agency + economy depth + multiplayer async

---

## TL;DR

ELIFOOT pós-v3.5 = **decision density 0.8 → 2.5/min** (3× boost). Mas ainda **gap fatal**: match passivity. RFCT-005 (engine sync→generator) bloqueia SPEC-090 (mid-match real-time). Sem isso, gameplay continua "watch + 1 sub".

**3 frentes prioritárias v4.0**:
1. **RFCT-005 engine refactor** (sync → generator) — desbloqueia mid-match
2. **Economy depth** — multi-currency, investments dinâmicos, agente pessoal
3. **Multiplayer async leve** — leaderboards + chronicle browse comunidade

12 novos specs identificados. Roadmap ~140h.

---

## Índice

1. [Estado Pós v3.5](#1-estado-pos-v35)
2. [Match Engine: O Bloqueio](#2-match-engine-bloqueio)
3. [Economy Depth Gap](#3-economy-depth-gap)
4. [Multiplayer Async Leve](#4-multiplayer-async)
5. [Player Career Mode Gaps](#5-player-career-gaps)
6. [Manager Career Gaps](#6-manager-career-gaps)
7. [Genre Innovation Opportunities](#7-genre-innovation)
8. [Specs Novos (12)](#8-specs-novos)
9. [Roadmap v4.0](#9-roadmap-v40)
10. [Métricas Sucesso](#10-metricas-sucesso)

---

## 1. Estado Pós v3.5

### 1.1 Decision density medida

```
Antes (v3.1):
- Match: 0.5-1/min
- Off-match: 2-3/min

Agora (v3.5):
- Match: 0.5-1/min  ❌ NÃO MUDOU (sem RFCT-005)
- Off-match: 4-6/min ✅ +2-3 (challenges + scout + cosmetics)
```

**Avanço médio**: +60% off-match, 0% match.

### 1.2 User feedback projetado (a confirmar)

Hypotheses:
- **Sidebar**: drasticamente reduz fricção navegação
- **Live Ops banner**: cria sensação "vivo" weekly
- **Challenges widget**: dá micro-objetivos
- **Cosmetic shop**: motivo coletar achievements
- **Long-term goals**: orienta sessão, reduz "what now?" drop-off

### 1.3 Friction restante

- **Match passivity** (sem mid-match) — CRÍTICO
- **Scout sem UI** (Service só, falta SquadView search tab)
- **Cosmetic equip não muda visual no jogo** (cosmetic-only mas precisa wire)
- **Press conferences ainda raras** (15% trigger não corrigido — apenas botão pós-match adicionado)

---

## 2. Match Engine: O Bloqueio

### 2.1 Diagnóstico técnico

```javascript
// Atual:
playMatch(home, away) {
  // Simulate 90 minutes synchronously
  // Returns full events array
  const events = [];
  for (let min = 1; min <= 90; min++) {
    if (chance) events.push({...});
  }
  return events; // user só vê depois animado
}

// Necessário:
async function* playMatchGenerator(home, away) {
  for (let min = 1; min <= 90; min++) {
    yield await processMinute(home, away, min);
    // YIELD permite user inserir tactical instructions
  }
}
```

**RFCT-005 effort**: 32-40h. Critical path.

### 2.2 SPEC-090 Mid-Match Tactics (depende RFCT-005)

7 instructions já especificadas (MatchInstructions.js exists):
- pressure_high / pressure_low
- long_ball / short_pass
- mark_individual
- time_down / time_up

**Próximo passo**: RFCT-005 + wire applyInstruction() to live match generator.

### 2.3 SPEC-100 Match Phases 12

```
arrival → warmup → kickoff → 1st_half →
halftime → 2nd_half_start → critical_moment →
goal_celebration → injury_break → final_minutes →
fulltime → press_conference
```

Each phase = trigger pra UI shift + decision opportunity.

---

## 3. Economy Depth Gap

### 3.1 Atual

- 1 currency (R$)
- Sinks: wages, transfers, stadium, academy upgrades
- Faucets: sponsor, match revenue, transfers, prize money

**Problema**: late-game (3+ saves) money excess R$100M+ idle.

### 3.2 Proposals SPEC-105..107

**SPEC-105 Multi-Currency**:
- R$ Reais (atual)
- ⭐ Prestige Points (já existe parcial)
- 🤝 Reputation (board+fans+media)
- 💎 Influence Tokens (NG+ carryover)

**SPEC-106 Investment System**:
- Comprar % outros clubes (passive income)
- Patrocinar ONG / time amador (PR boost)
- Investimento academia regional (long-term scout buff)
- Stocks (random walk + insider events)

**SPEC-107 Inflation Modeling**:
- Salaries +10%/year
- Market prices +8%/year
- Prize money +5%/year
- Forces strategy adapt long saves

---

## 4. Multiplayer Async Leve

### 4.1 Modelo proposto

**Não real-time**. Async leaderboards + chronicle browse.

### 4.2 SPEC-108 Leaderboards Global

- Submit save anonymous
- Categories:
  - Most titles in 10 saves
  - Fastest Série D → A promotion
  - Biggest underdog champion
  - Highest career goals (player mode)

**Tech**: Firebase / Supabase free tier. ~5h setup.

### 4.3 SPEC-109 Chronicle Browse Community

- Users export chronicle PNG (já existe)
- Upload to community feed
- Browse stories of others' saves
- "Top stories of week" featured

### 4.4 SPEC-110 Manager Peer Comparison

- Anonymous "manager BR de 30-40 média 2.1 títulos por save"
- Compare your stats vs cohort
- Percentile rankings

---

## 5. Player Career Mode Gaps

### 5.1 Atual

- 16 sub-attrs + 4 base skills
- 5 traits compráveis
- Lifestyle 10 items
- Off-pitch events 80 catalog (40% trigger rate)
- Stress + relationships
- 3 actionSlots/week

### 5.2 Gaps

**PG-1 Sem agente personal** (SPEC-064 AgentContracts existe não wired ao player mode)
**PG-2 Sem family/relacionamento** (apenas wedding lifestyle, sem children)
**PG-3 Sem off-season camp** (off-pitch events exist mas não training intensivo)
**PG-4 Sem milestones career** (1000th match, 200th goal — sem cerimônia)

### 5.3 Proposals

**SPEC-111 Personal Agent (Player Mode)**:
- Hire agente (existing AgentContracts)
- Negotiate next contract via dialogue
- Agent finds opportunities (transfer offers from other clubs)

**SPEC-112 Family System**:
- Children after wedding (lifestyle wedding existing)
- Family events (parent illness, child birthday)
- Family loyalty modifier (don't transfer countries)

**SPEC-113 Career Milestones**:
- 100/500/1000 matches
- 50/100/300 goals
- Cerimônias com banner + manchete + chronicle entry

---

## 6. Manager Career Gaps

### 6.1 Gaps

**MG-1 Sem coaching badges** (real life: Pro License, UEFA A/B)
**MG-2 Sem TV pundit role** (post-retirement como FM)
**MG-3 Sem assistant manager promotion path** (start as assistant, learn ropes)
**MG-4 Sem reputation per region** (BR vs Europa vs SAm)

### 6.2 Proposals

**SPEC-114 Coaching Badges**:
- 4 levels: Iniciante / Intermediário / Avançado / Pro License
- Required for top clubs
- Earned via courses (off-season activity) or experience

**SPEC-115 Regional Reputation**:
- Reputation per zone (BR-N/BR-S/Europa/SAm)
- Affects offer rates from each region
- Affects player attraction (BR rep → BR players join easier)

---

## 7. Genre Innovation Opportunities

### 7.1 Crusader Kings × Football double-down

**Already differentiation**: narrative-first
**Expand**: dynastic gameplay
- Marry into football family (rival club president's daughter)
- Pass club to son/daughter (player mode → manager mode → child manager)
- Relationships matter long-term

### 7.2 Brazilian football specifics

**Unique angles untapped**:
- Carnaval rivalry (clubs aligned com escolas de samba)
- Religious affinity (clubes têm padroeiros)
- Federação política (CBF intrigues)
- Empresário polêmico (corruption events)

### 7.3 Roguelike elements

**Optional run-based mode**:
- 3-season fixed window
- Random clube starting (Série D)
- Win conditions specific
- Score-based (achievements per run)
- Permadeath (failed save = restart)

Cult appeal. Niche but engaged audience.

---

## 8. Specs Novos (12)

| SPEC | Nome | Effort | Sprint |
|---|---|---|---|
| RFCT-005 | Engine sync→generator | 32h | Critical (v4.0) |
| 090 | Mid-match tactics (depends RFCT-005) | 16h | v4.0 |
| 100 | Match phases 12 (depends RFCT-005) | 24h | v4.0 |
| 105 | Multi-currency | 12h | v4.1 |
| 106 | Investment system | 16h | v4.1 |
| 107 | Inflation modeling | 8h | v4.1 |
| 108 | Leaderboards async | 12h | v4.2 |
| 109 | Chronicle browse community | 16h | v4.2 |
| 110 | Manager peer comparison | 8h | v4.2 |
| 111 | Personal agent player mode | 16h | v4.3 |
| 112 | Family system | 16h | v4.3 |
| 113 | Career milestones | 12h | v4.3 |
| 114 | Coaching badges | 12h | v4.4 |
| 115 | Regional reputation | 16h | v4.4 |

**Total**: 216h, ~7-8 meses part-time.

---

## 9. Roadmap v4.0

### v4.0 — Match Engine Revolution (8 semanas, 72h)
- RFCT-005 engine generator
- SPEC-090 Mid-match tactics
- SPEC-100 Match phases 12

**Métrica**: decisions/min match 0.5 → 3-5

### v4.1 — Economy Deep (4 semanas, 36h)
- SPEC-105 Multi-currency
- SPEC-106 Investment
- SPEC-107 Inflation

**Métrica**: late-game engagement +50%

### v4.2 — Multiplayer Async (3-4 semanas, 36h)
- SPEC-108 Leaderboards
- SPEC-109 Chronicle browse
- SPEC-110 Peer comparison

**Métrica**: D60 retention +15%

### v4.3 — Player Career Deep (4 semanas, 44h)
- SPEC-111 Personal agent
- SPEC-112 Family
- SPEC-113 Milestones

**Métrica**: player mode session time +30%

### v4.4 — Manager Career Deep (3-4 semanas, 28h)
- SPEC-114 Coaching badges
- SPEC-115 Regional reputation

**Métrica**: career arc memorability

---

## 10. Métricas Sucesso

### Quantitative

- **D7 retention**: 35% → 50%
- **D30 retention**: 10% → 25%
- **Avg session**: 12min → 25min
- **Decisions/min**: 2.5 → 5
- **Achievement unlock rate**: 40% → 60%

### Qualitative

- ✅ User comments "best BR football manager"
- ✅ Top 5 r/footballmanagergames mention
- ✅ Reddit r/futebol BR organic posts/week
- ✅ Twitter chronicle PNG shares >100/week
- ✅ Community Discord >500 members

---

## Conclusão

ELIFOOT v3.5 = **gameplay decent, depth crescente**.

v4.0 = **gameplay excellent, depth genre-leading**.

Pré-requisito crítico: **RFCT-005**. Sem refactor engine, mid-match agency impossível, gameplay capped.

Decisão estratégica: investir 32-40h refactor antes features novas. ROI massivo (desbloqueia 2 specs alto-impacto + abre toda nova frente).

Tag line v4.0: *"Toda decisão importa. Todo segundo, agency."*

🤖 Deep research v4 Claude Opus 4.7
