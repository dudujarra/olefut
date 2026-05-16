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

import { generateSeasonStory } from '../../engine/SeasonStoryEngine.js';
import { EngineLogger } from '../../engine/EngineLogger.js';

function findTopScorer(team) {
  if (!team?.squad?.length) return null;
  let best = null;
  for (const p of team.squad) {
    const goals = p.career?.seasonGoals ?? p.seasonGoals ?? 0;
    if (!best || goals > best.goals) {
      best = { name: p.name, goals };
    }
  }
  return best?.goals > 0 ? best : null;
}

export function processLegacy(engine, team, standings, pos) {
  if (engine.legacy && pos > 0 && engine.managerStats) {
    const season = engine.legacy.closeSeason(team.name, team.division, pos, engine.managerStats.wins || 0, engine.managerStats.draws || 0, engine.managerStats.losses || 0);
    engine.weekEvents.push(`🏆 Temp ${engine.seasonNumber}: ${season.record} (${pos}º lugar)`);
    if (season.title) {
      engine.weekEvents.push(`🎉 ${season.title}!`);
      // §16.2: Trophy ceremony data for full-screen celebration
      engine.trophyCeremony = {
        trophy: {
          type: 'league',
          name: season.title,
          tier: team.division
        },
        season: {
          year: engine.seasonNumber,
          wins: engine.managerStats.wins || 0,
          draws: engine.managerStats.draws || 0,
          losses: engine.managerStats.losses || 0,
          goalsFor: engine.managerStats.goalsFor || 0,
          goalsAgainst: engine.managerStats.goalsAgainst || 0,
          topScorer: findTopScorer(team)
        }
      };
    }
    // SPEC-150: gerar story da temporada (AUDIT-FIX #G: pass previousStories for arc detection)
    try {
      const story = generateSeasonStory({
        wins: engine.managerStats?.wins || 0,
        draws: engine.managerStats?.draws || 0,
        losses: engine.managerStats?.losses || 0,
        goalsFor: engine.managerStats?.goalsFor || 0,
        goalsAgainst: engine.managerStats?.goalsAgainst || 0,
        topScorer: findTopScorer(team),
        longestWinStreak: engine.stats?.insights?.longestWinStreak || 0,
        biggestWin: engine.stats?.insights?.biggestWin || null,
        position: pos,
        promoted: season?.title ? true : false,
        relegated: season?.title === 'Rebaixado',
        division: team.division,
        seasonNumber: engine.seasonNumber,
        previousStories: engine.seasonHistory || []
      });
      if (!engine.seasonHistory) engine.seasonHistory = [];
      engine.seasonHistory.push(story);
      // Cap to prevent memory leak and context bloat
      if (engine.seasonHistory.length > 10) engine.seasonHistory.shift();
      engine.weekEvents.push(`📖 ${story.headline}`);
    } catch (err) {
      EngineLogger.capture(err, 'SeasonProcessor._processLegacy.story', {
        season: engine.seasonNumber
      });
    }
  }
}
