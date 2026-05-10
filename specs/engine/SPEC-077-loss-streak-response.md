# SPEC-077: Loss Streak Response — Mecânica de Resposta a Sequência de Derrotas

**Fase:** 5C — Rivalidades com Peso  
**Prioridade:** MÉDIA  
**Telemetria:** Anomalias LOSS_STREAK até 12 derrotas seguidas sem nenhuma reação mecânica  
**Pré-requisito:** SPEC-072 Board Tension + SPEC-076 Humiliation Cascade  
**AKITA:** a definir

---

## O que é

Sistema de resposta a sequências de derrotas que oferece ao player escolhas reais de gestão de crise. Atualmente 12 derrotas seguidas (season 83) acontecem e o jogo continua como se nada fosse. A resposta à crise transforma loss streaks de anomalia passiva em momento ativo de decisão.

**Diferença de SPEC-076:** Humiliation Cascade trata uma derrota vexatória pontual. LOSS_STREAK trata acumulação de derrotas normais ao longo de semanas.

---

## Input

```typescript
{
  teamId: number,
  managerId: number,
  streakLength: number,      // número de derrotas seguidas
  currentTension: number,
  squadMorale: number,       // 0-100
  isPlayerManager: boolean,
  week: number
}
```

---

## Output esperado

```typescript
{
  streakSeverity: 'mild' | 'serious' | 'crisis' | 'collapse',
  forcedEvent: boolean,          // se true: player deve responder antes de continuar
  responseOptions?: Array<{
    id: string,
    label: string,               // "Convocar reunião de elenco"
    effect: {
      moraleDelta: number,
      tensionDelta: number,
      tacticLock?: number        // semanas que tática fica travada após escolha
    }
  }>,
  npcResponse?: {                // para times NPC
    action: 'tactic_change' | 'emergency_training' | 'star_benched',
    description: string
  }
}
```

**Thresholds:**
```
streakLength 3-4 → mild (aviso visual, sem choice)
streakLength 5-7 → serious (torcida pede mudança, choice opcional)
streakLength 8-10 → crisis (board interfere, choice obrigatória)
streakLength 11+ → collapse (demissão iminente, tensão -40)
```

**Response options (para player):**

| ID | Label | Efeito |
|----|-------|--------|
| `squad_meeting` | "Reunião de elenco" | morale +10, sem custo |
| `intensive_training` | "Semana de treino intensivo" | morale +5, próxima semana sem press |
| `change_tactic` | "Mudar tática radicalmente" | tensão -5, tactic muda aleatoriamente |
| `public_statement` | "Coletiva de imprensa positiva" | tensão +5, morale +8, mas se perder próximo: -15 morale |
| `resign` | "Pedir demissão" | sai do clube sem penalidade de reputação |

---

## Regras de validação

- [ ] `streakLength ≥ 5` gera response options para player-manager
- [ ] `streakLength ≥ 8` torna choice obrigatória (forcedEvent=true)
- [ ] `streakLength ≥ 11` aplica tensão -40 automaticamente
- [ ] NPC recebe `npcResponse` automático (não choice)
- [ ] `resign` opção disponível sempre (sem penalidade se streak ≥ 8)
- [ ] Response options nunca vazias se `streakSeverity ≥ serious`
- [ ] Morale não cai abaixo de 5 por streak (floor para evitar death spiral)
- [ ] Streak reset após vitória (não cumulativo entre seasons)

---

## Forbidden

- [ ] `streakLength ≥ 11` sem nenhuma reação do board
- [ ] Player forçado a fazer choice sem opções disponíveis
- [ ] Morale cair abaixo de 5 por este sistema
- [ ] NPC com choice options (NPCs têm resposta automática)
- [ ] Streak de uma season contaminar próxima season

---

## Implementação

**Arquivo:** `src/engine/LossStreakResponseSystem.js` (novo)  
**Integração:** `engine.endWeek()` → detecta streak e chama sistema  
**UI:** modal de crise para player quando `forcedEvent=true`

---

## Testes esperados

```javascript
describe('SPEC-077: Loss Streak Response', () => {
  test('streak 3-4 → mild, no force (rule thresholds)', () => {
    const result = LossStreakResponseSystem.evaluate({ streakLength: 4, ...defaults });
    expect(result.streakSeverity).toBe('mild');
    expect(result.forcedEvent).toBe(false);
  });

  test('streak 5+ → response options for player (rule 1)', () => {
    const result = LossStreakResponseSystem.evaluate({ streakLength: 5, isPlayerManager: true, ...defaults });
    expect(result.responseOptions.length).toBeGreaterThan(0);
  });

  test('streak 8+ → forcedEvent=true (rule 2)', () => {
    const result = LossStreakResponseSystem.evaluate({ streakLength: 8, isPlayerManager: true, ...defaults });
    expect(result.forcedEvent).toBe(true);
  });

  test('streak 11+ → tension -40 auto (rule 3)', () => {
    const result = LossStreakResponseSystem.evaluate({ streakLength: 11, currentTension: 50, ...defaults });
    expect(result.tensionApplied).toBe(-40);
  });

  test('NPC gets automatic response, no options (rule 4)', () => {
    const result = LossStreakResponseSystem.evaluate({ streakLength: 7, isPlayerManager: false, ...defaults });
    expect(result.npcResponse).toBeDefined();
    expect(result.responseOptions).toBeUndefined();
  });

  test('resign always available in crisis (rule 5)', () => {
    const result = LossStreakResponseSystem.evaluate({ streakLength: 9, isPlayerManager: true, ...defaults });
    expect(result.responseOptions.some(o => o.id === 'resign')).toBe(true);
  });

  test('morale floor at 5 (rule 7)', () => {
    const result = LossStreakResponseSystem.evaluate({ streakLength: 15, squadMorale: 8, ...defaults });
    expect(result.moraleFloorApplied).toBe(true);
    expect(result.newMorale).toBeGreaterThanOrEqual(5);
  });

  test('streak resets after win (rule 8)', () => {
    LossStreakResponseSystem.recordResult({ teamId: 1, result: 'W' });
    const streak = LossStreakResponseSystem.getCurrentStreak(1);
    expect(streak).toBe(0);
  });
});
```

---

## Definition of Done
- [ ] `LossStreakResponseSystem.js` passa todos os 8 testes
- [ ] LOSS_STREAK anomalia em autoplay dispara resposta NPC automática
- [ ] Player recebe modal de choice quando streak ≥ 8 em modo player

## Definition of Stop
- Se morale floor de 5 criar times em colapso permanente: aumentar floor para 15
