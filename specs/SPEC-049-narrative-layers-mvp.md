# SPEC-049: Narrative Layers MVP

**Status:** OPERATIONAL REFERENCE (permanent)
**Versão:** 1.0
**Owner:** Dudu

## O que é

Definição operacional do escopo mínimo de cada uma das 5 camadas narrativas em cada release v1.0.7 → v1.5. Esta SPEC é referência permanente — toda outra SPEC de feature narrativa deve referenciar esta.

## Camadas e seus MVPs por release

### Camada 1 — AGENTE (sempre ativa, expande gradualmente)

**v1.0.7:** registro estruturado de TODA decisão do jogador (TRANSFER_OUT, TACTIC_CHANGED, FIRED_STAFF, etc.)

**v1.2+:** decisões de manager (signWithClub, hireStaff)

### Camada 2 — EVENTUAL

**v1.0.7 MVP:**
- 12-15 tipos de evento (vocab fixo em `src/data/eventTypes.js`)
- 20-25 tags categóricas (vocab fixo em `src/data/eventTags.js`)
- Schema: `id, ts, type, valence, intensity, tags, actors, witnesses, decay, narrativeWeight`
- Half-life decay com floor (tabela abaixo)
- 80 eventos atômicos handwritten iniciais

**Half-lives:**

| Tipo evento | Half-life (dias) | Floor (mínimo permanente) |
|-------------|------------------|---------------------------|
| Traição/saída pra rival | 730 | 0.15 |
| Gol importante | 365 | 0.05 |
| Briga com torcida | 540 | 0.10 |
| Conquista título | 1095 | 0.20 |
| Performance individual ruim | 90 | 0.0 |

### Camada 3 — RELACIONAL

**v1.2 MVP:** manager↔presidente apenas (trust, patience)

**v1.4 MVP:** club↔club (rivalry)

**v1.4 MVP:** jogador↔torcida (love)

**Range universal:** -100 a +100

**Thresholds:** 3 níveis (ex: 30, 60, 80)

**Recompute:** a cada 7 dias-de-jogo, não em tempo real

### Camada 4 — NARRATIVA (arcos nomeados)

**v1.4 MVP:** 6 arcos nomeados de rivalidade

**v1.3 MVP:** 1 arco "A Sombra do Pai" pra regens-filhos

**Schema:**

```js
{
  id: 'arc_001',
  name: 'A Maldição dos Aflitos',
  status: 'open' | 'closed',
  openedAt: 1234567890,
  triggerEvents: [eventIds],
  actors: [actorIds],
  milestones: [{ event, ts }],
  expiresAt: 1234567890 | null,
  closureCondition: { type, value }
}
```

### Camada 5 — MITO

**v1.1 MVP:** 6 slots por clube

- `idoloEterno`
- `carrasco`
- `goleirao`
- `criaDaBase`
- `traidor`
- `lendaTragica`

**v1.1.5 MVP:** 4 traits herdáveis

- `garra` (0-100)
- `talento_natural` (0-100)
- `lealdade` (0-100)
- `frieza` (0-100)

**Bias da herança:** calculado por `evaluateMyth(save) → save'`

## Stop Conditions por Camada

| Camada | Stop = Suficiente |
|--------|-------------------|
| 1 | Quando todas decisões geram ≥1 evento da Camada 2 |
| 2 | Quando 80% dos eventos taggeados afetam ≥1 vetor da Camada 3 |
| 3 | Quando cada vetor cruza todos os 3 thresholds em uma temporada típica |
| 4 | Quando o jogador consegue nomear espontaneamente o arco em curso |
| 5 | Quando jogador, ao começar novo save, lembra ≥2 ídolos do save anterior |

## Anti-patterns proibidos

- Tags categóricas livres (vocabulário sempre fixo)
- LLM em browser (até v3.x)
- Tracery (sempre JS puro)
- Drift mecânico em v1.x
- Camada 5 antes de Camadas 1-3 (mas Camada 5 mínima em v1.1 OK porque é apenas Hall, não mito completo)
- Múltiplas camadas em paralelo (sempre uma de cada vez)

## Forbidden

- ❌ EventBus / pub-sub (até evidência de ciclo real)
- ❌ Telemetria interna
- ❌ Drift mecânico em v1.x
- ❌ Manchetes geradas por LLM
- ❌ Tags fora do vocabulário fixo

## Files

- `src/data/eventTypes.js` (vocab fixo)
- `src/data/eventTags.js` (vocab fixo)
- `src/data/headlines/*.js` (templates handwritten)
- `src/services/NarrativeService.js` (após RFCT-011)
- `src/services/MythService.js` (após RFCT-005)
- `src/services/RelationshipService.js` (após RFCT-008)
