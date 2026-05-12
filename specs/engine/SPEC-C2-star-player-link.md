# SPEC-C2: Star Player Link (Groundwork)

> Status: **DRAFT — groundwork only, full unified mode migration deferred**
> Fase: C2 — Tornar MEMORÁVEL

---

## O que é

Layer opcional sobre Manager mode: player elege 1 jogador da equipe como **estrela** (`engine.starPlayerId`). Sistemas existentes (PlayerCareer, traits, growth events) podem usar esta referência para amplificar narrativa. Sem migration breaking — flag optional.

Não é o modo unificado completo (que mergeia Player/Manager submode). É o **alicerce** para tal: estrutura de dados + helpers pra outros sistemas (Chronicle, MidMatchCard, Achievements) referenciarem o jogador estrela.

---

## Input/Output

```typescript
// State
engine.starPlayerId: number | null

// Helpers
electStarPlayer(engine, playerId): { success, msg }
getStarPlayer(engine): player | null
getStarPlayerStats(engine): { apps, goals, rating, age } | null
applyToStarPlayer(engine, effect): { applied, changes }
```

---

## Regras

### 1. Eleição
- [ ] `electStarPlayer(engine, playerId)` valida que player está no squad atual
- [ ] Não pode eleger player de outro time
- [ ] 1 estrela por vez (substituição overwrite)
- [ ] Nullable: passar null limpa

### 2. Persistência
- [ ] `engine.starPlayerId` campo em save
- [ ] Default: null (modo Manager puro, sem mudança comportamental)

### 3. Helpers seguros
- [ ] `getStarPlayer` retorna null se starPlayerId ausente ou player não existe mais (vendido, aposentado)
- [ ] `getStarPlayerStats` retorna null gracefully
- [ ] `applyToStarPlayer` no-op se star inexistente

### 4. Effect application
- [ ] moralDelta → player.moral (clamp 0-100)
- [ ] energyDelta → player.energy (clamp 0-100)
- [ ] xpDelta → player.xp (sem clamp upper, mas >= 0)

### 5. Forbidden
- [ ] Não muta squad order/posições
- [ ] Não cria player novo
- [ ] Não permite multi-star

---

## Implementação

- **Novo**: `src/engine/StarPlayerLink.js` (~90 LOC)
- **Modifica**: `src/engine/engine.js` (+1 LOC: `this.starPlayerId = null`)
- **Novo harness**: `tests/specs/SPEC-C2-star-player-link.test.js`

---

## Não-objetivos (YAGNI)

- UI eleição (SPEC-C2.2 PR futuro)
- Migration de saves antigos pra modo unificado
- Replace de ProPlayer logic

---

**SPEC versão**: 1.0
