# SPEC-073: Coach Proposals System — Propostas Orgânicas de Clubes

**Fase:** 3D — Técnico como Personagem  
**Prioridade:** ALTA (pós-refactor)  
**Pré-requisito:** SPEC-070 Manager Identity + SPEC-071 Contract Goals  
**AKITA:** a definir

---

## O que é

Sistema de propostas orgânicas de outros clubes para contratar o técnico player-manager. Propostas aparecem baseadas em performance e reputação — não são aleatórias. Player decide: aceitar (ambição), negociar extensão no clube atual, ou recusar.

Cada decisão tem consequências:
- Aceitar mid-season: paga multa rescisória, moral do elenco cai
- Esperar fim de contrato: honra, sem multa, mas pode perder a vaga
- Recusar: clube rival contrata técnico alternativo (cria stakes competitivos)

---

## Input

```typescript
{
  managerId: number,
  currentClubId: number,
  currentContractWeeksLeft: number,
  managerReputation: number,       // 0-100
  recentForm: Array<'W' | 'D' | 'L'>,  // últimas 6 semanas
  currentObjectiveMet: boolean,
  week: number,
  season: number
}
```

---

## Output esperado (avaliação de proposta)

```typescript
{
  proposalAvailable: boolean,
  proposal?: {
    proposalId: string,
    fromClubId: number,
    fromClubName: string,
    fromClubTier: 'big' | 'mid' | 'small',
    contractObjective: string,      // objetivo que virá no contrato
    reputationBoost: number,        // ganho de reputação por aceitar
    exitFee: number,                // multa rescisória se aceitar agora
    deadline: number,               // week limite para decidir
    reason: string                  // "Impressionados com sua campanha"
  },
  decisionRequired: boolean
}
```

**Condições para proposta aparecer:**
```
reputação ≥ 50 + últimas 4 sem: 3+ vitórias → proposta de club tier ≥ atual
reputação ≥ 70 + objetivo cumprido → proposta de big club
reputação < 30 → sem propostas de clubes maiores
```

**Consequências de decisão:**
```typescript
{
  decision: 'accept' | 'wait_contract_end' | 'refuse',
  effect: {
    reputationDelta: number,
    squadMoraleDelta: number,   // aceitar mid-season: -10 a -20
    exitFeePaid: number,        // 0 se wait_contract_end
    newClubId?: number          // se accept
  }
}
```

---

## Regras de validação

- [ ] Propostas só aparecem se `reputação ≥ 50` + form positiva
- [ ] Proposta de big club só se `reputação ≥ 70` + objetivo cumprido
- [ ] `exitFee` = 0 se `contractWeeksLeft ≤ 4` (contrato quase acabando)
- [ ] Aceitar mid-season: `squadMoraleDelta` entre -10 e -20
- [ ] `deadline` sempre ≥ 2 semanas após proposta aparecer
- [ ] Recusar: rival contrata alternativo (evento narrativo gerado)
- [ ] Player com reputação < 30: `proposalAvailable=false` sempre
- [ ] No máximo 1 proposta ativa por vez

---

## Forbidden

- [ ] Proposta de clube do mesmo tier quando reputação < 50
- [ ] `exitFee` negativo
- [ ] Proposta sem `deadline` definido
- [ ] Duas propostas simultâneas para o mesmo manager
- [ ] Aceitar proposta sem pagar `exitFee` (se mid-season)

---

## Implementação

**Arquivo:** `src/engine/CoachProposalSystem.js` (novo)  
**Integração:** `engine.endWeek()` avalia propostas disponíveis  
**UI:** modal de proposta no Dashboard quando `proposalAvailable=true`

---

## Testes esperados

```javascript
describe('SPEC-073: Coach Proposals System', () => {
  test('no proposal if reputation < 50 (rule 1)', () => {
    const result = CoachProposalSystem.evaluate({ managerReputation: 40, recentForm: ['W','W','W','W'], ...defaults });
    expect(result.proposalAvailable).toBe(false);
  });

  test('proposal available with rep ≥ 50 + positive form (rule 1b)', () => {
    const result = CoachProposalSystem.evaluate({ managerReputation: 60, recentForm: ['W','W','W','D'], ...defaults });
    expect(result.proposalAvailable).toBe(true);
  });

  test('big club only if rep ≥ 70 + objective met (rule 2)', () => {
    const result = CoachProposalSystem.evaluate({ managerReputation: 75, currentObjectiveMet: true, recentForm: ['W','W','W','W'], ...defaults });
    if (result.proposalAvailable) expect(['big']).toContain(result.proposal.fromClubTier);
  });

  test('exitFee = 0 if contract ending (rule 3)', () => {
    const result = CoachProposalSystem.evaluate({ managerReputation: 65, currentContractWeeksLeft: 3, recentForm: ['W','W','W','W'], ...defaults });
    if (result.proposalAvailable) expect(result.proposal.exitFee).toBe(0);
  });

  test('accept mid-season: squad morale drops 10-20 (rule 4)', () => {
    const effect = CoachProposalSystem.decide({ decision: 'accept', currentContractWeeksLeft: 20, ...defaults });
    expect(effect.squadMoraleDelta).toBeLessThanOrEqual(-10);
    expect(effect.squadMoraleDelta).toBeGreaterThanOrEqual(-20);
  });

  test('deadline ≥ 2 weeks from proposal (rule 5)', () => {
    const result = CoachProposalSystem.evaluate({ managerReputation: 65, recentForm: ['W','W','W','W'], currentWeek: 10, ...defaults });
    if (result.proposalAvailable) expect(result.proposal.deadline).toBeGreaterThanOrEqual(12);
  });

  test('refuse generates rival hire narrative (rule 6)', () => {
    const effect = CoachProposalSystem.decide({ decision: 'refuse', proposalId: 'p1', ...defaults });
    expect(effect.narrativeEvent).toBe('rival_hired_alternative');
  });

  test('only 1 active proposal at a time (rule 8)', () => {
    CoachProposalSystem.evaluate({ managerReputation: 65, recentForm: ['W','W','W','W'], ...defaults });
    const second = CoachProposalSystem.evaluate({ managerReputation: 65, recentForm: ['W','W','W','W'], ...defaults });
    expect(second.proposalAvailable).toBe(false); // já tem proposta ativa
  });
});
```

---

## Definition of Done
- [ ] `CoachProposalSystem.js` passa todos os 8 testes
- [ ] Modal de proposta aparece em autoplay com rep ≥ 50 + form positiva
- [ ] Consequências (morale, exitFee) aplicadas corretamente no save

## Definition of Stop
- Se propostas aparecerem toda season (spam): aumentar threshold para rep ≥ 60 + 5+ vitórias
