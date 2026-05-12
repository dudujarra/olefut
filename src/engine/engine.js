import { Data } from './data';
import { RealDB } from './db/index';
import { League } from './tournaments/League';
import { ContinentalCup } from './tournaments/ContinentalCup';
import { KnockoutCup } from './tournaments/KnockoutCup';
import { ProPlayer } from './PlayerCareer';
import { FORMATIONS, TACTICS, applyTraining, applyTeamTalk } from './ManagerSystems';
import { adviseTactic, initNpcTacticState, applyNpcTacticAdvice } from './NpcTacticAdvisor';
import { checkSquadHealth } from './SquadHealthMonitor';

// MARL Fase 6: Multi-Agent imports
import { AdaptiveBrain } from '../services/learning/AdaptiveBrain.js';
import { suggestArchetypeForClub } from '../services/learning/Archetypes.js';
import { npcTacticDecision, npcBuyDecision, shouldUseFullBrain } from '../services/learning/NpcManagerAI.js';
import { saveAllBrains, restoreAllBrains } from '../services/learning/BrainPersistence.js';
import { AIDirector } from '../services/learning/AIDirector.js';


import { canAccess } from './ViewUnlockSystem';
import { compute as computeManagerIdentity } from './ManagerIdentitySystem';
import { generate as generateContract } from './ContractGoalSystem';
import { BoardSystem } from './BoardSystem';

import { generateYouthIntake, getAcademyUpgradeCost, loanPlayerOut } from './YouthAcademy';
import { shouldTriggerPress, generateQuestion, applyPressEffect } from './PressConference';
import { StaffManager, getStadiumInfo, SCOUT_REGIONS, scoutRegion } from './StadiumSystem';
import { evaluateSponsor, ManagerLegacy } from './SeasonSystem';
import { generateRenewalOffer, acceptRenewal } from './PlayerDevelopment';
import { rollTraits, initCareerStats } from './PlayerTraits';
import { MatchSimulator } from '../services/MatchSimulator';
import { MythService } from '../services/MythService';
import { RelationshipService } from '../services/RelationshipService';
import { NarrativeService } from '../services/NarrativeService';
import { CareerService } from '../services/CareerService';
import { InheritanceService } from '../services/InheritanceService';
import { WeekProcessor } from '../services/WeekProcessor';
import { SeasonProcessor } from '../services/SeasonProcessor';
import { apply as applyBoardTension } from './BoardTensionSystem';
import { onBoardSellAttempt as checkStarProtection } from './StarProtectionSystem';

import { rng as systemRng } from './rng.js';

export class Engine {
    constructor() {
        this.teams = [];
        this.tournaments = [];
        this.currentWeek = 0;
        this.mode = 'manager'; // 'manager' or 'player'
        this.proPlayer = null;
        this.manager = { name: '', teamId: null, money: 0, salary: 5000, reputation: 10, tacticHistory: {}, careerHistory: [] };
        this.marketPlayers = [];

        // RFCT-004: MatchSimulator extracted from playMatch (ver src/services/MatchSimulator.js)
        this._matchSimulator = new MatchSimulator();
        // RFCT-005: WeekProcessor + SeasonProcessor extracted from advanceWeek/startNewSeason
        this._weekProcessor = new WeekProcessor();
        this._seasonProcessor = new SeasonProcessor();
        // RFCT-007: MythService — Camada 5 (Mito) Hall de Lendas (stateless)
        this._mythService = new MythService();
        // RFCT-008/010: RelationshipService — Camada 3 (Relacional) (stateless)
        this._relationshipService = new RelationshipService();
        // RFCT-011/013: NarrativeService — Camadas 1, 2, 4 + integration 3, 5 (constructor injection)
        this._narrativeService = new NarrativeService({
            relationshipService: this._relationshipService,
            mythService: this._mythService
        });
        // RFCT-014/016: CareerService — Player + Manager career + Transição (constructor injection)
        this._careerService = new CareerService({
            mythService: this._mythService,
            relationshipService: this._relationshipService,
            narrativeService: this._narrativeService
        });
        // AKITA-052 (v1.1.5): InheritanceService — traits herdáveis pra regens
        this._inheritanceService = new InheritanceService({
            mythService: this._mythService
        });

        // Manager Mode state
        this.currentTactic = 'normal';
        this.currentTraining = 'fitness';
        this.lastTeamTalk = null;
        this.teamTalkModifiers = { ata: 1.0, def: 1.0 };
        this.matchCondition = null;
        this.transferOffers = [];
        this.weeklyFinance = null;
        this.managerStats = { wins: 0, draws: 0, losses: 0, streak: 0, lossStreak: 0, rollingForm: [], goalsFor: 0, goalsAgainst: 0 };
        this.board = null;
        this.weekInjuries = [];
        this.weekEvents = [];
        this.academyLevel = 1;
        this.loanedOut = [];
        this.pressQuestion = null;
        this.stadiumLevel = 1;
        this.staff = new StaffManager();
        this.scoutedPlayers = [];
        this.legacy = null;
        this.currentSponsor = null;
        this.seasonNumber = 1;
        this.seasonAwards = [];

        // SPEC-072: board tension (-100..+100)
        this.boardTension = 50;
        // SPEC-078: Hall de Lendas per club
        this.hallOfLegends = null;
        // SPEC-080: rivalry H2H history
        this.rivalryHistory = {}; // `${clubAId}_${clubBId}` → [{clubAScore, clubBScore, week, season, isDecisive}]
        // SPEC-081: former companions for regen tracking
        this.formerCompanions = [];
        // SPEC-082: chronicles per season
        this.chronicles = [];
        // SPEC-073: pending coach proposal (null or proposal object)
        this.pendingCoachProposal = null;
        // SPEC-074: active organic challenge
        this.activeChallenge = null;

        // SPEC-135: view unlock state
        this.viewUnlockState = {
            seasonsCompleted: 0,
            titlesWon: 0,
            totalTransfers: 0,
            managerReputation: 10,
            unlockedViews: [],
        };
        // SPEC-132: squad monitor cooldowns
        this._squadMonitorCooldowns = {};

        // Loan system: allows managers to take emergency loans with interest
        // Each loan: { principal, interestRate, weeklyPayment, weeksRemaining, totalOwed }
        this.activeLoan = null;
    }

    initGame(name, teamId, mode = 'manager', scenario = 'livre', playerPosition = 'ATA') {
        this.manager.name = name;
        this.manager.teamId = parseInt(teamId);
        this.mode = mode;

        // Create all teams from RealDB
        let idCounter = 1;
        for (const zone of Object.keys(RealDB)) {
            for (const divStr of Object.keys(RealDB[zone])) {
                const div = parseInt(divStr);
                RealDB[zone][div].forEach(club => {
                    const tier = zone === 'BRA' ? div : (zone === 'ARG' || zone === 'COL' ? 1.5 : 2);
                    const squad = Data.generateSquad(tier, club.budget, club.name);
                    // Add contracts to each player
                    squad.forEach(p => {
                        p.contract = { weeksLeft: 38 + Math.floor(systemRng() * 76), salary: p.salary || 5000 };
                        p.injury = null;
                        p.moral = 50 + Math.floor(systemRng() * 20);
                        rollTraits(p);
                        initCareerStats(p);
                    });
                    this.teams.push({
                        id: idCounter++,
                        name: club.name,
                        zone,
                        division: div,
                        squad,
                        formation: "4-3-3",
                        balance: club.budget,
                        stadium: club.stadium,
                        npcTacticState: initNpcTacticState(), // SPEC-131
                        brain: null, // MARL Fase 6: will be assigned below for NPCs
                    });
                });
            }
        }

        // MARL Fase 6: Assign AdaptiveBrain + personality to each NPC team
        const playerTeamId = parseInt(teamId);
        for (const team of this.teams) {
            if (team.id === playerTeamId) continue;
            const archetype = suggestArchetypeForClub({
                budget: team.balance || 0,
                division: team.division || 4,
                reputation: team.stadium?.capacity > 40000 ? 80 : team.division <= 2 ? 60 : 30
            });
            team.brain = new AdaptiveBrain(archetype, { skipAutoRestore: true });
        }

        // MARL Fase 6: AI Director for player experience management
        this._aiDirector = new AIDirector();

        // MARL Fase 6: Restore persisted NPC brains
        try { restoreAllBrains(this.teams); } catch { /* ignore */ }

        // Apply scenario modifiers
        if (scenario === 'fallen') {
            const team = this.getTeam(this.manager.teamId);
            if (team) team.balance = Math.floor(team.balance * 0.1);
        }

        // Init Board System + Legacy + Sponsor + Contract Goals
        if (mode === 'manager') {
            const team = this.getTeam(this.manager.teamId);
            if (team) {
                this.board = new BoardSystem(team.division, team.balance);
                this.legacy = new ManagerLegacy(name);
                this.currentSponsor = evaluateSponsor(team.division, 10);
                // SPEC-071: generate initial contract for new manager
                const clubTier = team.division === 1 ? 'big' : team.division === 2 ? 'mid' : 'small';
                this.managerContract = generateContract({
                    managerId: this.manager.teamId,
                    clubId: team.id,
                    clubTier,
                    managerReputation: this.manager.reputation || 10,
                    contractType: 'new_hire',
                    clubDivision: team.division,
                });
            }
        }

        // Create leagues for each zone/division
        for (const zone of Object.keys(RealDB)) {
            for (const divStr of Object.keys(RealDB[zone])) {
                const div = parseInt(divStr);
                const leagueTeams = this.teams.filter(t => t.zone === zone && t.division === div).map(t => t.id);
                const league = new League(`${zone}_${div}`, `Liga ${zone} - Div ${div}`, div);
                league.init(leagueTeams);
                this.tournaments.push(league);
            }
        }

        // Create Copa do Brasil (knockout with all BRA teams)
        const braTeams = this.teams.filter(t => t.zone === 'BRA').map(t => t.id);
        const copaBrasil = new KnockoutCup('COPA_BR', 'Copa do Brasil', [4, 8, 12, 16, 20, 24, 28]);
        copaBrasil.init(braTeams);
        this.tournaments.push(copaBrasil);

        // Libertadores (top 4 BRA div1 + top 2-4 each SA country)
        const libTeams = [];
        libTeams.push(...this.teams.filter(t => t.zone === 'BRA' && t.division === 1).slice(0, 4).map(t => t.id));
        if (RealDB.ARG) libTeams.push(...this.teams.filter(t => t.zone === 'ARG' && t.division === 1).slice(0, 4).map(t => t.id));
        if (RealDB.URU) libTeams.push(...this.teams.filter(t => t.zone === 'URU' && t.division === 1).slice(0, 2).map(t => t.id));
        if (RealDB.CHI) libTeams.push(...this.teams.filter(t => t.zone === 'CHI' && t.division === 1).slice(0, 2).map(t => t.id));
        if (RealDB.COL) libTeams.push(...this.teams.filter(t => t.zone === 'COL' && t.division === 1).slice(0, 4).map(t => t.id));

        const libertadores = new ContinentalCup('LIBERTADORES', 'Copa Libertadores',
            [5, 9, 13], [17, 21, 25]);
        libertadores.init(libTeams);
        this.tournaments.push(libertadores);

        // Copa Sul-Americana (positions 5-8 BRA div1 + 3-4 each SA country)
        const sulaTeams = [];
        sulaTeams.push(...this.teams.filter(t => t.zone === 'BRA' && t.division === 1).slice(4, 8).map(t => t.id));
        if (RealDB.ARG) sulaTeams.push(...this.teams.filter(t => t.zone === 'ARG' && t.division === 1).slice(4, 6).map(t => t.id));
        if (RealDB.URU) sulaTeams.push(...this.teams.filter(t => t.zone === 'URU' && t.division === 1).slice(2, 4).map(t => t.id));
        if (RealDB.CHI) sulaTeams.push(...this.teams.filter(t => t.zone === 'CHI' && t.division === 1).slice(2, 4).map(t => t.id));
        if (RealDB.COL) sulaTeams.push(...this.teams.filter(t => t.zone === 'COL' && t.division === 1).slice(4, 6).map(t => t.id));

        const sulAmericana = new ContinentalCup('SULA', 'Copa Sul-Americana',
            [7, 11, 15], [19, 23, 27]);
        sulAmericana.init(sulaTeams.length >= 4 ? sulaTeams : libTeams.slice(4, 12));
        this.tournaments.push(sulAmericana);

        // Champions League (top 4 from each EU league)
        const clTeams = [];
        for (const z of ['ENG', 'ESP', 'ITA', 'GER', 'FRA']) {
            if (RealDB[z]) clTeams.push(...this.teams.filter(t => t.zone === z && t.division === 1).slice(0, 4).map(t => t.id));
        }
        const champions = new ContinentalCup('CHAMPIONS', 'Champions League',
            [6, 10, 14], [18, 22, 26]);
        champions.init(clTeams);
        this.tournaments.push(champions);

        // Generate market
        this.generateMarket();

        // Player mode setup
        if (mode === 'player') {
            const team = this.getTeam(this.manager.teamId);
            this.proPlayer = new ProPlayer(9999, name, playerPosition);
            // Inject into squad
            if (team) {
                const playerInSquad = {
                    id: 'pro_player',
                    name: name,
                    position: playerPosition,
                    attacking: this.proPlayer.attacking,
                    technical: this.proPlayer.technical,
                    tactical: this.proPlayer.tactical,
                    defending: this.proPlayer.defending,
                    creativity: this.proPlayer.creativity,
                    ovr: 50,
                    age: 17,
                    energy: 100,
                    moral: 80,
                    salary: this.proPlayer.wage,
                    value: 1000000,
                    isTitular: true
                };
                team.squad.push(playerInSquad);
            }
        }
    }

    getTeam(id) {
        return this.teams.find(t => t.id === parseInt(id));
    }

    /**
     * SPEC-073 + BUG-coach: Processa decisão do manager sobre proposta de clube.
     * @param {boolean} accept — true = aceitar, false = recusar
     * @returns {{ success: boolean, newTeamId?: number, msg: string }}
     */
    respondCoachProposal(accept) {
        const proposal = this.pendingCoachProposal;
        if (!proposal) return { success: false, msg: 'Sem proposta pendente' };

        this.pendingCoachProposal = null;

        if (!accept) {
            return { success: false, msg: `Recusou proposta de ${proposal.fromClubName}` };
        }

        // Validar clube destino
        const newTeamId = proposal.fromClubId;
        const newTeam = this.getTeam(newTeamId);
        if (!newTeam) {
            return { success: false, msg: `Clube destino não encontrado: ${newTeamId}` };
        }

        // Cobrar exit fee se aplicável
        const currentTeam = this.getTeam(this.manager?.teamId);
        if (proposal.exitFee > 0 && currentTeam) {
            currentTeam.balance = (currentTeam.balance || 0) - proposal.exitFee;
        }

        // Mudar manager para novo clube
        const oldTeamId = this.manager.teamId;
        this.manager.teamId = newTeam.id;

        // Boost de reputação
        if (proposal.reputationBoost) {
            this.manager.reputation = Math.min(100, (this.manager.reputation || 10) + proposal.reputationBoost);
        }

        // Resetar stats de temporada (começar do zero no novo clube)
        this.managerStats = { wins: 0, draws: 0, losses: 0, streak: 0, lossStreak: 0, rollingForm: [], goalsFor: 0, goalsAgainst: 0 };

        // Limpar estado contextual do clube anterior
        this.boardTension = 0;
        this.lastContractResolution = null;

        // Log na carreira do manager
        if (!Array.isArray(this.manager.careerHistory)) this.manager.careerHistory = [];
        this.manager.careerHistory.push({
            clubName: currentTeam?.name || 'Clube Anterior',
            leftFor: newTeam.name,
            season: this.seasonNumber,
        });

        this.weekEvents.push(`✈️ ${this.manager.name} assina com ${newTeam.name}! (saiu de ${currentTeam?.name || oldTeamId})`);

        return { success: true, newTeamId: newTeam.id, msg: `Aceitou proposta de ${newTeam.name}` };
    }

    // SPEC-135: consulta UI se view está acessível
    getViewAccess(viewId) {
        return canAccess(viewId, this.viewUnlockState);
    }

    // SPEC-135: atualiza stats para unlock (chamar após título, transferência, etc.)
    updateViewUnlockStats({ titlesWon, totalTransfers, managerReputation } = {}) {
        if (titlesWon !== undefined) this.viewUnlockState.titlesWon = titlesWon;
        if (totalTransfers !== undefined) this.viewUnlockState.totalTransfers = totalTransfers;
        if (managerReputation !== undefined) this.viewUnlockState.managerReputation = managerReputation;
    }

    // SPEC-070: retorna identidade calculada do técnico (reputação, estilo, carreira)
    getManagerIdentity() {
        const th = this.manager.tacticHistory || {};
        const totalGames = Object.values(th).reduce((s, n) => s + n, 0);
        const tacticHistory = Object.entries(th).map(([tactic, gamesUsed]) => ({
            tactic,
            gamesUsed,
            winRate: 0, // win rate not tracked per-tactic yet
        }));
        return computeManagerIdentity({
            managerId: this.manager.teamId,
            name: this.manager.name,
            isPlayerManager: this.mode === 'manager',
            tacticHistory,
            careerHistory: this.manager.careerHistory || [],
            currentReputation: this.manager.reputation || 10,
        });
    }

    getTournament(id) {
        return this.tournaments.find(t => t.id === id);
    }

    getStandings(zone, div) {
        const league = this.getTournament(`${zone}_${div}`);
        return league ? league.standings : [];
    }

    getTeamSectors(teamId) {
        const team = this.getTeam(teamId);
        if (!team) return { attack: 0, midfield: 0, defense: 0, goalkeeper: 0 };
        const titulares = team.squad.filter(p => p.isTitular);

        // SPEC-080: prefer pentagon-based effective rating if available
        const computeRating = (player) => {
            if (player.attacking !== undefined && player.naturalPosition) {
                // Pentagon-based: use position-specific rating
                const weights = { ATA: 0, TEC: 0, TAC: 0, DEF: 0, CRI: 0 };
                if (player.position === 'ATA') { weights.ATA = 3; weights.TEC = 2; }
                else if (player.position === 'MEI') { weights.TEC = 3; weights.CRI = 3; weights.TAC = 2; }
                else if (player.position === 'DEF') { weights.DEF = 3; weights.TAC = 3; }
                else if (player.position === 'GOL') { weights.TAC = 3; weights.DEF = 3; }
                const total = weights.ATA + weights.TEC + weights.TAC + weights.DEF + weights.CRI;
                if (total === 0) return 50;
                return Math.floor((
                    player.attacking * weights.ATA +
                    player.technical * weights.TEC +
                    player.tactical * weights.TAC +
                    player.defending * weights.DEF +
                    player.creativity * weights.CRI
                ) / total);
            }
            // Legacy: use attributes object
            return null; // signal fallback
        };

        const avgPentagon = (arr) => {
            if (arr.length === 0) return null;
            const ratings = arr.map(computeRating).filter(r => r !== null);
            if (ratings.length === 0) return null;
            return Math.floor(ratings.reduce((s, r) => s + r, 0) / ratings.length);
        };

        // SCHEMA-UNIFIED: avg reads root-level stat keys
        const avg = (arr, attr) => arr.length === 0 ? 0 : Math.floor(arr.reduce((s, p) => {
            return s + (p[attr] || 50);
        }, 0) / arr.length);

        // BUG-055 fix: when 0 titulares in position, fallback to ANY squad player
        // in that position (bench backup). Was returning 0 → match sim 0 chanceRatio
        // → eternal 0-0 draws (72% draw rate in playtest).
        const pickPosition = (pos) => {
            const starters = titulares.filter(p => p.position === pos);
            if (starters.length > 0) return starters;
            // Fallback to any squad player at position
            return team.squad.filter(p => p.position === pos && !p.injury);
        };

        const ataPlayers = pickPosition('ATA');
        const meiPlayers = pickPosition('MEI');
        const defPlayers = pickPosition('DEF');
        const golPlayers = pickPosition('GOL');

        // SPEC-125: baseline 35→45 (35 era absurdo low, criava matches sem sentido)
        const finalSector = (pentagon, fallback, baseline = 45) => {
            if (pentagon != null && pentagon > 0) return pentagon;
            if (fallback != null && fallback > 0) return fallback;
            return baseline;
        };

        return {
            attack:     finalSector(avgPentagon(ataPlayers), avg(ataPlayers, 'attacking')),
            midfield:   finalSector(avgPentagon(meiPlayers), avg(meiPlayers, 'creativity')),
            defense:    finalSector(avgPentagon(defPlayers), avg(defPlayers, 'defending')),
            goalkeeper: finalSector(avgPentagon(golPlayers), avg(golPlayers, 'defending'))
        };
    }

    generateMarket() {
        this.marketPlayers = [];
        for (let i = 0; i < 20; i++) {
            const positions = ['GOL', 'DEF', 'MEI', 'ATA'];
            const pos = positions[Math.floor(systemRng() * positions.length)];
            this.marketPlayers.push(Data.generatePlayer(pos, 2));
        }
    }

    // === MANAGER ACTIONS ===
    setTactic(tacticId) {
        if (TACTICS[tacticId]) {
            this.currentTactic = tacticId;
            // SPEC-070: track tactic usage for manager identity (style computation)
            if (!this.manager.tacticHistory) this.manager.tacticHistory = {};
            this.manager.tacticHistory[tacticId] = (this.manager.tacticHistory[tacticId] || 0) + 1;
        }
    }

    setFormation(formationId) {
        const team = this.getTeam(this.manager.teamId);
        if (team && FORMATIONS[formationId]) team.formation = formationId;
    }

    /**
     * A2 - Save formation layout (custom positions per slot)
     * layout = { [slotIdx]: { playerId, x, y, role } }
     */
    saveFormationLayout({ formation, layout }) {
        const team = this.getTeam(this.manager?.teamId);
        if (!team) return { success: false };
        if (formation) team.formation = formation;
        team.formationLayout = layout;
        return { success: true };
    }

    /**
     * A3 - Get pre-match context: opponent info, location, h2h
     * Returns null if no upcoming match found.
     */
    getMatchContext() {
        const team = this.getTeam(this.manager?.teamId);
        if (!team) return null;

        // Find upcoming fixture this week
        const upcoming = this.getUpcomingMatch ? this.getUpcomingMatch(team.id) : null;
        let opponent = null;
        let isHome = true;
        let tournamentName = `Brasileirão Série ${['A','B','C','D'][team.division - 1] || 'A'}`;

        if (upcoming) {
            isHome = upcoming.home === team.id;
            opponent = this.getTeam(isHome ? upcoming.away : upcoming.home);
        } else {
            // Fallback: find any team in same zone/division
            const peers = (this.teams || []).filter(t =>
                t.id !== team.id && t.zone === team.zone && t.division === team.division
            );
            opponent = peers[Math.floor(systemRng() * peers.length)] || null;
        }

        if (!opponent) return null;

        // H2H from match history (if tracked)
        let h2h = [];
        if (this.matchHistory) {
            h2h = this.matchHistory.filter(m =>
                (m.home === team.id && m.away === opponent.id) ||
                (m.home === opponent.id && m.away === team.id)
            ).slice(-5);
        }

        // Opponent sectors + style
        const oppSectors = this.getTeamSectors ? this.getTeamSectors(opponent.id) : null;
        const oppTactic = opponent.preferredTactic || 'balanced';
        const styleMap = {
            'defensive': 'Defensivo',
            'pressing': 'Pressão Alta',
            'counter': 'Contra-Ataque',
            'attacking': 'Ofensivo',
            'balanced': 'Equilibrado',
            'park_the_bus': 'Retranca'
        };
        const opponentStyle = styleMap[oppTactic] || 'Equilibrado';

        return {
            opponent,
            isHome,
            location: isHome ? 'CASA' : 'FORA',
            tournament: tournamentName,
            seasonWeek: ((this.currentWeek - 1) % 38) + 1,
            h2h,
            oppSectors,
            opponentStyle,
            oppTactic
        };
    }

    /**
     * A1 - Apply a live substitution during paused match
     * Visual + state commit only (does not recalculate match result — engine sync limitation v1.0)
     * @returns {{success, msg}}
     */
    applyLiveSubstitution(outId, inId, currentMinute) {
        const team = this.getTeam(this.manager?.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado' };

        const out = team.squad.find(p => p.id === outId);
        const inPlayer = team.squad.find(p => p.id === inId);
        if (!out || !inPlayer) return { success: false, msg: 'Jogador não encontrado' };
        if (!out.isTitular) return { success: false, msg: 'Só titulares podem sair' };
        if (inPlayer.isTitular) return { success: false, msg: 'Reserva já está em campo' };
        if (inPlayer.injury) return { success: false, msg: 'Jogador lesionado' };

        // Flip titular flags
        out.isTitular = false;
        inPlayer.isTitular = true;
        // Boost incoming, give outgoing rest floor
        inPlayer.energy = Math.min(100, (inPlayer.energy || 70) + 10);
        out.energy = Math.max(out.energy || 50, 30);

        // Track live subs log
        if (!this._liveSubsLog) this._liveSubsLog = [];
        this._liveSubsLog.push({
            minute: currentMinute,
            outId,
            inId,
            outName: out.name,
            inName: inPlayer.name
        });
        // BUG-091: cap to prevent unbounded growth in soak tests
        if (this._liveSubsLog.length > 50) {
            this._liveSubsLog = this._liveSubsLog.slice(-50);
        }

        return {
            success: true,
            msg: `🔄 ${currentMinute}': ${out.name} sai, ${inPlayer.name} entra.`
        };
    }

    doTeamTalk(talkId) {
        const team = this.getTeam(this.manager.teamId);
        if (!team) return null;
        const result = applyTeamTalk(team, talkId);
        if (result.success) {
            this.lastTeamTalk = result.talk;
            this.teamTalkModifiers = result.modifiers;
        }
        return result;
    }

    doTraining(trainingId) {
        const team = this.getTeam(this.manager.teamId);
        if (!team) return null;
        this.currentTraining = trainingId;
        return applyTraining(team, trainingId);
    }

    acceptTransferOffer(offerId) {
        const offer = this.transferOffers.find(o => o.playerId === offerId);
        if (!offer) return { success: false, msg: 'Oferta não encontrada.' };
        const team = this.getTeam(this.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };

        // SPEC-075: Star Protection check — board selling protected player → tension spike
        try {
            const starEvent = checkStarProtection({ managerId: this.manager.teamId, playerId: offerId });
            if (starEvent) {
                const bt = applyBoardTension({ currentTension: this.boardTension, eventType: 'board_sold_player' });
                this.boardTension = bt.newTension;
                this.weekEvents.push(`⚠️ ${starEvent.publicReaction}`);
                if (bt.thresholdChanged && bt.boardMessage) this.weekEvents.push(`🏛️ ${bt.boardMessage}`);
            }
        } catch { /* defensive */ }

        // Track former companion for FilhosRegen (SPEC-081)
        try {
            const soldPlayer = team.squad.find(p => p.id === offerId);
            if (soldPlayer) {
                this.formerCompanions.push({
                    playerId: soldPlayer.id,
                    name: soldPlayer.name,
                    primeYear: 2026 + this.seasonNumber,
                    position: soldPlayer.position,
                    ovr: soldPlayer.ovr || 50,
                    traits: soldPlayer.traits || [],
                });
                // BUG-090: cap to 50 entries to prevent save bloat in long soak tests
                if (this.formerCompanions.length > 50) {
                    this.formerCompanions = this.formerCompanions.slice(-50);
                }
            }
        } catch { /* defensive */ }

        const soldPlayer = team.squad.find(p => p.id === offerId);
        team.squad = team.squad.filter(p => p.id !== offerId);
        team.balance += offer.offerAmount;

        // BUG-083b: Se a oferta veio de um NPC (buyerTeamId), transferir jogador ao NPC
        if (offer.buyerTeamId && soldPlayer) {
            const buyerTeam = this.getTeam(offer.buyerTeamId);
            if (buyerTeam) {
                soldPlayer.injury = null;
                soldPlayer.energy = 100;
                soldPlayer.isTitular = false;
                soldPlayer.contract = { weeksLeft: 76, salary: Math.floor((offer.offerAmount || 500000) * 0.001) };
                buyerTeam.squad.push(soldPlayer);
                buyerTeam.balance -= offer.offerAmount;
            }
        }

        this.transferOffers = this.transferOffers.filter(o => o.playerId !== offerId);
        return { success: true, msg: `${offer.playerName} vendido para ${offer.buyerClub} por R$ ${(offer.offerAmount / 1000000).toFixed(1)}M!` };
    }

    rejectTransferOffer(offerId) {
        this.transferOffers = this.transferOffers.filter(o => o.playerId !== offerId);
        return { success: true, msg: 'Oferta recusada.' };
    }

    /**
     * SPEC-122 BUG-053: Outgoing buy offer.
     * Bot picks player from another team, makes offer. Opponent auto-decides.
     * Acceptance probability = sigmoid(amount / playerValue).
     * @param {number} otherTeamId
     * @param {string|number} playerId
     * @param {number} amount
     * @returns {{success, msg, accepted}}
     */
    makeBuyOffer(otherTeamId, playerId, amount) {
        const myTeam = this.getTeam(this.manager?.teamId);
        const otherTeam = this.getTeam(otherTeamId);
        if (!myTeam || !otherTeam) return { success: false, msg: 'Time não encontrado.', accepted: false };
        if (myTeam.id === otherTeam.id) return { success: false, msg: 'Mesmo time.', accepted: false };
        if ((myTeam.balance || 0) < amount) return { success: false, msg: 'Saldo insuficiente.', accepted: false };
        if ((myTeam.squad || []).length >= 30) return { success: false, msg: 'Squad cheio.', accepted: false };

        const player = otherTeam.squad?.find(p => p.id === playerId);
        if (!player) return { success: false, msg: 'Jogador não encontrado.', accepted: false };

        // SPEC-125: sigmoid mais íngreme. Bot conseguia comprar com 1.3× value (90%
        // accept rate). Realista: <1.0 reject, >1.5 accept, sigmoid 1.0-1.5.
        const ratio = amount / Math.max(1, player.value || 1_000_000);
        const acceptProb = Math.max(0, Math.min(1, (ratio - 1.0) / 0.5));
        const accepted = systemRng() < acceptProb;

        if (!accepted) {
            return {
                success: true,
                accepted: false,
                msg: `${otherTeam.name} recusou oferta R$ ${(amount / 1_000_000).toFixed(1)}M por ${player.name} (esperava ${(ratio * 100).toFixed(0)}% do valor).`,
                ratio,
                acceptProb
            };
        }

        // Transfer execution
        otherTeam.squad = otherTeam.squad.filter(p => p.id !== playerId);
        otherTeam.balance = (otherTeam.balance || 0) + amount;
        myTeam.balance -= amount;
        // Reset acquired player state
        player.injury = null;
        player.energy = 100;
        player._purchasePrice = amount; // Track for Sunk Cost bias
        // BUG-055 fix: auto-promote to titular if position has <2 starters OR
        // new player is significantly stronger than weakest current starter.
        // Was always false → buys never played → match sim sectors=0 → 0-0 draws.
        const positionStarters = myTeam.squad.filter(p => p.isTitular && p.position === player.position);
        if (positionStarters.length < 2) {
            player.isTitular = true;
        } else {
            const weakestStarter = positionStarters.sort((a, b) => (a.ovr || 0) - (b.ovr || 0))[0];
            if ((player.ovr || 0) > (weakestStarter.ovr || 0) + 3) {
                weakestStarter.isTitular = false;
                player.isTitular = true;
            } else {
                player.isTitular = false;
            }
        }
        myTeam.squad.push(player);

        return {
            success: true,
            accepted: true,
            msg: `🎉 Comprou ${player.name} de ${otherTeam.name} por R$ ${(amount / 1_000_000).toFixed(1)}M!`,
            ratio,
            playerId
        };
    }

    /**
     * NPC-to-NPC buy offer. Unlike makeBuyOffer (which uses this.manager.teamId),
     * this explicitly receives the buyer team ID.
     *
     * @param {number} buyerTeamId — team that wants to buy
     * @param {number} sellerTeamId — team that owns the player
     * @param {string|number} playerId
     * @param {number} amount
     * @returns {{ success, accepted, ratio }}
     */
    npcMakeBuyOffer(buyerTeamId, sellerTeamId, playerId, amount) {
        const buyerTeam = this.getTeam(buyerTeamId);
        const sellerTeam = this.getTeam(sellerTeamId);
        if (!buyerTeam || !sellerTeam) return { success: false, accepted: false };
        if (buyerTeamId === sellerTeamId) return { success: false, accepted: false };
        if ((buyerTeam.balance || 0) < amount) return { success: false, accepted: false };
        if ((buyerTeam.squad || []).length >= 30) return { success: false, accepted: false };

        const player = sellerTeam.squad?.find(p => p.id === playerId);
        if (!player) return { success: false, accepted: false };

        // BUG-083: Se o seller é o time do jogador humano, gerar oferta
        // para o humano decidir, em vez de executar automaticamente.
        if (sellerTeamId === this.manager?.teamId) {
            this.transferOffers.push({
                playerId: player.id,
                playerName: player.name,
                offerAmount: amount,
                buyerClub: buyerTeam.name,
                buyerTeamId: buyerTeamId,
                deadline: (this.currentWeek || 0) + 3
            });
            return { success: true, accepted: false, pendingHuman: true };
        }

        // Same sigmoid as makeBuyOffer
        const ratio = amount / Math.max(1, player.value || 1_000_000);
        const acceptProb = Math.max(0, Math.min(1, (ratio - 1.0) / 0.5));
        const accepted = systemRng() < acceptProb;

        if (!accepted) {
            return { success: true, accepted: false, ratio };
        }

        // Execute transfer
        sellerTeam.squad = sellerTeam.squad.filter(p => p.id !== playerId);
        sellerTeam.balance = (sellerTeam.balance || 0) + amount;
        buyerTeam.balance -= amount;
        player.injury = null;
        player.energy = 100;
        player._purchasePrice = amount; // Track for Sunk Cost bias

        // Auto-promote if needed
        const positionStarters = buyerTeam.squad.filter(p => p.isTitular && p.position === player.position);
        if (positionStarters.length < 2) {
            player.isTitular = true;
        } else {
            const weakest = positionStarters.sort((a, b) => (a.ovr || 0) - (b.ovr || 0))[0];
            if ((player.ovr || 0) > (weakest.ovr || 0) + 3) {
                weakest.isTitular = false;
                player.isTitular = true;
            } else {
                player.isTitular = false;
            }
        }
        buyerTeam.squad.push(player);

        return { success: true, accepted: true, ratio };
    }

    /**
     * SPEC-122: Scout league for buy candidates.
     * Returns array of { team, player, position, ovr, value } sorted by OVR desc.
     * Filters out our own team + injured players + retired.
     */
    scoutLeague(targetPosition = null, minOVR = 60, limit = 20, maxAge = 29) {
        const myTeamId = this.manager?.teamId;
        const candidates = [];
        for (const team of this.teams) {
            if (team.id === myTeamId) continue;
            for (const player of team.squad || []) {
                if (player._retired || player.injury) continue;
                if (targetPosition && player.position !== targetPosition) continue;
                if ((player.ovr || 0) < minOVR) continue;
                // BUG-076: filter old players — don't buy 34-year-olds
                if ((player.age || 25) > maxAge) continue;
                candidates.push({
                    teamId: team.id,
                    teamName: team.name,
                    player,
                    position: player.position,
                    ovr: player.ovr,
                    value: player.value || 1_000_000
                });
            }
        }
        candidates.sort((a, b) => b.ovr - a.ovr);
        return candidates.slice(0, limit);
    }

    // === YOUTH ACADEMY ===
    triggerYouthIntake() {
        const team = this.getTeam(this.manager.teamId);
        if (!team) return [];
        const youths = generateYouthIntake(this.academyLevel, team.division === 1 ? 80 : team.division === 2 ? 50 : 30);
        youths.forEach(y => team.squad.push(y));
        return youths;
    }

    upgradeAcademy() {
        const team = this.getTeam(this.manager.teamId);
        if (!team || this.academyLevel >= 5) return { success: false, msg: 'Nível máximo atingido.' };
        const cost = getAcademyUpgradeCost(this.academyLevel);
        if (team.balance < cost) return { success: false, msg: `Saldo insuficiente. Custo: R$ ${(cost/1000000).toFixed(0)}M` };
        team.balance -= cost;
        this.academyLevel++;
        return { success: true, msg: `Base melhorada para nível ${this.academyLevel}! Custo: R$ ${(cost/1000000).toFixed(0)}M` };
    }

    // === EMPRÉSTIMOS ===
    loanPlayer(playerId, weeks = 20) {
        const team = this.getTeam(this.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };
        const result = loanPlayerOut(team, playerId, weeks);
        if (result.success) this.loanedOut.push(result.loan);
        return result;
    }

    // === ESTÁDIO ===
    upgradeStadium() {
        const team = this.getTeam(this.manager.teamId);
        if (!team || this.stadiumLevel >= 5) return { success: false, msg: 'Nível máximo.' };
        const next = getStadiumInfo(this.stadiumLevel + 1);
        const cost = next.upgradeCost || 999999999;
        if (team.balance < cost) return { success: false, msg: `Saldo insuficiente. Custo: R$ ${(cost/1000000).toFixed(0)}M` };
        team.balance -= cost;
        this.stadiumLevel++;
        const info = getStadiumInfo(this.stadiumLevel);
        return { success: true, msg: `Estádio melhorado para "${info.name}" (${info.capacity.toLocaleString()} lugares)!` };
    }

    // === STAFF ===
    hireStaff(roleId) {
        const team = this.getTeam(this.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };
        return this.staff.hire(roleId);
    }

    fireStaff(roleId) {
        return this.staff.fire(roleId);
    }

    // === SCOUTING ===
    doScouting(regionId) {
        const team = this.getTeam(this.manager.teamId);
        if (!team) return { success: false, players: [] };
        const region = SCOUT_REGIONS.find(r => r.id === regionId);
        if (region && region.cost > team.balance) return { success: false, msg: `Saldo insuficiente. Custo: R$ ${(region.cost/1000).toFixed(0)}K` };
        if (region) team.balance -= region.cost;
        const result = scoutRegion(regionId, this.staff.has('scout'), Data);
        this.scoutedPlayers = result.players;
        return result;
    }

    // Alias for backward compat (BUG-001)
    scoutRegionAction(regionId) {
        return this.doScouting(regionId);
    }

    // Sign a scouted player by index (BUG-002)
    signScoutedPlayer(index) {
        const team = this.getTeam(this.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };
        if (!this.scoutedPlayers || index < 0 || index >= this.scoutedPlayers.length) {
            return { success: false, msg: 'Jogador não encontrado.' };
        }
        const player = this.scoutedPlayers[index];
        if (player.value && player.value > team.balance) {
            return { success: false, msg: `Saldo insuficiente. Custo: R$ ${((player.value || 0)/1000000).toFixed(1)}M` };
        }
        if (player.value) team.balance -= player.value;
        player.contract = { weeksLeft: 76, salary: Math.floor((player.value || 500000) * 0.001) };
        player.moral = 60;
        player.energy = 100;
        player.isTitular = false;
        team.squad.push(player);
        this.scoutedPlayers.splice(index, 1);
        return { success: true, msg: `✅ ${player.name} contratado!` };
    }

    // Sell a player from squad (BUG-006)
    sellPlayer(playerId, amount) {
        const team = this.getTeam(this.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };
        const player = team.squad.find(p => p.id === playerId);
        if (!player) return { success: false, msg: 'Jogador não encontrado.' };
        if (player.isTitular) return { success: false, msg: 'Tire da titularidade antes de vender.' };
        team.squad = team.squad.filter(p => p.id !== playerId);
        team.balance += amount;
        // SPEC-135: track transfers para view unlock
        this.viewUnlockState.totalTransfers = (this.viewUnlockState.totalTransfers || 0) + 1;
        return { success: true, msg: `💰 ${player.name} vendido por R$ ${(amount/1000000).toFixed(1)}M!` };
    }

    // === CONTRATOS ===
    getRenewalOffer(playerId) {
        const team = this.getTeam(this.manager.teamId);
        if (!team) return null;
        const player = team.squad.find(p => p.id === playerId);
        if (!player) return null;
        return generateRenewalOffer(player);
    }

    renewContract(playerId) {
        const team = this.getTeam(this.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };
        const player = team.squad.find(p => p.id === playerId);
        if (!player) return { success: false, msg: 'Jogador não encontrado.' };
        const offer = generateRenewalOffer(player);
        if (!offer.willRenew) return { success: false, msg: offer.reason };
        return acceptRenewal(player, offer);
    }

    // === PACING FRICTION (AUDIT-FIX #17) ===
    /**
     * Returns an array of "friction events" the human UI must show
     * before letting the player advance to the next match.
     * Each event: { type, severity, title, body, action? }
     *   severity: 'info' | 'warning' | 'critical'
     */
    getPacingEvents() {
        if (this.mode !== 'manager') return [];
        const events = [];
        const team = this.getTeam(this.manager?.teamId);
        if (!team) return [];

        // 1. Board ultimatum — critical pacing stop
        if (this.board && this.board.confidence < 20) {
            events.push({
                type: 'BOARD_ULTIMATUM',
                severity: 'critical',
                title: '⚠️ ULTIMATO DA DIRETORIA',
                body: `A diretoria perdeu a confiança (${this.board.confidence}%). Mais derrotas levarão à demissão. Considere ajustar tática e reforçar o elenco.`,
                action: 'tactics'
            });
        }

        // 2. Contract emergency — players about to leave for free
        const expiringNow = team.squad.filter(p => p.contract && p.contract.weeksLeft <= 2 && p.ovr >= 60);
        if (expiringNow.length > 0) {
            const names = expiringNow.map(p => p.name).join(', ');
            events.push({
                type: 'CONTRACT_EMERGENCY',
                severity: 'warning',
                title: '📋 CONTRATOS EXPIRANDO',
                body: `${expiringNow.length} jogador(es) sairão DE GRAÇA em 2 semanas: ${names}. Renove agora ou perca-os.`,
                action: 'squad'
            });
        }

        // 3. Financial crisis — negative balance warning
        if (team.balance < -500000) {
            events.push({
                type: 'FINANCIAL_CRISIS',
                severity: 'critical',
                title: '💸 CRISE FINANCEIRA',
                body: `Balanço em R$ ${(team.balance / 1000000).toFixed(1)}M. Venda jogadores ou reduza custos para evitar colapso.`,
                action: 'market'
            });
        }

        // 4. Squad too thin — risk of forfeit
        const available = team.squad.filter(p => !p.injury && !p._retired);
        if (available.length <= 13) {
            events.push({
                type: 'SQUAD_THIN',
                severity: 'warning',
                title: '🚨 ELENCO CURTO',
                body: `Apenas ${available.length} jogadores disponíveis. Contrate reforços ou arrisque W.O.`,
                action: 'market'
            });
        }

        // 5. Milestone celebrations (positive friction — savoring moments)
        const seasonWeek = ((this.currentWeek - 1) % 38) + 1;
        if (seasonWeek === 19) {
            const standings = this.getStandings(team.zone, team.division);
            const pos = standings.findIndex(s => s.teamId === team.id) + 1;
            events.push({
                type: 'MID_SEASON_REVIEW',
                severity: 'info',
                title: '📊 BALANÇO DO 1º TURNO',
                body: `Metade da temporada! Posição: ${pos}º lugar. V${this.managerStats.wins} E${this.managerStats.draws} D${this.managerStats.losses}. Mantenha o foco para o 2º turno.`
            });
        }

        // 6. Big win/loss streak pause
        if (Math.abs(this.managerStats.streak) >= 5 && this.currentWeek > 3) {
            const isWin = this.managerStats.streak > 0;
            events.push({
                type: 'STREAK_PAUSE',
                severity: 'info',
                title: isWin ? '🔥 SEQUÊNCIA HISTÓRICA' : '❄️ MOMENTO DIFÍCIL',
                body: isWin 
                    ? `${this.managerStats.streak} vitórias consecutivas! A torcida está empolgada. Continue o bom trabalho!`
                    : `${Math.abs(this.managerStats.streak)} derrotas seguidas. Considere mudanças táticas e de formação.`,
                action: isWin ? null : 'tactics'
            });
        }

        return events;
    }

    // === COLETIVA DE IMPRENSA ===
    checkPressConference() {
        if (this.mode !== 'manager') return null;
        const team = this.getTeam(this.manager.teamId);
        if (!team) return null;
        const standings = this.getStandings(team.zone, team.division);
        const pos = standings.findIndex(s => s.teamId === team.id) + 1;
        if (shouldTriggerPress(this.managerStats.streak, this.currentWeek, pos, standings.length)) {
            const avgMorale = team.squad.reduce((s, p) => s + (p.moral || 50), 0) / (team.squad.length || 1);
            this.pressQuestion = generateQuestion(this.managerStats.streak, pos, standings.length, avgMorale);
            return this.pressQuestion;
        }
        return null;
    }

    answerPress(optionId) {
        if (!this.pressQuestion) return null;
        const option = this.pressQuestion.options.find(o => o.id === optionId);
        if (!option) return null;
        const team = this.getTeam(this.manager.teamId);
        applyPressEffect(team, this.board, option.effect);
        const result = { answer: option.text, effect: option.effect };
        this.pressQuestion = null;
        return result;
    }

    // ============================================================
    // LOAN SYSTEM — Emergency financial relief with interest
    // ============================================================

    /**
     * Loan tiers based on division. Higher divisions = larger loans, lower interest.
     */
    getLoanOptions() {
        const team = this.getTeam(this.manager.teamId);
        if (!team) return { available: false, reason: 'Time não encontrado' };
        if (this.activeLoan) return { available: false, reason: 'Já possui empréstimo ativo', loan: this.activeLoan };

        const divisionLoans = {
            1: { maxLoan: 30_000_000, interestRate: 0.08, termWeeks: 38, label: 'Série A' },
            2: { maxLoan: 15_000_000, interestRate: 0.10, termWeeks: 38, label: 'Série B' },
            3: { maxLoan: 5_000_000,  interestRate: 0.12, termWeeks: 38, label: 'Série C' },
            4: { maxLoan: 2_000_000,  interestRate: 0.15, termWeeks: 38, label: 'Série D' },
        };

        const tier = divisionLoans[team.division] || divisionLoans[4];
        const options = [
            { amount: Math.round(tier.maxLoan * 0.25), label: 'Pequeno' },
            { amount: Math.round(tier.maxLoan * 0.50), label: 'Médio' },
            { amount: tier.maxLoan, label: 'Grande' },
        ];

        return {
            available: true,
            interestRate: tier.interestRate,
            termWeeks: tier.termWeeks,
            options: options.map(o => ({
                ...o,
                totalOwed: Math.round(o.amount * (1 + tier.interestRate)),
                weeklyPayment: Math.round((o.amount * (1 + tier.interestRate)) / tier.termWeeks),
            })),
        };
    }

    /**
     * Take a loan. Returns success/failure with message.
     */
    takeLoan(amount) {
        const team = this.getTeam(this.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado' };
        if (this.activeLoan) return { success: false, msg: 'Já possui empréstimo ativo. Pague primeiro.' };

        const options = this.getLoanOptions();
        if (!options.available) return { success: false, msg: options.reason };

        const chosen = options.options.find(o => o.amount === amount);
        if (!chosen) return { success: false, msg: 'Valor inválido' };

        this.activeLoan = {
            principal: chosen.amount,
            interestRate: options.interestRate,
            totalOwed: chosen.totalOwed,
            weeklyPayment: chosen.weeklyPayment,
            weeksRemaining: options.termWeeks,
            weekTaken: this.currentWeek,
            seasonTaken: this.seasonNumber,
        };

        team.balance += chosen.amount;
        this.weekEvents.push(`🏦 Empréstimo de R$ ${(chosen.amount / 1_000_000).toFixed(1)}M aprovado! Juros: ${(options.interestRate * 100).toFixed(0)}%. Parcela semanal: R$ ${(chosen.weeklyPayment / 1000).toFixed(0)}K`);

        return { success: true, msg: `Empréstimo de R$ ${(chosen.amount / 1_000_000).toFixed(1)}M aprovado!`, loan: this.activeLoan };
    }

    /**
     * Process weekly loan payment. Called by WeekProcessor.
     */
    processLoanPayment() {
        if (!this.activeLoan) return null;
        const team = this.getTeam(this.manager.teamId);
        if (!team) return null;

        const payment = this.activeLoan.weeklyPayment;
        // BUG-085: NÃO debitar direto aqui — WeekProcessor já inclui
        // o payment nas weeklyFinance.expenses e debita via balance += income - expenses.
        this.activeLoan.weeksRemaining--;
        this.activeLoan.totalOwed -= payment;

        if (this.activeLoan.weeksRemaining <= 0) {
            const msg = `🏦 Empréstimo quitado! Total pago: R$ ${((this.activeLoan.principal * (1 + this.activeLoan.interestRate)) / 1_000_000).toFixed(1)}M`;
            this.activeLoan = null;
            return { paid: payment, finished: true, msg };
        }

        return { paid: payment, finished: false, remaining: this.activeLoan.weeksRemaining };
    }

    /**
     * Pay off remaining loan early. Deducts full remaining amount.
     */
    payOffLoan() {
        if (!this.activeLoan) return { success: false, msg: 'Sem empréstimo ativo' };
        const team = this.getTeam(this.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado' };
        if (team.balance < this.activeLoan.totalOwed) return { success: false, msg: `Saldo insuficiente. Precisa de R$ ${(this.activeLoan.totalOwed / 1_000_000).toFixed(1)}M` };

        team.balance -= this.activeLoan.totalOwed;
        const msg = `🏦 Empréstimo quitado antecipadamente! Economia de juros.`;
        this.activeLoan = null;
        return { success: true, msg };
    }

    /**
     * RFCT-004: Delegator pra MatchSimulator (extracted ~231 LOC).
     * Comportamento idêntico — golden master snapshot preservado.
     */
    playMatch(homeId, awayId, isCup = false) {
        return this._matchSimulator.simulate(this, homeId, awayId, isCup);
    }

    advanceWeek() {
        // BUG-092: reset weekly events to prevent unbounded accumulation.
        // Previous events are consumed by UI/telemetry before this call.
        this.weekEvents = [];

        // BUG-026 fix: auto-rollover instead of dead stop. Engine was stuck
        // at week 38 forever — season-end logic at line 748+ never reached.
        if (this.currentWeek >= 38) {
            this.startNewSeason();
        }

        const weekResults = {};

        this.tournaments.forEach(t => {
            const results = t.advanceWeek(this, this.currentWeek);
            if (results) weekResults[t.id] = results;
        });

        // Manager mode: delegated to WeekProcessor (RFCT-005)
        if (this.mode === 'manager') {
            this._weekProcessor.process(this, weekResults);
        }

        // SPEC-131 + SPEC-132: NPC tactic pivot + squad emergency (todos os times NPC)
        this.teams.forEach(t => {
            if (t.id === this.manager.teamId) return; // skip player team

            // Squad health check for NPCs
            const npcSquadAvail = t.squad.filter(p => !p.injury && !p._retired).length;
            if (npcSquadAvail < 11) {
                const npcHealth = checkSquadHealth({
                    teamId: t.id,
                    squadSize: npcSquadAvail,
                    budget: t.balance,
                    isPlayerManager: false,
                    week: this.currentWeek,
                    squadAvgOvr: Math.round(t.squad.reduce((s, p) => s + (p.ovr || 50), 0) / (t.squad.length || 1)),
                    marketPlayers: this.marketPlayers,
                    _cooldowns: this._squadMonitorCooldowns,
                });
                if (npcHealth.triggered) {
                    this._squadMonitorCooldowns[t.id] = this.currentWeek;
                    // Apply purchased players to NPC squad
                    npcHealth.playersBought?.forEach(bought => {
                        const mkt = this.marketPlayers.find(p => p.id === bought.playerId);
                        if (mkt) {
                            mkt.contract = { weeksLeft: 26, salary: mkt.salary || 5000 };
                            mkt.injury = null;
                            mkt.moral = 50;
                            mkt.isTitular = true;
                            t.squad.push(mkt);
                            t.balance -= bought.cost;
                            this.marketPlayers = this.marketPlayers.filter(p => p.id !== bought.playerId);
                        }
                    });
                }
            }

            // MARL Fase 6: NPC brain-driven tactic + emotional feed
            if (!t.npcTacticState) t.npcTacticState = initNpcTacticState();
            if (t.brain) {
                // Brain-driven decision (replaces NpcTacticAdvisor)
                const tacticResult = npcTacticDecision(t, this);
                t.npcTacticState.currentTactic = tacticResult.tactic;
                if (tacticResult.changed) t.npcTacticState.tacticAge = 0;
                else t.npcTacticState.tacticAge = (t.npcTacticState.tacticAge || 0) + 1;

                // NPC buy decisions every 4 weeks (only if near player's division for perf)
                const playerDiv = this.getTeam(this.manager?.teamId)?.division || 1;
                if (this.currentWeek % 4 === 0 && shouldUseFullBrain(t, playerDiv)) {
                    try { npcBuyDecision(t, this); } catch { /* defensive */ }
                }
            } else {
                // Legacy fallback: NpcTacticAdvisor
                const oppId = this._lastNpcOpponent?.[t.id];
                const oppTeam = oppId ? this.getTeam(oppId) : null;
                const npcOvr = Math.round(t.squad.reduce((s, p) => s + (p.ovr || 50), 0) / (t.squad.length || 1));
                const oppOvr = oppTeam ? Math.round(oppTeam.squad.reduce((s, p) => s + (p.ovr || 50), 0) / (oppTeam.squad.length || 1)) : npcOvr;
                const advice = adviseTactic({
                    currentTactic: t.npcTacticState.currentTactic,
                    recentResults: t.npcTacticState.recentResults,
                    squadOvr: npcOvr,
                    opponentOvr: oppOvr,
                    tacticAge: t.npcTacticState.tacticAge,
                });
                t.npcTacticState = applyNpcTacticAdvice(t.npcTacticState, advice);
            }
        });

        // MARL Fase 6: AI Director tick — modulates NPC difficulty near player
        if (this._aiDirector && this.mode === 'manager') {
            try {
                const playerTeam = this.getTeam(this.manager.teamId);
                if (playerTeam) {
                    const standings = this.getStandings(playerTeam.zone, playerTeam.division);
                    const position = (standings.findIndex(s => s.teamId === playerTeam.id) + 1) || standings.length;
                    const recentResults = (this.managerStats?.rollingForm || []).map(r =>
                        r === 'W' ? 'W' : r === 'D' ? 'D' : 'L'
                    );
                    const dirMods = this._aiDirector.tick({
                        recentResults,
                        position,
                        totalTeams: standings.length || 20,
                        streak: this.managerStats?.streak || 0
                    });
                    // Apply aggression modifier to same-division NPC brains
                    const playerDiv = playerTeam.division;
                    for (const t of this.teams) {
                        if (t.id === playerTeam.id || !t.brain || t.division !== playerDiv) continue;
                        t.brain._aiDirectorMod = dirMods.aggressionMod;
                    }
                }
            } catch { /* defensive — never break advanceWeek */ }
        }

        // Pagar Salários
        if (this.mode === 'manager') this.manager.money += this.manager.salary;
        if (this.mode === 'player' && this.proPlayer) {
            this.proPlayer.receiveWage();

            // Check bench status
            this.proPlayer.checkBenchStatus();

            // Se o jogador não foi barrado, cobrar o preço do jogo
            if (!this.proPlayer.isBenched) {
                let matchWon = false;
                for (const tId in weekResults) {
                    const match = weekResults[tId].find(m => m.home === this.manager.teamId || m.away === this.manager.teamId);
                    if (match && match.score) {
                        if (match.home === this.manager.teamId && match.score.homeGoals > match.score.awayGoals) matchWon = true;
                        if (match.away === this.manager.teamId && match.score.awayGoals > match.score.homeGoals) matchWon = true;
                    }
                }

                const goalsScored = this.proPlayer.seasonGoals - (this.proPlayer.lastWeekGoals || 0);
                this.proPlayer.lastWeekGoals = this.proPlayer.seasonGoals;
                this.proPlayer.playMatch(90, goalsScored, matchWon);
            } else {
                this.proPlayer.playMatch(0, 0, false);
            }

            this.proPlayer.energy = Math.max(0, this.proPlayer.energy - this.proPlayer.energyDecayRate);

            // SCHEMA-UNIFIED: Sync root-level stats from skills
            this.proPlayer.attacking  = this.proPlayer.skills.pace;
            this.proPlayer.defending  = this.proPlayer.skills.power;
            this.proPlayer.creativity = this.proPlayer.skills.vision;
            this.proPlayer.technical  = this.proPlayer.skills.technique;

            // Reset weekly slots
            this.proPlayer.resetWeeklySlots();

            // Update renown
            this.proPlayer.renown += this.proPlayer.seasonGoals > 0 ? 1 : 0;
            this.proPlayer.updateStarRating();
        }

        this.currentWeek++;
        return weekResults;
    }

    /**
     * BUG-026: Reset week counter + re-init tournaments for new season.
     * BUG-043: also increment seasonNumber (was stuck at 1 forever).
     * Called automatically by advanceWeek() when currentWeek hits 38.
     * Also callable manually for tests / explicit season transitions.
     */
    startNewSeason() {
        // BUG-062/BUG-076: full season-end logic runs HERE — the inline `seasonWeek===38`
        // block inside advanceWeek is dead code (startNewSeason resets currentWeek to 0
        // BEFORE the inline check fires, so it can never reach 38).
        // All season-end operations: titles, promo/relegation, aging, stats, awards, board.
        // Season-end processing: delegated to SeasonProcessor (RFCT-005)
        try {
            this._seasonProcessor.process(this);
        } catch { /* defensive — never break rollover */ }

        // MARL Fase 6: Persist all NPC brains at season end (natural checkpoint)
        try { saveAllBrains(this.teams); } catch { /* defensive */ }

        this.currentWeek = 0;
        this.seasonNumber++;
        // SPEC-135: atualiza seasonsCompleted para view unlock
        this.viewUnlockState.seasonsCompleted = this.seasonNumber - 1;
        if (this.managerStats) {
            this.managerStats = { wins: 0, draws: 0, losses: 0, streak: 0, lossStreak: 0, rollingForm: [], goalsFor: 0, goalsAgainst: 0 };
        }
        // BUG-040: emergency squad replenish if critically short (<11).
        // AUDIT-FIX: now covers ALL teams (NPC + player), not just manager's team.
        // Without this, NPC teams can hit 0 players after mass retirements + contract expiry.
        try {
            this.teams.forEach(t => {
                if (t?.squad && t.squad.length < 11) {
                    // Generate emergency youth players via Data.generateSquad
                    const tier = t.division || 3;
                    const needed = 11 - t.squad.length;
                    const positions = ['GOL', 'DEF', 'DEF', 'DEF', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA', 'ATA'];
                    for (let i = 0; i < needed && i < positions.length; i++) {
                        const p = Data.generatePlayer(positions[i], tier + 1, {});
                        p.age = systemRng.int(18, 22);
                        p.potential = Math.min(99, p.ovr + systemRng.int(10, 25));
                        p.isYouth = true;
                        p.contract = { weeksLeft: 76, salary: 5000 };
                        p.energy = 100;
                        p.isTitular = t.squad.filter(x => x.position === positions[i] && x.isTitular).length < 1;
                        t.squad.push(p);
                    }
                }
            });
        } catch { /* defensive — never crash rollover */ }
        // Capture final Série A standings BEFORE league re-init resets them —
        // needed for continental cup re-qualification.
        const finalDiv1Standings = {};
        try {
            const zones = [...new Set(this.teams.map(t => t.zone))];
            zones.forEach(z => {
                const st = this.getStandings(z, 1);
                if (st.length > 0) finalDiv1Standings[z] = st.map(s => s.teamId);
            });
        } catch { /* defensive */ }

        // Copa do Brasil winner → Libertadores spot
        let copaBrWinnerId = null;
        try {
            const copa = this.getTournament('COPA_BR');
            if (copa?.winner) copaBrWinnerId = copa.winner;
        } catch { /* defensive */ }

        // BUG-076: Re-init leagues by current team.division (handles promotions).
        // Zone-division leagues (id = `ZONE_N`) rebuild roster from current team divisions.
        // LIBERTADORES / SULA / CHAMPIONS re-qualified below based on final standings.
        this.tournaments.forEach(t => {
            try {
                if (typeof t.init === 'function') {
                    let teamIds;
                    if (t.id && /_\d+$/.test(t.id)) {
                        const lastUnder = t.id.lastIndexOf('_');
                        const zone = t.id.substring(0, lastUnder);
                        const div = parseInt(t.id.substring(lastUnder + 1));
                        if (zone && !isNaN(div) && div >= 1 && div <= 4) {
                            teamIds = this.teams
                                .filter(tm => tm.zone === zone && tm.division === div)
                                .map(tm => tm.id);
                        }
                    }
                    // Skip continental cups — re-qualified separately below
                    if (['LIBERTADORES', 'SULA', 'CHAMPIONS'].includes(t.id)) return;
                    if (!teamIds || teamIds.length === 0) {
                        teamIds = (t.standings || []).map(s => s.teamId).filter(Boolean);
                    }
                    if (teamIds.length > 0) t.init(teamIds);
                }
            } catch { /* defensive */ }
        });

        // Re-qualify continental cups from final div 1 standings.
        // Libertadores: top 4 each SA zone + Copa do Brasil winner (replaces 4th if already in top 4)
        // Sul-Americana: positions 5-8 each SA zone
        try {
            const saZones = ['BRA', 'ARG', 'URU', 'CHI', 'COL'];
            const libTeams = [];
            const sulaTeams = [];

            saZones.forEach(z => {
                const st = finalDiv1Standings[z] || [];
                if (z === 'BRA') {
                    // BRA: top 4 → Libertadores, 5-8 → Sul-Americana
                    // Copa do Brasil winner gets a Libertadores spot if not already top 4
                    const top4 = st.slice(0, 4);
                    if (copaBrWinnerId && !top4.includes(copaBrWinnerId)) {
                        // Replace 4th spot with Copa winner; push 4th to Sul-Americana
                        const displaced = top4[3];
                        top4[3] = copaBrWinnerId;
                        sulaTeams.push(displaced);
                    }
                    libTeams.push(...top4);
                    sulaTeams.push(...st.slice(4, 8));
                } else {
                    // Other SA zones: top 4 → Libertadores, 5-6 → Sul-Americana
                    libTeams.push(...st.slice(0, 4));
                    sulaTeams.push(...st.slice(4, 6));
                }
            });

            const lib = this.getTournament('LIBERTADORES');
            if (lib && libTeams.length >= 4) lib.init(libTeams);

            const sula = this.getTournament('SULA');
            if (sula && sulaTeams.length >= 4) sula.init(sulaTeams);

            // Champions League: top 4 from EU div 1 leagues
            const euZones = ['ENG', 'ESP', 'ITA', 'GER', 'FRA'];
            const clTeams = [];
            euZones.forEach(z => {
                const st = finalDiv1Standings[z] || [];
                clTeams.push(...st.slice(0, 4));
            });
            const cl = this.getTournament('CHAMPIONS');
            if (cl && clTeams.length >= 4) cl.init(clTeams);
        } catch { /* defensive */ }
    }

    registerPlayerGoal(type) {
        if (!this.proPlayer) return;
        this.proPlayer.seasonGoals++;
    }

    previewPlayerMatch() {
        if (this.mode !== 'player') return null;
        this.proPlayer.checkBenchStatus();
        return { isBenched: this.proPlayer.isBenched };
    }
}
