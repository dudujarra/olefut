# SPEC-074: Organic Challenges — Desafios e Missões Espontâneos

**Fase:** 3E — Técnico como Personagem  
**Prioridade:** MÉDIA-ALTA  
**Pré-requisito:** SPEC-070 Manager Identity + SPEC-071 Contract Goals  
**AKITA:** a definir

---

## O que é

Desafios espontâneos que aparecem durante o jogo como oportunidades opcionais — não são obrigatórios, não têm prazo fixo, e surgem de forma orgânica baseada no contexto do jogo. Inspirados na ideia do Dudu: "pegar times ruins e levantar, ou levantar um grande que caiu — como fases ou desafios".

**Tipos de desafio:**
1. **Salvar Time em Crise** — clube no Z4 sem técnico oferece contrato emergencial
2. **Levantar Gigante Caído** — clube historicamente grande em série inferior busca retorno
3. **Missão Copa** — clube médio quer chegar longe em copa nacional (objetivo único)
4. **Reconstrução Total** — clube falido quer reconstrução com orçamento zero
5. **Duelo de Estilos** — mídia propõe enfrentamento com rival tático (próximo clássico tem stakes extras)

---

## Input

```typescript
{
  managerId: number,
  currentClubId: number,
  season: number,
  week: number,
  leagueState: {
    clubsInRelegationZone: Array<number>,
    historicClubsInLowerDivisions: Array<number>,
    cupProgressByClub: Record<number, number>  // clubId → rodada atual na copa
  },
  managerReputation: number,
  managerAvailable: boolean   // sem contrato atual
}
```

---

## Output esperado

```typescript
{
  challengeAvailable: boolean,
  challenge?: {
    challengeId: string,
    type: 'crisis_save' | 'giant_revival' | 'cup_mission' | 'total_rebuild' | 'style_duel',
    targetClubId: number,
    targetClubName: string,
    description: string,            // "O Bahia está no Z4 e sem técnico — você aceita?"
    reward: {
      reputationBoost: number,       // se completar
      narrativeTitle: string         // "O Médico dos Clubes", "O Ressurgimento"
    },
    penalty: {
      reputationLoss: number         // se falhar
    },
    deadline?: number,               // week máxima para aceitar (some depois)
    optional: true                   // sempre true — nunca obrigatório
  }
}
```

**Quando aparecem:**
```
crisis_save: algum clube Z4 ficou sem técnico na semana passada
giant_revival: clube historicamente top-5 está em divisão inferior há 2+ seasons
cup_mission: clube em semifinal de copa está sem técnico (raro)
total_rebuild: clube com budget < 10% da média da liga por 2+ seasons
style_duel: rival direto tem técnico com estilo oposto ao player (attacking vs defensive)
```

---

## Regras de validação

- [ ] Desafio só aparece se condição contextual for verdadeira (não aleatório)
- [ ] `optional: true` sempre — nunca bloqueia progressão do jogo
- [ ] Player com contrato ativo pode VER o desafio mas não aceitar (aparece como "futuro")
- [ ] Aceitar desafio de `crisis_save` termina contrato atual (paga exitFee se aplicável)
- [ ] No máximo 1 desafio ativo por vez
- [ ] `reputationBoost` entre 10 e 30 (desafios têm risco real)
- [ ] `reputationLoss` entre 5 e 15 se falhar
- [ ] Desafio expira em 2-4 semanas se não aceito (`deadline` variável)

---

## Forbidden

- [ ] Desafio obrigatório (interromper jogo para forçar aceitação)
- [ ] Desafio sem condição contextual real (puramente aleatório)
- [ ] `reputationBoost = 0` ou `reputationLoss = 0`
- [ ] Dois desafios simultâneos
- [ ] Desafio sem `description` legível

---

## Implementação

**Arquivo:** `src/engine/OrganicChallengeSystem.js` (novo)  
**Integração:** `engine.endWeek()` avalia contexto e gera desafio se condição verdadeira  
**UI:** banner no dashboard "Novo Desafio Disponível" com modal de detalhe

---

## Testes esperados

```javascript
describe('SPEC-074: Organic Challenges', () => {
  test('crisis_save requires relegated club without manager (rule 1)', () => {
    const result = OrganicChallengeSystem.evaluate({
      leagueState: { clubsInRelegationZone: [15], clubWithoutManager: [15] },
      ...defaults
    });
    if (result.challengeAvailable) expect(result.challenge.type).toBe('crisis_save');
  });

  test('challenge is always optional (rule 2)', () => {
    const result = OrganicChallengeSystem.evaluate({ ...challengeContext });
    if (result.challengeAvailable) expect(result.challenge.optional).toBe(true);
  });

  test('player with contract sees challenge as future (rule 3)', () => {
    const result = OrganicChallengeSystem.evaluate({ managerAvailable: false, ...challengeContext });
    if (result.challengeAvailable) expect(result.challenge.futureOnly).toBe(true);
  });

  test('reputation boost in 10-30 range (rule 6)', () => {
    const result = OrganicChallengeSystem.evaluate({ ...challengeContext });
    if (result.challengeAvailable) {
      expect(result.challenge.reward.reputationBoost).toBeGreaterThanOrEqual(10);
      expect(result.challenge.reward.reputationBoost).toBeLessThanOrEqual(30);
    }
  });

  test('only 1 active challenge at a time (rule 5)', () => {
    OrganicChallengeSystem.setActive('c1');
    const result = OrganicChallengeSystem.evaluate({ ...challengeContext });
    expect(result.challengeAvailable).toBe(false);
  });

  test('challenge expires after deadline weeks (rule 8)', () => {
    const result = OrganicChallengeSystem.evaluate({ week: 10, ...challengeContext });
    if (result.challengeAvailable) {
      expect(result.challenge.deadline).toBeGreaterThanOrEqual(12);
      expect(result.challenge.deadline).toBeLessThanOrEqual(14);
    }
  });

  test('giant_revival requires historic club in lower div 2+ seasons (rule 1b)', () => {
    const result = OrganicChallengeSystem.evaluate({
      leagueState: { historicClubsInLowerDivisions: [3], yearsInLower: { 3: 2 } },
      ...defaults
    });
    if (result.challengeAvailable && result.challenge.type === 'giant_revival') {
      expect(result.challenge.targetClubId).toBe(3);
    }
  });

  test('forbidden: challenge without description (rule forbidden 5)', () => {
    const result = OrganicChallengeSystem.evaluate({ ...challengeContext });
    if (result.challengeAvailable) expect(result.challenge.description).toBeTruthy();
  });
});
```

---

## Definition of Done
- [ ] `OrganicChallengeSystem.js` passa todos os 8 testes
- [ ] Em autoplay 20 seasons: pelo menos 3 desafios gerados organicamente
- [ ] Banner de desafio visível no dashboard (não intrusivo)

## Definition of Stop
- Se desafios aparecerem toda season (demais): aumentar condições para `crisis_save` (exige Z4 + sem técnico por 2 semanas)
