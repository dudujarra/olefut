# SPEC-043: Pre-Match Adversary Info

**Status**: IMPLEMENTADO (v1.0 Sprint 2)
**Versão**: 1.0
**Owner**: Dudu

## O que é

Tela pre-jogo com 3-painel mostrando contexto completo do jogo: nosso time (esquerda), VS+local+rodada (centro), adversário (direita) com sectors, formação típica, estilo, H2H últimos 5, casa/fora indicator, competição.

Motivação user: "precisamos poder ver com quem vamos jogar, qual campeonato, se é em casa ou fora, histórico de partidas e estilo do time adversário".

## Input

- `<PreMatchScreen team context sectors engine onSaveLayout />`
- `engine.getMatchContext()` retorna:
  - `opponent` (Team obj)
  - `isHome` (bool)
  - `location` ('CASA'|'FORA')
  - `tournament` (string nome torneio)
  - `seasonWeek` (number)
  - `h2h` (array últimas 5 confrontos)
  - `oppSectors` (GOL/DEF/MEI/ATA do adversário)
  - `opponentStyle` ('Defensivo'|'Ofensivo'|...)
  - `oppTactic` (raw tactic key)

## Output

- 3-painel grid responsivo:
  - **Left**: nome time, sectors GOL/DEF/MEI/ATA (com tooltips), formação, botão "🎯 Editar Posicionamento" → abre modal FormationBoard
  - **Center**: "VS" big, badge CASA/FORA color-coded, semana/38
  - **Right**: nome adversário, sectors deles, formação, estilo derivado, torneio, H2H bolinhas V/E/D color
- Renderizado no topo de MatchView phase 'prematch' (acima do wizard 3-step existente)

## Validação

1. ✅ Build pass
2. ✅ Tests pass
3. ✅ matchContext null-safe (sem upcoming match)
4. ✅ H2H mostra apenas se matchHistory existe
5. ⏳ Manual: prematch deve mostrar adversário info, click formação modal abre FormationBoard

## Forbidden

- ❌ Substituir wizard 3-step atual (manter compatibilidade — só adicionar PreMatchScreen no topo)
- ❌ Mostrar H2H sem dados (renderizar condicional)
- ❌ Hardcoded nomes torneios (usar tournament context)

## Files

- `src/components/PreMatchScreen.jsx` (novo, ~180 linhas)
- `src/engine/engine.js` (`getMatchContext()`)
- `src/components/MatchView.jsx` (integration prematch phase)
