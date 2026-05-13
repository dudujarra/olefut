# SPEC-001: Match Engine Simulation

**Criticidade**: 🔴 CRÍTICO  
**Módulo**: `src/engine/engine.js`  
**Linhas de código**: ~400  
**Dependências**: PlayerDevelopment, InjurySystem, MatchEventsDeck, BoardSystem

---

## O que é

Simula uma partida de futebol entre dois times, considerando formação, tática, elenco, energia, moral e condições de jogo. Retorna narração lance a lance, placar, eventos, estatísticas de ambos os times.

Match Engine é o **core do jogo**. Toda a experience de jogo passa por aqui.

---

## Input

### Tipo e origem

```typescript
engine.playMatch(
  homeTeamId: number,
  awayTeamId: number,
  options?: {
    formation: '4-3-3' | '4-4-2' | '3-5-2' | '5-3-2' | '4-2-3-1' | '4-1-4-1' | '3-4-3' | '5-4-1',
    tactic: 'Ofensivo' | 'Defensivo' | 'Pressing' | 'Contra-Ataque' | 'Posse',
    homeTeamTalk: 0 | 1 | 2 | 3 | 4,  // Preleção (5 tipos)
    awayTeamTalk: 0 | 1 | 2 | 3 | 4,
    seed?: number  // Para determinismo em testes
  }
) → Match
```

### Validação de input obrigatória

- [ ] `homeTeamId` e `awayTeamId` válidos, registrados no engine
- [ ] `homeTeamId !== awayTeamId` (times diferentes)
- [ ] `formation` exatamente uma das 8 formações listadas
- [ ] `tactic` exatamente uma das 5 táticas listadas
- [ ] `homeTeamTalk` e `awayTeamTalk` em range 0-4 (5 tipos)
- [ ] Ambos times têm 11+ jogadores para escalar
- [ ] Pelo menos 1 goleiro por time disponível (não lesionado)

---

## Output esperado

### Tipo retornado

```typescript
interface Match {
  // Metadados
  homeTeamId: number,
  awayTeamId: number,
  week: number,
  season: number,
  date: string (ISO),
  
  // Resultado
  homeGoals: number (≥ 0),
  awayGoals: number (≥ 0),
  status: 'finished' | 'halftime' | 'live',
  
  // Stats de ambos
  homeStats: MatchStats,
  awayStats: MatchStats,
  
  // Gameplay
  homeFormation: string,
  awayFormation: string,
  homeTactic: string,
  awayTactic: string,
  weather: string,
  
  // Cronômetro
  startTime: number (0),
  endTime: number (90),
  currentMinute: number (0-90),
  
  // Lance a lance
  events: MatchEvent[],
  narration: NarrationLine[],
  
  // Melhores
  mvp: {
    playerId: number,
    playerName: string,
    team: 'home' | 'away',
    rating: number (5-10)
  },
  topScorer: { playerId: number, playerName: string, goals: number },
  topAssister: { playerId: number, playerName: string, assists: number },
  
  // Consequências
  homeXP: number,  // Experience ganho
  awayXP: number,
  injuredCount: { home: number, away: number }
}

interface MatchStats {
  shots: number,
  shotAccuracy: number (0-100),
  possession: number (0-100),
  passes: number,
  passAccuracy: number (0-100),
  tackles: number,
  fouls: number,
  cards: { yellow: number, red: number }
}

interface MatchEvent {
  minute: number,
  type: 'goal' | 'yellow' | 'red' | 'substitution' | 'chance' | 'injury' | 'corner' | 'free-kick' | 'penalty' | 'save',
  team: 'home' | 'away',
  playerId: number,
  playerName: string,
  text: string (narração),
  impact: number (-10 to +10)  // Efeito na moral
}

interface NarrationLine {
  minute: number,
  text: string,
  icon?: string (⚽, 🟨, 🟥, etc)
}
```

### Exemplo concreto (JSON)

```json
{
  "homeTeamId": 1,
  "awayTeamId": 5,
  "week": 1,
  "season": 1,
  "date": "2026-05-07T15:00:00Z",
  "homeGoals": 2,
  "awayGoals": 1,
  "status": "finished",
  "homeStats": {
    "shots": 12,
    "shotAccuracy": 58.33,
    "possession": 62,
    "passes": 487,
    "passAccuracy": 89.32,
    "tackles": 14,
    "fouls": 8,
    "cards": { "yellow": 2, "red": 0 }
  },
  "awayStats": {
    "shots": 7,
    "shotAccuracy": 42.86,
    "possession": 38,
    "passes": 234,
    "passAccuracy": 84.19,
    "tackles": 21,
    "fouls": 12,
    "cards": { "yellow": 1, "red": 0 }
  },
  "homeFormation": "4-3-3",
  "awayFormation": "4-4-2",
  "homeTactic": "Ofensivo",
  "awayTactic": "Defensivo",
  "weather": "Bom",
  "startTime": 0,
  "endTime": 90,
  "currentMinute": 90,
  "events": [
    {
      "minute": 15,
      "type": "goal",
      "team": "home",
      "playerId": 101,
      "playerName": "Neymar",
      "text": "⚽ GOOOOL! Neymar marca de cabeça após cruzamento (1-0)",
      "impact": 5
    },
    {
      "minute": 38,
      "type": "goal",
      "team": "away",
      "playerId": 205,
      "playerName": "Vinicius Jr",
      "text": "⚽ GOOOOL! Vinicius Jr empata (1-1)",
      "impact": 5
    },
    {
      "minute": 67,
      "type": "goal",
      "team": "home",
      "playerId": 102,
      "playerName": "Rodrygo",
      "text": "⚽ GOOOOL! Rodrygo vira o jogo (2-1)",
      "impact": 8
    }
  ],
  "narration": [
    { "minute": 0, "text": "🏟️ Apito inicial! Começou o jogo!" },
    { "minute": 15, "text": "⚽ GOOOOL! Neymar marca de cabeça (1-0)" },
    { "minute": 90, "text": "🔔 Apito final! Fim de jogo!" }
  ],
  "mvp": {
    "playerId": 101,
    "playerName": "Neymar",
    "team": "home",
    "rating": 8.5
  },
  "topScorer": {
    "playerId": 101,
    "playerName": "Neymar",
    "goals": 1
  },
  "topAssister": {
    "playerId": 103,
    "playerName": "Vinicius",
    "assists": 1
  },
  "homeXP": 150,
  "awayXP": 120,
  "injuredCount": { "home": 0, "away": 1 }
}
```

---

## Regras de validação

Checklist obrigatória. Output **deve** satisfazer TODAS:

### Validação 1: Placar válido
- [ ] `homeGoals >= 0` e `awayGoals >= 0`
- [ ] Ambos são inteiros (não float)
- [ ] `homeGoals + awayGoals > 0` OU (0-0 é permitido)
- [ ] Placar nunca muda após fim do jogo

### Validação 2: Eventos consistentes
- [ ] Array `events` nunca vazio (mínimo 3 eventos)
- [ ] Cada evento tem `minute` entre 0-90
- [ ] Cada evento tem `type` válido
- [ ] Cada evento tem `playerId` do elenco válido
- [ ] Total de goals em `events` = `homeGoals + awayGoals`
- [ ] Eventos são cronologicamente ordenados (ou iguais ok)

### Validação 3: Stats realistas
- [ ] `possession` ambos times entre 0-100
- [ ] `shotAccuracy` = (goals + near-misses) / shots (ou 0 se 0 shots)
- [ ] `passAccuracy` entre 0-100
- [ ] `tackles >= 0`, `fouls >= 0`
- [ ] Time com mais posse tem mais passes (correlação positiva)

### Validação 4: Times válidos
- [ ] `homeTeamId !== awayTeamId`
- [ ] `homeFormation` é uma das 8 (4-3-3, 4-4-2, etc)
- [ ] `awayFormation` é uma das 8
- [ ] `homeTactic` é uma das 5 (Ofensivo, Defensivo, etc)
- [ ] `awayTactic` é uma das 5

### Validação 5: MVP & Artilheiros
- [ ] MVP exists, é jogador válido do elenco
- [ ] MVP rating entre 5-10
- [ ] `topScorer.goals >= 1` (ou undefined se 0 gols)
- [ ] `topAssister.assists >= 1` (ou undefined)
- [ ] MVP é diferente de topScorer/topAssister OK

### Validação 6: Narração consistente
- [ ] Array `narration` nunca vazio (mínimo 3 linhas)
- [ ] Cada linha tem `minute` e `text`
- [ ] Minutos em narração progridem (0, 15, 30, ..., 90)
- [ ] 1 linha por min mínimo, até 3 linhas por min máximo
- [ ] Texto nunca vazio

### Validação 7: Determinismo
- [ ] Chamadas com mesmo `seed` retornam mesmo resultado
- [ ] Sem seed: resultado varia (randomness OK)
- [ ] Função é pura (não mutua estado global)

### Validação 8: Consequências rastreadas
- [ ] `homeXP` e `awayXP` entre 0-500
- [ ] `injuredCount` reflete lesões do match
- [ ] Lesões futuras têm chance baseada em placares

---

## Forbidden

Casos **explicitamente proibidos**. Se acontecer, spec falhou.

### ❌ Placar inválido
- [ ] `homeGoals < 0` ou `awayGoals < 0`
- [ ] `homeGoals` ou `awayGoals` é NaN, undefined ou float
- [ ] Score muda após fim do jogo (status === 'finished')

### ❌ Eventos quebrados
- [ ] `events` array vazio
- [ ] Evento com `minute < 0` ou `minute > 90`
- [ ] Evento com `type` inválido ou string aleatória
- [ ] Evento com `playerId` que não existe no elenco
- [ ] Mais gols em `events` do que em placar (ex: 3 gols em events, placar 2-1)

### ❌ Times inválidos
- [ ] `homeTeamId === awayTeamId` (mesmo time vs si mesmo)
- [ ] Time com < 11 jogadores disponíveis joga mesmo assim
- [ ] Goleiro lesionado aparece em campo
- [ ] Formation não é uma das 8 (ex: "3-3-3")

### ❌ Tática ignorada
- [ ] Input: tática "Defensivo", output: 80% posse (tática não influencia)
- [ ] Offensive vs Defensive devem diferir em possession ±10%
- [ ] Pressing deve aumentar tackles vs Posse

### ❌ Falha lógica
- [ ] Time com moral 5/100 rende 3-0 no 1º tempo (sem contexto)
- [ ] Substituto que não estava no elenco entra em campo
- [ ] Player substituído retorna a jogar
- [ ] Lesão aplicada fora do jogo (em tempo de jogo OK)

---

## Implementação

### Arquivo principal
`src/engine/engine.js` → método `playMatch(homeId, awayId, options)`

### Subcomponentes
- `src/engine/MatchEventsDeck.js` — gera events por posição
- `src/engine/PlayerDevelopment.js` — valida ratings
- `src/engine/InjurySystem.js` — chance de lesão
- `src/engine/BoardSystem.js` — registra resultado

### Referência manual
Manual OléFUT, Parte 3 (Partida ao Vivo) — descrição de fluxo

---

## Testes esperados

8+ casos mínimo, cada um valida **uma regra**:

```javascript
describe('SPEC-001: Match Engine Simulation', () => {

  test('Rule 1: placar sempre >= 0', () => {
    const match = engine.playMatch(1, 5, { formation: '4-3-3', tactic: 'Ofensivo' });
    expect(match.homeGoals).toBeGreaterThanOrEqual(0);
    expect(match.awayGoals).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(match.homeGoals)).toBe(true);
  });

  test('Rule 2: events array nunca vazio', () => {
    const match = engine.playMatch(1, 5, { formation: '4-3-3', tactic: 'Ofensivo' });
    expect(match.events.length).toBeGreaterThan(0);
    expect(match.narration.length).toBeGreaterThan(0);
  });

  test('Rule 3: stats 0-100%', () => {
    const match = engine.playMatch(1, 5, { formation: '4-3-3', tactic: 'Ofensivo' });
    expect(match.homeStats.possession).toBeGreaterThanOrEqual(0);
    expect(match.homeStats.possession).toBeLessThanOrEqual(100);
    expect(match.homeStats.passAccuracy).toBeGreaterThanOrEqual(0);
  });

  test('Rule 4: times válidos', () => {
    expect(() => engine.playMatch(1, 1)).toThrow();  // mesmo time = erro
    const match = engine.playMatch(1, 5);
    expect(match.homeTeamId).not.toBe(match.awayTeamId);
  });

  test('Rule 5: MVP válido', () => {
    const match = engine.playMatch(1, 5, { formation: '4-3-3', tactic: 'Ofensivo' });
    expect(match.mvp).toBeDefined();
    expect(match.mvp.rating).toBeGreaterThanOrEqual(5);
    expect(match.mvp.rating).toBeLessThanOrEqual(10);
  });

  test('Rule 6: narração progressiva', () => {
    const match = engine.playMatch(1, 5, { formation: '4-3-3', tactic: 'Ofensivo' });
    for (let i = 1; i < match.narration.length; i++) {
      expect(match.narration[i].minute).toBeGreaterThanOrEqual(match.narration[i-1].minute);
    }
  });

  test('Rule 7: determinismo com seed', () => {
    const m1 = engine.playMatch(1, 5, { formation: '4-3-3', tactic: 'Ofensivo', seed: 123 });
    const m2 = engine.playMatch(1, 5, { formation: '4-3-3', tactic: 'Ofensivo', seed: 123 });
    expect(m1.homeGoals).toBe(m2.homeGoals);
    expect(m1.awayGoals).toBe(m2.awayGoals);
  });

  test('Forbidden: goleiro lesionado não joga', () => {
    // Lesionar goleiro time 1
    const team1GK = engine.getTeam(1).squad.find(p => p.position === 'GOL');
    engine.injurePlayer(1, team1GK.id, 10);
    
    // Escalação deve trocar goleiro automaticamente
    const match = engine.playMatch(1, 5, { formation: '4-3-3', tactic: 'Ofensivo' });
    
    // Verificar que lesionado não está em nenhum evento
    const injuredInEvents = match.events.some(e => e.playerId === team1GK.id);
    expect(injuredInEvents).toBe(false);
  });

});
```

---

**Status**: PRONTO PARA IMPLEMENTAÇÃO  
**Responsável**: FASE 2.1  
**Próxima spec**: SPEC-002 Match Events Deck
