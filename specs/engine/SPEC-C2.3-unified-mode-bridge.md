# SPEC-C2.3: Unified Mode Bridge (Player+Manager via Star)

> Status: **DRAFT — bridge layer, sem migration breaking**
> Continua SPEC-C2 (groundwork AKITA-281) + SPEC-C2.2 (UI eleição + amplify)

---

## O que é

Bridge layer que permite saves Manager mode com `starPlayerId` set acessar a **perspectiva Player** sobre seu jogador estrela (carreira individual, atributos detalhados, relacionamentos boss/fans/teammates) sem migrar save schema nem quebrar saves antigos.

Cria adapter `ProPlayerStubFromSquadPlayer` que envelopa um `squad[i]` em interface compatible com `ProPlayer`. Helper `getUnifiedView(engine)` retorna estado consolidado.

Resolve gap C2.3 do GAME-DESIGN-ROADMAP em **escopo bridge** (não migration full, que ficaria SPEC-C2.4 PR dedicado de 10h+).

---

## Input

```typescript
engine: {
  mode: 'manager',
  starPlayerId: number | null,
  manager: { teamId },
  ...
}
```

---

## Output

```typescript
getUnifiedView(engine): {
  isUnified: boolean,            // true se starPlayerId set + mode manager
  manager: { teamId, name, money },
  star: { id, name, position, ovr, age, relationships, careerStats } | null,
  effectivePerspective: 'manager' | 'unified',
}

ProPlayerStubFromSquadPlayer(squadPlayer, opts): ProPlayer-like
```

---

## Regras

### 1. Modo
- [ ] `isUnified` true se `mode === 'manager' && starPlayerId != null && squad contém player`
- [ ] Player mode existente NÃO afetado
- [ ] Manager mode sem star → operates classic (isUnified false)

### 2. Stub
- [ ] Stub maps `squad[i].ovr` para skills aproximados (tech/pace/power/vision)
- [ ] Relationships default 50 quando ausentes em squad player
- [ ] Career stats agregam de `squad[i].seasonApps/seasonGoals` etc

### 3. Backward compat
- [ ] Saves antigos sem starPlayerId continuam funcionando
- [ ] Engine constructor já inicializa starPlayerId = null

### 4. Não-objetivos
- [ ] Não substitui ProPlayer class quando mode === 'player'
- [ ] Não cria DOM/UI nova (apenas data layer)
- [ ] Save schema unchanged

### 5. Forbidden
- [ ] Mutar squad player original via stub
- [ ] Importar React/DOM

---

## Implementação

- **Novo**: `src/engine/UnifiedModeBridge.js` (~120 LOC)
- **Novo harness**: `tests/specs/SPEC-C2.3-unified-bridge.test.js`

UI surface (opcional): DashboardView card "STAR PROGRESS" mostrando stub stats — SPEC-C2.4 PR futuro.

---

**SPEC versão**: 1.0
