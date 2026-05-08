# SPEC-007: Personality System

**Criticidade**: 🟡 ALTO  
**Módulo**: `src/engine/PlayerTraits.js`  
**Linhas de código**: ~150

---

## O que é

5 personalidades que afetam desenvolvimento, contratação, renovação, vestiário. Cada tipo tem bônus/penalidade próprio.

---

## Personalidades

| Tipo | Efeito |
|------|--------|
| Profissional | ×1.3 growth, -3% salário demand, +5 mental |
| Ambicioso | ×1.2 growth, não quer reserves, +3 moral lider |
| Determinado | ×1.15 growth, +2 moral, menos lesão |
| Casual | ×0.9 growth, quer folga, +1 moral |
| Preguiçoso | ×0.7 growth, +5 conforto, -3 moral |

---

## Regras de validação

- [ ] Cada personality tem distinct bônus
- [ ] Growth multiplier aplicado corretamente
- [ ] Salary multiplier efetivo na negociação
- [ ] Vestiário (3+ mesmo tipo = efeito grupo)
- [ ] Lider natural (Profissional, Ambicioso)

---

## Testes

```javascript
describe('SPEC-007: Personality System', () => {
  test('Profissional ×1.3 growth', () => {
    const prof = { personality: 'Profissional' };
    const lazy = { personality: 'Preguiçoso' };
    // Prof deve crescer mais
    expect(prof.growthMultiplier).toBe(1.3);
    expect(lazy.growthMultiplier).toBe(0.7);
  });
});
```

**Status**: PRONTO
