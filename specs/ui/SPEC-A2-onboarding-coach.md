# SPEC-A2: Onboarding Coach (90s in-game)

> Status: **DRAFT — implementação no mesmo PR**
> Owner: Dudu
> Fase: A — Tornar JOGÁVEL (GAME-DESIGN-ROADMAP A2)
> Sequência: SPEC-A1 (sidebar reduzida) → SPEC-A2

---

## O que é

Componente overlay `<OnboardingCoach>` que mostra 4 dicas contextuais sequenciais no Dashboard durante a **semana 1 da 1ª temporada**. Cada dica:
- Texto curto (≤80 chars)
- Botão "PRÓXIMA" / "FECHAR"
- Persiste progresso em `localStorage.elifoot_onboarding_step` e `elifoot_onboarding_done`
- Dismissable a qualquer momento

Resolve falha do TutorialView (texto antes do jogo, ninguém lê). Aqui é **dentro do jogo**.

---

## Input

- `gameState.view === 'dashboard'`
- `engine.currentWeek === 1`
- `engine.seasonNumber === 1`
- `localStorage.elifoot_onboarding_done !== 'true'`

---

## Output

4 steps sequenciais:

| Step | Texto |
|------|-------|
| 1 | "Este é seu DASHBOARD. Tudo importante começa aqui." |
| 2 | "Escolha FORMAÇÃO e TÁTICA antes de cada jogo." |
| 3 | "Clique JOGAR PARTIDA pra simular. Dura 1 minuto." |
| 4 | "Veja resultado, ajuste, próxima semana. Boa sorte!" |

---

## Regras de validação

### 1. Trigger
- [ ] Renderiza só quando `week === 1 && season === 1 && !done`
- [ ] Não renderiza após `localStorage.elifoot_onboarding_done === 'true'`

### 2. Progressão
- [ ] Step inicial = 1 (ou valor restaurado de localStorage)
- [ ] Botão "PRÓXIMA" avança step
- [ ] Step 4 → botão "ENTENDI" marca done

### 3. Persistência
- [ ] Mudança de step grava `elifoot_onboarding_step`
- [ ] Conclusão grava `elifoot_onboarding_done=true`
- [ ] Dismiss antecipado também marca done (não-pestering)

### 4. Acessibilidade
- [ ] `role="dialog"` + `aria-labelledby` em cada step
- [ ] Botão close keyboard accessible
- [ ] ESC fecha

### 5. Não-intrusivo
- [ ] Não bloqueia interação resto do Dashboard
- [ ] Posicionamento fixo bottom-right (não centro tela)

### 6. Determinismo
- [ ] Mesmo localStorage state → mesmo render

### 7. Sem deps novas
- [ ] Usa só React + Phosphor icons (existente)
- [ ] Sem framer-motion, sem outras libs

### 8. Forbidden
- [ ] Sem emoji em código novo
- [ ] Sem inline style (usa CSS classes existentes ou inline com `/* eslint-disable-next-line */`)
- [ ] Sem chamada de rede

---

## Implementação

- **Novo**: `src/components/OnboardingCoach.jsx` (~110 LOC)
- **Modifica**: `src/components/DashboardView.jsx` (+5 LOC import + render)
- **Modifica**: `src/styles/luxury-arcade.css` (+ classes `.ef-onboarding-coach*`)
- **Novo harness**: `tests/specs/SPEC-A2-onboarding-coach.test.js`

### Interface componente
```jsx
<OnboardingCoach
  show={isFirstWeek}
  onComplete={() => {}}
/>
```

---

## Testes esperados

```javascript
describe('SPEC-A2: Onboarding Coach', () => {
  test('rule 1: renders when week=1 season=1 not done', () => {});
  test('rule 1: does not render when done flag set', () => {});
  test('rule 2: next button advances step', () => {});
  test('rule 2: final step marks done', () => {});
  test('rule 3: localStorage persists progress', () => {});
  test('rule 3: dismiss marks done', () => {});
  test('forbidden: no emoji in source', () => {});
});
```

---

## Rollback

- Remover render do DashboardView → componente unmount
- `localStorage.removeItem('elifoot_onboarding_done')` reativa

---

**SPEC versão**: 1.0
**Protocolo**: AKITA SDD + Fase A Roadmap
