# SPEC-A1: Rookie Sidebar (1ª Temporada)

> Status: **DRAFT — implementação em mesmo PR (Regra 0 Akita)**
> Owner: Dudu
> Created: 2026-05-12
> Fase: A — Tornar JOGÁVEL (GAME-DESIGN-ROADMAP-2026-05-12 linha 147)
> Bloqueia: nada (Bloco 1 Foundation já done)

---

## O que é

Reduz sidebar a **3 entradas core + tutorial** durante "fase rookie" (1ª temporada, antes de 5 vitórias). Outras 9 views ficam ocultas até marcos específicos: 1ª vitória → COLETIVA, semana 3 → MERCADO, 3 vitórias → CONQUISTAS, fim temp → CRÔNICA + RIVALIDADES + SAVES + AUTOPLAY, etc.

Resolve problema #3 do GAME-DESIGN-ROADMAP: sidebar de 13 views = paralisia de novato.

---

## Input

`saveState` derivado de:
```typescript
{
  seasonsCompleted: number,
  wins: number,            // de engine.managerStats.wins
  weekNumber: number,
  titlesWon: number,
  totalTransfers: number,
  managerReputation: number,
  unlockedViews: string[]
}
```

---

## Output esperado

`canAccessRookie(viewId, saveState)` retorna:
```typescript
{
  unlocked: boolean,
  reason?: string,
  unlockCondition?: { description: string }
}
```

`isRookie(saveState)` retorna:
```typescript
boolean
```

---

## Regras de validação

### 1. Definição rookie
- [ ] `isRookie` true se `seasonsCompleted < 1 && wins < 5`
- [ ] `isRookie` false se `seasonsCompleted >= 1 OU wins >= 5`

### 2. Core rookie views
- [ ] `dashboard`, `squad`, `standings` sempre acessíveis em rookie
- [ ] `tutorial` sempre acessível (rookie ou não)

### 3. Rookie milestones
- [ ] `press` desbloqueado quando `wins >= 1`
- [ ] `market` desbloqueado quando `weekNumber >= 3`
- [ ] `achievements` desbloqueado quando `wins >= 3`
- [ ] `chronicle` desbloqueado quando `seasonsCompleted >= 1`
- [ ] `rivalries` desbloqueado quando `seasonsCompleted >= 1`
- [ ] `saves` desbloqueado quando `seasonsCompleted >= 1 OU wins >= 5`
- [ ] `shop` desbloqueado quando `titlesWon >= 1`
- [ ] `autoplay` desbloqueado quando `seasonsCompleted >= 1`
- [ ] `lineage` desbloqueado quando `seasonsCompleted >= 2`

### 4. Fall-through não-rookie
- [ ] Quando `isRookie` false, `canAccessRookie` delega para `canAccess` (sistema existente SPEC-135)

### 5. Sidebar integration
- [ ] Sidebar.jsx filtra `NAV_ITEMS_MANAGER` via `canAccessRookie`
- [ ] Modo player (`NAV_ITEMS_PLAYER`) não afetado por rookie (já é minimal)

### 6. Persistência
- [ ] Uma view desbloqueada permanece visível (não some se condição reverter, salvo via SPEC-135 `persistUnlock`)

### 7. Backwards compat
- [ ] `canAccess` API existente preservada (zero breakage)
- [ ] CORE_VIEWS de SPEC-135 preservado para uso geral

### 8. Determinismo
- [ ] Mesmo `saveState` → mesma decisão de visibilidade

---

## Forbidden

### ❌ Quebrar SPEC-135
- [ ] Mudar `canAccess` signature
- [ ] Remover de `CORE_VIEWS`

### ❌ Hard-block tutorial
- [ ] Tutorial nunca pode ficar bloqueado (escape hatch)

### ❌ Esconder dashboard
- [ ] `dashboard` nunca filtrado

### ❌ Stale após exit rookie
- [ ] Player com 5 wins continua vendo sidebar limitada

### ❌ React/DOM em engine
- [ ] ViewUnlockSystem.js permanece headless

---

## Implementação

### Arquivos
- **Modifica**: `src/engine/ViewUnlockSystem.js` (+~60 LOC)
- **Modifica**: `src/components/Sidebar.jsx` (+~15 LOC: filter)
- **Novo harness**: `tests/specs/SPEC-A1-rookie-sidebar.test.js` (~120 LOC)

### Interface pública nova
```javascript
export function isRookie(saveState)
export function canAccessRookie(viewId, saveState)
export { ROOKIE_CORE_VIEWS, ROOKIE_UNLOCK_CONDITIONS }
```

---

## Testes esperados

```javascript
describe('SPEC-A1: Rookie Sidebar', () => {
  test('rule 1: isRookie true at fresh save', () => {});
  test('rule 1: isRookie false after 1 season', () => {});
  test('rule 1: isRookie false after 5 wins', () => {});
  test('rule 2: dashboard always accessible in rookie', () => {});
  test('rule 2: tutorial always accessible', () => {});
  test('rule 3: press unlocks at 1 win', () => {});
  test('rule 3: market unlocks at week 3', () => {});
  test('rule 3: achievements unlock at 3 wins', () => {});
  test('rule 3: chronicle unlocks at 1 season', () => {});
  test('rule 4: non-rookie falls through to canAccess', () => {});
  test('rule 5: sidebar filters NAV_ITEMS in rookie mode', () => {});
  test('rule 7: canAccess SPEC-135 untouched', () => {});
});
```

---

## Validação

- Manual: novo save → sidebar deve mostrar apenas DASHBOARD, PLANTEL, TABELA, TUTORIAL
- Após 1 vitória: COLETIVA aparece
- Após semana 3: MERCADO aparece
- Após fim de temp: CRÔNICA, RIVALIDADES, SAVES, AUTOPLAY aparecem (rookie OFF)

---

## Rollback

- Sidebar tem `if (!rookie) return all items` — sem filter
- Reverter PR não afeta saveState

---

**SPEC versão**: 1.0
**Protocolo**: AKITA SDD + Game Design Roadmap Fase A
