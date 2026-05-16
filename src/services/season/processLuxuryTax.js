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

import { EngineLogger } from '../../engine/EngineLogger.js';

export function processLuxuryTax(engine, team) {
  try {
    // Progressive Luxury Tax — escalonado como imposto de renda real.
    // Brackets: 100M-500M (15%), 500M-1B (30%), >1B (50%)
    const BRACKETS = [{
      threshold: 100_000_000,
      cap: 500_000_000,
      rate: 0.15
    }, {
      threshold: 500_000_000,
      cap: 1_000_000_000,
      rate: 0.30
    }, {
      threshold: 1_000_000_000,
      cap: Infinity,
      rate: 0.50
    }];
    if (team.balance <= BRACKETS[0].threshold) return;
    let totalTax = 0;
    let remaining = team.balance;
    for (const bracket of BRACKETS) {
      if (remaining <= bracket.threshold) break;
      const taxableInBracket = Math.min(remaining, bracket.cap) - bracket.threshold;
      if (taxableInBracket > 0) {
        totalTax += Math.floor(taxableInBracket * bracket.rate);
      }
    }
    if (totalTax > 0) {
      team.balance -= totalTax;
      engine.weekEvents.push(`💸 Custo de Infraestrutura Progressivo: R$ ${(totalTax / 1_000_000).toFixed(1)}M (saldo pré-imposto: R$ ${((team.balance + totalTax) / 1_000_000).toFixed(0)}M)`);
    }
  } catch (err) {
    EngineLogger.capture(err, 'SeasonProcessor._processLuxuryTax', {
      season: engine.seasonNumber
    });
  }
}
