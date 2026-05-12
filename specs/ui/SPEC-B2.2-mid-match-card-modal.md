# SPEC-B2.2: MidMatch Card Modal Component

> Status: **DRAFT — modal component only, MatchView wiring follow-up**
> Continues SPEC-B2 (deck + helpers shipped AKITA-272).

---

## O que é

Componente `<MidMatchCardModal>` que renderiza uma carta de decisão mid-match em overlay pause-style. Recebe `card` + `onChoose(option, idx)` callback. Quando `card === null` não renderiza.

Pronto para mount em MatchView durante ticker quando `shouldTriggerMidMatch(currentMinute)` retorna true.

---

## Input/Output

```tsx
<MidMatchCardModal
  card={{ id, text, options: [{label, effect, resultText}] }}
  onChoose={(option, idx) => void}
  onClose={() => void}
/>
```

---

## Regras

### 1. Render
- [ ] `card` null → não renderiza nada
- [ ] Mostra `card.text` em destaque
- [ ] Botão por opção: label + preview effect chip ("Moral +5")

### 2. Interação
- [ ] Click em opção → chama `onChoose(option, idx)` e auto-close
- [ ] Botão X → onClose sem escolher

### 3. ARIA
- [ ] role="dialog" + aria-modal="true" + aria-labelledby

### 4. Pause-style
- [ ] Overlay backdrop semitransparente
- [ ] z-index alto (acima de match log)

### 5. Forbidden
- [ ] Sem emoji
- [ ] Sem deps externas

---

## Implementação

- **Novo**: `src/components/MidMatchCardModal.jsx` (~95 LOC)
- **Novo harness**: `tests/specs/SPEC-B2.2-mid-match-modal.test.js`

Wire em MatchView: PR futuro (precisa state machine no ticker).

---

**SPEC versão**: 1.0
