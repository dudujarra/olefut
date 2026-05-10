# SPEC-131: AI Tactic Pivot — Auto-Adaptação de Tática NPC

**Fase:** 0 — Gameplay Fix  
**Prioridade:** URGENTE  
**Telemetria:** SPEC-100 Monotony score=11, TACTIC_STUCK 100+ eventos em 203 seasons  
**AKITA:** a definir no PR

---

## O que é

Sistema que detecta tática ineficaz nos técnicos NPC e força adaptação automática. Sem isso, tática travada por 8-11 semanas é a norma — o maior responsável pelo Monotony score=11.

**Escopo:** Apenas técnicos NPC (AI). Player-manager não é afetado — é decisão do jogador.

---

## Input

```typescript
{
  teamId: number,
  currentTactic: 'Ofensivo' | 'Defensivo' | 'Normal' | 'Pressing' | 'Contra-Ataque',
  recentResults: Array<{ week: number, result: 'W' | 'D' | 'L' }>, // últimas 6 semanas
  squadOvr: number, // OVR médio do elenco
  opponentOvr: number // OVR médio do adversário na semana
}
```

---

## Output esperado

```typescript
{
  tactic: 'Ofensivo' | 'Defensivo' | 'Normal' | 'Pressing' | 'Contra-Ataque',
  changed: boolean,
  reason?: 'losing_streak' | 'ovr_mismatch' | 'form_recovery' | 'manual'
}
```

**Regra de pivot:**
- 3+ derrotas seguidas → 70% chance de trocar tática
- 5+ derrotas seguidas → 95% chance de trocar tática
- OVR time < OVR adversário em -10+ → preferir 'Defensivo' ou 'Contra-Ataque'
- OVR time > OVR adversário em +10+ → preferir 'Ofensivo' ou 'Pressing'
- Não repetir a tática que causou a série de derrotas

---

## Regras de validação

- [ ] NPC com 3+ derrotas seguidas: troca tática em ≥70% dos casos
- [ ] NPC com 5+ derrotas: troca tática em ≥95% dos casos
- [ ] Tática nova ≠ tática da série perdedora
- [ ] Pivot considera OVR mismatch (não só resultado)
- [ ] Player-manager NÃO é afetado (escopo só NPC)
- [ ] Após 2 vitórias com nova tática: estabiliza (não troca mais por 4 semanas)
- [ ] TACTIC_STUCK anomalia não dispara mais que 5% das semanas após fix
- [ ] Seed determinístico: mesmo input com mesma seed → mesmo output

---

## Forbidden

- [ ] Player-manager ter tática alterada por este sistema
- [ ] NPC alternar táticas toda semana (oscilação sem critério)
- [ ] NPC usar mesma tática perdedora por mais de 6 semanas seguidas
- [ ] Pivot ignorar OVR (só olhar resultado)
- [ ] Lógica de pivot dentro do match engine (deve ser separado)

---

## Implementação

**Arquivo:** `src/engine/NpcTacticAdvisor.js` (novo)  
**Integração:** `src/engine/engine.js` → `prepareWeek()` chama `NpcTacticAdvisor.advise(teamId)`  
**Dependências:** `engine.getRecentResults(teamId, n)`, `engine.getSquadOvr(teamId)`

---

## Testes esperados

```javascript
describe('SPEC-131: AI Tactic Pivot', () => {
  test('3 losses → pivot triggered ≥70% (rule 1)', () => {
    const results = Array(3).fill({ result: 'L' });
    const outcomes = Array(100).fill(null).map(() =>
      NpcTacticAdvisor.advise({ currentTactic: 'Ofensivo', recentResults: results, ...defaults })
    );
    const changes = outcomes.filter(o => o.changed).length;
    expect(changes).toBeGreaterThanOrEqual(70);
  });

  test('5 losses → pivot triggered ≥95% (rule 2)', () => {
    const results = Array(5).fill({ result: 'L' });
    const outcomes = Array(100).fill(null).map(() =>
      NpcTacticAdvisor.advise({ currentTactic: 'Ofensivo', recentResults: results, ...defaults })
    );
    expect(outcomes.filter(o => o.changed).length).toBeGreaterThanOrEqual(95);
  });

  test('new tactic ≠ losing tactic (rule 3)', () => {
    const result = NpcTacticAdvisor.advise({
      currentTactic: 'Defensivo',
      recentResults: Array(5).fill({ result: 'L' }),
      ...defaults
    });
    if (result.changed) expect(result.tactic).not.toBe('Defensivo');
  });

  test('player-manager not affected (rule 5)', () => {
    expect(() => NpcTacticAdvisor.advise({ isPlayerManager: true, ... }))
      .toThrow('PlayerManagerNotAllowed');
  });

  test('stabilizes after 2 wins (rule 6)', () => {
    const afterWins = NpcTacticAdvisor.advise({
      currentTactic: 'Pressing',
      recentResults: [{ result: 'W' }, { result: 'W' }],
      tacticAge: 2,
      ...defaults
    });
    expect(afterWins.changed).toBe(false);
  });

  test('determinism: same input same seed → same output (rule 8)', () => {
    const input = { currentTactic: 'Normal', recentResults: Array(4).fill({ result: 'L' }), ...defaults };
    const r1 = NpcTacticAdvisor.advise(input, { seed: 42 });
    const r2 = NpcTacticAdvisor.advise(input, { seed: 42 });
    expect(r1.tactic).toBe(r2.tactic);
  });

  test('ovr mismatch -10 → prefers Defensivo or Contra-Ataque (rule 4)', () => {
    const result = NpcTacticAdvisor.advise({
      currentTactic: 'Ofensivo',
      squadOvr: 60, opponentOvr: 75,
      recentResults: Array(3).fill({ result: 'L' }),
    });
    if (result.changed) expect(['Defensivo', 'Contra-Ataque']).toContain(result.tactic);
  });

  test('ovr mismatch +10 → prefers Ofensivo or Pressing (rule 4b)', () => {
    const result = NpcTacticAdvisor.advise({
      currentTactic: 'Defensivo',
      squadOvr: 80, opponentOvr: 65,
      recentResults: Array(3).fill({ result: 'L' }),
    });
    if (result.changed) expect(['Ofensivo', 'Pressing']).toContain(result.tactic);
  });
});
```

---

## Definition of Done
- [ ] `NpcTacticAdvisor.js` existe e passa todos os 7 testes
- [ ] Integrado em `prepareWeek()` ou equivalente
- [ ] Autoplay 10 seasons: TACTIC_STUCK anomalia < 5% das semanas
- [ ] Monotony score sobe de 11 → ≥40 no próximo playtest

## Definition of Stop
- Se pivot causar instabilidade (times trocam tática toda semana): recuar para threshold 5+ derrotas mínimo
- Se Monotony score não subir após fix: investigar causa raiz alternativa (pode ser progressão, não tática)
