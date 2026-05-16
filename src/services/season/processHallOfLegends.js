/**
 * SeasonProcessor — Extracted from engine.startNewSeason() (AKITA-RFCT-005)
 *
 * Processa transição de temporada do modo manager:
 * - Legacy (títulos, reputação)
 * - SPEC-070 (Manager Identity update)
 * - SPEC-071 (Contract resolution + novo contrato)
 * - Promo/relegação para todas as divisões
 * - Close season stats, aging, awards
 * - Sponsor + board reset
 * - SPEC-072 (Board Tension: title/contract)
 * - SPEC-082 (Chronicle)
 * - SPEC-078 (Hall of Legends)
 * - SPEC-079 (Heritage Traits)
 * - SPEC-080 (Rivalry Upgrade)
 * - SPEC-081 (Filhos Regen)
 *
 * Invariante RFCT-005:
 * - Mesma ordem de execução que startNewSeason original
 * - Mutações no engine via referência
 * - Zero mudança comportamental
 */

import { compute as computeHallOfLegends } from '../../engine/HallOfLegendsSystem';
import { EngineLogger } from '../../engine/EngineLogger.js';

export function processHallOfLegends(engine, team) {
  try {
    const historicPlayers = team.squad.map(p => ({
      id: p.id,
      name: p.name,
      apps: p.career?.totalApps || 0,
      goals: p.career?.totalGoals || 0,
      morale: p.moral || 50,
      fromBase: p.isYouth || false,
      soldToRival: false,
      hadLongInjury: false
    }));
    engine.hallOfLegends = computeHallOfLegends({
      clubId: team.id,
      players: historicPlayers
    });
  } catch (err) {
    EngineLogger.capture(err, 'SeasonProcessor._processHallOfLegends', {
      season: engine.seasonNumber
    });
  }
}
