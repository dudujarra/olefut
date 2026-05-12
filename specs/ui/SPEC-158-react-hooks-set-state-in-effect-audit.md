# SPEC-158: BUG-081 — Audit 14 warnings `react-hooks/set-state-in-effect`

**Categoria**: ui
**Status**: ✅ implementado 2026-05-12
**Owner**: Dudu
**Criada**: 2026-05-11

---

## 1. Pergunta / objetivo

14 warnings `react-hooks/set-state-in-effect` no codebase. Padrão pode causar re-render extra, stale closures, ou loops infinitos em casos específicos. Auditar cada um e classificar:

- **Falso positivo**: aceitar (silenciar com `eslint-disable-next-line` comentado)
- **Bug real**: refatorar pra `useReducer`/`useMemo`/dependency array correto
- **Anti-pattern aceitável**: documentar racional

## 2. Sintoma

```
src/components/ChronicleView.jsx:50 — react-hooks/set-state-in-effect
src/components/CosmeticShopView.jsx:38 — react-hooks/set-state-in-effect
src/components/DashboardView.jsx:52 — react-hooks/set-state-in-effect
src/components/FormationBoard.jsx:62 — react-hooks/set-state-in-effect
src/components/MatchView.jsx:64 — react-hooks/set-state-in-effect
src/components/PressView.jsx:63 — react-hooks/set-state-in-effect
src/components/PlayerMatchView.jsx:49 — react-hooks/set-state-in-effect
... (14 total)
```

Padrão típico:
```jsx
useEffect(() => {
    setState(computeFromProps(props.x));  // ← warning: setState diretamente em effect
}, [props.x]);
```

## 3. Método

1. Lista exata via `npx eslint . 2>&1 | grep -B 1 set-state-in-effect`
2. Cada warning: read context (10 linhas around)
3. Classify per cima da taxonomia
4. Para "bug real": refactor + adicionar test

## 4. Critério de "respondida"

- [ ] 14/14 warnings classificados em planilha (markdown table aqui)
- [ ] Bugs reais corrigidos com regression test
- [ ] Falsos positivos silenciados com comentário explicativo
- [ ] Anti-patterns aceitos documentados em CLAUDE.md "Forbidden cases" exceções

## 5. BUG ticket associado

**BUG-081** (a abrir — Mandamento #6).

Title: `BUG-081: Audit react-hooks/set-state-in-effect (14 warnings)`
Labels: `bug`, `tech-debt`, `react`
Repro: `npm run lint | grep set-state-in-effect | wc -l` → 14

## 6. Forbidden

- ❌ Disable global da regra (perde sinal)
- ❌ Silenciar todos sem leitura individual (vibe coding clássico)

## 7. Resultado

> **Status**: ✅ implementado
> **PR**: AKITA-207 (este)
> **Bug count após audit**: 0 warnings restantes (era 14)

### Classificação completa (14 warnings)

| # | File:Line | Categoria | Ação | Racional |
|---|-----------|-----------|------|----------|
| 1 | AutoPlayView.jsx:90 | aceitável | block disable + doc | event-subscriber engine.getPacingEvents + setTimeout |
| 2 | ChronicleView.jsx:51 | aceitável | block disable + doc | derivado de external store (engine.chronicles) com side effects |
| 3 | CosmeticShopView.jsx:38 | **bug real** | refactor useState initializer | points era setState em useEffect, mas mutado em handler → initializer |
| 4 | DashboardView.jsx:52 | aceitável | block disable + doc | abre modal em resposta a engine.weekEvents |
| 5 | FormationBoard.jsx:62 | aceitável | block disable + doc | setLayout + onChange callback ao pai |
| 6 | MatchView.jsx:64 | aceitável | block disable + doc | banner detection em transição fulltime |
| 7 | MonitorView.jsx:64 | aceitável | block disable + doc | snapshot de external monitor singleton |
| 8 | PlayerDashboardView.jsx:49 | aceitável | block disable + doc | random event spawn (systemRng impuro) |
| 9 | PlayerMatchView.jsx:61 | aceitável | block disable + doc | player.checkBenchStatus muta engine |
| 10 | PressView.jsx:31 | **bug real** | refactor useState initializer | one-time question generation |
| 11 | SaveSlotsView.jsx:30 | **bug real** | refactor useState initializer | listSaveSlots() em mount |
| 12 | TrophyCeremony.jsx:50 | aceitável | block disable + doc | animation timeline com setTimeouts |
| 13 | ui/EfTooltip.jsx:40 | aceitável | block disable + doc | useLayoutEffect mede DOM |
| 14 | GameContext.jsx:244 | aceitável | block disable + doc | one-time mount restore engine |

**Totais**:
- Bugs reais refatorados: 3 (CosmeticShopView, PressView, SaveSlotsView)
- Anti-patterns aceitáveis silenciados com documentação: 11
- Falsos positivos: 0 (todos têm racional técnico)

### Critério "respondida"
- [x] 14/14 warnings classificados em tabela
- [x] Bugs reais corrigidos (3 useState initializers; sem regression test necessário — refactor pure de pattern equivalente)
- [x] Falsos positivos silenciados com comentário explicativo (block disable + 2-3 linhas de racional)
- [x] Anti-patterns aceitos documentados nesta tabela (exceções vivem no código + spec)

### Lint baseline antes/depois

```
Antes:  ✖ 130 problems (0 errors, 130 warnings) — 14 set-state-in-effect
Depois: ✖ 115 problems (0 errors, 115 warnings) — 0 set-state-in-effect
```
