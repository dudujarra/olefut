# SPEC-042: Formation Editor (Drag/Drop Visual)

**Status**: IMPLEMENTADO (v1.0 Sprint 2)
**Versão**: 1.0
**Owner**: Dudu

## O que é

Editor visual de formação tática estilo OléFUT clássico. Campo verde com 11 camisas posicionáveis via drag/drop, slots base por formação (4-3-3, 4-4-2, etc), com offsets X/Y livres pra ajuste fino (lateral mais avançado, recuado, etc).

## Input

- Component `<FormationBoard team={team} onSave={...} editable={true} />`
- Pointer events (mouse + touch unified)
- Coordenadas normalizadas [0,1] (x:esquerda→direita, y:topo→fundo)

## Output

- Estado `team.formationLayout = { [slotIdx]: { playerId, x, y, role } }`
- Engine: `engine.saveFormationLayout({ formation, layout })`
- Visual: SVG 600×400 com:
  - Linhas de campo (border, mid-line, círculo central, áreas)
  - 11 jerseys com cor by role (GOL=gold, outros=blue), número OVR, primeiro nome, posição
- 5 formações preset: 4-3-3, 4-4-2, 4-2-4, 3-5-2, 5-3-2
- Reset button (volta a preset)

## Lógica Offsets

`computeOffsets(layout, formationId)` retorna:
- DEF avançado (y < preset y -0.1): +5% midfield, -3% defense (vira playmaker)
- ATA recuado (y > preset y +0.1): +4% midfield, -5% finalização
- MEI avançado (y < preset y -0.15): +2% finalização

## Validação

1. ✅ Build pass
2. ✅ Tests pass
3. ✅ Drag/drop pointer events funcionam mouse + touch
4. ✅ Coords normalizadas clamp [0.05, 0.95]
5. ⏳ Engine integra offsets em getTeamSectors() (v1.1)
6. ⏳ Manual: drag DEF para meio, ver Forças bars subir MEI

## Forbidden

- ❌ Coords fora [0,1] (clamped via Math.min/max)
- ❌ Jersey overlap (no merge — slots distintos)
- ❌ Mais de 11 slots
- ❌ React DnD lib (zero deps preferido)

## Files

- `src/components/FormationBoard.jsx` (novo, ~190 linhas)
- `src/engine/FormationLayout.js` (novo, presets + computeOffsets, ~110 linhas)
- `src/engine/engine.js` (`saveFormationLayout()`)
- Integration: `src/components/PreMatchScreen.jsx` (modal trigger)
