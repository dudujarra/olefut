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

import { evaluate as evaluateRivalry } from '../../engine/RivalryUpgradeSystem';
import { EngineLogger } from '../../engine/EngineLogger.js';

export function processRivalryUpgrade(engine, team) {
  try {
    for (const key in engine.rivalryHistory) {
      const history = engine.rivalryHistory[key];
      if (history.length < 3) continue;
      const [aIdStr, bIdStr] = key.split('_');
      const aId = parseInt(aIdStr);
      const bId = parseInt(bIdStr);
      if (aId !== team.id && bId !== team.id) continue;
      const rivalry = evaluateRivalry({
        clubAId: aId,
        clubBId: bId,
        history
      });
      if (rivalry.namedRivalry && rivalry.activeArc) {
        const oppId = aId === team.id ? bId : aId;
        const oppTeam = engine.getTeam(oppId);
        const oppName = oppTeam?.name || 'Rival';
        engine.weekEvents.push(`⚔️ Rivalidade com ${oppName}: ${rivalry.activeArc.name} (score ${rivalry.rivalryScore})`);
      }
    }
  } catch (err) {
    EngineLogger.capture(err, 'SeasonProcessor._processRivalryUpgrade', {
      season: engine.seasonNumber
    });
  }
}
