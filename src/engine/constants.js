/**
 * Engine Constants — OléFUT / Elifoot
 * 
 * All magic numbers from engine and services MUST live here.
 * Import named constants instead of hardcoding values.
 * 
 * @module constants.js
 */

// ─── Economy ────────────────────────────────────────────────

/** Promotion bonus by target division (higher division = higher bonus) */
export const PROMOTION_BONUS = {
    3: 2_000_000,   // Série D → Série C: R$ 2M
    2: 5_000_000,   // Série C → Série B: R$ 5M
    1: 15_000_000,  // Série B → Série A: R$ 15M
};

/** Relegation penalty — lose this fraction of balance */
export const RELEGATION_PENALTY_RATE = 0.30;

/** Progressive luxury tax brackets */
export const LUXURY_TAX_BRACKETS = [
    { threshold: 100_000_000,   rate: 0.15 },  // 15% on R$100M-500M
    { threshold: 500_000_000,   rate: 0.30 },  // 30% on R$500M-1B
    { threshold: 1_000_000_000, rate: 0.50 },  // 50% above R$1B
];

/** NPC emergency replenishment threshold */
export const NPC_MIN_SQUAD_SIZE = 16;

/** Market pool minimum before replenish */
export const MARKET_MIN_POOL_SIZE = 15;

// ─── Contracts ──────────────────────────────────────────────

/** Contract protection period (can't be fired within this many weeks) */
export const CONTRACT_MIN_WEEKS = 10;

/** Contract duration in seasons */
export const CONTRACT_DURATION = {
    NEW_HIRE: 1,
    RENEWAL: 2,
};

/** Exit fee threshold (weeks left before exit fee applies) */
export const EXIT_FEE_WEEK_THRESHOLD = 10;

/** Default exit fee amount */
export const EXIT_FEE_AMOUNT = 500_000;

// ─── DDA (Dynamic Difficulty Adjustment) ────────────────────

/** Coach proposal only appears after this week */
export const PROPOSAL_MIN_WEEK = 5;

/** Job evaluation frequency (every N weeks) */
export const JOB_EVAL_FREQUENCY = 6;

/** Minimum week before job evaluation starts */
export const JOB_EVAL_MIN_WEEK = 10;

/** Tier upgrade ratio threshold for auto-accept */
export const JOB_UPGRADE_RATIO_THRESHOLD = 1.3;

// ─── Climate System ─────────────────────────────────────────

export const CLIMATE_ZONES = ['TROPICAL', 'COLD', 'ALTITUDE', 'RAINY'];

/** Climate modifier: away team penalty in hostile weather */
export const CLIMATE_AWAY_PENALTY = 0.85;

/** Climate modifier: home team bonus in native weather */
export const CLIMATE_HOME_BONUS = 1.05;

/** Climate modifier: altitude away penalty */
export const CLIMATE_ALTITUDE_PENALTY = 0.80;

/** Rain penalty for possession-based tactics */
export const RAIN_POSSE_PENALTY = 0.15;

/** Rain bonus for counter-attack tactics */
export const RAIN_COUNTER_BONUS = 0.10;

// ─── Weather Energy Drain Modifiers ─────────────────────────

export const WEATHER_DRAIN = {
    NORMAL: 1.0,
    COLD: 1.1,
    HOT: 1.2,
    RAIN: 1.25,
    HEAVY_RAIN: 1.25,
    ALTITUDE: 1.3,
};

// ─── Player Values ──────────────────────────────────────────

/** Base value multiplier for OVR-to-price conversion */
export const PLAYER_BASE_VALUE_MULT = 50_000;

/** Market ask price range: playerVal * (1.2 + rng * 0.6) */
export const MARKET_ASK_MIN_MULT = 1.2;
export const MARKET_ASK_RANGE = 0.6;

// ─── Memory Safety Caps ─────────────────────────────────────

export const MAX_CAREER_HISTORY = 50;
export const MAX_SEASON_HISTORY = 50;
export const MAX_CHRONICLES = 50;
export const MAX_ROLLING_FORM = 10;
export const MAX_RIVALRY_HISTORY_PER_PAIR = 10;

// ─── Reputation ─────────────────────────────────────────────

export const REP_MIN = 0;
export const REP_MAX = 100;
export const REP_DEFAULT = 10;

// ─── Match ──────────────────────────────────────────────────

/** Base energy drain per match (before modifiers) */
export const MATCH_BASE_DRAIN_MIN = 15;
export const MATCH_BASE_DRAIN_RANGE = 10;

/** Workhorse trait: energy save modifier */
export const WORKHORSE_ENERGY_SAVE = 0.7;

/** Leader trait: moral boost on win */
export const LEADER_WIN_MORAL_BOOST = 2;

// ─── Save System ────────────────────────────────────────────

export const SAVE_KEY = 'olefut_save_v1';
export const SAVE_VERSION = 11;


// --- Extracted Magic Numbers ---
export const MARKET_BASE_FEE = 15000;
export const ACADEMY_UPGRADE_COST = 500000;
export const STADIUM_UPGRADE_COST = 1000000;
