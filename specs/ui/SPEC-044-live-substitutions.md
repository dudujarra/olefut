# SPEC-044: Live Substitutions durante Match

**Status**: IMPLEMENTADO (v1.0 Sprint 2)
**Versão**: 1.0
**Owner**: Dudu

## O que é

Permitir ao manager pausar a partida em qualquer momento (não só halftime) para fazer substituições e ajustes táticos. Estilo FIFA/Football Manager: pause + modal squad editor + retomar.

## Input

- Pause button no MatchView (1x/2x/5x/⏸️/▶️)
- Click ⏸️ → abre `<LiveSquadEditModal>`
- Modal interface:
  - Lista titulares com energia visível
  - Click jogador → seleciona pra sair
  - Lista reservas (não lesionados, energy>10)
  - Click "Entrar" → engine.applyLiveSubstitution(out, in, currentMinute)
  - Tactic switch buttons (mudança imediata)
  - Counter "🔄 Subs: X/5"

## Output

- `engine.applyLiveSubstitution(outId, inId, currentMinute)`:
  - Flip `isTitular` flags
  - Boost incoming energy +10 (max 100)
  - Floor outgoing energy 30 (rest)
  - Push em `engine._liveSubsLog[]`
  - Returns `{success, msg}`
- Pause via `pausedRef.current = true` (mantém setInterval mas skip ticks)
- Tactic update via existing `engine.setTactic(k)`

## Validação

1. ✅ Build pass
2. ✅ Tests pass (628/628)
3. ✅ Pause/resume não corrompe ticker state
4. ✅ Limite 5 subs/jogo enforced
5. ⏳ Manual: pause aos 30', sub 2 jogadores, resume, ver narração e state

## Limitação Conhecida (v1.0)

Engine simulação é **síncrono pré-computado** (`playMatch()` roda 90' inteiros num call e retorna eventos). Substituições live afetam:
- ✅ State dos jogadores (isTitular, energy, moral)
- ❌ Resultado da partida (já calculado)

Refactor para generator/state-machine planejado em **v1.3** (A6 MatchdayView depende disso).

## Forbidden

- ❌ Mais de 5 subs/jogo (FIFA rule)
- ❌ Subir jogador lesionado
- ❌ Sub jogador que não é titular
- ❌ Recalcular resultado sem refactor engine (v1.3)

## Files

- `src/components/MatchView.jsx` (pausedRef + pause button + modal trigger)
- `src/components/LiveSquadEditModal.jsx` (novo, ~210 linhas)
- `src/engine/engine.js` (`applyLiveSubstitution()`)
