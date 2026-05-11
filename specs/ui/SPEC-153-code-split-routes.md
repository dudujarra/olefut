# SPEC-153: Code-split de rotas via React.lazy

**Categoria**: ui
**Status**: ✔️ done (retroativa — implementação shipped via AKITA-204)
**Owner**: Dudu
**Criada**: 2026-05-11
**SPEC linkadas**: nenhuma

---

## 1. Objetivo

Reduzir initial bundle de 1.56MB → <500KB code-splitando rotas (views) carregadas sob demanda.

## 2. Motivação

Bundle 1.56MB inicial força usuário a baixar código de TODAS as views antes da primeira tela aparecer. Para um web game manager, primeira impressão = critical. Demo pública (GitHub Pages) sofre especialmente em conexões móveis.

## 3. Input

- `src/App.jsx` com 17 imports estáticos de view components
- `vite.config.js` (Rolldown) com auto code-splitting habilitado
- React 19 (suporte completo a `lazy` + `Suspense`)

## 4. Output

- `index.js` chunk inicial ≤ 500KB (gzip ≤ 150KB)
- Cada view lazy emite chunk próprio em `dist/assets/`
- `Suspense` fallback mostra tela "CARREGANDO…" entre transições

## 5. Comportamento (decisão arquitetural)

**Eager** (carregado no initial chunk — alta frequência ou bloqueante):
- `StartView` (primeira tela)
- `DashboardView` (hub principal)
- `Sidebar` (UI persistente)
- `FloatingBugButton`, `AudioController` (sempre montados)
- `EfButton` (compartilhado por todos chunks → vira shared chunk com React)

**Lazy** (chunks separados via `React.lazy()`):
- PlayerDashboardView, PlayerMatchView, SquadView, MarketView, StandingsView,
  MatchView, MonitorView, CosmeticShopView, AutoPlayView, StyleguideView,
  AchievementsView, TutorialView, PressView, SaveSlotsView, RivalriesView, ChronicleView

**Suspense fallback**: componente `<Fallback>` inline em `App.jsx` — div com texto monospace "CARREGANDO…".

## 6. Validação

**Harness**: `tests/_build-budget.test.js` (a criar) deve verificar:
- [ ] `dist/assets/index-*.js` ≤ 500KB
- [ ] Cada view-chunk ≤ 200KB

Comando manual: `npx vite build && ls -la dist/assets/index-*.js`

**Resultado da implementação (AKITA-204)**:
- `dist/assets/index-*.js` = **376KB** (gzip 110KB) — meta atingida ✅
- Maior view-chunk: AutoPlayView 120KB ✅
- React vendor (chunk batizado "EfButton" por Vite) 644KB — framework cost, fora do escopo

## 7. Forbidden cases

- ❌ View crítica (StartView, DashboardView) virar lazy → fallback frequente vira UX ruim
- ❌ Componente que importa imagem grande inline ser puxado pelo initial chunk
- ❌ `INEFFECTIVE_DYNAMIC_IMPORT` warning Vite (componente lazy também importado estaticamente)

## 8. Arquivos tocados

- `src/App.jsx` — convertido pra `lazy()` + `Suspense`
- `src/components/StartView.jsx` — inlined `isTutorialDone` (era import estático de `TutorialView` lazy)

## 9. Riscos / débitos

- React vendor 644KB ainda dispara warning Vite >500KB. Não-actionable (framework cost). Documentado.
- Sem teste automatizado de budget — débito (criar `tests/_build-budget.test.js`).
- Suspense fallback é placeholder; não foi testado em conexão lenta real.

## 10. Decisão de arquitetura (ADR-style)

**Alternativas consideradas**:
1. `React.lazy()` nativo + Suspense — **escolhido**
2. `loadable-components` — dep extra, mesmo benefício
3. `manualChunks` em rollup config — controle fino mas verbose; Vite auto-split já cobre 80%
4. Sem code-split + minify mais agressivo — não resolve o problema (bundle ainda baixa inteiro)

**Por quê 1**: zero dep nova, React 19 suporta nativamente, Vite auto-detecta `import()` dinâmico e cria chunks. Mínima cerimônia.

**Tradeoff aceito**: cada navegação lazy = round-trip extra de rede. Aceitável pra views infrequentes (StyleguideView, AchievementsView).
