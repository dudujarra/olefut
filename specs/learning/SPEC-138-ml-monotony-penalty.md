# SPEC-138: ML Reward Shaping — Penalidade de Monotonia Tática

> **Origem**: SPEC-100 (Monotony score) ficou em 0-22 em todas as 5 runs do deep soak. Agente converge para atrator sub-ótimo (trava em counter/offensive) porque não há custo de monotonia no reward. Fix: adicionar penalidade explícita.

---

## O que é

Adiciona penalidade de reward ao agente ML quando ele mantém a mesma tática por mais de N semanas consecutivas. Quebra o atrator observado no deep soak sem forçar mudança — apenas torna exploração vantajosa.

---

## Input

```typescript
{
  currentTactic: string,
  consecutiveWeeks: number,    // semanas com mesma tática
  recentResults: number[],     // win=1, draw=0, loss=-1 últimas 5 semanas
  currentReward: number        // reward base antes da penalidade
}
```

---

## Output esperado

```typescript
{
  adjustedReward: number,      // currentReward + monotonyPenalty
  monotonyPenalty: number,     // 0 se < threshold, negativo se acima
  shouldExplore: boolean       // true se penalidade ativa
}
```

---

## Regras de validação

- [ ] `monotonyPenalty` = 0 quando `consecutiveWeeks` < 6
- [ ] `monotonyPenalty` = -0.5 quando `consecutiveWeeks` ∈ [6, 9]
- [ ] `monotonyPenalty` = -1.5 quando `consecutiveWeeks` ∈ [10, 14]
- [ ] `monotonyPenalty` = -3.0 quando `consecutiveWeeks` ≥ 15
- [ ] Penalidade NÃO aplica se `recentResults` últimas 3 semanas são todas vitórias (tática funcionando → não forçar mudança)
- [ ] `shouldExplore = true` quando `monotonyPenalty < 0`
- [ ] Monotony score (SPEC-100) ≥ 40 em run de 20 temporadas após implementação (atualmente 0-22)
- [ ] TACTIC_STUCK com streak ≥ 15 desaparece dos logs em 20 temporadas

---

## Forbidden

- [ ] Penalidade forçar mudança de tática diretamente (só influi em reward — agente decide)
- [ ] Penalidade aplicar quando time está em sequência positiva (≥ 3 vitórias seguidas)
- [ ] `adjustedReward` ficar abaixo de -10 (penalidade desproporcionada)
- [ ] Taxa de vitória cair após implementação (penalidade não deve prejudicar performance)

---

## Implementação

### Arquivo novo: `src/services/learning/MonotonyRewardPenalty.js`

```javascript
/**
 * SPEC-138: Penalidade de reward por monotonia tática.
 * Quebra atrator observado em deep soak (Monotony SPEC-100 = 0-22).
 */

const PENALTY_TIERS = [
  { minWeeks: 15, penalty: -3.0 },
  { minWeeks: 10, penalty: -1.5 },
  { minWeeks: 6,  penalty: -0.5 },
  { minWeeks: 0,  penalty:  0.0 },
];

/**
 * @param {object} params
 * @param {number} params.consecutiveWeeks
 * @param {number[]} params.recentResults  // win=1, draw=0, loss=-1
 * @param {number} params.currentReward
 * @returns {{ adjustedReward: number, monotonyPenalty: number, shouldExplore: boolean }}
 */
export function applyMonotonyPenalty({ consecutiveWeeks, recentResults = [], currentReward = 0 }) {
    const last3 = recentResults.slice(-3);
    const isWinStreak = last3.length === 3 && last3.every(r => r === 1);

    if (isWinStreak) {
        return { adjustedReward: currentReward, monotonyPenalty: 0, shouldExplore: false };
    }

    const tier = PENALTY_TIERS.find(t => consecutiveWeeks >= t.minWeeks);
    const monotonyPenalty = tier?.penalty ?? 0;

    return {
        adjustedReward: currentReward + monotonyPenalty,
        monotonyPenalty,
        shouldExplore: monotonyPenalty < 0,
    };
}
```

### Arquivo modificado: `src/services/learning/LLMBridge.js`

Integrar penalidade no reward final:
```javascript
import { applyMonotonyPenalty } from './MonotonyRewardPenalty.js';

// dentro de computeReward() ou equivalente:
const { adjustedReward, monotonyPenalty, shouldExplore } = applyMonotonyPenalty({
    consecutiveWeeks: tacticStreak,
    recentResults: managerStats.rollingForm,
    currentReward: baseReward,
});

if (shouldExplore) {
    signals.push({ id: 'EXPLORE_SIGNAL', msg: `Monotonia penalizada: ${monotonyPenalty}`, streak: tacticStreak });
}

return adjustedReward;
```

### Arquivo modificado: `src/services/telemetry/MonotonyDetector.js`

Atualizar threshold do SPEC-100 para refletir penalidade:
```javascript
// ANTES: alertava tactic_stuck > 20 weeks
// DEPOIS: alertar tactic_stuck > 8 weeks (threshold menor, penalidade começa em 6)
if (tacticStreak > 8) {
    results.push({ id: 'TACTIC_STUCK', severity: tacticStreak / 20 });
}
```

---

## Calibração baseada nos dados de deep soak

| Situação observada | Semanas stuck | Penalidade proposta |
|--------------------|--------------|---------------------|
| Normal, aceitável | < 6 semanas | 0 (sem custo) |
| TACTIC_STUCK alerta | 6-9 semanas | -0.5 (leve, explora) |
| TACTIC_STUCK severo | 10-14 semanas | -1.5 (significativo) |
| Counter 86% run-4 | ≥ 15 semanas | -3.0 (forçar exploração) |

Faixa de rewards observados no deep soak: ML_TRANSFER_REWARD entre -13 e +15. Penalidade de -3.0 é ~20% do reward máximo — significativa mas não dominante.

---

## Testes esperados

```javascript
import { applyMonotonyPenalty } from '../src/services/learning/MonotonyRewardPenalty.js';

describe('SPEC-138: ML Monotony Penalty', () => {

  test('sem penalidade abaixo de 6 semanas', () => {
    const r = applyMonotonyPenalty({ consecutiveWeeks: 5, recentResults: [], currentReward: 1.0 });
    expect(r.monotonyPenalty).toBe(0);
    expect(r.adjustedReward).toBe(1.0);
  });

  test('penalidade leve entre 6-9 semanas', () => {
    const r = applyMonotonyPenalty({ consecutiveWeeks: 8, recentResults: [], currentReward: 1.0 });
    expect(r.monotonyPenalty).toBe(-0.5);
    expect(r.adjustedReward).toBe(0.5);
  });

  test('penalidade média entre 10-14 semanas', () => {
    const r = applyMonotonyPenalty({ consecutiveWeeks: 12, recentResults: [], currentReward: 1.0 });
    expect(r.monotonyPenalty).toBe(-1.5);
  });

  test('penalidade máxima acima de 15 semanas', () => {
    const r = applyMonotonyPenalty({ consecutiveWeeks: 20, recentResults: [], currentReward: 1.0 });
    expect(r.monotonyPenalty).toBe(-3.0);
  });

  test('sem penalidade em win streak (tática funcionando)', () => {
    const r = applyMonotonyPenalty({
      consecutiveWeeks: 12,
      recentResults: [1, 1, 1],  // 3 vitórias seguidas
      currentReward: 1.0
    });
    expect(r.monotonyPenalty).toBe(0);
    expect(r.shouldExplore).toBe(false);
  });

  test('shouldExplore true quando penalidade ativa', () => {
    const r = applyMonotonyPenalty({ consecutiveWeeks: 8, recentResults: [-1, 0, -1], currentReward: 0 });
    expect(r.shouldExplore).toBe(true);
  });

  test('adjustedReward nunca abaixo de -10', () => {
    const r = applyMonotonyPenalty({ consecutiveWeeks: 100, recentResults: [], currentReward: -5 });
    expect(r.adjustedReward).toBeGreaterThan(-10);
  });

  test('penalidade não afeta resultado se win streak parcial (2 vitórias)', () => {
    const r = applyMonotonyPenalty({
      consecutiveWeeks: 10,
      recentResults: [-1, 1, 1],  // só 2 vitórias, não 3
      currentReward: 1.0
    });
    expect(r.monotonyPenalty).toBe(-1.5); // penalidade normal
  });
});
```

---

## Harness de validação

```bash
#!/bin/bash
# harness/SPEC-138-validate.sh
cd /Users/dudujarra/Documents/OléFUT
npm test -- --testNamePattern="SPEC-138" 2>&1
exit $?
```

**Gate CI**: todos os 8 testes passam + Monotony score ≥ 40 em run de 20 temporadas.
