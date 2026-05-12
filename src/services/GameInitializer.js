// AKITA-RFCT-019.10: extract initGame heavy logic from engine.
//
// Stateless. Engine context. Orchestra full game initialization including:
// - Teams + squads from RealDB
// - NPC AdaptiveBrain assignment (MARL Fase 6)
// - AI Director
// - Brain restore
// - Scenario modifiers
// - Manager systems (board, legacy, sponsor, contract goals)
// - All tournaments (leagues, Copa BR, Libertadores, Sul-Americana, Champions)
// - Market generation
// - Player mode injection (proPlayer)

import { Data } from '../engine/data';
import { RealDB } from '../engine/db/index';
import { League } from '../engine/tournaments/League';
import { ContinentalCup } from '../engine/tournaments/ContinentalCup';
import { KnockoutCup } from '../engine/tournaments/KnockoutCup';
import { ProPlayer } from '../engine/PlayerCareer';
import { initNpcTacticState } from '../engine/NpcTacticAdvisor';
import { AdaptiveBrain } from './learning/AdaptiveBrain.js';
import { suggestArchetypeForClub } from './learning/Archetypes.js';
import { restoreAllBrains } from './learning/BrainPersistence.js';
import { AIDirector } from './learning/AIDirector.js';
import { generate as generateContract } from '../engine/ContractGoalSystem';
import { BoardSystem } from '../engine/BoardSystem';
import { evaluateSponsor, ManagerLegacy } from '../engine/SeasonSystem';
import { rollTraits, initCareerStats } from '../engine/PlayerTraits';
import { rng as systemRng } from '../engine/rng.js';

export class GameInitializer {
    constructor() {
        // Stateless
    }

    /**
     * Full game initialization.
     */
    init(engine, name, teamId, mode = 'manager', scenario = 'livre', playerPosition = 'ATA') {
        engine.manager.name = name;
        engine.manager.teamId = parseInt(teamId);
        engine.mode = mode;

        this._initializeTeams(engine);
        this._initializeNpcBrains(engine, parseInt(teamId));
        engine._aiDirector = new AIDirector();
        try { restoreAllBrains(engine.teams); } catch { /* ignore */ }

        if (scenario === 'fallen') {
            const team = engine.getTeam(engine.manager.teamId);
            if (team) team.balance = Math.floor(team.balance * 0.1);
        }

        if (mode === 'manager') {
            this._initializeManagerSystems(engine, name);
        }

        this._initializeLeagues(engine);
        this._initializeCups(engine);
        engine.generateMarket();

        if (mode === 'player') {
            this._initializePlayerMode(engine, name, playerPosition);
        }
    }

    _initializeTeams(engine) {
        let idCounter = 1;
        for (const zone of Object.keys(RealDB)) {
            for (const divStr of Object.keys(RealDB[zone])) {
                const div = parseInt(divStr);
                RealDB[zone][div].forEach(club => {
                    const tier = zone === 'BRA' ? div : (zone === 'ARG' || zone === 'COL' ? 1.5 : 2);
                    const squad = Data.generateSquad(tier, club.budget, club.name);
                    squad.forEach(p => {
                        p.contract = { weeksLeft: 38 + Math.floor(systemRng() * 76), salary: p.salary || 5000 };
                        p.injury = null;
                        p.moral = 50 + Math.floor(systemRng() * 20);
                        rollTraits(p);
                        initCareerStats(p);
                    });
                    engine.teams.push({
                        id: idCounter++,
                        name: club.name,
                        zone,
                        division: div,
                        squad,
                        formation: "4-3-3",
                        balance: club.budget,
                        stadium: club.stadium,
                        npcTacticState: initNpcTacticState(), // SPEC-131
                        brain: null, // MARL Fase 6
                    });
                });
            }
        }
    }

    _initializeNpcBrains(engine, playerTeamId) {
        // MARL Fase 6: AdaptiveBrain + persona por NPC
        for (const team of engine.teams) {
            if (team.id === playerTeamId) continue;
            const archetype = suggestArchetypeForClub({
                budget: team.balance || 0,
                division: team.division || 4,
                reputation: team.stadium?.capacity > 40000 ? 80 : team.division <= 2 ? 60 : 30
            });
            team.brain = new AdaptiveBrain(archetype, { skipAutoRestore: true });
        }
    }

    _initializeManagerSystems(engine, name) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return;
        engine.board = new BoardSystem(team.division, team.balance);
        engine.legacy = new ManagerLegacy(name);
        engine.currentSponsor = evaluateSponsor(team.division, 10);
        // SPEC-071: contract for new manager
        const clubTier = team.division === 1 ? 'big' : team.division === 2 ? 'mid' : 'small';
        engine.managerContract = generateContract({
            managerId: engine.manager.teamId,
            clubId: team.id,
            clubTier,
            managerReputation: engine.manager.reputation || 10,
            contractType: 'new_hire',
            clubDivision: team.division,
        });
    }

    _initializeLeagues(engine) {
        for (const zone of Object.keys(RealDB)) {
            for (const divStr of Object.keys(RealDB[zone])) {
                const div = parseInt(divStr);
                const leagueTeams = engine.teams.filter(t => t.zone === zone && t.division === div).map(t => t.id);
                const league = new League(`${zone}_${div}`, `Liga ${zone} - Div ${div}`, div);
                league.init(leagueTeams);
                engine.tournaments.push(league);
            }
        }
    }

    _initializeCups(engine) {
        // Copa do Brasil (BRA teams)
        const braTeams = engine.teams.filter(t => t.zone === 'BRA').map(t => t.id);
        const copaBrasil = new KnockoutCup('COPA_BR', 'Copa do Brasil', [4, 8, 12, 16, 20, 24, 28]);
        copaBrasil.init(braTeams);
        engine.tournaments.push(copaBrasil);

        // Libertadores
        const libTeams = [];
        libTeams.push(...engine.teams.filter(t => t.zone === 'BRA' && t.division === 1).slice(0, 4).map(t => t.id));
        if (RealDB.ARG) libTeams.push(...engine.teams.filter(t => t.zone === 'ARG' && t.division === 1).slice(0, 4).map(t => t.id));
        if (RealDB.URU) libTeams.push(...engine.teams.filter(t => t.zone === 'URU' && t.division === 1).slice(0, 2).map(t => t.id));
        if (RealDB.CHI) libTeams.push(...engine.teams.filter(t => t.zone === 'CHI' && t.division === 1).slice(0, 2).map(t => t.id));
        if (RealDB.COL) libTeams.push(...engine.teams.filter(t => t.zone === 'COL' && t.division === 1).slice(0, 4).map(t => t.id));
        const libertadores = new ContinentalCup('LIBERTADORES', 'Copa Libertadores', [5, 9, 13], [17, 21, 25]);
        libertadores.init(libTeams);
        engine.tournaments.push(libertadores);

        // Copa Sul-Americana
        const sulaTeams = [];
        sulaTeams.push(...engine.teams.filter(t => t.zone === 'BRA' && t.division === 1).slice(4, 8).map(t => t.id));
        if (RealDB.ARG) sulaTeams.push(...engine.teams.filter(t => t.zone === 'ARG' && t.division === 1).slice(4, 6).map(t => t.id));
        if (RealDB.URU) sulaTeams.push(...engine.teams.filter(t => t.zone === 'URU' && t.division === 1).slice(2, 4).map(t => t.id));
        if (RealDB.CHI) sulaTeams.push(...engine.teams.filter(t => t.zone === 'CHI' && t.division === 1).slice(2, 4).map(t => t.id));
        if (RealDB.COL) sulaTeams.push(...engine.teams.filter(t => t.zone === 'COL' && t.division === 1).slice(4, 6).map(t => t.id));
        const sulAmericana = new ContinentalCup('SULA', 'Copa Sul-Americana', [7, 11, 15], [19, 23, 27]);
        sulAmericana.init(sulaTeams.length >= 4 ? sulaTeams : libTeams.slice(4, 12));
        engine.tournaments.push(sulAmericana);

        // Champions League (top 4 each EU league)
        const clTeams = [];
        for (const z of ['ENG', 'ESP', 'ITA', 'GER', 'FRA']) {
            if (RealDB[z]) clTeams.push(...engine.teams.filter(t => t.zone === z && t.division === 1).slice(0, 4).map(t => t.id));
        }
        const champions = new ContinentalCup('CHAMPIONS', 'Champions League', [6, 10, 14], [18, 22, 26]);
        champions.init(clTeams);
        engine.tournaments.push(champions);
    }

    _initializePlayerMode(engine, name, playerPosition) {
        const team = engine.getTeam(engine.manager.teamId);
        engine.proPlayer = new ProPlayer(9999, name, playerPosition);
        if (!team) return;
        const playerInSquad = {
            id: 'pro_player',
            name: name,
            position: playerPosition,
            attacking: engine.proPlayer.attacking,
            technical: engine.proPlayer.technical,
            tactical: engine.proPlayer.tactical,
            defending: engine.proPlayer.defending,
            creativity: engine.proPlayer.creativity,
            ovr: 50,
            age: 17,
            energy: 100,
            moral: 80,
            salary: engine.proPlayer.wage,
            value: 1000000,
            isTitular: true
        };
        team.squad.push(playerInSquad);
    }
}
