# SPEC-076: Humiliation Cascade — Vexame com Consequências Narrativas

**Fase:** 4C — Mito + Cascata Emocional  
**Prioridade:** MÉDIA  
**Telemetria:** SPEC-106 Emotional Arc score=100 (base boa) mas VEXAME sem cascata — 0-8 virou apenas data point  
**Pré-requisito:** SPEC-070 Manager Identity + SPEC-072 Board Tension  
**AKITA:** a definir

---

## O que é

Quando um time leva uma goleada humilhante (0-5+), o sistema dispara cascata de consequências narrativas reais. Atualmente VEXAME é registrado como anomalia mas não altera nada — 0-8 na season 2 e o jogo continua exatamente igual.

O objetivo é que humilhação seja um momento de virada — para o bem (superação) ou para o mal (colapso).

**Níveis de humilhação:**
- Nível 1: derrota por 4+ gols de diferença
- Nível 2: derrota por 6+ gols (vexame)
- Nível 3: derrota por 8+ gols (escândalo nacional)

---

## Input

```typescript
{
  teamId: number,
  managerId: number,
  scoreDiff: number,       // gols sofridos - gols marcados (positivo = derrota)
  homeOrAway: 'home' | 'away',
  week: number,
  season: number,
  managerTension: number,  // tensão atual com board
  isPlayerManager: boolean
}
```

---

## Output esperado

```typescript
{
  humiliationLevel: 0 | 1 | 2 | 3,
  cascadeEvents: Array<{
    type: 'morale_collapse' | 'board_meeting' | 'press_hostility' | 'fan_protest' | 'player_request_transfer' | 'manager_ultimatum',
    severity: number,      // 0-1
    description: string,
    tensionDelta?: number  // para board events
  }>,
  survivalNarrative: {
    active: boolean,       // se manager sobrevive ao vexame, começa narrativa de superação
    milestoneDescription: string  // "Técnico sobrevive ao escândalo — agora é provar que foi só uma vez"
  }
}
```

**Mapeamento de cascata por nível:**
```
Nível 1 (diff 4-5):
  - morale_collapse (severity 0.4)
  - press_hostility (severity 0.3)

Nível 2 (diff 6-7):
  + board_meeting (tensionDelta -15)
  + fan_protest (severity 0.6)

Nível 3 (diff 8+):
  + player_request_transfer (1 jogador aleatório quer sair)
  + manager_ultimatum (tensionDelta -30)
  + survivalNarrative.active = true (se manager não for demitido)
```

---

## Regras de validação

- [ ] `humiliationLevel=0` se `scoreDiff < 4`
- [ ] Nível 1: pelo menos `morale_collapse` e `press_hostility` disparados
- [ ] Nível 2: adiciona `board_meeting` com `tensionDelta -15`
- [ ] Nível 3: adiciona `manager_ultimatum` com `tensionDelta -30`
- [ ] `survivalNarrative.active=true` apenas se manager sobrevive ao nível 3
- [ ] `cascadeEvents` nunca vazio para level ≥ 1
- [ ] Player-manager vê todos os eventos na UI (não silenciosos)
- [ ] Derrota em nível 3 pelo técnico que sobrevive = narrativa "O Ressurgimento" ativada

---

## Forbidden

- [ ] Vexame level ≥ 2 sem nenhuma reação do board
- [ ] Vexame tratado como derrota normal (sem cascata)
- [ ] `tensionDelta` positivo em evento de humilhação
- [ ] `cascadeEvents` vazio para `humiliationLevel ≥ 1`
- [ ] Player não ser notificado sobre `player_request_transfer`

---

## Implementação

**Arquivo:** `src/engine/HumiliationCascadeSystem.js` (novo)  
**Integração:** `engine.playMatch()` → ao calcular resultado, chama `HumiliationCascadeSystem.evaluate()`  
**Integração narrativa:** eventos emitidos para NarrativeService (quando SPEC-049 ativo)

---

## Testes esperados

```javascript
describe('SPEC-076: Humiliation Cascade', () => {
  test('scoreDiff < 4 → level 0, no cascade (rule 1)', () => {
    const result = HumiliationCascadeSystem.evaluate({ scoreDiff: 3, ...defaults });
    expect(result.humiliationLevel).toBe(0);
    expect(result.cascadeEvents.length).toBe(0);
  });

  test('level 1: morale_collapse + press_hostility (rule 2)', () => {
    const result = HumiliationCascadeSystem.evaluate({ scoreDiff: 4, ...defaults });
    expect(result.humiliationLevel).toBe(1);
    const types = result.cascadeEvents.map(e => e.type);
    expect(types).toContain('morale_collapse');
    expect(types).toContain('press_hostility');
  });

  test('level 2: adds board_meeting with tensionDelta -15 (rule 3)', () => {
    const result = HumiliationCascadeSystem.evaluate({ scoreDiff: 6, managerTension: 50, ...defaults });
    const boardEvent = result.cascadeEvents.find(e => e.type === 'board_meeting');
    expect(boardEvent).toBeDefined();
    expect(boardEvent.tensionDelta).toBe(-15);
  });

  test('level 3: manager_ultimatum tensionDelta -30 (rule 4)', () => {
    const result = HumiliationCascadeSystem.evaluate({ scoreDiff: 8, managerTension: 30, ...defaults });
    const ultimatum = result.cascadeEvents.find(e => e.type === 'manager_ultimatum');
    expect(ultimatum.tensionDelta).toBe(-30);
  });

  test('survival narrative active if manager survives level 3 (rule 5)', () => {
    const result = HumiliationCascadeSystem.evaluate({ scoreDiff: 8, managerTension: 60, ...defaults });
    expect(result.survivalNarrative.active).toBe(true);
    expect(result.survivalNarrative.milestoneDescription).toBeTruthy();
  });

  test('cascadeEvents never empty for level ≥ 1 (rule 6)', () => {
    const result = HumiliationCascadeSystem.evaluate({ scoreDiff: 5, ...defaults });
    expect(result.cascadeEvents.length).toBeGreaterThan(0);
  });

  test('level 3 includes player_request_transfer (rule 4b)', () => {
    const result = HumiliationCascadeSystem.evaluate({ scoreDiff: 9, ...defaults });
    expect(result.cascadeEvents.map(e => e.type)).toContain('player_request_transfer');
  });

  test('forbidden: tensionDelta positive in humiliation event', () => {
    const result = HumiliationCascadeSystem.evaluate({ scoreDiff: 7, ...defaults });
    result.cascadeEvents.filter(e => e.tensionDelta !== undefined).forEach(e => {
      expect(e.tensionDelta).toBeLessThan(0);
    });
  });
});
```

---

## Definition of Done
- [ ] `HumiliationCascadeSystem.js` passa todos os 8 testes
- [ ] VEXAME anomalia em autoplay agora dispara cascata visível
- [ ] `survivalNarrative` integrado como arco narrativo (mesmo que texto simples)

## Definition of Stop
- Se cascatas de nível 3 causarem demissão imediata muito frequente (> 80% dos casos): reduzir tensionDelta de ultimatum para -20
