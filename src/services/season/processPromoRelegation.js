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

import { processPromoRelegation } from '../../engine/SeasonSystem';
import { getDifficulty } from '../../engine/systems/DifficultyModes.js';
import { onRelegation, onPromotion } from '../../engine/AmbitionEngine';
import { EngineLogger } from '../../engine/EngineLogger.js';

import { processNPCSeasonEnd } from './processNPCSeasonEnd.js';

export function handlePromoRelegation(engine, team) {
  // Promotion bonus by target division (higher division = higher bonus)
  const PROMOTION_BONUS = {
    3: 2_000_000,
    // Série D → Série C: R$ 2M
    2: 5_000_000,
    // Série C → Série B: R$ 5M
    1: 15_000_000 // Série B → Série A: R$ 15M
  };

  // AUDIT-FIX #C.2: Relegation penalty — lose 30% of balance
  const RELEGATION_PENALTY_RATE = 0.30;
  try {
    engine.tournaments.forEach(t => {
      if (!t.id || !/_\d+$/.test(t.id)) return;
      const lastUnder = t.id.lastIndexOf('_');
      const zone = t.id.substring(0, lastUnder);
      const div = parseInt(t.id.substring(lastUnder + 1));
      if (!zone || isNaN(div) || div < 1 || div > 4) return;
      const divStandings = engine.getStandings(zone, div);
      if (divStandings.length < 2) return;
      const changes = processPromoRelegation(engine.teams, divStandings.map(s => s), zone, div);
      changes.forEach(c => {
        if (c.teamId !== team.id) return;
        const emoji = c.action === 'promoted' ? '⬆️' : '⬇️';
        engine.weekEvents.push(`${emoji} ${c.name} ${c.action === 'promoted' ? 'subiu' : 'caiu'} para Série ${['A', 'B', 'C', 'D'][c.to - 1]}`);

        // Award promotion bonus (scaled by difficulty economyMult)
        if (c.action === 'promoted' && PROMOTION_BONUS[c.to]) {
          const econMult = getDifficulty().modifiers.economyMult ?? 1.0;
          const bonus = Math.floor(PROMOTION_BONUS[c.to] * econMult);
          team.balance += bonus;
          engine.weekEvents.push(`💰 Bônus de acesso à Série ${['A', 'B', 'C', 'D'][c.to - 1]}: R$ ${(bonus / 1_000_000).toFixed(1)}M`);

          // SPEC-200: Ambition Engine — promoção melhora moral e pode retirar transfer requests
          try {
            const promoEvents = onPromotion(team, c.from, c.to);
            promoEvents.forEach(e => engine.weekEvents.push(e.msg));
          } catch (err) {
            EngineLogger.capture(err, 'SeasonProcessor._processPromoRelegation.promotion', {
              season: engine.seasonNumber
            });
          }
        }

        // AUDIT-FIX #C.2: Apply relegation financial penalty
        if (c.action === 'relegated' && team.balance > 0) {
          const penalty = Math.floor(team.balance * RELEGATION_PENALTY_RATE);
          team.balance -= penalty;
          engine.weekEvents.push(`💸 Multa de rebaixamento: -R$ ${(penalty / 1_000_000).toFixed(1)}M (perda de receitas, patrocínios e TV)`);

          // SPEC-200: Ambition Engine — rebaixamento causa cascade de insatisfação
          try {
            const relEvents = onRelegation(team, c.from, c.to);
            relEvents.forEach(e => {
              engine.weekEvents.push(e.msg);
              if (e.type === 'relegation_exit') {
                if (!engine._ambitionTransferRequests) engine._ambitionTransferRequests = [];
                engine._ambitionTransferRequests.push(e);
              }
            });
          } catch (err) {
            EngineLogger.capture(err, 'SeasonProcessor._processPromoRelegation.relegation', {
              season: engine.seasonNumber
            });
          }
        }
      });
    });
  } catch (err) {
    EngineLogger.capture(err, 'SeasonProcessor._processPromoRelegation', {
      season: engine.seasonNumber
    });
  }

  // SPEC-200: Process ALL NPC teams (prestige, budget, contracts)
  processNPCSeasonEnd(engine, team);
}
