# ELIFOOT WEB — Roadmap Integrado v2.0
*Atualizado com dados de playtest (pasta 12) + game design insights (técnico como personagem)*

**Estado atual:** v1.0 + hotfix v1.0.1 (BUG-021)  
**SAVE_VERSION atual:** 11 (pós AKITA-128)  
**Próximo SPEC gameplay livre:** SPEC-136  
**Próximo SPEC engine livre:** SPEC-083  
**Próximo AKITA livre:** AKITA-130 (após sessão de bugs paralela)

---

## Scores de Playtest (Pasta 12 — base para priorização)

| Detector | Score | Status |
|----------|-------|--------|
| Monotony | 11 | 🔴 CRÍTICO — TACTIC_STUCK 100+ eventos |
| Critical Path | 25 | 🔴 CRÍTICO — 12/16 views mortas |
| Rivalry | 30 | 🔴 CRÍTICO — rival sem momentos críticos |
| Progression | 30 | 🔴 CRÍTICO — growthEventCount=0 |
| Fun Score | 50 | 🟡 MÉDIO |
| Market Liquidity | 50 | 🟡 MÉDIO — 966 ofertas, 0% aceitas |
| Session Length | 70 | 🟡 OK (é autoplay) |
| Player Identity | 78 | 🟡 BOM — base para SPEC-070 |
| Economy Flow | 90 | 🟢 BOM |
| Narrative Coverage | 91 | 🟢 BOM |
| Balance Audit | 100 | ✅ SÓLIDO |
| Decision Impact | 100 | ✅ SÓLIDO |
| Emotional Arc | 100 | ✅ SÓLIDO |
| Load Performance | 100 | ✅ SÓLIDO |

---

## Anomalias Críticas do Autoplay (203 seasons, 310k matches)

| Anomalia | Frequência | Impacto |
|----------|-----------|---------|
| TACTIC_STUCK | 100+ eventos | Game loop morto |
| LOSS_STREAK | Até 12 derrotas sem reação | Sem narrativa de crise |
| SQUAD_SHORT | 7 jogadores sem trigger | Supply chain quebrado |
| VEXAME | 0-8 sem cascata | Humilhação sem consequência |
| MARKET_LOWBALL | 0% aceitação | Mercado inerte |

---

## Releases

---

### FASE 0 — v1.0.8 Gameplay Fix (estimado 2-3 semanas)
*Resolve scores críticos de playtest ANTES do refactor. Sem narrativa, só mecânica.*

**Por que antes do refactor:** scores 11-30 indicam problemas de loop de jogo — refactor de narrativa não adianta se o jogo é estático.

| SPEC | Sistema | Score Alvo |
|------|---------|-----------|
| SPEC-131 | AI Tactic Pivot | Monotony 11 → ≥40 |
| SPEC-132 | Squad Emergency Market | SQUAD_SHORT zero |
| SPEC-133 | Market Liquidity Fix | Market 50 → ≥70 |
| SPEC-134 | Progression Growth Events | Progression 30 → ≥60 |
| SPEC-135 | Critical Path Unlock | Critical Path 25 → ≥60 |

- **SAVE_VERSION:** sobe pra 12 ao final
- **AKITA:** tickets individuais por SPEC

---

### FASE 1 — v1.0.5 Refactor God-Class (estimado 12-13 semanas)
*Sem mudança de escopo. Pré-requisito crítico para Fases 3-5.*

Extrair 4 services do engine.js sem quebrar 597 assertions.

- **Ordem:** MythService → RelationshipService → NarrativeService → CareerService
- **Pré-requisito crítico:** extrair MatchSimulator antes de NarrativeService (PR-0.4)
- **SAVE_VERSION:** sobe pra 13 ao final
- **Sem feature nova**
- **15-18 PRs pequenos**, cada um revertível
- **SPEC master:** AKITA-RFCT-000

---

### FASE 2 — v1.0.7 Camada 2 Foundation (estimado 3-4 semanas)
*Base de eventos atômicos. Sem mudança de escopo.*

Schema de eventos atômicos + decay + 80 eventos handwritten iniciais.

- 12-15 tipos de evento (fixed vocab em `src/data/eventTypes.js`)
- 20-25 tags categóricas (fixed vocab em `src/data/eventTags.js`)
- Half-life decay com floor (ver SPEC-049 tabela)
- **Sem UI nova ainda** — só motor + schema
- **SAVE_VERSION:** sobe pra 14
- **SPEC:** AKITA-050

---

### FASE 3 — v1.2 Técnico como Personagem (estimado 5-6 semanas)
*Integra v1.2 original + insights de game design. Maior diferencial competitivo.*

**Por que aqui:** Player Identity score=78 valida que base existe. Falta identidade de técnico.

| SPEC | Sistema | Resolve |
|------|---------|---------|
| SPEC-070 | Manager Identity System | Reputação, estilo, ranking |
| SPEC-071 | Contract Goals System | Stakes por season (Progression) |
| SPEC-072 | Board Tension System | Demissões não arbitrárias (upgrade SPEC-006) |
| SPEC-073 | Coach Proposals System | Propostas orgânicas, carreira |
| SPEC-074 | Organic Challenges | Missões espontâneas (salvar time, levantar gigante) |

**Inclui da v1.2 original:**
- Transição contínua jogador→técnico no mesmo save
- Ex-companheiros viram contratáveis
- Bias +10 em trust com ídolos canonizados
- 12 manchetes press conference handwritten
- UI: barra tensão presidente

- **SAVE_VERSION:** sobe pra 15
- **SPEC master:** AKITA-053 (expandido)

---

### FASE 4 — v1.1 Mito + Emoção (estimado 4-5 semanas)
*v1.1 original + Craque Protegido + Cascata de Humilhação*

**Mantém da v1.1:**
- Hall de Lendas com 6 slots por clube
- Função pura `evaluateMyth(save) → save'`
- UI Galeria do Clube

**Adiciona:**

| SPEC | Sistema | Resolve |
|------|---------|---------|
| SPEC-075 | Star Player Protection | Craque protegido com stakes narrativos |
| SPEC-076 | Humiliation Cascade | VEXAME com cascata real (Emotional Arc mantém 100+) |

**v1.1.5 Traits Herdáveis** (mantém escopo original):
- 4 traits herdáveis em regens
- Bias dinâmico por slots do Hall

- **SAVE_VERSION:** sobe pra 16-17
- **SPECs:** AKITA-051, AKITA-052

---

### FASE 5 — v1.4 Rivalidades + Resposta a Crise (estimado 4-5 semanas)
*v1.4 expandido com Loss Streak Response*

**Mantém da v1.4:**
- Vetor `club_club.rivalry` (0-100)
- Thresholds 50 e 80 (novo clássico / consolidado)
- 6 arcos nomeados

**Adiciona:**

| SPEC | Sistema | Resolve |
|------|---------|---------|
| SPEC-077 | Loss Streak Response | LOSS_STREAK 12 derrotas sem reação |
| — | Derby Scheduling upgrade | criticalCount real (Rivalry 30 → ≥60) |
| — | Rival hire narrative | Recusar proposta gera evento competitivo |

- **SAVE_VERSION:** sobe pra 18
- **SPEC:** AKITA-055 (expandido)

---

### FASE 6 — v1.3 + v1.5 Filhos Regens + Crônica (estimado 3-4 semanas)
*Sem mudança de escopo. Legado e encerramento.*

**v1.3 Filhos Regens:**
- Schema `regenLineage`
- Probabilidade: 1 a cada 3-4 seasons
- Arco "A Sombra do Pai"

**v1.5 Crônica do Save:**
- Tela prosa por season
- Export save JSON
- Stress test save 200h

- **SAVE_VERSION:** sobe pra 19-20
- **SPECs:** AKITA-054, AKITA-056

---

### v2.x — Adiado intencionalmente

- Escola Tática (legado de estilo)
- Aposentadoria escolhida como final crafted
- Convocação da seleção (SPEC-018 ativado)
- Drift mecânico (RimWorld-style)
- Economia realista
- Phaser top-down match preview
- Mobile UI dedicado

Planejar apenas após v1.5 shipped + 30h jogadas sem tocar código.

---

## Stop Conditions Globais

Pare e revise se:

- engine.js crescer >1500 LOC durante refactor
- Qualquer save break inesperado
- Mutation score Stryker cair >5pp em qualquer fase
- Refactor passar de 14 semanas (escopo creep)
- Você não tocar em feature por >4 semanas durante refactor
- Algum service ficar anemic (só CRUD) — inline de volta
- Score playtest de qualquer SPEC-1xx descer após implementação (regressão de gameplay)

---

## Princípios Diretores

1. **Bottom-up**, do mais isolado ao mais entrelaçado
2. **Testes verdes contínuos.** Nenhum PR mergea com 597 assertions caindo
3. **Composição manual + constructor injection.** Sem framework DI. Sem Zustand/Jotai/Redux
4. **Services preferencialmente stateless.** State vive no engine
5. **Chamadas diretas síncronas.** EventBus apenas se aparecer ciclo real
6. **Texto handwritten supera sistema complexo até ~50h jogo.** Nunca migrar pra Tracery. Nunca LLM em browser
7. **Drift mecânico proibido em v1.x.** Telemetria interna também não
8. **SAVE_VERSION sequencial:** 11 (atual) → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20
9. **Cada SPEC tem Definition of Stop** além de Definition of Done
10. **SPECs refactor:** prefixo AKITA-RFCT-XXX. Features: AKITA-XXX padrão
11. **Playtest valida releases.** Cada FASE termina com rodada de telemetria antes de avançar

---

## Anti-patterns proibidos

- Tags categóricas livres (vocabulário sempre fixo)
- LLM em browser (até v3.x)
- Tracery (sempre JS puro)
- Drift mecânico em v1.x
- Camada 5 antes de Camadas 1-3 (mas Camada 5 mínima em v1.1 OK)
- Múltiplas camadas em paralelo (sempre uma de cada vez)
- Feature nova sem score de playtest como target (toda SPEC define score alvo)

---

## Diferenciais Competitivos Consolidados

| Feature | ELIFOOT Web | FM26 | Brasfoot | Top Eleven |
|---------|-------------|------|----------|------------|
| Transição contínua jogador→técnico mesmo save | ✅ Fase 3 | ❌ | ❌ | ❌ |
| Técnico com identidade, reputação, estilo | ✅ SPEC-070 | ⚠️ parcial | ❌ | ❌ |
| Contratos com metas explícitas + demissão orgânica | ✅ SPEC-071/072 | ✅ | ❌ | ❌ |
| Desafios espontâneos (salvar time, gigante caído) | ✅ SPEC-074 | ❌ | ❌ | ❌ |
| Craque protegido com stakes narrativos | ✅ SPEC-075 | ❌ | ❌ | ❌ |
| Humilhação com cascata de consequências | ✅ SPEC-076 | ⚠️ | ❌ | ❌ |
| Filhos-regens de ex-companheiros | ✅ Fase 6 | ❌ | ❌ | ❌ |
| Sistema narrativo procedural 5 camadas | ✅ Fase 2-5 | ⚠️ | ❌ | ❌ |
| Hall de Lendas persistente | ✅ Fase 4 | ❌ | ❌ | ❌ |
| Crônica save exportável | ✅ Fase 6 | ❌ | ❌ | ❌ |
| Web cross-platform (PC + mobile) | ✅ v1.0 | ⚠️ | ⚠️ | ✅ mobile only |
| Open-source / spec-driven | ✅ AKITA | ❌ | ❌ | ❌ |
| Pay-to-win | ❌ jamais | ❌ | ❌ | ✅ predatório |

---

## Resumo Esforço

| Fase | Release | Horas | Semanas |
|------|---------|-------|---------|
| **FASE 0** | v1.0.8 Gameplay Fix | 18h | 2-3 |
| **FASE 1** | v1.0.5 Refactor | 76h | 12-13 |
| **FASE 2** | v1.0.7 Camada 2 | 24h | 3-4 |
| **FASE 3** | v1.2 Técnico como Personagem | 36h | 5-6 |
| **FASE 4** | v1.1 Mito + Emoção | 30h | 4-5 |
| **FASE 5** | v1.4 Rivalidades + Crise | 30h | 4-5 |
| **FASE 6** | v1.3 + v1.5 Legado | 24h | 3-4 |
| **TOTAL** | | **238h** | **33-40 sem** |

---

## Índice de SPECs por Fase

### Fase 0 — Gameplay Fix
- [SPEC-131](gameplay/SPEC-131-ai-tactic-pivot.md) — AI Tactic Pivot
- [SPEC-132](gameplay/SPEC-132-squad-emergency-market.md) — Squad Emergency Market
- [SPEC-133](gameplay/SPEC-133-market-liquidity-fix.md) — Market Liquidity Fix
- [SPEC-134](gameplay/SPEC-134-progression-growth-events.md) — Progression Growth Events
- [SPEC-135](gameplay/SPEC-135-critical-path-unlock.md) — Critical Path Unlock

### Fase 3 — Técnico como Personagem
- [SPEC-070](engine/SPEC-070-manager-identity-system.md) — Manager Identity System
- [SPEC-071](engine/SPEC-071-contract-goals-system.md) — Contract Goals System
- [SPEC-072](engine/SPEC-072-board-tension-system.md) — Board Tension System
- [SPEC-073](engine/SPEC-073-coach-proposals-system.md) — Coach Proposals System
- [SPEC-074](engine/SPEC-074-organic-challenges.md) — Organic Challenges

### Fase 4 — Mito + Emoção
- [SPEC-078](engine/SPEC-078-hall-of-legends.md) — Hall de Lendas (6 slots + canonização)
- [SPEC-079](engine/SPEC-079-heritable-traits.md) — Traits Herdáveis (4 traits + bias do Hall)
- [SPEC-075](engine/SPEC-075-star-player-protection.md) — Star Player Protection
- [SPEC-076](engine/SPEC-076-humiliation-cascade.md) — Humiliation Cascade

### Fase 5 — Rivalidades + Crise
- [SPEC-080](engine/SPEC-080-rivalry-upgrade.md) — Rivalry Upgrade (criticalCount + 6 arcos)
- [SPEC-077](engine/SPEC-077-loss-streak-response.md) — Loss Streak Response

### Fase 6 — Legado
- [SPEC-081](engine/SPEC-081-filhos-regens.md) — Filhos Regens (linhagem de ex-companheiros)
- [SPEC-082](engine/SPEC-082-cronica-do-save.md) — Crônica do Save (prosa por temporada)

---

**Última atualização:** 2026-05-10  
**Baseado em:** Playtest pasta 12 (telemetria + autoplay 203 seasons) + game design session  
**Mantido por:** Dudu
