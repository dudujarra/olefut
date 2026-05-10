# SPEC-079: Traits Herdáveis — Regens com DNA de Lendas

**Fase:** 4 — Mito + Emoção (v1.1.5)  
**Prioridade:** ALTA  
**Pré-requisito:** SPEC-078 Hall de Lendas  
**AKITA:** AKITA-052  
**SAVE_VERSION:** sobe pra 17

---

## O que é

Jogadores regens (geração procedural) herdam traits dos slots do Hall de Lendas do clube onde emergem. Cria continuidade narrativa: o DNA de ídolos históricos ressurge em jovens talentos, com bias probabilístico baseado nos slots preenchidos.

**4 traits herdáveis:**
| Trait | Range | Efeito no jogo |
|-------|-------|---------------|
| `garra` | 0-100 | Bônus em partidas decisivas (+OVR situacional) |
| `talento_natural` | 0-100 | Progressão mais rápida (GrowthEvents mais frequentes) |
| `lealdade` | 0-100 | Resistência a propostas de transferência |
| `frieza` | 0-100 | Melhor performance em jogos de alta pressão |

---

## Input

```typescript
{
  clubId: number,
  hall: {                          // vem de SPEC-078
    idoloEterno: LegendSlot | null,
    goleirao: LegendSlot | null,
    criaDaBase: LegendSlot | null,
    traidor: LegendSlot | null,
    lendaTragica: LegendSlot | null,
    carrasco: LegendSlot | null
  },
  baseOvr: number,                 // OVR base do regen (sorteado normal)
  baseAge: number                  // idade de emergência (16-18)
}
```

---

## Output esperado

```typescript
{
  playerId: string,               // gerado
  name: string,                   // gerado proceduralmente
  age: number,
  ovr: number,
  traits: {
    garra: number,                // 0-100
    talento_natural: number,
    lealdade: number,
    frieza: number
  },
  inheritedFrom: Array<{
    slot: string,                 // ex: "idoloEterno"
    legendName: string,
    traitApplied: string,
    delta: number                 // quanto o bias contribuiu
  }>,
  headline?: string               // manchete de emergência se trait forte (≥70)
}
```

**Bias por slot do Hall:**
```
idoloEterno  → lealdade  +20 bias
goleirao     → frieza    +20 bias (gols em momento certo)
criaDaBase   → garra     +20 bias
traidor      → frieza    -15 bias (instabilidade)
lendaTragica → talento_natural +25 bias (talento desperdiçado que renasce)
carrasco     → garra     +10 bias (mentalidade vencedora)
```

**Fórmula de trait:**
```
traitBase = random(20, 60)
traitFinal = clamp(traitBase + sum(biases de slots preenchidos), 0, 100)
```

**Manchetes de emergência (10 handwritten):**
- Quando `lealdade ≥ 70` + idoloEterno preenchido: "[nome] tem a lealdade de [ídolo] no sangue"
- Quando `talento_natural ≥ 75` + lendaTragica: "[nome] carrega o talento que [lenda] não pôde mostrar"
- Quando `garra ≥ 70` + criaDaBase: "[nome] saiu do mesmo chão que [cria]"
- [+ 7 variações]

---

## Regras de validação

- [ ] Todos os 4 traits sempre no range 0-100
- [ ] Bias só aplicado de slot preenchido (slot null → zero bias)
- [ ] `inheritedFrom` lista todos os slots que contribuíram
- [ ] `lendaTragica` preenchida → `talento_natural` recebe +25 bias
- [ ] `traidor` preenchido → `frieza` recebe -15 bias (reduz lealdade indiretamente)
- [ ] Regen sem hall preenchido: traits todos em range base (20-60) sem bias
- [ ] `headline` só gerado se pelo menos 1 trait ≥ 70
- [ ] Probabilidade de regen por clube: 1 a cada 3-4 seasons (escassez)

---

## Forbidden

- [ ] Trait acima de 100 ou abaixo de 0
- [ ] Bias de slot null aplicado
- [ ] Regen com 4 traits todos ≥ 80 (overpowered)
- [ ] `headline` sem nome da lenda referenciada
- [ ] Mais de 1 regen por season por clube

---

## Implementação

**Arquivo:** `src/engine/TraitInheritanceSystem.js` (novo)  
**Integração:** `src/engine/YouthAcademy.js` (SPEC-009) → ao gerar regen, chama `TraitInheritanceSystem.generate(clubId)`  
**Schema save:** `save.players[id].traits = { garra, talento_natural, lealdade, frieza }`

---

## Testes esperados

```javascript
describe('SPEC-079: Heritable Traits', () => {
  test('all traits in 0-100 range (rule 1)', () => {
    const regen = TraitInheritanceSystem.generate({ clubId: 1, hall: mockHallFull, baseOvr: 55, baseAge: 17 });
    Object.values(regen.traits).forEach(v => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });

  test('null slot contributes zero bias (rule 2)', () => {
    const hallNoLegend = { ...mockHallEmpty, lendaTragica: null };
    const regen = TraitInheritanceSystem.generate({ clubId: 1, hall: hallNoLegend, baseOvr: 55, baseAge: 17 });
    const inherited = regen.inheritedFrom.find(i => i.slot === 'lendaTragica');
    expect(inherited).toBeUndefined();
  });

  test('lendaTragica filled → talento_natural +25 bias (rule 4)', () => {
    const hallOnlyLegend = { ...mockHallEmpty, lendaTragica: mockLegendSlot };
    const results = Array(50).fill(null).map(() =>
      TraitInheritanceSystem.generate({ clubId: 1, hall: hallOnlyLegend, baseOvr: 55, baseAge: 17 })
    );
    const avgTalento = results.reduce((s, r) => s + r.traits.talento_natural, 0) / 50;
    const baseAvg = 40; // (20+60)/2
    expect(avgTalento).toBeGreaterThan(baseAvg + 15); // bias claro
  });

  test('traidor filled → frieza reduced (rule 5)', () => {
    const hallOnlyTraitor = { ...mockHallEmpty, traidor: mockTraitorSlot };
    const results = Array(50).fill(null).map(() =>
      TraitInheritanceSystem.generate({ clubId: 1, hall: hallOnlyTraitor, baseOvr: 55, baseAge: 17 })
    );
    const avgFrieza = results.reduce((s, r) => s + r.traits.frieza, 0) / 50;
    expect(avgFrieza).toBeLessThan(40); // base avg 40, com -15 bias deve ser menor
  });

  test('empty hall → all traits in base range 20-60 (rule 6)', () => {
    const regen = TraitInheritanceSystem.generate({ clubId: 1, hall: mockHallEmpty, baseOvr: 55, baseAge: 17 });
    Object.values(regen.traits).forEach(v => {
      expect(v).toBeGreaterThanOrEqual(20);
      expect(v).toBeLessThanOrEqual(60);
    });
  });

  test('headline only if trait ≥ 70 (rule 7)', () => {
    const lowTraitRegen = { traits: { garra: 50, talento_natural: 45, lealdade: 55, frieza: 40 } };
    const headline = TraitInheritanceSystem.generateHeadline(lowTraitRegen, mockHallFull);
    expect(headline).toBeUndefined();
  });

  test('forbidden: all 4 traits ≥ 80 (rule forbidden 3)', () => {
    // Em 1000 gerações, nenhuma deve ter todos ≥ 80
    const results = Array(1000).fill(null).map(() =>
      TraitInheritanceSystem.generate({ clubId: 1, hall: mockHallFull, baseOvr: 70, baseAge: 17 })
    );
    const allMax = results.filter(r => Object.values(r.traits).every(v => v >= 80));
    expect(allMax.length).toBe(0);
  });

  test('inheritedFrom lists contributing slots (rule 3)', () => {
    const regen = TraitInheritanceSystem.generate({ clubId: 1, hall: mockHallPartial, baseOvr: 55, baseAge: 17 });
    expect(regen.inheritedFrom.length).toBeGreaterThan(0);
    regen.inheritedFrom.forEach(i => {
      expect(i.slot).toBeTruthy();
      expect(i.legendName).toBeTruthy();
    });
  });
});
```

---

## Definition of Done
- [ ] `TraitInheritanceSystem.js` passa todos os 8 testes
- [ ] 10 manchetes de emergência handwritten
- [ ] Traits visíveis no card do jogador (badge ou tooltip)
- [ ] Regen com trait alto gera manchete em press feed

## Definition of Stop
- Se regens sistematicamente poderosos desequilibrarem liga: reduzir bias máximo de 25 para 15
