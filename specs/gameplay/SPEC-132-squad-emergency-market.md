# SPEC-132: Squad Emergency Market — Trigger de Emergência por Elenco Reduzido

**Fase:** 0 — Gameplay Fix  
**Prioridade:** URGENTE  
**Telemetria:** SQUAD_SHORT anomalias (7 players season 44, recorrente)  
**AKITA:** a definir no PR

---

## O que é

Trigger automático de mercado de emergência quando elenco cai abaixo do mínimo jogável. Atualmente o jogo deixa time com 7 jogadores continuar sem reação — nem NPC nem player recebem alerta ou são forçados a agir.

**Dois comportamentos distintos:**
1. **NPC:** Aciona compra automática via mercado (emergência silenciosa)
2. **Player-manager:** Recebe alerta + janela de mercado forçada (decisão do jogador)

---

## Input

```typescript
{
  teamId: number,
  squadSize: number,        // jogadores disponíveis (não lesionados)
  budget: number,           // dinheiro disponível
  isPlayerManager: boolean,
  week: number,
  season: number
}
```

---

## Output esperado

```typescript
// Para NPC:
{
  triggered: boolean,
  action: 'auto_buy' | 'none',
  playersBought: Array<{ playerId: number, name: string, ovr: number, cost: number }>,
  budgetSpent: number
}

// Para Player-manager:
{
  triggered: boolean,
  action: 'alert_player',
  alertMessage: string,      // mensagem de crise exibida
  forceMarketOpen: boolean   // abre tela de mercado forçada
}
```

**Thresholds:**
- `squadSize < 11` → trigger nível 1 (alerta)
- `squadSize < 8` → trigger nível 2 (crise — mercado forçado / NPC compra imediato)

---

## Regras de validação

- [ ] `squadSize < 11` sempre dispara alerta (ambos player e NPC)
- [ ] `squadSize < 8` sempre aciona mercado de emergência
- [ ] NPC com `squadSize < 8`: compra ≥1 jogador até atingir 11
- [ ] NPC só compra se budget > 0 (não entra em dívida para emergência)
- [ ] Player recebe mensagem de alerta visível (não silenciosa)
- [ ] Player-manager não tem compra automática — apenas alerta e abertura de mercado
- [ ] Trigger não dispara mais de 1x por semana por time
- [ ] Após atingir 11 players: trigger desativa

---

## Forbidden

- [ ] Time com `squadSize < 8` jogar semana seguinte sem ação
- [ ] NPC comprar jogador acima da média OVR do elenco (não up-grade em emergência, só fill)
- [ ] Player-manager ter compra automática (viola agência do jogador)
- [ ] Trigger disparar em loop (comprar, vender, comprar)
- [ ] Alert silencioso (player deve ver a notificação)

---

## Implementação

**Arquivo:** `src/engine/SquadHealthMonitor.js` (novo)  
**Integração:** `src/engine/engine.js` → `prepareWeek()` chama `SquadHealthMonitor.check(teamId)`  
**UI:** `src/views/AlertView.js` → modal de crise para player-manager

---

## Testes esperados

```javascript
describe('SPEC-132: Squad Emergency Market', () => {
  test('squadSize < 11 → alert triggered (rule 1)', () => {
    const result = SquadHealthMonitor.check({ teamId: 1, squadSize: 10, isPlayerManager: false, budget: 1000 });
    expect(result.triggered).toBe(true);
  });

  test('NPC squadSize < 8 → auto_buy triggered (rule 2)', () => {
    const result = SquadHealthMonitor.check({ teamId: 5, squadSize: 7, isPlayerManager: false, budget: 5000 });
    expect(result.action).toBe('auto_buy');
    expect(result.playersBought.length).toBeGreaterThanOrEqual(1);
  });

  test('NPC auto_buy brings squad to ≥11 (rule 3)', () => {
    const result = SquadHealthMonitor.check({ teamId: 5, squadSize: 7, isPlayerManager: false, budget: 5000 });
    expect(result.playersBought.length).toBeGreaterThanOrEqual(4);
  });

  test('NPC budget=0 → no auto_buy (rule 4)', () => {
    const result = SquadHealthMonitor.check({ teamId: 5, squadSize: 7, isPlayerManager: false, budget: 0 });
    expect(result.playersBought.length).toBe(0);
  });

  test('player-manager → alert_player, no auto_buy (rule 6)', () => {
    const result = SquadHealthMonitor.check({ teamId: 1, squadSize: 7, isPlayerManager: true, budget: 5000 });
    expect(result.action).toBe('alert_player');
    expect(result.forceMarketOpen).toBe(true);
    expect(result.playersBought).toBeUndefined();
  });

  test('trigger once per week (rule 7)', () => {
    SquadHealthMonitor.check({ teamId: 1, squadSize: 9, isPlayerManager: false, budget: 1000, week: 5 });
    const second = SquadHealthMonitor.check({ teamId: 1, squadSize: 9, isPlayerManager: false, budget: 1000, week: 5 });
    expect(second.triggered).toBe(false);
  });

  test('squad ≥ 11 → no trigger (rule 8)', () => {
    const result = SquadHealthMonitor.check({ teamId: 1, squadSize: 11, isPlayerManager: false, budget: 1000 });
    expect(result.triggered).toBe(false);
  });

  test('bought players OVR ≤ squad avg OVR (rule forbidden 2)', () => {
    const result = SquadHealthMonitor.check({ teamId: 5, squadSize: 7, isPlayerManager: false, budget: 5000, squadAvgOvr: 65 });
    result.playersBought.forEach(p => expect(p.ovr).toBeLessThanOrEqual(70));
  });
});
```

---

## Definition of Done
- [ ] `SquadHealthMonitor.js` existe e passa todos os 8 testes
- [ ] SQUAD_SHORT anomalia não repete mais de 1x por season em autoplay
- [ ] Player-manager recebe modal visível ao cair abaixo de 11

## Definition of Stop
- Se auto_buy de NPC desequilibrar economia (budget cai a zero): capping em 50% do budget disponível
