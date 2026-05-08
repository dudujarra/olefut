# 🐛 Bug Tracker — Elifoot RPG

> Gerado: 2026-05-07 | Protocolo: AKITA-018
> Status: ✅ Todos resolvidos

## Tickets

### BUG-001 ✅ RESOLVIDO — `scoutRegionAction` não existia na engine
- **Arquivo:** `engine.js:312`
- **Fix:** Adicionado `scoutRegionAction()` como alias de `doScouting()`
- **Teste:** `engine.test.js > BUG-001` (2 assertions)

---

### BUG-002 ✅ RESOLVIDO — `signScoutedPlayer` não existia na engine
- **Arquivo:** `engine.js:318`
- **Fix:** Implementado `signScoutedPlayer(index)` com validação de saldo, contrato, moral
- **Teste:** `engine.test.js > BUG-002` (5 assertions)

---

### BUG-003 ✅ RESOLVIDO — Speed control não mudava velocidade do ticker ativo
- **Arquivo:** `MatchView.jsx:42-80`
- **Fix:** `speedRef` + `tickerStateRef` + `useEffect` que reinicia interval ao mudar speed
- **Teste:** `static-checks.test.js > BUG-003` (3 assertions)

---

### BUG-004 ✅ RESOLVIDO — preStep/talkDone não resetavam entre partidas
- **Arquivo:** `MatchView.jsx:531`
- **Fix:** Adicionado `setPreStep(1); setTalkDone(false)` no onClick do "VOLTAR AO DASHBOARD"
- **Teste:** `static-checks.test.js > BUG-004` (3 assertions)

---

### BUG-005 ✅ RESOLVIDO — Import morto `generateCounterOffer` no MarketView
- **Arquivo:** `MarketView.jsx:5`
- **Fix:** Removido import
- **Teste:** `static-checks.test.js > BUG-005` (1 assertion)

---

### BUG-006 ✅ RESOLVIDO — MarketView mutava `team.squad` diretamente
- **Arquivo:** `MarketView.jsx:38`, `engine.js:348`
- **Fix:** Criado `engine.sellPlayer(playerId, amount)`, MarketView usa via engine
- **Teste:** `engine.test.js > BUG-006` (3 assertions) + `static-checks.test.js > BUG-006` (2 assertions)

---

## Resultado dos Testes

```
✓ 30/30 testes passando
✓ 2 arquivos de teste (engine.test.js + static-checks.test.js)
✓ Build limpo (0 erros, 381KB)
✓ Tempo: 277ms
```

## Comandos

```bash
npm test          # roda todos os testes uma vez
npm run test:watch # roda testes em modo watch
npm run test:ci    # roda testes + build (pipeline)
```

---

### BUG-007 ✅ RESOLVIDO — Statistics topScorer ownerTeam sempre homeTeam (bug logic)
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/2
- **Branch:** `bug/BUG-007`
- **Fix:** Aplicado (ver tests/regression/)
- **Teste:** `tests/regression/BUG-007.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-008 ✅ RESOLVIDO — MarketSystem makeOffer aceita oferta sem listing existir
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/3
- **Branch:** `bug/BUG-008`
- **Fix:** Aplicado (ver tests/regression/)
- **Teste:** `tests/regression/BUG-008.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-009 ✅ RESOLVIDO — ContractSystem bonus duplicado se goalNumber distinto
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/4
- **Branch:** `bug/BUG-009`
- **Fix:** Aplicado (ver tests/regression/)
- **Teste:** `tests/regression/BUG-009.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-010 ✅ RESOLVIDO — Script debug-bug.sh octal error em BUG-008+
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/5
- **Branch:** `bug/BUG-010`
- **Fix:** Aplicado (ver tests/regression/)
- **Teste:** `tests/regression/BUG-010.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-011 ✅ RESOLVIDO — regression.yml falta pull-requests write permission (403 comment)
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/7
- **Branch:** `bug/BUG-011`
- **Fix:** TODO
- **Teste:** `tests/regression/BUG-011.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-012 ✅ RESOLVIDO — PrestigeSystem decay Math.floor zera valores < 20 permanente
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/8
- **Branch:** `bug/BUG-012`
- **Fix:** TODO
- **Teste:** `tests/regression/BUG-012.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-013 ✅ RESOLVIDO — NPCAISystem rngState global compartilhado entre instances
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/9
- **Branch:** `bug/BUG-013`
- **Fix:** TODO
- **Teste:** `tests/regression/BUG-013.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-014 ✅ RESOLVIDO — NewsSystem news array unbounded memory leak
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/10
- **Branch:** `bug/BUG-014`
- **Fix:** TODO
- **Teste:** `tests/regression/BUG-014.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-015 ✅ RESOLVIDO — MatchView crash TypeError minute undefined em filter
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/12
- **Branch:** `bug/BUG-015`
- **Fix:** TODO
- **Teste:** `tests/regression/BUG-015.test.js`
- **Status:** OPEN (2026-05-07)

