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
import { NpcWeekProcessor } from '../services/NpcWeekProcessor';
import { TransferService } from '../services/TransferService';
import { ScoutingService } from '../services/ScoutingService';
import { LoanService } from '../services/LoanService';
import { FacilityService } from '../services/FacilityService';
import { FormationService } from '../services/FormationService';
import { PressService } from '../services/PressService';
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
        // RFCT-019.1: NpcWeekProcessor — extracted NPC management + AI Director from advanceWeek
        this._npcWeekProcessor = new NpcWeekProcessor();
        // RFCT-019.2: TransferService — extracted market generation + transfer ops
        this._transferService = new TransferService();
        // RFCT-019.3: ScoutingService — extracted scouting + sign + scoutLeague
        this._scoutingService = new ScoutingService();
        // RFCT-019.4: LoanService — extracted loan financial + player loan
        this._loanService = new LoanService();
        // RFCT-019.5: FacilityService — extracted academy/stadium upgrades + staff
        this._facilityService = new FacilityService();
        // RFCT-019.6: FormationService — formation/tactic/training/teamtalk/sub + getMatchContext
        this._formationService = new FormationService();
        // RFCT-019.7: PressService — press conference + contract renewal + coach proposal response
        this._pressService = new PressService();
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
        return this._pressService.respondCoachProposal(this, accept);
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
        return this._transferService.generateMarket(this);
    }

    // === MANAGER ACTIONS ===
    // === FORMATION/TACTIC/TRAINING/TALK (RFCT-019.6 delegators) ===
    setTactic(tacticId) {
        return this._formationService.setTactic(this, tacticId);
    }

    setFormation(formationId) {
        return this._formationService.setFormation(this, formationId);
    }

    saveFormationLayout(opts) {
        return this._formationService.saveFormationLayout(this, opts);
    }

    getMatchContext() {
        return this._formationService.getMatchContext(this);
    }

    applyLiveSubstitution(outId, inId, currentMinute) {
        return this._formationService.applyLiveSubstitution(this, outId, inId, currentMinute);
    }

    doTeamTalk(talkId) {
        return this._formationService.doTeamTalk(this, talkId);
    }

    doTraining(trainingId) {
        return this._formationService.doTraining(this, trainingId);
    }

    acceptTransferOffer(offerId) {
        return this._transferService.acceptTransferOffer(this, offerId);
    }

    rejectTransferOffer(offerId) {
        return this._transferService.rejectTransferOffer(this, offerId);
    }

    /**
     * SPEC-122 BUG-053: Outgoing buy offer. Sigmoid acceptance.
     * @param {number} otherTeamId
     * @param {string|number} playerId
     * @param {number} amount
     * @returns {{success, msg, accepted}}
     */
    makeBuyOffer(otherTeamId, playerId, amount) {
        return this._transferService.makeBuyOffer(this, otherTeamId, playerId, amount);
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
        return this._transferService.npcMakeBuyOffer(this, buyerTeamId, sellerTeamId, playerId, amount);
    }

    /**
     * SPEC-122: Scout league for buy candidates.
     * Returns array of { team, player, position, ovr, value } sorted by OVR desc.
     * Filters out our own team + injured players + retired.
     */
    scoutLeague(targetPosition = null, minOVR = 60, limit = 20, maxAge = 29) {
        return this._scoutingService.scoutLeague(this, targetPosition, minOVR, limit, maxAge);
    }

    // === YOUTH ACADEMY (RFCT-019.5 delegators) ===
    triggerYouthIntake() {
        return this._facilityService.triggerYouthIntake(this);
    }

    upgradeAcademy() {
        return this._facilityService.upgradeAcademy(this);
    }

    // === EMPRÉSTIMOS (RFCT-019.4 delegators) ===
    loanPlayer(playerId, weeks = 20) {
        return this._loanService.loanPlayer(this, playerId, weeks);
    }

    // === ESTÁDIO + STAFF (RFCT-019.5 delegators) ===
    upgradeStadium() {
        return this._facilityService.upgradeStadium(this);
    }

    hireStaff(roleId) {
        return this._facilityService.hireStaff(this, roleId);
    }

    fireStaff(roleId) {
        return this._facilityService.fireStaff(this, roleId);
    }

    // === SCOUTING (RFCT-019.3 delegators) ===
    doScouting(regionId) {
        return this._scoutingService.doScouting(this, regionId);
    }

    // Alias for backward compat (BUG-001)
    scoutRegionAction(regionId) {
        return this.doScouting(regionId);
    }

    // Sign a scouted player by index (BUG-002)
    signScoutedPlayer(index) {
        return this._scoutingService.signScoutedPlayer(this, index);
    }

    // Sell a player from squad (BUG-006)
    sellPlayer(playerId, amount) {
        return this._transferService.sellPlayer(this, playerId, amount);
    }

    // === CONTRATOS (RFCT-019.7 delegators) ===
    getRenewalOffer(playerId) {
        return this._pressService.getRenewalOffer(this, playerId);
    }

    renewContract(playerId) {
        return this._pressService.renewContract(this, playerId);
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

    // === COLETIVA DE IMPRENSA (RFCT-019.7 delegators) ===
    checkPressConference() {
        return this._pressService.checkPressConference(this);
    }

    answerPress(optionId) {
        return this._pressService.answerPress(this, optionId);
    }

    // ============================================================
    // LOAN SYSTEM — Emergency financial relief with interest
    // ============================================================

    // === LOAN SYSTEM (RFCT-019.4 delegators) ===
    getLoanOptions() {
        return this._loanService.getLoanOptions(this);
    }

    takeLoan(amount) {
        return this._loanService.takeLoan(this, amount);
    }

    processLoanPayment() {
        return this._loanService.processLoanPayment(this);
    }

    payOffLoan() {
        return this._loanService.payOffLoan(this);
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

        // RFCT-019.1: SPEC-131/132 NPC management + AI Director extracted to NpcWeekProcessor
        this._npcWeekProcessor.process(this, weekResults);

        // Pagar Salários (manager mode)
        if (this.mode === 'manager') this.manager.money += this.manager.salary;

        // RFCT-019.1: player career week processing extracted to CareerService
        if (this.mode === 'player' && this.proPlayer) {
            this._careerService.processPlayerWeek(this, weekResults);
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
        // RFCT-019.8: full season rollover extracted to SeasonProcessor.rolloverSeason
        return this._seasonProcessor.rolloverSeason(this);
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
