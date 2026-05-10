# SPEC-075: Star Player Protection — Craque Protegido pelo Técnico

**Fase:** 4B — Mito + Craque Protegido  
**Prioridade:** MÉDIA (pós-Fase 3)  
**Pré-requisito:** SPEC-070 Manager Identity + SPEC-072 Board Tension  
**AKITA:** a definir

---

## O que é

Técnico pode declarar proteção pública a um jogador do elenco. Essa declaração cria uma relação bidirecional com stakes narrativos: se o craque vai bem, técnico é herói; se vai mal, técnico é vilão. Se o board tenta vender o protegido, tensão sobe automaticamente.

Máximo 1 jogador protegido por vez.

---

## Input (declarar proteção)

```typescript
{
  managerId: number,
  playerId: number,           // jogador a proteger
  playerName: string,
  playerOvr: number,
  publicDeclaration: boolean  // se true: aparece em press + narrativa
}
```

---

## Output esperado

```typescript
// Estado da proteção
{
  protectedPlayerId: number,
  protectedPlayerName: string,
  active: boolean,
  declaredPublicly: boolean,
  performanceSince: {
    games: number,
    goals: number,
    assists: number,
    avgRating: number           // 5-10
  },
  narrativeState: 'hero' | 'villain' | 'neutral'  // baseado em performance
}

// Evento quando board tenta vender protegido:
{
  type: 'board_threatened_protected',
  tensionDelta: -30,           // spike de tensão
  publicReaction: string,      // "Torcida apoia técnico", "Imprensa critica diretoria"
  managerChoice: 'defend' | 'capitulate'
}
```

**Cálculo de narrativeState:**
```
avgRating ≥ 7.5 + games ≥ 5 → 'hero' (técnico parece gênio)
avgRating < 6.0 + games ≥ 5 → 'villain' (técnico parece errado)
games < 5 → 'neutral' (cedo demais pra julgar)
```

---

## Regras de validação

- [ ] Máximo 1 jogador protegido por técnico simultaneamente
- [ ] Proteção pública gera evento de press conference
- [ ] Board tentando vender protegido: tensão -30 imediato (spike)
- [ ] `narrativeState` calculado a partir de performance real (não hardcoded)
- [ ] `hero` state: press publica manchete positiva sobre técnico
- [ ] `villain` state: press critica escolha do técnico
- [ ] Proteção pode ser revogada pelo técnico (sem penalidade mas gera narrativa)
- [ ] Jogador protegido não pode ser vendido pelo board sem aprovação explícita do player

---

## Forbidden

- [ ] Dois jogadores protegidos simultaneamente
- [ ] Board vender protegido sem acionar tensão spike
- [ ] `narrativeState` calculado sem dados reais de performance
- [ ] Proteção silenciosa (sem nenhuma narrativa ou UI feedback)
- [ ] Proteção de jogador lesionado de longo prazo (>8 semanas)

---

## Implementação

**Arquivo:** `src/engine/StarProtectionSystem.js` (novo)  
**Schema save:** `save.managers[id].protectedPlayerId`  
**Integração:** `TransferSystem` verifica proteção antes de processar venda  
**UI:** badge no card do jogador protegido + notificação em press events

---

## Testes esperados

```javascript
describe('SPEC-075: Star Player Protection', () => {
  test('only 1 protected player at a time (rule 1)', () => {
    StarProtectionSystem.protect({ managerId: 1, playerId: 10 });
    expect(() => StarProtectionSystem.protect({ managerId: 1, playerId: 20 }))
      .toThrow('AlreadyProtecting');
  });

  test('public declaration creates press event (rule 2)', () => {
    const events = StarProtectionSystem.protect({ managerId: 1, playerId: 10, publicDeclaration: true });
    expect(events.pressEvent).toBeDefined();
    expect(events.pressEvent.type).toBe('manager_protects_player');
  });

  test('board sell attempt → tension -30 (rule 3)', () => {
    StarProtectionSystem.protect({ managerId: 1, playerId: 10 });
    const event = StarProtectionSystem.onBoardSellAttempt({ managerId: 1, playerId: 10 });
    expect(event.tensionDelta).toBe(-30);
  });

  test('narrativeState hero when avgRating ≥ 7.5 (rule 4)', () => {
    const state = StarProtectionSystem.computeState({
      performanceSince: { games: 6, avgRating: 7.8 }
    });
    expect(state.narrativeState).toBe('hero');
  });

  test('narrativeState villain when avgRating < 6 (rule 4b)', () => {
    const state = StarProtectionSystem.computeState({
      performanceSince: { games: 6, avgRating: 5.5 }
    });
    expect(state.narrativeState).toBe('villain');
  });

  test('hero state generates positive press (rule 5)', () => {
    const events = StarProtectionSystem.generateNarrativeEvents({ narrativeState: 'hero', ...defaults });
    expect(events.some(e => e.sentiment === 'positive')).toBe(true);
  });

  test('protection can be revoked (rule 7)', () => {
    StarProtectionSystem.protect({ managerId: 1, playerId: 10 });
    const result = StarProtectionSystem.revoke({ managerId: 1 });
    expect(result.narrativeEvent.type).toBe('manager_revoked_protection');
    expect(StarProtectionSystem.getProtected(1)).toBeNull();
  });

  test('forbidden: protect injured player 8+ weeks (rule forbidden 5)', () => {
    expect(() => StarProtectionSystem.protect({ managerId: 1, playerId: 10, injuryWeeksLeft: 9 }))
      .toThrow('PlayerUnavailableLongTerm');
  });
});
```

---

## Definition of Done
- [ ] `StarProtectionSystem.js` passa todos os 8 testes
- [ ] Badge visível no card do jogador protegido
- [ ] Board não vende protegido sem tensor spike e aprovação

## Definition of Stop
- Se tensão spike de -30 causar demissão muito frequente: reduzir para -20 e avaliar
