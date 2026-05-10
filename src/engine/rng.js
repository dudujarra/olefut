/**
 * rng.js — Seeded PRNG centralizado (Mulberry32)
 *
 * Todas as chamadas de randomness no engine DEVEM usar este módulo.
 * NUNCA usar Math.random() diretamente no engine.
 *
 * §6.1 do Game Design Document:
 * - Mulberry32: rápido, 32-bit, distribuição excelente
 * - 10x mais rápido que Mersenne Twister
 * - 4 bytes state vs 2.5KB MT state
 * - Perfeito para browser/JS
 *
 * Uso:
 *   import { rng, setGlobalSeed, deriveMatchSeed } from './rng';
 *   const value = rng();           // 0..1 float
 *   const n = rng.int(1, 100);     // 1..100 integer
 *   const item = rng.pick(array);  // random element
 *
 * Para partidas:
 *   const matchSeed = deriveMatchSeed(seasonSeed, matchDay, homeId, awayId);
 *   const matchRng = createRng(matchSeed);
 */

// ============================================================
// MULBERRY32 CORE
// ============================================================

/**
 * Mulberry32 — fast 32-bit PRNG with excellent distribution.
 * Returns a function that produces floats in [0, 1).
 *
 * @param {number} seed — initial seed (integer)
 * @returns {function(): number} — PRNG function
 */
function mulberry32(seed) {
    let state = seed | 0;
    return function () {
        state = state + 0x6D2B79F5 | 0;
        let t = Math.imul(state ^ state >>> 15, 1 | state);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// ============================================================
// GLOBAL RNG INSTANCE
// ============================================================

let _globalSeed = Date.now() | 0;
let _globalRng = mulberry32(_globalSeed);

/**
 * Set the global seed. Call this at game init with a deterministic seed
 * (e.g., from save file or user input) for reproducibility.
 *
 * @param {number} seed
 */
export function setGlobalSeed(seed) {
    _globalSeed = seed | 0;
    _globalRng = mulberry32(_globalSeed);
}

/**
 * Get the current global seed (for save files).
 * @returns {number}
 */
export function getGlobalSeed() {
    return _globalSeed;
}

/**
 * Core random function — returns float in [0, 1).
 * Drop-in replacement for Math.random().
 *
 * @returns {number}
 */
export function rng() {
    return _globalRng();
}

// ============================================================
// CONVENIENCE METHODS
// ============================================================

/**
 * Random integer in [min, max] (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
rng.int = function (min, max) {
    return Math.floor(_globalRng() * (max - min + 1)) + min;
};

/**
 * Random float in [min, max).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
rng.float = function (min, max) {
    return _globalRng() * (max - min) + min;
};

/**
 * Pick a random element from an array.
 * @template T
 * @param {T[]} arr
 * @returns {T|undefined}
 */
rng.pick = function (arr) {
    if (!arr || arr.length === 0) return undefined;
    return arr[Math.floor(_globalRng() * arr.length)];
};

/**
 * Returns true with the given probability (0..1).
 * @param {number} prob — probability threshold
 * @returns {boolean}
 */
rng.chance = function (prob) {
    return _globalRng() < prob;
};

/**
 * Fisher-Yates shuffle (in-place, deterministic).
 * §2.4: "Fisher-Yates shuffle for uniform randomness"
 *
 * @template T
 * @param {T[]} arr — array to shuffle in place
 * @returns {T[]} — same array, shuffled
 */
rng.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(_globalRng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// ============================================================
// MATCH SEED DERIVATION
// ============================================================

/**
 * Derive a deterministic match seed from season context.
 * §6.1: "Each match gets its own seed derived from seasonSeed + matchDay + homeId + awayId"
 *
 * Uses simple hash combining (murmur-like) for good distribution.
 *
 * @param {number} seasonSeed — base seed for this season
 * @param {number} matchDay — week/round number
 * @param {number} homeId — home team id
 * @param {number} awayId — away team id
 * @returns {number} — derived seed
 */
export function deriveMatchSeed(seasonSeed, matchDay, homeId, awayId) {
    let h = (seasonSeed | 0) ^ 0xDEADBEEF;
    h = Math.imul(h ^ (matchDay * 0x5BD1E995), 0xCC9E2D51);
    h = Math.imul(h ^ (homeId * 0x1B873593), 0xE6546B64);
    h = Math.imul(h ^ (awayId * 0x85EBCA6B), 0xC2B2AE35);
    h = h ^ (h >>> 16);
    return h | 0;
}

// ============================================================
// SCOPED RNG (for isolated contexts like match simulation)
// ============================================================

/**
 * Create an independent RNG instance with its own seed.
 * Use for match simulation, youth generation, etc.
 *
 * Returns an object with the same API as the global rng.
 *
 * @param {number} seed
 * @returns {object} — { random, int, float, pick, chance, shuffle }
 */
export function createRng(seed) {
    const _rng = mulberry32(seed);

    function random() {
        return _rng();
    }

    random.int = function (min, max) {
        return Math.floor(_rng() * (max - min + 1)) + min;
    };

    random.float = function (min, max) {
        return _rng() * (max - min) + min;
    };

    random.pick = function (arr) {
        if (!arr || arr.length === 0) return undefined;
        return arr[Math.floor(_rng() * arr.length)];
    };

    random.chance = function (prob) {
        return _rng() < prob;
    };

    random.shuffle = function (arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(_rng() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    return random;
}
