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

import { apply as applyBoardTension } from '../../engine/BoardTensionSystem';
import { EngineLogger } from '../../engine/EngineLogger.js';

export function processBoardTension(engine, pos) {
  try {
    if (pos === 1) {
      const bt = applyBoardTension({
        currentTension: engine.boardTension,
        eventType: 'title_won'
      });
      engine.boardTension = bt.newTension;
      if (bt.thresholdChanged && bt.boardMessage) engine.weekEvents.push(`🏛️ ${bt.boardMessage}`);
    }
    if (engine.lastContractResolution?.outcome === 'fulfilled') {
      const bt = applyBoardTension({
        currentTension: engine.boardTension,
        eventType: 'contract_fulfilled'
      });
      engine.boardTension = bt.newTension;
    }
  } catch (err) {
    EngineLogger.capture(err, 'SeasonProcessor._processBoardTension', {
      season: engine.seasonNumber
    });
  }
}
