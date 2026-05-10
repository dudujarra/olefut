# SPEC-078: Hall de Lendas — Canonização de Mitos do Clube

**Fase:** 4 — Mito + Emoção (v1.1)  
**Prioridade:** ALTA  
**Pré-requisito:** SPEC-049 Narrative Layers MVP (Camada 5)  
**AKITA:** AKITA-051  
**SAVE_VERSION:** sobe pra 16 ao final desta SPEC

---

## O que é

Sistema de canonização de jogadores históricos em slots de mito por clube. Cada clube tem 6 slots permanentes que capturam as figuras mais marcantes da história do save. Alimenta Camada 5 do sistema narrativo e serve de base para Traits Herdáveis (SPEC-079).

**6 slots por clube:**
| Slot | Nome | Critério principal |
|------|------|--------------------|
| `idoloEterno` | Ídolo Eterno | Mais jogos + maior amor da torcida |
| `carrasco` | Carrasco | Mais gols contra este clube (rival histórico) |
| `goleirao` | Goleador | Maior número de gols marcados pelo clube |
| `criaDaBase` | Cria da Base | Jogador formado internamente com maior impacto |
| `traidor` | Traidor | Jogador que saiu para rival direto |
| `lendaTragica` | Lenda Trágica | Lesão longa ou morte jovem no auge |

---

## Input

```typescript
{
  clubId: number,
  saveHistory: {
    players: Array<{
      playerId: number,
      name: string,
      gamesForClub: number,
      goalsForClub: number,
      assistsForClub: number,
      fromYouthAcademy: boolean,
      leftForRivalId?: number,         // se vendido para rival
      hadLongInjury: boolean,          // lesão > 12 semanas no auge
      fanLoveScore: number,            // 0-100 acumulado
      goalsAgainstClub: number         // se jogou contra (como adversário)
    }>,
    rivalClubs: Array<number>          // IDs dos rivais históricos
  }
}
```

---

## Output esperado

```typescript
{
  clubId: number,
  hall: {
    idoloEterno: LegendSlot | null,
    carrasco: LegendSlot | null,
    goleirao: LegendSlot | null,
    criaDaBase: LegendSlot | null,
    traidor: LegendSlot | null,
    lendaTragica: LegendSlot | null
  },
  newCanonicizations: Array<{
    slot: string,
    playerId: number,
    playerName: string,
    headline: string           // manchete handwritten
  }>
}

type LegendSlot = {
  playerId: number,
  playerName: string,
  canonizedOnSeason: number,
  headline: string,            // "O eterno capitão que nunca vendeu"
  traitBias: string            // trait herdável gerado (para SPEC-079)
}
```

**Critérios de canonização (função pura):**
```
idoloEterno:   max(fanLoveScore) onde gamesForClub ≥ 50
goleirao:      max(goalsForClub) onde gamesForClub ≥ 30
criaDaBase:    max(goalsForClub + assistsForClub) where fromYouthAcademy=true
traidor:       any player com leftForRivalId ∈ rivalClubs e goalsForClub ≥ 10
lendaTragica:  any player com hadLongInjury=true e fanLoveScore ≥ 50
carrasco:      max(goalsAgainstClub) dentre jogadores de rivais, mínimo 3 gols
```

**Manchetes mínimas (6 handwritten, uma por slot):**
```
idoloEterno:   "[nome] — O capitão que nunca saiu pela porta dos fundos"
goleirao:      "[nome] — [X] gols que fizeram a história deste clube"
criaDaBase:    "[nome] — Da pelada na base ao estádio lotado"
traidor:       "[nome] — O nome que ninguém mais pronuncia aqui"
lendaTragica:  "[nome] — O que poderia ter sido, e nunca saberemos"
carrasco:      "[nome] — O pesadelo que visita toda vez"
```

---

## Regras de validação

- [ ] `evaluateMyth(save) → save'` é função pura (sem side effects)
- [ ] Slot só preenchido se critério mínimo atingido (não força preenchimento vazio)
- [ ] Um jogador não ocupa dois slots no mesmo clube
- [ ] `headline` nunca vazio em slot preenchido
- [ ] `traitBias` mapeia para trait válido (garra, talento_natural, lealdade, frieza)
- [ ] `newCanonicizations` lista apenas mudanças nesta chamada (não histórico completo)
- [ ] Hall persiste no save e não é recalculado do zero (apenas appended)
- [ ] `traidor` só preenchido se jogador foi vendido para rival confirmado

---

## Forbidden

- [ ] Slot preenchido sem critério mínimo atingido
- [ ] Mesmo jogador em dois slots do mesmo clube
- [ ] `headline` gerado por sistema (deve ser handwritten + interpolação de nome/número)
- [ ] Hall resetando entre seasons
- [ ] `criaDaBase` para jogador não formado internamente (`fromYouthAcademy=false`)

---

## Implementação

**Arquivo:** `src/engine/MythService.js` (já previsto no refactor AKITA-RFCT-005 a 007)  
**Função principal:** `MythService.evaluateMyth(save) → save'`  
**Schema save:** `save.clubs[id].hall = { idoloEterno, carrasco, ... }`  
**UI:** `src/views/ClubGalleryView.js` — tela estática de prosa

---

## Testes esperados

```javascript
describe('SPEC-078: Hall de Lendas', () => {
  test('evaluateMyth is pure — no side effects (rule 1)', () => {
    const save = deepClone(mockSave);
    const save2 = MythService.evaluateMyth(save);
    expect(save).toEqual(mockSave); // original não mudou
    expect(save2).not.toBe(save);
  });

  test('slot only filled if minimum criteria met (rule 2)', () => {
    const save = mockSaveWithFewGames; // goleirao tem max 10 gols (< 30 games)
    const result = MythService.evaluateMyth(save);
    expect(result.clubs[1].hall.goleirao).toBeNull();
  });

  test('one player cannot occupy two slots (rule 3)', () => {
    const result = MythService.evaluateMyth(mockSave);
    const hall = result.clubs[1].hall;
    const ids = Object.values(hall).filter(Boolean).map(s => s.playerId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('headline never empty for filled slot (rule 4)', () => {
    const result = MythService.evaluateMyth(mockSaveRich);
    Object.values(result.clubs[1].hall).filter(Boolean).forEach(slot => {
      expect(slot.headline).toBeTruthy();
    });
  });

  test('traitBias maps to valid trait (rule 5)', () => {
    const validTraits = ['garra', 'talento_natural', 'lealdade', 'frieza'];
    const result = MythService.evaluateMyth(mockSaveRich);
    Object.values(result.clubs[1].hall).filter(Boolean).forEach(slot => {
      expect(validTraits).toContain(slot.traitBias);
    });
  });

  test('hall persists — not reset between calls (rule 7)', () => {
    const save1 = MythService.evaluateMyth(mockSave);
    const save2 = MythService.evaluateMyth(save1); // segunda chamada
    expect(save2.clubs[1].hall.idoloEterno).toEqual(save1.clubs[1].hall.idoloEterno);
  });

  test('traidor only if sold to confirmed rival (rule 8)', () => {
    const saveNoRival = { ...mockSave, rivalClubs: [] };
    const result = MythService.evaluateMyth(saveNoRival);
    expect(result.clubs[1].hall.traidor).toBeNull();
  });

  test('newCanonicizations lists only changes this call (rule 6)', () => {
    const save1 = MythService.evaluateMyth(mockSave);
    const { newCanonicizations } = MythService.evaluateMyth(save1); // sem mudanças
    expect(newCanonicizations.length).toBe(0);
  });
});
```

---

## Definition of Done
- [ ] `MythService.evaluateMyth()` passa todos os 8 testes
- [ ] 6 manchetes handwritten escritas (uma por slot)
- [ ] ClubGalleryView renderiza hall preenchido com prosa
- [ ] Hall persiste em save 10 seasons sem reset

## Definition of Stop
- Se todos os 6 slots ficarem preenchidos na season 1 (muito cedo): aumentar mínimo de gamesForClub para 80 em idoloEterno
