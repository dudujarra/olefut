# REFACTOR SPEC: AKITA-RFCT-011 — NarrativeService Skeleton + Camadas 1-2

## 1. Identidade

- **ID:** AKITA-RFCT-011
- **Fase:** 11 de 17 (PR-3.1)
- **Pré-requisitos:** AKITA-RFCT-010
- **Estimativa:** 6h

## 2. Motivação

Terceiro service. Camadas Agente (1) + Eventual (2). **Chamadas diretas síncronas**, sem EventBus por padrão (princípio 5).

## 3. PROIBIDO

- EventBus / pub-sub
- Feature observável

## 4. PERMITIDO

- Criar `src/services/NarrativeService.js`:
  - `recordDecision(save, decisionType, payload)` — Camada 1
  - `appendEvent(save, eventType, ctx)` — Camada 2
  - `getDecayedEvents(save, now)` — Camada 2 read

## 5. Test Harness

- [ ] Unit tests com fixtures
- [ ] Engine inalterado neste PR (skeleton apenas)

## 6. Definition of Done

- Service skeleton + Camadas 1-2 reads/writes
- Unit tests passando

## 7. Stop

Anti-anemic. Se Camada 1 vira só array.push(), inline.

## 8. Rollback

Delete file.
