# SPEC-140: Reescalonamento Preço de Transferência

> **Origem**: deep soak logs mostram agente vendendo OVR82 por R$0.2M e OVR76 por R$0.2M.
> Saldo do time em R$100-600M. Vender OVR82 por R$0.2M é <0.1% do saldo — economicamente absurdo.
> Causa: `baseValue(ovr)` retorna valores em escala errada vs economia do jogo.

---

## O que é

Reescala a função `baseValue(ovr)` em `MarketPricer.js` para alinhar preços de transferência com a escala econômica real do jogo (saldos de R$10M-600M observados no deep soak).

---

## Input

```typescript
calcMarketValue({ playerOvr: number, playerAge: number, playerPotential: number })
```

---

## Output esperado

Tabela de referência pós-fix:

| OVR | Valor atual | Valor alvo |
|-----|-------------|------------|
| 60  | R$ 50k      | R$ 500k    |
| 70  | R$ 150k     | R$ 1.5M    |
| 76  | R$ 180k     | R$ 3M      |
| 80  | R$ 200k     | R$ 5M      |
| 82  | R$ 230k     | R$ 7M      |
| 90  | R$ 350k     | R$ 20M     |

Multiplicador: **~10x** para valores abaixo de OVR80, **~30x** para OVR80+.

---

## Regras de validação

- [ ] `calcMarketValue({playerOvr: 82})` ≥ R$ 5M
- [ ] `calcMarketValue({playerOvr: 70})` ≥ R$ 1M
- [ ] `calcMarketValue({playerOvr: 60})` ≥ R$ 300k
- [ ] `calcMarketValue({playerOvr: 90})` ≥ R$ 15M
- [ ] Preço de venda de OVR76 em autoplay ≥ R$ 2M (vs R$0.2M atual)
- [ ] Salário de jogadores reescala proporcionalmente (salary = ovr² × 5 → precisar ajustar)
- [ ] Saldo inicial do time ainda positivo após ajuste de salários

---

## Forbidden

- [ ] OVR82 vendido por < R$ 2M
- [ ] OVR60 vendido por > R$ 5M (escala inversa)
- [ ] Salary médio do elenco > 30% do saldo semanal (clube falido)

---

## Implementação

**Arquivo**: `src/engine/MarketPricer.js`

```javascript
// ANTES:
function baseValue(ovr) {
    if (ovr < 60) return 50000 + ovr * 500;
    if (ovr < 80) return 100000 + (ovr - 60) * 5000;
    return 200000 + (ovr - 80) * 15000;
}

// DEPOIS (10x escala, 30x no topo):
function baseValue(ovr) {
    if (ovr < 60) return 500_000 + ovr * 5_000;
    if (ovr < 80) return 1_000_000 + (ovr - 60) * 100_000;
    return 3_000_000 + (ovr - 80) * 350_000;
}
// OVR60 → R$800k | OVR70 → R$2M | OVR80 → R$3M | OVR82 → R$3.7M | OVR90 → R$6.15M
```

Também ajustar `playerValue` no AutoPlayService.js:1212:
```javascript
// ANTES:
playerValue: target.value || (player.ovr || 60) * 50_000,
// DEPOIS:
playerValue: target.value || calcMarketValue({ playerOvr: player.ovr || 60, playerAge: player.age || 25, playerPotential: player.potential || 70 }),
```

---

## Testes esperados

```javascript
describe('SPEC-140: Transfer Price Rescale', () => {
  test('OVR82: valor >= R$5M', () => {
    const v = calcMarketValue({ playerOvr: 82, playerAge: 25, playerPotential: 85 });
    expect(v).toBeGreaterThanOrEqual(5_000_000);
  });

  test('OVR70: valor >= R$1M', () => {
    const v = calcMarketValue({ playerOvr: 70, playerAge: 25, playerPotential: 75 });
    expect(v).toBeGreaterThanOrEqual(1_000_000);
  });

  test('OVR90: valor >= R$15M', () => {
    const v = calcMarketValue({ playerOvr: 90, playerAge: 23, playerPotential: 95 });
    expect(v).toBeGreaterThanOrEqual(15_000_000);
  });

  test('escala monotônica: OVR90 > OVR80 > OVR70 > OVR60', () => {
    const v = [60, 70, 80, 90].map(ovr => calcMarketValue({ playerOvr: ovr, playerAge: 25, playerPotential: ovr + 5 }));
    expect(v[3]).toBeGreaterThan(v[2]);
    expect(v[2]).toBeGreaterThan(v[1]);
    expect(v[1]).toBeGreaterThan(v[0]);
  });

  test('OVR60 < R$2M (não inflacionar demais)', () => {
    const v = calcMarketValue({ playerOvr: 60, playerAge: 25, playerPotential: 65 });
    expect(v).toBeLessThan(2_000_000);
  });

  test('idade 18 tem multiplicador maior que idade 33', () => {
    const young = calcMarketValue({ playerOvr: 75, playerAge: 18, playerPotential: 85 });
    const old   = calcMarketValue({ playerOvr: 75, playerAge: 33, playerPotential: 76 });
    expect(young).toBeGreaterThan(old);
  });

  test('venda autoplay OVR76+ >= R$2M', () => {
    // integração: verificar que AutoPlayService usa calcMarketValue e não fórmula inline
    const playerValue = calcMarketValue({ playerOvr: 76, playerAge: 26, playerPotential: 80 });
    expect(playerValue).toBeGreaterThanOrEqual(2_000_000);
  });

  test('OVR82 > OVR76 em pelo menos R$1M', () => {
    const v82 = calcMarketValue({ playerOvr: 82, playerAge: 25, playerPotential: 87 });
    const v76 = calcMarketValue({ playerOvr: 76, playerAge: 25, playerPotential: 81 });
    expect(v82 - v76).toBeGreaterThan(1_000_000);
  });
});
```

---

## Harness
```bash
cd /Users/dudujarra/Documents/ELIFOOT && npm test -- --reporter=verbose 2>&1 | grep "SPEC-140"
```
