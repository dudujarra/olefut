# REFACTOR SPEC: AKITA-RFCT-013 — Camada 5 + Integration NarrativeService → MythService

## 1. Identidade

- **ID:** AKITA-RFCT-013
- **Fase:** 13 de 17 (PR-3.3)
- **Pré-requisitos:** AKITA-RFCT-012
- **Estimativa:** 4h

## 2. Motivação

NarrativeService chama `mythService.addLegend()` diretamente (chamada síncrona). Verificar madge zero ciclos.

## 3. PROIBIDO

- EventBus
- Async pub/sub

## 4. PERMITIDO

- NarrativeService import MythService (constructor injection)
- `narrativeService.canonize(save, playerId, mythSlot)` chama `mythService.addLegend()`

## 5. Test Harness

- [ ] madge --circular src/ → zero
- [ ] Integration test: canonize pipeline funcional
- [ ] Golden master idêntico (se canonize não dispara em save padrão, snapshot inalterado)

## 6. Definition of Done

- Camada 5 integrada
- Sem ciclos

## 7. Stop

Se ciclo aparecer, refatorar dependency direction (Myth NUNCA chama Narrative — apenas Narrative → Myth).

## 8. Rollback

git revert.
