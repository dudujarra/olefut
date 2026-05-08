# SPEC-006: Board System (Diretoria)

**Criticidade**: 🔴 CRÍTICO  
**Módulo**: `src/engine/BoardSystem.js`  
**Linhas de código**: ~280

---

## O que é

Sistema de confiança da diretoria. Baseado em posição na liga, sequência de resultados, moral do elenco. Diretoria demite se confiança < 10.

---

## Input

```typescript
BoardSystem.updateConfidence({
  wins: number,
  losses: number,
  draws: number,
  teamMorale: number (0-100),
  weeksSinceDemission: number
})
```

---

## Output

```typescript
{
  confidence: number (0-100),
  status: '😊' | '🤔' | '😤' | '🔥',
  demissionThreshold: boolean
}
```

---

## Regras de validação

- [ ] Confiança começa em 60
- [ ] Primeiras 8 semanas: grace period (-0 confiança)
- [ ] Win +3, Draw +1, Loss -5
- [ ] Moral < 30: -2/sem confiança
- [ ] Posição ruim: -1 confiança/semana
- [ ] Status: 70+ 😊, 45-69 🤔, 25-44 😤, <25 🔥
- [ ] Demission se confidence < 10

---

## Forbidden

- [ ] Confiança nunca recalculada
- [ ] Demission sem warning (need <25 antes)
- [ ] Grace period ignorado
- [ ] Confiança > 100 ou < 0

---

## Testes

```javascript
describe('SPEC-006: Board System', () => {
  test('Grace period 8 weeks', () => {
    for (let i = 0; i < 8; i++) {
      engine.advanceWeek();
      const conf = engine.getBoardConfidence();
      expect(conf).toBe(60);  // Sem mudança
    }
  });

  test('Win +3 confidence', () => {
    const before = engine.getBoardConfidence();
    engine.playMatch(1, 5);  // Home wins
    engine.advanceWeek();
    const after = engine.getBoardConfidence();
    expect(after).toBeGreaterThanOrEqual(before + 2);
  });

  test('Demission < 10 confidence', () => {
    while (engine.getBoardConfidence() > 10) {
      engine.playMatch(1, 2);  // Home loses
      engine.advanceWeek();
    }
    expect(() => engine.advanceWeek()).toThrow('Demissão');
  });
});
```

**Status**: PRONTO
