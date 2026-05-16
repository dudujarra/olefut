/**
 * Engine — Thin Facade / State Container
 *
 * AKITA-404+: All business logic delegated to injected services.
 * Engine owns ONLY:
 *   1. State fields (constructor)
 *   2. One-line delegator methods (facade pattern)
 *   3. advanceWeek orchestrator (~30L core tick)
 *
 * Services are injected by engineFactory.js (Composition Root).
 * Engine has ZERO imports of business logic modules.
 */

import { canAccess } from './ViewUnlockSystem.js';
import { compute as computeManagerIdentity } from './ManagerIdentitySystem.js';
import { decrementSuspensions } from './DisciplineSystem.js';
import { setMatchBonus, MATCH_BONUS_TIERS } from './MatchBonusSystem.js';
import { setTicketPolicy, getActiveTicketPolicy, TICKET_POLICIES } from './TicketPricingSystem.js';
import { startAuction, raiseBid, getActiveAuctions, requiresAuction } from './StarAuctionSystem.js';
import { StaffManager } from './StadiumSystem.js';

/**
 * The core game engine — state container + thin facade.
 * All logic lives in services injected via engineFactory.
 */
export class Engine {
    constructor() {
        // === CORE STATE ===
        this.teams = [];
        this.tournaments = [];
        this.currentWeek = 0;
        this.mode = 'manager';
        this.proPlayer = null;
        this.manager = { name: '', teamId: null, money: 0, salary: 5000, reputation: 10, tacticHistory: {}, careerHistory: [] };
        this.marketPlayers = [];

        // === MANAGER MODE STATE ===
        this.currentTactic = 'normal';
        this.currentTraining = 'fitness';
        this.lastTeamTalk = null;
        this.teamTalkModifiers = { ata: 1.0, def: 1.0 };
        this.matchCondition = null;
        this.transferOffers = [];
        this.weeklyFinance = null;
        this.managerStats = { wins: 0, draws: 0, losses: 0, streak: 0, lossStreak: 0, rollingForm: [], goalsFor: 0, goalsAgainst: 0, cleanSheets: 0, tacticStreak: 0, lastTactic: null, transferProfit: 0, giantKills: 0, crisisSaves: 0, longestUnbeaten: 0, consecutiveTitles: 0 };
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

        // === SPEC STATE FIELDS ===
        this.boardTension = 50;          // SPEC-072
        this.hallOfLegends = null;       // SPEC-078
        this.rivalryHistory = {};        // SPEC-080
        this.formerCompanions = [];      // SPEC-081
        this.chronicles = [];            // SPEC-082
        this.pendingCoachProposal = null;// SPEC-073
        this.activeChallenge = null;     // SPEC-074
        this.viewUnlockState = {         // SPEC-135
            seasonsCompleted: 0,
            titlesWon: 0,
            totalTransfers: 0,
            managerReputation: 10,
            unlockedViews: [],
        };
        this._squadMonitorCooldowns = {};// SPEC-132
        this.activeLoan = null;
        this.pendingMatchBonus = null;
        this.ticketPolicy = 'normal';
        this.activeAuctions = [];
        this.starPlayerId = null;        // SPEC-C2
    }

    // ================================================================
    // INIT + QUERIES (pure delegators)
    // ================================================================

    initGame(name, teamId, mode = 'manager', scenario = 'livre', playerPosition = 'ATA') {
        return this._gameInitializer.init(this, name, teamId, mode, scenario, playerPosition);
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

    // SPEC-135: view unlock query
    getViewAccess(viewId) {
        return canAccess(viewId, this.viewUnlockState);
    }

    // SPEC-135: update unlock stats
    updateViewUnlockStats({ titlesWon, totalTransfers, managerReputation } = {}) {
        if (titlesWon !== undefined) this.viewUnlockState.titlesWon = titlesWon;
        if (totalTransfers !== undefined) this.viewUnlockState.totalTransfers = totalTransfers;
        if (managerReputation !== undefined) this.viewUnlockState.managerReputation = managerReputation;
    }

    // SPEC-070: computed manager identity
    getManagerIdentity() {
        const th = this.manager.tacticHistory || {};
        const tacticHistory = Object.entries(th).map(([tactic, gamesUsed]) => ({
            tactic, gamesUsed, winRate: 0,
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

    // ================================================================
    // SERVICE DELEGATORS — Formation / Tactic / Training / Talk
    // ================================================================

    setTactic(tacticId)              { return this._formationService.setTactic(this, tacticId); }
    setFormation(formationId)        { return this._formationService.setFormation(this, formationId); }
    saveFormationLayout(opts)        { return this._formationService.saveFormationLayout(this, opts); }
    getMatchContext()                { return this._formationService.getMatchContext(this); }
    applyLiveSubstitution(o, i, m)  { return this._formationService.applyLiveSubstitution(this, o, i, m); }
    autoPickSquad()                  { return this._formationService.autoPickSquad(this); }
    doTeamTalk(talkId)               { return this._formationService.doTeamTalk(this, talkId); }
    doTraining(trainingId)           { return this._formationService.doTraining(this, trainingId); }

    // ================================================================
    // SERVICE DELEGATORS — Transfer / Market / Scouting
    // ================================================================

    generateMarket()                             { return this._transferService.generateMarket(this); }
    acceptTransferOffer(offerId)                  { return this._transferService.acceptTransferOffer(this, offerId); }
    rejectTransferOffer(offerId)                  { return this._transferService.rejectTransferOffer(this, offerId); }
    sellPlayer(playerId, amount)                  { return this._transferService.sellPlayer(this, playerId, amount); }
    makeBuyOffer(teamId, playerId, amount)        { return this._transferService.makeBuyOffer(this, teamId, playerId, amount); }
    npcMakeBuyOffer(buyerId, sellerId, pid, amt)  { return this._transferService.npcMakeBuyOffer(this, buyerId, sellerId, pid, amt); }
    scoutLeague(pos = null, minOVR = 60, lim = 20, maxAge = 29) { return this._scoutingService.scoutLeague(this, pos, minOVR, lim, maxAge); }
    doScouting(regionId)                          { return this._scoutingService.doScouting(this, regionId); }
    scoutRegionAction(regionId)                   { return this.doScouting(regionId); }
    signScoutedPlayer(index)                      { return this._scoutingService.signScoutedPlayer(this, index); }

    // ================================================================
    // SERVICE DELEGATORS — Sectors / Pacing
    // ================================================================

    getTeamSectors(teamId) { return this._sectorService.getTeamSectors(this, teamId); }
    getPacingEvents()      { return this._sectorService.getPacingEvents(this); }

    // ================================================================
    // SERVICE DELEGATORS — Facilities / Staff / Academy
    // ================================================================

    triggerYouthIntake() { return this._facilityService.triggerYouthIntake(this); }
    upgradeAcademy()     { return this._facilityService.upgradeAcademy(this); }
    upgradeStadium()     { return this._facilityService.upgradeStadium(this); }
    hireStaff(roleId)    { return this._facilityService.hireStaff(this, roleId); }
    fireStaff(roleId)    { return this._facilityService.fireStaff(this, roleId); }

    // ================================================================
    // SERVICE DELEGATORS — Loans
    // ================================================================

    loanPlayer(playerId, weeks = 20) { return this._loanService.loanPlayer(this, playerId, weeks); }
    getLoanOptions()                  { return this._loanService.getLoanOptions(this); }
    takeLoan(amount)                  { return this._loanService.takeLoan(this, amount); }
    processLoanPayment()             { return this._loanService.processLoanPayment(this); }
    payOffLoan()                     { return this._loanService.payOffLoan(this); }

    // ================================================================
    // SERVICE DELEGATORS — Press / Contracts / Coach
    // ================================================================

    respondCoachProposal(accept) { return this._pressService.respondCoachProposal(this, accept); }
    checkPressConference()       { return this._pressService.checkPressConference(this); }
    answerPress(optionId)        { return this._pressService.answerPress(this, optionId); }
    getRenewalOffer(playerId)    { return this._pressService.getRenewalOffer(this, playerId); }
    renewContract(playerId)      { return this._pressService.renewContract(this, playerId); }

    // ================================================================
    // ELIFOOT CLASSIC — Match Bonus / Ticket / Star Auction
    // ================================================================

    setMatchBonus(tierId)                     { return setMatchBonus(this, tierId); }
    getMatchBonusTiers()                      { return MATCH_BONUS_TIERS; }
    setTicketPolicy(policyId)                 { return setTicketPolicy(this, policyId); }
    getTicketPolicies()                       { return TICKET_POLICIES; }
    getActiveTicketPolicy()                   { return getActiveTicketPolicy(this); }
    startAuction(player, bid, src = 'market', srcTeamId = null) { return startAuction(this, player, bid, src, srcTeamId); }
    raiseBid(auctionId, newBid)               { return raiseBid(this, auctionId, newBid); }
    getActiveAuctions()                       { return getActiveAuctions(this); }
    requiresAuction(player)                   { return requiresAuction(player); }

    // ================================================================
    // MATCH SIMULATION — delegated to MatchSimulator
    // ================================================================

    playMatch(homeId, awayId, isCup = false) {
        return this._matchSimulator.simulate(this, homeId, awayId, isCup);
    }

    playMatchFirstHalf(homeId, awayId, isCup = false) {
        return this._matchSimulator.simulateInterval(this, homeId, awayId, 1, 45, null, isCup, true);
    }

    playMatchSecondHalf(homeId, awayId, firstHalfResult, isCup = false) {
        return this._matchSimulator.simulateInterval(this, homeId, awayId, 46, 90, firstHalfResult, isCup);
    }

    playMatchFromMinute(homeId, awayId, startMin, endMin, baseResult, isCup = false) {
        return this._matchSimulator.simulateInterval(this, homeId, awayId, startMin, endMin, baseResult, isCup, true);
    }

    /**
     * Find the pending match for the human manager in the current week.
     * Tournament-aware: checks both League fixtures and KnockoutCup phases.
     */
    getPendingHumanMatch() {
        if (!this.manager || !this.manager.teamId) return null;
        const myTeamId = this.manager.teamId;
        const week = this.currentWeek;

        for (const t of this.tournaments) {
            if (t.fixtures && week < t.fixtures.length) {
                const myMatch = t.fixtures[week].find(m => (m.home === myTeamId || m.away === myTeamId) && !m.played);
                if (myMatch) return { tournament: t, match: myMatch, isCup: false };
            }
            if (t.currentMatches && t.scheduleWeeks && t.scheduleWeeks[t.currentPhaseIndex] === week) {
                const myMatch = t.currentMatches.find(m => (m.home === myTeamId || m.away === myTeamId) && !m.played);
                if (myMatch) return { tournament: t, match: myMatch, isCup: true };
            }
        }
        return null;
    }

    /**
     * Inject a pre-simulated human match result into the tournament schedule
     * so advanceWeek() registers it without resimulating.
     */
    resolveHumanMatch(matchResult) {
        const pending = this.getPendingHumanMatch();
        if (pending && pending.match) {
            pending.match.prePlayedResult = matchResult;
        }
    }

    // ================================================================
    // CORE ORCHESTRATOR — advanceWeek (the ONE method with real logic)
    // ================================================================

    advanceWeek() {
        this.weekEvents = [];

        // BUG-026: auto-rollover at season boundary
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

        // NPC management + AI Director (RFCT-019.1)
        this._npcWeekProcessor.process(this, weekResults);

        // Manager salary
        if (this.mode === 'manager') this.manager.money += this.manager.salary;

        // Player career week (RFCT-019.1)
        if (this.mode === 'player' && this.proPlayer) {
            this._careerService.processPlayerWeek(this, weekResults);
        }

        // Global suspension decrement
        this.teams.forEach(t => decrementSuspensions(t));

        this.currentWeek++;
        return weekResults;
    }

    startNewSeason() {
        return this._seasonProcessor.rolloverSeason(this);
    }

    // ================================================================
    // PLAYER MODE — minimal inline (2 methods)
    // ================================================================

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
