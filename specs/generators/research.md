# SPEC Generator — Research

Use para specs de **pesquisa** (balanceamento, game design, dataset, descoberta).

Copia, salva como `specs/<categoria>/SPEC-XXX-research-nome.md`, preenche.

---

```markdown
# SPEC-XXX: [Pergunta de pesquisa]

**Tipo**: research
**Status**: 📝 draft | 🔍 investigating | ✔️ answered | 🚫 cancelled
**Owner**: Dudu
**Criada**: YYYY-MM-DD

---

## 1. Pergunta

> Qual é a pergunta exata? Uma frase, formato interrogativo.

Exemplo: "Qual janela de OVR por divisão produz pirâmide competitiva sem outliers em > 5 temporadas?"

## 2. Hipótese inicial

O que você acha que é a resposta antes de pesquisar.

## 3. Método

- Fonte de dados: ...
- Ferramenta: simulate_season.js / playtest / análise estática / paper
- Amostra: N temporadas / N partidas / N save files
- Métricas: ...

## 4. Critério de "respondida"

- [ ] Resposta numérica/binária com confidence interval
- [ ] Evidência reprodutível (script ou dump)
- [ ] Decisão downstream identificada (qual SPEC de código vai consumir)

## 5. Output esperado

- Arquivo: `docs/playtest/research-XXX-resultado.md` OU bloco no fim desta spec
- Formato: tabela / gráfico / conclusão em 3 bullets

## 6. Riscos

- Sample size suficiente?
- Bias por seed/config?
- A pergunta é a certa?

## 7. Resultado (preenche quando terminar)

> **Resposta**: ...
> **Confidence**: ...
> **SPEC de código gerada**: SPEC-YYY
> **Data**: YYYY-MM-DD
```
