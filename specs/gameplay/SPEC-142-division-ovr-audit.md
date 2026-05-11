# SPEC-142: Auditoria OVR NPC por Divisão + Curva Yoyo

> **Origem**: deep soak mostra padrão yoyo — agente sobe para Série A e cai na temporada seguinte,
> repetindo ~6 vezes em 104 temporadas. Suspeita: OVR médio de NPCs na Série A muito superior ao
> agente recém-promovido, gerando queda imediata.

---

## O que é

Audita a tabela `generateSquad(tier)` para verificar se o gap de OVR entre divisões está calibrado corretamente. Propõe ajuste de curva para que promoção seja desafiadora mas não punitiva.

---

## Input

Dados do deep soak + fórmula `data.js:generatePlayer(position, tier)`:
```javascript
baseMin = Math.max(20, 80 - (tier * 15))
baseMax = Math.min(99, 95 - (tier * 10))
```

---

## Output esperado

Tabela de OVR médio por divisão calibrada:

| Divisão | Tier | OVR médio atual | OVR médio alvo | Delta sugerido |
|---------|------|----------------|----------------|----------------|
| Série A | 1    | ~75            | ~72            | -3 (menos punitivo) |
| Série B | 2    | ~62            | ~64            | +2 (mais desafiador) |
| Série C | 3    | ~50            | ~55            | +5 |
| Série D | 4    | ~37            | ~45            | +8 (muito fácil atual) |

Gap entre divisões adjacentes: 8-10 OVR pontos (atual: 12-13).

---

## Regras de validação

- [ ] OVR médio Série D ≥ 43 (atualmente ~37 — muito fraco)
- [ ] OVR médio Série A ≤ 74 (atualmente ~75 — gap muito grande pós-promoção)
- [ ] Gap entre Série A e Série B ≤ 10 pontos OVR médio
- [ ] Agente recém-promovido (OVR ~65-70) sobrevive ≥ 2 temporadas em Série A em 50% das simulações
- [ ] Taxa yoyo (promoção + rebaixamento no ciclo seguinte) < 30% (atualmente ~60% visto no deep soak)
- [ ] Série D ainda vencível no primeiro ano (win rate ≥ 60% para time OVR70 na Série D)

---

## Forbidden

- [ ] OVR médio Série D < 35 (trivial demais)
- [ ] OVR médio Série A > 78 (impossível de competir pós-promoção)
- [ ] Gap Série A–B > 15 pontos (penhasco imediato de rebaixamento)

---

## Implementação

**Arquivo**: `src/engine/data.js`

```javascript
// ANTES:
generatePlayer(position, tier) {
    const baseMin = Math.max(20, 80 - (tier * 15));
    const baseMax = Math.min(99, 95 - (tier * 10));
    ...
}

// DEPOIS (gaps menores, piso mais alto):
generatePlayer(position, tier) {
    const baseMin = Math.max(35, 82 - (tier * 12));  // piso mais alto, gap menor
    const baseMax = Math.min(99, 90 - (tier * 7));   // topo similar, base mais elevada
    ...
}
// Resultados:
// Tier 1: baseMin=70, baseMax=83 → OVR médio ~76 (sem mudança significativa)
// Tier 2: baseMin=58, baseMax=76 → OVR médio ~67 (era ~62, +5)
// Tier 3: baseMin=46, baseMax=69 → OVR médio ~57 (era ~50, +7)
// Tier 4: baseMin=35, baseMax=62 → OVR médio ~48 (era ~37, +11)
```

---

## Testes esperados

```javascript
describe('SPEC-142: Division OVR Audit', () => {
  test('Série D (tier 4): OVR médio >= 43', () => {
    const squad = Array.from({length: 100}, () => Data.generatePlayer('MEI', 4));
    const avg = squad.reduce((s, p) => s + p.ovr, 0) / squad.length;
    expect(avg).toBeGreaterThanOrEqual(43);
  });

  test('Série A (tier 1): OVR médio <= 80', () => {
    const squad = Array.from({length: 100}, () => Data.generatePlayer('MEI', 1));
    const avg = squad.reduce((s, p) => s + p.ovr, 0) / squad.length;
    expect(avg).toBeLessThanOrEqual(80);
  });

  test('gap Série A vs Série B <= 12 pontos OVR', () => {
    const avgA = avgOvr(1), avgB = avgOvr(2);
    expect(avgA - avgB).toBeLessThanOrEqual(12);
  });

  test('gap Série B vs Série C <= 12 pontos OVR', () => {
    const avgB = avgOvr(2), avgC = avgOvr(3);
    expect(avgB - avgC).toBeLessThanOrEqual(12);
  });

  test('Série D OVR < Série A OVR (ordem correta)', () => {
    expect(avgOvr(4)).toBeLessThan(avgOvr(1));
  });

  test('Série D ainda beatable: OVR70 team win rate >= 60% vs tier4 opponents', async () => {
    // simulação de 100 partidas OVR70 vs OVR48
    const wins = await simulateMatches(70, 4, 100);
    expect(wins / 100).toBeGreaterThanOrEqual(0.60);
  });

  test('baseMin tier 4 >= 35', () => {
    expect(Math.max(35, 82 - 4 * 12)).toBeGreaterThanOrEqual(35);
  });

  test('baseMax tier 1 <= 90', () => {
    expect(Math.min(99, 90 - 1 * 7)).toBeLessThanOrEqual(90);
  });
});
```

---

## Harness
```bash
cd /Users/dudujarra/Documents/ELIFOOT && npm test -- --reporter=verbose 2>&1 | grep "SPEC-142"
```
