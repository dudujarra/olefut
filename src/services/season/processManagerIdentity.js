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

import { applyEvent as applyManagerEvent } from '../../engine/ManagerIdentitySystem';
import { EngineLogger } from '../../engine/EngineLogger.js';

export function processManagerIdentity(engine, team, pos) {
  try {
    const repEvent = pos === 1 ? 'national_title' : pos <= 2 && team.division > 1 ? 'promotion' : null;
    const relegated = pos >= 19;
    if (repEvent) {
      const r = applyManagerEvent({
        event: repEvent,
        currentReputation: engine.manager.reputation || 10
      });
      engine.manager.reputation = r.reputation;
    } else if (relegated) {
      const r = applyManagerEvent({
        event: 'relegation',
        currentReputation: engine.manager.reputation || 10
      });
      engine.manager.reputation = r.reputation;
    }
    if (!Array.isArray(engine.manager.careerHistory)) engine.manager.careerHistory = [];
    engine.manager.careerHistory.push({
      clubName: team.name,
      seasonsManaged: 1,
      titlesWon: pos === 1 ? 1 : 0,
      promoted: !!(repEvent === 'promotion'),
      relegated: pos >= 19
    });
    // Cap careerHistory to 50 items
    if (engine.manager.careerHistory.length > 50) engine.manager.careerHistory.shift();
  } catch (err) {
    EngineLogger.capture(err, 'SeasonProcessor._processManagerIdentity', {
      season: engine.seasonNumber
    });
  }
}
