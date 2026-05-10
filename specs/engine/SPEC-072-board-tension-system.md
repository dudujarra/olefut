# SPEC-072: Board Tension System — Tensão Acumulada com Presidente

**Fase:** 3C — Técnico como Personagem  
**Prioridade:** ALTA (pós-refactor)  
**Pré-requisito:** SPEC-070 Manager Identity + SPEC-071 Contract Goals  
**Upgrade de:** SPEC-006 Board System (expande, não substitui)  
**AKITA:** a definir

---

## O que é

Sistema de tensão acumulada entre técnico e presidente do clube. Cada interferência do board (vender jogador sem consentimento, forçar tática, negar contratação) aumenta tensão. Bons resultados diminuem. Tension chega a thresholds que mudam a dinâmica de jogo fundamentalmente.

Resolve o problema de board genérico e sem stakes — atualmente demissão parece arbitrária. Com tensão visível, jogador sabe o que está causando e pode gerenciar.

---

## Input (evento que afeta tensão)

```typescript
{
  managerId: number,
  clubId: number,
  eventType: 
    | 'board_sold_player'          // board vendeu jogador sem aprovação
    | 'board_forced_tactic'        // board forçou mudança de tática
    | 'board_denied_signing'       // board negou contratação pedida
    | 'win_streak'                 // 3+ vitórias seguidas
    | 'title_won'                  // campeonato conquistado
    | 'loss_streak'                // 5+ derrotas seguidas
    | 'press_conference_positive'  // coletiva com boa narrativa
    | 'press_conference_hostile'   // coletiva que critica diretoria
    | 'contract_fulfilled'         // objetivo da season cumprido
  currentTension: number           // -100 a +100 (positivo = confiança, negativo = tensão)
}
```

---

## Output esperado

```typescript
{
  newTension: number,         // -100 a +100
  tensionDelta: number,
  threshold: 'carta_branca' | 'cobrado' | 'ultimato' | 'demitido' | 'normal',
  thresholdChanged: boolean,
  boardMessage?: string       // mensagem do presidente ao mudar threshold
}
```

**Deltas por evento:**
```
board_sold_player:         -20
board_forced_tactic:       -15
board_denied_signing:      -10
win_streak:                +8
title_won:                 +25
loss_streak:               -15
press_conference_positive: +5
press_conference_hostile:  -10
contract_fulfilled:        +20
```

**Thresholds:**
```
tension ≥ 80  → carta_branca (board não interfere)
tension 40-79 → normal
tension 10-39 → cobrado (board exige resultados)
tension -20-9 → ultimato (próxima season ou será demitido)
tension < -20 → demitido (imediato)
```

---

## Regras de validação

- [ ] `tension` sempre -100 a +100 (clampado)
- [ ] `board_sold_player` sempre reduz tensão em exatamente 20
- [ ] `title_won` sempre aumenta tensão em exatamente 25
- [ ] Threshold `demitido` dispara demissão imediata do manager
- [ ] Threshold `carta_branca` desativa todas interferências do board
- [ ] `boardMessage` sempre presente quando threshold muda
- [ ] Tensão não decai espontaneamente (só via eventos)
- [ ] Player vê barra de tensão na UI (não é hidden mechanic)

---

## Forbidden

- [ ] Tensão fora de -100 a +100
- [ ] Demissão sem tensão ter atingido threshold `demitido` ou `ultimato` + falha
- [ ] Board interferir quando tension ≥ 80 (`carta_branca`)
- [ ] `boardMessage` vazio quando threshold muda
- [ ] Tensão resetar a zero ao virar season (memória de longo prazo)

---

## Implementação

**Arquivo:** `src/engine/BoardTensionSystem.js` (novo, integra com SPEC-006)  
**Schema save:** `save.managers[id].boardTension = number`  
**UI:** barra de tensão visível em BoardView e Dashboard

---

## Testes esperados

```javascript
describe('SPEC-072: Board Tension System', () => {
  test('tension clamped 0-100 (rule 1)', () => {
    let t = BoardTensionSystem.apply({ currentTension: 95, eventType: 'title_won' });
    expect(t.newTension).toBeLessThanOrEqual(100);

    t = BoardTensionSystem.apply({ currentTension: -15, eventType: 'board_sold_player' });
    expect(t.newTension).toBeGreaterThanOrEqual(-100);
  });

  test('board_sold_player delta = -20 (rule 2)', () => {
    const result = BoardTensionSystem.apply({ currentTension: 50, eventType: 'board_sold_player' });
    expect(result.tensionDelta).toBe(-20);
    expect(result.newTension).toBe(30);
  });

  test('title_won delta = +25 (rule 3)', () => {
    const result = BoardTensionSystem.apply({ currentTension: 50, eventType: 'title_won' });
    expect(result.tensionDelta).toBe(25);
    expect(result.newTension).toBe(75);
  });

  test('tension < -20 → demitido threshold (rule 4)', () => {
    const result = BoardTensionSystem.apply({ currentTension: -10, eventType: 'board_sold_player' });
    expect(result.threshold).toBe('demitido');
    expect(result.thresholdChanged).toBe(true);
  });

  test('tension ≥ 80 → carta_branca, board cannot interfere (rule 5)', () => {
    const result = BoardTensionSystem.apply({ currentTension: 75, eventType: 'title_won' });
    expect(result.threshold).toBe('carta_branca');

    const canInterfere = BoardTensionSystem.canBoardInterfere({ tension: 82 });
    expect(canInterfere).toBe(false);
  });

  test('boardMessage present on threshold change (rule 6)', () => {
    const result = BoardTensionSystem.apply({ currentTension: 42, eventType: 'loss_streak' });
    if (result.thresholdChanged) expect(result.boardMessage).toBeTruthy();
  });

  test('tension persists across seasons (rule 8)', () => {
    const save = { managers: { 1: { boardTension: -5 } } };
    const afterSeason = BoardTensionSystem.endSeason(save, managerId=1);
    expect(afterSeason.managers[1].boardTension).toBe(-5); // não resetou
  });

  test('forbidden: board interferes at carta_branca (rule forbidden 3)', () => {
    const canInterfere = BoardTensionSystem.canBoardInterfere({ tension: 80 });
    expect(canInterfere).toBe(false);
  });
});
```

---

## Definition of Done
- [ ] `BoardTensionSystem.js` passa todos os 8 testes
- [ ] Barra de tensão visível para player-manager
- [ ] Board não interfere em `carta_branca` (testado em autoplay 5 seasons)
- [ ] Demissão sempre precedida por threshold `ultimato` ou evento direto

## Definition of Stop
- Se demissões ocorrerem muito rápido (< 1 season): aumentar buffer do threshold `ultimato` para -40
