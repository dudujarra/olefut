# SPEC-B2: Mid-Match Manager Deck

> Status: **DRAFT — implementação parcial PR atual (engine + helpers)**
> Fase: B2 — Tornar PRAZEROSO
> Wiring UI (MatchView overlay): SPEC-B2.2 separate PR

---

## O que é

Catálogo de 8 cartas de **decisão mid-match para modo Manager**: gatilho em minutos 15/30/45/60/75 com chance 30% (~2-3 cartas por partida).

Cada carta: pergunta breve (situação tática) + 3 opções (efeitos numéricos em moral/energy/tactic switch).

Resolve gap: hoje só modo Jogador tem decisões during play. Manager vira espectador da partida — vide problema #1 GAME-DESIGN-ROADMAP.

---

## Input/Output

```typescript
// Catalogo
export const MidMatchManagerDeck: Card[];

interface Card {
  id: string;
  minuteRange: [number, number];  // ex: [15, 30]
  text: string;
  options: Array<{
    label: string;
    effect: { moralDelta?: number, energyDelta?: number, tacticShift?: string };
    resultText: string;
  }>;
}

// Helpers
shouldTriggerMidMatch(minute: number, alreadyTriggered: Set<number>): boolean
getMidMatchCard(minute: number, seed: number): Card | null
```

---

## Regras

### 1. Triggers
- [ ] Trigger só em minutos múltiplos de 15 (15, 30, 45, 60, 75)
- [ ] Não trigger duas vezes no mesmo minuto
- [ ] Probabilidade base 30% (gated externally se desejado)

### 2. Catálogo
- [ ] ≥8 cartas totais
- [ ] 3 opções cada
- [ ] Effects ≤ ±15 (não disruptive)

### 3. PT-BR + sem emoji
- [ ] Textos em português brasileiro
- [ ] Sem emoji no source

### 4. Determinismo
- [ ] Mesmo seed + minuto → mesma carta sorteada

### 5. Forbidden
- [ ] Card sem options
- [ ] Effect referenciar campo desconhecido
- [ ] Emoji em catalog

---

## Implementação

- **Novo**: `src/engine/MidMatchManagerDeck.js` (~120 LOC)
- **Novo harness**: `tests/specs/SPEC-B2-mid-match-deck.test.js`
- UI wiring (modal MatchView): SPEC-B2.2 (não nesse PR)

---

**SPEC versão**: 1.0
