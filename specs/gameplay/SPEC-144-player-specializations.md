# SPEC-144: Player Specializations — Traits por Posição

> **Origem**: jogo não diferencia artilheiro nato, goleiro pegador de pênalti, defensor de área.
> Todos os jogadores têm mesmo pool de traits genéricos. Adicionar especialidades que impactam
> o match engine de forma concreta.

---

## O que é

Adiciona 5 traits especializados por posição com efeito direto no MatchSimulator:
- `poacher` — Artilheiro (ATA): +25% conversão de chances
- `penalty_stopper` — Pegador de Pênalti (GOL): +35% save em pênalti
- `penalty_king` — Cobrador (ATA/MEI): +40% conversão em pênalti
- `rockwall` — Muralha (DEF/GOL): +15% setor defensivo do time
- `set_piece_target` — Alvo de Bola Parada (ATA/DEF): +20% gol em escanteio/falta

Traits são exclusivos por posição — `poacher` só disponível para ATA, `penalty_stopper` só para GOL.

---

## Input

```typescript
player: {
    position: 'GOL' | 'DEF' | 'MEI' | 'ATA',
    traits: string[],
    ovr: number
}
matchContext: { isPenalty: boolean, minute: number, isSetPiece: boolean }
```

---

## Output esperado

No MatchSimulator:
- ATA com `poacher` marca mais gols (conversão +25%)
- GOL com `penalty_stopper` salva mais pênaltis (save rate +35%)
- ATA/MEI com `penalty_king` converte mais pênaltis (+40%)
- Time com DEF `rockwall` leva menos gols (defense sector +15%)
- ATA/DEF com `set_piece_target` marca mais em bola parada (+20%)

---

## Regras de validação

- [ ] `rollTraits()` nunca atribui `poacher` a GOL ou DEF
- [ ] `rollTraits()` nunca atribui `penalty_stopper` a ATA ou MEI
- [ ] `rollTraits()` nunca atribui `penalty_king` a GOL ou DEF
- [ ] `rockwall` só disponível para DEF e GOL
- [ ] `set_piece_target` só disponível para ATA e DEF
- [ ] ATA com `poacher` tem conversão média 25% maior em 1000 simulações
- [ ] GOL com `penalty_stopper` salva ≥ 50% dos pênaltis (vs ~30% sem trait)
- [ ] Defense sector com 4 DEF `rockwall` ≥ 15% maior que sem
- [ ] Jogador pode ter no máximo 1 trait de especialização + 1 trait genérico

---

## Forbidden

- [ ] `poacher` em GOL, DEF
- [ ] `penalty_stopper` em ATA, MEI
- [ ] `penalty_king` em GOL, DEF
- [ ] Stacking de 2 traits de especialização no mesmo jogador
- [ ] Trait de especialização aplicado sem checar posição real do jogador

---

## Implementação

### 1. `src/engine/PlayerTraits.js` — adicionar traits especializados

```javascript
// Separar em dois pools: GENERIC_TRAITS (sem posição) e POSITION_TRAITS (com posição)
export const POSITION_TRAITS = [
    {
        id: 'poacher',
        name: '🎯 Artilheiro',
        description: '+25% conversão de gols',
        positions: ['ATA'],
        rarity: 0.12,
        goalConversionBonus: 1.25,
    },
    {
        id: 'penalty_stopper',
        name: '🧤 Pegador de Pênalti',
        description: '+35% save em pênalti',
        positions: ['GOL'],
        rarity: 0.10,
        penaltySaveBonus: 1.35,
    },
    {
        id: 'penalty_king',
        name: '⚽ Cobrador',
        description: '+40% conversão em pênalti',
        positions: ['ATA', 'MEI'],
        rarity: 0.10,
        penaltyConversionBonus: 1.40,
    },
    {
        id: 'rockwall',
        name: '🧱 Muralha',
        description: '+15% setor defensivo',
        positions: ['DEF', 'GOL'],
        rarity: 0.08,
        defenseSectorBonus: 0.15,
    },
    {
        id: 'set_piece_target',
        name: '🎯 Alvo de Bola Parada',
        description: '+20% gol em escanteio/falta',
        positions: ['ATA', 'DEF'],
        rarity: 0.09,
        setPieceBonus: 1.20,
    },
];

// Atualizar rollTraits() para respeitar posição:
export function rollTraits(player) {
    if (player.traits && player.traits.length > 0) return;
    player.traits = [];
    const maxTraits = player.age < 22 ? 1 : 2;

    // 1. Tentar trait de especialização (posição-específico)
    const eligible = POSITION_TRAITS.filter(t => t.positions.includes(player.position));
    const shuffledPos = [...eligible].sort(() => systemRng() - 0.5);
    for (const trait of shuffledPos) {
        if (player.traits.length >= 1) break; // máx 1 especialização
        if (systemRng() < trait.rarity) {
            player.traits.push(trait.id);
        }
    }

    // 2. Traits genéricos até maxTraits
    const shuffled = [...TRAITS].sort(() => systemRng() - 0.5);
    for (const trait of shuffled) {
        if (player.traits.length >= maxTraits) break;
        if (systemRng() < trait.rarity) {
            player.traits.push(trait.id);
        }
    }
}

// Helpers para MatchSimulator:
export function getGoalConversionBonus(player) {
    return player.traits?.includes('poacher') ? 1.25 : 1.0;
}

export function getPenaltySaveBonus(player) {
    return player.traits?.includes('penalty_stopper') ? 1.35 : 1.0;
}

export function getPenaltyConversionBonus(player) {
    return player.traits?.includes('penalty_king') ? 1.40 : 1.0;
}

export function getDefenseSectorBonus(squad) {
    const defenders = (squad || []).filter(p => p.isTitular && (p.position === 'DEF' || p.position === 'GOL'));
    const rockwalls = defenders.filter(p => p.traits?.includes('rockwall')).length;
    return 1.0 + (rockwalls * 0.15);
}

export function getSetPieceBonus(scorer) {
    return scorer?.traits?.includes('set_piece_target') ? 1.20 : 1.0;
}
```

### 2. `src/services/MatchSimulator.js` — aplicar traits no match

**a) Conversão de gols (artilheiro):**
```javascript
// import no topo:
import { getGoalConversionBonus, getDefenseSectorBonus, getSetPieceBonus } from '../engine/PlayerTraits.js';

// Ao calcular conversão de chance (antes do if homeGoals++):
const scorer = pickRandom(homeAttackers);
const convBonus = getGoalConversionBonus(scorer);
const effectiveConversion = CONVERSION_RATE * convBonus;
// usar effectiveConversion no cálculo de chance
```

**b) Defense sector (muralha):**
```javascript
// Ao montar homeSectors / awaySectors:
const homeDefBonus = getDefenseSectorBonus(homeTeam.squad);
const awayDefBonus = getDefenseSectorBonus(awayTeam.squad);
homeSectors.defense *= homeDefBonus;
awaySectors.defense *= awayDefBonus;
```

**c) Bola parada (set_piece_target):**
```javascript
// Em escanteio/falta que vira gol:
const setPieceScorer = pickRandom([...homeAttackers, ...homeDefenders]);
const setPieceBonus = getSetPieceBonus(setPieceScorer);
if (systemRng() < baseSetPieceProb * setPieceBonus) { homeGoals++; }
```

### 3. `src/engine/decks/MatchCardsGOL.js` — penalty_stopper

```javascript
// Ao resolver card de pênalti, checar se GOL tem penalty_stopper:
import { getPenaltySaveBonus } from '../PlayerTraits.js';

// Na resolução do card:
const gol = team.squad.find(p => p.position === 'GOL' && p.isTitular);
const saveBonus = getPenaltySaveBonus(gol);
const adjustedDifficulty = Math.min(95, card.difficulty * saveBonus);
// usar adjustedDifficulty no lugar de card.difficulty
```

### 4. `src/engine/data.js` — exportar junto ao POSITION_TRAITS

```javascript
import { rollTraits, POSITION_TRAITS } from './PlayerTraits.js';
// Chamar rollTraits(player) ao gerar jogador (já estava sendo chamado?)
```

---

## Testes esperados

```javascript
import { rollTraits, POSITION_TRAITS, getGoalConversionBonus, getPenaltySaveBonus } from '../src/engine/PlayerTraits.js';

describe('SPEC-144: Player Specializations', () => {
  test('poacher nunca atribuído a GOL', () => {
    const gols = Array.from({length: 200}, () => {
      const p = { position: 'GOL', age: 25, traits: [] };
      rollTraits(p); return p;
    });
    expect(gols.some(p => p.traits.includes('poacher'))).toBe(false);
  });

  test('penalty_stopper nunca atribuído a ATA', () => {
    const atas = Array.from({length: 200}, () => {
      const p = { position: 'ATA', age: 25, traits: [] };
      rollTraits(p); return p;
    });
    expect(atas.some(p => p.traits.includes('penalty_stopper'))).toBe(false);
  });

  test('penalty_king nunca atribuído a DEF', () => {
    const defs = Array.from({length: 200}, () => {
      const p = { position: 'DEF', age: 25, traits: [] };
      rollTraits(p); return p;
    });
    expect(defs.some(p => p.traits.includes('penalty_king'))).toBe(false);
  });

  test('rockwall só em DEF ou GOL', () => {
    const mixed = Array.from({length: 500}, () => {
      const pos = ['GOL','DEF','MEI','ATA'][Math.floor(Math.random()*4)];
      const p = { position: pos, age: 25, traits: [] };
      rollTraits(p); return p;
    });
    mixed.filter(p => p.traits.includes('rockwall'))
      .forEach(p => expect(['DEF','GOL']).toContain(p.position));
  });

  test('ATA com poacher tem goalConversionBonus 1.25', () => {
    const p = { position: 'ATA', traits: ['poacher'] };
    expect(getGoalConversionBonus(p)).toBe(1.25);
  });

  test('GOL com penalty_stopper tem penaltySaveBonus 1.35', () => {
    const p = { position: 'GOL', traits: ['penalty_stopper'] };
    expect(getPenaltySaveBonus(p)).toBe(1.35);
  });

  test('jogador sem trait especializado tem bonus 1.0', () => {
    const p = { position: 'ATA', traits: ['speedster'] };
    expect(getGoalConversionBonus(p)).toBe(1.0);
  });

  test('máx 1 trait de especialização por jogador', () => {
    Array.from({length: 200}, () => {
      const p = { position: 'ATA', age: 25, traits: [] };
      rollTraits(p);
      const specTraits = POSITION_TRAITS.map(t => t.id);
      const count = p.traits.filter(t => specTraits.includes(t)).length;
      expect(count).toBeLessThanOrEqual(1);
    });
  });
});
```

---

## Harness
```bash
cd /Users/dudujarra/Documents/ELIFOOT && npm test -- --reporter=verbose 2>&1 | grep "SPEC-144"
```
