# SPEC-134: Progression Growth Events — Eventos de Crescimento Orgânico

**Fase:** 0 — Gameplay Fix  
**Prioridade:** URGENTE  
**Telemetria:** SPEC-110 score=30, FLAT_CURVE, curveSlope=0.08, growthEventCount=0  
**AKITA:** a definir no PR

---

## O que é

Injeção de eventos de crescimento orgânico que movem o OVR médio do squad ao longo de uma season. Atualmente growthEventCount=0 em 203 seasons — nenhum evento de crescimento ocorreu. O squad permanece estático do início ao fim de cada temporada.

**Tipos de growth event:**
1. **Youth Breakthrough** — jovem sub-21 tem salto de OVR (+2 a +5)
2. **Form Hot Streak** — jogador em 5+ vitórias recebe OVR temporário (+3, dura 4 semanas)
3. **Peak Season** — jogador 23-27 anos, 15+ jogos, sobe OVR permanente (+1)
4. **Decline Signal** — jogador 32+ anos, queda gradual OVR (-1 por season)
5. **Training Breakthrough** — ação TRAIN acumulada por jogador dispara +2 OVR

---

## Input

```typescript
{
  teamId: number,
  week: number,
  season: number,
  players: Array<{
    playerId: number,
    ovr: number,
    age: number,
    gamesThisSeason: number,
    recentTrainCount: number,    // número de ações TRAIN nas últimas 4 semanas
    onHotStreak: boolean,        // 5+ resultados positivos consecutivos
    isYouth: boolean             // age < 21
  }>,
  teamRecentResults: Array<'W' | 'D' | 'L'> // últimas 8 semanas
}
```

---

## Output esperado

```typescript
{
  growthEvents: Array<{
    type: 'youth_breakthrough' | 'hot_streak' | 'peak_season' | 'decline' | 'training_breakthrough',
    playerId: number,
    playerName: string,
    ovrDelta: number,      // positivo ou negativo
    permanent: boolean,    // false = temporário (hot_streak)
    duration?: number,     // semanas se temporário
    narrativeTag: string   // ex: "CRAQUE_EMERGED", "PEAK_SEASON", "AGING_SIGNAL"
  }>,
  newSquadOvrAvg: number  // OVR médio após aplicar eventos
}
```

**Frequência por season:**
- Youth Breakthrough: 1-2 por season (se team tem jovens)
- Hot Streak: 0-3 por season
- Peak Season: 1-3 por season (se jogadores em faixa prime)
- Decline: 0-2 por season (se team tem veteranos 32+)
- Training Breakthrough: 0-4 por season (baseado em ações TRAIN)

---

## Regras de validação

- [ ] `growthEventCount > 0` em toda season com ≥ 11 jogadores disponíveis
- [ ] Youth Breakthrough só dispara em players com `age < 21`
- [ ] Hot Streak é temporário (permanent=false) e dura exatamente `duration` semanas
- [ ] Peak Season só dispara em players com `age 23-27` e `gamesThisSeason ≥ 15`
- [ ] Decline só dispara em players com `age ≥ 32`
- [ ] `ovrDelta` nunca leva OVR abaixo de 30 ou acima de 99
- [ ] Squad OVR slope ≥ 0.5 por season após fix (atual: 0.08)
- [ ] `narrativeTag` mapeia para evento narrativo existente no sistema

---

## Forbidden

- [ ] growthEventCount=0 em season completa com squad normal
- [ ] Youth Breakthrough em jogador com age ≥ 25
- [ ] Decline em jogador com age < 30
- [ ] Hot Streak sendo permanente
- [ ] OVR subindo acima de 99 ou caindo abaixo de 30
- [ ] Dois eventos do mesmo tipo no mesmo jogador na mesma semana

---

## Implementação

**Arquivo:** `src/engine/GrowthEventSystem.js` (novo)  
**Integração:** `src/engine/engine.js` → `endOfWeek()` chama `GrowthEventSystem.evaluate(teamId, week)`  
**Narrativa:** eventos emitidos para `NarrativeService` (quando existir) ou queue de press events

---

## Testes esperados

```javascript
describe('SPEC-134: Progression Growth Events', () => {
  test('growthEventCount > 0 in normal season (rule 1)', () => {
    const season = simulateSeason({ teamId: 1 });
    expect(season.growthEventCount).toBeGreaterThan(0);
  });

  test('youth breakthrough only for age < 21 (rule 2)', () => {
    const events = GrowthEventSystem.evaluate({ players: mockPlayersWithYouth });
    const breakthroughs = events.growthEvents.filter(e => e.type === 'youth_breakthrough');
    breakthroughs.forEach(e => expect(getPlayer(e.playerId).age).toBeLessThan(21));
  });

  test('hot streak is temporary (rule 3)', () => {
    const events = GrowthEventSystem.evaluate({ players: mockPlayersOnStreak });
    const hotStreaks = events.growthEvents.filter(e => e.type === 'hot_streak');
    hotStreaks.forEach(e => {
      expect(e.permanent).toBe(false);
      expect(e.duration).toBeGreaterThan(0);
    });
  });

  test('peak season only for age 23-27 and ≥15 games (rule 4)', () => {
    const events = GrowthEventSystem.evaluate({ players: mockPlayersPrime });
    const peaks = events.growthEvents.filter(e => e.type === 'peak_season');
    peaks.forEach(e => {
      const p = getPlayer(e.playerId);
      expect(p.age).toBeGreaterThanOrEqual(23);
      expect(p.age).toBeLessThanOrEqual(27);
      expect(p.gamesThisSeason).toBeGreaterThanOrEqual(15);
    });
  });

  test('decline only for age ≥ 32 (rule 5)', () => {
    const events = GrowthEventSystem.evaluate({ players: mockPlayersVeteran });
    const declines = events.growthEvents.filter(e => e.type === 'decline');
    declines.forEach(e => expect(getPlayer(e.playerId).age).toBeGreaterThanOrEqual(32));
  });

  test('OVR never above 99 or below 30 (rule 6)', () => {
    const events = GrowthEventSystem.evaluate({ players: mockPlayersEdgeCases });
    events.growthEvents.forEach(e => {
      const finalOvr = getPlayer(e.playerId).ovr + e.ovrDelta;
      expect(finalOvr).toBeLessThanOrEqual(99);
      expect(finalOvr).toBeGreaterThanOrEqual(30);
    });
  });

  test('squad OVR slope ≥ 0.5 per season (rule 7)', () => {
    const results = simulateMultipleSeasons(10);
    expect(results.avgSlope).toBeGreaterThanOrEqual(0.5);
  });

  test('no duplicate event type per player per week (rule forbidden 6)', () => {
    const events = GrowthEventSystem.evaluate({ players: mockPlayers, week: 15 });
    const perPlayer = {};
    events.growthEvents.forEach(e => {
      const key = `${e.playerId}-${e.type}`;
      expect(perPlayer[key]).toBeUndefined();
      perPlayer[key] = true;
    });
  });
});
```

---

## Definition of Done
- [ ] `GrowthEventSystem.js` passa todos os 8 testes
- [ ] `growthEventCount > 0` em toda season em autoplay 10 seasons
- [ ] SPEC-110 Progression score > 60 no próximo playtest
- [ ] OVR slope > 0.5 em média por season

## Definition of Stop
- Se growth events causarem power creep (OVR médio > 85 após 20 seasons): reduzir frequência de peak_season
