# SPEC-TEMPLATE.md — Template padrão para specs ELIFOOT

Use este template para criar novas specs. As 5 primeiras seções (O que é, Input, Output, Validação, Forbidden) são **obrigatórias**. As demais são opcionais.

---

# SPEC-001: Match Engine Simulation

> **Exemplo completo de spec preenchida.** Use como referência ao criar novas specs.

---

## O que é

Simula uma partida de futebol entre dois times, considerando formação, tática, elenco, energia, moral e condições de jogo. Retorna narração lance a lance, placar, eventos, estatísticas.

Match Engine é o **core do jogo**. Tudo depende dele.

---

## Input

### Tipo
```typescript
{
  homeTeamId: number,
  awayTeamId: number,
  week: number,
  formation: '4-3-3' | '4-4-2' | '3-5-2' | '5-3-2' | '4-2-3-1' | '4-1-4-1' | '3-4-3' | '5-4-1',
  tactic: 'Ofensivo' | 'Defensivo' | 'Pressing' | 'Contra-Ataque' | 'Posse',
  homeTeamTalk: number (0-4),
  awayTeamTalk: number (0-4),
  weather?: 'Bom' | 'Chuva' | 'Calor' | 'Noturno' | 'Clássico' | 'TV' | 'Lotado' (sorteado random)
}
```

### Origem
Vem de:
- `DashboardView` (pré-jogo wizard)
- `MatchView` (match ao vivo)
- `engine.playMatch()` (teste)

### Validação de input
- `homeTeamId` e `awayTeamId`: válidos, diferentes
- `formation`: exatamente uma das 8 formações
- `tactic`: exatamente uma das 5 táticas
- `week`: 1-38 (temporada)
- `homeTeamTalk` e `awayTeamTalk`: 0-4 (5 tipos de preleção)

---

## Output esperado

### Tipo
```typescript
{
  homeTeamId: number,
  awayTeamId: number,
  homeGoals: number (>= 0),
  awayGoals: number (>= 0),
  homeStats: {
    shots: number,
    shotAccuracy: number (0-100),
    possession: number (0-100),
    passes: number,
    passAccuracy: number (0-100),
    tackles: number,
    fouls: number
  },
  awayStats: { ... same ... },
  homeFormation: string (4-3-3, etc),
  awayFormation: string,
  weather: string (o que foi sorteado),
  startTime: number (0),
  endTime: number (90),
  events: Array<{
    minute: number,
    type: 'goal' | 'yellow' | 'red' | 'substitution' | 'chance' | 'injury' | 'corner' | 'free-kick',
    team: number (homeTeamId or awayTeamId),
    player: string (nome jogador),
    text: string (narração),
    side: 'home' | 'away'
  }>,
  narration: Array<{
    minute: number,
    text: string
  }>,
  mvp: {
    playerId: number,
    playerName: string,
    team: number,
    rating: number (5-10)
  },
  topScorer: {
    playerId: number,
    playerName: string,
    goals: number
  },
  topAssister: {
    playerId: number,
    playerName: string,
    assists: number
  }
}
```

### Exemplo concreto

```json
{
  "homeTeamId": 1,
  "awayTeamId": 5,
  "homeGoals": 2,
  "awayGoals": 1,
  "homeStats": {
    "shots": 12,
    "shotAccuracy": 58.33,
    "possession": 62,
    "passes": 487,
    "passAccuracy": 89.32,
    "tackles": 14,
    "fouls": 8
  },
  "awayStats": {
    "shots": 7,
    "shotAccuracy": 42.86,
    "possession": 38,
    "passes": 234,
    "passAccuracy": 84.19,
    "tackles": 21,
    "fouls": 12
  },
  "homeFormation": "4-3-3",
  "awayFormation": "4-4-2",
  "weather": "Bom",
  "startTime": 0,
  "endTime": 90,
  "events": [
    {
      "minute": 15,
      "type": "goal",
      "team": 1,
      "player": "Neymar",
      "text": "⚽ GOOOOL! Neymar marca em chute cruzado (1-0)",
      "side": "home"
    },
    {
      "minute": 38,
      "type": "goal",
      "team": 5,
      "player": "Vinicius Jr",
      "text": "⚽ GOOOOL! Vinicius Jr empata (1-1)",
      "side": "away"
    },
    {
      "minute": 67,
      "type": "goal",
      "team": 1,
      "player": "Rodrygo",
      "text": "⚽ GOOOOL! Rodrygo vira o jogo (2-1)",
      "side": "home"
    }
  ],
  "narration": [
    { "minute": 0, "text": "🏟️ Apito inicial! Começou o jogo!" },
    { "minute": 15, "text": "⚽ GOOOOL! Neymar marca em chute cruzado (1-0)" }
  ],
  "mvp": {
    "playerId": 123,
    "playerName": "Neymar",
    "team": 1,
    "rating": 8.5
  },
  "topScorer": {
    "playerId": 123,
    "playerName": "Neymar",
    "goals": 1
  },
  "topAssister": {
    "playerId": 124,
    "playerName": "Rodrygo",
    "assists": 1
  }
}
```

---

## Regras de validação

Checklist obrigatória. O output **deve** satisfazer todas:

### 1. Placar
- [ ] `homeGoals >= 0` e `awayGoals >= 0`
- [ ] Pelo menos um time marca ou ambos marcam 0
- [ ] `homeGoals + awayGoals >= 0` (sempre)

### 2. Eventos
- [ ] Array `events` nunca vazio
- [ ] Cada evento tem `minute` entre 0-90
- [ ] Cada evento tem `type` válido (goal, yellow, red, etc)
- [ ] Cada evento tem `player` válido (nome no elenco)
- [ ] Cada evento tem `text` com narração (não vazio)

### 3. Stats
- [ ] `homeStats.shots >= 0` e `awayStats.shots >= 0`
- [ ] `possession` sempre 0-100 (soma não precisa ser 100)
- [ ] `passAccuracy` sempre 0-100
- [ ] `shotAccuracy` sempre 0-100
- [ ] Total de goals = quantidade de 'goal' events no array

### 4. Times
- [ ] `homeTeamId !== awayTeamId`
- [ ] Ambos são IDs válidos
- [ ] Formação home e away constam no array de 8

### 5. Narração
- [ ] Array `narration` nunca vazio
- [ ] Cada entrada tem `minute` e `text`
- [ ] Narração progressiva (minutos crescentes, ou repetidos ok)

### 6. MVP & Artilheiros
- [ ] MVP existe e é jogador do time vencedor (ou draw ok)
- [ ] Rating 5-10
- [ ] topScorer goals >= 1 (só se houver gols)
- [ ] topAssister assists >= 1 (só se houver assistências)

### 7. Tempo
- [ ] `startTime === 0`
- [ ] `endTime === 90`
- [ ] Match dura sempre 90 minutos

### 8. Determinismo
- [ ] Mesmo input (sem randomness) → mesmo output
- [ ] Ou: randomness documentado e previsível (seed)

---

## Forbidden

Casos explicitamente **proibidos**. Se isto acontecer, spec falhou.

### ❌ Scores inválidos
- [ ] `homeGoals < 0` ou `awayGoals < 0`
- [ ] `homeGoals` ou `awayGoals` é NaN ou undefined
- [ ] Score é float (ex: 2.5 gols) — deve ser inteiro

### ❌ Eventos inválidos
- [ ] Event sem `minute` ou `type`
- [ ] Event com `minute < 0` ou `minute > 90`
- [ ] Event `type` é string aleatória (ex: "explosão")
- [ ] Event com player que não está no elenco
- [ ] Mais gols no array de events do que em `homeGoals + awayGoals`

### ❌ Times inválidos
- [ ] `homeTeamId === awayTeamId` (mesmo time joga contra si?)
- [ ] `homeTeamId` ou `awayTeamId` é undefined
- [ ] Formação inválida (ex: "3-3-3" que não existe)

### ❌ Tática ignorada
- [ ] Input especifica tática "Defensivo" mas time domina 80% posse
- [ ] Tática não influencia nem stats nem eventos

### ❌ Falhas de lógica
- [ ] Time fraco bate time forte com odds 99% (sem contexto)
- [ ] Player lesionado participa do jogo
- [ ] Jogador substituído volta a jogar
- [ ] Time com moral 10/100 rende 3-0

---

## Implementação

### Arquivo
`src/engine/engine.js` → método `playMatch(homeId, awayId, formation, tactic, ...)`

### Arquivo de teste
`tests/engine.test.js` → suite `SPEC-001: Match Engine Simulation`

### Dependências internas
- `src/engine/MatchEventsDeck.js` — gera events carta a carta
- `src/engine/PlayerDevelopment.js` — valida atributos de jogadores
- `src/engine/InjurySystem.js` — gerencia lesões
- `src/engine/data.js` — times e jogadores

---

## Testes esperados

Cada teste valida **exatamente uma regra de validação**. Mínimo 8 testes:

```javascript
describe('SPEC-001: Match Engine Simulation', () => {
  
  test('input: valid teams → output: valid scores (rule 1)', () => {
    const match = engine.playMatch(1, 5, '4-3-3', 'Ofensivo', 0);
    expect(match.homeGoals).toBeGreaterThanOrEqual(0);
    expect(match.awayGoals).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(match.homeGoals)).toBe(true);
  });

  test('output: events array never empty (rule 2)', () => {
    const match = engine.playMatch(1, 5, '4-3-3', 'Ofensivo', 0);
    expect(match.events.length).toBeGreaterThan(0);
  });

  test('output: stats always 0-100% (rule 3)', () => {
    const match = engine.playMatch(1, 5, '4-3-3', 'Ofensivo', 0);
    expect(match.homeStats.possession).toBeGreaterThanOrEqual(0);
    expect(match.homeStats.possession).toBeLessThanOrEqual(100);
  });

  test('forbidden: homeGoals < 0 (forbidden 1)', () => {
    const match = engine.playMatch(1, 5, '4-3-3', 'Ofensivo', 0);
    expect(match.homeGoals).not.toBeLessThan(0);
  });

  test('forbidden: same team vs itself (forbidden 2)', () => {
    expect(() => engine.playMatch(1, 1, '4-3-3', 'Ofensivo', 0)).toThrow();
  });

  test('forbidden: injured player plays (forbidden 3)', () => {
    // Marcar jogador como lesionado
    engine.injurePlayer(1, playerId, 5);
    const match = engine.playMatch(1, 5, '4-3-3', 'Ofensivo', 0);
    // Verificar que player não está em events
    const playerInEvents = match.events.some(e => e.playerId === playerId);
    expect(playerInEvents).toBe(false);
  });

  test('tactic influences stats (formation rule)', () => {
    const defensive = engine.playMatch(1, 5, '4-3-3', 'Defensivo', 0);
    const offensive = engine.playMatch(1, 5, '4-3-3', 'Ofensivo', 0);
    // Offensive deve ter possession >= Defensive
    expect(offensive.homeStats.possession).toBeGreaterThanOrEqual(
      defensive.homeStats.possession - 5  // -5 pra tolerância
    );
  });

  test('determinism: same input → same output', () => {
    const match1 = engine.playMatch(1, 5, '4-3-3', 'Ofensivo', 0, { seed: 12345 });
    const match2 = engine.playMatch(1, 5, '4-3-3', 'Ofensivo', 0, { seed: 12345 });
    expect(match1.homeGoals).toBe(match2.homeGoals);
    expect(match1.awayGoals).toBe(match2.awayGoals);
  });
});
```

---

## Checklist para preencher nova spec

Ao usar este template, siga:

- [ ] Seção "O que é" tem 1-2 frases claras
- [ ] Input é tipado (TypeScript ou JSON Schema)
- [ ] Output é tipado + exemplo concreto
- [ ] Validação: exatamente 8+ regras (checkbox)
- [ ] Forbidden: exatamente 5+ casos (checkbox)
- [ ] Implementação aponta arquivos reais
- [ ] Testes: 8+ casos, cada um valida 1 regra
- [ ] Nenhuma seção está vazia (ou marcada "N/A")

Se faltou algo, spec está **incompleta**.

---

## Dúvidas frequentes

**P: Posso pular validação?**
R: Não. Toda spec tem 8+ regras. Se conseguir menos, spec não está completa o bastante.

**P: E se output é aleatório?**
R: Use seed para determinismo. Ou liste os ranges esperados (ex: goals 0-5, not 6+).

**P: Implementação muda durante build?**
R: Tudo bem, atualize a spec. Depois comunica ao Dudu.

**P: Posso ter menos de 8 testes?**
R: Não. Mínimo é 8 (um por regra). Mais é ok.

---

**Template versão**: 1.0  
**Última atualização**: 2026-05-07  
**Protocolo**: AKITA SDD
