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

import { getDifficulty } from '../../engine/systems/DifficultyModes.js';
import { EngineLogger } from '../../engine/EngineLogger.js';

export function processTournamentPrizes(engine, team) {
  // Prize pools by tournament ID
  const PRIZE_POOLS = {
    'COPA_BR': {
      winner: 10_000_000,
      participant: 500_000,
      name: 'Copa do Brasil'
    },
    'LIBERTADORES': {
      winner: 25_000_000,
      participant: 2_000_000,
      name: 'Libertadores'
    },
    'SULA': {
      winner: 8_000_000,
      participant: 1_000_000,
      name: 'Sul-Americana'
    },
    'CHAMPIONS': {
      winner: 30_000_000,
      participant: 3_000_000,
      name: 'Champions League'
    },
    // SPEC-180: new tournaments
    'EUROPA': {
      winner: 15_000_000,
      participant: 1_500_000,
      name: 'Europa League'
    },
    'WORLD_CUP': {
      winner: 50_000_000,
      participant: 5_000_000,
      name: 'Mundial de Clubes'
    },
    'COPA_ARG': {
      winner: 3_000_000,
      participant: 200_000,
      name: 'Copa Argentina'
    },
    'COPA_URU': {
      winner: 1_000_000,
      participant: 100_000,
      name: 'Copa Uruguay'
    },
    'COPA_CHI': {
      winner: 1_500_000,
      participant: 100_000,
      name: 'Copa Chile'
    },
    'COPA_COL': {
      winner: 2_000_000,
      participant: 150_000,
      name: 'Copa Colombia'
    },
    'FA_CUP': {
      winner: 8_000_000,
      participant: 500_000,
      name: 'FA Cup'
    },
    'COPA_REY': {
      winner: 5_000_000,
      participant: 300_000,
      name: 'Copa del Rey'
    },
    'COPPA_ITA': {
      winner: 5_000_000,
      participant: 300_000,
      name: 'Coppa Italia'
    },
    'DFB_POKAL': {
      winner: 5_000_000,
      participant: 300_000,
      name: 'DFB-Pokal'
    },
    'COUPE_FRA': {
      winner: 4_000_000,
      participant: 250_000,
      name: 'Coupe de France'
    }
  };
  try {
    engine.tournaments.forEach(t => {
      const pool = PRIZE_POOLS[t.id];
      if (!pool) return;
      if (!t.participants?.includes(team.id)) return;
      let prize = pool.participant;
      let label = `participação na ${pool.name}`;
      if (t.winner === team.id) {
        prize = pool.winner;
        label = `🏆 campeão da ${pool.name}`;
        engine.weekEvents.push(`🏆 ${team.name} é campeão da ${pool.name}!`);
        // Add to legacy titles
        if (engine.legacy?.titles) {
          engine.legacy.titles.push(`Campeão ${pool.name}`);
        }
      }

      // Scale prize by difficulty economyMult
      const econMult = getDifficulty().modifiers.economyMult ?? 1.0;
      prize = Math.floor(prize * econMult);
      team.balance += prize;
      engine.weekEvents.push(`💰 Prêmio ${label}: R$ ${(prize / 1_000_000).toFixed(1)}M`);
    });
  } catch (err) {
    EngineLogger.capture(err, 'SeasonProcessor._processTournamentPrizes', {
      season: engine.seasonNumber
    });
  }
}
