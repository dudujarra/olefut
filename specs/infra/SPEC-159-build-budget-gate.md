# SPEC-159: Build budget CI gate (initial chunk ≤ 500KB)

**Categoria**: infra
**Status**: ✅ implementado 2026-05-12
**Owner**: Dudu
**Criada**: 2026-05-12
**Deriva de**: SPEC-153 (code-split de rotas)

---

## 1. Pergunta / objetivo

SPEC-153 reduziu initial chunk de 1.56MB → 376KB via `React.lazy()`. Sem gate de CI, regressão silenciosa pode voltar a bundle inchado (ex: import eager acidental de view pesada).

Gate automático rejeita PR que excede budget.

## 2. Budget acordado

| Chunk | Limite | Racional |
|-------|--------|----------|
| `index-*.js` (entry) | **≤ 500KB** | first paint — usuário paga sempre |
| Qualquer chunk individual | **≤ 800KB** | shared chunks (player DB, Tone.js) podem ser maiores |
| `dist/assets/*.js` total | **≤ 3MB** | sanity check global |

Gzip não é o gate — bruto é o que pesa em parse-time/memory.

## 3. Método

`tests/integration/build-budget.test.js`:

1. `npm run build` (assume já rodou — CI roda antes via `test:ci`)
2. Lê `dist/assets/*.js`
3. Asserts:
   - Há um arquivo matching `index-*.js`
   - Tamanho dele ≤ 500_000 bytes
   - Nenhum arquivo individual > 800_000 bytes
   - Soma total ≤ 3_000_000 bytes
4. Falha com mensagem clara: qual chunk + tamanho atual + limite.

## 4. Critério de "respondida"

- [x] Teste roda em CI via `test:ci`
- [x] Falha se initial chunk > 500KB
- [x] Output diz qual chunk e por quanto excedeu
- [x] Doc explicando como diagnosticar / ajustar quando legítimo

## 5. Como passar quando budget legítimo aumenta

1. Investigar via `npm run build` — qual chunk cresceu?
2. Se nova feature legítima → atualizar limite nesta SPEC + no teste
3. Se regressão acidental → corrigir imports

**Forbidden**: silenciar o teste sem atualizar SPEC.

## 6. Resultado

> **Status**: ✅ implementado
> **PR**: AKITA-207
> **Data**: 2026-05-12

**Snapshot atual**:

| Chunk | Tamanho |
|-------|---------|
| index-*.js (entry) | 376 KB ✅ |
| Tone-*.js | 345 KB ✅ |
| EfButton-*.js (shared DB chunk) | 652 KB ⚠️ (dentro do ceiling de 800KB) |
| Total dist/assets/*.js | ~1.9 MB ✅ |

EfButton chunk inclui player DB (170 clubes × ~30 jogadores). Tracked como follow-up (SPEC-160 candidato — code-split do DB).
