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

import { generate as generateContract, resolve as resolveContract } from '../../engine/ContractGoalSystem';
import { EngineLogger } from '../../engine/EngineLogger.js';

export function processContractGoals(engine, team, standings, pos) {
  try {
    if (engine.managerContract) {
      const relegated = pos >= 19;
      const objective = engine.managerContract.objective;
      let objectiveMet = false;
      if (objective === 'title') objectiveMet = pos === 1;else if (objective === 'top_4') objectiveMet = pos <= 4;else if (objective === 'top_half') objectiveMet = pos <= Math.ceil((standings.length || 20) / 2);else if (objective === 'avoid_relegation') objectiveMet = !relegated;else if (objective === 'promotion') objectiveMet = pos <= 2 && team.division > 1;
      const resolution = resolveContract({
        contractId: engine.managerContract.contractId,
        objectiveMet,
        weeksManaged: engine.currentWeek,
        minWeeks: engine.managerContract.minWeeks,
        managerReputation: engine.manager.reputation || 10,
        bonusReputation: engine.managerContract.bonusReputation,
        penaltyReputation: engine.managerContract.penaltyReputation
      });
      engine.lastContractResolution = resolution;
      if (resolution.outcome === 'fulfilled') {
        engine.manager.reputation = Math.min(100, (engine.manager.reputation || 10) + resolution.reputationDelta);
        engine.weekEvents.push(`✅ Meta cumprida: ${engine.managerContract.objectiveDescription}!`);
        if (resolution.consequence === 'bigger_club_interested') {
          engine.weekEvents.push(`📰 Grandes clubes estão de olho em você!`);
        }
      } else if (resolution.outcome === 'failed' && resolution.consequence === 'fired') {
        engine.manager.reputation = Math.max(0, (engine.manager.reputation || 10) + resolution.reputationDelta);
        engine.weekEvents.push(`❌ Meta não cumprida. O clube rescindiu seu contrato.`);
      }

      // Generate new contract for next season
      const clubTier = team.division === 1 ? 'big' : team.division === 2 ? 'mid' : 'small';
      engine.managerContract = generateContract({
        managerId: engine.manager.teamId,
        clubId: team.id,
        clubTier,
        managerReputation: engine.manager.reputation || 10,
        contractType: resolution.outcome === 'fulfilled' ? 'renewal' : 'new_hire',
        clubDivision: team.division
      });
    }
  } catch (err) {
    EngineLogger.capture(err, 'SeasonProcessor._processContractGoals', {
      season: engine.seasonNumber
    });
  }
}
