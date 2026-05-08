# REFACTOR SPEC: AKITA-RFCT-001 — Characterization Tests / Golden Master

## 1. Identidade

- **ID:** AKITA-RFCT-001
- **Tipo:** refactor (test infrastructure, sem mudança de produção)
- **Escopo:** criar `tests/characterization/engine-golden.test.js` com seed determinístico + 5 temporadas snapshot
- **Fase:** 1 de 17 (PR-0.1)
- **PR pré-requisitos:** nenhum

## 2. Motivação

- **Code smell:** sem rede de segurança pra refactor god class
- **Métrica de partida:** 597 assertions sem golden master (cobertura comportamental incompleta)
- **Métrica alvo:** golden master snapshot capturando 5 temporadas (~190 weeks) determinísticas
- **Estimativa:** 5h

## 3. Comportamento — INVARIANTE

Não muda código de produção. Apenas adiciona testes.

## 4. Mudança Estrutural — PROIBIDO

- Modificar `src/engine/engine.js` ou qualquer arquivo de produção
- Mudar seeds RNG existentes
- Adicionar dependência nova além de vitest (snapshot já incluído)

## 5. Mudança Estrutural — PERMITIDO

- Criar `tests/characterization/engine-golden.test.js`
- Criar helper `createSeededRng(42)` se ainda não existe
- Criar fixture inicial `__fixtures__/save-baseline-v2.json`

## 6. Test Harness

- [ ] Test simula 5 temporadas com seed 42
- [ ] Snapshot captura: tabelas finais, top scorers, transferências, hall of fame, balance final
- [ ] Snapshot file `engine-golden.snap` commitado
- [ ] Roda em <10s
- [ ] Re-roda 3x → mesmo snapshot (determinismo verificado)
- [ ] 597 assertions ainda passam

## 7. Definition of Done

- engine-golden.test.js criado e passando
- Snapshot file existe e é determinístico
- README seção "Testing" menciona characterization tests
- CHANGELOG entrada `[refactor] AKITA-RFCT-001 golden master`

## 8. Definition of Stop

Se após 8h test ainda não for determinístico (snapshots variando), pausar e investigar fonte não-determinística (provavelmente Date.now() ou Math.random sem seed). Não merge se snapshot flaky.

## 9. Rollback Plan

- Estratégia: deletar arquivo `engine-golden.test.js` + `engine-golden.snap`
- Risco residual: zero (não toca produção)

## 10. Implementation Notes

```js
// tests/characterization/engine-golden.test.js
import { describe, test, expect } from 'vitest';
import { Engine } from '../../src/engine/engine.js';

function createSeededRng(seed) {
    let state = seed;
    return () => {
        state = (state * 9301 + 49297) % 233280;
        return state / 233280;
    };
}

describe('Engine Golden Master (5 seasons)', () => {
    test('deterministic 5-season simulation', () => {
        const rng = createSeededRng(42);
        const engine = new Engine();
        engine._seedRng = rng; // injeta seed (engine deve aceitar)
        engine.initGame('Dudu', 1, 'manager', 'normal', 'ATA');

        const snapshot = { seasons: [] };

        for (let season = 0; season < 5; season++) {
            for (let week = 0; week < 38; week++) {
                engine.advanceWeek();
            }
            snapshot.seasons.push({
                season: season + 1,
                standings: engine.getStandings('BRA', 1).map(s => ({
                    teamId: s.teamId, points: s.points, played: s.played
                })),
                topScorer: engine.getTopScorer?.() || null,
                userBalance: engine.getTeam(engine.manager.teamId)?.balance,
                hallOfFame: engine.legacy?.titles || []
            });
        }

        expect(snapshot).toMatchSnapshot();
    });
});
```
