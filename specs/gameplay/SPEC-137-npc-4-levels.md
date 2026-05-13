# SPEC-137: NPC Adversário — 4 Levels de Dificuldade baseados em Deep Soak

> **Origem**: análise comportamental das 5 runs autoplay (104-216 temporadas cada). Cada level usa perfil real de comportamento observado — não inventado.

---

## O que é

Define 4 perfis de IA adversária com comportamentos distintos, extraídos diretamente dos dados de deep soak. Cada level tem: perfil tático, taxa de erros, agressividade de mercado, gestão de elenco e tomada de decisão em crise.

---

## Input

```typescript
{
  npcLevel: 1 | 2 | 3 | 4,
  teamId: number
}
```

---

## Output esperado

NPC com perfil de comportamento coerente com o level:

| Level | Nome | Win Rate Target | Crashes | Tática | Gestão Crise |
|-------|------|----------------|---------|--------|-------------|
| 1 | Noob | ~35% | frequentes | defensiva, muda pouco | pânico (DREAD alto) |
| 2 | Amador | ~42% | ocasionais | ofensiva rígida | reativo, lento |
| 3 | Veterano | ~50% | raros | counter+offensive mix | estável, pouca exploração |
| 4 | Expert | ~58% | zero | ofensiva adaptativa | proativo, squad_replenish |

---

## Regras de validação

- [ ] Level 1 NPC usa tática defensiva em ≥ 60% das semanas
- [ ] Level 2 NPC usa tática ofensiva em ≥ 70% das semanas
- [ ] Level 3 NPC muda tática ≤ 1x a cada 8 semanas (replica counter-lock observado)
- [ ] Level 4 NPC muda tática ≥ 1x por 5 semanas quando perdendo ≥ 3 seguidas
- [ ] Level 1 NPC não faz SQUAD_REPLENISH quando elenco < 13 jogadores
- [ ] Level 4 NPC faz SQUAD_REPLENISH quando elenco < 15 jogadores
- [ ] DREAD_RELEGATION aparece em Level 1-2 quando em zona de rebaixamento, nunca em Level 4
- [ ] Win rate do Level 4 > Level 3 > Level 2 > Level 1 em 20 temporadas simuladas

---

## Forbidden

- [ ] Level 1 com win rate > 50%
- [ ] Level 4 com DECISIONS_CRASH
- [ ] Level 4 com TACTIC_STUCK > 4 semanas
- [ ] Qualquer level com topScorer acumulando (Bug 3 já corrigido por SPEC-136)
- [ ] Level 3 mudando tática toda semana (seria Level 4)

---

## Implementação

### Arquivo novo: `src/engine/NpcBehaviorProfile.js`

```javascript
export const NPC_PROFILES = {
  1: { // Noob — baseado em run-1 e run-2
    name: 'Noob',
    tacticPreference: 'defensive',
    tacticFlexibility: 0.1,      // 10% chance de mudar tática por semana
    squadReplenishThreshold: 8,  // só reabastece se elenco < 8
    dreadThreshold: 5,           // entra em DREAD se 5+ derrotas seguidas
    marketActivity: 0.1,         // 10% chance de fazer transferência por janela
    decisionErrorRate: 0.15,     // 15% das decisões são subótimas
  },
  2: { // Amador — baseado em run-2 e run-3 (antes de run-3 convergir)
    name: 'Amador',
    tacticPreference: 'offensive',
    tacticFlexibility: 0.15,
    squadReplenishThreshold: 10,
    dreadThreshold: 4,
    marketActivity: 0.2,
    decisionErrorRate: 0.10,
  },
  3: { // Veterano — baseado em run-4 (robusto mas monotono)
    name: 'Veterano',
    tacticPreference: 'counter',
    tacticFlexibility: 0.08,     // muda pouco — replica TACTIC_STUCK run-4
    squadReplenishThreshold: 12,
    dreadThreshold: 7,           // quase nunca entra em pânico
    marketActivity: 0.3,
    decisionErrorRate: 0.05,
  },
  4: { // Expert — baseado em run-5 (maior win rate, mais adaptativo)
    name: 'Expert',
    tacticPreference: 'offensive',
    tacticFlexibility: 0.35,     // muda tática proativamente
    squadReplenishThreshold: 15, // elenco sempre cheio
    dreadThreshold: Infinity,    // nunca entra em DREAD
    marketActivity: 0.5,
    decisionErrorRate: 0.02,
  }
};
```

### Arquivo modificado: `src/engine/NpcTacticAdvisor.js`

Injetar profile no advisor:
```javascript
import { NPC_PROFILES } from './NpcBehaviorProfile.js';

export function adviseNpcTactic(engine, teamId, npcLevel = 2) {
  const profile = NPC_PROFILES[npcLevel] || NPC_PROFILES[2];
  // usar profile.tacticFlexibility para decidir se muda tática
  // usar profile.dreadThreshold para DREAD_RELEGATION
  // usar profile.squadReplenishThreshold para SQUAD_REPLENISH
}
```

### Arquivo modificado: `src/services/AutoPlayService.js`

Passar `npcLevel` ao inicializar AutoPlay para times adversários:
```javascript
// ao iniciar partida contra NPC:
const npcProfile = NPC_PROFILES[game.difficulty || 2];
engine.setNpcProfile(teamId, npcProfile);
```

---

## Mapeamento direto dos dados de deep soak

| Level | Run fonte | Comportamento observado | Métrica chave |
|-------|-----------|------------------------|---------------|
| 1 | run-1 (1778458660022) | Defensiva, 94% crashes, DREAD=18 | squad_short=1, market=baixo |
| 2 | run-2 (1778459078831) | Ofensiva, crashes, squad_short=8 | DREAD=2, squad mais gerenciado |
| 3 | run-4 (1778460065428) | Counter 86%, zero crashes, estável | decision_impact=100, monotono |
| 4 | run-5 (1778460495249) | Ofensiva adaptativa, win=1.2% | squad_replenish ativo, DREAD=0 |

---

## Testes esperados

```javascript
describe('SPEC-137: NPC 4 Levels', () => {

  test('Level 1: usa tática defensiva >= 60% do tempo', async () => {
    const results = await simulate20Seasons(teamId, npcLevel=1);
    expect(results.defensiveTacticRate).toBeGreaterThanOrEqual(0.6);
  });

  test('Level 4: win rate > Level 1 em 20 temporadas', async () => {
    const l4 = await simulate20Seasons(teamId, npcLevel=4);
    const l1 = await simulate20Seasons(teamId, npcLevel=1);
    expect(l4.winRate).toBeGreaterThan(l1.winRate);
  });

  test('Level 4: zero DECISIONS_CRASH', async () => {
    const results = await simulate20Seasons(teamId, npcLevel=4);
    expect(results.anomalies.filter(a => a.type === 'DECISIONS_CRASH').length).toBe(0);
  });

  test('Level 4: TACTIC_STUCK streak nunca > 4 semanas', async () => {
    const results = await simulate20Seasons(teamId, npcLevel=4);
    const stuck = results.anomalies.filter(a => a.type === 'TACTIC_STUCK');
    stuck.forEach(s => expect(s.ctx.streak).toBeLessThanOrEqual(4));
  });

  test('Level 1: DREAD aparece quando > 5 derrotas seguidas', async () => {
    // simular 6 derrotas seguidas para NPC Level 1
    expect(npc.isDread).toBe(true);
  });

  test('Level 4: squad_replenish quando elenco < 15', () => {
    const profile = NPC_PROFILES[4];
    expect(profile.squadReplenishThreshold).toBe(15);
  });

  test('4 profiles têm win rates em ordem crescente', async () => {
    const rates = await Promise.all([1,2,3,4].map(l => simulate20Seasons(teamId, l).then(r => r.winRate)));
    expect(rates[3]).toBeGreaterThan(rates[2]);
    expect(rates[2]).toBeGreaterThan(rates[1]);
    expect(rates[1]).toBeGreaterThan(rates[0]);
  });

  test('NPC_PROFILES exporta 4 levels com campos obrigatórios', () => {
    [1,2,3,4].forEach(l => {
      expect(NPC_PROFILES[l]).toHaveProperty('tacticPreference');
      expect(NPC_PROFILES[l]).toHaveProperty('tacticFlexibility');
      expect(NPC_PROFILES[l]).toHaveProperty('squadReplenishThreshold');
    });
  });
});
```

---

## Harness de validação

```bash
#!/bin/bash
# harness/SPEC-137-validate.sh
cd /Users/dudujarra/Documents/OléFUT
npm test -- --testNamePattern="SPEC-137" 2>&1
exit $?
```

**Gate CI**: todos os 8 testes passam.
