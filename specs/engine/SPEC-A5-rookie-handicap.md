# SPEC-A5: Rookie Handicap (1ª Temporada Calibration)

> Status: **DRAFT — implementação no mesmo PR**
> Fase: A5 — Tornar JOGÁVEL

---

## O que é

Aplica handicap suave nas 3 primeiras partidas da 1ª temporada: reduz attrs do oponente em 10% para aumentar chance de empate ou vitória do novato. Decay linear até partida 4 (sem handicap).

Resolve premissa UX: primeira sessão precisa de win pra reter player.

---

## Input

```typescript
{
  seasonNumber: number,   // engine.seasonNumber
  matchesPlayedSeason: number,  // engine.managerStats.wins + draws + losses
}
```

---

## Output

```typescript
number  // multiplicador 0.9..1.0 aplicado a sectors do oponente
```

---

## Regras

### 1. Trigger
- [ ] Só aplica em `seasonNumber === 1`
- [ ] Só aplica em `matchesPlayedSeason < 3`

### 2. Curve
- [ ] Match 1: handicap = 0.90 (oponente -10%)
- [ ] Match 2: handicap = 0.93
- [ ] Match 3: handicap = 0.97
- [ ] Match 4+: 1.0 (no handicap)
- [ ] Season 2+: 1.0 sempre

### 3. Integração
- [ ] Multiplica `opponentBoost` em `MatchSimulator.js` linha ~104
- [ ] Aplicado APÓS DDA já calculado

### 4. Determinístico
- [ ] Mesma entrada → mesma saída

### 5. Forbidden
- [ ] Aplicar em temporadas > 1
- [ ] Aplicar handicap > 0.10 (max 10% redução)
- [ ] Aplicar handicap a partir match 4

---

## Implementação

- **Novo**: `src/engine/RookieHandicap.js` (~40 LOC)
- **Modifica**: `src/services/MatchSimulator.js` (+3 LOC)
- **Novo harness**: `tests/specs/SPEC-A5-rookie-handicap.test.js`

---

## Testes

```javascript
describe('SPEC-A5: RookieHandicap', () => {
  test('rule 1: season 1 match 1 → 0.90', () => {});
  test('rule 1: season 2 → 1.0 sempre', () => {});
  test('rule 2: curve linear', () => {});
  test('rule 4: determinism', () => {});
});
```

---

**SPEC versão**: 1.0
