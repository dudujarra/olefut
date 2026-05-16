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

import { evaluateAchievements } from '../../engine/MetaProgression';
import { EngineLogger } from '../../engine/EngineLogger.js';

export function processMetaProgression(engine, team, pos) {
  try {
    const stats = {
      titlesWon: engine.legacy?.titles?.length || 0,
      cupsWon: engine.legacy?.titles?.filter(t => t.includes('Copa'))?.length || 0,
      youthPromoted: team.squad.filter(p => p.isYouth).length,
      giantKills: engine.managerStats?.giantKills || 0,
      crisisSaves: engine.managerStats?.crisisSaves || 0,
      consecutiveSeasons: engine.seasonNumber || 1,
      transferProfit: engine.managerStats?.transferProfit || 0,
      longestUnbeaten: engine.managerStats?.longestUnbeaten || 0,
      consecutiveTitles: engine.managerStats?.consecutiveTitles || 0
    };
    const result = evaluateAchievements(stats);
    if (result.newlyUnlocked.length > 0) {
      result.newlyUnlocked.forEach(ach => {
        engine.weekEvents.push(`${ach.emoji} CONQUISTA DESBLOQUEADA: ${ach.name} — ${ach.description}`);
      });
      engine.metaUnlocked = result.allUnlocked;
    }
  } catch (err) {
    EngineLogger.capture(err, 'SeasonProcessor._processMetaProgression', {
      season: engine.seasonNumber
    });
  }
}
