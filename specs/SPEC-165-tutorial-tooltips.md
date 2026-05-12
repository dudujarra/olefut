# SPEC-165 — Tutorial Tooltips Pass (Bloco 2.5)

**Status**: Implementado
**Data**: 2026-05-12
**Branch**: `claude/b25-tutorial-tooltips`
**Tipo**: UI / A11y / Tutorial polish
**Bloco do roadmap**: Bloco 2.5 — Tutorial polish (sub-task de discoverability)
**Audit origem**: AKITA-233 (low discoverability em botões críticos)

---

## Contexto

A auditoria AKITA-233 identificou que ~10 botões críticos da UI não comunicam
seu efeito sem que o jogador clique. Falta de tooltip = jogador descobre custo
apenas depois de gastar dinheiro/tempo, ferindo o princípio de "informed choice"
do design do ELIFOOT (Mandamento Akita #3 — anti vibe).

Bloco 2.5 do `MASTER-ROADMAP-FOUNDATION-FIRST.md` exige uma rodada de polish
no tutorial / onboarding antes de qualquer feature nova. Tooltips contextuais
nos botões mais críticos é a sub-task mais barata e de maior ROI.

## Decisão

Usar o atributo HTML nativo `title="..."` (passado via prop `title` do
`EfButton`, que já o repassa para o `<button>` interno — ver
`src/components/ui/EfButton.jsx`).

**Por que `title` HTML nativo?**

1. **Zero dependência nova** — o navegador já implementa o tooltip on-hover.
2. **A11y básica** — screen readers como NVDA/JAWS leem `title` quando o
   `aria-label` está ausente; nenhum botão dos modificados tinha `aria-label`
   competindo.
3. **Zero impacto de bundle** — não cria nenhum JS adicional.
4. **Reversível** — caso uma iteração futura queira um componente de tooltip
   customizado (com `aria-describedby`, posicionamento controlado, suporte
   touch), basta substituir os `title="..."` por `<Tooltip>` (já existe em
   `src/components/Tooltip.jsx`).

## Escopo

### Arquivos modificados
- `src/components/DashboardView.jsx` — +10 tooltips
- `src/components/MarketView.jsx` — +6 tooltips
- `src/components/SquadView.jsx` — +3 tooltips, 1 melhorada
- `src/App.jsx` — verificado (já tinha os 4 do header)

### Botões cobertos (com justificativa)

| Botão | Arquivo | Por que crítico |
|-------|---------|----------------|
| `JOGAR PARTIDA` | DashboardView | Único botão que avança o tempo do jogo; jogadores novos não sabem que processa treino/finanças/lesões na mesma ação. |
| `UPGRADE` estádio | DashboardView | Consome caixa sem confirmação adicional; benefício (capacidade↑) não está visível ao clicar. |
| `UPGRADE` base | DashboardView | Idem: gasto vs. ganho (jovens produzidos) não está aparente no botão. |
| `Contratar` staff | DashboardView | Cada role tem salário semanal recorrente; tooltip mostra qual cargo está sendo contratado. |
| Treino (6 botões) | DashboardView | `t.description` está dentro do botão mas é truncável; tooltip também alerta "drena energia do plantel". |
| Preleção (6 botões) | DashboardView | Cada team-talk tem `moralBoost` e `energyCost` numéricos que não aparecem no rótulo; tooltip extrai e mostra. |
| `ACEITAR` oferta | DashboardView | Operação irreversível — tooltip explícita ajuda a evitar clique acidental. |
| `RECUSAR` oferta | DashboardView | Pode causar insatisfação do jogador; tooltip alerta. |
| `COMPRAR` | MarketView | Tooltip mostra valor e que gera salário recorrente (efeito hidden). |
| `VENDER` (sell list) | MarketView | Abre negociação em 3 rodadas — tooltip explica fluxo. |
| `ACEITAR` (negociação) | MarketView | Irreversível. |
| `PEDIR MAIS` | MarketView | Tooltip explica `+15%` e o limite de 3 tentativas. |
| Scout regions | MarketView | Custo está visível mas tooltip resume o fluxo (custo → lista). |
| `CONTRATAR` scouted | MarketView | Idem `COMPRAR` — debita do caixa, salário recorrente. |
| Titular toggle | SquadView | Reserva acumula desmotivação se não usado — efeito invisível sem tooltip. |
| Loan/Sell ícone | SquadView | Apenas ícone Phosphor; tooltip dá rótulo. |
| `PLANTEL REAL` | SquadView | Substitui plantel gerado pelo dataset pre-bake — efeito drástico que precisa de aviso. |

**Total**: 19 tooltips novos + 1 melhoria de tooltip existente = **20 botões cobertos**.

### Botões intencionalmente NÃO tooltipados

- `VOLTAR`, `SAIR`, `CANCELAR`: ação óbvia pelo rótulo.
- Filtros / sort selects: comportamento padrão de `<select>` é autoexplicativo.
- Tab switchers (`PLANTEL`/`ANÁLISE TÁTICA`/...): rótulo já descreve.

## Regras

1. Texto em PT-BR para consistência com o resto do jogo.
2. ≤ 100 chars por tooltip (legibilidade no hover nativo).
3. Foco em info que o usuário **não consegue** inferir do rótulo (custo,
   irreversibilidade, side-effects).
4. Sem alteração de estilo, layout ou comportamento dos botões.

## Harness / verificação (Regra 0)

```bash
cd /tmp/b25-tooltips
grep -c 'title=' src/components/DashboardView.jsx src/components/MarketView.jsx src/components/SquadView.jsx src/App.jsx
# Esperado: 11, 6, 4, 4 (total 25; +19 vs. baseline)

npm test -- --reporter=dot 2>&1 | tail -5
# Esperado: 1036 testes, 1032 passed + 4 skipped (sem mudança comportamental)

npm run lint 2>&1 | tail -3
# Esperado: 0 errors

npm run build 2>&1 | tail -3
# Esperado: build verde, sem regressão de bundle
```

Resultado em 2026-05-12 (commit pré-merge):
- `grep -c title=`: 4 + 11 + 6 + 4 = **25** ✅
- Tests: **1032/1036** ✅ (mesmo baseline; nenhum teste novo necessário pois
  nenhum comportamento mudou — apenas atributos HTML adicionados).
- Lint: **0 erros**, 120 warnings cosméticos (pré-existentes) ✅
- Build: **✓ in 1.40s**, bundle inalterado (375KB initial) ✅

## A11y note (futuro)

O atributo `title` HTML tem limitações conhecidas:
- Não aparece em touch (mobile sem hover).
- Aparece com delay fixo (~1.5s) controlado pelo navegador.
- Não é completamente acessível em todos os screen readers (alguns o ignoram
  quando há texto visível no botão).

Iteração futura (SPEC-166+) pode criar um componente `<EfTooltip>` com:
- `aria-describedby` para acessibilidade plena
- Trigger por hover **e** focus (teclado)
- Suporte a touch (long-press)
- Posicionamento controlado (top / bottom / side)
- Persistência em `localStorage` para "não mostrar de novo"

Por ora, o `title` HTML é o piso aceitável — entrega o valor de
discoverability sem complexidade.

## Out of scope

- Tooltips em todos os botões do app (apenas os críticos foram cobertos).
- Componente customizado de tooltip (deixado para SPEC futura).
- Tradução para outros idiomas (PT-BR único suportado hoje).
- Tooltips em `PlayerDashboardView`, `PressView`, `MatchView` (próxima iteração
  se a heatmap de uso indicar discoverability ruim).
