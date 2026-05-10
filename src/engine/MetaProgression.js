/**
 * MetaProgression.js — §14.3: Cross-Career Progression
 *
 * Tracks persistent achievements and unlocks across multiple careers.
 * Stored in localStorage separately from save (survives career reset).
 *
 * Stateless exports: evaluate against unlocked state.
 */

const META_KEY = 'olefut_meta_v1';

/**
 * Achievement definitions — unlocked once, persist forever.
 */
export const ACHIEVEMENTS = {
    first_title:       { id: 'first_title',       name: 'Primeiro Troféu',         emoji: '🏆', description: 'Vença seu primeiro campeonato',         condition: (stats) => stats.titlesWon >= 1 },
    five_titles:       { id: 'five_titles',        name: 'Pentacampeão',            emoji: '⭐', description: 'Vença 5 campeonatos',                    condition: (stats) => stats.titlesWon >= 5 },
    cup_specialist:    { id: 'cup_specialist',     name: 'Copeiro',                 emoji: '🥇', description: 'Vença 3 copas',                          condition: (stats) => stats.cupsWon >= 3 },
    youth_master:      { id: 'youth_master',       name: 'Formador de Craques',     emoji: '🌱', description: 'Promova 10 jogadores da base',            condition: (stats) => stats.youthPromoted >= 10 },
    giant_killer:      { id: 'giant_killer',       name: 'Matador de Gigantes',     emoji: '⚔️',  description: 'Vença 5 jogos contra times no top 3',    condition: (stats) => stats.giantKills >= 5 },
    crisis_savior:     { id: 'crisis_savior',      name: 'Salvador',                emoji: '🚑', description: 'Salve um time do rebaixamento',           condition: (stats) => stats.crisisSaves >= 1 },
    iron_manager:      { id: 'iron_manager',       name: 'Gerente de Ferro',        emoji: '🔩', description: 'Complete 10 temporadas consecutivas',     condition: (stats) => stats.consecutiveSeasons >= 10 },
    market_wizard:     { id: 'market_wizard',      name: 'Mago do Mercado',         emoji: '💰', description: 'Lucre R$50M em transferências totais',    condition: (stats) => stats.transferProfit >= 50_000_000 },
    unbeaten_run:      { id: 'unbeaten_run',       name: 'Invicto',                 emoji: '🛡️',  description: '15 jogos sem derrota em uma temporada',   condition: (stats) => stats.longestUnbeaten >= 15 },
    dynasty:           { id: 'dynasty',            name: 'Dinastia',                emoji: '👑', description: 'Vença 3 títulos consecutivos',            condition: (stats) => stats.consecutiveTitles >= 3 },
};

/**
 * Load meta-progression state from localStorage.
 * @returns {{ unlocked: string[], stats: object }}
 */
export function loadMeta() {
    try {
        const raw = localStorage.getItem(META_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { unlocked: [], stats: {} };
}

/**
 * Save meta-progression state.
 * @param {object} meta
 */
export function saveMeta(meta) {
    try {
        localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch { /* ignore */ }
}

/**
 * Update stats and check for newly unlocked achievements.
 * @param {object} stats — current career cumulative stats
 * @returns {{ newlyUnlocked: object[], allUnlocked: string[] }}
 */
export function evaluateAchievements(stats) {
    const meta = loadMeta();
    const newlyUnlocked = [];

    for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
        if (meta.unlocked.includes(id)) continue;
        try {
            if (ach.condition(stats)) {
                meta.unlocked.push(id);
                newlyUnlocked.push(ach);
            }
        } catch { /* defensive */ }
    }

    meta.stats = { ...meta.stats, ...stats };
    saveMeta(meta);

    return { newlyUnlocked, allUnlocked: meta.unlocked };
}

/**
 * Get all achievements with their unlock status.
 * @returns {object[]}
 */
export function getAllAchievements() {
    const meta = loadMeta();
    return Object.values(ACHIEVEMENTS).map(ach => ({
        ...ach,
        unlocked: meta.unlocked.includes(ach.id),
    }));
}

/**
 * Reset meta-progression (debug only).
 */
export function resetMeta() {
    try { localStorage.removeItem(META_KEY); } catch { /* ignore */ }
}
