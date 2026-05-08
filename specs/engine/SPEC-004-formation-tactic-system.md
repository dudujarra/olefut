# SPEC-004: Formation & Tactic System

**Criticidade**: 🔴 CRÍTICO  
**Módulo**: `src/engine/engine.js` (matchup logic)  
**Linhas de código**: ~450  
**Dependências**: MatchEventsDeck (tactic modifiers)

---

## O que é

Sistema de matchup entre 8 formações × 5 táticas. Define como cada combinação afeta posição de ataque/defesa, agressão, posse, etc. Pedra-papel-tesoura tático para criar dinâmica competitiva.

---

## Input

```typescript
{
  homeFormation: '4-3-3' | '4-4-2' | '3-5-2' | '5-3-2' | '4-2-3-1' | '4-1-4-1' | '3-4-3' | '5-4-1',
  homeTactic: 'Ofensivo' | 'Defensivo' | 'Pressing' | 'Contra-Ataque' | 'Posse',
  awayFormation: (8 opcões),
  awayTactic: (5 opcões)
}
```

---

## Output

```typescript
{
  homeMatchupScore: number (0-100),  // Vantagem tactical
  awayMatchupScore: number (0-100),
  homeAttackBonus: number (-20 to +20),  // % modificador
  homeDefenseBonus: number (-20 to +20),
  awayAttackBonus: number (-20 to +20),
  awayDefenseBonus: number (-20 to +20),
  expectedPossession: { home: number, away: number }  // %
}
```

---

## Regras de validação

### Validação 1: Matchup rock-paper-scissors
- [ ] Ofensivo > Defensivo (-20 to defense)
- [ ] Defensivo > Pressing (-20 to tackles)
- [ ] Pressing > Contra-Ataque (-20 to speed)
- [ ] Contra-Ataque > Ofensivo (+20 a velocidade)
- [ ] Posse > Defensivo (mais passes, menos tackles)

### Validação 2: Formation affects
- [ ] 3-back formations (3-5-2, 3-4-3) = -10 att, +15 def vs 4-back
- [ ] 5-back (5-3-2, 5-4-1) = -20 att, +25 def vs 4-back
- [ ] 4-back (4-3-3, 4-4-2, etc) = baseline
- [ ] Each formation has distinct trade-offs

### Validação 3: Score ranges
- [ ] homeMatchupScore + awayMatchupScore = 100
- [ ] Scores entre 25-75 (não extremo)
- [ ] Mesmo matchup: 50-50 (balanced)

### Validação 4: Possession expectation
- [ ] Posse > Defensivo sempre
- [ ] Tactic Ofensivo vs Defensivo: 60-40 vs 40-60
- [ ] Contra-Ataque teams = lower posse (35-45%)
- [ ] Soma home + away possession ≈ 100% (ou com tolerância)

### Validação 5: Bonus limits
- [ ] Bonuses entre -20 and +20
- [ ] Ataque nunca -30 (demais desvantagem)
- [ ] Defesa nunca -30

### Validação 6: Tactic incompatibility
- [ ] 5-4-1 (retranca) com Ofensivo = -15 att (incompatível)
- [ ] 3-4-3 com Defensivo = -10 att (pouco ofensivo)
- [ ] Warn combinações ruins mas não bloqueia

### Validação 7: Determinism
- [ ] Mesma entrada → mesma saída
- [ ] Função pura (sem randomness)

### Validação 8: Balance
- [ ] Nenhuma combinação > 70 matchup score (OP)
- [ ] 8×5×8×5 = 1600 combinations, median score ~50

---

## Forbidden

- [ ] matchupScore > 75 ou < 25 (desequilibrado)
- [ ] Formation inválida (ex: "3-3-3")
- [ ] Tactic inválida
- [ ] homeScore + awayScore ≠ 100 (desvio >5)
- [ ] Posse negativa ou > 100%
- [ ] Bonus > 20 ou < -20
- [ ] Mesma entrada, resultado diferente (sem seed)
- [ ] 5-4-1 Ofensivo = +20 ataque (irreal)

---

## Implementação

`src/engine/engine.js` → `getMatchupBonus(formations, tactics)`

---

## Testes

```javascript
describe('SPEC-004: Formation & Tactic System', () => {

  test('Rule 1: Ofensivo > Defensivo em ataque', () => {
    const off = engine.getMatchupBonus({ home: '4-3-3', homeTactic: 'Ofensivo', away: '4-3-3', awayTactic: 'Defensivo' });
    expect(off.homeAttackBonus).toBeGreaterThan(off.awayAttackBonus);
  });

  test('Rule 3: matchup score suma 100', () => {
    // 100 random combinations
    for (let i = 0; i < 100; i++) {
      const combo = generateRandomCombo();
      const m = engine.getMatchupBonus(combo);
      expect(m.homeMatchupScore + m.awayMatchupScore).toBeCloseTo(100, 1);
    }
  });

  test('Rule 4: Posse realistic', () => {
    const m = engine.getMatchupBonus({ home: '4-3-3', homeTactic: 'Posse', away: '5-4-1', awayTactic: 'Defensivo' });
    expect(m.expectedPossession.home).toBeGreaterThan(m.expectedPossession.away);
  });

  test('Rule 6: 5-4-1 Ofensivo = incompatível', () => {
    const m = engine.getMatchupBonus({ home: '5-4-1', homeTactic: 'Ofensivo', away: '4-3-3', awayTactic: 'Defensivo' });
    expect(m.homeAttackBonus).toBeLessThan(5);  // Não ganha muito
  });

  test('Forbidden: matchupScore nunca > 75', () => {
    const formations = ['4-3-3', '4-4-2', '3-5-2', '5-3-2', '4-2-3-1', '4-1-4-1', '3-4-3', '5-4-1'];
    const tactics = ['Ofensivo', 'Defensivo', 'Pressing', 'Contra-Ataque', 'Posse'];
    
    formations.forEach(hf => {
      tactics.forEach(ht => {
        formations.forEach(af => {
          tactics.forEach(at => {
            const m = engine.getMatchupBonus({ home: hf, homeTactic: ht, away: af, awayTactic: at });
            expect(m.homeMatchupScore).toBeLessThanOrEqual(75);
            expect(m.awayMatchupScore).toBeLessThanOrEqual(75);
          });
        });
      });
    });
  });

});
```

**Status**: PRONTO  
**Próxima**: SPEC-005
