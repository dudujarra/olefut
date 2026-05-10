# SPEC-071: Contract Goals System — Contratos com Metas Explícitas

**Fase:** 3B — Técnico como Personagem  
**Prioridade:** ALTA (pós-refactor)  
**Telemetria:** Resolve FLAT_CURVE indiretamente — metas criam stakes por season  
**Pré-requisito:** SPEC-070 Manager Identity  
**AKITA:** a definir

---

## O que é

Cada contrato de técnico tem objetivo explícito definido pelo board no momento da contratação. Não cumprir = demissão automática. Cumprir = renovação + bonus de reputação + possibilidade de proposta de time maior.

Isso transforma cada season em uma narrativa com stakes claros — elimina o problema de progressão flat onde nada acontece ao fim de cada temporada.

---

## Input

```typescript
{
  managerId: number,
  clubId: number,
  clubLeaguePosition: number,   // posição atual na liga (antes da season)
  clubTier: 'big' | 'mid' | 'small',
  managerReputation: number,    // 0-100
  contractType: 'new_hire' | 'renewal'
}
```

---

## Output esperado (contrato gerado)

```typescript
{
  contractId: string,
  managerId: number,
  clubId: number,
  objective: 'avoid_relegation' | 'top_half' | 'top_4' | 'title' | 'promotion',
  objectiveDescription: string,  // texto legível: "Não ser rebaixado"
  minWeeks: number,              // semanas mínimas antes de poder ser demitido
  bonusReputation: number,       // ganho se cumprir
  penaltyReputation: number,     // perda se falhar (antes de season acabar)
  expiresAfterSeasons: number    // duração do contrato (1-3 seasons)
}
```

**Lógica de objetivo por contexto:**
```
clubTier=small + managerReputation < 40 → avoid_relegation
clubTier=small + managerReputation 40-70 → top_half ou promotion (se série B)
clubTier=mid + any reputation → top_4 ou avoid_relegation (se em crise)
clubTier=big + managerReputation < 60 → top_4
clubTier=big + managerReputation ≥ 60 → title
```

**Resolução de contrato ao fim da season:**
```typescript
{
  contractId: string,
  outcome: 'fulfilled' | 'failed' | 'active',
  reputationDelta: number,
  consequence: 'renewal_offered' | 'fired' | 'bigger_club_interested' | 'nothing'
}
```

---

## Regras de validação

- [ ] Todo técnico contratado recebe contrato com `objective` definido
- [ ] `objective` coerente com contexto do clube (big club não recebe avoid_relegation exceto em crise)
- [ ] `objectiveDescription` sempre não vazio e legível
- [ ] Falhar objective → `consequence=fired` (salvo se em `minWeeks` buffer)
- [ ] Cumprir objective com reputação ≥ 70 → `bigger_club_interested` em ≥30% dos casos
- [ ] `bonusReputation` ≥ 5 e ≤ 15 para todo contrato
- [ ] `penaltyReputation` ≥ 5 e ≤ 20 para todo contrato
- [ ] `expiresAfterSeasons` entre 1 e 3 (nunca indefinido)

---

## Forbidden

- [ ] Contrato sem `objective`
- [ ] Big club recebendo `avoid_relegation` quando reputação do manager ≥ 60
- [ ] `bonusReputation` ou `penaltyReputation` = 0
- [ ] Demissão dentro do `minWeeks` buffer (proteção contratual)
- [ ] Mesmo manager recebendo dois contratos simultâneos

---

## Implementação

**Arquivo:** `src/engine/ContractGoalSystem.js` (novo)  
**Integração:**
- `engine.hireManager()` → chama `ContractGoalSystem.generate()`
- `engine.endSeason()` → chama `ContractGoalSystem.resolve(contractId)`
**UI:** contrato visível na BoardView / ManagerProfileView

---

## Testes esperados

```javascript
describe('SPEC-071: Contract Goals System', () => {
  test('every hired manager gets contract with objective (rule 1)', () => {
    const contract = ContractGoalSystem.generate({ clubTier: 'small', managerReputation: 30, ...defaults });
    expect(contract.objective).toBeDefined();
    expect(contract.objectiveDescription).toBeTruthy();
  });

  test('big club rep≥60 gets title objective (rule 2)', () => {
    const contract = ContractGoalSystem.generate({ clubTier: 'big', managerReputation: 70, ...defaults });
    expect(contract.objective).toBe('title');
  });

  test('small club low rep gets avoid_relegation (rule 2b)', () => {
    const contract = ContractGoalSystem.generate({ clubTier: 'small', managerReputation: 25, ...defaults });
    expect(contract.objective).toBe('avoid_relegation');
  });

  test('failing objective → fired (rule 4)', () => {
    const result = ContractGoalSystem.resolve({ contractId: 'c1', objectiveMet: false, weeksManaged: 20, minWeeks: 10 });
    expect(result.consequence).toBe('fired');
  });

  test('minWeeks buffer protects from early firing (rule 4 exception)', () => {
    const result = ContractGoalSystem.resolve({ contractId: 'c1', objectiveMet: false, weeksManaged: 5, minWeeks: 10 });
    expect(result.consequence).not.toBe('fired');
  });

  test('fulfill + rep≥70 → bigger_club_interested 30%+ of time (rule 5)', () => {
    const results = Array(100).fill(null).map(() =>
      ContractGoalSystem.resolve({ contractId: 'c1', objectiveMet: true, managerReputation: 75, ...defaults })
    );
    expect(results.filter(r => r.consequence === 'bigger_club_interested').length).toBeGreaterThanOrEqual(30);
  });

  test('bonusReputation in 5-15 range (rule 6)', () => {
    const contract = ContractGoalSystem.generate({ clubTier: 'mid', managerReputation: 50, ...defaults });
    expect(contract.bonusReputation).toBeGreaterThanOrEqual(5);
    expect(contract.bonusReputation).toBeLessThanOrEqual(15);
  });

  test('expiresAfterSeasons in 1-3 range (rule 8)', () => {
    const contract = ContractGoalSystem.generate({ clubTier: 'big', managerReputation: 80, ...defaults });
    expect(contract.expiresAfterSeasons).toBeGreaterThanOrEqual(1);
    expect(contract.expiresAfterSeasons).toBeLessThanOrEqual(3);
  });
});
```

---

## Definition of Done
- [ ] `ContractGoalSystem.js` passa todos os 8 testes
- [ ] Toda season termina com resolução de contrato visível para player
- [ ] SPEC-110 Progression score > 60 no próximo playtest (metas criam progressão)

## Definition of Stop
- Se demissões automáticas frustrarem jogador excessivamente: aumentar buffer minWeeks para 15
