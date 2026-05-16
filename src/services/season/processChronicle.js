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

import { generate as generateChronicle } from '../../engine/ChronicleSystem';
import { EngineLogger } from '../../engine/EngineLogger.js';

export function processChronicle(engine, team, standings, pos) {
  try {
    const worstLoss = (() => {
      let worst = null;
      for (const key in engine.rivalryHistory) {
        for (const m of engine.rivalryHistory[key]) {
          if (m.season !== engine.seasonNumber) continue;
          const aIsUs = key.startsWith(`${team.id}_`);
          const ourGoals = aIsUs ? m.clubAScore : m.clubBScore;
          const theirGoals = aIsUs ? m.clubBScore : m.clubAScore;
          const diff = theirGoals - ourGoals;
          if (diff >= 4 && (!worst || diff > worst.diff)) {
            worst = {
              diff,
              score: `${ourGoals}-${theirGoals}`,
              opponent: 'rival'
            };
          }
        }
      }
      return worst;
    })();
    const relegated = pos >= 19;
    const promoted = pos <= 2 && team.division > 1;
    // SPEC-F4.1: enriquecer seasonData com top scorer + star + key events
    const topScorer = (() => {
      if (!Array.isArray(team.squad)) return null;
      const sorted = [...team.squad].filter(p => (p.seasonGoals || 0) > 0).sort((a, b) => (b.seasonGoals || 0) - (a.seasonGoals || 0));
      if (sorted.length === 0) return null;
      return {
        name: sorted[0].name,
        goals: sorted[0].seasonGoals
      };
    })();
    const starPlayer = (() => {
      if (!engine.starPlayerId) return null;
      const sp = (team.squad || []).find(p => p.id === engine.starPlayerId);
      if (!sp) return null;
      return {
        name: sp.name,
        goals: sp.seasonGoals || 0,
        apps: sp.seasonApps || 0
      };
    })();
    const chronicle = generateChronicle({
      season: engine.seasonNumber,
      clubName: team.name,
      managerName: engine.manager.name,
      seasonData: {
        finalPosition: pos,
        titlesWon: pos === 1 ? [`Campeão Série ${['A', 'B', 'C', 'D'][team.division - 1] || 'A'}`] : [],
        relegationOccurred: relegated,
        promotionOccurred: promoted,
        worstLoss,
        wins: engine.managerStats?.wins || 0,
        totalTeams: standings.length || 20,
        topScorer,
        starPlayer
      }
    });
    if (!engine.chronicles) engine.chronicles = [];
    engine.chronicles.push(chronicle);
    if (engine.chronicles.length > 50) engine.chronicles.shift();
    engine.weekEvents.push(`📜 ${chronicle.chronicle}`);
    // SPEC-B3: trigger full-screen Chronicle modal next tick
    engine.pendingChronicleSeason = chronicle;
  } catch (err) {
    console.error(err); EngineLogger.capture(err, 'SeasonProcessor._processChronicle', {
      season: engine.seasonNumber
    });
  }
}
