# SPEC-158: BUG-081 — Audit 14 warnings `react-hooks/set-state-in-effect`

**Categoria**: ui
**Status**: 📝 draft (auditoria pendente)
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

## 7. Resultado (preenche ao implementar)

> **Status**: aberto
> **PR**: pendente
> **Bug count após audit**: —
