# REFACTOR SPEC: AKITA-RFCT-XXX

## 1. Identidade

- **ID:** AKITA-RFCT-XXX
- **Tipo:** refactor (sem mudança comportamental observável)
- **Escopo:** [descrição do que move]
- **Fase no plano macro:** [X de Y]
- **PR pré-requisitos:** [lista]

## 2. Motivação

- **Code smell endereçado:** [god class | feature envy | shotgun surgery]
- **Métrica de partida:** [LOC, métodos públicos, cyclomatic complexity]
- **Métrica alvo após o PR:** [delta esperado]

## 3. Comportamento — INVARIANTE

Os 597 assertions existentes DEVEM continuar verdes sem alteração.
O snapshot golden-master `engine-golden.snap` DEVE ser idêntico antes e depois.
O save baseline `__fixtures__/save-baseline-v2.json` DEVE round-trip serializar identicamente.
Stryker mutation score DEVE ser ≥ baseline.

## 4. Mudança Estrutural — PROIBIDO

- Adicionar feature nova
- Mudar API pública sem deprecation path
- Mudar formato de save sem bump de SAVE_VERSION
- Mudar seeds de RNG ou ordem de chamadas RNG
- Refatorar paralelamente em outro arquivo (1 PR = 1 escopo)

## 5. Mudança Estrutural — PERMITIDO

- Mover método entre arquivos
- Renomear método interno (não-público)
- Extrair classe/função
- Substituir delegate por chamada direta (depois que ninguém usa)

## 6. Test Harness — Evidência de Preservação

- [ ] Characterization tests (golden master) passam
- [ ] Save round-trip test passa
- [ ] Prototype restoration tests passam (se classes envolvidas)
- [ ] 597 assertions passam: `npm test`
- [ ] Stryker mutation score reportado: `<X%>` (vs baseline `<Y%>`)
- [ ] `madge --circular src/` retorna zero ciclos

## 7. Definition of Done

- Todos os checks da seção 6
- Code review próprio com 24h de espera antes de merge
- CHANGELOG.md atualizado com entrada `[refactor]`
- Próximo PR identificado ou explícito "stop here"

## 8. Definition of Stop

Critério explícito de "se isso aqui não funcionar, eu reverto":

- [Específico do PR — ex: "se mutation score cair, reverter"]

## 9. Rollback Plan

- **Estratégia:** revert do PR (atômico)
- **Risco residual:** [descrição]
