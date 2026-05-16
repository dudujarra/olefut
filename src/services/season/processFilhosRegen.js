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

import { evaluate as evaluateFilhosRegen } from '../../engine/FilhosRegenSystem';
import { EngineLogger } from '../../engine/EngineLogger.js';

export function processFilhosRegen(engine, team) {
  try {
    if (engine.formerCompanions.length > 0) {
      const filhos = evaluateFilhosRegen({
        managerId: engine.manager.teamId,
        saveYear: 2026 + engine.seasonNumber,
        season: engine.seasonNumber,
        formerCompanions: engine.formerCompanions
      });
      if (filhos.regenAvailable && filhos.regen) {
        const regen = filhos.regen;
        const regenPlayer = {
          id: regen.id,
          name: regen.name,
          position: regen.position,
          ovr: regen.ovr,
          age: regen.age,
          energy: 100,
          moral: 70,
          isTitular: false,
          isYouth: true,
          parentId: regen.parentId,
          parentName: regen.parentName,
          contract: {
            weeksLeft: 76,
            salary: 5000
          },
          injury: null
        };
        team.squad.push(regenPlayer);
        engine.weekEvents.push(`👶 ${regen.name} emergiu da base! ${regen.loreDescription}`);
      }
    }
  } catch (err) {
    EngineLogger.capture(err, 'SeasonProcessor._processFilhosRegen', {
      season: engine.seasonNumber
    });
  }
}
