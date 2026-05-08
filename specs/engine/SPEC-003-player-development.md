# SPEC-003: Player Development

**Criticidade**: 🔴 CRÍTICO  
**Módulo**: `src/engine/PlayerDevelopment.js`  
**Linhas de código**: ~350  
**Dependências**: PlayerCareer (modo jogador), BoardSystem (efeito em moral)

---

## O que é

Sistema de envelhecimento e desenvolvimento de jogadores ao longo da carreira. Define curvas de crescimento (16-24 pico), pico (25-32 estável), e declínio (33+ diminui). Personalidade afeta velocidade. Desenvolvimento é **rng-based** (chance por semana).

---

## Input

```typescript
PlayerDevelopment.updatePlayer(player: {
  id: number,
  age: number,
  position: 'GOL' | 'DEF' | 'MEI' | 'ATA',
  attributes: { FIS, DEF, CRI, FIN, REF },
  personality: 'Profissional' | 'Ambicioso' | 'Determinado' | 'Casual' | 'Preguiçoso',
  weeks: number (1-52),
  seed?: number
})
```

### Validação input
- [ ] age entre 15-39
- [ ] attributes válidos (1-99)
- [ ] personality é uma das 5

---

## Output esperado

```typescript
{
  id: number,
  age: number,
  attributes: { FIS, DEF, CRI, FIN, REF },  // Possivelmente modificados
  growth: number (-2 to +2),  // Quanto cresceu nesta semana
  phase: 'Crescimento' | 'Pico' | 'Declínio' | 'Aposentadoria'
}
```

---

## Regras de validação

### Validação 1: Fase correta por idade
- [ ] 15-24: Crescimento
- [ ] 25-32: Pico (estável ou slight growth)
- [ ] 33-34: Declínio começa
- [ ] 35+: Declínio acentuado

### Validação 2: Crescimento
- [ ] Crescimento fase NUNCA é -1, -2 (só positivo ou 0)
- [ ] Pico: +1, 0, -1 normal (estável)
- [ ] Declínio: -1, -2 normal (não cresce)

### Validação 3: Caps de atributo
- [ ] Nenhum atributo > 99
- [ ] Nenhum atributo < 1
- [ ] Growth capped é reportado (+2 no pico mesmo com chance +3)

### Validação 4: Personalidade modifica velocidade
- [ ] Profissional: ×1.3 growth (chance +30%)
- [ ] Ambicioso: ×1.2
- [ ] Determinado: ×1.15
- [ ] Casual: ×0.9 (diminui)
- [ ] Preguiçoso: ×0.7 (muito diminui)

### Validação 5: RNG distribuição
- [ ] Com seed idêntico → mesma progressão
- [ ] Sem seed → varia aleatoriamente
- [ ] Probabilidade de growth +1 é ~50% no pico (sem modificador)

### Validação 6: Aposentadoria
- [ ] 35+: 15% chance/ano de retire
- [ ] 36+: 20% chance/ano
- [ ] 39+: 50%+ chance
- [ ] Retirement é flag, não automático morte

### Validação 7: Atributo mínimo
- [ ] Nenhum atributo desce de 1 (mesmo em declínio 35+)
- [ ] Declínio nunca zera attributes

### Validação 8: Peak idade correct
- [ ] Jogador no pico (25-32) tem chance máxima de 0 growth (estável)
- [ ] Chance negativa é rara no pico (<5%)

---

## Forbidden

- [ ] Atributo > 99 ou < 1
- [ ] Jovem em declínio (<22 anos declina)
- [ ] Crescimento em declínio (35+ crescendo regularmente)
- [ ] Preguiçoso chega a OVR 99 (improvável)
- [ ] Profissional com growth negativo (contra odds)
- [ ] Aposentadoria simulada <35 (muito jovem)
- [ ] Atributo varia >3 em 1 semana (unrealistic spike)

---

## Implementação

`src/engine/PlayerDevelopment.js` → `updatePlayer(player, weeks, seed)`

---

## Testes

```javascript
describe('SPEC-003: Player Development', () => {

  test('Rule 1: 16-24 = Crescimento', () => {
    const young = { age: 20, attributes: { FIS: 50, ... } };
    const result = PlayerDevelopment.updatePlayer(young, 1);
    expect(result.phase).toBe('Crescimento');
  });

  test('Rule 2: pico age 25-32 estável', () => {
    const prime = { age: 28, attributes: { FIS: 75, ... } };
    for (let i = 0; i < 52; i++) {
      const r = PlayerDevelopment.updatePlayer(prime, 1);
      expect(r.growth).toBeGreaterThanOrEqual(-2);
      expect(r.growth).toBeLessThanOrEqual(1);  // Estável
    }
  });

  test('Rule 3: atributo nunca > 99', () => {
    const capped = { age: 25, attributes: { FIS: 98, ... } };
    const r = PlayerDevelopment.updatePlayer(capped, 100);
    expect(r.attributes.FIS).toBeLessThanOrEqual(99);
  });

  test('Rule 4: Profissional ×1.3 growth', () => {
    const prof = { age: 20, personality: 'Profissional', attributes: { FIS: 60, ... } };
    const lazy = { age: 20, personality: 'Preguiçoso', attributes: { FIS: 60, ... } };
    
    // Múltiplas semanas para média
    let profGrowth = 0, lazyGrowth = 0;
    for (let i = 0; i < 52; i++) {
      profGrowth += PlayerDevelopment.updatePlayer(prof, 1).growth;
      lazyGrowth += PlayerDevelopment.updatePlayer(lazy, 1).growth;
    }
    expect(profGrowth).toBeGreaterThan(lazyGrowth * 1.2);
  });

  test('Rule 6: 35+ retirement chance 15%', () => {
    const old = { age: 35, attributes: { FIS: 60, ... } };
    let retirementCount = 0;
    for (let i = 0; i < 100; i++) {
      const r = PlayerDevelopment.updatePlayer(old, 1, i);
      if (r.phase === 'Aposentadoria') retirementCount++;
    }
    expect(retirementCount).toBeGreaterThan(5);  // ~15% of 100
    expect(retirementCount).toBeLessThan(25);
  });

  test('Forbidden: 20 anos em declínio', () => {
    const young = { age: 20, attributes: { FIS: 50, ... } };
    const r = PlayerDevelopment.updatePlayer(young, 1);
    expect(r.phase).not.toBe('Declínio');
  });

});
```

**Status**: PRONTO  
**Próxima**: SPEC-004
