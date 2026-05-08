# SPEC-005: Injury System

**Criticidade**: 🔴 CRÍTICO  
**Módulo**: `src/engine/InjurySystem.js`  
**Linhas de código**: ~200

---

## O que é

Sistema de lesões com 6 tipos, recovery time, stat penalties. Jogador lesionado não joga, recupera gradualmente.

---

## Input

```typescript
InjurySystem.injurePlayer({
  playerId: number,
  type: 'Minor' | 'Moderate' | 'Severe' | 'ACL' | 'Fracture' | 'ConcusionHazard',
  week: number
})
```

---

## Output

```typescript
{
  playerId: number,
  type: string,
  weeksOut: number,
  recoveryProgress: number (0-100),
  status: 'Injured' | 'Recovery' | 'Fit'
}
```

---

## Regras de validação

- [ ] weeksOut: Minor 1-2, Moderate 2-4, Severe 3-6, ACL 8-12, Fracture 4-8, Concussion 1-2
- [ ] Recovery 0-100%, progride cada semana
- [ ] Lesionado NÃO joga (bench automático)
- [ ] Stat penalty: -5 até -20 (varia por tipo)
- [ ] Psicológico efeito: -3 moral enquanto lesionado

---

## Forbidden

- [ ] weeksOut < 0
- [ ] Lesionado joga mesmo assim
- [ ] Recovery > 100%
- [ ] Stat penalty > -30 (demais)

---

## Testes

```javascript
describe('SPEC-005: Injury System', () => {
  test('Minor injury 1-2 weeks', () => {
    for (let i = 0; i < 50; i++) {
      const inj = InjurySystem.injurePlayer({ playerId: 1, type: 'Minor', week: 1 });
      expect(inj.weeksOut).toBeGreaterThanOrEqual(1);
      expect(inj.weeksOut).toBeLessThanOrEqual(2);
    }
  });

  test('Injured player bench', () => {
    InjurySystem.injurePlayer({ playerId: 1, type: 'Moderate' });
    const team = engine.getTeam(1);
    expect(team.squad.find(p => p.id === 1).position).toBe('BENCH');
  });

  test('Forbidden: weeksOut < 0', () => {
    const inj = InjurySystem.injurePlayer({ playerId: 1, type: 'ACL' });
    expect(inj.weeksOut).toBeGreaterThan(0);
  });
});
```

**Status**: PRONTO
