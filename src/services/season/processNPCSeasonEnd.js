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

import { calcPrestige } from '../../engine/AmbitionEngine';

export function processNPCSeasonEnd(engine, playerTeam) {
  try {
    const SEASON_BUDGET_BY_DIV = {
      1: 12_000_000,
      2: 5_000_000,
      3: 2_000_000,
      4: 800_000
    };
    for (const t of engine.teams || []) {
      // Prestige recalc
      t._prestige = calcPrestige(t);

      // Budget injection (TV money): NPCs ganham orçamento sazonal
      if (t.id !== playerTeam?.id) {
        const seasonBudget = SEASON_BUDGET_BY_DIV[t.division] || 800_000;
        t.balance = (t.balance || 0) + seasonBudget;
        // Cap NPC balance to prevent infinite accumulation
        t.balance = Math.min(t.balance, seasonBudget * 5);
      }

      // Contract aging + free agents for ALL teams
      for (const p of t.squad || []) {
        // Incrementar tempo no clube
        p._seasonsAtClub = (p._seasonsAtClub || 0) + 1;

        // Contract aging: diminui weeksLeft
        if (p.contract) {
          p.contract.weeksLeft = (p.contract.weeksLeft || 52) - 38; // 1 season ≈ 38 weeks
          // Contract expired → free agent (NPC only)
          if (p.contract.weeksLeft <= 0 && t.id !== playerTeam?.id) {
            p._contractExpired = true;
          }
        }
      }

      // Remove expired NPC contracts → move to market pool
      if (t.id !== playerTeam?.id) {
        const expired = (t.squad || []).filter(p => p._contractExpired);
        expired.forEach(p => {
          delete p._contractExpired;
          p.contract = {
            weeksLeft: 0
          };
          // Add to market pool as free agent
          if (engine.marketPlayers) {
            engine.marketPlayers.push({
              ...p,
              salary: Math.floor((p.salary || 5000) * 0.7)
            });
          }
        });
        t.squad = (t.squad || []).filter(p => !p._contractExpired);
      }
    }

    // BUG-FIX: Cap market pool to prevent unbounded growth across 10,000 seasons
    if (engine.marketPlayers && engine.marketPlayers.length > 150) {
      engine.marketPlayers.sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
      engine.marketPlayers = engine.marketPlayers.slice(0, 150);
    }
  } catch (err) {
    console.warn('[SeasonProcessor] NPC season end error:', err.message);
  }
}
