# SPEC-133: Market Liquidity Fix — Precificação Real de Ofertas

**Fase:** 0 — Gameplay Fix  
**Prioridade:** URGENTE  
**Telemetria:** SPEC-111 score=50, LOWBALL severity=1.0, 966 ofertas com 0% de aceitação  
**AKITA:** a definir no PR

---

## O que é

Corrige o algoritmo de precificação de ofertas de mercado. Atualmente 966 ofertas foram feitas em 203 seasons com aceitação de 0% — todas as ofertas estão abaixo do valor mínimo aceitável. Bug fundamental: `avgSpread = -1` indica que preço ofertado está consistentemente abaixo do custo.

---

## Input

```typescript
{
  playerId: number,
  playerOvr: number,          // atributo geral (0-100)
  playerAge: number,
  playerContract: number,     // semanas restantes de contrato
  marketValue: number,        // valor calculado pelo sistema
  offeringTeamBudget: number,
  offeringTeamNeed: 'high' | 'medium' | 'low', // urgência de compra
  sellingTeamWillingness: 'forced' | 'open' | 'reluctant'
}
```

---

## Output esperado

```typescript
{
  offerPrice: number,    // valor proposto
  spread: number,        // offerPrice / marketValue (deve ser 0.7-1.3)
  accepted: boolean,     // simulação de aceitação
  counterOffer?: number  // contra-proposta se rejeitado (spread 0.9-1.1)
}
```

**Fórmula de marketValue:**
```
marketValue = baseValue(ovr) × ageMultiplier(age) × contractMultiplier(weeks)

baseValue(ovr):
  ovr < 60 → 50_000 + (ovr * 500)
  ovr 60-79 → 100_000 + ((ovr - 60) * 5_000)
  ovr ≥ 80 → 200_000 + ((ovr - 80) * 15_000)

ageMultiplier(age):
  age < 23 → 1.4 (jovem com potencial)
  age 23-28 → 1.0 (prime)
  age 29-32 → 0.7 (declínio)
  age > 32 → 0.4 (final de carreira)

contractMultiplier(weeks):
  weeks > 26 → 1.0
  weeks 13-26 → 0.8
  weeks < 13 → 0.5 (expiring = barato)
```

**Fórmula de offer:**
```
baseOffer = marketValue × spread
spread range:
  need=high → 0.9 - 1.1
  need=medium → 0.7 - 0.9
  need=low → 0.5 - 0.7

Aceitação:
  sellingTeam=forced → aceita se spread ≥ 0.6
  sellingTeam=open → aceita se spread ≥ 0.85
  sellingTeam=reluctant → aceita se spread ≥ 1.05
```

---

## Regras de validação

- [ ] `spread` sempre entre 0.5 e 1.3
- [ ] Oferta `need=high` sempre ≥ 0.9 × marketValue
- [ ] Aceitação > 0% para `need=high` + `sellingTeam=forced`
- [ ] Taxa de aceitação geral > 20% em simulação de 100 transações mistas
- [ ] `marketValue` de OVR 70, age 25 está entre 150k e 250k
- [ ] Jogador expiring (<13 semanas contrato): marketValue cai ≥ 40%
- [ ] Jogador jovem (<23): marketValue sobe ≥ 30% vs mesmo OVR prime
- [ ] CounterOffer sempre entre 0.9 e 1.1 × marketValue

---

## Forbidden

- [ ] `spread < 0` (oferta negativa)
- [ ] `marketValue = 0` para qualquer jogador com OVR > 0
- [ ] Aceitação 0% em batch de 100 transações `need=high, forced`
- [ ] OVR 90 jogador valer menos que OVR 60 (sem exceção de idade)
- [ ] CounterOffer menor que oferta original

---

## Implementação

**Arquivo:** `src/engine/MarketPricer.js` (novo ou refator de existente)  
**Integração:** `src/engine/TransferSystem.js` ou equivalente  
**Dependências:** player data (ovr, age, contract weeks)

---

## Testes esperados

```javascript
describe('SPEC-133: Market Liquidity Fix', () => {
  test('spread always 0.5-1.3 (rule 1)', () => {
    const result = MarketPricer.makeOffer({ playerOvr: 72, playerAge: 26, playerContract: 20, need: 'medium', ...defaults });
    expect(result.spread).toBeGreaterThanOrEqual(0.5);
    expect(result.spread).toBeLessThanOrEqual(1.3);
  });

  test('need=high offer ≥ 0.9 × marketValue (rule 2)', () => {
    const { offerPrice, marketValue } = MarketPricer.makeOffer({ need: 'high', playerOvr: 72, playerAge: 26, playerContract: 30, ...defaults });
    expect(offerPrice).toBeGreaterThanOrEqual(marketValue * 0.9);
  });

  test('high need + forced → accepted (rule 3)', () => {
    const result = MarketPricer.makeOffer({ need: 'high', sellingWillingness: 'forced', playerOvr: 65, playerAge: 28, playerContract: 10, ...defaults });
    expect(result.accepted).toBe(true);
  });

  test('acceptance rate > 20% in 100 mixed transactions (rule 4)', () => {
    const scenarios = [
      { need: 'high', sellingWillingness: 'forced' },
      { need: 'high', sellingWillingness: 'open' },
      { need: 'medium', sellingWillingness: 'open' },
      { need: 'low', sellingWillingness: 'open' },
    ];
    const results = Array(100).fill(null).map((_, i) =>
      MarketPricer.makeOffer({ ...scenarios[i % scenarios.length], playerOvr: 70, playerAge: 26, playerContract: 20 })
    );
    expect(results.filter(r => r.accepted).length).toBeGreaterThan(20);
  });

  test('expiring contract → marketValue drops 40%+ (rule 6)', () => {
    const full = MarketPricer.calcMarketValue({ playerOvr: 70, playerAge: 26, playerContract: 30 });
    const expiring = MarketPricer.calcMarketValue({ playerOvr: 70, playerAge: 26, playerContract: 10 });
    expect(expiring).toBeLessThanOrEqual(full * 0.6);
  });

  test('young player 22yo → 30%+ premium vs 26yo same OVR (rule 7)', () => {
    const young = MarketPricer.calcMarketValue({ playerOvr: 70, playerAge: 22, playerContract: 26 });
    const prime = MarketPricer.calcMarketValue({ playerOvr: 70, playerAge: 26, playerContract: 26 });
    expect(young).toBeGreaterThanOrEqual(prime * 1.3);
  });

  test('marketValue OVR 70 age 25 in 150k-250k range (rule 5)', () => {
    const mv = MarketPricer.calcMarketValue({ playerOvr: 70, playerAge: 25, playerContract: 26 });
    expect(mv).toBeGreaterThanOrEqual(150000);
    expect(mv).toBeLessThanOrEqual(250000);
  });

  test('counterOffer always > offerPrice (rule 8)', () => {
    const result = MarketPricer.makeOffer({ need: 'low', sellingWillingness: 'reluctant', playerOvr: 75, playerAge: 27, playerContract: 20, ...defaults });
    if (!result.accepted && result.counterOffer) {
      expect(result.counterOffer).toBeGreaterThan(result.offerPrice);
    }
  });
});
```

---

## Definition of Done
- [ ] `MarketPricer.js` passa todos os 8 testes
- [ ] Aceitação geral > 20% em batch de 100 transações mistas
- [ ] SPEC-111 Market Liquidity score > 70 no próximo playtest (via telemetria)

## Definition of Stop
- Se taxa de aceitação subir mas inflação de mercado desbalancear economia: recalibrar faixas de OVR/age
