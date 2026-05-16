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

import { inherit as inheritTraits } from '../../engine/HeritageTraitSystem';
import { EngineLogger } from '../../engine/EngineLogger.js';

export function processHeritageTraits(engine, team) {
  try {
    if (engine.hallOfLegends && engine.hallOfLegends.filledCount > 0) {
      const youths = team.squad.filter(p => p.age <= 18 && !p._heritageApplied);
      youths.forEach(y => {
        const heritage = inheritTraits({
          clubId: team.id,
          hall: engine.hallOfLegends
        });
        if (heritage.inheritedFrom.length > 0) {
          y.heritageTraits = heritage.traits;
          y._heritageApplied = true;
          engine.weekEvents.push(`🧬 ${y.name}: ${heritage.inheritanceNarrative}`);
        }
      });
    }
  } catch (err) {
    EngineLogger.capture(err, 'SeasonProcessor._processHeritageTraits', {
      season: engine.seasonNumber
    });
  }
}
