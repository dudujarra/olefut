/**
 * Engine Type Definitions — OléFUT / Elifoot
 * 
 * SOURCE OF TRUTH for all engine state fields.
 * Any new field MUST be declared here FIRST.
 * 
 * Usage: JSDoc @type {import('./engine').EngineState} in services.
 * 
 * @module engine.d.ts
 */

// ─── Core Types ──────────────────────────────────────────────

/** @typedef {'manager' | 'player'} GameMode */
/** @typedef {'normal' | 'counter' | 'posse' | 'goleada' | 'retranca' | 'pressao'} Tactic */
/** @typedef {'fitness' | 'tactic' | 'shooting' | 'passing' | 'defense' | 'set_pieces'} TrainingType */
/** @typedef {'small' | 'mid' | 'big'} ClubTier */
/** @typedef {'TROPICAL' | 'COLD' | 'ALTITUDE' | 'RAINY'} ClimateZone */
/** @typedef {'normal' | 'barato' | 'caro'} TicketPolicy */

// ─── Manager Stats (ALL fields — no more phantom fields) ────

/**
 * @typedef {Object} ManagerStats
 * @property {number} wins - Season wins
 * @property {number} draws - Season draws
 * @property {number} losses - Season losses
 * @property {number} streak - Current win/loss streak (positive = wins, negative = losses)
 * @property {number} lossStreak - Consecutive losses counter
 * @property {Array<'W'|'D'|'L'>} rollingForm - Last N results
 * @property {number} goalsFor - Season goals scored
 * @property {number} goalsAgainst - Season goals conceded
 * @property {number} cleanSheets - Season clean sheets
 * @property {number} tacticStreak - Consecutive games with same tactic (for predictability penalty)
 * @property {Tactic|null} lastTactic - Last tactic used (for predictability detection)
 * @property {number} transferProfit - Cumulative transfer profit (career-persistent)
 * @property {number} giantKills - Wins against higher-tier teams (career-persistent)
 * @property {number} crisisSaves - Crisis situations resolved (career-persistent)
 * @property {number} longestUnbeaten - Longest unbeaten run (career-persistent)
 * @property {number} consecutiveTitles - Consecutive titles won (career-persistent)
 */

/**
 * Factory function for creating a properly initialized ManagerStats.
 * Use this instead of inline object literals.
 * @returns {ManagerStats}
 */
export function createManagerStats() {
    return {
        wins: 0, draws: 0, losses: 0,
        streak: 0, lossStreak: 0, rollingForm: [],
        goalsFor: 0, goalsAgainst: 0, cleanSheets: 0,
        tacticStreak: 0, lastTactic: null,
        transferProfit: 0, giantKills: 0, crisisSaves: 0,
        longestUnbeaten: 0, consecutiveTitles: 0,
    };
}

// ─── Manager Identity ───────────────────────────────────────

/**
 * @typedef {Object} Manager
 * @property {string} name
 * @property {number|null} teamId
 * @property {number} money
 * @property {number} salary
 * @property {number} reputation - 0-100
 * @property {Object<string, number>} tacticHistory
 * @property {Array<CareerHistoryEntry>} careerHistory - Max 50 entries
 */

/**
 * @typedef {Object} CareerHistoryEntry
 * @property {string} clubName
 * @property {number} season
 * @property {number} [position]
 * @property {number} [wins]
 * @property {number} [draws]
 * @property {number} [losses]
 * @property {number} [goalsFor]
 * @property {number} [goalsAgainst]
 * @property {string} [leftFor] - Club moved to (if mid-season transfer)
 */

// ─── Contract System ────────────────────────────────────────

/**
 * @typedef {Object} ManagerContract
 * @property {string} contractId - Format: `c-{managerId}-{clubId}-{timestamp}`
 * @property {number} managerId
 * @property {number} clubId
 * @property {'title'|'top_4'|'top_half'|'avoid_relegation'|'promotion'} objective
 * @property {string} objectiveDescription
 * @property {number} minWeeks - Protection period (can't be fired)
 * @property {number} bonusReputation - Rep gained on success
 * @property {number} penaltyReputation - Rep lost on failure
 * @property {number} expiresAfterSeasons - 1 (new hire) or 2 (renewal)
 */

// ─── Coach Proposal ─────────────────────────────────────────

/**
 * @typedef {Object} CoachProposal
 * @property {string} proposalId
 * @property {number} fromClubId
 * @property {string} fromClubName
 * @property {ClubTier} fromClubTier
 * @property {string} contractObjective
 * @property {number} reputationBoost
 * @property {number} exitFee
 * @property {number} deadline - Week number
 * @property {string} reason
 */

// ─── Team ───────────────────────────────────────────────────

/**
 * @typedef {Object} Team
 * @property {number} id
 * @property {string} name
 * @property {string} zone
 * @property {number} division - 1=top, 2=second, etc.
 * @property {number} balance
 * @property {Array<Player>} squad
 * @property {ClimateZone} [climateZone]
 * @property {Object} [npcTacticState]
 * @property {Object} [brain] - AdaptiveBrain for NPC managers
 */

// ─── Player ─────────────────────────────────────────────────

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {string} position - GOL, ZAG, LAT, VOL, MEI, ATA
 * @property {number} ovr - Overall rating 1-99
 * @property {number} age
 * @property {number} energy - 0-100
 * @property {number} moral - 0-100
 * @property {number} value - Transfer value in R$
 * @property {number} salary - Weekly salary in R$
 * @property {boolean} isTitular
 * @property {string} [playstyle]
 * @property {Array<string>} [traits]
 * @property {Object} [career] - Career stats (injected by initCareerStats)
 * @property {boolean} [injury]
 * @property {number} [_matchGoals] - Temp field during match simulation
 * @property {boolean} [_retired] - Marked for removal after aging
 */

// ─── Engine State (God Object — aspirational interface) ─────

/**
 * @typedef {Object} EngineState
 * @property {Array<Team>} teams
 * @property {Array<Object>} tournaments
 * @property {number} currentWeek
 * @property {GameMode} mode
 * @property {Object|null} proPlayer
 * @property {Manager} manager
 * @property {Array<Player>} marketPlayers
 * 
 * @property {Tactic} currentTactic
 * @property {TrainingType} currentTraining
 * @property {string|null} lastTeamTalk
 * @property {{ata: number, def: number}} teamTalkModifiers
 * @property {Object|null} matchCondition
 * @property {Array<Object>} transferOffers
 * @property {Object|null} weeklyFinance
 * @property {ManagerStats} managerStats
 * @property {Object|null} board - BoardSystem instance
 * @property {Array<Object>} weekInjuries
 * @property {Array<string>} weekEvents
 * @property {number} academyLevel - 1-5
 * @property {Array<Object>} loanedOut
 * @property {Object|null} pressQuestion
 * @property {number} stadiumLevel - 1-5
 * @property {Object} staff - StaffManager instance
 * @property {Array<Player>} scoutedPlayers
 * @property {Object|null} legacy - ManagerLegacy
 * @property {Object|null} currentSponsor
 * @property {number} seasonNumber
 * @property {Array<Object>} seasonAwards
 * 
 * @property {number} boardTension - -100..+100
 * @property {Object|null} hallOfLegends
 * @property {Object<string, Array>} rivalryHistory
 * @property {Array<Object>} formerCompanions
 * @property {Array<Object>} chronicles - Max 50
 * @property {CoachProposal|null} pendingCoachProposal
 * @property {Object|null} activeChallenge
 * @property {Object} viewUnlockState
 * @property {ManagerContract|null} managerContract
 * @property {Object|null} lastContractResolution
 * @property {Object|null} activeLoan
 * @property {Object|null} pendingMatchBonus
 * @property {TicketPolicy} ticketPolicy
 * @property {Array<Object>} activeAuctions
 * @property {number|null} starPlayerId
 * @property {Object|null} difficulty
 * @property {Array<Object>} [seasonHistory] - Max 50
 */

export default {};
