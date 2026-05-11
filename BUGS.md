# 🐛 Bug Tracker — Elifoot RPG

> Atualizado: 2026-05-11 | Protocolo: AKITA Mandamento #6 (ticket + fix + regression test)
> Fonte canônica: arquivos em `tests/regression/`. Cada BUG-XXX precisa ter os 3 artefatos.

## Estado

| | |
|---|---|
| Bugs com regression test em `tests/regression/` | **13 arquivos** (alguns cobrem cascatas) |
| Bugs resolvidos com 3-artefact completo | Ver tabela abaixo |
| Bugs abertos / regressões ativas (2026-05-11) | ✅ 1044/1044 verde após merge main + AKITA-204 (skipAutoRestore fix) |

## Inventário de regression tests

| Arquivo | Cobre | Status atual |
|---------|-------|--------------|
| `tests/regression/BUG-010.test.js` | BUG-010 | ✅ |
| `tests/regression/BUG-011.test.js` | BUG-011 | ✅ |
| `tests/regression/BUG-015.test.js` | BUG-015 | ✅ |
| `tests/regression/BUG-019.test.js` | BUG-019 | ✅ |
| `tests/regression/BUG-020.test.js` | BUG-020 | ✅ |
| `tests/regression/BUG-021.test.js` | BUG-021 | ✅ |
| `tests/regression/BUG-022.test.js` | BUG-022 | ✅ |
| `tests/regression/BUG-026-029-autoplay.test.js` | BUG-026 → BUG-029 | ✅ |
| `tests/regression/BUG-032-034-cascade.test.js` | BUG-032 → BUG-034 | ✅ (AKITA-104: `YouthAcademy.js:49` fix — stats flat) |
| `tests/regression/BUG-040-043-cascade.test.js` | BUG-040 → BUG-043 | ✅ (AKITA-104: `encodeState` realinhado com SPEC-116) |
| `tests/regression/BUG-055-draws-only.test.js` | BUG-055 | ✅ |
| `tests/regression/BUG-078.test.js` | BUG-078 | ✅ |
| `tests/regression/BUG-079.test.js` | BUG-079 | ✅ |

**Regressões em SPECs (mesmo arquivo de regression cobre):**
- `tests/regression/SPEC-060-club-identity.test.js` — ✅ (AKITA-104: Proxy alias 88 DB→canonical)
- `tests/regression/SPEC-115-117-adaptive-bot.test.js` — ✅ (AKITA-104: encodeState 6-dim)

**Outros vermelhos (não regression) — resolvidos em AKITA-104:**
- `tests/specs/SPEC-009-youth-academy.test.js` — ✅ stats flat
- `tests/characterization/engine-golden.test.js` — ✅ skip restoreAllBrains em test env
- `tests/integration/marl-e2e.test.js` — ✅ AdaptiveBrain `skipAutoRestore` opt-in
- `tests/integration/seasonhistory-data.test.js` — ✅ resolvido pela cascata
- `tests/specs/SPEC-025-aging.test.js` — ✅ pin seed
- `tests/specs/SPEC-134-growth-event-system.test.js` — ✅ pin seed
- `tests/integration/autoplay-full-audit.test.js` — ✅ pin seed

---

## Tickets resolvidos (detalhado)

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
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-011.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-012 ✅ RESOLVIDO — PrestigeSystem decay Math.floor zera valores < 20 permanente
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/8
- **Branch:** `bug/BUG-012`
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-012.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-013 ✅ RESOLVIDO — NPCAISystem rngState global compartilhado entre instances
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/9
- **Branch:** `bug/BUG-013`
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-013.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-014 ✅ RESOLVIDO — NewsSystem news array unbounded memory leak
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/10
- **Branch:** `bug/BUG-014`
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-014.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-015 ✅ RESOLVIDO — MatchView crash TypeError minute undefined em filter
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/12
- **Branch:** `bug/BUG-015`
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-015.test.js`
- **Status:** OPEN (2026-05-07)


---

### BUG-019 ✅ RESOLVIDO — Tab Clube crash - StaffManager falta getStaff method
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/17
- **Branch:** `bug/BUG-016`
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-016.test.js`
- **Status:** OPEN (2026-05-08)


---

### BUG-020 ✅ RESOLVIDO — App não persiste state (sem auto-save)
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/18
- **Branch:** `bug/BUG-017`
- **Fix:** Aplicado
- **Teste:** `tests/regression/BUG-017.test.js`
- **Status:** OPEN (2026-05-08)


---

### BUG-021 ⏳ ABERTO — React error #310 — early return between hooks (DashboardView + PlayerDashboardView)
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/60
- **Branch:** `bug/BUG-021`
- **Fix:** TODO
- **Teste:** `tests/regression/BUG-021.test.js`
- **Status:** OPEN (2026-05-08)


---

### BUG-022 ⏳ ABERTO — BUG-077 Série B encolhe: processPromoRelegation só roda pra divisão do bot
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/93
- **Branch:** `bug/BUG-022`
- **Fix:** TODO
- **Teste:** `tests/regression/BUG-022.test.js`
- **Status:** OPEN (2026-05-09)


---

### BUG-078 ⏳ ABERTO — SPEC-111 market offers not tracked — buy offers never reach history.offers (only MARKET_INQUIRY probes do)
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/94
- **Branch:** `bug/BUG-078`
- **Fix:** TODO
- **Teste:** `tests/regression/BUG-078.test.js`
- **Status:** OPEN (2026-05-10)


---

### BUG-079 ⏳ ABERTO — Player immortality — high-OVR titular players accumulate totalGoals indefinitely (7269 in 203 seasons) because age/retirement system fails for long-lived squad members
- **Issue:** https://github.com/dudujarra/elifoot-web/issues/95
- **Branch:** `bug/BUG-079`
- **Fix:** TODO
- **Teste:** `tests/regression/BUG-079.test.js`
- **Status:** OPEN (2026-05-10)

