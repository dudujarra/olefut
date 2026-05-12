# SPEC Generator — Code

Use este template para specs de **código** (features, sistemas, refactors em código).

Copia o bloco abaixo, salva como `specs/<categoria>/SPEC-XXX-nome.md`, preenche.

---

```markdown
# SPEC-XXX: [Nome curto da feature]

**Categoria**: engine | gameplay | ui | infra | learning | refactor | telemetry
**Status**: 📝 draft | ✅ approved | 🔨 implementing | ✔️ done | 🚫 cancelled
**Owner**: Dudu
**Criada**: YYYY-MM-DD
**Última atualização**: YYYY-MM-DD
**SPEC linkadas**: SPEC-YYY (parent), SPEC-ZZZ (dependência)

---

## 1. Objetivo (1 frase)

> O que esta feature faz, em uma frase. Sem rodeio.

## 2. Motivação

Por que? Que dor resolve? Que comportamento atual está errado/faltando?

## 3. Input

O que entra:
- Estado inicial / dados / params / contexto / event trigger

## 4. Output

O que sai:
- Estado final / dados modificados / efeito observável

## 5. Comportamento (passo a passo)

1. ...
2. ...
3. ...

Casos especiais:
- Edge case A → ...
- Edge case B → ...

## 6. Validação (Regra 0 — harness)

**Arquivo**: `tests/specs/SPEC-XXX.test.js`

Asserts que provam a spec:

- [ ] Asserção 1 — input X → output Y
- [ ] Asserção 2 — edge case A não quebra
- [ ] Asserção 3 — invariante Z preservada

Comando: `npx vitest run tests/specs/SPEC-XXX.test.js`

## 7. Forbidden cases (o que NÃO pode acontecer)

- ❌ ...
- ❌ ...

## 8. Arquivos tocados

- `src/engine/...` — novo / modificado
- `src/components/...` — novo / modificado
- `tests/specs/SPEC-XXX.test.js` — novo

## 9. Riscos / débitos

- Performance: ...
- Compatibilidade: ...
- Refactor adiado: ...

## 10. Plano de rollout

1. Implementar contra spec.
2. Rodar harness — todos passes.
3. `npm run lint && npm test && npm run build` — 0 erros.
4. PR linkado a esta spec.
```
