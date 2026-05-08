# ELIFOOT — Game Design Deep Research V2 (Aprofundamento)

**Data**: 2026-05-08
**Estado**: Companion to GAME-DESIGN-RESEARCH.md v1.0
**Escopo**: Análise sistemática profunda — psicologia, narrativa, economia, progressão, cultura, juice
**Volume**: 12 seções, ~1500 linhas pesquisa

---

## Índice

1. [Player Psychology + Persona Segmentation](#1-player-psychology--persona-segmentation)
2. [Narrative System Architecture (storylets, chains, branching)](#2-narrative-system-architecture)
3. [Match Engine Math + Tactical Formulas](#3-match-engine-math--tactical-formulas)
4. [Economic Systems Balance (faucets/sinks)](#4-economic-systems-balance)
5. [Progression Theory (mastery, prestige, achievement design)](#5-progression-theory)
6. [Brazilian Cultural Depth Catalog](#6-brazilian-cultural-depth-catalog)
7. [Competitor Feature Matrix Detailed](#7-competitor-feature-matrix)
8. [Monetization Cosmetic-Only (Hattrick model)](#8-monetization-cosmetic-only)
9. [Accessibility + Localization + Modding](#9-accessibility--localization--modding)
10. [Multiplayer Async (sem realtime)](#10-multiplayer-async)
11. [Game Feel / Juice Principles](#11-game-feel--juice-principles)
12. [Technical Debt Map + Critical Path](#12-technical-debt-map)

---

## 1. Player Psychology + Persona Segmentation

### 1.1 Macro psychology football managers

Genre = "armchair manager". Core fantasy: **"sou eu que decido"**. Power fantasy + omniscience + control.

**Tipos compulsão-driver primários** (Bartle taxonomy adapted):

- **Achiever (35%)**: quer trofeús, conquistas, rankings. Métrica: # achievements unlocked.
- **Explorer (25%)**: quer descobrir mecânicas, regens raros, táticas off-meta. Métrica: tempo em scout/wiki.
- **Socializer (15%)**: quer compartilhar saves, brag em forums. Métrica: chronicle exports, screenshots.
- **Killer (10%)**: quer destruir AI máxima dificuldade, beat records. Métrica: hard mode adoption.
- **Storyteller (15%, NOVO emergente)**: quer narrativa pessoal, RP. Crusader Kings demographic. Métrica: tempo player mode + chronicle reads.

**Insight**: ELIFOOT v2.0 atende Achiever+Explorer ok, **falha Storyteller** (CK demographic — diferencial proposed).

### 1.2 Personas brasileiras específicas (ELIFOOT target)

#### Persona 1: "O Saudosista" (40%)
- 30-44 anos, masc, classe média
- Jogou Elifoot 98, Brasfoot 2000, CM 01-02 na adolescência
- Quer reviver sensação **sem nostalgia barata** (i.e., não pagar pra ter "como antigamente")
- Trigger compra: pixel-art autêntico SNES + simulação BR profunda
- Tolera complexidade alta (jogou CM 01-02)
- **Desconfia**: F2P/microtransações (ferramenta detrair)
- ELIFOOT atende: ✅ tema SNES, ✅ texto-driven, ⚠️ profundidade BR ainda rasa

#### Persona 2: "O Tático Frustrado FM" (25%)
- 25-40 anos, masc/fem, hardcore
- Joga FM mas frustrado: 3D mediocre, complexidade UX terrível, BR data desatualizada
- Quer simulação **tática profunda** sem 3D ruim
- Compraria FM se tivesse modo texto puro CM-style
- **Desconfia**: jogos "casuais demais", arcade
- ELIFOOT atende: ⚠️ profundidade tática rasa (6 tactics, 8 formations) — **gap maior**

#### Persona 3: "O Storyteller CK3" (15%)
- 25-40 anos, masc/fem, narrative gamer
- Joga Crusader Kings, RimWorld, Dwarf Fortress
- Quer **stories emergentes**, drama, RP
- Compraria FM Touch player career mas acha shallow
- ELIFOOT atende: ✅ stress system + relationships (CK3 inspirado), ⚠️ events density baixa

#### Persona 4: "O Casual Mobile BR" (15%)
- 18-35 anos, joga 5-15min/sessão metrô/almoço
- Brasfoot mobile veterano
- Quer loop curto **sem perder progresso save**
- Não quer aprender 50 mecânicas
- ELIFOOT atende: ⚠️ web responsive WIP, ✅ sessão curta possível

#### Persona 5: "O Coletor Achievement" (5%)
- 20-40 anos, achievement hunter
- Quer 100% conquistas
- Joga 100+ horas
- ELIFOOT atende: ⚠️ AchievementsSystem existe mas sem UI

### 1.3 Player journey por persona (sessão típica)

#### Saudosista (30-90 min PC weekend)
```
Login → carregou save antigo → ver semana atual
   → checa standings (orgulho posição)
   → toma decisão tática (mexe formation)
   → assiste match com narração textual (saudosismo)
   → fim match → checa estatísticas (immersion)
   → avança 2-3 semanas pra próxima desafio
   → SAVE + sair
```
**Pain points atuais**: estatísticas rasas, narração repetitiva, sem manchetes Globo-style.

#### Tático Frustrado FM (60-180 min noite)
```
Login → checa training reports
   → analisa scout (procura perlas)
   → ajusta táticas profundas (perdido — só 6 opções)
   → frustrate → fecha jogo
```
**Pain points atuais**: 6 tactics insuficiente, sem mid-match instructions, sem set pieces.

#### Storyteller CK3 (45-120 min)
```
Login → modo player → checa relationships
   → toma decisão off-pitch event
   → match → vê banner conquista (motm/hattrick)
   → exporta chronicle PNG → posta Twitter
   → SAVE
```
**Pain points atuais**: events 80 only, sem chains, sem genealogy depth ainda.

### 1.4 Retention curve sem intervenção (estimado)

```
Day 1: 100% (start save)
Day 3: 60% (first season ongoing)
Day 7: 35% (competitor match — loop monotony hits)
Day 14: 20% (drop-off — sem long-term goal claro)
Day 30: 10% (apenas Saudosistas + Achievers persist)
Day 90: <5%
```

**Diagnóstico**: cliff D7 = primeira temporada acabando. User pergunta "what now?" Sem resposta, drop.

**Fix**: meta-narrative explícita ("conquiste 5 Libertadores") + interrupt events density semanal.

### 1.5 Engagement Skinner-box (ético)

Football managers já usam variable reinforcement (random match outcomes). ELIFOOT pode adicionar **eticamente**:

- **Daily check-in** opcional: "novo dia, 1 evento off-pitch + manchete radialista" (FOMO leve)
- **Weekly challenges**: "vença 3 jogos seguidos = bonus prestige" (achiever)
- **Lottery draws éticas**: scouting reveal jogador raro 1/30 chance (explorer)

**Anti-padrões a evitar** (predatórios):
- ❌ Pay-to-skip wait
- ❌ Energy systems forçados
- ❌ Loot boxes
- ❌ Push notifications agressivos
- ❌ Save corruption FOMO

---

## 2. Narrative System Architecture

### 2.1 Stack proposed (5 layers — roadmap existente expandido)

```
Layer 5: MITO (saga eterna)
   ↑ persiste cross-save / cross-career
Layer 4: NARRATIVA (manchetes, crônica)
   ↑ derivada eventos
Layer 3: RELACIONAL (modificadores persistentes)
   ↑ ex-clube ama, rival odeia
Layer 2: EVENTUAL (eventos atômicos)
   ↑ 50+ tipos, decay
Layer 1: AGENTE (atributos, posição, contrato)
   ↑ base estado
```

### 2.2 Camada 2: Eventos atômicos — schema deep

Atualmente `OffPitchEventsDeck` = 80 eventos hardcoded. **Inadequado escala**.

**Schema proposto** (SPEC-068 Interrupt Events):

```javascript
{
  id: "EV_RIVAL_WINS_FINAL",
  type: "rivalry_clash",         // 1 of 15 types fixed vocab
  tags: ["rivalry", "loss", "trauma", "boss_pressure"],  // 1-4 tags
  trigger: {
    week: "any",
    conditions: [
      { fact: "team.lostFinal", operator: "eq", value: true },
      { fact: "rival.wonFinal", operator: "eq", value: true }
    ]
  },
  weight: 1.0,                   // base spawn probability
  decay: { halflife: 26, floor: 0.1 },  // 6 months halflife, 10% floor
  text: "{rivalName} venceu {trophyName} contra você. Torcida está {moodLevel}.",
  options: [
    { label: "Pedir desculpas torcida", effect: { fans: -5, dignity: +3 } },
    { label: "Provocar rival públicamente", effect: { rivalrySev: +20, fans: +3 } },
    { label: "Não comentar", effect: { boss: +2, fans: -2 } }
  ],
  flags: { set: ["humiliated"], clear: [] },
  chains: ["EV_REDEMPTION_ARC", "EV_BOARD_QUESTIONS_FUTURE"]
}
```

### 2.3 Storylets (narrative atômico Inkle-style)

Cada storylet = mini-history 2-5 eventos encadeados.

**Exemplo — "A Crise do Camisa 10"**:
```
1. EV_STAR_INJURED (lesão grave craque)
   → opções: forçar return, respeitar, contratar substituto
2. EV_BOARD_PRESSURES (sem star, ranking cai)
   → opções: investir mercado, rebaixar pretensão, demitir-se
3. EV_FAN_PROTEST (torcida furiosa)
   → opções: enfrentar, pedir paciência, prometer reforço
4. EV_REDEMPTION (star volta, gol decisivo)
   → outcome: hero arc completo, +legacy
   OR EV_FORCED_SALE (crise financeira)
   → outcome: tragic arc, -prestige
```

**Implementação**: chains array em events + flag system + state machine (Inkle ink-script inspired).

### 2.4 Camada 5: Mito persistente

Hall of Fame slots (6 categorias):
- **Ídolo Eterno** — top scorer all-time
- **Carrasco** — gols decisivos contra rival
- **Goleirão** — goalkeeper clean sheets record
- **Cria da Base** — youth promovido, virou star
- **Traidor** — saiu pro rival
- **Lenda Trágica** — morreu/aposentou cedo

**Manchetes hand-written** (necessárias):
- Mínimo 6 (1 por slot) — em roadmap v1.1
- **Recomendado**: 30+ (5 variants per slot) pra evitar repetição

### 2.5 Procedural news system deep

Atualmente `NewsSystem.js` simples. Expandir para **manchete generator**:

```javascript
const HEADLINE_TEMPLATES = {
  hattrick: [
    "{playerName} ESPETACULAR! HAT-TRICK NO {stadium}!",
    "{playerName} faz 3 e {teamName} goleia",
    "TRINCA HISTÓRICA: {playerName} arranca aplausos da torcida",
    // ... 5+ variants per template
  ],
  injury: [
    "{playerName} sai chorando: lesão grave",
    "Departamento médico em alerta: {playerName} fora por {weeks} semanas",
    // ...
  ],
  // 30+ template categories
};

function generateHeadline(category, vars) {
  const templates = HEADLINE_TEMPLATES[category];
  const tpl = templates[Math.floor(Math.random() * templates.length)];
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] || k);
}
```

**Gírias contextuais**: cada template gancho gírias regionais:
```javascript
const SLANG_BY_CONTEXT = {
  goalsCrucial: ["arrebenta", "manda bala", "mete bronca", "põe pra correr"],
  losing: ["leva fugada", "toma sufoco", "passa apuros"],
  // ...
};
```

### 2.6 Crônica do Save (player-facing narrative)

Atualmente `ChronicleService` exporta texto puro PNG/JSON. Expandir:

**Sections proposed**:
1. **Capa**: clube + temporada + record
2. **Highlight Reel**: 5 eventos top da temporada
3. **Player of Season**: best player + stats
4. **Match of Season**: melhor partida (drama/score)
5. **Tactical Evolution**: como tactic mudou
6. **Hero Arc**: jogador que mais cresceu
7. **Crisis Recovery**: bug picada/superada
8. **Looking Ahead**: previsão next season

**Tom narrativo**: estilo Globo Esporte (dramático, frases curtas, emoções).

---

## 3. Match Engine Math + Tactical Formulas

### 3.1 Current state engine

`engine.js:541` `playMatch(homeId, awayId, isCup)` delegates to MatchSimulator (RFCT-004 extracted).

**Current formula simplified**:
```
homeAttack = sum(home.squad.attrs.atk) × tactic.ataModifier × homeAdvantage(1.1)
awayAttack = sum(away.squad.attrs.atk) × tactic.ataModifier
homeGoals = poisson(homeAttack / awayDefense × 1.5)
awayGoals = poisson(awayAttack / homeDefense × 1.5)
```

**Limitations**:
- Sum atributos ignora **synergias** (specific player chemistry)
- Tactic modifier flat (não interage com formation)
- Sem **fatigue** dinâmica (fitness affects mid-game)
- Sem **morale curve** (winning early boosts, losing early demoralizes)

### 3.2 Proposed deeper formula (SPEC-067)

**Sector-based combat model** (FM/CM inspired):

```
Sectors: GK, DEF, MID, ATK (4 zones)

Each sector strength = sum(players in sector × position_fit_mult × form_mult × fitness)

Match flow:
  for each minute (1-90):
    momentum = currentScore_diff × 0.1 + recent_chances × 0.05
    chance = generateChance(home, away, momentum)
    if chance:
      attacker_sector = chance.sector
      defender_sector = opponent.zoneOf(chance.sector)
      roll = (atk_sector_str × tactic_mod) - (def_sector_str × def_mod) + random(-15, +15)
      if roll > threshold(40):
        goal!
        scorer = pick weighted by player.attrs.scoring
        morale[scorer.team] += 5
        morale[opp.team] -= 3
```

**Add Hidden attributes** (CM 01-02 famous):
- `pressure` (0-20): clutch performance big matches
- `bigMatch` (0-20): boost finals/derbies
- `loyalty` (0-20): less likely transfer
- `consistency` (0-20): less variance week-to-week
- `important_matches` (0-20): boost finais
- `injury_proneness` (0-20): chance of injury

### 3.3 Tactical familiarity meter

FM concept — players need time to learn new tactic.

```
Each player has familiarity[tacticId] = 0-100
Switch tactic mid-season: -50 familiarity all
Train tactic: +5/week
Play tactic match: +3/match

Performance penalty when familiarity < 70: -10% effectiveness
Bonus when > 90: +5%
```

**Effect**: discourages tactic-spam (changing every match), rewards commitment.

### 3.4 Set pieces system (currently absent)

**Categories**:
- Free kicks direct (long-range shooter)
- Free kicks indirect (cross specialist)
- Corners (target man + delivery)
- Penalties (designated taker order)
- Throw-ins long (especialista)

**SPEC-073 proposed**: Set Piece Editor + dedicated takers per situation.

### 3.5 Match instructions mid-game

**Current**: only sub. Proposed:

| Instruction | Effect | Timing |
|---|---|---|
| Pressão alta | +10% atk pressure, -5 fitness/10min | Anytime |
| Pressão baixa | -5% atk, +5 fitness | Anytime |
| Bola longa | +chance long shots, -precisão | Anytime |
| Posse curta | +precisão, -tempo |  Anytime |
| Marcação individual (top1 enemy) | -50% target's effectiveness, +10% foul risk | Anytime |
| Tempo down | +fitness, -goals expected | Last 15 min |
| Tempo up | -fitness, +goals expected | Last 15 min |
| Trocar lateral por atacante | +ofensiva, -defesa | Goal needed |

### 3.6 Weather system effects (existe parcial)

**Current**: WeatherSystem.js has weather state. Não afeta match.

**Proposed integration**:
```
Sun: baseline
Rain: +15% injury chance, -10% precisão, +ball control rewards
Heavy Rain: +25% injury, -20% precisão, slow paced (less goals)
Cold: -5 fitness/match, advantage local team (acclimated)
Hot: -10 fitness/match
Wind: -15% long shots accuracy
```

---

## 4. Economic Systems Balance

### 4.1 Current faucets (revenue) — manager mode

| Source | Frequency | Range R$ |
|---|---|---|
| Sponsor weekly | 1/week | 50k-500k |
| Match revenue (home) | ~1/2 weeks | 100k-2M |
| Transfer sales | Variable | 100k-50M |
| Prize money | End season | 1M-50M (Brasileirão) |
| Cup prize | End cup | 500k-20M |

### 4.2 Current sinks (spending) — manager mode

| Sink | Frequency | Range R$ |
|---|---|---|
| Player wages | Weekly | 10k-500k each |
| Staff wages | Weekly | 5k-50k each |
| Transfer purchases | Variable | 100k-100M |
| Stadium upgrade | Rare | 1M-50M |
| Academy upgrade | Rare | 1M-30M |

### 4.3 Balance issues identified

**Issue 4.3.1 — Late game money excess**
After ~3 seasons winning, manager has R$ 100M+ idle. Nothing to spend on (já upgrade tudo, salary cap baixo BR).

**Fix proposal**:
- **SPEC-074 Investment System**:
  - Comprar % outros clubes (passive income)
  - Patrocinar ONG / time amador (PR boost, fans loyalty)
  - Investimento academia regional (long-term scout buff)
  - Marketing campaign (boost prestige rate)

**Issue 4.3.2 — Early game cash flow problem**
First season Série D/C, balance can go negative if injuries + low gate.

**Fix**: starting loan system + small business sponsors.

**Issue 4.3.3 — Player mode money inutilizável**
Current sinks: energy drink R$ 100, traits R$ 1500-3000. Wage 500-50000/week.
After 5 seasons, player has R$ 2M+ idle.

**Fix proposed (SPEC-065 Lifestyle)**:
| Item | Cost | Effect |
|---|---|---|
| Apartamento Tier 1 | R$ 50k | +5 mood weekly |
| Casa Tier 2 | R$ 200k | +10 mood, +1 actionSlot |
| Mansão Tier 3 | R$ 1M | +15 mood, +2 actionSlot, fans +5 |
| Carro popular | R$ 30k | +2 mood |
| Carro luxo | R$ 200k | +5 mood, +sponsors interest |
| Carro super | R$ 2M | +10 mood, sponsors +20 |
| Festa privada | R$ 10k | +5 mood, -5 fitness next week |
| Caridade ONG | R$ 50k | +10 fans, +5 boss approval |
| Investimento ações | R$ 100k+ | passive income (5-15%/year) |
| Casamento/wedding | R$ 500k | +20 mood +10 stability, -agente cut |

### 4.4 Multi-currency proposed

**Current**: 1 currency (R$). Simples mas raso.

**Proposed (SPEC-075)**:
- **R$ Reais** — money currency
- **Prestige Points** — ganha ranking/trophies, gasta em fame events
- **Reputation** — ranking community/board, gasta em board demands negotiate
- **Fan Loyalty** — torcida lealdade, gasta em request favores (lower expectations)

**Anti-spam**: 1-2 só. 4 currencies = bloat. Iniciar com 2 (R$ + Prestige), expandir só se needed.

### 4.5 Inflation modeling

Real life: salários BR cresceram 8-12%/year 2010-2025.

**SPEC-076 Inflation**:
```
Each year:
  baseSalaryMult *= 1.10  // 10% inflation
  marketPrices *= 1.08    // 8% market
  sponsorRates *= 1.06    // 6% sponsor
  prizeMoneyMult *= 1.05  // 5% prize
```

Forces user to adapt strategy long saves.

---

## 5. Progression Theory

### 5.1 3 progression axes

ELIFOOT precisa progressão em 3 eixos paralelos:

**Axis 1 — Player skill/manager career (vertical)**
- Manager: started Série D → ascend to Série A → Champions winner
- Player: started 17yo → become star → captain → retire as legend

**Axis 2 — Mastery (horizontal)**
- Aprender 50 mecânicas
- Unlock advanced features (only after X actions)
- Tutorial gradual reveal

**Axis 3 — Legacy/meta (cross-save)**
- Hall of Fame persists
- Achievements bank cross-saves
- Prestige cosmetics (kits/badges) earn-able

### 5.2 Achievement design (tiered)

**Bronze (50 achievements)**: easy, first session reachable
- "Win first match"
- "Train 10x"
- "Sign first player"

**Silver (30)**: mid-game milestones
- "Win Brasileirão Série A"
- "Manage 5 different clubs"
- "Achieve 50% win rate"

**Gold (15)**: long-term goals
- "Win Libertadores"
- "Coach Seleção BR"
- "100+ goals scored same season"

**Platinum (5)**: prestige tier
- "All-time top scorer (500+ goals)"
- "Win Champions League with BR club"
- "Train youngster from 16 → 90 attribute"

**Hidden (10)**: easter eggs
- "Find Tsigalko-clone regen"
- "Lose 10-0"
- "Manage same club 20 seasons"

### 5.3 Mastery curve

```
Hour 0-2: Tutorial, basics
Hour 2-10: One season, basic tactics
Hour 10-30: Multiple seasons, depth tactical
Hour 30-100: Master scouting, transfers, narrative arcs
Hour 100+: Legacy / NG+ / collector
```

**Goal**: **never run out of new mechanics**. Drip-feed:
- Tutorial = 5 systems
- After season 1 unlock advanced tactic builder
- After season 3 unlock youth international scouting
- After season 5 unlock Champions League management
- After save 2 unlock NG+ bonuses

### 5.4 Player skill development curve (proposed)

Current: linear 0-99 each skill, +1 per week train.

**Proposed exponential**:
```
levels 1-50: 100 XP each (cheap)
levels 51-70: 200 XP each (moderate)
levels 71-85: 400 XP each (expensive)
levels 86-95: 800 XP each (very expensive)
levels 96-99: 2000 XP each (legendary)
```

Forces specialization (can't max all). Strategic choice.

### 5.5 Manager prestige tiers

```
Rookie (0-50 prestige): Série D opportunities only
Promising (51-100): Série C/D
Established (101-200): Série B/C
Veteran (201-400): Série A/B
Legendary (401+): Top clubs + Champions
```

**Prestige earned**:
- +5 win league
- +10 win cup
- +20 win Libertadores
- +50 win Champions
- -10 relegation
- -20 fired

---

## 6. Brazilian Cultural Depth Catalog

### 6.1 Estaduais BR (calendário real)

| Estadual | Estados | Period | # Clubs | Importance |
|---|---|---|---|---|
| **Paulistão** | SP | jan-abril | 16 (Série A1) | Crítico (Cor, Pal, San, SP) |
| **Carioca** | RJ | jan-abril | 12 | Crítico (Fla, Flu, Vas, Bot) |
| **Mineiro** | MG | jan-abril | 12 | Importante (Atl, Cru) |
| **Gaúcho** | RS | jan-abril | 16 | Importante (Gre, Int) |
| **Baiano** | BA | jan-abril | 10 | Médio (Bah, Vit) |
| **Pernambucano** | PE | jan-abril | 10 | Médio (Sport, Sta. Cruz, Náutico) |
| **Cearense** | CE | jan-abril | 10 | Médio (Ceará, Fortaleza) |
| **Paranaense** | PR | jan-abril | 12 | Médio (Atl-PR, Cor-PR) |

**SPEC-061 escopo mínimo**: 4 grandes (Paulistão, Carioca, Mineiro, Gaúcho).

### 6.2 Rivalidades clássicas (catalogar)

**Estaduais**:
- Choque-Rei (SP × Pal) — desde 1933
- Derby Paulista (Cor × Pal) — desde 1917
- San-São (San × SP)
- Fla-Flu (Fla × Flu) — clássico raiz
- Clássico dos Milhões (Fla × Vas)
- Atletiba (Atl-PR × Cor-PR)
- Grenal (Gre × Int) — RS
- Ba-Vi (Bah × Vit) — BA

**Nacionais**:
- Cor × Fla (paixão recente)
- Atl-MG × Cru (Min)
- Pal × San (Paulistas vs Litoral)

**Internacionais**:
- Brasileiros vs Argentinos (Libertadores)

### 6.3 Gírias regionais (catalogar)

**Paulista**:
- "Bola na rede" (gol)
- "Toma!" (gol marcado)
- "Tirar onda"
- "Jogada manjada"

**Carioca**:
- "Que isso, irmão!"
- "Maracanazinho"
- "Tá ligado?"
- "Mermão"

**Gaúcho**:
- "Tchê"
- "Bah"
- "Capaz" (ironia)
- "Que bagual"

**Nordestino**:
- "Vixe!"
- "Mainha" (mãe)
- "Painho" (pai)
- "Arrochar" (forçar)

**Mineiro**:
- "Sô"
- "Trem" (coisa)
- "Uai"
- "Cuidado, sô!"

### 6.4 Tipos jogador BR estereótipos (catalogar)

| Tipo | Característica | Buff/Debuff |
|---|---|---|
| **Pé Quente** | Acerta gols decisivos | +20% gol em finais |
| **Camisa 10** | Líder, criativo | +moral squad, +visão |
| **Carrasco** | Faz gol contra rival | +30% gol vs rival |
| **Cria da Base** | Loyalty alta, sub-9 do clube | -50% chance transfer |
| **Maestro** | Toca, distribui | +visão, +precision passe |
| **Pipoqueiro** | Falha em jogos importantes | -20% em finais |
| **Beque de Fazenda** | Defensor brutal, sem técnica | +fisico, -técnica |
| **Caneleiro** | Joga rough | +cards, +intimidação |
| **Cordeirinho** | Gentil, sem garra | -intimidação, -cards |
| **Cavalo Paraguaio** | Começa bem, cai prod | -form curve descending |
| **Talismã** | Sorte do clube | random buff team |
| **Açougueiro** | Faltas constantes | +10 cards/season |
| **Pé-de-Pato** | Atira longe potente | +long shot accuracy |
| **Sanguinário** | Ódio rival visível | +20% perf vs rival |
| **Showman** | Joga pra plateia | +fans, -boss |

### 6.5 Manchete templates Globo Esporte style

**Tom radialista virtual**:
- Frases curtas (5-12 palavras)
- Caps lock dramático
- Emoji visual key
- Mention clube + jogador sempre

**Templates exemplo**:
```
"⚽ TOMA QUE O FILHO É TEU! {playerName} MARCA NO {minute}!"
"💥 EXPLODE! {playerName} ARREBENTA O ARQUEIRO!"
"😱 INACREDITÁVEL! {playerName} PERDE GOL FEITO!"
"🚀 É VOO! {playerName} VOA ALTO E MARCA!"
"🥅 GOLEIRÃO! {gkName} PEGA TUDO!"
"⚖️ JUIZ MARRENTO! {refName} EXPULSA INJUSTAMENTE!"
"🏆 CAMPEÃO! {teamName} MATA DE {scoreboard}!"
"📉 VEXAME! {teamName} PERDE EM CASA POR {scoreboard}"
```

### 6.6 Sounds vinhetas (≤4s cada)

**Tipos**:
- Apito início ⏱️
- Apito gol 🥅
- Apito final 🏁
- Crowd cheer 📣
- Crowd boo 👎
- Drum samba 🥁 (vibe BR)
- Pause/menu UI 🔘

**Source**: pode usar packs creative commons ou Globo Esporte pack saudoso (IP risk).

### 6.7 Easter eggs IP-safe

- **"Cufu"** (referência Cafu) — abstract version
- **"Romarin"** (Romário)
- **"Pálêz"** (Pelé) — disfarçado
- **"Zequinha"** (Zico)
- **"Garranchão"** (Garrincha)

**Regra IP-safe**: alteração ≥2 chars + clube genérico + nacionalidade alterada.

### 6.8 Calendário cultural BR

**Eventos pontuais (week-specific)**:
- Carnaval (week 6-8): -10% training quality (todos viajam)
- Páscoa (variable): +10 morale
- Junino (week 24): +5 fans Northeast
- Natal/Ano Novo (week 50-52): pause winter, prep

**Affects gameplay**: Carnaval week realism, no major decisions.

---

## 7. Competitor Feature Matrix Detailed

### 7.1 Full feature matrix (50+ features)

| Feature | FM 2025 | CM 01/02 | Brasfoot 2022 | Top Eleven | ELIFOOT v2.0 | ELIFOOT target v3.0 |
|---|---|---|---|---|---|---|
| Match engine 3D | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ (no compete) |
| Match engine 2D | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Match engine text | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ ★ |
| Player attributes count | 36 | 36 | 8 | 5 | 4 | 16 |
| Hidden attributes | 6 | 6 | 0 | 0 | 0 | 6 |
| Tactics count | 30+ | 12 | 6 | 6 | 6 | 12 |
| Formations count | 20+ | 8 | 6 | 6 | 8 | 12 |
| Set pieces editor | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ basic |
| Live match instructions | ✅ | ⚠️ | ❌ | ✅ | ❌ | ✅ |
| Live substitutions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Press conferences | ✅ | ✅ | ❌ | ❌ | ⚠️ | ✅ |
| News module | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ ★ |
| Scouting reports | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Youth academy | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Stadium upgrades | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Staff hire (8 roles) | ✅ | ⚠️ 4 | ⚠️ | ❌ | ⚠️ 4 | ✅ 8 |
| Contracts complex | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Agents | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| National team | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ✅ |
| Champions League | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Brazilian estaduais | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ ★ |
| Player career mode | ⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ ★ |
| RPG depth player | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| Stress / mental | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Off-pitch events | ❌ | ❌ | ❌ | ❌ | ⚠️ 80 | ✅ 200+ |
| Lifestyle | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ★ |
| Procedural news | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ✅ ★ |
| Manchete generator | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ★ |
| Slang regional | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | ✅ ★ |
| Hall of Fame | ⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Chronicle export | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ ★ |
| Social media share | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ |
| NG+ / lineage | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ ★ |
| Mobile | ⚠️ Touch | ❌ | ✅ | ✅ | ⚠️ | ✅ |
| Web cross-platform | ❌ | ❌ | ⚠️ | ✅ | ✅ | ✅ |
| Open source | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ ★ |
| Pay-to-win | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Ad-free | ✅ | ✅ | ⚠️ | ❌ | ✅ | ✅ |
| Modding | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ⚠️ planned |
| Multiplayer | ✅ | ❌ | ❌ | ✅ async | ❌ | ⚠️ async planned |
| Tutorial | ⚠️ | ⚠️ | ⚠️ | ✅ | ❌ | ✅ |
| Difficulty modes | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ |

★ = diferencial competitivo único ELIFOOT

### 7.2 Diferenciais consolidados v3.0

```
ELIFOOT v3.0 = "FM moderno + CM 01-02 saudosismo + CK3 narrative + Brasfoot cultural"

5 USPs (Unique Selling Points):
1. Player career mode com profundidade RPG (FM tem mas raso)
2. Estaduais BR completos (FM não tem)
3. Manchete generator radialista BR (ninguém tem)
4. Crônica export PNG (ninguém tem)
5. Hall of Fame + lineage genealogy (ninguém tem)
```

---

## 8. Monetization Cosmetic-Only

### 8.1 Princípios

**Compromissos**:
- ❌ Pay-to-win
- ❌ Energy systems
- ❌ Loot boxes
- ❌ Pay-to-skip
- ✅ Cosmetic only
- ✅ One-time purchases preferred
- ✅ Subscription opcional

### 8.2 Modelo Hattrick (referência)

Hattrick = manager game online ativo desde 1997. Modelo:
- Free básico jogar
- "Supporter" R$ 9,90-14,90/mês opcional
- Benefits: histórico estatísticas detalhadas, custom logo, manager ratings, preferences extra

### 8.3 ELIFOOT proposed (long-term)

**Tier Free** (sempre):
- Save unlimited
- All gameplay features
- All clubs
- All achievements
- Ad-free

**Tier Supporter** (R$ 9,90/mês opcional):
- Custom kit editor (cores próprias)
- Custom badge editor
- Extra save slots (10 vs 3)
- Statistical archive cross-saves
- Cosmetic UI themes (extra além modern/8bit/32bit)
- Manager portrait customization
- Stadium texture variations (cosmetic, no gameplay impact)

**One-time purchases**:
- "Founder Pack" R$ 49,90: cosmetic kit pack + name in credits
- "Supporter Forever" R$ 199,90: lifetime supporter benefits

**Anti-pattern avoided**:
- Não vende clubs
- Não vende players
- Não vende stadium upgrades
- Não vende achievement
- Não vende save slots > 5 (gerar feeling exclusion)

### 8.4 Revenue projeção (conservadora)

```
Year 1: 1k users
  - 5% supporter (50 × R$120/year) = R$ 6k
  - 2% founder pack (20 × R$50) = R$ 1k
  - Total: R$ 7k/year

Year 2: 10k users
  - 8% supporter (800 × R$120) = R$ 96k
  - 3% founder (300 × R$50) = R$ 15k
  - Total: R$ 111k/year

Year 3: 50k users
  - 10% supporter (5k × R$120) = R$ 600k
  - 5% one-time (2.5k × R$80 avg) = R$ 200k
  - Total: R$ 800k/year
```

**Sustenta**: 1 dev FT BR + assets + servers.

---

## 9. Accessibility + Localization + Modding

### 9.1 Accessibility (WCAG 2.1 AA mínimo)

**Color contrast**:
- Atual: Pacaembu palette OK pra contrast (#FFD700 on #0F1A14 = 12.5:1 — passa AAA)
- ✅ Manter

**Colorblind**:
- Adicionar option modo: Deuteranopia, Protanopia, Tritanopia simulação
- Substitutions:
  - red→orange (cards)
  - green→blue (success)
  - patterns + icons (não só cor)

**Screen reader**:
- ARIA labels todos botões — atual parcial
- `aria-live="polite"` para narração match
- `role="dialog"` modais — atual EfBanner ✓
- Skip links navigation

**Keyboard navigation**:
- Tab order lógico
- Enter = primary action
- Escape = cancel/close
- Atalhos: 1-9 = quick actions

**Motor accessibility**:
- Click areas ≥44px (Apple HIG)
- No timing-based puzzles (já não tem)
- No rapid input required

### 9.2 Localization

**Atual**: pt-BR único.

**Languages priorizados**:
1. **pt-PT** (Portugal) — 5% audiência potencial
2. **es** (Argentina, Uruguai) — Sul-Americana audience
3. **en** (global indie audience)
4. **fr** (France — football fans)

**Implementação**:
- i18n library (i18next)
- 4 namespaces: ui, events, headlines, descriptions
- Crowdin workflow community translations

### 9.3 Modding / UGC

**Squad editor** (built-in — exporting/importing JSON):
- Atual: parcial (chronicle export)
- Expandir: import custom squads (CSV/JSON)

**Kit editor**:
- Cosmetic + canonical
- Free version: 5 templates × cores
- Supporter: full custom

**League editor**:
- Custom leagues (regional, fictional)
- Difficulty AI

**Database mods**:
- Custom player databases
- Community shares via discord/forum
- Save-file format estável (SAVE_VERSION schema)

### 9.4 Steam Workshop / community hub

**Long-term option**:
- Steam release as separate distribution
- Workshop integration mods
- Achievements/trading cards

**Não prioritário** v3.0 — pós v3.0 consideration.

---

## 10. Multiplayer Async

### 10.1 Princípios

**Não real-time**: ELIFOOT é manager turn-based. Realtime = scope explosion.

**Async multiplayer**: 2-4 managers compartilham save/league.

### 10.2 Modelos possíveis

#### Modelo 1: Shared League (Hattrick-inspired)
- 8-16 managers numa league fictícia
- Cada um maneja 1 club
- Calendar shared, advanceWeek sync (todos terminem ações antes)
- Match engine simula match-ups

**Pros**: alta engagement, social
**Cons**: requer servidor, sync logic complex

#### Modelo 2: Ghost Match (assíncrono fácil)
- Player A joga save offline
- Pode "challenge" save Player B (export/import)
- Match runs tactic A vs tactic B
- Result returned

**Pros**: trivial implementação
**Cons**: low engagement, gimmick

#### Modelo 3: Leaderboards / Hall of Fame Global
- Achievements anonymous shared
- Top managers globalRanking
- Save chronicles browse community

**Pros**: muito leve servidor (read-mostly)
**Cons**: low retention boost

### 10.3 Recomendação

**Não fazer multiplayer v3.0**.

**Por quê**: requer infra (servers, accounts, anti-cheat), distrai foco diferencial narrativo, não core competency.

**Considerar v3.5+**: Modelo 3 (Leaderboards) primeiro como leve add-on.

---

## 11. Game Feel / Juice Principles

### 11.1 Juice = micro-feedbacks que tornam jogo "vivo"

**Conceito**: Jonasson "Juice It Or Lose It" GDC talk. Pequenos polish detalhes geram percepção quality alta.

### 11.2 Audio juice (atual + proposed)

**Atual**:
- ⚠️ Limited sounds (sfx.click, sfx.goal, sfx.success — basic)

**Proposed**:
- Click button: 60ms tick mecânico
- Hover button: 20ms whoosh
- Goal: 800ms crowd roar + whistle
- Foul: 100ms whistle short
- Card yellow: 80ms paper rustle
- Card red: 200ms slam
- Modal open: 60ms swoosh
- Save: 200ms ding success
- Load: 1500ms loading hum (looped)
- Match start: 2000ms whistle long

**Total**: 12 sounds, ~3KB cada = 36KB audio bank.

### 11.3 Visual juice (atual + proposed)

**Atual** (v2.0):
- ✅ ef-anim-shake on goal
- ✅ ef-anim-pop-in modals
- ✅ ef-anim-pulse-glow important badges
- ✅ ef-anim-counter score change
- ✅ EfBanner full-screen narrative
- ✅ Sprite frame animations (ball-roll, goal-burst, spinner, trophy)

**Proposed additions**:
- Particle burst on goal (CSS particles, 200ms)
- Camera shake screen (subtle, 100ms)
- Confetti rain fim championship (3s)
- Color flash danger (red overlay 100ms when crisis)
- Slow-motion replay key moment (CSS scale + slow narration text)
- Number rise +1 floating XP gained
- Health bar fill animation
- Stadium light glow night matches

### 11.4 UI feedback juice

- Click ripple effect (Material Design like)
- Button press depress 1px
- Hover: lift 1px + glow shadow
- Scroll smooth with momentum
- Tab transition slide 200ms
- Tooltip fade-in 150ms
- Tooltip arrow pointer

### 11.5 Match juice (specific)

Each event in match deserves micro-feedback:
- Goal: shake + burst + counter + sound + banner option (hattrick/cleanSheet)
- Save (gk-anim Sprint 3 ✓): GK sprite flash
- Foul: card overlay + sound short
- Sub: slide-down log entry + chip animation
- Tactic change: instructor icon flash
- Yellow card 2nd: red card + dramatic sound

### 11.6 Idle juice

When user inactive 30s+:
- Background subtle parallax (e.g., stadium lights flicker)
- Cursor pulse hint (where to click next)
- Background music continues but slightly different mood

### 11.7 Anti-juice (avoid)

- ❌ Excessive screen shake (motion sickness)
- ❌ Overlapping animations (cluttered)
- ❌ Long loading screens >2s without progress bar
- ❌ Mandatory cutscenes (player wants control)
- ❌ Sound spam (multiple overlapping)

---

## 12. Technical Debt Map + Critical Path

### 12.1 Dependency graph

```
SPEC-061 (Estaduais) — independent
SPEC-065 (Lifestyle) — independent
SPEC-070 (Achievements UI) — independent
SPEC-072 (Tutorial) — depends UI estabilizada
SPEC-068 (Interrupt Events) — depends NarrativeService extracted
SPEC-067 (Mid-Match Tactics) — depends RFCT-005 (sync→generator)
SPEC-062 (Skill 16 attrs) — depends save migration plan
SPEC-066 (Player Agent) — independent
SPEC-063 (Staff Depth) — independent
SPEC-064 (Contracts Deep) — depends ContractSystem refactor
SPEC-069 (Press Hub) — depends NarrativeService
SPEC-071 (Scout Dossier) — depends StatisticsSystem expansion
```

### 12.2 Critical path

```
RFCT-005 (Engine sync→generator)
   ↓
RFCT-006 (NarrativeService extract)
   ↓
SPEC-068 (Interrupts) + SPEC-069 (Press) + SPEC-067 (Mid-match)
   ↓
v2.3 release (deep narrative + agency)
```

**Bloqueador maior**: RFCT-005. Sem isso, mid-match tactics impossível.

### 12.3 Save migration risks

Each SAVE_VERSION bump = potential BUG-021 styled regression.

**Migration strategy**:
- Each spec spec-driven defines explicit migration function
- Save schema version table maintained
- Rollback test + forward test in spec harness
- Akita Mandamento: no spec without migration plan if save-affecting

**Current SAVE_VERSION**: 5 (post v1.1 myth layer)
**Projected v3.0**: SAVE_VERSION 12 (after estaduais, skills 16, lifestyle, agent, etc)

### 12.4 Testing infrastructure expansion

Atual: 1045 tests (vitest), 56 test files.

**Proposed expansion v3.0**:
- Performance benchmarks (advanceWeek <50ms target)
- Visual regression (Playwright screenshot diffs)
- Integration tests (full save → 5 seasons → assert state)
- Property-based tests (fast-check) for engine determinism
- Accessibility tests (axe-core jest)

**Target**: 2000+ tests v3.0.

### 12.5 Performance budget

Current build: 530KB JS / 63KB CSS.

**Budget v3.0**:
- JS ≤800KB (gzip ≤250KB) — under industry threshold
- CSS ≤100KB
- Initial load ≤3s on 3G
- Time-to-interactive ≤4s
- 60fps animations (no jank)

**Optimization paths**:
- Code splitting by route (PlayerMatch lazy load)
- Tree shake unused (audit imports)
- Image optimization (sprites WebP fallback)
- Service Worker offline play

---

## Conclusões

### Resumo geral

ELIFOOT v2.0 = **engine sólido, game design 5/10**.

Para chegar a **8-9/10**, executar:

**Curto prazo (v2.1, 3-4 sem)**:
- Lifestyle System (FB-2 deep)
- AchievementsView UI
- Tutorial onboarding

**Médio prazo (v2.2-v2.4, 3-4 meses)**:
- Estaduais BR (cultural diferencial)
- Press Hub + Procedural news (narrative density)
- Skill granularity expansion (16 attrs)
- Mid-match tactics (agency)
- Interrupt events (retention)

**Longo prazo (v3.0, 6-7 meses total)**:
- Agent + Contracts deep
- Staff depth + Scout dossier
- NG+ + Lineage (post-roadmap-v1.4)
- Mobile responsive
- Brazilian cultural polish (gírias, manchetes, sounds)

### Diferencial competitivo final

**ELIFOOT v3.0** = único jogo do mundo combinando:
1. ✅ Profundidade tática FM-style
2. ✅ Saudosismo CM 01-02 (texto-driven, DB BR)
3. ✅ Player career RPG depth (NBA 2K MyCareer-inspired)
4. ✅ Narrative density Crusader Kings-inspired
5. ✅ Cultural BR genuíno (estaduais, gírias regionais, manchetes Globo)
6. ✅ Open source + spec-driven + ad-free + cosmetic-only

**Tag line**: *"O FM brasileiro que CK3 fez se apaixonar"*

### Próxima ação

Aprovar GAME-DESIGN-DEEP-V2.md como blueprint v3.0 + iniciar **SPEC-065 Lifestyle System** (Sprint A) imediatamente.

---

**Documento vivo, revisão trimestral.**
**Companion**: GAME-DESIGN-RESEARCH.md (high-level v1.0)
**Total volume**: 2 docs, ~2100 linhas pesquisa profunda

🤖 Generated with deep-research-v2 analysis Claude Opus 4.7
