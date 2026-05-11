# SPEC Generator — Decision (ADR)

Use para registrar **decisão arquitetural** (escolha de stack, padrão, tradeoff).
Análogo a ADR (Architecture Decision Record).

Copia, salva como `specs/<categoria>/SPEC-XXX-decision-nome.md`, preenche.

---

```markdown
# SPEC-XXX: [Decisão]

**Tipo**: decision
**Status**: 📝 draft | ✅ accepted | 🔄 superseded | 🚫 rejected
**Owner**: Dudu
**Decidida em**: YYYY-MM-DD
**Supersedes**: SPEC-YYY (se aplica)
**Superseded by**: SPEC-ZZZ (se aplica)

---

## 1. Contexto

O que motivou a decisão? Que problema/escolha apareceu?

## 2. Opções consideradas

| # | Opção | Pro | Contra |
|---|-------|-----|--------|
| A | ... | ... | ... |
| B | ... | ... | ... |
| C | ... | ... | ... |

## 3. Decisão

**Opção escolhida**: X

Por quê: ...

## 4. Consequências

**Positivas**:
- ...

**Negativas / tradeoffs aceitos**:
- ...

**Trabalho derivado**:
- SPEC-AAA — implementação
- SPEC-BBB — migração

## 5. Validação (Regra 0)

Como saberemos que a decisão foi certa? Métrica ou observação:

- [ ] Métrica X melhora em N% até DATA
- [ ] Comportamento Y observável em produção
- [ ] Sem regressão Z em N semanas

## 6. Quando reabrir

Condições que tornariam essa decisão obsoleta:
- ...
- ...

## 7. Referências

- Link interno: ...
- Link externo: ...
- Discussão: PR #N / issue #N
```
