---
name: elifoot-game-design
description: >
  Scientific game design framework for Elifoot — a browser-based football management simulator.
  Covers match engine mathematics (Dixon-Coles, Poisson, xG), player development science
  (inverted-U aging curves, position-specific heterogeneity), game balance theory (MDA framework,
  Csikszentmihalyi flow, feedback loops), NPC AI (utility scoring, behavior trees), event deck
  probability (Fisher-Yates, shuffle bags, pity mechanics), transfer market econometrics,
  deterministic simulation (seeded PRNG), save system versioning, and procedural narrative.
  Use when modifying ANY game logic, engine, UI, or system in the Elifoot project.
---

# Elifoot Game Design — Scientific Foundation

> This skill codifies the academic and scientific principles behind every system in Elifoot.
> It is NOT a generic architecture map — it is the theoretical backbone that justifies
> every design decision in the engine.

---

## §1. Theoretical Frameworks

### 1.1 MDA Framework (Hunicke, LeBlanc, Zubek 2004)

Every feature in Elifoot must be evaluated through the MDA lens:

```
Mechanics → Dynamics → Aesthetics
(rules)     (behavior)  (emotion)
```

| Layer | Elifoot Example |
|-------|----------------|
| **Mechanic** | Player stats are integers 1-99; match uses card deck probability |
| **Dynamic** | A 90-rated striker scores more often → player feels team-building matters |
| **Aesthetic** | Sensation of "I built this team" → **Discovery**, **Challenge**, **Expression** |

**Rule**: When adding a mechanic, always trace it forward to dynamics and aesthetics.
If the aesthetic is unclear, the mechanic is unjustified.

### 1.2 Csikszentmihalyi Flow Channel

The optimal engagement zone sits between anxiety and boredom:

```
Anxiety
  ╲
   ╲  FLOW ZONE ← target
    ╲____________
                 ╲
                  Boredom
     Skill →
```

**Application in Elifoot**:
- `DifficultyModes.js` must implement **Dynamic Difficulty Adjustment (DDA)**
- Monitor player's win rate over rolling 10-match window
- If win% > 70%: increase NPC tactical intelligence, market competition
- If win% < 30%: reduce injury frequency, increase youth academy talent
- NEVER make DDA obvious — the player must feel they earned every result

### 1.3 Bartle Player Types (1996)

Elifoot serves primarily **Achievers** and **Explorers**:

| Type | Elifoot Features | Priority |
|------|-----------------|----------|
| **Achiever** | Trophies, records, long-term goals, prestige system | ⭐⭐⭐⭐⭐ |
| **Explorer** | Deep engine mechanics, hidden traits, youth scouting | ⭐⭐⭐⭐ |
| **Socializer** | Press conferences, relationships, rivalries | ⭐⭐⭐ |
| **Killer** | Direct competition (rankings, head-to-head records) | ⭐⭐ |

**Rule**: Every new feature should serve at least one Bartle type explicitly.

### 1.4 Feedback Loop Theory (Schell, Koster)

| Loop Type | Effect | Elifoot Usage |
|-----------|--------|---------------|
| **Positive** (reinforcing) | Winner gets stronger | Trophy money → better players → more trophies |
| **Negative** (balancing) | Leader gets handicapped | Salary cap pressure, player poaching, complacency |

**Critical balance**: Pure positive loops create runaway leaders.
Pure negative loops feel unfair ("rubber banding").

**Elifoot rule**: Use positive loops for **short-term** reward (match momentum, form streaks)
and negative loops for **long-term** balance (wage inflation, aging, rival investment).

---

## §2. Match Engine Science

### 2.1 Goal Probability Model: Dixon-Coles (1997)

The expected goals for home (λ) and away (μ) are:

```
λ = γ · α_home · β_away    (home team expected goals)
μ = α_away · β_home          (away team expected goals)
```

Where:
- **α** (alpha) = team attack strength (derived from player stats aggregate)
- **β** (beta) = team defense weakness (lower = stronger defense)
- **γ** (gamma) = home advantage factor (~1.3 in real football)
- **ρ** (rho) = low-score correlation adjustment (corrects for 0-0, 1-1 frequency)

**Implementation rule**: The `MatchSimulator.js` must derive λ and μ from
actual player stats, formation bonuses, and tactical modifiers —
never from arbitrary constants.

### 2.2 Expected Goals (xG) for Shot Quality

Each shot event drawn from the card deck carries an **xG value**:

```
xG = f(distance, angle, body_part, assist_type, game_state)
```

Empirical base rates from analytics:
| Situation | xG Range |
|-----------|----------|
| Penalty | 0.76 |
| 1v1 with keeper | 0.35-0.45 |
| Inside box, open play | 0.10-0.20 |
| Outside box | 0.03-0.06 |
| Header from cross | 0.06-0.12 |

**Rule**: Shot resolution in `MatchCardsATA.js` must respect xG distributions.
A player with 90 finishing raises xG by a modifier, not by a flat bonus.

### 2.3 Discrete Event Simulation (DES)

The match engine is a **Discrete Event Simulation**, not a continuous one:

```
State → Event Sampling → State Transition → Loop until t=90
```

1. **State**: possession, zone (defense/mid/attack), momentum, fatigue
2. **Event Sampling**: Draw from weighted card decks (ATK/DEF/MEI/GOL)
3. **Transition**: Event outcome modifies state (possession change, zone advance, shot)
4. **Termination**: Clock reaches 90 + stoppage time

Card weights are functions of:
- Player stats in relevant positions
- Formation tactical bonuses (`FormationLayout.js`)
- Match instructions (`MatchInstructions.js`)
- Momentum/fatigue modifiers

### 2.4 Event Deck Design (Probability Theory)

The card deck system uses **sampling without replacement** (shuffle bag pattern):

**Why decks > dice rolls**:
- Dice (independent events): Can produce 10 goals in a row — unrealistic
- Decks (dependent events): Have "memory" — guarantee distribution over N draws

**Key principles**:
1. **Fisher-Yates shuffle** for uniform randomness (never use `Array.sort(() => Math.random() - 0.5)`)
2. **Frequency-based weighting**: More copies of common events, fewer of rare events
3. **Pity mechanics**: After N consecutive negative events, guarantee a positive outcome
4. **Segmented pacing**: Split match into halves with independent deck segments
   to ensure events spread across 90 minutes

**Fairness perception** (critical for player trust):
- Humans perceive true randomness as "streaky" and unfair
- Use **pseudo-random distribution** (PRD) where cumulative probability increases
  with each failed attempt (e.g., Dota 2's critical strike system)

---

## §3. Player Development Science

### 3.1 Age-Performance Curve (Inverted U)

Academic research confirms a non-linear trajectory:

```
Performance
    ▲
    │      ╱‾‾‾‾╲
    │    ╱        ╲
    │  ╱            ╲
    │╱                ╲
    └──────────────────→ Age
    18  22  26  30  34  38
         peak zone
```

**Position-specific heterogeneity** (critical — not all players age alike):

| Position | Peak Age | Decline Onset | Reason |
|----------|----------|---------------|--------|
| Winger/Fullback | 26-27 | 30 | Physical dependency (speed, stamina) |
| Striker | 27-28 | 31 | Mix of physical + positioning |
| Centerback | 28-29 | 32 | Cognitive skills compensate |
| Goalkeeper | 29-31 | 34 | Experience + reflexes |
| Midfielder | 27-29 | 31 | Tactical intelligence offsets physical |

**Implementation in `PlayerDevelopment.js`**:
- Physical stats (speed, stamina, acceleration): decline sharply after peak
- Technical stats (passing, technique, finishing): decline slowly
- Mental stats (positioning, vision, composure): can IMPROVE past 30
- Use **polynomial regression** (not linear) for growth/decline curves
- Add **individual variance** (σ = 1-3 years around peak) — never uniform

### 3.2 Potential vs. Current Ability

```
Potential (PA) = ceiling (immutable at generation, hidden from player)
Current Ability (CA) = actual performance level
Development Rate = f(age, training, match_time, traits, randomness)
```

**Rule**: CA approaches PA asymptotically — the last 5% is hardest.
Not every player reaches their potential. This creates emergent narrative
("the wonderkid who never fulfilled his promise").

### 3.3 Trait System (Behavioral Genetics)

Traits modify behavior, not just stats:
- **Leader**: Boosts nearby teammates in high-pressure moments
- **Clutch**: Higher performance in final 15 minutes
- **Selfish**: Takes shots when passing is better (reduces xG of team but increases individual)
- **Injury-prone**: 2x injury probability modifier

**Rule**: Traits create **strategic depth** — a 75-rated player with "Clutch" + "Leader"
may be more valuable than an 80-rated player with "Selfish" + "Injury-prone".

---

## §4. Transfer Market Econometrics

### 4.1 Player Valuation Model

Based on hedonic pricing theory from sports economics:

```
Value = BaseValue × AgeFactor × ContractFactor × PerformanceFactor × MarketInflation
```

Where:
- **BaseValue** = f(CA, PA) — exponential, not linear (a 90-rated player is worth 10x a 70)
- **AgeFactor** = peaks at 25-27, drops after 30 (mirrors resale value window)
- **ContractFactor** = final year contract = 30-50% discount (fear of free transfer)
- **PerformanceFactor** = recent form modifier (rolling 10-match average)
- **MarketInflation** = increases ~3-5% per season (mirrors real market)

### 4.2 NPC Market Behavior

NPC clubs use **utility scoring** (not behavior trees) for transfers:

```
Utility(player) = w₁·PositionNeed + w₂·QualityGain + w₃·AgeFit + w₄·BudgetImpact
```

Where weights (w) vary by club archetype:
- **Big club**: High w₂ (wants quality), low w₄ (budget less important)
- **Selling club**: High w₃ (wants young), high w₄ (budget-conscious)
- **Relegation fighter**: High w₁ (desperate for position), ignores w₃

---

## §5. NPC AI Architecture

### 5.1 Decision Architecture: Utility AI

The `NPCAISystem.js` uses **Utility AI** (not FSM, not behavior trees):

| Architecture | Pros | Cons | Use in Elifoot |
|-------------|------|------|----------------|
| FSM | Simple, predictable | Rigid, combinatorial explosion | ❌ Too simple |
| Behavior Tree | Hierarchical, debuggable | Hard to balance priorities | ❌ Overkill for management |
| **Utility AI** | Flexible, emergent, tunable | Harder to debug | ✅ Best for NPC managers |

**How it works**:
1. Enumerate all possible actions (buy player X, change formation, sell player Y)
2. Score each action with a utility function
3. Pick the highest-scoring action (with small random noise for variety)

### 5.2 Tactical AI (`NpcTacticAdvisor.js`)

NPC formation selection follows a **counter-strategy matrix**:

```
NPC observes player's last 5 formations →
  If player uses 4-3-3 often → NPC favors 4-5-1 (overload midfield)
  If player uses 4-4-2 often → NPC favors 3-5-2 (wing superiority)
```

Add **noise** (±1 tactical level) to prevent NPCs from being perfectly predictable.

---

## §6. Deterministic Simulation

### 6.1 Seeded PRNG (Mulberry32)

All randomness MUST flow through a seeded PRNG:

```javascript
// Mulberry32 — fast, 32-bit, excellent distribution
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
```

**Rules**:
1. NEVER use `Math.random()` in engine code — always use seeded generator
2. Store the seed in the save file for replay capability
3. Each match gets its own seed derived from `seasonSeed + matchDay + homeId + awayId`
4. Deterministic = same seed always produces same match = testable + replayable

### 6.2 Why Not Mersenne Twister?

Mulberry32 is preferred for Elifoot because:
- 10x faster than MT19937
- 4 bytes state vs 2.5KB state
- Sufficient quality for game simulation (not cryptography)
- Perfect for browser/JS where memory and speed matter

---

## §7. Save System Science

### 7.1 Versioned Migration Pipeline (Stepping Stone Pattern)

```
SaveV1 → migrateV1toV2() → SaveV2 → migrateV2toV3() → SaveV3 → ... → Current
```

**Rules from `saveMigrations.js`**:
1. NEVER skip versions — always apply sequentially
2. Each migration is a pure function: `(oldSave) → newSave`
3. Migrations are **append-only** — never delete a migration
4. Test migrations with saves from EVERY historical version
5. Include `saveVersion` field at root of save object
6. Add integrity checksum to detect corruption
7. Backup old save before applying migration

### 7.2 Storage Strategy

- **Current**: `localStorage` (JSON.stringify) — simple but 5MB limit
- **Future consideration**: `IndexedDB` for larger saves (async, structured)
- **Critical**: Never save cyclical references — always serialize to plain objects

---

## §8. Narrative Generation

### 8.1 Emergent Narrative Theory

Elifoot uses **emergent narrative** (bottom-up) not **authored narrative** (top-down):

| Approach | Example | Elifoot |
|----------|---------|---------|
| Authored | Linear story, cutscenes | ❌ Not a story game |
| **Emergent** | Stories arise from systems interacting | ✅ "My 17-year-old scored the winner in the cup final" |

**The systems create the stories**:
- Youth academy produces a wonderkid (YouthAcademy.js)
- Player develops and peaks (PlayerDevelopment.js)
- Match engine creates dramatic moments (MatchSimulator.js)
- Chronicle records it (ChronicleService.js)
- Narrative service contextualizes it (NarrativeService.js + WebLLM)

### 8.2 Drama Manager Pattern

`NarrativeService.js` acts as a lightweight **drama manager**:
- Tracks narrative arcs (rival manager, aging legend, youth breakthrough)
- Detects dramatic potential in engine events
- Feeds context to WebLLM for natural language generation
- Never FORCES outcomes — only HIGHLIGHTS them

---

## §9. Procedural Audio

### 9.1 Tone.js Architecture

Audio follows the same event-driven model as the match engine:

```
Match Event → Audio Event Mapping → Tone.js Synthesis → Speaker
```

| Match Event | Audio Response |
|-------------|---------------|
| Goal scored | Crowd roar crescendo + whistle |
| Near miss | Crowd gasp + collective groan |
| Foul | Whistle + crowd reaction |
| Final whistle | Extended crowd + ambient fade |

**Rule**: Audio must be **reactive**, not pre-recorded loops.
Use Tone.js envelopes and filters to create dynamic crowd energy
that responds to match tension.

---

## §10. Architecture Boundaries (Implementation)

```
src/engine/          ← Pure logic. ZERO React. ZERO DOM. Framework-agnostic.
├── engine.js        ← Core orchestrator
├── systems/         ← Independent subsystems
├── tournaments/     ← League, Cup, Continental
├── decks/           ← Match event cards (ATK, DEF, MEI, GOL)
├── db/              ← Static data (brazil, europe, south_america)
└── data.js          ← Shared constants

src/services/        ← Business logic. CAN use engine. NOT React.
src/components/      ← React UI. Uses services + context. NOT engine directly.
src/context/         ← GameContext.jsx — single bridge between engine and React
src/hooks/           ← Custom hooks for components
```

**Inviolable rules**:
1. Engine files are **pure functions** — no side effects, no DOM, no React
2. Services orchestrate engine calls
3. Components NEVER import from `src/engine/`
4. All state mutations flow through `GameContext`
5. Game runs 100% offline — ZERO network dependencies

---

## §11. Testing Philosophy

| Layer | Tool | What to Test |
|-------|------|-------------|
| Unit | Vitest | Engine functions in isolation (stat calculations, probability distributions) |
| Integration | Vitest | Service → Engine interactions |
| E2E | Playwright | Full game flows (start → simulate season → verify standings) |
| Mutation | Stryker | Engine robustness (kill mutants to prove test quality) |
| Regression | Vitest | Bug-specific test cases (never delete, always accumulate) |
| Statistical | Custom | Run 10,000 match sims → verify goal distribution matches Poisson |

**Rules**:
- Use deterministic seeds for ALL simulation tests
- Test edge cases: 0-stat players, 40-year-old GK, empty squad
- Never mock the engine — test real implementations
- Statistical tests validate the math models (§2, §3, §4)

---

## §12. The Core Loop — Why You Can't Stop Playing

### 12.1 The "One More Match" Architecture

Football Manager's core loop is the most addictive in gaming because it has
**no natural stopping point**. Elifoot MUST replicate this:

```
┌──────────────────────────────────────────────────┐
│  PLAN → EXECUTE → RESULT → REACT → PLAN → ...   │
│   ↑                                          ↑   │
│   └── There is ALWAYS a next thing to do ────┘   │
└──────────────────────────────────────────────────┘
```

| Phase | Elifoot Implementation | Emotional State |
|-------|----------------------|-----------------|
| **Plan** | Pick formation, set instructions, manage squad | Agency, control |
| **Execute** | Advance to match day | Anticipation |
| **Result** | Match plays out (card deck events) | Excitement/tension |
| **React** | Read news, check injuries, see standings | Surprise, relief/frustration |
| **Plan** | Adjust tactics, scout players, plan transfers | Agency again → LOOP |

**Critical rule**: Each phase must take < 2 minutes. The total loop
(plan → result → react) should be completable in 5-8 minutes.
Short loops = "just one more match."

### 12.2 Variable Ratio Reinforcement (Neuroscience)

The most powerful engagement mechanic in all of gaming — identical to
how slot machines work, but ethical when used in game design:

```
Dopamine spike = f(anticipation) NOT f(reward)
```

**The brain releases dopamine during ANTICIPATION, not during reward.**
This is why the moment before the match result loads is more exciting
than the result itself.

**Elifoot must create anticipation peaks**:
1. Pre-match: "Can my 17-year-old handle this?"
2. Transfer deadline: "Will the deal go through?"
3. Season finale: "Will we get promoted?"
4. Youth academy: "What stats does the new kid have?"

**Variable schedule** = rewards come unpredictably:
- Win 3, lose 1, draw 2, win 5, lose 2 → engagement
- Win every game → boring (too predictable)
- Lose every game → frustrating (no reward)

### 12.3 The Hooked Model (Nir Eyal)

Every session must complete the habit cycle:

```
TRIGGER → ACTION → VARIABLE REWARD → INVESTMENT
```

| Stage | Elifoot |
|-------|---------|
| **Trigger** | Internal: "I wonder how my team did" / External: push notification (future PWA) |
| **Action** | Open game, advance to next match (LOW FRICTION — 1-2 clicks) |
| **Variable Reward** | Match result, transfer offer, youth graduation, injury news |
| **Investment** | Time spent building squad, scouting, developing youth = SUNK COST |

**Investment loads the next trigger**: After investing 3 seasons developing a wonderkid,
the player WILL come back to see if he reaches his potential.

### 12.4 Octalysis Framework (Yu-kai Chou) — 8 Core Drives

| # | Core Drive | Elifoot Implementation | Status |
|---|-----------|----------------------|--------|
| 1 | **Epic Meaning** | "Build a dynasty from nothing" narrative | ✅ Career mode |
| 2 | **Accomplishment** | Trophies, records, prestige points | ⚠️ Needs expansion |
| 3 | **Empowerment/Creativity** | Tactical freedom, formation experiments | ✅ Core mechanic |
| 4 | **Ownership** | "MY team, MY players, MY academy" | ✅ Strong via IKEA effect |
| 5 | **Social Influence** | Rivalries, press, fan reactions | ⚠️ Needs depth |
| 6 | **Scarcity** | Limited budget, rare wonderkids, deadline pressure | ⚠️ Needs tuning |
| 7 | **Unpredictability** | Match randomness, injuries, youth talent | ✅ Card deck system |
| 8 | **Loss Avoidance** | Relegation fear, player aging, contract expiry | ⚠️ Needs emphasis |

**Rule**: Every feature must activate at least 2 core drives.
Features that activate 0 drives are DEAD WEIGHT — remove them.

---

## §13. Fun — The Science of Enjoyment

### 13.1 Koster's Theory: Fun = Learning

```
Fun = the brain's reward for successfully recognizing and mastering patterns
```

When the player discovers that "pressing + fast wingers = more goals," that IS fun.
When they've mastered all patterns, the game stops being fun → **content exhaustion**.

**Elifoot antidote**: Systems must interact in ways that create NEW patterns:
- Season 1: Learn basic tactics
- Season 3: Discover youth development matters
- Season 5: Master transfer market economics
- Season 10: Navigate wage structure + aging squad + continental competition

Each layer reveals NEW patterns to master.

### 13.2 Depth vs. Complexity

```
GOOD: Few rules that interact deeply (Chess, Go)
BAD:  Many rules that don't interact (manual reading simulator)
```

| Metric | Definition | Elifoot Target |
|--------|-----------|---------------|
| **Complexity** | Rules to memorize | LOW — pick team, set tactics, play |
| **Depth** | Meaningful decisions per session | HIGH — every match has 5+ strategic choices |

**The "easy to learn, hard to master" formula**:
- Onboarding: "Pick your team, choose a formation, press play" (30 seconds)
- Mastery: "Optimize pressing triggers vs opponent's build-up tendencies" (100+ hours)

### 13.3 Meaningful Choice Architecture

Every decision must have:
1. **Awareness** — player knows they're choosing
2. **Trade-offs** — no dominant strategy
3. **Consequences** — choice changes the game state
4. **Reminder** — game references past choices ("Remember when you sold X?")

**Types of consequences**:

| Type | Timing | Example |
|------|--------|---------|
| **Telegraphed** | Immediate + predicted | "This player demands high wages" |
| **Delayed** | Future + surprising | The youth you ignored becomes rival's star |
| **Cascading** | Chain reaction | Selling captain → morale drop → losing streak → relegation fight |

**The strongest moments come from delayed cascading consequences.**
This is what creates "the stories you tell your friends."

---

## §14. Replayability — Making Season 1 Feel Fresh Every Time

### 14.1 Procedural Variance Layers

Each new career must feel different. Variance sources:

| Layer | Mechanism | Implementation |
|-------|-----------|---------------|
| **Team selection** | 100+ teams with unique constraints | `db/` modules |
| **Youth generation** | Seeded random academy players | `YouthAcademy.js` |
| **NPC behavior** | Different AI manager personalities | `NPCAISystem.js` |
| **Event randomness** | Card deck outcomes vary per seed | `decks/` |
| **Market dynamics** | Different players available each season | `MarketSystem.js` |
| **Narrative events** | Random off-pitch events, injuries, press | `InterruptEvents.js` |

### 14.2 Challenge Variants (MISSING — HIGH PRIORITY)

**What every successful game has that Elifoot needs**:

| Challenge Mode | Description | Replayability |
|---------------|-------------|--------------|
| **Giant Killer** | Win league with lowest-budget team | High constraint |
| **Youth Only** | Only use academy-produced players | No transfers |
| **Firefighter** | Save team from relegation mid-season | Time pressure |
| **Journeyman** | Career across multiple clubs/countries | Breadth |
| **Invincible** | Complete season without a loss | Perfection challenge |
| **Moneyball** | Win league spending least money | Efficiency puzzle |
| **One Club Man** | Retire at one club, build dynasty | Long-term investment |

**Implementation**: Challenges should be **unlockable** — beating the base game
unlocks harder variants. This gives meta-progression without changing core mechanics.

### 14.3 Meta-Progression (Cross-Career Persistence)

**What roguelites taught us**: Progress that carries BETWEEN runs keeps players coming back.

| Unlockable | Trigger | Effect |
|-----------|---------|--------|
| New leagues | Win a league | Access to new country/database |
| Cosmetic kits | Achievement milestones | Visual customization |
| Historic scenarios | Complete 5 seasons | Play as classic teams |
| Difficulty modifiers | Beat harder modes | Custom constraints |
| Hall of Fame | Career milestones | Permanent record of achievements |

**Rule**: Meta-progression must be COSMETIC or OPTIONAL — never pay-to-win,
never make new players weaker than veterans.

### 14.4 Dynasty/Legacy System (Crusader Kings Pattern)

The ultimate replayability hook for management sims:

```
Career 1: Build club from lower league → Win national title
Career 2: Your "son" manages another club with inherited traits
Career 3: Cross-generational rivalry emerges
```

**Implementation via `LineageSystem.js`**:
- Track manager career across saves
- Former players become managers/coaches
- Retired legends appear in hall of fame
- "Old Teammates" system creates cross-career callbacks

---

## §15. Retention — Making Players Come Back Tomorrow

### 15.1 The "No Natural Stopping Point" Rule

FM's calendar structure means there's ALWAYS something next:

```
Match → Transfer window opens → Youth graduation → Cup draw → Derby day → ...
```

**Elifoot season calendar must never have "dead zones"**:
- Every week has at minimum: 1 match + 1 off-pitch event
- Between seasons: transfer window activity, pre-season friendlies, new youth
- End of season: awards, contract renewals, staff changes

### 15.2 Investment Mechanics (IKEA Effect + Sunk Cost)

The more a player invests in their save, the harder it is to abandon:

| Investment Type | Psychological Effect |
|----------------|---------------------|
| **Time** (10+ seasons) | Sunk cost — "I can't stop now" |
| **Emotional** (developed youth player) | IKEA effect — "I MADE this player" |
| **Identity** ("I'm a Corinthians manager") | Role identification |
| **Knowledge** (learned the engine) | Mastery investment |

**Elifoot must maximize ownership feelings**:
- Show development history: "Player X: Discovered age 16, OVR 52 → Age 24, OVR 87"
- Track YOUR coaching record: wins, draws, losses, trophies across career
- Name the stadium after you at 500 wins

### 15.3 Loss Avoidance Mechanics (Octalysis Drive #8)

**Fear of losing is 2x more motivating than desire to gain** (Kahneman):

| Fear | Mechanic |
|------|----------|
| **Relegation** | 3 bottom teams go down — ever-present threat |
| **Player departure** | Stars want to leave if team underperforms |
| **Contract expiry** | Forget to renew → lose player for free |
| **Youth decline** | Neglect training → wonderkid stagnates |
| **Manager sacking** | Board fires you if results are bad enough |

### 15.4 Appointment Mechanics (for future PWA/mobile)

When Elifoot becomes a PWA, implement:
- **Season summary push notifications**: "Your team finished 3rd — transfer window opens"
- **Never punish absence** — game is offline-first, no timers
- **Welcome back summary**: "While you were away: 3 matches simulated, 2 wins, 1 youth graduated"

---

## §16. Game Juice — Making It FEEL Good

### 16.1 Why Management Sims Need Juice

"Juice" = the maximum amount of sensory feedback for minimal player input.
Management sims are inherently "dry" (spreadsheets, menus). Juice transforms them.

### 16.2 Celebration Moments (MISSING — CRITICAL)

Every significant event needs a **ceremony**:

| Event | Current State | Target State |
|-------|--------------|-------------|
| Goal scored | Text appears | Screen flash + crowd roar + stat popup + scorer highlight |
| Season won | Text appears | Trophy animation + season stats + team photo + hall of fame entry |
| Youth debut | Nothing | Special notification + "Remember this name" moment |
| Transfer complete | Text appears | Player card reveal + stats comparison + "Welcome to the club" |
| Record broken | Nothing | Full-screen celebration + historical context |
| Promotion | Text appears | Crowd invasion + player lap of honor + next season preview |

**Rule**: The 5 biggest moments per season should have CEREMONY.
Everything else can be text. But those 5 moments must be FELT.

### 16.3 Micro-interactions for Data Screens

Even spreadsheet screens need life:

- **Hover effects**: Player row highlights, stat comparison tooltip appears
- **Transitions**: View changes with smooth slide, not instant swap
- **Number animations**: Stats count up when revealed, not appear instantly
- **Conditional formatting**: Green = good form, red = poor, amber = declining
- **Skeleton loading**: Data screens show structure before content loads

### 16.4 Audio Juice (Tone.js)

| Interaction | Sound |
|-------------|-------|
| Navigate menu | Subtle click/tick |
| Match event | Contextual crowd reaction |
| Goal scored | Crescendo roar |
| Transfer accepted | Cash register / handshake |
| Achievement unlocked | Fanfare sting |
| Season end | Emotional ambient + crowd fade |

---

## §17. Competitive Gap Analysis — What EVERY Successful Game Has

### 17.1 vs. Football Manager

| Feature | FM | Elifoot | Priority |
|---------|----|---------|----|
| Deep match engine | ✅ 2D/3D | ✅ Card deck (unique!) | — |
| Scouting uncertainty | ✅ Hidden stats | ⚠️ Partial | 🔴 HIGH |
| Press conferences | ✅ Interactive | ⚠️ Basic | 🟡 MED |
| Staff management | ✅ Deep | ❌ Missing | 🟡 MED |
| Wonderkid narrative | ✅ Emergent | ✅ Youth Academy | — |
| Challenge scenarios | ✅ Community | ❌ Missing | 🔴 HIGH |
| Trophy/achievement system | ✅ Extensive | ⚠️ Basic | 🔴 HIGH |
| Season history/chronicle | ✅ Rich | ✅ ChronicleService | — |

### 17.2 vs. Mobile Games (Top Eleven, OSM)

| Feature | Mobile Games | Elifoot | Priority |
|---------|-------------|---------|----------|
| Quick sessions (5 min) | ✅ | ⚠️ Needs tuning | 🔴 HIGH |
| Live events/seasons | ✅ | ❌ Missing | 🟡 MED (future) |
| Social/competitive | ✅ Multiplayer | ❌ Offline only | 🟢 LOW (by design) |
| Achievement popups | ✅ Juicy | ❌ Missing | 🔴 HIGH |
| Tutorial/onboarding | ✅ Guided | ⚠️ Basic | 🔴 HIGH |

### 17.3 The 5 Missing Features That EVERY Hit Game Has

1. **🏆 Achievement/Trophy System** — Visible, collectible, shareable milestones
2. **🎯 Challenge Modes** — Constrained scenarios that force new strategies
3. **🔍 Information Asymmetry in Scouting** — Hidden stats revealed through investment
4. **🎉 Celebration Ceremonies** — Big moments need big feelings
5. **📖 Progressive Tutorial** — Teach systems one at a time, not all at once

These are not "nice to haves." They are the **table stakes** of commercial game design.
Without them, the game will feel like a prototype.

---

## §18. Design Checklist — Before Shipping Any Feature

```
□ Does this feature serve at least 1 Bartle type?
□ Does it trace through MDA (mechanic → dynamic → aesthetic)?
□ Does it activate at least 2 Octalysis core drives?
□ Does it have a celebration/ceremony for its peak moment?
□ Does it add depth WITHOUT adding complexity?
□ Does it create delayed or cascading consequences?
□ Does it maintain the < 5 minute core loop speed?
□ Does it create variance for replayability?
□ Does it have a test case in Vitest?
□ Does it use seeded PRNG (no Math.random)?
```

---

## §19. Onboarding & Tutorial — The First 5 Minutes

### 19.1 Progressive Disclosure (CRITICAL for Management Sims)

Management sims are inherently complex. The solution is NOT simplification — it's **layered revelation**:

```
Layer 1 (First match): Pick team, choose formation, play → DONE
Layer 2 (After 3 matches): Introduce substitutions, match instructions
Layer 3 (After 1 month): Introduce scouting, youth academy
Layer 4 (After 1 season): Introduce continental competition, contract negotiation
Layer 5 (After 2 seasons): Introduce advanced tactics, custom training
```

**Rules**:
- NEVER show all systems on day 1
- Each system activates with a contextual tooltip when it becomes relevant
- "Just-in-time" learning: explain scouting when a scout reports arrive, not before
- The player should be playing within 30 seconds of pressing "New Game"

### 19.2 The FM Touch Lesson

Football Manager has TWO products because the full game overwhelms casual players:

| FM Full | FM Touch | Elifoot Target |
|---------|---------|---------------|
| Press conferences | None | Optional toggle |
| Detailed training | Auto-managed | Simple → Advanced toggle |
| Full staff management | Automated | Simplified |
| Slow season progression | Fast | Fast (< 5 min/match) |

**Elifoot philosophy**: ONE product with scalable complexity.
Default = FM Touch speed. Advanced = opt-in depth.

### 19.3 The "Aha Moment"

Every successful product has a moment where the user "gets it":

| Product | Aha Moment |
|---------|-----------|
| Instagram | First photo gets a like |
| Uber | Car arrives in 3 minutes |
| **Elifoot** | Your tactical change wins a losing match |

**Design the first season to GUARANTEE this moment happens**:
- Pre-set a match in week 2-3 where the opponent is slightly stronger
- If the player makes a tactical adjustment and wins, the game congratulates them
- If they lose, the game hints at what they could have tried
- This teaches the core skill (tactics matter) through EXPERIENCE not text

---

## §20. Season Pacing — The Three-Act Structure

### 20.1 A Season is a Story

Every season must follow a dramatic arc:

```
Tension
  ▲
  │            ACT III
  │           ╱  ↗ Climax
  │    ACT II╱  │
  │        ╱   │
  │  ACT I╱    │  Resolution
  │     ╱      │ ╱
  └────────────────→ Time
  Aug   Oct   Jan   Apr   May
```

| Act | Phase | Events | Emotional Target |
|-----|-------|--------|-----------------|
| **I** | Opening (Aug-Oct) | New signings settle, early form, league position | Hope, uncertainty |
| **II** | Grind (Nov-Mar) | Injuries, cup runs, transfer window, form crises | Tension, frustration, adaptation |
| **III** | Climax (Apr-May) | Title race, relegation fight, cup finals, awards | Excitement, dread, triumph/despair |

### 20.2 No Dead Weeks

**Every week must have at minimum**:
- 1 match
- 1 narrative event (press, injury, rumor, board, youth)

**Special events by month** (seeded calendar):
| Month | Events |
|-------|--------|
| Aug | Season start, new signings debut |
| Sep | International break, players away |
| Oct | Form analysis, board evaluation |
| Nov | Injury crisis probability peaks |
| Dec | Fixture congestion, squad rotation pressure |
| Jan | Transfer window opens, loan deals |
| Feb | Cup run intensifies |
| Mar | Run-in begins, pressure mounts |
| Apr | Must-win matches, math gets real |
| May | Season finale, awards, renewals |
| Jun | Transfer window, youth graduation, pre-season |

### 20.3 Interrupt Events System (`InterruptEvents.js`)

Random events that disrupt routine and force decisions:

| Event Type | Example | Frequency | Consequence Type |
|-----------|---------|-----------|-----------------|
| **Crisis** | Star player demands transfer | 1-2/season | Major, cascading |
| **Opportunity** | Free agent available | 3-4/season | Strategic choice |
| **Drama** | Rival manager taunts in press | 2-3/season | Morale/narrative |
| **Milestone** | Player reaches 100 goals | Variable | Celebration |
| **Random** | Pitch waterlogged, match postponed | 1-2/season | Schedule disruption |

**Implementation**: Weighted probability table, contextual to team state
(worse teams get more crises, better teams get more poaching attempts).

---

## §21. Economy — Faucets, Sinks, and Anti-Snowball

### 21.1 Faucet-Sink Balance

```
FAUCETS (money IN)          SINKS (money OUT)
─────────────────          ──────────────────
Match day revenue          Player wages (recurring)
TV money                   Transfer fees
Prize money                Signing bonuses
Player sales               Stadium maintenance
Sponsorship                Youth academy costs
```

**Critical rule**: Faucets must slightly exceed sinks in early game
(growing is fun) but sinks must catch up in late game (challenge persists).

### 21.2 Anti-Snowball Mechanics

Prevent "the rich get richer" spiral:

| Mechanic | How It Works | Real Football Analog |
|----------|-------------|---------------------|
| **Wage inflation** | Better players demand exponentially higher wages | Premier League wage bills |
| **Diminishing returns** | 90→95 OVR costs 5x more than 80→85 | Transfer fee inflation |
| **Player poaching** | Top players attract attention from bigger clubs | Real Madrid targeting FM wonderkids |
| **Complacency** | Winning streaks reduce player motivation | Premier League title "hangover" |
| **FFP-style cap** | Wage/revenue ratio limit | UEFA Financial Fair Play |
| **Youth regression** | Neglected youth decline faster | Real academy wastage |

### 21.3 Currency Value Anchor

All prices should be anchored to a consistent reference:

```
1 "unit of value" = average league player weekly wage = ~£20,000
```

- Top striker: 100-150 units/week
- Youth player: 2-5 units/week
- Season ticket revenue: ~500 units/week
- League TV money: ~2,000 units/week (varies by division)

This makes all economic decisions intuitively comparable.

---

## §22. Advanced Design Patterns

### 22.1 Player Fantasy

The core fantasy of Elifoot is: **"I am the manager who builds something from nothing."**

Every system must reinforce this:
- Transfers: YOU chose this player
- Tactics: YOUR formation won this match
- Youth: YOU developed this wonderkid
- Chronicle: YOUR story is being recorded

**Rule**: Never remove agency. The player must feel every outcome
is a consequence of THEIR decisions, not random chance.

### 22.2 Self-Determination Theory (Deci & Ryan)

The three innate psychological needs for sustained engagement:

| Need | Elifoot Implementation |
|------|----------------------|
| **Autonomy** | Freedom to choose formation, tactics, transfers, strategy |
| **Competence** | Clear feedback: you see WHY you won/lost, stats explain causality |
| **Relatedness** | Parasocial bonds with players, rivalries with NPC managers |

**Anti-pattern**: Over-reliance on extrinsic rewards (badges, achievements)
can UNDERMINE intrinsic motivation. Use celebrations as RECOGNITION of
mastery, not as the primary goal.

### 22.3 Information Asymmetry in Scouting

```
Full Knowledge ────────────── Zero Knowledge
     ↑                              ↑
  YOUR players              OPPONENT players
```

| Information Level | What Player Sees | How to Unlock |
|------------------|-----------------|---------------|
| **Full** | All stats, traits, potential | Your squad |
| **Scouted** | Key stats + range estimates | Scout reports (time investment) |
| **Rumored** | Name + position + reputation | Press/agent tips |
| **Unknown** | Nothing | Not yet encountered |

**This creates the scouting game-within-a-game**:
- Invest time → find hidden gems
- Trust bad scouts → overpay for mediocre players
- Information IS the strategic advantage

### 22.4 Save Integrity (Ironman Consideration)

Protect meaningful consequences:

| Mode | Save Behavior | Target Player |
|------|--------------|--------------|
| **Standard** | Manual save + autosave | Casual, learning |
| **Ironman** | Autosave only, single slot | Hardcore, role-play |
| **Ironman+Seed** | Save includes RNG seed → reload gives SAME result | Anti-save-scum |

**Implementation**: Store the match PRNG seed in the save. On reload,
the match produces the IDENTICAL result. This eliminates save-scumming
while maintaining determinism.

### 22.5 Season Awards & Recognition System

End-of-season must be a CEREMONY, not a text dump:

| Award | Criteria | Emotional Purpose |
|-------|----------|------------------|
| **Best XI** | Top-rated by position across season | Recognition |
| **Player of the Year** | Highest average match rating | Achievement |
| **Young Player of Year** | Best U21 performance | Youth investment payoff |
| **Golden Boot** | Most goals | Striker fantasy |
| **Manager of the Year** | Overperformance vs expectation | Meta-recognition |
| **Most Improved** | Biggest OVR growth | Development payoff |

**In-season milestones** (not just end-of-season):
- Player of the Month
- 100th appearance
- 50th goal
- Clean sheet streak
- Unbeaten run

Each milestone gets a **notification + history entry + optional celebration screen**.

### 22.6 Endgame Longevity (Season 10+)

The game must remain engaging at 1000+ hours:

| Strategy | Implementation |
|----------|---------------|
| **Generational shift** | Stars retire → need new squad → new challenge |
| **Continental expansion** | Unlock European/Libertadores competition |
| **Difficulty escalation** | Opponents get smarter as you succeed |
| **Records to chase** | Permanent all-time records: most titles, points, goals |
| **Player-generated goals** | "Can I win with ONLY youth?" "Can I go invincible?" |
| **Legacy tracking** | Cross-career stats accumulate in Hall of Fame |

### 22.7 Accessibility

| Feature | Implementation | Priority |
|---------|---------------|----------|
| **Colorblind mode** | Never use color ALONE for meaning; add icons/shapes | 🔴 HIGH |
| **Font scaling** | Support 100%-200% text size | 🔴 HIGH |
| **Keyboard navigation** | All menus navigable without mouse | 🟡 MED |
| **Reduced motion** | Respect `prefers-reduced-motion` CSS | 🟡 MED |
| **Screen reader hints** | ARIA labels on interactive elements | 🟢 LOW (future) |

---

## §23. Updated Design Checklist — Full Version

```
BEFORE BUILDING:
□ What player fantasy does this serve?
□ Which Bartle type(s) does it engage?
□ Does it trace through MDA (mechanic → dynamic → aesthetic)?
□ Which Octalysis core drives does it activate? (minimum 2)
□ Does it add depth WITHOUT adding complexity?

DURING BUILDING:
□ Does it use seeded PRNG (no Math.random)?
□ Does it respect engine boundaries (no DOM in src/engine/)?
□ Does it have a migration path for save compatibility?
□ Is it accessible (colorblind, keyboard, font scaling)?

AFTER BUILDING:
□ Does it have a Vitest test case?
□ Does it create delayed or cascading consequences?
□ Does it maintain the < 5 minute core loop speed?
□ Does it create variance for replayability?
□ Does it have a celebration/ceremony for its peak moment?
□ Does it follow progressive disclosure (not shown day 1)?
□ Has it been validated with 10,000 match statistical test? (if engine)
```

---

## References

- Dixon, M. J. & Coles, S. G. (1997). "Modelling Association Football Scores and Inefficiencies in the Football Betting Market." *Journal of the Royal Statistical Society*
- Hunicke, R., LeBlanc, M., & Zubek, R. (2004). "MDA: A Formal Approach to Game Design and Game Research." *AAAI Workshop on Challenges in Game AI*
- Csikszentmihalyi, M. (1990). *Flow: The Psychology of Optimal Experience*
- Bartle, R. (1996). "Hearts, Clubs, Diamonds, Spades: Players Who Suit MUDs"
- Koster, R. (2004). *A Theory of Fun for Game Design*
- Schell, J. (2008). *The Art of Game Design: A Book of Lenses*
- Knuth, D. E. (1997). *The Art of Computer Programming, Vol. 2: Seminumerical Algorithms* (Fisher-Yates shuffle)
- Eyal, N. (2014). *Hooked: How to Build Habit-Forming Products*
- Chou, Y. (2015). *Actionable Gamification: Beyond Points, Badges, and Leaderboards* (Octalysis)
- Swink, S. (2008). *Game Feel: A Game Designer's Guide to Virtual Sensation*
- Kahneman, D. & Tversky, A. (1979). "Prospect Theory: An Analysis of Decision under Risk" (Loss aversion)
- Deci, E. L. & Ryan, R. M. (1985). *Intrinsic Motivation and Self-Determination in Human Behavior* (SDT)
- Schell, J. (2008). "The Lens of the Player" — Fantasy fulfillment analysis
- Norman, D. A. (2013). *The Design of Everyday Things* (Progressive disclosure, affordances)
- Game Accessibility Guidelines (gameaccessibilityguidelines.com) — Industry standard reference

