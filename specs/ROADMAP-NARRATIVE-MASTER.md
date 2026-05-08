# ELIFOOT WEB — Roadmap Narrativo v1.0.5 → v1.5

**Estado atual:** v1.0 + hotfix v1.0.1 (BUG-021)
**SAVE_VERSION atual:** 2 (após BUG-021 hotfix merge)
**Próximo trabalho:** refactor god-class antes de qualquer feature nova
**Diagnóstico engine.js:** 1.014 LOC / ~168 method-shape lines / ~44 métodos públicos
**Próximo SPEC livre:** SPEC-045 (números 045-049 reservados pra infra; 050+ pra narrative)
**Próximo AKITA livre:** AKITA-054 (RFCT prefix pra refactor)

---

## Releases

### v1.0.5 — Refactor God-Class (estimado 12-13 semanas part-time)

Extrair 4 services do engine.js sem quebrar 597 assertions.

- **Ordem:** MythService → RelationshipService → NarrativeService → CareerService
- **Pré-requisito crítico:** extrair MatchSimulator antes de NarrativeService (PR-0.4)
- **SAVE_VERSION:** sobe pra 3 ao final
- **Sem feature nova**
- **15-18 PRs pequenos**, cada um revertível
- **SPEC master:** AKITA-RFCT-000

### v1.0.7 — Camada 2 Foundation (estimado 3-4 semanas)

Schema de eventos atômicos + decay + 80 eventos handwritten iniciais.

- 12-15 tipos de evento (fixed vocab em `src/data/eventTypes.js`)
- 20-25 tags categóricas (fixed vocab em `src/data/eventTags.js`)
- Half-life decay com floor (ver SPEC-049 tabela)
- **Sem UI nova ainda** — só motor + schema
- **SAVE_VERSION:** sobe pra 4
- **SPEC:** AKITA-050

### v1.1 — Camada 5 Mito (parte 1 de 2, estimado 3-4 semanas)

Hall de Lendas com 6 slots por clube + lógica canonização.

- Schema halls (idoloEterno, carrasco, goleirao, criaDaBase, traidor, lendaTragica)
- Função pura `evaluateMyth(save) → save'`
- 1 manchete handwritten por slot (6 manchetes mínimas)
- UI Galeria do Clube (estática, prosa)
- **SAVE_VERSION:** sobe pra 5
- **SPEC:** AKITA-051

### v1.1.5 — Traits Herdáveis (parte 2 de 2, estimado 2-3 semanas)

4 traits herdáveis em regens com bias por slot do Hall.

- garra, talento_natural, lealdade, frieza (range 0-100)
- Bias dinâmico baseado em slots preenchidos do Hall
- 10 manchetes handwritten adicionais pra herança
- Manchete "garoto tem X de [ídolo] e Y de [traidor]"
- **SAVE_VERSION:** sobe pra 6
- **SPEC:** AKITA-052

### v1.2 — Transição Jogador → Técnico (estimado 4-5 semanas)

Continuidade no mesmo save: ProPlayer aposenta e vira Manager.

- Camada Relacional manager↔presidente: trust e patience (-100 a +100)
- 3 thresholds: 80 carta branca, 50 cobrança, 25 ultimato
- Ex-companheiros viram contratáveis
- Bias +10 em trust ao assumir clube com 2+ ídolos canonizados
- 12 manchetes press conference handwritten
- UI: barra paciência presidente
- **SAVE_VERSION:** sobe pra 7
- **SPEC:** AKITA-053

### v1.3 — Filhos Regens (estimado 2-3 semanas)

Regens-filhos de ex-companheiros emergem 16-18 anos após auge.

- Schema `regenLineage`
- Probabilidade: 1 a cada 3-4 temporadas (escassez intencional)
- Manchete dedicada
- Arco "A Sombra do Pai" quando filho de ídolo está em má fase
- **SAVE_VERSION:** sobe pra 8
- **SPEC:** AKITA-054

### v1.4 — Rivalidades Emergentes (estimado 3-4 semanas)

Camada 3 expandida: clube↔clube com decay e thresholds.

- Vetor `club_club.rivalry` (0-100)
- Threshold 50: mídia chama de "novo clássico"
- Threshold 80: rivalry consolidada na ficha
- 6 arcos nomeados (Camada 4 inicial): "A Maldição dos Aflitos", "Os Anos de Chumbo", "A Vingança Lenta", etc.
- UI: tabela rivalidades dinâmicas
- **SAVE_VERSION:** sobe pra 9
- **SPEC:** AKITA-055

### v1.5 — Crônica do Save (estimado 1-2 semanas)

Tela prosa por temporada montada de templates + arcos fechados.

- Export save JSON pra debugging
- Stress test save 200h
- Sem telemetria (projeto pessoal)
- **SAVE_VERSION:** sobe pra 10
- **SPEC:** AKITA-056

### v2.x — Adiado intencionalmente

- Drift mecânico (RimWorld-style)
- Decks unificados com engine principal
- Economia realista
- Phaser top-down match preview
- Mobile UI dedicado

Apenas planejar após v1.5 estar shipped + 30h jogadas sem tocar código.

---

## Stop Conditions Globais

Pare e revise se:

- engine.js crescer >1500 LOC durante refactor
- Qualquer save break inesperado (perda save de teste de fase anterior)
- Mutation score Stryker cair >5pp em qualquer fase
- Refactor passar de 14 semanas (escopo creep)
- Você não tocar em feature por >4 semanas durante refactor
- Algum service ficar anemic (só CRUD) — inline de volta

---

## Princípios Diretores

1. **Bottom-up**, do mais isolado ao mais entrelaçado
2. **Testes verdes contínuos.** Nenhum PR mergea com 597 assertions caindo
3. **Composição manual + constructor injection.** Sem framework DI. Sem Zustand/Jotai/Redux
4. **Services preferencialmente stateless.** State vive no engine
5. **Chamadas diretas síncronas.** EventBus apenas se aparecer ciclo real
6. **Texto handwritten supera sistema complexo até ~50h jogo.** Nunca migrar pra Tracery. Nunca LLM em browser
7. **Drift mecânico proibido em v1.x.** Telemetria interna também não
8. **SAVE_VERSION sequencial:** 2 (atual) → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10
9. **Cada SPEC tem Definition of Stop** além de Definition of Done
10. **SPECs refactor:** prefixo AKITA-RFCT-XXX. Features: AKITA-XXX padrão

---

## Anti-patterns proibidos

- Tags categóricas livres (vocabulário sempre fixo)
- LLM em browser (até v3.x)
- Tracery (sempre JS puro)
- Drift mecânico em v1.x
- Camada 5 antes de Camadas 1-3 (mas Camada 5 mínima em v1.1 OK porque é apenas Hall)
- Múltiplas camadas em paralelo (sempre uma de cada vez)

---

## Diferenciais Competitivos Consolidados

| Feature | ELIFOOT Web | FM26 | Brasfoot | Top Eleven |
|---------|-------------|------|----------|------------|
| Transição contínua jogador→técnico mesmo save | ✅ v1.2 | ❌ | ❌ | ❌ |
| Filhos-regens de ex-companheiros | ✅ v1.3 | ❌ | ❌ | ❌ |
| Sistema narrativo procedural 5 camadas | ✅ v1.0.7-v1.4 | ⚠️ | ❌ | ❌ |
| Hall de Lendas persistente | ✅ v1.1 | ❌ | ❌ | ❌ |
| Crônica save exportável | ✅ v1.5 | ❌ | ❌ | ❌ |
| Web cross-platform (PC + mobile) | ✅ v1.0 | ⚠️ | ⚠️ | ✅ mobile only |
| Open-source / spec-driven | ✅ AKITA | ❌ | ❌ | ❌ |
| Pay-to-win | ❌ jamais | ❌ | ❌ | ✅ predatório |

---

## Resumo Esforço

| Release | Horas estimadas | Semanas (6h/sem) |
|---------|-----------------|------------------|
| v1.0.5 Refactor | 76h | 12-13 |
| v1.0.7 Camada 2 | 24h | 3-4 |
| v1.1 Camada 5 Mito | 24h | 3-4 |
| v1.1.5 Traits | 18h | 2-3 |
| v1.2 Transição | 30h | 4-5 |
| v1.3 Filhos Regens | 18h | 2-3 |
| v1.4 Rivalidades | 24h | 3-4 |
| v1.5 Crônica | 12h | 1-2 |
| **TOTAL** | **226h** | **30-38 sem** |

---

**Última atualização:** 2026-05-08
**Mantido por:** Dudu
