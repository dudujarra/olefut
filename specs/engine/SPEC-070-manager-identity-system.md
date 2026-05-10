# SPEC-070: Manager Identity System — Técnico como Personagem

**Fase:** 3A — Técnico como Personagem  
**Prioridade:** ALTA (pós-refactor)  
**Telemetria:** SPEC-107 Player Identity score=78 — base boa, mas sem identidade de técnico  
**Pré-requisito:** SPEC-026 Prestige/Reputation + v1.0.5 Refactor  
**AKITA:** a definir

---

## O que é

Transforma o técnico (player-manager e NPCs principais) em personagem com identidade própria: reputação numérica, estilo tático reconhecível, ranking público, e histórico de carreira visível. Base para o sistema de propostas (SPEC-073) e contratos com metas (SPEC-071).

**Dados que todo técnico tem:**
- Reputação (0-100)
- Estilo dominante (calculado por histórico tático)
- Ranking entre técnicos da liga
- Histórico: clubes, seasons, títulos, promoções/rebaixamentos

---

## Input (criação/update de manager)

```typescript
{
  managerId: number,
  name: string,
  isPlayerManager: boolean,
  tacticHistory: Array<{
    tactic: string,
    gamesUsed: number,
    winRate: number
  }>,
  careerHistory: Array<{
    clubId: number,
    seasonsManaged: number,
    titlesWon: number,
    relegated: boolean,
    promoted: boolean
  }>,
  currentReputation: number  // 0-100
}
```

---

## Output esperado

```typescript
{
  managerId: number,
  reputation: number,          // 0-100
  reputationTier: 'lenda' | 'experiente' | 'promissor' | 'iniciante',
  dominantStyle: 'attacking' | 'defensive' | 'normal' | 'balanced',
  styleConfidence: number,     // 0-100 (quão clara é a identidade tática)
  ranking: number,             // posição entre técnicos da liga
  careerHighlight: string,     // texto gerado: "Campeão da Série B pelo Vitória (2031)"
  attractiveness: {            // que tipo de clube te quer
    smallClub: number,         // 0-100
    midClub: number,
    bigClub: number
  }
}
```

**Cálculo de reputação:**
```
reputation += 10 por título nacional
reputation += 5 por título regional
reputation += 5 por promoção de divisão
reputation -= 8 por rebaixamento
reputation -= 3 por demissão antes do fim do contrato
reputation = clamp(reputation, 0, 100)
```

**Cálculo de estilo dominante:**
```
tacticHistory → conta qual tática usou em >40% dos jogos → dominantStyle
Se nenhuma > 40% → 'balanced'
styleConfidence = max_tactic_usage_percentage (0-100)
```

**Attractiveness:**
```
reputation 0-30 → smallClub=80, midClub=20, bigClub=0
reputation 31-60 → smallClub=50, midClub=70, bigClub=10
reputation 61-80 → smallClub=20, midClub=60, bigClub=40
reputation 81-100 → smallClub=5, midClub=30, bigClub=80
```

---

## Regras de validação

- [ ] `reputation` sempre 0-100
- [ ] `reputationTier`: lenda ≥80, experiente 50-79, promissor 20-49, iniciante <20
- [ ] `dominantStyle` calculado a partir de tacticHistory real (não hardcoded)
- [ ] `styleConfidence` reflete % real de uso da tática dominante
- [ ] Título nacional: reputação sobe exatamente +10
- [ ] Rebaixamento: reputação cai exatamente -8
- [ ] `ranking` é posição ordinal entre todos os managers da liga
- [ ] `attractiveness` soma 100 (approx — dentro de ±5%)

---

## Forbidden

- [ ] `reputation` abaixo de 0 ou acima de 100
- [ ] `dominantStyle` sem base em dados de tacticHistory
- [ ] Dois managers com mesmo ranking
- [ ] `careerHighlight` vazio (mesmo para manager novato — usa "Estreia como técnico")
- [ ] Player-manager e NPC compartilhando mesmo sistema de cálculo de attractiveness

---

## Implementação

**Arquivo:** `src/engine/ManagerIdentitySystem.js` (novo)  
**Schema save:** `save.managers[id] = { reputation, style, history, ... }`  
**UI:** `src/views/ManagerProfileView.js` (nova view — integra com SPEC-135 desbloqueio)

---

## Testes esperados

```javascript
describe('SPEC-070: Manager Identity System', () => {
  test('reputation always 0-100 (rule 1)', () => {
    const m = ManagerIdentitySystem.compute({ ...overperformingManager });
    expect(m.reputation).toBeGreaterThanOrEqual(0);
    expect(m.reputation).toBeLessThanOrEqual(100);
  });

  test('reputation tier mapping (rule 2)', () => {
    expect(ManagerIdentitySystem.compute({ currentReputation: 85 }).reputationTier).toBe('lenda');
    expect(ManagerIdentitySystem.compute({ currentReputation: 55 }).reputationTier).toBe('experiente');
    expect(ManagerIdentitySystem.compute({ currentReputation: 25 }).reputationTier).toBe('promissor');
    expect(ManagerIdentitySystem.compute({ currentReputation: 10 }).reputationTier).toBe('iniciante');
  });

  test('dominant style from tactic history (rule 3)', () => {
    const m = ManagerIdentitySystem.compute({
      tacticHistory: [
        { tactic: 'attacking', gamesUsed: 60, winRate: 0.5 },
        { tactic: 'defensive', gamesUsed: 20, winRate: 0.4 },
        { tactic: 'normal', gamesUsed: 20, winRate: 0.45 }
      ], ...defaults
    });
    expect(m.dominantStyle).toBe('attacking');
    expect(m.styleConfidence).toBe(60);
  });

  test('balanced if no tactic > 40% (rule 3b)', () => {
    const m = ManagerIdentitySystem.compute({
      tacticHistory: [
        { tactic: 'attacking', gamesUsed: 35, winRate: 0.5 },
        { tactic: 'defensive', gamesUsed: 35, winRate: 0.4 },
        { tactic: 'normal', gamesUsed: 30, winRate: 0.45 }
      ], ...defaults
    });
    expect(m.dominantStyle).toBe('balanced');
  });

  test('title adds +10 reputation (rule 5)', () => {
    const before = 50;
    const m = ManagerIdentitySystem.applyEvent({ managerId: 1, event: 'national_title', currentReputation: before });
    expect(m.reputation).toBe(60);
  });

  test('relegation subtracts -8 reputation (rule 6)', () => {
    const m = ManagerIdentitySystem.applyEvent({ managerId: 1, event: 'relegation', currentReputation: 50 });
    expect(m.reputation).toBe(42);
  });

  test('rankings are unique (rule 7)', () => {
    const rankings = ManagerIdentitySystem.computeLeagueRankings(mockManagers);
    const rankValues = rankings.map(m => m.ranking);
    expect(new Set(rankValues).size).toBe(rankValues.length);
  });

  test('careerHighlight always non-empty (rule forbidden 4)', () => {
    const newManager = ManagerIdentitySystem.compute({ careerHistory: [], ...defaults });
    expect(newManager.careerHighlight).toBeTruthy();
  });
});
```

---

## Definition of Done
- [ ] `ManagerIdentitySystem.js` passa todos os 8 testes
- [ ] Schema de save atualizado com `managers` array
- [ ] ManagerProfileView renderiza corretamente para player-manager
- [ ] SPEC-107 Player Identity score > 85 no próximo playtest

## Definition of Stop
- Se reputação causar desequilíbrio (todo mundo lenda após 10 seasons): reduzir ganho por título para +7
