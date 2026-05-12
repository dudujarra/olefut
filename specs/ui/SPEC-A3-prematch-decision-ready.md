# SPEC-A3: PreMatch Decision-Ready

> Status: **DRAFT — implementação no mesmo PR**
> Fase: A3 — Tornar JOGÁVEL (GAME-DESIGN-ROADMAP)

---

## O que é

Enriquece `PreMatchScreen.jsx` com 2 dados acionáveis pré-jogo:

1. **Forma WWLDD** — 5 últimos resultados do meu time (W/D/L pills coloridos)
2. **Sugestão do Auxiliar** — 1 frase tática baseada em comparação de setores (ataque do oponente vs minha defesa, etc)

Resolve problema #2 do roadmap: "decisões sem feedback de consequência".

---

## Input

- `engine.managerStats.rollingForm` (array W/D/L) — nosso time
- `sectors` (mandante) + `context.oppSectors` (visitante) — para sugestão

---

## Output esperado

UI render:
- WWLDD pill row no painel "MANDANTE" (5 últimas)
- Linha "AUXILIAR SUGERE: <tática>" no painel central VS

`suggestTactic({ ourSectors, oppSectors, isHome })` retorna:
```typescript
{
  tactic: 'Ofensivo' | 'Defensivo' | 'Contra-Ataque' | 'Posse' | 'Pressing' | 'Normal',
  rationale: string  // 1-frase PT-BR
}
```

---

## Regras

### 1. Forma
- [ ] Mostra até 5 resultados mais recentes
- [ ] Empty state: "—" quando vazio (1ª temporada semana 1)
- [ ] W=verde, D=amarelo, L=vermelho

### 2. Sugestão
- [ ] Heurística baseada em diff de setores
- [ ] `oppAttack - ourDefense > 10` → Defensivo (recomendação cautelosa)
- [ ] `ourAttack - oppDefense > 10` → Ofensivo
- [ ] `oppAttack > ourAttack + 5` e `oppDefense > ourDefense + 5` → Contra-Ataque (forte+forte)
- [ ] `|ourOvr - oppOvr| < 5` → Normal
- [ ] Else → Posse (jogo equilibrado, manter bola)

### 3. Determinismo
- [ ] Mesmos setores → mesma sugestão

### 4. Forbidden
- [ ] Sugestão impossível (tática fora do enum)
- [ ] Sem rationale
- [ ] Emoji em rationale

---

## Implementação

- **Novo**: `src/engine/TacticSuggester.js` (~70 LOC)
- **Modifica**: `src/components/PreMatchScreen.jsx` (+~30 LOC: form pills + suggestion line)
- **Novo harness**: `tests/specs/SPEC-A3-tactic-suggester.test.js`

---

## Testes

```javascript
describe('SPEC-A3: TacticSuggester', () => {
  test('rule 2: opp attack >> our defense → Defensivo', () => {});
  test('rule 2: our attack >> opp defense → Ofensivo', () => {});
  test('rule 2: equilibrado → Normal', () => {});
  test('rule 2: ambos fortes → Contra-Ataque', () => {});
  test('rule 3: determinism', () => {});
});
```

---

**SPEC versão**: 1.0
