# SPEC-135: Critical Path Unlock — Views Desbloqueáveis via Progressão

**Fase:** 0 — Gameplay Fix  
**Prioridade:** ALTA  
**Telemetria:** SPEC-104 score=25, DEAD_VIEW 12/16 views nunca acessadas, COVERAGE_LOW 4/16  
**AKITA:** a definir no PR

---

## O que é

Sistema de desbloqueio progressivo de views que atualmente estão mortas (nunca acessadas). Em vez de todas estarem disponíveis desde o início sem incentivo, views estratégicas são desbloqueadas conforme progresso do jogador. Isso transforma dead content em milestones de progressão.

**Views atuais nunca visitadas (12):**
`start, autoplay, matchView, [+ 9 não identificadas]`

**Estratégia:**
- Views de núcleo (dashboard, squad, market, standings, press): sempre abertas
- Views avançadas: desbloqueiam via achievements

---

## Input

```typescript
{
  saveState: {
    seasonsCompleted: number,
    titlesWon: number,
    squadAvgOvr: number,
    totalTransfers: number,
    managerReputation: number  // 0-100 (SPEC-070)
  },
  viewId: string
}
```

---

## Output esperado

```typescript
{
  unlocked: boolean,
  reason?: string,           // por que está desbloqueado
  unlockCondition?: {        // se não desbloqueado, como desbloquear
    description: string,
    progress: number,        // 0-100 (percentual de completion)
    requirement: string
  }
}
```

**Mapa de desbloqueio:**

| View | Condição | Narrativa |
|------|----------|-----------|
| `academy` | seasonsCompleted ≥ 2 | "Seu trabalho chamou atenção da base" |
| `analytics` | titlesWon ≥ 1 | "Vitória abre portas para análise profissional" |
| `trophy_room` | titlesWon ≥ 1 | "Primeiro título merece sala de troféus" |
| `scouting` | totalTransfers ≥ 10 | "Experiência no mercado libera rede de scouts" |
| `media_center` | seasonsCompleted ≥ 3 | "Imprensa começa a te seguir de perto" |
| `rivals` | seasonsCompleted ≥ 1 | "Primeiro rival emerge após temporada completa" |
| `board_room` | managerReputation ≥ 40 | "Reputação suficiente para reuniões com diretoria" |
| `youth_watch` | academy desbloqueada | "Base ativa permite monitorar promessas" |

---

## Regras de validação

- [ ] Views de núcleo (dashboard, squad, market, standings, press) sempre acessíveis
- [ ] `academy` bloqueada até `seasonsCompleted < 2`
- [ ] `trophy_room` bloqueada até `titlesWon < 1`
- [ ] View bloqueada: retorna `unlocked=false` + `unlockCondition` preenchida
- [ ] View desbloqueada: retorna `unlocked=true` + `reason` preenchida
- [ ] `progress` em `unlockCondition` é 0-100 (percentual real, não hardcoded)
- [ ] Desbloqueio é permanente (não reverte se condição piora)
- [ ] Critical Path coverage ≥ 10/16 após jogador completar 3 seasons

---

## Forbidden

- [ ] View de núcleo bloqueada por qualquer razão
- [ ] `progress` acima de 100 ou abaixo de 0
- [ ] Desbloqueio temporário (reversível)
- [ ] Condição de desbloqueio vazia (usuário sem guia)
- [ ] `trophy_room` acessível sem nenhum título

---

## Implementação

**Arquivo:** `src/engine/ViewUnlockSystem.js` (novo)  
**Integração:** router ou nav component consulta `ViewUnlockSystem.canAccess(viewId, saveState)` antes de renderizar  
**UI:** Views bloqueadas mostram lock icon + hint da condição

---

## Testes esperados

```javascript
describe('SPEC-135: Critical Path Unlock', () => {
  test('core views always accessible (rule 1)', () => {
    const emptyState = { seasonsCompleted: 0, titlesWon: 0, squadAvgOvr: 50, totalTransfers: 0, managerReputation: 0 };
    ['dashboard', 'squad', 'market', 'standings', 'press'].forEach(view => {
      expect(ViewUnlockSystem.canAccess(view, emptyState).unlocked).toBe(true);
    });
  });

  test('academy locked until season 2 (rule 2)', () => {
    const s1 = ViewUnlockSystem.canAccess('academy', { seasonsCompleted: 1, ...defaults });
    expect(s1.unlocked).toBe(false);
    expect(s1.unlockCondition).toBeDefined();

    const s2 = ViewUnlockSystem.canAccess('academy', { seasonsCompleted: 2, ...defaults });
    expect(s2.unlocked).toBe(true);
  });

  test('trophy_room locked until first title (rule 3)', () => {
    expect(ViewUnlockSystem.canAccess('trophy_room', { titlesWon: 0, ...defaults }).unlocked).toBe(false);
    expect(ViewUnlockSystem.canAccess('trophy_room', { titlesWon: 1, ...defaults }).unlocked).toBe(true);
  });

  test('blocked view returns unlockCondition with progress (rule 5)', () => {
    const result = ViewUnlockSystem.canAccess('analytics', { titlesWon: 0, ...defaults });
    expect(result.unlocked).toBe(false);
    expect(result.unlockCondition.progress).toBeGreaterThanOrEqual(0);
    expect(result.unlockCondition.progress).toBeLessThanOrEqual(100);
    expect(result.unlockCondition.description).toBeTruthy();
  });

  test('progress is 50% halfway to condition (rule 6)', () => {
    // analytics needs titlesWon ≥ 1 (binary, so 0% before, 100% after)
    // scouting needs totalTransfers ≥ 10
    const halfway = ViewUnlockSystem.canAccess('scouting', { totalTransfers: 5, ...defaults });
    expect(halfway.unlockCondition.progress).toBe(50);
  });

  test('unlock is permanent (rule 7)', () => {
    const state = { seasonsCompleted: 3, titlesWon: 1, ...defaults };
    ViewUnlockSystem.unlock('academy', state);
    // Degradar state
    const degraded = { ...state, seasonsCompleted: 0 };
    expect(ViewUnlockSystem.canAccess('academy', degraded).unlocked).toBe(true);
  });

  test('coverage ≥ 10/16 after 3 seasons (rule 8)', () => {
    const state = { seasonsCompleted: 3, titlesWon: 1, totalTransfers: 12, managerReputation: 45, squadAvgOvr: 65 };
    const allViews = ['dashboard', 'squad', 'market', 'standings', 'press', 'academy', 'analytics', 'trophy_room', 'scouting', 'media_center', 'rivals', 'board_room', 'youth_watch', 'start', 'autoplay', 'matchView'];
    const unlocked = allViews.filter(v => ViewUnlockSystem.canAccess(v, state).unlocked);
    expect(unlocked.length).toBeGreaterThanOrEqual(10);
  });

  test('forbidden: trophy_room accessible with 0 titles', () => {
    expect(ViewUnlockSystem.canAccess('trophy_room', { titlesWon: 0, ...defaults }).unlocked).toBe(false);
  });
});
```

---

## Definition of Done
- [ ] `ViewUnlockSystem.js` passa todos os 8 testes
- [ ] SPEC-104 Critical Path score > 60 no próximo playtest
- [ ] Views bloqueadas mostram lock icon + hint visível na UI
- [ ] Coverage ≥ 10/16 em save com 3 seasons

## Definition of Stop
- Se jogador reclamar de conteúdo bloqueado demais: reduzir requisitos de scouting e media_center
