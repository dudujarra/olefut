# GAME-DESIGN ROADMAP V2 — Post-Brutal Analysis

> **Data**: 2026-05-12
> **Trigger**: análise brutal pós-35 PRs revelou plumbing extenso mas LOOP CORE inalterado
> **Premissa**: visual polish FICA pra fase posterior. Aqui só interação + conteúdo + wires
> **Owner**: Dudu / Claude
> **Substitui parcial**: `GAME-DESIGN-ROADMAP-2026-05-12.md` (fase D ainda válida)

---

## ⛔ Princípio

> **Match continua Excel. Conteúdo BR é raio fino. Features mortas. Onboarding shallow. Star Player sem voz.**

35 PRs construíram **palco**. Esta V2 escreve a **peça**.

Visual polish (animações, dramatização cinematográfica, full-screen cinemáticas, sound design) **NÃO está aqui**. Vai pra V3 quando V2 fechar.

---

## 📋 Fases

| Fase | Tema | Horas est. | Bloqueia |
|------|------|------------|----------|
| **F1** | Match Pause + Decisões | 18h | nada |
| **F2** | Features mortas → wire | 12h | nada |
| **F3** | Conteúdo BR profundo | 25h | F2 (atmosphere wire) |
| **F4** | Chronicle + Star Player com VOZ | 20h | F2 (LLM call existing) |
| **F5** | Onboarding progressivo | 15h | F1 |
| **F6** | Playtest + Telemetria | 12h | F1+F2+F3+F4+F5 |
| **TOTAL** | | **102h** | |

---

## F1 — Match Pause + Decisões (18h)

Resolve **Brutalidade #1**: match continua Excel rolando.

### F1.1 — Pause obrigatório em highlight events (6h)

Event Classifier (AKITA-273) já classifica. **Wire**: ticker pausa quando event tier === 'highlight' (goal, red).

- SPEC-F1.1 `src/components/MatchHighlightModal.jsx`
- Hook em MatchView ticker: detecta event highlight → setPaused(true) + abre modal 3s
- Modal: minute + tipo + texto + player + "PROSSEGUIR" botão (auto-dismiss 3s)
- Helper `extractHighlightContext(narrationEntry)` pure

### F1.2 — Mid-match modal triggers expandidos (4h)

Hoje: minutos 15/30/45/60/75 + 30% chance = 1-2 cartas/match. Pouco.

- SPEC-F1.2 expandir trigger:
  - **Reactive triggers** (não só minute-based):
    - Lesão → modal "Substituir / Aguentar"
    - Cartão amarelo no titular → modal "Substituir preventivo / Manter"
    - Adversário marca → modal "Mudar tática / Manter"
  - Helper `getReactiveCard(event)` em MidMatchManagerDeck

### F1.3 — Player decisão impacta star player visivelmente (4h)

Hoje star recebe amplify silencioso. Player não vê.

- SPEC-F1.3 toast/banner mostra "Pelé +5 moral (sua decisão)" após cada mid-match choose
- Animação fade-in/fade-out 2s no Dashboard quando volta da match

### F1.4 — Audit MatchView ticker pra split god-view (4h)

794 LOC. Limites pra futuras additions.

- Extract `useMatchTicker` custom hook
- Extract `MatchPhaseRouter` component
- Limite alvo MatchView ≤500 LOC

---

## F2 — Features Mortas → Wire (12h)

Resolve **Brutalidade #3**: SPEC-180/181, ModLoader, Atmosphere manager.

### F2.1 — SPEC-180 Win Streak wire em MatchSimulator (3h)

- Helper `applyWinStreakBonus(sectors, teamId)` em MatchSimulator
- Default flag ON após A/B test 100 saves comparando variance
- Flag SOAK test em `tests/statistical/win-streak-ab.test.js`
- Aceitar se variance shift ≤30% e win-rate avg shift ≤8%

### F2.2 — SPEC-181 Legends Pool wire em PlayerCareer (3h)

- Hook em `PlayerCareer.retirePlayer()` chama `LegendsCrossSavePool.markRetired()`
- Hook em `CoachProposalSystem.generateProposals()` faz merge com `recruitableLegends()`
- Toast "Lenda {nome} de {saveAnterior} disponível como coach"
- Test cross-save: save A retira Ronaldo → save B vê Ronaldo proposta

### F2.3 — ModLoader auto-load em GameInitializer (2h)

- Fetch `/mods/cards/manifest.json` na initGame
- Merge cards em MidMatchManagerDeck via `mergeWithDeck`
- Console.log de pack count carregado

### F2.4 — BrazilianAtmosphere wire em Manager mode (4h)

Hoje só Player mode tem. Manager mode 0 atmosphere.

- Wire em MatchSimulator: cada event `'goal'` recebe prefix atmosphere via `getAtmosphere('goal', seed)`
- Wire em narration log strings
- 50% chance de enrichment (não satura)

---

## F3 — Conteúdo BR Profundo (25h)

Resolve **Brutalidade #2**: 170 clubes ainda strings + cores.

### F3.1 — Voice files por clube (15h)

170 clubes × 6-8 strings cada = ~1200 strings PT-BR contextualizadas.

- Estrutura: `src/engine/clubVoices/<clubeName>.json`
- Schema:
```json
{
  "clubId": 1,
  "stadium": "Mineirão",
  "city": "Belo Horizonte",
  "region": "SE",
  "rivals": [2, 3],
  "voices": {
    "stadium_entry": ["Mineirão treme com a torcida azul.", ...],
    "goal_home": ["Galo no peito, gol explosão!", ...],
    "goal_away": [...],
    "loss_home": [...],
    "win_classifying": [...],
    "rival_match": ["Clássico mineiro. A história escreve hoje.", ...]
  }
}
```
- Helper `getClubVoice(clubId, contextType, seed)` em `ClubVoiceSystem.js`
- Bulk creation: 4-6h primeiros 20 clubes (top BR), 9h os outros 150

### F3.2 — Brazilian Atmosphere expansion catalog (5h)

Hoje 36 strings. Target: 200+.

- Add categorias: `pre_match`, `corner`, `freekick`, `penalty`, `injury`, `substitution`, `halftime`, `final_whistle`, `season_end`
- 15-20 strings por categoria
- Test catalog coverage > 200

### F3.3 — Wire ClubVoice em momentos-chave (3h)

- Match start narration: `getClubVoice(homeId, 'stadium_entry')`
- Gol mandante: `getClubVoice(homeId, 'goal_home')`
- Match end vencedor: `getClubVoice(winnerId, 'win_classifying')`
- Derby flag detected: `getClubVoice(homeId, 'rival_match')`

### F3.4 — Regional weather flavor (2h)

Hoje matchCondition tem `weather`. Combinar com `clubVoices.city`:

- "Calor de 38° em Manaus" se cidade norte + weather sun
- "Lama em Cuiabá" se central-oeste + weather rain
- 4-6 strings por região × weather

---

## F4 — Chronicle + Star Player com VOZ (20h)

Resolve **Brutalidade #4 + #6**: Chronicle seca, Star Player sem voz.

### F4.1 — Chronicle via LLMNarrativeService (8h)

Hoje `ChronicleSystem.generate()` retorna template fixo.

- Hook `ChronicleSystem.generate()` chama `LLMNarrativeService.seasonChronicle()` (novo método)
- LLM prompt context: `{ season, clubName, finalPos, topScorer, keyDerby, biggestWin, worstLoss, starPlayer, mood }`
- Output: 4-6 parágrafos PT-BR com nomes reais dos jogadores
- Fallback template enriquecido se LLM off
- Cache por (season + clubName + hash) — invalidates per save

### F4.2 — Star Player frase semanal (4h)

DashboardView painel "ESTRELA DO CLUBE" ganha campo `weeklyQuote`.

- Hook em `WeekProcessor`: ao avançar semana, se starPlayerId set, gera frase via LLM ou template
- Templates fallback (10+):
  - "{Pelé} treinou forte essa semana."
  - "{Pelé} reclamou da escalação."
  - "{Pelé} celebrou contrato extendido."
- Quote rotativa: muda a cada 4 semanas ou em evento (gol decisivo, lesão, vitória clássica)

### F4.3 — Star Player moments (4h)

Eventos especiais que disparam modais ao star player:

- 1º gol → "Pelé marcou o 1º pelo clube"
- 50 jogos → "Pelé alcança meio centenário"
- Hat-trick → "Pelé deu show"
- Lesão grave → "Pelé fora por X semanas"
- Conquista título → "Pelé entra pra história"
- Modal "STAR MOMENT" curto + foto pixel-art (já existe avatar system)

### F4.4 — Chronicle export PNG enriquecida (4h)

PNG export atual = texto simples sobre fundo.

- Adicionar: clube badge (pixel-art existe), star player name, top scorer name, posição final, principal evento da temp
- Layout 2 colunas: esquerda imagem/badge, direita texto
- Manter sem deps externas (canvas API)

---

## F5 — Onboarding Progressivo (15h)

Resolve **Brutalidade #5**: 4 tooltips cobrem 0% mecânicas.

### F5.1 — Onboarding por mecânica triggered (10h)

Hoje OnboardingCoach só week 1. Expandir:

- 8 mecânicas tutorialed: TÁTICA, FORMAÇÃO, MERCADO, TREINO, CONTRATO, SCOUT, BASE, DIRETORIA
- Trigger event-based: primeira vez player abre MarketView → tooltip Market
- Storage `elifoot_onboarding_seen_*` por mecânica
- Skip-all opção

### F5.2 — "Aha moments" cards estratégicos (3h)

Insights surgidos contextualmente:
- Após 5 jogos: "Você notou que vencer em casa é mais fácil? Use tática diferente fora."
- Após 1ª lesão: "Reservas existem por isso. Veja PLANTEL."
- Após 1ª oferta perdida: "Cada oferta tem prazo. Não demore."
- 6-10 cards total

### F5.3 — Replay tutorial via Sidebar Tutorial (2h)

TutorialView atual = texto pré-jogo. Adicionar lista de tutoriais contextuais já vistos com botão "Rever".

---

## F6 — Playtest + Telemetria (12h)

Resolve **Brutalidade #7**: 0 playtest humano, mandamento brutal #7 violado.

### F6.1 — Telemetria opt-in (5h)

- Helper `Telemetry.event(type, payload)` em `src/utils/telemetry.js`
- Eventos chave: `save_start`, `match_played`, `season_end`, `view_opened`, `view_abandoned`, `card_shown`, `card_chosen`, `feature_used_first_time`
- Opt-in dialog na primeira abertura: "Permitir telemetria anônima local? (Apenas conta agregado, nada enviado)"
- Storage local JSON em `localStorage.elifoot_telemetry`
- Helper `Telemetry.export()` dump JSON pra debug

### F6.2 — Playtest 5 humanos BR (5h não-código + 2h análise)

Não-código primário:
- Recrutar 5 testers (Reddit r/futebol + Twitter dev BR)
- Sessão 30min cada, gravada com permissão
- Roteiro: novo save → 1 temporada → observar
- Métricas: time-to-first-win, time-to-abandon, confusões verbais, "uau" moments

Pós-sessão: 2h análise = top 10 issues priorizados.

---

## 🎯 Top 3 prioridades (próxima sessão)

1. **F1.1 Match Pause em highlights** (6h) — maior ROI emocional
2. **F4.1 Chronicle via LLM** (8h) — viraliza compartilhamento
3. **F3.1 voice files top 20 clubes** (4-6h) — sabor BR real

3 itens = ~18-20h trabalho focado. Mantém mandamento brutal #8 (2 PRs cozidos/semana).

---

## ⛔ NÃO ESTÁ AQUI (visual polish — V3 futuro)

- Animação bola sobre pitch (B1.3 já feito, mais elaborado = V3)
- Match dramatization cinematográfica (replay slow-mo, camera zoom)
- Full-screen cinematics (cerimônia troféu, ascensão Série)
- Sound design narrativo (música reage a placar/streak)
- Avatares de jogador estilizados
- Pixel-art assets novos
- Theme switching (cores por clube global no UI)

V3 vem depois. **V2 escreve a peça. V3 ilumina o palco.**

---

## Checklist de saída V2

| Item | Done quando |
|------|-------------|
| Match com peso emocional | Player faz 1 decisão crítica por partida via highlight modal |
| Conteúdo BR profundo | 170 clubes têm voz textual identificada |
| Features mortas vivas | Win Streak ON default, Legends recrutam cross-save, Mods auto-load |
| Chronicle viralizável | PNG export com nomes reais + evento marcante + clube badge |
| Star Player com voz | Frase semanal + 5+ moments captados |
| Onboarding cobre 80% | 8 mecânicas tutorialed contextualmente |
| Playtest validado | 5/5 humanos BR completam 1 temporada sem abandonar |

---

**Versão**: 2.0 (post-brutal analysis)
**Status**: ⏸️ aprovação Dudu pendente
**Próximo passo**: Tu aprova V2, eu ataco F1.1+F4.1+F3.1 (top 3 prioridades).
