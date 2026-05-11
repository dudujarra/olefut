# SPEC-139: Emotional Engine — Fix Bias para ANXIOUS

> **Origem**: deep soak reportou `emotionalState: ANXIOUS` dominante em 20 temporadas (win rate real ~42%).
> Causa identificada: DRAW nunca sai de ANXIOUS — agente fica preso mesmo com desempenho razoável.

---

## O que é

Corrige a tabela de transições do EmotionalEngine onde DRAW em estado ANXIOUS mantém ANXIOUS. Com win rate 42% e empate rate ~17%, o agente fica travado em ANXIOUS a maior parte do tempo, o que aumenta `lossMod: 2.0` e `epsilonMod: 1.5` desnecessariamente — distorcendo decisões.

---

## Input

```typescript
// EmotionalEngine.processEvent(event, streak, isRelegationRisk)
event: 'WIN' | 'DRAW' | 'LOSS' | 'TITLE' | 'PROMOTION' | 'RELEGATION_RISK'
streak: number   // positivo = vitórias, negativo = derrotas
```

---

## Output esperado

Distribuição de estados em run de 20 temporadas (~42% WR, ~17% DR):
- CALM: ≥ 30% do tempo
- ANXIOUS: ≤ 35% do tempo (atualmente domina > 60%)
- CONFIDENT: ≥ 10% quando win streak ≥ 3
- EUPHORIC: spike após títulos/promoções

---

## Regras de validação

- [ ] DRAW em ANXIOUS → CALM (não ficar em ANXIOUS por empate)
- [ ] Sequência LOSS-DRAW-DRAW-WIN → deve sair de ANXIOUS após o WIN
- [ ] DRAW em ANXIOUS após > 3 semanas no estado → CALM
- [ ] Distribuição de estados: ANXIOUS ≤ 35% em simulação 20 temporadas
- [ ] `lossMod` médio em run de 20 temporadas < 1.3 (atualmente ~2.0 dominante)
- [ ] CONFIDENT aparece ≥ 10% quando rollingForm tem ≥ 3 W nos últimos 5

---

## Forbidden

- [ ] DRAW em ANXIOUS manter ANXIOUS (bug atual)
- [ ] Agente ficar > 5 semanas consecutivas em ANXIOUS sem LOSS
- [ ] `epsilonMod` médio > 1.8 em temporada sem loss streak ≥ 5

---

## Implementação

**Arquivo**: `src/services/learning/EmotionalEngine.js`

**Mudanças na tabela TRANSITIONS**:
```javascript
// ANTES (EmotionalEngine.js ~linha 69-76):
ANXIOUS: {
    WIN:             () => 'CALM',
    DRAW:            () => 'ANXIOUS',   // ← BUG: empate trava em ANXIOUS
    LOSS:            (streak) => Math.abs(streak) >= 4 ? 'TILTED' : 'ANXIOUS',
    TITLE:           () => 'EUPHORIC',
    PROMOTION:       () => 'EUPHORIC',
    RELEGATION_RISK: () => 'TILTED'
},

// DEPOIS:
ANXIOUS: {
    WIN:             () => 'CALM',
    DRAW:            () => 'CALM',      // empate é suficiente pra sair do pânico
    LOSS:            (streak) => Math.abs(streak) >= 4 ? 'TILTED' : 'ANXIOUS',
    TITLE:           () => 'EUPHORIC',
    PROMOTION:       () => 'EUPHORIC',
    RELEGATION_RISK: () => 'TILTED'
},
```

Também ajustar threshold de entrada em ANXIOUS — atualmente `|streak| >= 2` é muito sensível:
```javascript
// ANTES (linha ~48):
CALM: { LOSS: (streak) => Math.abs(streak) >= 2 ? 'ANXIOUS' : 'CALM' }

// DEPOIS:
CALM: { LOSS: (streak) => Math.abs(streak) >= 3 ? 'ANXIOUS' : 'CALM' }
```

---

## Testes esperados

```javascript
describe('SPEC-139: Emotional Engine ANXIOUS bias fix', () => {
  test('DRAW em ANXIOUS → CALM', () => {
    const e = new EmotionalEngine();
    e.state = 'ANXIOUS';
    const r = e.processEvent('DRAW', 0);
    expect(r.to).toBe('CALM');
  });

  test('CALM → ANXIOUS precisa 3 derrotas, não 2', () => {
    const e = new EmotionalEngine();
    e.processEvent('LOSS', -1);
    expect(e.state).toBe('CALM');
    e.processEvent('LOSS', -2);
    expect(e.state).toBe('CALM');
    e.processEvent('LOSS', -3);
    expect(e.state).toBe('ANXIOUS');
  });

  test('LOSS-DRAW-WIN: sai de ANXIOUS após WIN', () => {
    const e = new EmotionalEngine();
    e.processEvent('LOSS', -3);
    expect(e.state).toBe('ANXIOUS');
    e.processEvent('DRAW', 0);
    expect(e.state).toBe('CALM');
  });

  test('ANXIOUS: 5+ derrotas → TILTED', () => {
    const e = new EmotionalEngine();
    e.state = 'ANXIOUS';
    e.processEvent('LOSS', -4);
    expect(e.state).toBe('TILTED');
  });

  test('distribuição em 100 eventos 42%W/17%D/41%L: ANXIOUS <= 35%', () => {
    const e = new EmotionalEngine();
    let anxiousCount = 0;
    let streak = 0;
    const events = generateEvents(100, { winRate: 0.42, drawRate: 0.17 });
    events.forEach(ev => {
      if (ev === 'WIN') streak = Math.max(0, streak) + 1;
      else if (ev === 'LOSS') streak = Math.min(0, streak) - 1;
      else streak = 0;
      e.processEvent(ev, streak);
      if (e.state === 'ANXIOUS') anxiousCount++;
    });
    expect(anxiousCount / 100).toBeLessThanOrEqual(0.35);
  });

  test('lossMod médio < 1.3 em sequência mista', () => {
    const e = new EmotionalEngine();
    let modSum = 0, count = 0;
    ['WIN','WIN','LOSS','DRAW','WIN','LOSS','WIN','WIN','DRAW','WIN'].forEach((ev, i) => {
      e.processEvent(ev, i % 3);
      modSum += e.getModifiers().lossMod;
      count++;
    });
    expect(modSum / count).toBeLessThan(1.3);
  });

  test('CONFIDENT aparece com 3W consecutivos', () => {
    const e = new EmotionalEngine();
    e.processEvent('WIN', 1); e.processEvent('WIN', 2); e.processEvent('WIN', 3);
    expect(e.state).toBe('CONFIDENT');
  });

  test('EUPHORIC após TITLE de qualquer estado', () => {
    const e = new EmotionalEngine();
    e.state = 'ANXIOUS';
    e.processEvent('TITLE', 0);
    expect(e.state).toBe('EUPHORIC');
  });
});
```

---

## Harness
```bash
#!/bin/bash
cd /Users/dudujarra/Documents/ELIFOOT
npm test -- --reporter=verbose 2>&1 | grep "SPEC-139"
```
