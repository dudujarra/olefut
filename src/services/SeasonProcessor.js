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

import { applyEvent as applyManagerEvent } from '../engine/ManagerIdentitySystem';
import { generate as generateContract, resolve as resolveContract } from '../engine/ContractGoalSystem';
import { BoardSystem } from '../engine/BoardSystem';
import { evaluateSponsor, processPromoRelegation } from '../engine/SeasonSystem';
import { closeSeasonStats, calculateSeasonAwards } from '../engine/PlayerTraits';
import { ageSquad } from '../engine/PlayerDevelopment';
import { apply as applyBoardTension } from '../engine/BoardTensionSystem';
import { generate as generateChronicle } from '../engine/ChronicleSystem';
import { compute as computeHallOfLegends } from '../engine/HallOfLegendsSystem';
import { inherit as inheritTraits } from '../engine/HeritageTraitSystem';
import { evaluate as evaluateRivalry } from '../engine/RivalryUpgradeSystem';
import { evaluate as evaluateFilhosRegen } from '../engine/FilhosRegenSystem';

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
        const pos = (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length;

        // Legacy: titles + reputation
        this._processLegacy(engine, team, standings, pos);

        // SPEC-070: update manager reputation + career history
        this._processManagerIdentity(engine, team, pos);

        // SPEC-071: resolve contract goals
        this._processContractGoals(engine, team, standings, pos);

        // BUG-077: processPromoRelegation for ALL leagues
        this._processPromoRelegation(engine, team);

        // Close player season stats (resets seasonGoals/seasonApps etc.)
        team.squad.forEach(p => closeSeasonStats(p, engine.seasonNumber, team.name));

        // BUG-076: ageSquad — players age + handle retirement messages
        const ageEvents = ageSquad(team.squad);
        ageEvents.forEach(e => engine.weekEvents.push(e));

        // Season awards
        try {
            engine.seasonAwards = calculateSeasonAwards(team.squad, team.name, engine.seasonNumber);
            engine.seasonAwards.forEach(a => {
                engine.weekEvents.push(`${a.emoji} ${a.name}: ${a.player} (${a.value})`);
            });
        } catch { /* ignore */ }

        // Update sponsor + board for new season
        try {
            engine.currentSponsor = evaluateSponsor(team.division, pos);
            if (engine.board && !engine.board.isFired) {
                engine.board = new BoardSystem(team.division, team.balance);
            }
        } catch { /* ignore */ }

        // SPEC-072: board tension — title or contract
        this._processBoardTension(engine, pos);

        // SPEC-082: Chronicle
        this._processChronicle(engine, team, standings, pos);

        // SPEC-078: Hall of Legends
        this._processHallOfLegends(engine, team);

        // SPEC-079: Heritage Traits
        this._processHeritageTraits(engine, team);

        // SPEC-080: Rivalry Upgrade
        this._processRivalryUpgrade(engine, team);

        // SPEC-081: Filhos Regen
        this._processFilhosRegen(engine, team);
    }

    /** @private */
    _processLegacy(engine, team, standings, pos) {
        if (engine.legacy && pos > 0 && engine.managerStats) {
            const season = engine.legacy.closeSeason(
                team.name, team.division, pos,
                engine.managerStats.wins || 0,
                engine.managerStats.draws || 0,
                engine.managerStats.losses || 0
            );
            engine.weekEvents.push(`🏆 Temp ${engine.seasonNumber}: ${season.record} (${pos}º lugar)`);
            if (season.title) engine.weekEvents.push(`🎉 ${season.title}!`);
        }
    }

    /** @private */
    _processManagerIdentity(engine, team, pos) {
        try {
            const repEvent = pos === 1 ? 'national_title' : (pos <= 2 && team.division > 1 ? 'promotion' : null);
            const relegated = pos >= 19;
            if (repEvent) {
                const r = applyManagerEvent({ event: repEvent, currentReputation: engine.manager.reputation || 10 });
                engine.manager.reputation = r.reputation;
            } else if (relegated) {
                const r = applyManagerEvent({ event: 'relegation', currentReputation: engine.manager.reputation || 10 });
                engine.manager.reputation = r.reputation;
            }
            if (!Array.isArray(engine.manager.careerHistory)) engine.manager.careerHistory = [];
            engine.manager.careerHistory.push({
                clubName: team.name,
                seasonsManaged: 1,
                titlesWon: pos === 1 ? 1 : 0,
                promoted: !!(repEvent === 'promotion'),
                relegated: pos >= 19,
            });
        } catch { /* defensive */ }
    }

    /** @private */
    _processContractGoals(engine, team, standings, pos) {
        try {
            if (engine.managerContract) {
                const relegated = pos >= 19;
                const objective = engine.managerContract.objective;
                let objectiveMet = false;
                if (objective === 'title') objectiveMet = pos === 1;
                else if (objective === 'top_4') objectiveMet = pos <= 4;
                else if (objective === 'top_half') objectiveMet = pos <= Math.ceil((standings.length || 20) / 2);
                else if (objective === 'avoid_relegation') objectiveMet = !relegated;
                else if (objective === 'promotion') objectiveMet = pos <= 2 && team.division > 1;

                const resolution = resolveContract({
                    contractId: engine.managerContract.contractId,
                    objectiveMet,
                    weeksManaged: engine.currentWeek,
                    minWeeks: engine.managerContract.minWeeks,
                    managerReputation: engine.manager.reputation || 10,
                    bonusReputation: engine.managerContract.bonusReputation,
                    penaltyReputation: engine.managerContract.penaltyReputation,
                });
                engine.lastContractResolution = resolution;

                if (resolution.outcome === 'fulfilled') {
                    engine.manager.reputation = Math.min(100, (engine.manager.reputation || 10) + resolution.reputationDelta);
                    engine.weekEvents.push(`✅ Meta cumprida: ${engine.managerContract.objectiveDescription}!`);
                    if (resolution.consequence === 'bigger_club_interested') {
                        engine.weekEvents.push(`📰 Grandes clubes estão de olho em você!`);
                    }
                } else if (resolution.outcome === 'failed' && resolution.consequence === 'fired') {
                    engine.manager.reputation = Math.max(0, (engine.manager.reputation || 10) + resolution.reputationDelta);
                    engine.weekEvents.push(`❌ Meta não cumprida. O clube rescindiu seu contrato.`);
                }

                // Generate new contract for next season
                const clubTier = team.division === 1 ? 'big' : team.division === 2 ? 'mid' : 'small';
                engine.managerContract = generateContract({
                    managerId: engine.manager.teamId,
                    clubId: team.id,
                    clubTier,
                    managerReputation: engine.manager.reputation || 10,
                    contractType: resolution.outcome === 'fulfilled' ? 'renewal' : 'new_hire',
                    clubDivision: team.division,
                });
            }
        } catch { /* defensive */ }
    }

    /** @private */
    _processPromoRelegation(engine, team) {
        try {
            engine.tournaments.forEach(t => {
                if (!t.id || !/_\d+$/.test(t.id)) return;
                const lastUnder = t.id.lastIndexOf('_');
                const zone = t.id.substring(0, lastUnder);
                const div = parseInt(t.id.substring(lastUnder + 1));
                if (!zone || isNaN(div) || div < 1 || div > 4) return;
                const divStandings = engine.getStandings(zone, div);
                if (divStandings.length < 2) return;
                const changes = processPromoRelegation(
                    engine.teams, divStandings.map(s => s), zone, div
                );
                // Only surface events for bot's team
                changes.forEach(c => {
                    if (c.teamId !== team.id) return;
                    const emoji = c.action === 'promoted' ? '⬆️' : '⬇️';
                    engine.weekEvents.push(`${emoji} ${c.name} ${c.action === 'promoted' ? 'subiu' : 'caiu'} para Série ${['A','B','C','D'][c.to - 1]}`);
                });
            });
        } catch { /* defensive */ }
    }

    /** @private */
    _processBoardTension(engine, pos) {
        try {
            if (pos === 1) {
                const bt = applyBoardTension({ currentTension: engine.boardTension, eventType: 'title_won' });
                engine.boardTension = bt.newTension;
                if (bt.thresholdChanged && bt.boardMessage) engine.weekEvents.push(`🏛️ ${bt.boardMessage}`);
            }
            if (engine.lastContractResolution?.outcome === 'fulfilled') {
                const bt = applyBoardTension({ currentTension: engine.boardTension, eventType: 'contract_fulfilled' });
                engine.boardTension = bt.newTension;
            }
        } catch { /* defensive */ }
    }

    /** @private */
    _processChronicle(engine, team, standings, pos) {
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
                            worst = { diff, score: `${ourGoals}-${theirGoals}`, opponent: 'rival' };
                        }
                    }
                }
                return worst;
            })();
            const relegated = pos >= 19;
            const promoted = pos <= 2 && team.division > 1;
            const chronicle = generateChronicle({
                season: engine.seasonNumber,
                clubName: team.name,
                managerName: engine.manager.name,
                seasonData: {
                    finalPosition: pos,
                    titlesWon: pos === 1 ? [`Campeão Série ${['A','B','C','D'][team.division - 1] || 'A'}`] : [],
                    relegationOccurred: relegated,
                    promotionOccurred: promoted,
                    worstLoss,
                    wins: engine.managerStats?.wins || 0,
                    totalTeams: standings.length || 20,
                },
            });
            engine.chronicles.push(chronicle);
            engine.weekEvents.push(`📜 ${chronicle.chronicle}`);
        } catch { /* defensive */ }
    }

    /** @private */
    _processHallOfLegends(engine, team) {
        try {
            const historicPlayers = team.squad.map(p => ({
                id: p.id,
                name: p.name,
                apps: p.career?.totalApps || 0,
                goals: p.career?.totalGoals || 0,
                morale: p.moral || 50,
                fromBase: p.isYouth || false,
                soldToRival: false,
                hadLongInjury: false,
            }));
            engine.hallOfLegends = computeHallOfLegends({ clubId: team.id, players: historicPlayers });
        } catch { /* defensive */ }
    }

    /** @private */
    _processHeritageTraits(engine, team) {
        try {
            if (engine.hallOfLegends && engine.hallOfLegends.filledCount > 0) {
                const youths = team.squad.filter(p => p.age <= 18 && !p._heritageApplied);
                youths.forEach(y => {
                    const heritage = inheritTraits({ clubId: team.id, hall: engine.hallOfLegends });
                    if (heritage.inheritedFrom.length > 0) {
                        y.heritageTraits = heritage.traits;
                        y._heritageApplied = true;
                        engine.weekEvents.push(`🧬 ${y.name}: ${heritage.inheritanceNarrative}`);
                    }
                });
            }
        } catch { /* defensive */ }
    }

    /** @private */
    _processRivalryUpgrade(engine, team) {
        try {
            for (const key in engine.rivalryHistory) {
                const history = engine.rivalryHistory[key];
                if (history.length < 3) continue;
                const [aIdStr, bIdStr] = key.split('_');
                const aId = parseInt(aIdStr);
                const bId = parseInt(bIdStr);
                if (aId !== team.id && bId !== team.id) continue;
                const rivalry = evaluateRivalry({ clubAId: aId, clubBId: bId, history });
                if (rivalry.namedRivalry && rivalry.activeArc) {
                    const oppId = aId === team.id ? bId : aId;
                    const oppTeam = engine.getTeam(oppId);
                    const oppName = oppTeam?.name || 'Rival';
                    engine.weekEvents.push(`⚔️ Rivalidade com ${oppName}: ${rivalry.activeArc.name} (score ${rivalry.rivalryScore})`);
                }
            }
        } catch { /* defensive */ }
    }

    /** @private */
    _processFilhosRegen(engine, team) {
        try {
            if (engine.formerCompanions.length > 0) {
                const filhos = evaluateFilhosRegen({
                    managerId: engine.manager.teamId,
                    saveYear: 2026 + engine.seasonNumber,
                    season: engine.seasonNumber,
                    formerCompanions: engine.formerCompanions,
                });
                if (filhos.regenAvailable && filhos.regen) {
                    const regen = filhos.regen;
                    const regenPlayer = {
                        id: regen.id,
                        name: regen.name,
                        position: regen.position,
                        ovr: regen.ovr,
                        age: regen.age,
                        energy: 100,
                        moral: 70,
                        isTitular: false,
                        isYouth: true,
                        parentId: regen.parentId,
                        parentName: regen.parentName,
                        contract: { weeksLeft: 76, salary: 5000 },
                        injury: null,
                    };
                    team.squad.push(regenPlayer);
                    engine.weekEvents.push(`👶 ${regen.name} emergiu da base! ${regen.loreDescription}`);
                }
            }
        } catch { /* defensive */ }
    }
}
