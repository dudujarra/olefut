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

import { BoardSystem } from '../engine/BoardSystem';
import { evaluateSponsor } from '../engine/SeasonSystem';
import { getDifficulty } from '../engine/systems/DifficultyModes.js';
import { closeSeasonStats, calculateSeasonAwards } from '../engine/PlayerTraits';
import { ageSquad } from '../engine/PlayerDevelopment';
import { rng as systemRng } from '../engine/rng.js';
import { saveAllBrains } from './learning/BrainPersistence';
import { EngineLogger } from '../engine/EngineLogger.js';
import { processLegacy } from './season/processLegacy.js';
import { processManagerIdentity } from './season/processManagerIdentity.js';
import { processContractGoals } from './season/processContractGoals.js';
import { handlePromoRelegation } from './season/processPromoRelegation.js';

import { processBoardTension } from './season/processBoardTension.js';
import { processChronicle } from './season/processChronicle.js';
import { processHallOfLegends } from './season/processHallOfLegends.js';
import { processHeritageTraits } from './season/processHeritageTraits.js';
import { processRivalryUpgrade } from './season/processRivalryUpgrade.js';
import { processFilhosRegen } from './season/processFilhosRegen.js';
import { processLuxuryTax } from './season/processLuxuryTax.js';
import { processMetaProgression } from './season/processMetaProgression.js';
import { processTournamentPrizes } from './season/processTournamentPrizes.js';
export class SeasonProcessor {
  /**
   * Processa transição de temporada para o time do manager.
   *
   * @param {Engine} engine — referência mutável
   */
  process(engine) {
    const team = engine.getTeam(engine.manager?.teamId);
    if (!team || engine.mode !== 'manager') return;
    const standings = engine.getStandings(team.zone, team.division);
    const pos = standings.findIndex(s => s.teamId === team.id) + 1 || standings.length;

    // Legacy: titles + reputation
    processLegacy(engine, team, standings, pos);

    // SPEC-070: update manager reputation + career history
    processManagerIdentity(engine, team, pos);

    // SPEC-071: resolve contract goals
    processContractGoals(engine, team, standings, pos);

    // BUG-077: processPromoRelegation for ALL leagues
    handlePromoRelegation(engine, team);

    // Tournament prize money for cups
    processTournamentPrizes(engine, team);

    // Close player season stats (resets seasonGoals/seasonApps etc.)
    team.squad.forEach(p => closeSeasonStats(p, engine.seasonNumber, team.name));

    // BUG-076: ageSquad — players age + handle retirement messages
    const ageEvents = ageSquad(team.squad);
    ageEvents.forEach(e => engine.weekEvents.push(e));

    // BUG-FIX: Market players also age at end of season — prevents frozen free agents
    if (engine.marketPlayers && engine.marketPlayers.length > 0) {
      const marketAgeEvents = ageSquad(engine.marketPlayers);
      // Remove retired market players and replenish
      const retiredIds = marketAgeEvents.filter(e => typeof e === 'string' && e.includes('aposentou')).length;
      engine.marketPlayers = engine.marketPlayers.filter(p => !p._retired);
      // Replenish pool to maintain 20 players
      if (typeof engine.generateMarket === 'function' && engine.marketPlayers.length < 15) {
        engine.generateMarket();
      }
    }

    // Season awards
    try {
      engine.seasonAwards = calculateSeasonAwards(team.squad, team.name, engine.seasonNumber);
      engine.seasonAwards.forEach(a => {
        engine.weekEvents.push(`${a.emoji} ${a.name}: ${a.player} (${a.value})`);
      });
    } catch (err) {
      EngineLogger.capture(err, 'SeasonProcessor.seasonAwards', {
        season: engine.seasonNumber
      });
    }

    // Update sponsor + board for new season
    try {
      engine.currentSponsor = evaluateSponsor(team.division, pos);
      if (engine.board && !engine.board.isFired) {
        const diff = getDifficulty();
        engine.board = new BoardSystem(team.division, team.balance, {
          fireCooldown: diff.modifiers.boardFireCooldown || 0,
          boardPatience: diff.modifiers.boardPatience || 1.0,
          currentWeek: engine.currentWeek || 0
        });
      }
    } catch (err) {
      EngineLogger.capture(err, 'SeasonProcessor.sponsorBoard', {
        season: engine.seasonNumber
      });
    }

    // SPEC-072: board tension — title or contract
    processBoardTension(engine, pos);

    // SPEC-082: Chronicle
    processChronicle(engine, team, standings, pos);

    // SPEC-078: Hall of Legends
    processHallOfLegends(engine, team);

    // SPEC-079: Heritage Traits
    processHeritageTraits(engine, team);

    // SPEC-080: Rivalry Upgrade
    processRivalryUpgrade(engine, team);

    // SPEC-081: Filhos Regen
    processFilhosRegen(engine, team);

    // Luxury Tax (Wealth cap to prevent broken late-game economies)
    processLuxuryTax(engine, team);

    // §14.3: Meta-Progression — evaluate cross-career achievements at season end
    processMetaProgression(engine, team, pos);
  }

/** @private §16.2: Find top scorer for trophy ceremony */
  _findTopScorer(team) {
    if (!team?.squad?.length) return null;
    let best = null;
    for (const p of team.squad) {
      const goals = p.career?.seasonGoals ?? p.seasonGoals ?? 0;
      if (!best || goals > best.goals) {
        best = {
          name: p.name,
          goals
        };
      }
    }
    return best?.goals > 0 ? best : null;
  }

/**
   * SPEC-200: Processa fim de temporada para TODOS os times NPC.
   * - Recalcula prestige de cada time
   * - Ajusta budgets baseado em divisão (TV money)
   * - Envelhece contratos de NPC → gera free agents
   * - Incrementa _seasonsAtClub dos jogadores
   */

/** @private §14.3: Meta-Progression — evaluate achievements at season end */

/** @private — Award prize money for cup participation/victory */

// ========================================================================
  // RFCT-019.8: Full season rollover (extracted from engine.startNewSeason)
  // ========================================================================

  /**
   * Full season rollover: chama process() + emergency squad replenish +
   * re-init leagues + re-qualify continental cups + brain persistence + week reset.
   *
   * Extraído de engine.startNewSeason (135 LOC).
   */
  rolloverSeason(engine) {
    // Season-end processing (parte central — já existe via process)
    try {
      this.process(engine);
    } catch (err) {
      EngineLogger.capture(err, 'SeasonProcessor.rolloverSeason.process', {
        season: engine.seasonNumber
      });
    }

    // MARL Fase 6: Persist all NPC brains at season end
    try {
      saveAllBrains(engine.teams);
    } catch (err) {
      EngineLogger.capture(err, 'SeasonProcessor.rolloverSeason.saveAllBrains');
    }
    engine.currentWeek = 0;
    engine.seasonNumber++;

    // BUG-FIX: Clear or cap arrays to prevent unbounded memory growth across 10,000-season soak tests
    engine.transferOffers = [];
    engine._ambitionTransferRequests = [];
    if (engine.seasonHistory && engine.seasonHistory.length > 50) {
      engine.seasonHistory = engine.seasonHistory.slice(-50);
    }
    if (engine.chronicles && engine.chronicles.length > 50) {
      engine.chronicles = engine.chronicles.slice(-50);
    }
    if (engine.manager?.careerHistory && engine.manager.careerHistory.length > 50) {
      engine.manager.careerHistory = engine.manager.careerHistory.slice(-50);
    }
    if (engine.legacy?.titles && engine.legacy.titles.length > 200) {
      engine.legacy.titles = engine.legacy.titles.slice(-200);
    }

    // BUG-FIX: Cap narrative arrays to prevent unbounded memory growth
    if (engine.events && engine.events.length > 200) engine.events = engine.events.slice(-200);
    if (engine.decisions && engine.decisions.length > 200) engine.decisions = engine.decisions.slice(-200);
    if (engine.arcs && engine.arcs.length > 50) {
      const openArcs = engine.arcs.filter(a => a.status === 'open');
      const closedArcs = engine.arcs.filter(a => a.status !== 'open').slice(-50);
      engine.arcs = [...openArcs, ...closedArcs];
    }

    // BUG-FIX: Prune dormant rivalryHistory to prevent key bloat
    if (engine.rivalryHistory) {
      for (const key in engine.rivalryHistory) {
        const history = engine.rivalryHistory[key];
        if (history && history.length > 0) {
          const lastMatch = history[history.length - 1];
          // If the last match was more than 2 seasons ago, purge the rivalry memory
          if (engine.seasonNumber - (lastMatch.season || 0) > 2) {
            delete engine.rivalryHistory[key];
          } else if (history.length > 20) {
            // Limit active rivalries to the last 20 matches to prevent infinite array growth
            engine.rivalryHistory[key] = history.slice(-20);
          }
        } else {
          delete engine.rivalryHistory[key];
        }
      }
    }

    // SPEC-135: seasonsCompleted view unlock
    engine.viewUnlockState.seasonsCompleted = engine.seasonNumber - 1;
    if (engine.managerStats) {
      // BUG-B4 FIX: Reset only per-season counters. Preserve career-persistent fields.
      const persistent = {
        tacticStreak: engine.managerStats.tacticStreak || 0,
        lastTactic: engine.managerStats.lastTactic || null,
        transferProfit: engine.managerStats.transferProfit || 0,
        giantKills: engine.managerStats.giantKills || 0,
        crisisSaves: engine.managerStats.crisisSaves || 0,
        longestUnbeaten: engine.managerStats.longestUnbeaten || 0,
        consecutiveTitles: engine.managerStats.consecutiveTitles || 0
      };
      engine.managerStats = {
        wins: 0,
        draws: 0,
        losses: 0,
        streak: 0,
        lossStreak: 0,
        rollingForm: [],
        goalsFor: 0,
        goalsAgainst: 0,
        cleanSheets: 0,
        ...persistent
      };
    }

    // BUG-040: emergency squad replenish if critically short (<16) — ONLY NPCs during rollover
    try {
      engine.teams.forEach(team => {
        if (team.squad.length < 16 && team.id !== engine.manager?.teamId) {
          // NPCs get emergency base players to keep the league running
          engine.weekEvents.push(`🚨 Plantel do ${team.name} caiu para ${team.squad.length} jogadores. Reposição de emergência ativada.`);
          while (team.squad.length < 16) {
            team.squad.push({
              id: `emerg-${team.id}-${Date.now()}-${systemRng()}`,
              name: `Base ${Math.floor(systemRng() * 100)}`,
              age: 16 + Math.floor(systemRng() * 3),
              position: ['GOL', 'DEF', 'MEI', 'ATA'][Math.floor(systemRng() * 4)],
              ovr: Math.floor(team.division === 1 ? 50 : 35),
              potential: Math.floor(60 + systemRng() * 20),
              salary: Math.floor(team.division === 1 ? 8000 : 2000),
              contract: {
                weeksLeft: 76,
                salary: 2000
              },
              isTitular: false,
              energy: 100,
              moral: 50,
              seasonGoals: 0,
              seasonApps: 0
            });
          }
        }
      });
    } catch (err) {
      EngineLogger.capture(err, 'SeasonProcessor.rolloverSeason.emergencyReplenish', {
        season: engine.seasonNumber
      });
    }

    // Capture final Série A standings BEFORE league re-init
    const finalDiv1Standings = {};
    try {
      const zones = [...new Set(engine.teams.map(t => t.zone))];
      zones.forEach(z => {
        const st = engine.getStandings(z, 1);
        if (st.length > 0) finalDiv1Standings[z] = st.map(s => s.teamId);
      });
    } catch (err) {
      EngineLogger.capture(err, 'SeasonProcessor.rolloverSeason.finalStandings', {
        season: engine.seasonNumber
      });
    }

    // Copa do Brasil winner → Libertadores spot
    let copaBrWinnerId = null;
    try {
      const copa = engine.getTournament('COPA_BR');
      if (copa?.winner) copaBrWinnerId = copa.winner;
    } catch (err) {
      EngineLogger.capture(err, 'SeasonProcessor.rolloverSeason.copaBrWinner', {
        season: engine.seasonNumber
      });
    }

    // BUG-076: Re-init leagues by current team.division
    engine.tournaments.forEach(t => {
      try {
        if (typeof t.init === 'function') {
          let teamIds;
          if (t.id && /_\d+$/.test(t.id)) {
            const lastUnder = t.id.lastIndexOf('_');
            const zone = t.id.substring(0, lastUnder);
            const div = parseInt(t.id.substring(lastUnder + 1));
            if (zone && !isNaN(div) && div >= 1 && div <= 4) {
              teamIds = engine.teams.filter(tm => tm.zone === zone && tm.division === div).map(tm => tm.id);
            }
          }
          // Skip continental cups + national cups + mundial — re-qualified separately below
          const SKIP_IDS = ['LIBERTADORES', 'SULA', 'CHAMPIONS', 'EUROPA', 'WORLD_CUP', 'COPA_BR', 'COPA_ARG', 'COPA_URU', 'COPA_CHI', 'COPA_COL', 'FA_CUP', 'COPA_REY', 'COPPA_ITA', 'DFB_POKAL', 'COUPE_FRA'];
          if (SKIP_IDS.includes(t.id)) return;
          if (!teamIds || teamIds.length === 0) {
            teamIds = (t.standings || []).map(s => s.teamId).filter(Boolean);
          }
          if (teamIds.length > 0) t.init(teamIds);
        }
      } catch (err) {
        EngineLogger.capture(err, 'SeasonProcessor.rolloverSeason.leagueReInit', {
          tournamentId: t.id
        });
      }
    });

    // Re-qualify continental cups from final div 1 standings
    try {
      const saZones = ['BRA', 'ARG', 'URU', 'CHI', 'COL'];
      const libTeams = [];
      const sulaTeams = [];
      saZones.forEach(z => {
        const st = finalDiv1Standings[z] || [];
        if (z === 'BRA') {
          const top4 = st.slice(0, 4);
          if (copaBrWinnerId && !top4.includes(copaBrWinnerId)) {
            const displaced = top4[3];
            top4[3] = copaBrWinnerId;
            sulaTeams.push(displaced);
          }
          libTeams.push(...top4);
          sulaTeams.push(...st.slice(4, 8));
        } else {
          libTeams.push(...st.slice(0, 4));
          sulaTeams.push(...st.slice(4, 6));
        }
      });
      const lib = engine.getTournament('LIBERTADORES');
      if (lib && libTeams.length >= 4) lib.init(libTeams);
      const sula = engine.getTournament('SULA');
      if (sula && sulaTeams.length >= 4) sula.init(sulaTeams);
      const euZones = ['ENG', 'ESP', 'ITA', 'GER', 'FRA'];
      const clTeams = [];
      const elTeams = [];
      euZones.forEach(z => {
        const st = finalDiv1Standings[z] || [];
        clTeams.push(...st.slice(0, 4));
        elTeams.push(...st.slice(4, 6));
      });
      const cl = engine.getTournament('CHAMPIONS');
      if (cl && clTeams.length >= 4) cl.init(clTeams);

      // SPEC-180: Europa League re-qualification
      const el = engine.getTournament('EUROPA');
      if (el && elTeams.length >= 4) el.init(elTeams);
    } catch (err) {
      EngineLogger.capture(err, 'SeasonProcessor.rolloverSeason.continentalReQualify', {
        season: engine.seasonNumber
      });
    }

    // SPEC-180: Re-init national cups for all countries
    try {
      const CUP_ZONE_MAP = {
        'COPA_BR': 'BRA',
        'COPA_ARG': 'ARG',
        'COPA_URU': 'URU',
        'COPA_CHI': 'CHI',
        'COPA_COL': 'COL',
        'FA_CUP': 'ENG',
        'COPA_REY': 'ESP',
        'COPPA_ITA': 'ITA',
        'DFB_POKAL': 'GER',
        'COUPE_FRA': 'FRA'
      };
      for (const [cupId, zone] of Object.entries(CUP_ZONE_MAP)) {
        const cup = engine.getTournament(cupId);
        if (!cup) continue;
        const zoneTeams = engine.teams.filter(t => t.zone === zone).map(t => t.id);
        if (zoneTeams.length >= 4) cup.init(zoneTeams);
      }
    } catch (err) {
      EngineLogger.capture(err, 'SeasonProcessor.rolloverSeason.nationalCups', {
        season: engine.seasonNumber
      });
    }

    // SPEC-180: World Club Cup qualification
    try {
      const mundial = engine.getTournament('WORLD_CUP');
      if (mundial && typeof mundial.qualify === 'function') {
        mundial.qualify(engine);
      }
    } catch (err) {
      EngineLogger.capture(err, 'SeasonProcessor.rolloverSeason.worldCup', {
        season: engine.seasonNumber
      });
    }
  }
}