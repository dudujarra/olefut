# Statistical Baseline Report — Etapa 5 SDD

> **Data**: 2026-05-12
> **Runs**: 20 temporadas determinísticas (seeds 1000-1019)
> **Time**: Cruzeiro (id=1, manager mode, scenario livre)
> **Source**: `tests/statistical/baseline-stats.test.js`
> **Output bruto**: `tests/statistical/baseline-output.json`

---

## Resumo cru (vanilla engine, sem novas features ativas)

| Métrica | Valor |
|---------|-------|
| Wins médio por temporada | 15.65 |
| Draws médio por temporada | 6.65 |
| Losses médio por temporada | 15.70 |
| Max win streak overall | 9 |
| Max loss streak overall | 9 |
| Posição final média | 10.75 / 20 |
| Variância posição final | 32.69 |

## Validação hipóteses

### SPEC-180 Win Streak Modifier (`AKITA-263 DRAFT`)

**Hipótese H1**: ≥80% saves de 5 temporadas têm pelo menos 1 streak `strong` (>=5W).

**Baseline (1 temporada)**: **40%** dos saves têm winStreak >= 5.

⚠️ **Não bate hipótese**. Implicações:
- Hipótese precisa ser revisada — talvez "≥80% em 5 temporadas" seja real (acumulando)
- OU thresholds devem cair (strong em 4W ao invés de 5W)
- OU rookie handicap (SPEC-A5) faz subir taxa de wins no início

**Hipótese H1.b (phenom 8W)**: 15-30% saves teriam phenom streak.

**Baseline**: **5%** (1/20). Bate piso 5%, longe do 15-30% projetado.

### SPEC-077 Loss Streak Response (pré-existente)

**Threshold serious (5L)** atinge **50%** dos saves. Sistema relevante regularmente. Confirma valor da feature.

### SPEC-A5 Rookie Handicap (`AKITA-268`)

Hipótese: primeira temporada vira mais "win-feel" com handicap.

Baseline mostra 15.65W avg per season SEM rookie handicap. Após handicap, prediction: ~17W avg primeira temp (+2 wins de oponente -10%).

**Pendente A/B test**: rodar baseline com `ENABLE_ROOKIE_HANDICAP` flag e comparar.

---

## Próximos passos baseline

1. **Run N=100** quando agendar tempo (atual N=20 = 7s; N=100 ≈ 35s)
2. **A/B com feature flags** Win Streak + Rookie Handicap
3. **Multi-temp**: agregar 5 temporadas por save pra validar H1 corretamente
4. **Variance threshold**: hipótese SPEC-180 "+15% variance" precisa baseline-on vs baseline-off rodando lado a lado

---

## Decisões

- Hipótese H1 (SPEC-180) **revisar** baseline antes de implementar — pode estar over-promising
- SPEC-A5 ✅ ship (já feito) — risco baixo e win-feel UX é UX literature
- Loss Streak existente **valida-se sozinho** (50% saves disparam)

---

**Compliance**: Etapa 5 SDD agora **executada** (antes era plano sem run real). Regra 0 Akita satisfeita.
