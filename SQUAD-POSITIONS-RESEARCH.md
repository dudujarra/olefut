# OléFUT — Squad + Positions Deep Research

**Data**: 2026-05-08
**Escopo**: Position taxonomy completa BR + FIFA + FM, attributes per-position, formation mapping, SofaScore data integration strategy
**Volume**: 12 seções, ~1500 linhas

---

## TL;DR

OléFUT atual usa **4 macro-posições** (GOL/DEF/MEI/ATA) — inadequado pra simulação séria. Pesquisa propõe **18 posições granulares** (BR Portuguese terminology + FIFA codes) + **5 atributos pentagon** SofaScore-style + integração API SofaScore real (170 clubes × ~30 jogadores reais).

**Diferencial v3.5**: cada jogador real BR puxado SofaScore com pentagon stats reais (Attacking/Technical/Tactical/Defending/Creativity 0-100) + posição detalhada (não 4 categorias, **18 posições**) + altura/peso/pé preferido/valor mercado.

**Esforço estimado**: 3-4 sprints (~40h).

---

## Índice

1. [Position Taxonomy Completa (18)](#1-position-taxonomy-completa)
2. [Brazilian Portuguese Terminology](#2-brazilian-portuguese-terminology)
3. [Attribute System — Pentagon SofaScore](#3-attribute-system--pentagon-sofascore)
4. [Position-Attribute Relevance Matrix](#4-position-attribute-relevance-matrix)
5. [Formation × Position Mapping (8+ formations)](#5-formation--position-mapping)
6. [SofaScore API Integration Strategy](#6-sofascore-api-integration-strategy)
7. [Squad Schema Deep](#7-squad-schema-deep)
8. [Data Pipeline (170 clubs scraping)](#8-data-pipeline)
9. [UI Redesign (squad view + position picker)](#9-ui-redesign)
10. [Migration Strategy (4→18 positions)](#10-migration-strategy)
11. [Rules de Encaixe (jogador fora da posição)](#11-rules-de-encaixe)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Position Taxonomy Completa

### 18 posições padronizadas OléFUT

Combina FIFA codes + BR terminology + FM-style depth.

#### Goalkeeper (1)
- **GK** — Goleiro (Goleiro)

#### Defenders (7)
- **CB** — Zagueiro Central (Zagueiro Central — sole CB)
- **CBR** — Zagueiro Direito (Right Center Back)
- **CBL** — Zagueiro Esquerdo (Left Center Back)
- **RB** — Lateral Direito (Right Back)
- **LB** — Lateral Esquerdo (Left Back)
- **RWB** — Ala Direito (Right Wing-Back, ofensivo)
- **LWB** — Ala Esquerdo (Left Wing-Back, ofensivo)

#### Midfielders (7)
- **DM** — Volante (Defensive Midfielder — "cabeça de área")
- **CM** — Meia Centro (Central Midfielder)
- **CMR** — Meia Direita (Right Central Midfielder)
- **CML** — Meia Esquerda (Left Central Midfielder)
- **AM** — Meia Atacante / Meia Armador (Attacking Midfielder / Playmaker)
- **RM** — Meia Direita avançada (Right Midfielder — wing)
- **LM** — Meia Esquerda avançada (Left Midfielder — wing)

#### Forwards (3)
- **RW** — Ponta Direita (Right Winger)
- **LW** — Ponta Esquerda (Left Winger)
- **CF** — Centroavante (Center Forward / Atacante)

### Categorização macro (compatibility)

| Macro | Posições granulares |
|---|---|
| GOL | GK |
| DEF | CB, CBR, CBL, RB, LB, RWB, LWB |
| MEI | DM, CM, CMR, CML, AM, RM, LM |
| ATA | RW, LW, CF |

**Migração save**: existing 4-position players get auto-mapped (GOL→GK, DEF→CB, MEI→CM, ATA→CF) com sub-position randomized first season.

---

## 2. Brazilian Portuguese Terminology

### Histórico (1950s-2020s)

**Era 4-2-4 (1958, Brasil campeão):**
- 4 zagueiros (lateral D + lateral E + 2 zagueiros centrais)
- 2 volantes (cabeça de área + meia volante)
- 4 atacantes (ponta D + meia D + meia E + ponta E)

**Era 4-3-3 (1970s, Tele Santana, Telê):**
- 1 volante + 2 meias (1 armador, 1 atacante)
- 3 atacantes (ponta D, centroavante, ponta E)

**Era moderna (2010s+, Pep, Tite):**
- Falso 9 (Messi-style)
- Wing-back (ala) substituindo lateral
- Trequartista (meia entre linhas)
- Inverted winger (canhoto na direita, destro na esquerda)
- Regista (volante distribuidor)

### Terminologia OléFUT escolhida

```
GOL  Goleiro
LD   Lateral Direito
LE   Lateral Esquerdo
AD   Ala Direito (wing-back D)
AE   Ala Esquerdo (wing-back E)
ZC   Zagueiro Central (3-back ou 5-back)
ZD   Zagueiro Direito (4-back direito)
ZE   Zagueiro Esquerdo (4-back esquerdo)
VOL  Volante (cabeça de área)
MC   Meia Centro
MD   Meia Direita centralizada
ME   Meia Esquerda centralizada
MA   Meia Atacante (armador)
PD   Ponta Direita
PE   Ponta Esquerda
CA   Centroavante
ATA  Atacante (geral, ponta-de-lança)
SA   Segundo Atacante
```

**18 códigos finais (uppercase, 2-3 chars)**.

### Apelidos BR populares (slang regional)

- "Beque" = qualquer zagueiro (gíria carioca)
- "Cabeça de área" = volante defensivo (carioca/paulista)
- "Maestro" = meia armador (geral)
- "Camisa 10" = meia atacante (qualquer região)
- "Ponta-de-lança" = atacante isolado, segundo atacante (paulista)
- "Beque de fazenda" = zagueiro brutal sem técnica
- "Pivô" = centroavante de área (mineirês)

---

## 3. Attribute System — Pentagon SofaScore

### Base: 5 atributos pentagon (0-100)

**Outfield players**:
1. **Attacking** — gols, movimentos terço final, finalização
2. **Technical** — controle, dribles, primeiro toque
3. **Tactical** — posicionamento, decisões off-the-ball
4. **Defending** — desarmes, interceptações, duelos
5. **Creativity** — playmaking, key passes, assistências

**Goalkeepers**:
1. **Saves** — defesas, reflexos
2. **Anticipation** — leitura de jogo
3. **Tactical** — posicionamento
4. **Ball Distribution** — saída de bola
5. **Aerial** — bolas aéreas

### Sub-atributos derivados (16 total — SPEC-062 já implementado)

Base 5 expandido pra 16 sub-atributos (4 grupos × 4):

| Grupo Pentagon | Sub-atributos |
|---|---|
| **Attacking → ATA** | finishing, off_the_ball, long_shots, heading |
| **Technical → TEC** | dribbling, passing, shooting, first_touch |
| **Tactical → TAC** | positioning, decisions, composure, leadership |
| **Defending → DEF** | tackling, marking, interceptions, blocks |
| **Creativity → CRI** | vision, key_passes, crossing, set_pieces |

Total: 5 pentagon + 20 sub = **25 atributos por jogador outfield**.

### Hidden attributes (5 — CM 01-02 inspired)

Não visíveis ao user, afetam comportamento:

1. **pressure** (0-20) — clutch performance big matches
2. **bigMatch** (0-20) — boost finals/derbies
3. **loyalty** (0-20) — chance recusar transfer
4. **consistency** (0-20) — variance week-to-week
5. **injury_proneness** (0-20) — chance lesão

---

## 4. Position-Attribute Relevance Matrix

### Cada posição tem peso 0-3 por atributo pentagon

```
                ATA  TEC  TAC  DEF  CRI    Comments
GK              0    1    3    3    0     Anticipation tactical critical
CB              0    1    3    3    1     Marking + positioning
CBR / CBL       0    1    3    3    1     Same as CB + side awareness
RB / LB         1    2    3    2    2     Cross + overlap
RWB / LWB       2    2    2    1    2     Wing attack ↑ defense ↓
DM              0    2    3    3    2     Distributor + screen
CM              1    3    3    2    2     Box-to-box
CMR / CML       1    3    3    2    2     Same + side
AM              3    3    3    0    3     Creator
RM / LM         2    2    2    2    2     Wing midfielder balanced
RW / LW         3    3    2    1    2     Pace + dribbling crucial
CF              3    2    2    0    1     Finishing supreme
ATA isolated    3    2    2    0    1     Same as CF (alternative term)
SA              3    2    2    0    2     Second striker
```

### Computação rating per-position

```javascript
function ratingForPosition(player, posCode) {
    const weights = POSITION_WEIGHTS[posCode];
    const total = (
        player.attacking * weights.ATA +
        player.technical * weights.TEC +
        player.tactical * weights.TAC +
        player.defending * weights.DEF +
        player.creativity * weights.CRI
    );
    const maxTotal = (weights.ATA + weights.TEC + weights.TAC + weights.DEF + weights.CRI) * 3 * 100 / 3;
    return Math.round(total / maxTotal * 100);
}
```

Returns rating 0-100 specific to position.

---

## 5. Formation × Position Mapping

### 8+ formations × 11 slots cada

Cada slot mapeia 1 das 18 posições. Players "fora de posição" sofrem penalty 5-30%.

#### 4-3-3 (clássica, Brasil 1970)
```
                CF
       LW             RW
              AM
       CML        CMR
              DM
   LB    CBL  CBR    RB
              GK
```
Slots: GK, RB, CBR, CBL, LB, DM, CMR, CML, AM, LW, CF, RW (12 slots? na verdade 11 com 1 escolha)
Versão simplificada 4-3-3:
GK / LB / CBL / CBR / RB / DM / CM / CM / LW / CF / RW

#### 4-4-2
GK / LB / CBL / CBR / RB / LM / CML / CMR / RM / CF / CF

#### 3-5-2
GK / CBL / CB / CBR / LWB / DM / CM / AM / RWB / CF / CF

#### 5-3-2
GK / LB / CBL / CB / CBR / RB / DM / CM / AM / CF / CF

#### 4-2-3-1 (Pep era)
GK / LB / CBL / CBR / RB / DM / DM / LW / AM / RW / CF

#### 4-1-4-1
GK / LB / CBL / CBR / RB / DM / LM / CML / CMR / RM / CF

#### 3-4-3
GK / CBL / CB / CBR / LWB / CML / CMR / RWB / LW / CF / RW

#### 5-4-1
GK / LB / CBL / CB / CBR / RB / LM / CML / CMR / RM / CF

#### 4-4-1-1 (FM standard)
GK / LB / CBL / CBR / RB / LM / CML / CMR / RM / SA / CF

### Position fit rules

```javascript
const POSITION_FAMILY = {
    GK: ['GK'],
    CB: ['CB', 'CBL', 'CBR'],
    FB: ['LB', 'RB', 'LWB', 'RWB'],  // can play either if natural
    DM: ['DM'],
    CM: ['CM', 'CML', 'CMR'],
    AM: ['AM'],
    WM: ['LM', 'RM'],  // wing midfielder family
    WG: ['LW', 'RW'],  // winger family
    FW: ['CF', 'ATA', 'SA']
};

function calculateFit(player, requiredPos) {
    if (player.naturalPos === requiredPos) return 1.0;  // 100% fit
    if (sameFamily(player.naturalPos, requiredPos)) return 0.85; // 85%
    if (adjacentFamily(player.naturalPos, requiredPos)) return 0.6; // 60%
    return 0.3; // 30% — out of position penalty
}
```

---

## 6. SofaScore API Integration Strategy

### Endpoints validados

| Endpoint | Returns | Use |
|---|---|---|
| `https://api.sofascore.com/api/v1/team/{teamId}/players` | Squad list | Initial scrape |
| `https://api.sofascore.com/api/v1/player/{playerId}` | Player metadata | Bio, market value |
| `https://api.sofascore.com/api/v1/player/{playerId}/attribute-overviews` | Pentagon stats | Attributes |

### Sample player response

```json
{
  "name": "Pedro",
  "firstName": "Pedro Guilherme",
  "position": "F",
  "positionsDetailed": ["ST"],
  "jerseyNumber": 9,
  "height": 186,
  "dateOfBirth": "1997-06-20",
  "preferredFoot": "Right",
  "country": { "name": "Brazil" },
  "proposedMarketValue": 16500000,
  "currency": "EUR",
  "id": 840219
}
```

### Sample attribute response

```json
{
  "averageAttributeOverviews": [{
    "attacking": 73,
    "technical": 57,
    "tactical": 64,
    "defending": 39,
    "creativity": 55,
    "position": "Forward",
    "yearShift": 0
  }, /* +3 historical years */]
}
```

### Rate limits + ethics

- Sem rate limit explícito documentado
- Conservative: 1 request/sec → 1700-2000 requests pra 170 clubes (~30min)
- Cache aggressive: store JSON local
- Re-scrape: 1× por mês (atributos mudam pouco)

### Mapping SofaScore → OléFUT 18 positions

```javascript
const SOFASCORE_TO_OléFUT = {
    'G':   'GK',
    // Defenders
    'D':   'CB',     // generic D → CB
    'DC':  'CB',
    'DR':  'RB',
    'DL':  'LB',
    'DMR': 'RWB',
    'DML': 'LWB',
    // Midfielders
    'M':   'CM',
    'MC':  'CM',
    'DMC': 'DM',
    'MR':  'RM',
    'ML':  'LM',
    'AMC': 'AM',
    'AMR': 'RW',     // attacking mid right ≈ winger
    'AML': 'LW',
    // Forwards
    'F':   'CF',
    'ST':  'CF',
    'LW':  'LW',
    'RW':  'RW',
    'AT':  'CF'
};
```

---

## 7. Squad Schema Deep

### Player schema (full)

```javascript
{
    // Identity
    id: number,
    sofascoreId: number,
    name: string,
    firstName: string,
    lastName: string,
    shortName: string,
    nationality: string,
    nationalityCode: string,    // BR, AR, etc
    dateOfBirth: ISO8601,
    age: number,                // computed

    // Physical
    height: number,             // cm
    weight: number,             // kg (when available)
    preferredFoot: 'Right' | 'Left' | 'Both',
    jerseyNumber: number,

    // Positions
    naturalPosition: string,    // 1 of 18 (CF, AM, etc)
    secondaryPositions: [],     // up to 3 alternates
    positionFamily: string,     // CB, FB, CM, WG, FW, etc

    // Pentagon attributes (0-100)
    attacking: number,
    technical: number,
    tactical: number,
    defending: number,
    creativity: number,

    // Sub-attributes (16) — derived from pentagon
    subAttrs: { dribbling, passing, shooting, firstTouch, ... },

    // Hidden attributes (5)
    pressure: number,           // 0-20
    bigMatch: number,
    loyalty: number,
    consistency: number,
    injuryProneness: number,

    // GK-specific
    gkAttrs: { saves, anticipation, tactical, ballDistribution, aerial } | null,

    // Game state
    energy: number,             // 0-100
    moral: number,              // 0-100
    fitness: number,            // 0-100
    form: number,               // -10 to +10 streak modifier
    isTitular: boolean,
    isInjured: boolean,
    injury: { type, weeksRemaining } | null,
    suspension: number,         // matches remaining

    // Career stats
    seasonGoals: number,
    seasonAssists: number,
    seasonAppearances: number,
    careerGoals: number,
    careerAppearances: number,

    // Contract
    contract: {
        weeklyWage: number,
        duration: number,
        weeksRemaining: number,
        signingBonus: number,
        releaseClause: number,
        agent: { id, name, personality }
    },

    // Market
    marketValue: number,        // R$ or BRL converted from EUR
    marketValueRaw: number,     // EUR original from SofaScore

    // Personality (3 archetypes ProPlayer-style)
    personality: 'maverick' | 'virtuoso' | 'heartbeat',
    traits: [],                 // unlocked traits

    // BR cultural type (15 stereotypes)
    brType: 'pe_quente' | 'carrasco' | 'maestro' | ...
}
```

---

## 8. Data Pipeline

### Estratégia: pre-bake JSON

**Não fazer**: scrape em runtime (slow, dependent on SofaScore uptime).

**Fazer**: script Node.js que:
1. Itera 170 clubes (com `sofascore_team_id` em clubColors.js)
2. Pra cada, fetch `/team/{id}/players`
3. Pra cada player, fetch `/player/{id}/attribute-overviews`
4. Mapeia position SofaScore → OléFUT 18-pos
5. Computa sub-attrs derivados
6. Salva `public/data/squads/{teamSlug}.json`

### Tamanho estimado

- 170 clubes × ~30 jogadores = 5100 jogadores
- Cada player JSON ~2KB (com pentagon + sub-attrs)
- Total: ~10MB (acceptable, lazy-load per club)

### Refresh strategy

- Pre-bake commit: 1× ao integrar
- Re-scrape: monthly via GitHub Action cron
- Manual trigger: npm run scrape-squads

### Script outline (`scripts/scrape-squads.js`)

```javascript
import { CLUBS_WITH_SOFASCORE_IDS } from '../src/data/clubsSofascore.js';

async function fetchSquad(teamId) {
    const players = await fetch(`https://api.sofascore.com/api/v1/team/${teamId}/players`).then(r => r.json());
    const enriched = await Promise.all(players.map(async (p) => {
        const attrs = await fetch(`https://api.sofascore.com/api/v1/player/${p.id}/attribute-overviews`).then(r => r.json());
        return { ...p, pentagon: attrs.averageAttributeOverviews?.[0] };
    }));
    return enriched.map(mapToOléFUTPlayer);
}

for (const club of CLUBS_WITH_SOFASCORE_IDS) {
    const squad = await fetchSquad(club.sofascoreId);
    fs.writeFileSync(`public/data/squads/${club.slug}.json`, JSON.stringify(squad));
    await sleep(1000); // rate limit polite
}
```

### SofaScore IDs lookup

Need to find sofascoreId for each of 170 clubs. Strategy:
1. Search API: `https://api.sofascore.com/api/v1/search/teams/{name}`
2. Pick first BR result match
3. Save mapping `clubsSofascore.json`
4. Manual review/corrections

---

## 9. UI Redesign

### SquadView refactor

**Atual**: tabela linear, ordenação por overall.

**Novo**:
- **Tab Plantel**: tabela completa 18 posições visíveis, color-coded by family
- **Tab Formação**: drag-drop 11 slots (FormationBoard atual mas com 18 pos)
- **Tab Stats**: comparação pentagon side-by-side
- **Tab Contratos**: gerenciar wages, durations, agents

### Player Card

```
┌─────────────────────────────────────┐
│ 🇧🇷 #9  Pedro                      │
│       186cm | ⚽ ATA / CA           │
├─────────────────────────────────────┤
│  ATK ████████░░ 73                  │
│  TEC █████░░░░░ 57                  │
│  TAC ██████░░░░ 64                  │
│  DEF ████░░░░░░ 39                  │
│  CRI █████░░░░░ 55                  │
├─────────────────────────────────────┤
│  R$ 16.5M | Wage 250k/sem           │
└─────────────────────────────────────┘
```

### Position picker modal

- Visual: campo verde + 18 posições clickable
- Click position → highlight players naturals + secondary
- Show fit % per player

---

## 10. Migration Strategy

### Save migration (SAVE_VERSION 5 → 6)

```javascript
function migrateV5toV6(save) {
    save.teams.forEach(team => {
        team.squad.forEach(player => {
            // Map old 4-position to new 18-position
            const oldPos = player.position;
            switch (oldPos) {
                case 'GOL': player.naturalPosition = 'GK'; break;
                case 'DEF':
                    // Random sub-position based on attrs
                    player.naturalPosition = pickDefenderSubPos(player);
                    break;
                case 'MEI':
                    player.naturalPosition = pickMidfielderSubPos(player);
                    break;
                case 'ATA':
                    player.naturalPosition = pickForwardSubPos(player);
                    break;
            }
            // Initialize pentagon (derived from existing attrs.atk/def/mid)
            player.attacking = player.attrs?.atk || 50;
            player.technical = (player.attrs?.atk + player.attrs?.mid) / 2;
            player.tactical = player.attrs?.def || 50;
            player.defending = player.attrs?.def || 50;
            player.creativity = player.attrs?.mid || 50;
        });
    });
    save.version = 6;
    return save;
}
```

### Backward compat

- Keep `player.position` as macro (GOL/DEF/MEI/ATA derived from naturalPosition family)
- New code uses `naturalPosition`
- UI gradual rollout (fallback mostra 4-pos antiga)

---

## 11. Rules de Encaixe

### Out-of-position penalty

Player jogando fora posição natural sofre redução effectiveness:

```
Same position: 100%
Same family (e.g., CM playing CMR): 85%
Adjacent family (e.g., CM playing AM): 60%
Distant (e.g., CB playing CF): 30%
```

### Familias adjacentes graph

```
GK → CB
CB ↔ FB ↔ DM
FB ↔ WB ↔ WM
DM ↔ CM ↔ AM
WM ↔ WG ↔ FW
AM ↔ FW ↔ WG
```

### Position learning system

Player fora posição natural pode aprender com tempo:

```
Each match in non-natural position:
  +1 familiarity[posCode] (max 100)
  if familiarity >= 80: treat as secondary natural
  if familiarity >= 95: treat as natural (can switch)
```

Forces strategic decisions: train youngster as utility OR specialist.

---

## 12. Implementation Roadmap

### Sprint Q (8h): Position taxonomy core
- `src/engine/Positions.js` — 18 positions enum + families + maps
- Migration function v5 → v6
- Update `engine.js` to support new positions
- Tests: 18 position constants verified

### Sprint R (12h): Pentagon + Sub-Attrs alignment
- `src/engine/PlayerAttributes.js` — pentagon + sub-attrs computation
- Update existing skills system (4 base) to reuse for full pentagon
- Position-attribute relevance matrix
- `ratingForPosition(player, pos)` helper

### Sprint S (16h): SofaScore data pipeline
- `scripts/scrape-squads.js` — Node.js scraper
- `scripts/find-sofascore-ids.js` — match 170 clubs to SofaScore IDs
- `public/data/squads/*.json` pre-baked
- Import service `src/services/SquadDataService.js`

### Sprint T (8h): UI refactor SquadView
- Tab system Plantel/Formação/Stats/Contratos
- Pentagon visualization (radar chart or bars)
- Position picker modal
- Player card redesign

### Sprint U (4h): Polish + tests + commit
- Regression tests
- Migration test (v5 save loaded as v6)
- Build smoke
- README update

**Total**: ~48h, 4-5 sprints

---

## Appendix A: Position codes cheat sheet

| Code | Long name | Macro | Family |
|---|---|---|---|
| GK | Goleiro | GOL | GK |
| CB | Zagueiro Central | DEF | CB |
| CBR | Zagueiro Direito | DEF | CB |
| CBL | Zagueiro Esquerdo | DEF | CB |
| RB | Lateral Direito | DEF | FB |
| LB | Lateral Esquerdo | DEF | FB |
| RWB | Ala Direito | DEF | WB |
| LWB | Ala Esquerdo | DEF | WB |
| DM | Volante | MEI | DM |
| CM | Meia Centro | MEI | CM |
| CMR | Meia Direita Centralizada | MEI | CM |
| CML | Meia Esquerda Centralizada | MEI | CM |
| AM | Meia Atacante (Armador) | MEI | AM |
| RM | Meia Direita Avançada | MEI | WM |
| LM | Meia Esquerda Avançada | MEI | WM |
| RW | Ponta Direita | ATA | WG |
| LW | Ponta Esquerda | ATA | WG |
| CF | Centroavante | ATA | FW |

---

**Documento vivo. Atualização pós Sprint U.**

🤖 Deep research Claude Opus 4.7 + SofaScore API exploration
