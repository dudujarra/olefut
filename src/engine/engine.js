import { Data } from './data';
import { RealDB } from './db/index';
import { League } from './tournaments/League';
import { ContinentalCup } from './tournaments/ContinentalCup';
import { KnockoutCup } from './tournaments/KnockoutCup';
import { ProPlayer } from './PlayerCareer';
import { FORMATIONS, TACTICS, rollMatchCondition, calculateWeeklyFinances, generateTransferOffers, applyTraining, applyTeamTalk } from './ManagerSystems';
import { BoardSystem } from './BoardSystem';
import { processMatchInjuries, processTrainingInjuries, healInjury } from './InjurySystem';
import { generateYouthIntake, getAcademyUpgradeCost, loanPlayerOut, processLoans } from './YouthAcademy';
import { shouldTriggerPress, generateQuestion, applyPressEffect } from './PressConference';
import { StaffManager, getStadiumInfo, calculateTicketRevenue, STAFF_ROLES, SCOUT_REGIONS, scoutRegion } from './StadiumSystem';
import { evaluateSponsor, getCalendarEvent, processPromoRelegation, ManagerLegacy } from './SeasonSystem';
import { processPlayerDevelopment, ageSquad, updateForm, processDressingRoom, generateRenewalOffer, acceptRenewal, TACTIC_COUNTERS, TACTIC_NARRATION, getFormModifier } from './PlayerDevelopment';
import { rollTraits, getTraitMatchModifier, hasTrait, initCareerStats, recordMatchStats, closeSeasonStats, calculateSeasonAwards, processMoraleEvents, processMentoring, isRivalry } from './PlayerTraits';
import { MatchSimulator } from '../services/MatchSimulator';
import { MythService } from '../services/MythService';
import { RelationshipService } from '../services/RelationshipService';
import { NarrativeService } from '../services/NarrativeService';
import { CareerService } from '../services/CareerService';
import { InheritanceService } from '../services/InheritanceService';

export class Engine {
    constructor() {
        this.teams = [];
        this.tournaments = [];
        this.currentWeek = 0;
        this.mode = 'manager'; // 'manager' or 'player'
        this.proPlayer = null;
        this.manager = { name: '', teamId: null, money: 0, salary: 5000 };
        this.marketPlayers = [];

        // RFCT-004: MatchSimulator extracted from playMatch (ver src/services/MatchSimulator.js)
        this._matchSimulator = new MatchSimulator();
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
        this.managerStats = { wins: 0, draws: 0, losses: 0, streak: 0 };
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
                    const squad = Data.generateSquad(tier);
                    // Add contracts to each player
                    squad.forEach(p => {
                        p.contract = { weeksLeft: 38 + Math.floor(Math.random() * 76), salary: p.salary || 5000 };
                        p.injury = null;
                        p.moral = 50 + Math.floor(Math.random() * 20);
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
                        stadium: club.stadium
                    });
                });
            }
        }

        // Apply scenario modifiers
        if (scenario === 'fallen') {
            const team = this.getTeam(this.manager.teamId);
            if (team) team.balance = Math.floor(team.balance * 0.1);
        }

        // Init Board System + Legacy + Sponsor
        if (mode === 'manager') {
            const team = this.getTeam(this.manager.teamId);
            if (team) {
                this.board = new BoardSystem(team.division, team.balance);
                this.legacy = new ManagerLegacy(name);
                this.currentSponsor = evaluateSponsor(team.division, 10);
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

        // Libertadores (top 4 BRA div1 + top 2 each SA country)
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
                    attributes: { ...this.proPlayer.attributes },
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

        const avg = (arr, attr) => arr.length === 0 ? 0 : Math.floor(arr.reduce((s, p) => s + (p.attributes?.[attr] || 50), 0) / arr.length);

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
            attack:     finalSector(avgPentagon(ataPlayers), avg(ataPlayers, 'FIN')),
            midfield:   finalSector(avgPentagon(meiPlayers), avg(meiPlayers, 'CRI')),
            defense:    finalSector(avgPentagon(defPlayers), avg(defPlayers, 'DEF')),
            goalkeeper: finalSector(avgPentagon(golPlayers), avg(golPlayers, 'REF'))
        };
    }

    generateMarket() {
        this.marketPlayers = [];
        for (let i = 0; i < 20; i++) {
            const positions = ['GOL', 'DEF', 'MEI', 'ATA'];
            const pos = positions[Math.floor(Math.random() * positions.length)];
            this.marketPlayers.push(Data.generatePlayer(pos, 2));
        }
    }

    // === MANAGER ACTIONS ===
    setTactic(tacticId) {
        if (TACTICS[tacticId]) this.currentTactic = tacticId;
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
            opponent = peers[Math.floor(Math.random() * peers.length)] || null;
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
        team.squad = team.squad.filter(p => p.id !== offerId);
        team.balance += offer.offerAmount;
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
        const accepted = Math.random() < acceptProb;

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
     * SPEC-122: Scout league for buy candidates.
     * Returns array of { team, player, position, ovr, value } sorted by OVR desc.
     * Filters out our own team + injured players + retired.
     */
    scoutLeague(targetPosition = null, minOVR = 60, limit = 20) {
        const myTeamId = this.manager?.teamId;
        const candidates = [];
        for (const team of this.teams) {
            if (team.id === myTeamId) continue;
            for (const player of team.squad || []) {
                if (player._retired || player.injury) continue;
                if (targetPosition && player.position !== targetPosition) continue;
                if ((player.ovr || 0) < minOVR) continue;
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

    // === COLETIVA DE IMPRENSA ===
    checkPressConference() {
        if (this.mode !== 'manager') return null;
        const team = this.getTeam(this.manager.teamId);
        if (!team) return null;
        const standings = this.getStandings(team.zone, team.division);
        const pos = standings.findIndex(s => s.teamId === team.id) + 1;
        if (shouldTriggerPress(this.managerStats.streak, this.currentWeek, pos, standings.length)) {
            const avgMorale = team.squad.reduce((s, p) => s + (p.moral || 50), 0) / team.squad.length;
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

    /**
     * RFCT-004: Delegator pra MatchSimulator (extracted ~231 LOC).
     * Comportamento idêntico — golden master snapshot preservado.
     */
    playMatch(homeId, awayId, isCup = false) {
        return this._matchSimulator.simulate(this, homeId, awayId, isCup);
    }

    advanceWeek() {
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

        // Manager mode: finanças, fadiga, condições, transferências
        if (this.mode === 'manager') {
            const team = this.getTeam(this.manager.teamId);
            if (team) {
                // Energy management based on training
                team.squad.forEach(p => {
                    if (p.isTitular) {
                        p.energy = Math.max(0, p.energy - (Math.floor(Math.random() * 10) + 12));
                    } else {
                        p.energy = Math.min(100, p.energy + 12);
                    }
                });

                // Finanças detalhadas
                this.weeklyFinance = calculateWeeklyFinances(team, weekResults, team.id);
                // Staff costs
                const staffCost = this.staff.getWeeklyCost();
                if (staffCost > 0) {
                    this.weeklyFinance.expenses += staffCost;
                    this.weeklyFinance.details.push({ label: 'Staff', amount: staffCost, type: 'expense' });
                }
                team.balance += this.weeklyFinance.income - this.weeklyFinance.expenses;

                // Match condition para próxima partida
                this.matchCondition = rollMatchCondition();

                // Transfer offers (janelas)
                const newOffers = generateTransferOffers(team, this.currentWeek);
                if (newOffers.length > 0) {
                    this.transferOffers.push(...newOffers);
                }

                // Win/Loss tracking
                for (const tId in weekResults) {
                    const myMatch = weekResults[tId].find(m => m.home === team.id || m.away === team.id);
                    if (myMatch && myMatch.score) {
                        const isHome = myMatch.home === team.id;
                        const myGoals = isHome ? myMatch.score.homeGoals : myMatch.score.awayGoals;
                        const theirGoals = isHome ? myMatch.score.awayGoals : myMatch.score.homeGoals;
                        if (myGoals > theirGoals) {
                            this.managerStats.wins++;
                            this.managerStats.streak = Math.max(0, this.managerStats.streak) + 1;
                            team.squad.forEach(p => {
                                p.moral = Math.min(100, (p.moral || 50) + 3);
                                if (p.isTitular) updateForm(p, 1);
                            });
                        } else if (myGoals < theirGoals) {
                            this.managerStats.losses++;
                            this.managerStats.streak = Math.min(0, this.managerStats.streak) - 1;
                            team.squad.forEach(p => {
                                p.moral = Math.max(0, (p.moral || 50) - 3);
                                if (p.isTitular) updateForm(p, -1);
                            });
                        } else {
                            this.managerStats.draws++;
                            this.managerStats.streak = 0;
                            team.squad.filter(p => p.isTitular).forEach(p => updateForm(p, 0));
                        }
                        break;
                    }
                }

                // Lesões pós-partida
                this.weekInjuries = processMatchInjuries(team.squad);

                // Curar lesões em andamento
                team.squad.forEach(p => {
                    if (p.injury) healInjury(p);
                });

                // Contratos: reduzir semanas
                team.squad.forEach(p => {
                    if (p.contract) p.contract.weeksLeft--;
                });

                // Remover jogadores com contrato vencido (exceto titulares)
                const expiredPlayers = team.squad.filter(p => p.contract && p.contract.weeksLeft <= 0 && !p.isTitular);
                if (expiredPlayers.length > 0) {
                    this.weekEvents.push(...expiredPlayers.map(p => `📋 ${p.name} saiu: contrato encerrado.`));
                    team.squad = team.squad.filter(p => !(p.contract && p.contract.weeksLeft <= 0 && !p.isTitular));
                }

                // Board confidence
                if (this.board) {
                    const standings = this.getStandings(team.zone, team.division);
                    const pos = standings.findIndex(s => s.teamId === team.id) + 1;
                    const avgMorale = team.squad.reduce((s, p) => s + (p.moral || 50), 0) / team.squad.length;
                    this.board.updateConfidence(pos, standings.length, this.managerStats.streak, avgMorale, team.balance, this.currentWeek);
                }

                // Process loans
                if (this.loanedOut.length > 0) {
                    const returned = processLoans(this.loanedOut, team);
                    returned.forEach(p => {
                        this.weekEvents.push(p.loanResult || `${p.name} voltou do empréstimo.`);
                    });
                    this.loanedOut = this.loanedOut.filter(l => l.weeksLeft > 0);
                }

                // Player Development (weekly growth/decline)
                team.squad.forEach(p => {
                    const devChanges = processPlayerDevelopment(p);
                    devChanges.forEach(c => {
                        if (c.type === 'growth') this.weekEvents.push(`📈 ${c.player}: ${c.attr} ${c.from}→${c.to}`);
                        if (c.type === 'decline') this.weekEvents.push(`📉 ${c.player}: ${c.attr} ${c.from}→${c.to}`);
                    });
                });

                // Dressing Room Dynamics
                const dressingRoom = processDressingRoom(team.squad);
                dressingRoom.events.forEach(e => this.weekEvents.push(e));

                // Morale Events (narrative)
                const moraleEvts = processMoraleEvents(team.squad, this.board);
                moraleEvts.forEach(e => this.weekEvents.push(e));

                // Mentoring (veteran teaches youth)
                const mentorEvts = processMentoring(team.squad);
                mentorEvts.forEach(e => this.weekEvents.push(e));

                // Remove retired players
                const retired = team.squad.filter(p => p._retired);
                retired.forEach(p => {
                    this.weekEvents.push(`👴 ${p.name} (${p.age} anos) anunciou aposentadoria.`);
                });
                team.squad = team.squad.filter(p => !p._retired);

                // Youth intake (1x por temporada, semana 38)
                if (this.currentWeek > 0 && this.currentWeek % 38 === 0) {
                    const youths = this.triggerYouthIntake();
                    youths.forEach(y => {
                        this.weekEvents.push(`🎓 ${y.name} (${y.position}, ${y.age} anos, OVR ${y.ovr}) promovido da base!`);
                    });
                }

                // Calendar events
                const seasonWeek = ((this.currentWeek - 1) % 38) + 1;
                const calEvent = getCalendarEvent(seasonWeek);
                if (calEvent) {
                    this.weekEvents.push(`📅 ${calEvent.name}: ${calEvent.msg}`);
                    if (calEvent.effect) {
                        if (calEvent.effect.moral) team.squad.forEach(p => { p.moral = Math.max(0, Math.min(100, (p.moral || 50) + calEvent.effect.moral)); });
                        if (calEvent.effect.energy) team.squad.forEach(p => { p.energy = Math.max(0, Math.min(100, p.energy + calEvent.effect.energy)); });
                    }
                }

                // Sponsor income
                if (this.currentSponsor) {
                    team.balance += this.currentSponsor.weeklyPay;
                    if (this.weeklyFinance) {
                        this.weeklyFinance.income += this.currentSponsor.weeklyPay;
                        this.weeklyFinance.details.push({ label: `Patrocínio (${this.currentSponsor.name})`, amount: this.currentSponsor.weeklyPay, type: 'income' });
                    }
                }

                // SEASON END: Promoção/Rebaixamento + Legado
                if (seasonWeek === 38) {
                    const standings = this.getStandings(team.zone, team.division);
                    const pos = standings.findIndex(s => s.teamId === team.id) + 1;

                    // Legacy
                    if (this.legacy) {
                        const season = this.legacy.closeSeason(
                            team.name, team.division, pos,
                            this.managerStats.wins, this.managerStats.draws, this.managerStats.losses
                        );
                        this.weekEvents.push(`🏆 Temporada ${this.seasonNumber} encerrada: ${season.record} (${pos}º lugar)`);
                        if (season.title) this.weekEvents.push(`🎉 ${season.title}!`);
                    }

                    // Promo/Relegation
                    const changes = processPromoRelegation(this.teams, standings.map(s => s), team.zone, team.division);
                    changes.forEach(c => {
                        const emoji = c.action === 'promoted' ? '⬆️' : '⬇️';
                        this.weekEvents.push(`${emoji} ${c.name} ${c.action === 'promoted' ? 'subiu' : 'caiu'} para Série ${['A','B','C','D'][c.to - 1]}`);
                    });

                    // Update sponsor
                    const newStandings = this.getStandings(team.zone, team.division);
                    const newPos = newStandings.findIndex(s => s.teamId === team.id) + 1;
                    this.currentSponsor = evaluateSponsor(team.division, newPos);

                    // Reset season stats
                    this.managerStats = { wins: 0, draws: 0, losses: 0, streak: 0 };
                    this.seasonNumber++;

                    // Season Awards
                    this.seasonAwards = calculateSeasonAwards(team.squad, team.name, this.seasonNumber);
                    this.seasonAwards.forEach(a => {
                        this.weekEvents.push(`${a.emoji} ${a.name}: ${a.player} (${a.value})`);
                    });

                    // Close season stats for each player
                    team.squad.forEach(p => closeSeasonStats(p, this.seasonNumber, team.name));

                    // Age all players
                    const ageEvents = ageSquad(team.squad);
                    ageEvents.forEach(e => this.weekEvents.push(e));

                    // Reset board for new season
                    if (this.board && !this.board.isFired) {
                        this.board = new BoardSystem(team.division, team.balance);
                    }
                }
            }
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

            // Sync attributes
            this.proPlayer.attributes.FIS = this.proPlayer.skills.pace;
            this.proPlayer.attributes.DEF = this.proPlayer.skills.power;
            this.proPlayer.attributes.CRI = this.proPlayer.skills.vision;
            this.proPlayer.attributes.FIN = this.proPlayer.skills.technique;

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
        // BUG-062 fix: process season-end logic BEFORE resetting week.
        // Bot was hitting peak position 1 but titlesWon=0 because
        // legacy.closeSeason() was gated by seasonWeek===38 inside advance loop
        // which never fires post-rollover (currentWeek already reset to 0).
        try {
            const team = this.getTeam(this.manager?.teamId);
            if (team && this.legacy && this.mode === 'manager') {
                const standings = this.getStandings(team.zone, team.division);
                const pos = (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length;
                if (pos > 0 && this.managerStats) {
                    this.legacy.closeSeason(
                        team.name,
                        team.division,
                        pos,
                        this.managerStats.wins || 0,
                        this.managerStats.draws || 0,
                        this.managerStats.losses || 0
                    );
                    // BUG-063 fix: process promo/relegation here too
                    if (typeof this._processPromoRelegation === 'function') {
                        try { this._processPromoRelegation(team, standings); } catch { /* ignore */ }
                    }
                }
            }
        } catch { /* defensive — never break rollover */ }

        this.currentWeek = 0;
        // BUG-043 fix: increment seasonNumber on rollover (line 776 only fires
        // inside in-line season-end logic which guard at 583 used to skip).
        this.seasonNumber++;
        // Reset season managerStats
        if (this.managerStats) {
            this.managerStats = { wins: 0, draws: 0, losses: 0, streak: 0 };
        }
        // BUG-040 cascade: emergency squad replenish if any user team became
        // critically short (<11) between seasons. triggerYouthIntake replenishes.
        try {
            const team = this.getTeam(this.manager?.teamId);
            if (team?.squad && team.squad.length < 11 && typeof this.triggerYouthIntake === 'function') {
                this.triggerYouthIntake();
                this.triggerYouthIntake(); // double call for emergency boost
            }
        } catch { /* ignore */ }
        // Re-init each tournament: regenerate fixtures, reset standings
        this.tournaments.forEach(t => {
            try {
                if (typeof t.init === 'function') {
                    const teamIds = (t.standings || []).map(s => s.teamId).filter(Boolean);
                    if (teamIds.length > 0) t.init(teamIds);
                }
            } catch { /* defensive — don't break engine on tournament re-init failure */ }
        });
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
