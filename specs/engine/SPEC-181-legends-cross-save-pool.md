# SPEC-181: Legends Cross-Save Pool

> Status: **DRAFT — aguarda aprovação Dudu + fechamento Bloco 1 Foundation**
> Owner: Dudu
> Created: 2026-05-12
> Eixo brainstorm: Emergent Narrative + Retention
> Estende: SPEC-078 (HallOfLegendsSystem)

---

## O que é

Persiste lendas (jogadores canonizados via HallOfLegendsSystem ao se aposentarem) em `localStorage` cross-save. Em saves novos, lendas reaparecem como NPCs reaproveitáveis: treinadores, scouts, comentaristas. Cria momento de reconhecimento ("eu lembro desse cara!") entre saves.

Hipótese mensurável: > 50% saves de 3+ temporadas encontram ao menos 1 lenda de save anterior. Playtest qualitativo: 4/5 humanos relatam reconhecimento.

---

## Input

### Tipo (markRetired)
```typescript
{
  playerId: number,
  saveId: string,       // UUID do save atual
  retiredYear: number,
  hallEntry: {           // output de HallOfLegendsSystem.compute slot match
    slot: 'idoloEterno' | 'carrasco' | 'goleirao' | 'criaDaBase' | 'traidor' | 'lendaTragica',
    slotLabel: string,
    playerName: string,
    stats: { apps: number, goals: number, goalsVsThisClub: number }
  },
  finalAttrs: {
    leadership: number,  // 0-100 → eligibilidade coach
    technique: number,   // 0-100 → eligibilidade scout
    charisma: number     // 0-100 → eligibilidade commentator
  }
}
```

### Tipo (recruitableLegends)
```typescript
{
  role: 'coach' | 'scout' | 'commentator',
  count: number,         // máximo retornar
  excludeSaveId?: string // excluir lendas do save atual
}
```

### Origem
- `markRetired`: chamado de `PlayerCareer.retirePlayer()` após hall computation
- `recruitableLegends`: chamado de `CoachProposalSystem`, `ScoutSystem` em saves novos

---

## Output esperado

### Tipo storage shape
```typescript
{
  version: 1,
  pool: Array<{
    id: string,           // UUID estável da lenda
    name: string,
    sourceSaveId: string,
    retiredYear: number,
    slot: string,
    stats: object,
    eligibleRoles: Array<'coach' | 'scout' | 'commentator'>,
    addedAt: number       // timestamp ISO para FIFO eviction
  }>
}
```

### Tipo recruitableLegends return
```typescript
Array<{
  legendId: string,
  name: string,
  role: 'coach' | 'scout' | 'commentator',
  bio: string,            // PT-BR template: "Ex-{slot} do {clubHistory}, aposentou em {year}"
  baseSalary: number,     // calculado de stats
  attrs: { ...role-specific }
}>
```

### Exemplo concreto

Após Ronaldo se aposentar como `idoloEterno`:
```json
{
  "version": 1,
  "pool": [
    {
      "id": "lgd-abc123",
      "name": "Ronaldo",
      "sourceSaveId": "save-2026-uuid",
      "retiredYear": 2034,
      "slot": "idoloEterno",
      "stats": { "apps": 412, "goals": 287 },
      "eligibleRoles": ["coach", "commentator"],
      "addedAt": 1747000000000
    }
  ]
}
```

Save novo, busca coach:
```json
[
  {
    "legendId": "lgd-abc123",
    "name": "Ronaldo",
    "role": "coach",
    "bio": "Ex-Ídolo Eterno do Cruzeiro (412 jogos, 287 gols), aposentou em 2034",
    "baseSalary": 850000,
    "attrs": { "tactical": 75, "manmgmt": 88, "youth": 65 }
  }
]
```

---

## Regras de validação

### 1. Storage
- [ ] `localStorage.elifoot_legends_pool` usa key fixa
- [ ] Schema versionado com `version: 1`
- [ ] Migrações futuras via `version` bump

### 2. Eligibilidade roles (computada a partir de attrs finais)
- [ ] `leadership >= 70` → eligível coach
- [ ] `technique >= 75` → eligível scout
- [ ] `charisma >= 65` → eligível commentator
- [ ] Lenda pode ter 0-3 roles eligíveis

### 3. FIFO eviction
- [ ] Pool tem máximo 200 lendas
- [ ] Ao atingir 200, mais antiga (menor `addedAt`) é removida ao adicionar nova
- [ ] Remoção logada (console.info em dev mode)

### 4. Isolation
- [ ] `recruitableLegends({ excludeSaveId: currentSave })` nunca retorna lendas do save atual
- [ ] Save atual recebe APENAS lendas de saves diferentes

### 5. Pool resiliente
- [ ] localStorage cheio (QuotaExceededError) → catch + fallback to no-op
- [ ] JSON corrompido → reset pool com warn
- [ ] Schema desconhecido (version mismatch) → reset pool com warn

### 6. Distribution
- [ ] `recruitableLegends({ count: 3, role: 'coach' })` retorna até 3
- [ ] Seleção determinística por `rng.js` com seed do save atual (reproduzível)

### 7. Privacy
- [ ] Pool é local-only (zero network call)
- [ ] Não envia dados ao GitHub Pages backend (não existe backend)

### 8. Integração save lifecycle
- [ ] `markRetired` chamado uma vez por aposentadoria
- [ ] `recruitableLegends` chamado em proposal generation, não em loop hot path

---

## Forbidden

### ❌ Vazamento save atual
- [ ] Lenda do save atual aparece como recrutável no mesmo save
- [ ] `excludeSaveId` ignorado em qualquer call

### ❌ Crash em storage
- [ ] Pool indisponível → throw que quebra game (deve degradar graceful)
- [ ] localStorage write sem try-catch

### ❌ Pool explosão
- [ ] Pool ultrapassa 200 entries
- [ ] Pool ultrapassa 5MB de localStorage budget

### ❌ Acoplamento UI
- [ ] LegendsCrossSavePool.js importa React/DOM
- [ ] Bio string usa emoji

### ❌ Conteúdo inválido
- [ ] Bio em inglês (deve ser PT-BR)
- [ ] Salary < 0
- [ ] Role string fora do enum

---

## Implementação

### Arquivos
- **Novo**: `src/engine/LegendsCrossSavePool.js` (~120 LOC)
- **Modifica**: `src/engine/PlayerCareer.js` (+8 LOC: hook on retire)
- **Modifica**: `src/engine/CoachProposalSystem.js` (+15 LOC: merge candidates)
- **Modifica**: `src/engine/engine.js` (+5 LOC: bootstrap)
- **Novo harness**: `tests/specs/SPEC-181-legends-pool.test.js` (~180 LOC)

### Interface pública LegendsCrossSavePool.js
```javascript
export function markRetired({ playerId, saveId, retiredYear, hallEntry, finalAttrs })
export function recruitableLegends({ role, count, excludeSaveId })
export function getPool()           // debug/test
export function resetPool()         // dev/test only
export function exportPool()        // user backup
export function importPool(json)    // user restore
```

### Storage key
`localStorage.elifoot_legends_pool` — JSON serialized.

### Dependências internas
- `HallOfLegendsSystem.js` — não acoplado, recebe entry pronta
- `PlayerCareer.js` — hook on retire
- `CoachProposalSystem.js` — merge legends em candidate pool
- `rng.js` — seleção determinística

---

## Testes esperados

```javascript
describe('SPEC-181: Legends Cross-Save Pool', () => {

  beforeEach(() => LegendsPool.resetPool());

  test('rule 1: pool persists with version=1', () => {});

  test('rule 2.1: leadership>=70 → coach eligible', () => {});
  test('rule 2.2: technique>=75 → scout eligible', () => {});
  test('rule 2.3: charisma>=65 → commentator eligible', () => {});

  test('rule 3: FIFO eviction at 200', () => {
    for (let i = 0; i < 201; i++) LegendsPool.markRetired(stubLegend(i));
    expect(LegendsPool.getPool().length).toBe(200);
  });

  test('rule 4: excludeSaveId filters current save', () => {});

  test('rule 5.1: corrupted JSON → graceful reset', () => {
    localStorage.setItem('elifoot_legends_pool', '{invalid');
    const pool = LegendsPool.getPool();
    expect(pool.length).toBe(0);
  });

  test('rule 5.2: QuotaExceeded handled gracefully', () => {});

  test('rule 6: recruitableLegends respects count limit', () => {});

  test('rule 6.2: selection deterministic with seed', () => {});

  test('forbidden: same-save legend not recruitable in source save', () => {});

  test('forbidden: bio always PT-BR', () => {});

  test('integration: full retirement → cross-save recruit flow', () => {
    // Save A: retire Ronaldo
    LegendsPool.markRetired({ saveId: 'save-A', /*...*/ });
    // Save B: recruit candidates
    const candidates = LegendsPool.recruitableLegends({
      role: 'coach',
      count: 5,
      excludeSaveId: 'save-B'
    });
    expect(candidates.find(c => c.name === 'Ronaldo')).toBeTruthy();
  });

});
```

---

## Validação (playtest)

1. **Manual cross-save**: tester joga save A 5 temporadas, aposenta 3+ lendas, inicia save B, busca coach → reconhece nome.
2. **Métrica engine**: telemetria `legendsEncounteredPerSave > 0.5` médio em N saves
3. **Pergunta qualitativa**: "você reconheceu algum jogador de save anterior?" → 4/5 sim

---

## Rollback path

- Feature flag `ENABLE_LEGENDS_POOL: false` → markRetired no-op, recruitableLegends retorna `[]`
- User pode limpar pool via `LegendsPool.resetPool()` exposto em debug menu
- Sem migration: storage key novo, não afeta saves existentes

---

## Riscos

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| localStorage 5MB quota | 🟡 Médio | FIFO 200 cap (~50KB típico) |
| Save users diferentes contaminação | 🔴 Alto | excludeSaveId obrigatório + test |
| Schema break em upgrade | 🟡 Médio | version field + reset gracioso |
| Lendas dominarem candidate pool (no NPCs gerados) | 🟡 Médio | Coach proposal limita lendas a 30% do pool |
| **Bloco 1 não fechado** | 🔴 Hard block | Implementação BLOQUEADA |

---

## Não-objetivos (YAGNI)

- ❌ Sync cloud (Firebase, etc) — local-only por design
- ❌ Compartilhamento entre players via export-import manual fica de lado em v1
- ❌ Lendas viram managers competidores — apenas NPCs reativos
- ❌ Filhos/relações cross-save — separate SPEC futura
- ❌ UI dedicada de browse pool — surface only via candidate selection

---

## Estimativa

- LOC novo: ~470 (sistema + testes + spec)
- Tempo trabalho focado: 5-8h
- Dependência hard: Bloco 1 Foundation done + SPEC-180 validado (pipeline SDD comprovado)

---

## Checklist preenchimento

- [x] Seção "O que é" com 1-2 frases claras
- [x] Input tipado
- [x] Output tipado + exemplo concreto
- [x] Validação: 8+ regras
- [x] Forbidden: 5+ casos
- [x] Implementação aponta arquivos reais
- [x] Testes: 12+ casos
- [x] Validação playtest definida
- [x] Rollback path explícito

---

**SPEC versão**: 1.0
**Protocolo**: AKITA SDD + Foundation-First
**Bloqueado por**: Bloco 1 Foundation + SPEC-180 validation
