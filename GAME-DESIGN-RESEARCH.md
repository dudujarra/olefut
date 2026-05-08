# ELIFOOT — Game Design Deep Research v1.0

**Data**: 2026-05-08
**Estado**: v2.0.0 (PR #59 + #61 merged)
**Autor pesquisa**: Claude Opus 4.7 + análise codebase + feedback in-game live
**Objetivo**: Identificar gaps profundos game design + roadmap massivo melhorias

---

## TL;DR

ELIFOOT v2.0 tem **fundação técnica sólida** (1045 testes, 26 specs engine, 6 specs UI, 170 clubes, 5-layer narrative skeleton) mas **gameplay loops rasos**: 15 ações manager / 6 ações player, sessão típica = clicar avançar 38× temporada.

**Diagnóstico raiz**: o jogo simula competentemente, mas **falha em criar tensão decisória contínua**. User feedback in-game (3 entries) confirma: *"só treino e jogo, que faço com dinheiro?"*.

**3 eixos prioritários** (ordem ROI):
1. **Player mode depth** — 4 skills → 12-16, traits 5 → 20, relacionamentos 4 → 10, eventos semanais 5 → 30+
2. **Manager mode economy + agency** — money sinks, board demands, mid-match tactical, fan atmosphere
3. **Brazilian cultural depth** — estaduais, gírias regionais, rivalidades emergentes, Copa Libertadores

12 SPECs novos propostos. Roadmap ~16 sprints. Diferencial competitivo: **"Crusader Kings × Football" (narrative-first, não simulation-first)**.

---

## 1. Inventário Sistemas Atuais (engine completo)

### 1.1 Engine principal (`src/engine/engine.js` — 818 LOC, 44 métodos públicos)

**Manager actions (15)**:
| Método | Frequência típica user | Profundidade decisão |
|---|---|---|
| `setTactic` | 1× temporada | Baixa (6 opções) |
| `setFormation` | 1× temporada | Média (5 presets) |
| `saveFormationLayout` | Raro | Alta (drag-drop) |
| `doTeamTalk` | Pré-jogo | Baixa (4 opções) |
| `doTraining` | Semanal | Baixa (5 tipos) |
| `acceptTransferOffer` | Janela transferências | Média |
| `renewContract` | Quando expira | Baixa (yes/no) |
| `upgradeAcademy` | 1-2× save | Baixa (binário) |
| `upgradeStadium` | 1-2× save | Baixa (binário) |
| `hireStaff` / `fireStaff` | Raro | Baixa |
| `doScouting` | Mensal | Média (4 regiões) |
| `signScoutedPlayer` | Raro | Média |
| `applyLiveSubstitution` | Mid-match | **Alta** (tactical) |
| `advanceWeek` / `playMatch` | Semanal core loop | Zero (passivo) |

### 1.2 Subsistemas (`src/engine/systems/` — 12 sistemas)

| Sistema | Status | User-facing |
|---|---|---|
| AchievementsSystem | Ativo | ❌ Sem UI dedicada |
| ContractSystem | Ativo | ⚠️ Renew binário |
| MarketSystem | Ativo | ✅ MarketView |
| NPCAISystem | Ativo | ❌ Backend only |
| NationalTeamSystem | Ativo | ❌ Sem UI |
| NewsSystem | Ativo | ⚠️ Eventos textuais simples |
| PreferencesSystem | Ativo | ⚠️ Settings limitado |
| PrestigeSystem | Ativo | ⚠️ Display passivo |
| RivalrySystem | Ativo | ✅ RivalriesView |
| SponsorsSystem | Ativo | ⚠️ Auto-renew silencioso |
| StatisticsSystem | Ativo | ⚠️ Limitado |
| WeatherSystem | Ativo | ⚠️ Display passivo |

**Diagnóstico**: 12 sistemas implementados, **5 sem UI dedicada** (Achievements, NPCAI, NationalTeam, parcial Prestige/Sponsors). Profundidade simulada não chega ao user.

### 1.3 Player mode (`src/engine/PlayerCareer.js` — 314 LOC)

**Player actions (6)**:
- `train(skill)` — 4 skills (technique/pace/power/vision)
- `rest()` — +30 energia
- `buyEnergyDrink()` / `consumeEnergyDrink()` — R$100
- `buyTrait(traitId)` — 5 traits (R$1500-3000)
- `handleOffPitchChoice` — eventos OffPitchEventsDeck
- `resolveMentalBreak` — 3 escolhas crisis

**Skills**: 4 atributos (vs FM 30+, vs CM 01-02 36)
**Traits**: 5 (vs FM 50+ player traits)
**Personalidades**: 3 (maverick/virtuoso/heartbeat)
**Relacionamentos**: 4 NPCs (boss/fans/teammates/sponsors) — cap 100
**Stress system**: ✓ (CK3 inspired)
**Mental break**: ✓ (3 outcomes)

**Diagnóstico player mode**:
- **Profundidade insuficiente** vs gênero RPG (FM Touch player career, NBA 2K MyCareer benchmark)
- **Sem vida pessoal** (sem família, casa, agente, contratos paralelos)
- **Sem progressão skill granular** (pular 1-99 vs sub-stats: dribbling/passing/shooting/heading/positioning)
- **Sem off-season** (férias, training camp, friendlies)

### 1.4 Specs implementados (32 total)

Engine specs (26): SPEC-001 a SPEC-029, SPEC-060
UI specs (6): SPEC-030, SPEC-040 a SPEC-044

**Gaps spec coverage**:
- SPEC-020 a SPEC-023 — **vagos** (números pulados)
- SPEC-031 a SPEC-039 — **vagos**
- SPEC-045 a SPEC-049 — reservados infra (não implementados)
- SPEC-050+ — reservados narrative (parcialmente skeleton)

---

## 2. Player Loop Maps (atual)

### 2.1 Manager mode loop (semanal)

```
Dashboard (overview/training/transfers/etc)
   ↓
[escolha 1-2 ações: train, talk, scout]
   ↓
Pré-Match (3-painel adversário info)
   ↓
[setTactic/formation se quiser mudar]
   ↓
MatchView (assistir narração)
   ↓
[live sub mid-match opcional]
   ↓
Fulltime → Dashboard
   ↓
advanceWeek → próxima semana
```

**Tempo médio sessão**: 5-15 min/semana
**Decisões high-stakes/semana**: 1-2 (geralmente nenhuma — auto-tactic)
**Branching**: linear

### 2.2 Player mode loop (semanal)

```
PlayerDashboard (skills/relationships/money)
   ↓
[treinar 1 skill OR descansar OR comprar trait OR consumir drink]
   ↓
[off-pitch event 40% chance]
   ↓
PlayerMatch (assistir minutos)
   ↓
Fulltime → PlayerDashboard
   ↓
advanceWeek
```

**Tempo médio**: 3-8 min/semana
**Decisões high-stakes/semana**: 1 (qual skill treinar)
**Branching**: ainda mais linear

### 2.3 Meta-loop

```
Save start → 38 weeks/season → trophy/promote/relegate → next season
   → 5-10 seasons → retirement/career end → save closed
```

**Sem prestige loop** (NG+ não implementado)
**Sem meta-narrativa** explícita ("conquiste todas Libertadores em 10 anos")
**Sem unlock progression** (cosmetics, achievements visíveis)

---

## 3. Análise Comparativa Gênero

### 3.1 Football Manager 2025 (Sports Interactive)

| Feature | FM 2025 | ELIFOOT v2.0 |
|---|---|---|
| Atributos jogador | 36+ | 4 |
| Treino granular | 50+ tipos | 5 |
| Press conferences | ~12 perguntas/coletiva, 50+ tipos | Sim mas raro |
| Tactical creator | 30+ instructions | 6 tactics fixed |
| Mid-match tactics | Sim, real-time | ❌ (só sub) |
| Set pieces | Editor completo | ❌ |
| Staff hiring | 8 roles, 200+ atributos | 4 roles, simples |
| Scouting reports | Detalhados (dossier) | Lista nomes |
| Contracts | Bonus/incentivos/agentes | Wage simples |
| Board demands | Detalhadas, dinâmicas | 1 confidence number |
| Press relations | Sim | ❌ |
| News module | Hub completo | Eventos simples |
| Match engine | 3D | Top-down sprites |

**Gap crítico**: FM tem **agency mid-match** (instructions ao vivo), ELIFOOT tem só sub.

### 3.2 Championship Manager 01/02 (cult classic BR)

| Feature | CM 01/02 | ELIFOOT v2.0 |
|---|---|---|
| Atributos jogador | 36 | 4 |
| Hidden attributes | 6 (loyalty, pressure, big_match) | ❌ |
| Regen system | Famoso (Tsigalko, Cherno) | Parcial (planejado v1.4 narrative) |
| Newgens | Spawn 16 anos com bias países | Genérico |
| Database brasileiro | Excelente | ✅ 170 clubes (forte) |
| Estaduais | Sim (Paulistão, Carioca) | ❌ |

**Tsigalko effect**: regens icônicos viram folclore. ELIFOOT roadmap v1.4 prevê — não implementado ainda.

### 3.3 Brasfoot (saudosismo BR)

| Feature | Brasfoot 2010-2022 | ELIFOOT v2.0 |
|---|---|---|
| Estaduais BR | Paulistão, Carioca, Mineiro, Gaúcho | ❌ |
| Copa do Brasil | Sim | ⚠️ Parcial (KnockoutCup) |
| Libertadores | Sim, qualificação | ⚠️ ContinentalCup genérico |
| Sul-Americana | Sim | ❌ |
| Gírias / cultura BR | Profundo | ⚠️ Gírias parcial |
| Estilo simulação | Texto puro, brasfoot raiz | ✅ Pixel-art SNES + texto |
| Mobile-first | Sim | ⚠️ Web responsive WIP |

**Gap brasileiro**: estaduais ausentes = quebra imersão BR. Crítico.

### 3.4 NBA 2K MyCareer (player mode benchmark)

| Feature | 2K MyCareer | ELIFOOT player mode |
|---|---|---|
| Cidade explorável | Sim (3D hub) | ❌ |
| Agente narrative | Sim | ❌ |
| Endorsements | 4-6 sponsors negociáveis | ⚠️ 1 generic |
| Casa / lifestyle | Comprar mansões | ❌ |
| MyPark social | Multiplayer hub | N/A |
| Skill points | Earnable + trade-offs | ⚠️ XP semi |
| Badges | 80+ unlockable | ⚠️ 5 traits |

**Gap player mode**: ELIFOOT tem **stress + relationships** (CK3 inspirado) mas falta **lifestyle** (gastar dinheiro, conquistas externas).

### 3.5 Crusader Kings 3 (narrative-first benchmark)

| Feature | CK3 | ELIFOOT |
|---|---|---|
| Stress system | ✅ inspiração direta | ✅ adotado |
| Personality traits | 30+ slots | 5 |
| Lifestyle trees | 5 árvores 60+ perks | ❌ |
| Events procedural | 1000+ eventos | ⚠️ 80 OffPitchEventsDeck |
| Dynastic lineage | Core mecânica | ⚠️ Regen children planned v1.4 |
| Storylets | Yes (event chains) | ⚠️ flags básicas |

**Diferencial competitivo identificado** (per roadmap): "Crusader Kings aplicado a futebol". Skeleton existe, falta densidade.

---

## 4. Problemas Game Design Identificados

### 4.1 Problemas críticos (afetam retention)

**P-1. Loop semanal monótono**
- Sintoma: user clica advance 38× temporada sem decisões significativas
- Causa: sem "interrupt" events que forçam atenção (lesão grave, demanda board, escândalo)
- **Fix**: aumentar densidade eventos forçados (não opcionais) — 3-5/semana

**P-2. Money inutilizável modo player**
- Sintoma: feedback in-game *"que faço com meu dinheiro? enfio no cu?"*
- Causa: 1 sink (energy drink R$100) + 5 traits (R$1500-3000)
- **Fix parcial**: Loja Traits exposta (PR #61, deployed)
- **Fix profundo**: lifestyle system (casa, carro, agente, festas, doações, investimentos)

**P-3. Match passivo após kickoff**
- Sintoma: user assiste narração 90 minutos sem agency (exceto sub única)
- Causa: engine sync (não real-time generator yet — RFCT planned v1.0.5)
- **Fix curto**: tactical instructions mid-match (pressão alta/baixa, marcar individual)
- **Fix longo**: real-time generator + decisões/30min

**P-4. Sistemas invisíveis**
- AchievementsSystem, NationalTeamSystem, PreferencesSystem, PrestigeSystem, NPCAISystem
- Implementados engine, **zero UI**
- **Fix**: AchievementsView + NationalTeamView + dashboard prestige widget

**P-5. Estaduais brasileiros ausentes**
- Sintoma: 170 clubes mas calendário só Brasileirão Série A-D
- Quebra imersão BR (todo brasileiro joga Paulistão jan-abril)
- **Fix**: SPEC-061 State Championships (Paulistão, Carioca, Mineiro, Gaúcho mínimo)

### 4.2 Problemas importantes (UX/depth)

**P-6. Skill atribute granularity baixa**
- 4 skills (technique/pace/power/vision) é nivel mobile arcade
- Genre standard: 12-36 sub-attributes
- **Fix**: SPEC-062 expand attributes (16 sub-stats organized in 4 groups)

**P-7. Press conference subutilizada**
- Existe (`PressConference.js`) mas não centralized
- **Fix**: PressView dedicada + 30+ question types

**P-8. Staff system superficial**
- 4 roles vs FM 8 roles
- Sem atributos staff (só hire/fire flag)
- **Fix**: SPEC-063 Staff Depth (assistant manager, coach, fitness, GK coach, scout, physio, analyst, director of football)

**P-9. Scouting reports textuais**
- Lista nomes + atributos
- Sem dossier visual, sem comparação
- **Fix**: ScoutDossier UI + comparação side-by-side

**P-10. Sem agente / contratos avançados**
- Manager: contracts simples wage + duration
- Player: zero agente
- **Fix**: SPEC-064 Agent System (contracts complex: signing bonus, image rights, performance bonuses, release clauses)

### 4.3 Problemas menores (polish)

**P-11. Sem tutorial**
- New player desorientado
- **Fix**: 5-step onboarding

**P-12. Sem difficulty modes**
- One-size-fits-all
- **Fix**: Easy/Normal/Hard (economia ×0.7/1/1.3, board patience ×1.5/1/0.7)

**P-13. Sem mobile UX**
- Layout desktop-first
- **Fix**: responsive <768px (já em roadmap v2.0)

**P-14. Save/load UX**
- Auto-save funciona
- Sem múltiplos slots, sem cloud
- **Fix**: 3 save slots + export/import JSON

**P-15. Sem replay value pós-retirement**
- Save ends quando retire ou save fim careira
- **Fix**: NG+ com prestige bonus + filhos-regens (planned v1.4)

---

## 5. Roadmap Massivo Melhorias

### 5.1 Prioridades (ROI matrix)

```
Alto Impact / Baixo Esforço:
- P-2: Lifestyle player (loja traits feita ✓, expandir casa/carro/agente)
- P-4: AchievementsView (UI sobre sistema existente)
- P-7: PressView (UI sobre PressConference existente)
- P-11: Tutorial 5-step

Alto Impact / Alto Esforço:
- P-1: Interrupt events density (rewrite eventos forçados)
- P-3: Mid-match tactics (precisa generator refactor v1.0.5)
- P-5: Estaduais brasileiros (SPEC-061)
- P-6: Skill granularity expansion (SPEC-062 — afeta engine)

Médio Impact:
- P-8: Staff depth (SPEC-063)
- P-9: ScoutDossier
- P-10: Agent System (SPEC-064)
- P-13: Mobile UX

Polish:
- P-12: Difficulty modes
- P-14: Save slots
- P-15: NG+
```

### 5.2 Sprints proposed (16 sprints, ~80h cada)

#### **Sprint A — Lifestyle Expansion (Player mode)** — ROI altíssimo
Resolve FB-2 + P-2.
- **SPEC-065 Lifestyle System**: casa (R$50k-5M, 5 tiers), carro (R$30k-2M, 4 tiers), relógio, festas
- **SPEC-066 Agent System (player)**: contratar agente Patrícia (existente NPC), negociações, rep
- Impacto: dinheiro vira recurso significativo

#### **Sprint B — AchievementsView + Trophy Cabinet UI** — ROI alto
Resolve P-4.
- 30+ achievements visíveis player + manager
- Trophy cabinet integrado ChronicleView
- Notificações banner (EfBanner já existe)

#### **Sprint C — Estaduais Brasileiros** — Diferencial cultural
Resolve P-5 + P-15 (cultural BR).
- **SPEC-061**: Paulistão (jan-abril), Carioca, Mineiro, Gaúcho
- Calendário 4 meses estadual + Brasileirão paralelo
- Rivalidades estaduais (Fla-Flu, San-São, Choque-Rei, Grenal)

#### **Sprint D — Skill Granularity** — Engine deep
Resolve P-6.
- **SPEC-062**: 4 grupos × 4 sub-stats = 16 atributos player
- Treino granular: 16 tipos (1 por sub-stat)
- Migration save: derive sub-stats from current 4 skills

#### **Sprint E — Match Tactics Mid-Game** — Agency core
Resolve P-3 (depends RFCT-005 generator).
- Pressão alta/baixa toggle
- Marcação individual (top 3 enemies)
- Style shift (defensive/balanced/attacking) any time
- Substituição múltipla (3 in 1 batch)

#### **Sprint F — Press Conferences Hub** — Narrative density
Resolve P-7.
- PressView dedicada
- 30+ question types (rivalry, board, individual player, scandal, future)
- Affects: morale squad, fans, board, player relationships
- Trigger: pré + pós match + crisis

#### **Sprint G — Interrupt Events Engine** — Retention boost
Resolve P-1.
- 50+ forced events (vs current 80 optional)
- Categories: medical (lesão grave 2-6 meses), legal (suspensão, prisão), familial (filho doente), boardroom (demanda específica), media (escândalo), opportunity (mega proposta clube grande)
- Force decision via modal (não dismissable)

#### **Sprint H — Staff Depth** — Manager mode RPG
Resolve P-8.
- **SPEC-063**: 8 roles staff (assistant, coach atk/def/gk, fitness, scout, physio, analyst, DOF)
- Cada staff 6 atributos
- Hire/fire UI dossier completo
- Affects: training quality, scouting accuracy, injury rate

#### **Sprint I — Scout Dossier + Comparação** — Quality of life
Resolve P-9.
- ScoutDossier modal (foto, history, attrs, fit score)
- Side-by-side comparison up to 4 players
- AI scout report opinion ("razoável pro orçamento", "talento raro")

#### **Sprint J — Contracts + Agent Manager** — Economic depth
Resolve P-10.
- **SPEC-064**: contracts negotiation flow (signing bonus, image rights, performance bonus, release clause, loyalty bonus)
- Agent NPCs com personality (greedy/loyal/aggressive)
- Image rights revenue passive
- Release clauses: rival clubs trigger automatic offers

#### **Sprint K — Tutorial + Onboarding** — Adoption
Resolve P-11.
- 5 steps: pick mode → pick team → first training → first match → first transfer
- Skip option
- Resume tutorial via Help button

#### **Sprint L — Difficulty Modes + Settings UI** — Replay
Resolve P-12.
- Easy/Normal/Hard
- Custom modifiers (economy, board patience, injury rate)
- PreferencesSystem UI exposure

#### **Sprint M — Mobile Responsive Pass** — Reach
Resolve P-13.
- All views <768px
- Touch-friendly buttons
- Burger menu nav

#### **Sprint N — Save Management** — Quality
Resolve P-14.
- 3 save slots
- Export/import JSON (parcial existe)
- Cloud sync (opcional, manual link)

#### **Sprint O — NG+ + Lineage Inheritance** — Replay
Resolve P-15 (depends v1.4 narrative).
- Aposentar player → start manager mode same save
- Children regens 16-18 anos depois
- Bonus prestige carry-over

#### **Sprint P — Brazilian Cultural Polish** — Identity
- Gírias regionais (paulista vs carioca vs gaúcho dictionaries)
- Easter eggs (referências Tsigalko-style folclore BR)
- Sounds vinhetas Globo-style ≤4s
- Manchetes radialista virtual (Sprint v1.4 narrative)

---

## 6. Specs Técnicas Sugeridas (12 novos)

| SPEC | Nome | Sprint | Esforço |
|---|---|---|---|
| SPEC-061 | State Championships (Paulistão, Carioca, Mineiro, Gaúcho) | C | 24h |
| SPEC-062 | Skill Granularity Expansion (16 attrs) | D | 32h |
| SPEC-063 | Staff Depth System (8 roles + dossier) | H | 24h |
| SPEC-064 | Contracts + Agent System (negotiation flow) | J | 28h |
| SPEC-065 | Lifestyle System (casa/carro/relógio/festas) | A | 16h |
| SPEC-066 | Agent System Player Career | A | 12h |
| SPEC-067 | Mid-Match Tactical Instructions | E | 24h |
| SPEC-068 | Interrupt Events Engine (50+ forced) | G | 20h |
| SPEC-069 | Press Conference Hub | F | 16h |
| SPEC-070 | Achievements UI + Trophy Cabinet | B | 12h |
| SPEC-071 | Scout Dossier + Comparison | I | 12h |
| SPEC-072 | Tutorial + Onboarding | K | 8h |

**Total esforço estimado**: 228h ≈ 28-32 sprints semanais part-time (4-6h/dia)

---

## 7. Métricas Sucesso (per release)

### v2.1 (Sprints A+B+G — lifestyle + achievements + interrupts)
- ✅ Player feedback "que faço com dinheiro" não retorna
- ✅ Achievements unlock rate >40% novos saves primeira temporada
- ✅ Avg session time +30%

### v2.2 (Sprints C+F — estaduais + press conferences)
- ✅ ≥5 menções orgânicas Reddit r/futebol BR / Twitter sobre Paulistão ELIFOOT
- ✅ Press conference engagement >60% (não skip)

### v2.3 (Sprints D+E — skill granularity + mid-match)
- ✅ Tests +200 (skill engine refactor)
- ✅ Mid-match decision rate >50% saves

### v3.0 (todos sprints A-P)
- ✅ Top 10 r/footballmanagergames BR mention list
- ✅ 30+ orgs assessment compete vs Brasfoot
- ✅ Retenção 30 dias ≥35%

---

## 8. Riscos Identificados

**R-1 — Engine refactor blocker**: Sprints D, E precisam RFCT-005 (sync→generator). Critical path.

**R-2 — Save migration**: SPEC-062 skill expansion exige migration. SAVE_VERSION bump risk regen issue (BUG-021 styled).

**R-3 — Scope creep player mode**: 16 atributos + 20 traits + lifestyle pode virar FM clone sem identity. Manter foco "Crusader Kings × futebol BR" não "FM clone tropical".

**R-4 — Brazilian IP**: estaduais usam nomes reais clubes. Já temos abstract sprites (referenciar não replicar). Manter.

**R-5 — Time-to-impact alto**: 16 sprints × 1 semana = 16 semanas linha reta. Realisticamente 6-9 meses part-time. Risco: mercado FM27 lançar antes.

---

## 9. Recomendação Final

### Ordem execução proposta (max ROI / min risco):

```
v2.1 (3-4 semanas):
  A: Lifestyle (FB-2 deep fix)
  B: AchievementsView (P-4)
  K: Tutorial (P-11) → onboarding crítico

v2.2 (3-4 semanas):
  C: Estaduais BR (diferencial cultural)
  F: Press Hub (narrative density)
  L: Difficulty modes (P-12)

v2.3 (4-6 semanas):
  G: Interrupt events (retention)
  H: Staff depth
  I: Scout dossier

v2.4 (5-7 semanas — depende RFCT-005):
  D: Skill granularity expansion
  E: Mid-match tactics

v2.5 (4 semanas):
  J: Agent + contracts deep
  N: Save management

v3.0 (3-4 semanas):
  M: Mobile responsive
  O: NG+ + lineage
  P: Brazilian polish
```

**Total**: 22-29 semanas part-time (~6-7 meses).

### Não fazer (recomendação anti-scope):

- ❌ 3D match engine (impossível part-time, NÃO é diferencial)
- ❌ Multiplayer / social features (distraente, dilui core)
- ❌ Microtransações / loot boxes (mata reputação cult/saudosismo)
- ❌ License real clubs (caro, IP risk, não é diferencial)
- ❌ AAA voice acting (caro, IP risk)

---

## 10. Conclusão

ELIFOOT v2.0 = **fundação 9/10 técnica, 5/10 game design**.

Engine simula competentemente (1045 testes) mas **gameplay loops são finos demais**. User feedback in-game confirma percepção: jogo é "bonito mas raso".

**3 alavancas identificadas**:
1. **Profundidade modo player** (lifestyle + agente + skill granular)
2. **Densidade decisões manager** (interrupt events + mid-match + estaduais)
3. **Identity cultural BR** (Paulistão, gírias regionais, manchetes radialista)

Diferencial competitivo único viável: **"Crusader Kings × Futebol Brasileiro"** — narrative-first, não simulation-first. FM27 vai apostar em simulação 3D — não competimos lá. Apostamos em **densidade narrativa + cultura BR profunda**.

Próxima decisão crítica: aprovar v2.1 (Sprints A+B+K) e iniciar SPEC-065 Lifestyle System.

---

**Documento vivo**. Revisão a cada release. Próxima atualização: pós v2.1.

🤖 Generated with deep-research analysis Claude Opus 4.7
