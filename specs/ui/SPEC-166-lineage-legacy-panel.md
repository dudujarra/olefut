# SPEC-166: Painel Linhagem & Legado (Unified Lineage View)

**Status**: PROPOSTO (Bloco 2.2 — Foundation-First)
**Versão**: 1.0
**Owner**: Dudu (Eduardo Jarra)
**Origem**: AKITA-233 (audit) + Bloco 2 do `MASTER-ROADMAP-FOUNDATION-FIRST`
**SDD link**: este arquivo + harness `tests/integration/lineage-view-data.test.js`

---

## O que é

View React unificada (`LineageView`) que torna visíveis 4 sistemas da engine que
HOJE possuem código + testes mas **zero superfície de UI**:

1. **Hall de Lendas** (SPEC-078) — `engine.hallOfLegends.slots`
2. **Heritage Traits** (SPEC-079) — `player.heritageTraits` em regens jovens
3. **Humilhação Cascade** (SPEC-076) — eventos transitórios em `engine.weekEvents`
4. **Growth Events** (SPEC-134) — eventos transitórios em `engine.weekEvents`

A view consome dados existentes, **sem mudanças comportamentais na engine**.
Quando o sistema não persiste dados suficientes (ex.: humiliation/growth são
strings em `weekEvents` que reseta toda semana), a aba mostra empty state
explicando o que o usuário precisa fazer pra disparar o evento.

---

## Input

### Tipo
```typescript
// Implícito via GameContext
{
  engine: Engine,            // de useGame().getEngine()
  team: Team,                // engine.getTeam(engine.manager?.teamId)
  view: 'lineage'            // gameState.view
}
```

Dados consumidos da engine (read-only):

```typescript
engine.hallOfLegends: {
  clubId: number,
  slots: Record<SlotKey, { playerId, playerName, slot, slotLabel, stats }>,
  filledCount: number
} | null

engine.weekEvents: string[]   // efêmero, contém marcadores 💀 / ⭐ / 🔥 / 📈 / 💪 / 🧬

team.squad: Array<{
  id, name, age, ovr, heritageTraits?: { garra, talento_natural, lealdade, frieza },
  _heritageApplied?: boolean,
  career?: { totalApps, totalGoals },
  isYouth?: boolean
}>
```

### Origem
- Acessada via sidebar item `LINHAGEM` (Phosphor `TreeStructure`).
- Disponível em ambos modos: técnico + jogador (audit visibility para todos).

### Validação de input
- Se `engine` é null → render fallback "ENGINE NÃO INICIALIZADO".
- Se `team` é null → render fallback "TIME NÃO ENCONTRADO".
- Tabs continuam renderizando mesmo com data vazia (empty states).

---

## Output esperado

Render React de uma view com 4 abas (tabs). Layout:

- **Header** (EfPanel): título "LINHAGEM & LEGADO", subtítulo, badge time, botão SAIR.
- **Tab strip** (EfButton variants): 4 tabs com contadores.
- **Tab content** (EfPanel padding=lg): conteúdo da aba ativa.

### Tabs

#### Tab 1 — HALL DE LENDAS (`hall`)
- Grid 2 colunas com 6 slots fixos.
- Cada slot card:
  - Ícone Phosphor + label slot (`Ídolo Eterno`, `Carrasco`, etc).
  - Status: filled (player name + stats) OU empty (`—` + criteria).
  - Border verde-accent se filled.
- Fonte: `engine.hallOfLegends?.slots` (recomputado fim de cada temporada).

#### Tab 2 — TRAITS HERDADOS (`heritage`)
- Lista de jogadores jovens (`age <= 21`) com `heritageTraits` aplicados.
- Para cada um: nome, idade, OVR + 4 traits (garra/talento_natural/lealdade/frieza)
  com valores numéricos + barra de progresso.
- Empty state: "Aguardando próxima geração de regens. Os jovens da base começam
  a herdar DNA de lendas quando o Hall ganha pelo menos 1 slot preenchido."

#### Tab 3 — HUMILHAÇÕES (`humiliation`)
- Filtra `engine.weekEvents` por prefixo `💀` (cascade) e `🛡️` (survival).
- Mostra eventos da semana atual.
- Empty state honesto: "Sem vexames na semana atual. (Eventos de humilhação são
  efêmeros — só aparecem na semana em que a goleada ocorre. Veja `CHRONICLE` pro
  histórico longo)".

#### Tab 4 — CRESCIMENTOS (`growth`)
- Filtra `engine.weekEvents` por prefixos `⭐ ⚡ 🔥 📈 💪 🧬`.
- Cada item: emoji, descrição, color-coded (verde = positive, amarelo = neutro).
- Empty state: "Sem evolução de jogadores essa semana. Treinos + idade <21 +
  sequência de vitórias aumentam a chance".

---

## Regras de validação

1. [ ] View renderiza sem crash com engine válido.
2. [ ] View renderiza fallback com `engine === null` (sem throw).
3. [ ] Tab `hall` mostra 6 slots (filled OU empty) sempre.
4. [ ] Tab `heritage` lista apenas jogadores com `heritageTraits` truthy.
5. [ ] Tab `humiliation` filtra weekEvents corretamente por prefixo.
6. [ ] Tab `growth` filtra weekEvents corretamente por prefixos.
7. [ ] Cada tab tem empty state quando lista derivada é vazia.
8. [ ] Componente é lazy-imported em App.jsx (não cresce initial chunk).

---

## Forbidden

- ❌ Modificar engine source (`src/engine/*.js`) — view é read-only consumer.
- ❌ Adicionar persistência de eventos novos (humiliation/growth) — fora de escopo.
  Se persistência for desejada, abrir SPEC-167 separada.
- ❌ Adicionar emojis novos no código (mandamento brutal #3) — usar Phosphor.
  (Os emojis citados na filtragem já existem no código antigo da engine; view
  apenas lê eles dos `weekEvents` strings, não os emite).
- ❌ Inline event handlers que mutam engine state.
- ❌ Inline style novos? Permitido para gradient/dynamic only (matching pattern
  vigente em ChronicleView/RivalriesView; design system migration é SPEC-163).
- ❌ Rotas duplicadas no Sidebar — adicionar item APENAS uma vez em cada
  NAV_ITEMS_*.

---

## Implementação

### Arquivos novos
- `src/components/LineageView.jsx` (~450 linhas, lazy export `LineageView`).
- `specs/ui/SPEC-166-lineage-legacy-panel.md` (este arquivo).
- `tests/integration/lineage-view-data.test.js` (~150 linhas, harness Regra 0).

### Arquivos modificados
- `src/App.jsx` — lazy import + case `lineage` no switch.
- `src/components/Sidebar.jsx` — item `lineage` em ambos NAV arrays.

### Dependências internas
- `src/engine/HallOfLegendsSystem.js` — função `compute()` reutilizada pela
  harness pra criar fixture esperada.
- `src/engine/HeritageTraitSystem.js` — função `inherit()` idem.
- `src/components/ui/EfPanel.jsx`, `EfButton.jsx` — primitivos.
- `@phosphor-icons/react` — `TreeStructure`, `Trophy`, `Dna`, `Lightning`,
  `Skull`, `ArrowLeft`.

### Gap de dados conhecido (documentar honestamente)

| Sistema | Estado atual | Aba |
|---------|--------------|-----|
| Hall of Legends | ✅ persistido em `engine.hallOfLegends` | populada |
| Heritage Traits | ✅ persistido em `player.heritageTraits` | populada |
| Humiliation Cascade | ⚠️ apenas strings em `engine.weekEvents` (reset semanal) | mostra semana atual + nota explicativa |
| Growth Events | ⚠️ apenas strings em `engine.weekEvents` (reset semanal) | mostra semana atual + nota explicativa |

**Decisão**: aceitamos o limite e documentamos. Persistência permanente de
humiliation/growth é trabalho separado (engine refactor) — viola constraint
"sem mudanças comportamentais na engine".

---

## Testes esperados

`tests/integration/lineage-view-data.test.js` (Regra 0 — harness Akita):

1. `import LineageView` não crasha sem GameContext provider (smoke).
2. `HallOfLegendsSystem.compute({})` retorna shape `{slots, filledCount}` válido.
3. `compute({ players: [...3 players] })` preenche slots esperados.
4. `inherit({ hall: emptyHall })` retorna traits base (30/30/30/30) sem `inheritedFrom`.
5. `inherit({ hall: filledHall, seed: 42 })` é determinístico (mesma seed → mesmo output).
6. Filter helper `filterHumiliationEvents([...])` retorna apenas itens com 💀/🛡️.
7. Filter helper `filterGrowthEvents([...])` retorna apenas itens com ⭐⚡🔥📈💪🧬.
8. Filter helpers retornam `[]` quando input é `null`/`undefined`/`[]`.

---

## A11y

- Tab strip usa `<EfButton>` com `aria-pressed` (já default no primitivo).
- Empty states usam `<p>` semântico, não apenas div.
- Slot cards do hall tem `<h3>` (slot label) → leitor de tela navega.
- Color coding sempre tem texto secundário (não somente cor).

## Expansão futura (fora deste PR)

- Clicar num slot do hall abre modal com bio completa do jogador.
- Botão "Compartilhar Linhagem" gera PNG da árvore de heritage (similar
  ChronicleView export).
- Persistir humiliation/growth events em `engine.legacyEvents[]` (SPEC-167).
- Filtros por temporada quando persistência existir.

---

**Spec versão**: 1.0
**Criado**: 2026-05-12 (Bloco 2.2 Foundation-First)
**Protocolo**: AKITA SDD
