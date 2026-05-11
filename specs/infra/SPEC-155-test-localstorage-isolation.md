# SPEC-155: Test localStorage isolation via setupFile

**Categoria**: infra
**Status**: ✔️ done (retroativa — shipped via AKITA-204)
**Owner**: Dudu
**Criada**: 2026-05-11
**SPEC linkadas**: nenhuma

---

## 1. Objetivo

Garantir que cada arquivo de teste roda com `localStorage` limpo, eliminando flakies order-dependent.

## 2. Motivação (root cause de flakies pré-existentes)

Vitest config tem `execArgv: ['--localstorage-file=./.vitest-localstorage']` para suprimir warning Node 22. Side effect: arquivo PERSISTE state entre runs e entre arquivos no mesmo worker.

Testes order-dependent observados:
- `tests/integration/autoplay-full-audit.test.js` — falhava se rodado depois de outro teste que escrevia em STORAGE_KEY
- `tests/integration/marl-e2e.test.js` — idem
- `tests/integration/deep-soak-100seasons.test.js` — main mitigou com `fileParallelism: false` + 600s timeout
- `tests/specs/SPEC-009-youth-academy.test.js`, `SPEC-025-aging.test.js`, `SPEC-134-growth-event-system.test.js` — pin seed mas state ainda vazava

Main escolheu mitigação per-test (`localStorage.clear()` inline). Este SPEC propõe solução global: setupFile beforeAll.

## 3. Input

- `vite.config.js` aceita `test.setupFiles: string[]`
- Vitest carrega setupFiles antes de cada arquivo de teste

## 4. Output

- `tests/_setup-isolate-localstorage.js` registra `beforeAll(() => localStorage.clear())`
- Cada arquivo de teste começa com localStorage vazio
- Combinado com `fileParallelism: false` de main: isolamento total (sequencial + clean state)

## 5. Comportamento

```js
// tests/_setup-isolate-localstorage.js
import { beforeAll } from 'vitest';

beforeAll(() => {
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
        localStorage.clear();
    }
});
```

```js
// vite.config.js
test: {
    // ...
    setupFiles: ['./tests/_setup-isolate-localstorage.js'],
}
```

## 6. Validação

- [x] Suite roda 1049/1049 verde com fileParallelism=false
- [x] Suite roda 2× consecutivas mesmo resultado (não-flaky)
- [x] Testes que escrevem em localStorage durante execução não afetam próximo arquivo

## 7. Forbidden cases

- ❌ Setup file usar `beforeEach` (limparia state dentro do mesmo describe, quebrando SPEC-122 memory persists test)
- ❌ Deletar arquivos `.vitest-localstorage*` no setupFile (race conditions com workers)
- ❌ Setup file fazer mais que clear localStorage (escopo único)

## 8. Arquivos tocados

- `tests/_setup-isolate-localstorage.js` — novo
- `vite.config.js` — `setupFiles` adicionado
- `.gitignore` — `.vitest-localstorage*` ignorados (runtime cache)

## 9. Decisão de arquitetura

**Alternativas consideradas**:
1. **setupFile beforeAll global** — **escolhido**
2. `beforeEach(localStorage.clear)` por teste — repetitivo, error-prone
3. Remover `--localstorage-file` flag — quebra clear()/getItem API em alguns ambientes Node
4. In-memory localStorage mock no setupFile — over-engineered; default jsdom adequado

**Por quê 1**: granularidade certa (cada arquivo isolado, dentro do arquivo state permitido pra testes que querem persistência tipo SPEC-122). Solução main (`localStorage.clear()` inline em deep-soak) é complementar, não conflita.

## 10. Riscos / débitos

- Tests que dependem de state entre ARQUIVOS quebram (nenhum encontrado).
- Não substitui per-test cleanup quando teste explicitamente quer state limpo entre `it()` blocks (testes mantêm sua própria `beforeEach`).
