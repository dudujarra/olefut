# AKITA-RFCT-020 — AutoPlayService split (Bloco 1 final)

**Status**: draft
**Owner**: Claude Code (autonomous)
**Created**: 2026-05-12
**Bloco**: 1 (Fundação)

## Motivação

`src/services/AutoPlayService.js` está em **1280 LOC** mesmo após
extração prévia (AutoPlayLLMBridge, AutoPlayPersistence, AutoPlayPacing,
AutoPlaySimulator). DoD do Bloco 1 exige ≤400 LOC.

Razões de manter < 400:
- Mantém AutoPlayService como orquestrador puro
- Permite testar decisões em isolamento
- Reduz risco de god-class no caminho hot (soak tests rodam aqui)

## Escopo

Extrair de `AutoPlayService.js`:

1. **AutoPlayLogger.js** — `_save`, `_logSuccess`, `_logAnomaly`, `_logDecision`
   - ~50 LOC
   - Stateful (mantém arrays stats.successes/anomalies/decisions)
2. **AutoPlayBanditCoordinator.js** — `_banditContextKey`, `_buildStateCtx`, `_observeOutcome`
   - ~100 LOC
   - Stateless logic, stateful via passing engine + lastState/lastAction
3. **AutoPlayDecisions.js** — `_makeDecisions` (todo)
   - ~600 LOC
   - Stateful via engine + bandits + this._consecutive*

Reduções esperadas:
- AutoPlayService: 1280 → ~380 LOC
- 3 novos services criados
- 0 alteração de comportamento (puro mecânico)

## Não-escopo

- Não alterar lógica de decisão
- Não alterar persistência (já em AutoPlayPersistence)
- Não alterar LLM bridge (já em AutoPlayLLMBridge)

## Harness (Regra 0)

**Existente serve**:
- `tests/regression/BUG-026-029-autoplay.test.js` (10 tests)
- `tests/regression/BUG-040-043-cascade.test.js` (9 tests)
- Build budget gate (initial ≤500KB)

**Adicional**:
- `tests/unit/auto-play-service-split.test.js` (smoke: AutoPlayService.start → _tick → decisions chain)
- 1036 tests verde end-to-end

## DoD

- [ ] AutoPlayService.js ≤400 LOC
- [ ] 3 services novos: AutoPlayLogger, AutoPlayBanditCoordinator, AutoPlayDecisions
- [ ] 0 alteração comportamental (tests verdes)
- [ ] Lint 0 errors
- [ ] Build verde

## Sequência

1. AutoPlayLogger (mais simples) — extract + delegators
2. AutoPlayBanditCoordinator — extract + delegators
3. AutoPlayDecisions — extract + delegator único `makeDecisions(engine)`

PR único após DoD verde.
