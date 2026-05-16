import { canAccess } from './ViewUnlockSystem.js';
import { compute as computeManagerIdentity } from './ManagerIdentitySystem.js';
import { evaluateAhaMoments, markAhaSeen } from './AhaMomentsSystem.js';
import { StaffManager } from './StadiumSystem.js';


import { decrementSuspensions } from './DisciplineSystem.js';
import { setMatchBonus, MATCH_BONUS_TIERS } from './MatchBonusSystem.js';
import { setTicketPolicy, getActiveTicketPolicy, TICKET_POLICIES } from './TicketPricingSystem.js';
import { startAuction, raiseBid, getActiveAuctions, requiresAuction } from './StarAuctionSystem.js';

/**
 * @typedef {import('./engine').EngineState} EngineState
 */

/**
 * The core game engine containing the global state and logic.
 * @implements {EngineState}
 */
export class Engine {
    constructor() {
        this.teams = [];
        this.tournaments = [];
        this.currentWeek = 0;
        this.mode = 'manager'; // 'manager' or 'player'
        this.proPlayer = null;
        this.manager = { name: '', teamId: null, money: 0, salary: 5000, reputation: 10, tacticHistory: {}, careerHistory: [] };
        this.marketPlayers = [];



        // Manager Mode state
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

        // Elifoot Classic: Match Bonus ("Bicho")
        this.pendingMatchBonus = null;

        // Elifoot Classic: Ticket Policy (ingresso barato/normal/caro)
        this.ticketPolicy = 'normal';

        // Elifoot Classic: Star Auction (leilão de estrelas)
        this.activeAuctions = [];

        // SPEC-C2: optional star player link (modo unificado groundwork)
        this.starPlayerId = null;
    }

    initGame(name, teamId, mode = 'manager', scenario = 'livre', playerPosition = 'ATA') {
        return this._gameInitializer.init(this, name, teamId, mode, scenario, playerPosition);
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
        const _totalGames = Object.values(th).reduce((s, n) => s + n, 0);
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
        return this._sectorService.getTeamSectors(this, teamId);
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

    autoPickSquad() {
        return this._formationService.autoPickSquad(this);
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
        const pacing = this._sectorService.getPacingEvents(this);

        // AhaMoments: tutorial/onboarding cards based on career milestones
        if (this.mode === 'manager') {
            const team = this.getTeam(this.manager?.teamId);
            const ahaCtx = {
                matchesPlayed: this.managerStats?.wins + this.managerStats?.draws + this.managerStats?.losses || 0,
                firstInjuryDetected: team?.squad?.some(p => p.injury) || false,
                lowMoraleStreak: Math.abs(Math.min(0, this.managerStats?.streak || 0)),
                weeksSinceLastTransfer: this._weeksSinceTransfer || 0,
                matchesWithSameTactic: this.tacticStreak || 0,
                weeksWithoutYouthCheck: this._weeksWithoutYouth || 0,
                balance: team?.balance || 100000,
            };
            const ahaMoments = evaluateAhaMoments(ahaCtx);
            ahaMoments.forEach(aha => {
                pacing.push({
                    type: 'AHA_MOMENT',
                    severity: 'info',
                    title: `💡 ${aha.title}`,
                    body: aha.body,
                });
                markAhaSeen(aha.id);
            });
        }

        return pacing;
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

    // === ELIFOOT CLASSIC: BICHO (Match Bonus) ===
    setMatchBonus(tierId) {
        return setMatchBonus(this, tierId);
    }

    getMatchBonusTiers() {
        return MATCH_BONUS_TIERS;
    }

    // === ELIFOOT CLASSIC: TICKET PRICING ===
    setTicketPolicy(policyId) {
        return setTicketPolicy(this, policyId);
    }

    getTicketPolicies() {
        return TICKET_POLICIES;
    }

    getActiveTicketPolicy() {
        return getActiveTicketPolicy(this);
    }

    // === ELIFOOT CLASSIC: STAR AUCTION ===
    startAuction(player, bid, source = 'market', sourceTeamId = null) {
        return startAuction(this, player, bid, source, sourceTeamId);
    }

    raiseBid(auctionId, newBid) {
        return raiseBid(this, auctionId, newBid);
    }

    getActiveAuctions() {
        return getActiveAuctions(this);
    }

    requiresAuction(player) {
        return requiresAuction(player);
    }

    /**
     * Finds the pending match for the human manager in the current week.
     * Useful for real-time interactive simulation decoupling.
     */
    getPendingHumanMatch() {
        if (!this.manager || !this.manager.teamId) return null;
        const myTeamId = this.manager.teamId;
        const week = this.currentWeek;

        for (const t of this.tournaments) {
            // League
            if (t.fixtures && week < t.fixtures.length) {
                const matches = t.fixtures[week];
                const myMatch = matches.find(m => (m.home === myTeamId || m.away === myTeamId) && !m.played);
                if (myMatch) return { tournament: t, match: myMatch, isCup: false };
            }
            // KnockoutCup
            if (t.currentMatches && t.scheduleWeeks && t.scheduleWeeks[t.currentPhaseIndex] === week) {
                const myMatch = t.currentMatches.find(m => (m.home === myTeamId || m.away === myTeamId) && !m.played);
                if (myMatch) return { tournament: t, match: myMatch, isCup: true };
            }
        }
        return null;
    }

    /**
     * Injects a pre-simulated human match result into the tournament schedule
     * so advanceWeek() registers it without resimulating.
     */
    resolveHumanMatch(matchResult) {
        const pending = this.getPendingHumanMatch();
        if (pending && pending.match) {
            pending.match.prePlayedResult = matchResult;
        }
    }

    /**
     * RFCT-004: Delegator pra MatchSimulator (extracted ~231 LOC).
     * Comportamento idêntico — golden master snapshot preservado.
     */
    playMatch(homeId, awayId, isCup = false) {
        return this._matchSimulator.simulate(this, homeId, awayId, isCup);
    }

    /**
     * Simulate only the first half (minutes 1-45).
     * Returns a partial result that can be continued with playMatchSecondHalf().
     */
    playMatchFirstHalf(homeId, awayId, isCup = false) {
        // skipPostMatch=true: no energy drain, career stats, discipline etc.
        // Those effects run only at the end of the full match (2nd half).
        return this._matchSimulator.simulateInterval(this, homeId, awayId, 1, 45, null, isCup, true);
    }

    /**
     * Simulate only the second half (minutes 46-90).
     * Takes the first half result as base and uses CURRENT squad/tactic state,
     * so any substitutions or tactic changes made at halftime will affect the result.
     */
    playMatchSecondHalf(homeId, awayId, firstHalfResult, isCup = false) {
        return this._matchSimulator.simulateInterval(this, homeId, awayId, 46, 90, firstHalfResult, isCup);
    }

    /**
     * Re-simulate from any arbitrary minute to endMinute.
     * Used for live substitutions during play — manager can intervene at any moment.
     * @param {number} startMin - minute to start re-simulation (exclusive of already played)
     * @param {number} endMin - minute to end (45 or 90)
     * @param {Object} baseResult - accumulated result up to startMin
     */
    playMatchFromMinute(homeId, awayId, startMin, endMin, baseResult, isCup = false) {
        // skipPostMatch=true: mid-game re-sims should not apply post-match effects.
        // The final playMatchSecondHalf call will handle them.
        return this._matchSimulator.simulateInterval(this, homeId, awayId, startMin, endMin, baseResult, isCup, true);
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
        
        // Decrement suspensions globally for all teams
        this.teams.forEach(t => decrementSuspensions(t));

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
