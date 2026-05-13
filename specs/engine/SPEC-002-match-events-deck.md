# SPEC-002: Match Events Deck

**Criticidade**: 🔴 CRÍTICO  
**Módulo**: `src/engine/MatchEventsDeck.js`, `src/engine/decks/MatchCardsXXX.js`  
**Linhas de código**: ~600  
**Dependências**: PlayerDevelopment (ratings), MatchEventsDeck coordinator

---

## O que é

Sistema de cartas (deck) que gera eventos de jogo lance a lance, baseado em posição do jogador, tiering (comum/incomum/raro/lendário), renome do time e atributos do jogador. Cada minuto, carta é desenhada, validada contra o deck, e evento criado com narração.

Events Deck é **motor narrativo** do jogo — sem isto, jogo seria mecânico (resultado de stats apenas).

---

## Input

### Tipo

```typescript
MatchEventsDeck.drawCard(options: {
  position: 'GOL' | 'DEF' | 'MEI' | 'ATA',
  playerOVR: number (1-99),
  teamRenown: number (1-10),  // Baseado em pontuação histórica
  tactic: 'Ofensivo' | 'Defensivo' | 'Pressing' | 'Contra-Ataque' | 'Posse',
  enemyTactic: 'Ofensivo' | 'Defensivo' | 'Pressing' | 'Contra-Ataque' | 'Posse',
  seed?: number
}) → EventCard
```

### Validação input

- [ ] `position` é uma das 4 (GOL, DEF, MEI, ATA)
- [ ] `playerOVR` entre 1-99
- [ ] `teamRenown` entre 1-10
- [ ] `tactic` e `enemyTactic` são válidos
- [ ] Seed é opcional mas se presente, é número válido

---

## Output esperado

### EventCard type

```typescript
interface EventCard {
  // Meta
  position: string,
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary',
  
  // Evento
  type: 'goal' | 'chance' | 'yellow' | 'red' | 'injury' | 'save' | 'tackle' | 'pass',
  
  // Efeito no jogo
  impact: {
    homeGoalChance: number (0-100),
    awayGoalChance: number (0-100),
    playerRating: number (-5 to +5),
    injuryChance: number (0-100)
  },
  
  // Narração base (template)
  narrationTemplate: string,
  narrativeVariants: string[] (3-5 variações),
  
  // Pesos (probabilidade)
  weight: number (1-100),
  tacticModifier: { [tactic]: number }  // Efeito de tática em peso
}
```

### Exemplo concreto

```json
{
  "position": "ATA",
  "rarity": "Rare",
  "type": "goal",
  "impact": {
    "homeGoalChance": 85,
    "awayGoalChance": 0,
    "playerRating": 5,
    "injuryChance": 0
  },
  "narrationTemplate": "⚽ {playerName} marca de {method}! ({score})",
  "narrativeVariants": [
    "⚽ {playerName} marca em chute cruzado! ({score})",
    "⚽ {playerName} finaliza para o fundo da rede! ({score})",
    "⚽ {playerName} bate de primeira e marca! ({score})",
    "⚽ {playerName} ajeita a bola e marca! ({score})"
  ],
  "weight": 15,
  "tacticModifier": {
    "Ofensivo": 1.5,
    "Defensivo": 0.3,
    "Pressing": 0.8,
    "Contra-Ataque": 1.8,
    "Posse": 0.9
  }
}
```

---

## Regras de validação

### Validação 1: Rarity distribution
- [ ] Common cards: 60-70% de peso total
- [ ] Uncommon: 20-25%
- [ ] Rare: 10-12%
- [ ] Legendary: 1-3%

### Validação 2: Card existence
- [ ] Cada posição tem 8-12 cartas
- [ ] GOL tem cards: save, distribute, claim, punch
- [ ] DEF tem cards: tackle, block, clearance, yellow
- [ ] MEI tem cards: pass, tackle, interception, chance
- [ ] ATA tem cards: goal, chance, shot, dribble

### Validação 3: Tactic modifier
- [ ] Todos os modifiers entre 0.3-2.0
- [ ] Ofensivo aumenta goal chance em ATA
- [ ] Defensivo diminui goal chance em ATA
- [ ] Pressing aumenta tackles/yellow
- [ ] Contra-Ataque favorece ATA speed

### Validation 4: Narration quality
- [ ] Template e variants não vazios
- [ ] Variants têm 3-5 alternativas
- [ ] Nenhuma variante é duplicada
- [ ] Placeholders {playerName}, {method}, etc são válidos

### Validação 5: Impact ranges
- [ ] homeGoalChance + awayGoalChance <= 100
- [ ] playerRating entre -5 e +5
- [ ] injuryChance entre 0-100 (%)

### Validação 6: Position-specific
- [ ] GOL nunca gera 'goal' type
- [ ] ATA nunca gera 'save' type
- [ ] DEF never gera 'goal' (raramente OK)
- [ ] Posições têm deck balanceado

### Validação 7: Weight distribution
- [ ] Soma de pesos por posição = 100 (ou ~100)
- [ ] Weights são números positivos
- [ ] Card com weight 0 não é desenhável

### Validação 8: Determinism
- [ ] Mesmo seed → mesma carta
- [ ] Sem seed → variação aleatória (OK)
- [ ] Draw é função pura

---

## Forbidden

- [ ] Card com rarity undefined/null
- [ ] Card com weight < 0 ou weight > 100
- [ ] narrationTemplate vazio
- [ ] Variante duplicada em narrativeVariants
- [ ] Modifier < 0.1 ou > 3.0 (desequilibrado)
- [ ] GOL card com type === 'goal'
- [ ] ATA card com type === 'save'
- [ ] homeGoalChance + awayGoalChance > 100
- [ ] Posição tem < 5 cartas (muito pouca variedade)

---

## Implementação

### Arquivos
- `src/engine/MatchEventsDeck.js` — coordinador
- `src/engine/decks/MatchCardsGOL.js` — 8-10 cartas GOL
- `src/engine/decks/MatchCardsDEF.js` — 10-12 cartas DEF
- `src/engine/decks/MatchCardsMEI.js` — 10-12 cartas MEI
- `src/engine/decks/MatchCardsATA.js` — 8-10 cartas ATA

### Referência
Manual OléFUT, Parte 3.4 (Match Events) — tipos de evento

---

## Testes esperados

8+ casos:

```javascript
describe('SPEC-002: Match Events Deck', () => {

  test('Rule 1: rarity distribution 60-70 common', () => {
    const cards = MatchEventsDeck.getAllCards();
    const commonWeight = cards.filter(c => c.rarity === 'Common').reduce((sum, c) => sum + c.weight, 0);
    const totalWeight = cards.reduce((sum, c) => sum + c.weight, 0);
    const ratio = (commonWeight / totalWeight) * 100;
    expect(ratio).toBeGreaterThan(60);
    expect(ratio).toBeLessThan(70);
  });

  test('Rule 2: cada posição tem 8+ cartas', () => {
    const positions = ['GOL', 'DEF', 'MEI', 'ATA'];
    positions.forEach(pos => {
      const cards = MatchEventsDeck.getCardsByPosition(pos);
      expect(cards.length).toBeGreaterThanOrEqual(8);
    });
  });

  test('Rule 3: tactic modifier 0.3-2.0', () => {
    const cards = MatchEventsDeck.getAllCards();
    cards.forEach(card => {
      Object.values(card.tacticModifier).forEach(mod => {
        expect(mod).toBeGreaterThanOrEqual(0.3);
        expect(mod).toBeLessThanOrEqual(2.0);
      });
    });
  });

  test('Rule 4: narration variants 3-5', () => {
    const cards = MatchEventsDeck.getAllCards();
    cards.forEach(card => {
      expect(card.narrativeVariants.length).toBeGreaterThanOrEqual(3);
      expect(card.narrativeVariants.length).toBeLessThanOrEqual(5);
    });
  });

  test('Rule 5: impact ranges válidos', () => {
    const cards = MatchEventsDeck.getAllCards();
    cards.forEach(card => {
      expect(card.impact.homeGoalChance + card.impact.awayGoalChance).toBeLessThanOrEqual(100);
      expect(card.impact.playerRating).toBeGreaterThanOrEqual(-5);
      expect(card.impact.playerRating).toBeLessThanOrEqual(5);
    });
  });

  test('Rule 6: position-specific (GOL ≠ goal)', () => {
    const golCards = MatchEventsDeck.getCardsByPosition('GOL');
    const hasGoalType = golCards.some(c => c.type === 'goal');
    expect(hasGoalType).toBe(false);
  });

  test('Rule 7: weight sum ~100 per position', () => {
    const positions = ['GOL', 'DEF', 'MEI', 'ATA'];
    positions.forEach(pos => {
      const cards = MatchEventsDeck.getCardsByPosition(pos);
      const sum = cards.reduce((s, c) => s + c.weight, 0);
      expect(sum).toBeGreaterThan(90);  // Tolerância ±10
      expect(sum).toBeLessThan(110);
    });
  });

  test('Forbidden: GOL card type never goal', () => {
    const golCards = MatchEventsDeck.getCardsByPosition('GOL');
    golCards.forEach(card => {
      expect(card.type).not.toBe('goal');
    });
  });

});
```

---

**Status**: PRONTO PARA IMPLEMENTAÇÃO  
**Próxima**: SPEC-003 Player Development
