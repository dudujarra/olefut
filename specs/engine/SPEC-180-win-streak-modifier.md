# SPEC-180: Win Streak Modifier System

> Status: **DRAFT — aguarda aprovação Dudu + fechamento Bloco 1 Foundation**
> Owner: Dudu
> Created: 2026-05-12
> Eixo brainstorm: Emergent Narrative + Retention
> Sibling: SPEC-077 (LossStreakResponseSystem)

---

## O que é

Detecta sequências consecutivas de **vitórias** por time e aplica modificadores temporários positivos: boost atributos, ganho de moral, eventos de imprensa, e — em streaks longos — pressão de board por expectativa elevada. Simétrico ao SPEC-077 (loss streak), criando dinâmica drama embalo↔crise.

Hipótese mensurável (do brainstorming): variância de performance entre saves com feature ativada vs desativada **> 15%** em A/B test de 100 temporadas simuladas.

---

## Input

### Tipo
```typescript
{
  teamId: number,        // ID time
  result: 'W' | 'D' | 'L', // resultado partida recém-encerrada
  currentMorale: number, // 0-100, moral atual do elenco
  currentTension: number // 0-100, tensão atual board
}
```

### Origem
Chamado de `engine.js` no hook `_onMatchResult()` após cada partida resolvida. Idêntico ao callsite de `LossStreakResponseSystem.recordResult()`.

### Validação de input
- `teamId`: integer válido, presente em `data.js` teams
- `result`: exatamente `'W'`, `'D'` ou `'L'`
- `currentMorale`: 0-100
- `currentTension`: 0-100

---

## Output esperado

### Tipo
```typescript
{
  streakLength: number,        // count atual após este resultado
  severity: 'none' | 'mild' | 'strong' | 'phenom',
  attrBoost: number,           // 0, +2, +4, +6
  moraleDelta: number,         // 0, +5, +10, +15
  tensionDelta: number,        // 0, 0, -3, +5 (phenom sobe expectativa!)
  mediaEvent: boolean,         // true apenas em phenom
  descriptor: string           // PT-BR human-readable
}
```

### Exemplo concreto

Time com 5 vitórias seguidas:
```json
{
  "streakLength": 5,
  "severity": "strong",
  "attrBoost": 4,
  "moraleDelta": 10,
  "tensionDelta": -3,
  "mediaEvent": false,
  "descriptor": "Embalo forte — time joga solto"
}
```

Time com 8 vitórias seguidas:
```json
{
  "streakLength": 8,
  "severity": "phenom",
  "attrBoost": 6,
  "moraleDelta": 15,
  "tensionDelta": 5,
  "mediaEvent": true,
  "descriptor": "Fenômeno — imprensa em delírio, board com expectativa alta"
}
```

Reset em derrota:
```json
{
  "streakLength": 0,
  "severity": "none",
  "attrBoost": 0,
  "moraleDelta": 0,
  "tensionDelta": 0,
  "mediaEvent": false,
  "descriptor": "Sem embalo"
}
```

---

## Regras de validação

Checklist obrigatória. O output **deve** satisfazer todas:

### 1. Thresholds severity
- [ ] `streakLength >= 8` → severity = 'phenom'
- [ ] `streakLength 5-7` → severity = 'strong'
- [ ] `streakLength 3-4` → severity = 'mild'
- [ ] `streakLength 0-2` → severity = 'none'

### 2. Modificadores por severity
- [ ] `severity === 'none'` → todos modifiers = 0
- [ ] `severity === 'mild'` → attrBoost=2, moraleDelta=5, tensionDelta=0
- [ ] `severity === 'strong'` → attrBoost=4, moraleDelta=10, tensionDelta=-3
- [ ] `severity === 'phenom'` → attrBoost=6, moraleDelta=15, tensionDelta=+5, mediaEvent=true

### 3. State management
- [ ] Resultado 'W' incrementa streak em +1
- [ ] Resultado 'D' reseta streak para 0
- [ ] Resultado 'L' reseta streak para 0
- [ ] Streak persiste por `teamId` independentemente (Map)

### 4. Determinismo
- [ ] Mesma sequência de inputs → mesmo output (sem usar `Math.random`)
- [ ] Compatível com `rng.js` seed (se randomness for adicionada futuramente)

### 5. Integração engine
- [ ] `WinStreak.recordResult()` chamado paralelo a `LossStreak.recordResult()` em `_onMatchResult`
- [ ] `WinStreak.getModifiersForMatch(teamId)` chamado pré-partida em pipeline cálculo attrs

### 6. Feature flag
- [ ] Sistema desativável via `ENABLE_WIN_STREAK` (default `false` até validado A/B)
- [ ] Quando flag off: `recordResult` no-op, `getModifiersForMatch` retorna `{ attrBonus: 0 }`

### 7. Estatística (hipótese)
- [ ] A/B test 100 temporadas: variância pontos final com feature - sem feature > 15%
- [ ] >80% saves de 5 temporadas têm pelo menos 1 streak `strong`
- [ ] 15-30% saves de 5 temporadas têm pelo menos 1 streak `phenom`

### 8. Determinístico golden master
- [ ] Stryker baseline preservado com flag off
- [ ] Stryker baseline com flag on documentado separado

---

## Forbidden

### ❌ Modificadores fora do range
- [ ] `attrBoost > 6` ou `attrBoost < 0` em qualquer severity
- [ ] `moraleDelta` empurra moral acima de 100 (deve clampar)
- [ ] `tensionDelta` empurra tension abaixo de 0 ou acima de 100

### ❌ State leak
- [ ] Streak de teamId=1 afeta teamId=2 (vazamento entre times)
- [ ] Streak persiste através de game reset / new save

### ❌ Acoplamento UI
- [ ] WinStreakModifierSystem.js importa React, JSX ou DOM
- [ ] Lógica de streak em componente `<MatchView />` ou similar
- [ ] Inline styles ou emojis no código novo

### ❌ Quebra simetria
- [ ] Reset em D mas não em L (deve resetar em ambos)
- [ ] Streak não reseta após partida não-W

### ❌ Override silencioso
- [ ] `getModifiersForMatch` retorna boost mesmo com flag desligado
- [ ] Modifier aplicado sem registro em log / telemetria

---

## Implementação

### Arquivos
- **Novo**: `src/engine/WinStreakModifierSystem.js` (~90 LOC)
- **Modifica**: `src/engine/engine.js` (+12 LOC: import + hooks)
- **Novo harness**: `tests/specs/SPEC-180-win-streak.test.js` (~150 LOC)
- **Novo A/B**: `tests/statistical/win-streak-ab.test.js` (~80 LOC, run via `npm run test:soak`)

### Interface pública WinStreakModifierSystem.js
```javascript
export function recordResult({ teamId, result })
export function getCurrentStreak(teamId)
export function evaluate({ teamId, streakLength, currentMorale, currentTension })
export function getModifiersForMatch(teamId)
export function reset(teamId)  // para testes
export function resetAll()     // para testes
```

### Dependências internas
- `rng.js` — uso futuro (severity tie-breaker)
- `BoardTensionSystem.js` — aplica `tensionDelta`
- `PressConference.js` — recebe `mediaEvent`
- Nenhuma dep externa nova

### Feature flag location
`src/engine/featureFlags.js` (criar se não existir) — `ENABLE_WIN_STREAK: false` default.

---

## Testes esperados

Cada teste valida exatamente uma regra. Mínimo 10:

```javascript
describe('SPEC-180: Win Streak Modifier System', () => {

  test('rule 1.1: streakLength >= 8 → phenom', () => {
    for (let i = 0; i < 8; i++) WinStreak.recordResult({ teamId: 1, result: 'W' });
    expect(WinStreak.evaluate({ teamId: 1, streakLength: 8 }).severity).toBe('phenom');
  });

  test('rule 1.2: streakLength 5 → strong', () => {});
  test('rule 1.3: streakLength 3 → mild', () => {});
  test('rule 1.4: streakLength 2 → none', () => {});

  test('rule 2: strong gives attrBoost=4 moraleDelta=10', () => {});

  test('rule 3.1: W increments streak', () => {});
  test('rule 3.2: D resets streak to 0', () => {});
  test('rule 3.3: L resets streak to 0', () => {});
  test('rule 3.4: streaks isolated per teamId', () => {
    WinStreak.recordResult({ teamId: 1, result: 'W' });
    WinStreak.recordResult({ teamId: 2, result: 'L' });
    expect(WinStreak.getCurrentStreak(1)).toBe(1);
    expect(WinStreak.getCurrentStreak(2)).toBe(0);
  });

  test('rule 4: determinism (same seq → same output)', () => {});

  test('rule 6: feature flag off → recordResult no-op', () => {});

  test('forbidden: attrBoost never exceeds 6', () => {});

  test('forbidden: streak does not leak between teamIds', () => {});

  test('A/B hypothesis: 100-season variance > 15%', () => {
    const withFeature = simulate({ seasons: 100, enableWinStreak: true });
    const withoutFeature = simulate({ seasons: 100, enableWinStreak: false });
    const varDelta = Math.abs(variance(withFeature) - variance(withoutFeature));
    expect(varDelta / variance(withoutFeature)).toBeGreaterThan(0.15);
  });

});
```

---

## Validação (playtest)

**Após implementação + flag on em build de teste:**

1. **A/B simulado**: harness `npm run test:soak` deve passar (`win-streak-ab.test.js`)
2. **Playtest humano**: 5 humanos BR jogam 3 temporadas cada com flag on
   - Pergunta qualitativa: "você sentiu o time em embalo?"
   - Threshold sucesso: 4/5 respondem sim em pelo menos 1 streak
3. **Métrica engine**: longest_win_streak médio sobe de baseline X para X+2 mínimo

---

## Rollback path

- Feature flag off via config = sistema vira no-op
- Sem mudança schema de save (state em Map em memória, não persiste)
- Reverter PR não requer migration

---

## Riscos

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Quebra golden master | 🔴 Alto | Flag off default + A/B com baseline separado |
| Streak desbalanceia liga | 🟡 Médio | A/B 100 seasons; ajustar boosts se variância >40% |
| Sobrepõe BoardTensionSystem | 🟡 Médio | Test isolado mocking BoardTension |
| **Bloco 1 não fechado** | 🔴 Hard block | Implementação BLOQUEADA até RFCT-017 done |

---

## Não-objetivos (YAGNI)

- ❌ Streak por competição (Brasileirão vs Libertadores) — futuro SPEC se demanda real
- ❌ Streak de clean sheet defensivo — variante futura
- ❌ Persistência cross-save de streaks — não faz sentido
- ❌ UI nova dedicada — surfacing via SquadView/DashboardView existentes
- ❌ LLM narration de streak — usa templates PT-BR fixos

---

## Estimativa

- LOC novo: ~330 (sistema + testes + spec)
- Tempo trabalho focado: 4-6h
- Dependência hard: Bloco 1 Foundation done

---

## Checklist preenchimento

- [x] Seção "O que é" com 1-2 frases claras
- [x] Input tipado
- [x] Output tipado + exemplo concreto
- [x] Validação: 8+ regras
- [x] Forbidden: 5+ casos
- [x] Implementação aponta arquivos reais
- [x] Testes: 10+ casos
- [x] Validação playtest definida
- [x] Rollback path explícito

---

**SPEC versão**: 1.0
**Protocolo**: AKITA SDD + Foundation-First
**Bloqueado por**: Bloco 1 Foundation (RFCT-004 a RFCT-017)
