# REFACTOR SPEC: AKITA-RFCT-019 — Engine Real Shrink (Skeleton ≠ Logic Move)

## 1. Identidade

- **ID:** AKITA-RFCT-019
- **Tipo:** refactor (engine god-class real shrink)
- **Escopo:** mover lógica de `engine.js` (1525 LOC, 47 métodos) para services apropriados. **Skeleton already exists** (RFCT-005..016 done) — este SPEC trata da extração real.
- **Fase:** 19 (extra, fora da sequência original)
- **Pré-requisitos:** AKITA-RFCT-001/002/003 (characterization + save baseline + stryker baseline) ✅
- **Bloqueia:** Bloco 2 (Integração) do MASTER-ROADMAP-FOUNDATION-FIRST

## 2. Problema

**Descoberta pós-AKITA-216**: 17 services criados, engine.js instancia todos (`this._mythService`, `this._relationshipService`, etc.), tests pareados existem. **Mas `engine.js` continua 1525 LOC.**

Significa que:
- Skeleton dos services existe (RFCT-005..016 done)
- Engine.js mantém **a mesma lógica original** + agora também referencia services
- Possível duplicação invisível: lógica em ambos lugares
- Ou: services são vazios e engine ainda faz tudo
- **Refactor incompleto, apesar de specs marcadas done**

## 3. Audit dos 47 métodos engine.js (2026-05-12)

### Grupo A — Match/Tournament (manter como orchestrator) — ~50 LOC alvo

| Método | LOC aprox | Ação |
|--------|-----------|------|
| `constructor` | ~80 | manter (init dos services) |
| `initGame` | ~50 | manter |
| `advanceWeek` | **160** | **shrink agressivo — Phase 1** |
| `playMatch` | 4 | manter (delegator) |
| `previewPlayerMatch` | ? | manter (delegator) |
| `getMatchContext` | ? | manter |
| `getTeam` | ~10 | manter (state getter) |
| `getStandings` | ? | manter (delegator a Tournament) |
| `getTournament` | ? | manter |
| `getTeamSectors` | ~15 | considerar mover para MatchSimulator |
| `getViewAccess` | ? | manter |
| `updateViewUnlockStats` | ? | manter |
| `getPacingEvents` | ? | considerar mover para AutoPlayPacing |
| `getManagerIdentity` | ? | considerar mover para CareerService |
| `startNewSeason` | ? | mover para SeasonProcessor (já existe) |

### Grupo B — Player Movement → TransferService/MarketService (novo) — ~150 LOC out

| Método | Target service |
|--------|----------------|
| `acceptTransferOffer` | TransferService |
| `rejectTransferOffer` | TransferService |
| `makeBuyOffer` | TransferService |
| `npcMakeBuyOffer` | TransferService |
| `sellPlayer` | TransferService |
| `generateMarket` | MarketService |
| `signScoutedPlayer` | ScoutingService (ver Grupo C) |

### Grupo C — Scouting → ScoutingService (novo) — ~80 LOC out

| Método | Target |
|--------|--------|
| `doScouting` | ScoutingService |
| `scoutLeague` | ScoutingService |
| `scoutRegionAction` | ScoutingService |
| `signScoutedPlayer` | ScoutingService |

### Grupo D — Loans → LoanService (novo) — ~60 LOC out

| Método | Target |
|--------|--------|
| `takeLoan` | LoanService |
| `payOffLoan` | LoanService |
| `processLoanPayment` | LoanService |
| `loanPlayer` | LoanService |
| `getLoanOptions` | LoanService |

### Grupo E — Facility → FacilityService (novo) — ~50 LOC out

| Método | Target |
|--------|--------|
| `upgradeAcademy` | FacilityService |
| `upgradeStadium` | FacilityService |
| `triggerYouthIntake` | FacilityService (delegate to YouthAcademy module) |

### Grupo F — Manager Actions → existing ManagerSystems module — ~100 LOC out

| Método | Target |
|--------|--------|
| `doTraining` | ManagerSystems module + small wrapper |
| `doTeamTalk` | ManagerSystems module + small wrapper |
| `hireStaff` | StaffService (criar se não existir) |
| `fireStaff` | StaffService |
| `setFormation` | FormationService (novo) |
| `setTactic` | FormationService |
| `saveFormationLayout` | FormationService |
| `applyLiveSubstitution` | FormationService |

### Grupo G — Press → PressService (existe? verificar) — ~40 LOC out

| Método | Target |
|--------|--------|
| `checkPressConference` | PressService |
| `answerPress` | PressService |

### Grupo H — Contracts → ContractService (existe? verificar) — ~50 LOC out

| Método | Target |
|--------|--------|
| `renewContract` | ContractService |
| `getRenewalOffer` | ContractService |
| `respondCoachProposal` | CareerService (ou Board) |

### Grupo I — Misc (analisar) — ~30 LOC

| Método | Target |
|--------|--------|
| `registerPlayerGoal` | mover para PlayerCareer module |

## 4. Sub-PRs sequenciais (cada um atômico, com harness)

| Sub-PR | Escopo | LOC out estimado | Harness |
|--------|--------|------------------|---------|
| RFCT-019.1 | advanceWeek shrink (NPC block + AI Director) → extract para WeekProcessor expandido | -80 | golden master idêntico |
| RFCT-019.2 | Grupo B (Transfer/Market) → TransferService novo | -150 | unit tests por método |
| RFCT-019.3 | Grupo C (Scouting) → ScoutingService novo | -80 | tests por scouting flow |
| RFCT-019.4 | Grupo D (Loans) → LoanService novo | -60 | tests por loan op |
| RFCT-019.5 | Grupo E (Facility) → FacilityService novo | -50 | tests upgrades |
| RFCT-019.6 | Grupo F (Manager) → ManagerSystems wrappers + FormationService | -100 | tests por ação |
| RFCT-019.7 | Grupo G + H (Press + Contracts) | -90 | tests |
| RFCT-019.8 | Grupo I (Misc) + cleanup final + verificar ≤400 | -30 | golden master + LOC gate |

**Total estimado**: -640 LOC out → engine.js de 1525 para ~885. Mais um pass de inline cleanup pra chegar em ≤400.

## 5. Comportamento — INVARIANTE

Cada sub-PR deve manter:
- 1036+ tests passing
- `npm run build` verde
- Golden master snapshot idêntico (`tests/characterization/engine-golden.test.js`)
- Save round-trip preservado (`tests/characterization/save-roundtrip.test.js`)
- `npm run test:soak` 18/18

## 6. PROIBIDO

- Adicionar feature nova durante refactor
- Quebrar API pública da engine (callers não sabem que serviço chamou)
- Acoplar React/UI em qualquer service
- Apply sem rodar gates locais

## 7. PERMITIDO

- Criar services novos em `src/services/`
- Mover lógica + adicionar wrapper na engine (`this._service.method()`)
- Renomear métodos privados se ficar mais claro
- Extrair helpers para `src/engine/helpers/`

## 8. Definition of Done (master spec)

- `engine.js` ≤ 400 LOC
- Cada Grupo A-I tem service correspondente com lógica real (não vazia)
- 1036+ tests verdes em cada sub-PR
- Golden master preservado entre todos sub-PRs
- Documentação atualizada (`docs/SDD_OléFUT_RPG.md` + master roadmap PROGRESSO)

## 9. Definition of Stop

- Golden master quebra em qualquer sub-PR → revert + investigar
- Tests caem >5 → revert + investigar
- engine.js cresce em vez de encolher → revert (sinal de regressão)
- 4 sub-PRs sem progresso visível → revisar audit

## 10. Rollback Plan

Cada sub-PR é atômico. Revert individual seguro.

## 11. Coordenação paralela (Antigravity + Claude Code)

- **Antigravity**: continua RFCT-018 phase 4 (AutoPlayService 1280 → ≤400)
- **Claude Code (eu)**: ataca RFCT-019 sub-PRs sequencial
- **Sem overlap**: AutoPlayService vs engine.js são arquivos distintos
- **Sync**: cada PR atualiza seção PROGRESSO do MASTER-ROADMAP-FOUNDATION-FIRST.md

## 12. Resultado (preenche ao implementar)

> **Status**: aberto
> **PRs**: pendentes
> **Engine LOC inicial**: 1525
> **Engine LOC alvo**: ≤ 400
> **Data início**: 2026-05-12
