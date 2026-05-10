# SPEC-081: Filhos Regens — Regens-Filhos de Ex-Companheiros

**Fase:** 6 — Legado (v1.3)  
**Prioridade:** MÉDIA  
**Pré-requisito:** SPEC-079 Traits Herdáveis + SPEC-078 Hall de Lendas  
**AKITA:** AKITA-054  
**SAVE_VERSION:** sobe pra 19

---

## O que é

Jogadores regens com linhagem de ex-companheiros do player-manager. 16-18 anos após o auge de um ex-companheiro, um jovem com o sobrenome (ou nome próximo) e traços genéticos emerge no mercado. Escassez intencional: 1 a cada 3-4 seasons.

Cria continuidade temporal — o save tem memória de quem passou por ele.

**Diferença de SPEC-079 (Traits Herdáveis):**
- SPEC-079: qualquer regen da base herda traits do Hall
- SPEC-081: regen específico com linhagem nomeada de ex-companheiro do player

---

## Input

```typescript
{
  managerId: number,
  saveYear: number,               // ano atual do save
  formerCompanions: Array<{
    playerId: number,
    name: string,
    surname: string,
    peakYear: number,             // ano em que estava no elenco do player
    peakOvr: number,
    traits: TraitBlock,
    retired: boolean
  }>,
  regenLineage: Array<{           // filhos já gerados (evitar duplicata)
    parentId: number,
    childId: string,
    generatedYear: number
  }>
}
```

---

## Output esperado

```typescript
{
  regenAvailable: boolean,
  regen?: {
    childId: string,
    parentId: number,
    parentName: string,
    name: string,                 // nome gerado: usa sobrenome do pai
    age: number,                  // 16-18
    ovr: number,                  // peakOvr pai * (0.7 - 1.1) com variância
    traits: TraitBlock,           // herda com variância de SPEC-079
    emergenceHeadline: string,    // manchete handwritten
    shadowArcActive: boolean      // "A Sombra do Pai" ativo se pai era ídolo
  }
}
```

**Condições para regen emergir:**
```
saveYear >= formerCompanion.peakYear + 16
AND saveYear <= formerCompanion.peakYear + 22  (janela de 6 anos)
AND formerCompanion.retired = true             (pai aposentou)
AND parentId NOT IN regenLineage               (sem duplicata)
AND random(0,1) < 0.28                         (28% de chance por season na janela)
```

**OVR do filho:**
```
base = parentPeakOvr * random(0.70, 1.10)
cap máximo = 90 (filho não pode nascer lenda)
cap mínimo = 45
```

**Traits do filho:**
- Usa `TraitInheritanceSystem.generate()` de SPEC-079
- Adiciona bias: +10 em trait dominante do pai (se pai tinha garra ≥ 70 → filho +10 garra)

**"A Sombra do Pai":**
- Ativo se pai era `idoloEterno` ou `goleirao` no Hall de algum clube
- Gera arco narrativo: manchetes especiais quando filho vai mal

---

## Regras de validação

- [ ] Regen só emerge se `saveYear >= peakYear + 16`
- [ ] Regen não emerge se pai já tem filho no `regenLineage`
- [ ] OVR do filho: 45-90 (clampado)
- [ ] `name` usa sobrenome do pai (ao menos parcialmente)
- [ ] `emergenceHeadline` nunca vazio
- [ ] `shadowArcActive` só true se pai era slot de Hall
- [ ] Frequência: no máximo 1 regen por 3 seasons em média (escassez)
- [ ] Traits herdam com variância (não clone perfeito do pai)

---

## Forbidden

- [ ] Dois filhos do mesmo pai
- [ ] Regen com OVR > 90 ao nascer
- [ ] Regen emergindo antes de 16 anos do pico do pai
- [ ] `emergenceHeadline` genérico sem nome do pai
- [ ] Regen de pai que ainda está ativo (não aposentado)

---

## Implementação

**Arquivo:** `src/engine/RegenLineageSystem.js` (novo)  
**Integração:** `engine.endSeason()` → `RegenLineageSystem.evaluate(managerId, saveYear)`  
**Schema save:** `save.regenLineage = Array<{ parentId, childId, generatedYear }>`  
**Dependência:** `TraitInheritanceSystem` (SPEC-079)

---

## Testes esperados

```javascript
describe('SPEC-081: Filhos Regens', () => {
  test('regen only if saveYear >= peakYear + 16 (rule 1)', () => {
    const result = RegenLineageSystem.evaluate({
      saveYear: 2035,
      formerCompanions: [{ playerId: 10, peakYear: 2025, retired: true, ...defaults }],
      regenLineage: []
    });
    expect(result.regenAvailable).toBe(false); // 2035 < 2025+16=2041
  });

  test('no regen if parent already has child (rule 2)', () => {
    const result = RegenLineageSystem.evaluate({
      saveYear: 2045,
      formerCompanions: [{ playerId: 10, peakYear: 2025, retired: true, ...defaults }],
      regenLineage: [{ parentId: 10, childId: 'c1', generatedYear: 2042 }]
    });
    expect(result.regenAvailable).toBe(false);
  });

  test('child OVR capped at 45-90 (rule 3)', () => {
    const results = Array(100).fill(null).map(() =>
      RegenLineageSystem.generateChild({ parentPeakOvr: 95, ...defaults })
    );
    results.forEach(r => {
      expect(r.ovr).toBeGreaterThanOrEqual(45);
      expect(r.ovr).toBeLessThanOrEqual(90);
    });
  });

  test('child name includes parent surname (rule 4)', () => {
    const child = RegenLineageSystem.generateChild({ parentName: 'Carlos Silva', ...defaults });
    expect(child.name).toContain('Silva');
  });

  test('emergenceHeadline never empty (rule 5)', () => {
    const child = RegenLineageSystem.generateChild({ parentName: 'Zé Araújo', peakOvr: 78, ...defaults });
    expect(child.emergenceHeadline).toBeTruthy();
    expect(child.emergenceHeadline).toContain('Araújo');
  });

  test('shadowArc only if parent was in Hall (rule 6)', () => {
    const childNoHall = RegenLineageSystem.generateChild({ parentInHall: false, ...defaults });
    expect(childNoHall.shadowArcActive).toBe(false);

    const childWithHall = RegenLineageSystem.generateChild({ parentInHall: true, hallSlot: 'idoloEterno', ...defaults });
    expect(childWithHall.shadowArcActive).toBe(true);
  });

  test('traits not clone — variance applied (rule 8)', () => {
    const parentTraits = { garra: 80, talento_natural: 70, lealdade: 60, frieza: 75 };
    const children = Array(10).fill(null).map(() =>
      RegenLineageSystem.generateChild({ parentTraits, parentInHall: false, ...defaults })
    );
    const garras = children.map(c => c.traits.garra);
    const unique = new Set(garras);
    expect(unique.size).toBeGreaterThan(1); // variância real
  });

  test('forbidden: regen from active (non-retired) parent (rule forbidden 5)', () => {
    const result = RegenLineageSystem.evaluate({
      saveYear: 2045,
      formerCompanions: [{ playerId: 10, peakYear: 2025, retired: false, ...defaults }],
      regenLineage: []
    });
    expect(result.regenAvailable).toBe(false);
  });
});
```

---

## Definition of Done
- [ ] `RegenLineageSystem.js` passa todos os 8 testes
- [ ] Regen emerge corretamente em save com 20+ seasons
- [ ] Manchete no press feed ao emergir
- [ ] `shadowArcActive` gera manchetes especiais quando filho vai mal (1 texto mínimo)

## Definition of Stop
- Se regens aparecerem mais de 1 por season: aumentar janela de escassez para 1 a cada 5 seasons
