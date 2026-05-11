# SPEC-157: BUG-080 — deep-soak-100seasons flaky em suite-load

**Categoria**: infra
**Status**: 📝 draft (planejado, não implementado nesta PR)
**Owner**: Dudu
**Criada**: 2026-05-11

---

## 1. Pergunta / objetivo

`tests/integration/deep-soak-100seasons.test.js` precisa rodar de forma estável (sempre verde) em CI sem depender de mitigações de timeout extremas.

## 2. Sintoma

Solo: passa em ~6s.
Em suite-load: `beforeAll` excede timeout (originalmente 30s, main bumped pra 600s + `localStorage.clear()` inline).

Causa raiz **parcial** identificada: localStorage pollution entre arquivos. AKITA-204 (SPEC-155) resolve com `setupFile` global, mas teste continua lento em parallel-suite.

Causa raiz **secundária** suspeita: 100 seasons × 38 weeks × engine work (player gen, market, brain Q-updates) = não-linear em memory pressure.

## 3. Proposta

Mover deep-soak para **suite separada `npm run test:soak`** que roda solo, fora do `npm test` default.

**Comandos**:
```bash
npm run test:soak       # roda apenas tests/integration/deep-soak-*.test.js solo
npm run test            # exclui deep-soak (rápido pra dev loop)
npm run test:ci         # roda tudo (sequencial via fileParallelism=false)
```

**Mudança em `vite.config.js`**:
```js
// novo: test.exclude inclui deep-soak por default
// nova entry em package.json: "test:soak": "vitest run tests/integration/deep-soak-*"
```

## 4. Critério de "respondida"

- [ ] `npm test` ≤ 60s, 100% verde
- [ ] `npm run test:soak` ≤ 6min, 100% verde
- [ ] `npm run test:ci` chama ambos sequencial
- [ ] CI workflow atualizado pra rodar `test:ci`

## 5. BUG ticket associado

**BUG-080** (a abrir como GitHub Issue formal — Mandamento #6).

Title: `BUG-080: deep-soak-100seasons flaky em suite-load, bloqueia CI`
Labels: `bug`, `test-infra`
Repro: rodar `npm test` em CI, ver suite skipped/failed intermittently.

## 6. Forbidden

- ❌ Bump timeout além de 600s (já no limite do razoável)
- ❌ Skip do teste em CI (perde cobertura ML convergence)
- ❌ Reduzir `SEASONS = 100` (descaracteriza o teste — é deep-soak por design)

## 7. Resultado (preenche ao implementar)

> **Status**: aberto
> **PR**: pendente
> **Data**: —
