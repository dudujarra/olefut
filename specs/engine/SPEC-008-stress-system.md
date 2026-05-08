# SPEC-008: Stress & Mental Health System

**Criticidade**: 🟡 ALTO  
**Módulo**: `src/engine/PlayerCareer.js`  
**Linhas de código**: ~100

---

## O que é

Sistema de stress de jogadores. Triggers: sequência ruim, bench prolongado, salário não pago, pressão. Stress → moral ↓, chance de saída, bad performances.

---

## Triggers stress

| Trigger | Stress +5 |
|---------|-----------|
| 3+ derrotas seguidas | +5 |
| 5+ semanas banco | +8 |
| Salário não pago | +10 |
| Perdeu titularidade | +5 |
| 2+ cartões amarelo/jogo | +3 |

---

## Efeitos stress

- Stress 0-30: neutro
- Stress 31-60: -3 moral/sem, -5% performance
- Stress 61-100: -6 moral/sem, -10% performance, +20% chance saída

---

## Regras de validação

- [ ] Stress 0-100
- [ ] Triggers aplicados corretamente
- [ ] Moral/performance penalidades consistentes
- [ ] Stress diminui -2/sem se melhora (vitória, back to starter)

---

## Testes

```javascript
describe('SPEC-008: Stress System', () => {
  test('3 derrotas seguidas +15 stress', () => {
    // 3 losses consecutivos
    engine.playMatch(1, 2); engine.advanceWeek();  // Loss
    engine.playMatch(1, 3); engine.advanceWeek();  // Loss
    engine.playMatch(1, 4); engine.advanceWeek();  // Loss
    const stress = engine.getPlayerStress(playerId);
    expect(stress).toBeGreaterThanOrEqual(15);
  });

  test('Stress > 60 = -10% performance', () => {
    // Force stress high
    while (engine.getPlayerStress(playerId) < 65) {
      engine.playMatch(1, 2);  // Losses
      engine.advanceWeek();
    }
    const perf = engine.getPlayerPerformanceModifier(playerId);
    expect(perf).toBeLessThanOrEqual(-0.10);  // -10%
  });
});
```

**Status**: PRONTO
