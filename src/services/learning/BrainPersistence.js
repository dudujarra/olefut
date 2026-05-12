/**
 * BrainPersistence — MARL Fase 6.5
 *
 * Gerencia persistência de múltiplos AdaptiveBrain em localStorage.
 * Resolve o problema de 60+ brains estourando o limite de ~5MB.
 *
 * Estratégias:
 *   1. Lazy save: só salva brains que foram modificados
 *   2. Compactação: mantém apenas top-N states por brain
 *   3. Batched: serializa tudo de uma vez (evita 60 keys separadas)
 *   4. Fallback: se exceder limite, poda os brains com menos updates
 */

const STORAGE_KEY_PREFIX = 'elifoot_npc_brains';
const MAX_STATES_PER_BRAIN = 30;   // compact Q-tables
const MAX_MEMORIES_PER_BRAIN = 10; // compact episodic memory
const ESTIMATED_LIMIT_BYTES = 4_500_000; // 90% of 5MB localStorage

// ─── SAVE ────────────────────────────────────────────────────

/**
 * Salva todos os brains de times NPC em localStorage.
 * Compacta cada brain para manter tamanho controlado.
 *
 * @param {Array<Object>} teams — engine.teams
 * @returns {{ saved: number, bytes: number, pruned: number }}
 */
export function saveAllBrains(teams) {
    if (typeof localStorage === 'undefined') return { saved: 0, bytes: 0, pruned: 0 };

    const brainData = {};
    let saved = 0;

    for (const team of teams) {
        if (!team.brain || team.brain.totalUpdates === 0) continue;

        brainData[team.id] = compactBrain(team.brain);
        saved++;
    }

    const json = JSON.stringify(brainData);
    let pruned = 0;

    // Check size — if too big, prune lowest-update brains
    if (json.length > ESTIMATED_LIMIT_BYTES) {
        const entries = Object.entries(brainData)
            .sort((a, b) => (a[1].u || 0) - (b[1].u || 0)); // sort by updates asc

        // Remove bottom 30%
        const toRemove = Math.ceil(entries.length * 0.3);
        for (let i = 0; i < toRemove; i++) {
            delete brainData[entries[i][0]];
            pruned++;
        }
    }

    try {
        localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(brainData));
    } catch (e) {
        // Storage full — aggressive prune
        try {
            const entries = Object.entries(brainData)
                .sort((a, b) => (a[1].u || 0) - (b[1].u || 0));
            // Keep only top 20
            const kept = Object.fromEntries(entries.slice(-20));
            localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(kept));
            pruned = entries.length - 20;
        } catch { /* give up */ }
    }

    return { saved, bytes: json.length, pruned };
}

// ─── RESTORE ─────────────────────────────────────────────────

/**
 * Restaura brains de todos os times NPC do localStorage.
 *
 * @param {Array<Object>} teams — engine.teams (mutates team.brain in-place)
 * @returns {number} count of restored brains
 */
export function restoreAllBrains(teams) {
    if (typeof localStorage === 'undefined') return 0;

    let raw;
    try {
        raw = localStorage.getItem(STORAGE_KEY_PREFIX);
    } catch { return 0; }
    if (!raw) return 0;

    let brainData;
    try {
        brainData = JSON.parse(raw);
    } catch { return 0; }

    let restored = 0;
    for (const team of teams) {
        if (!team.brain || !brainData[team.id]) continue;
        expandBrain(team.brain, brainData[team.id]);
        restored++;
    }

    return restored;
}

// ─── COMPACTION ──────────────────────────────────────────────

/**
 * Compacta um brain para persistência.
 * Mantém apenas top-N states por visitas, trunca memória,
 * serializa emotions.
 *
 * @param {Object} brain — AdaptiveBrain instance
 * @returns {Object} compact representation
 */
function compactBrain(brain) {
    // Top-N states by visit count
    const stateKeys = Object.keys(brain.qTable || {});
    const topStates = stateKeys
        .sort((a, b) => (brain.visitCount[b] || 0) - (brain.visitCount[a] || 0))
        .slice(0, MAX_STATES_PER_BRAIN);

    const q = {};
    const v = {};
    for (const key of topStates) {
        q[key] = brain.qTable[key];
        v[key] = brain.visitCount[key] || 0;
    }

    return {
        q,        // compact Q-table
        v,        // visit counts
        u: brain.totalUpdates,
        m: (brain.memory || []).slice(-MAX_MEMORIES_PER_BRAIN),
        p: brain.personality,
        e: brain.emotions?.serialize() || null
    };
}

/**
 * Expande dados compactados de volta num brain existente.
 *
 * @param {Object} brain — AdaptiveBrain instance (mutated)
 * @param {Object} data — compact representation from compactBrain
 */
function expandBrain(brain, data) {
    if (data.q) brain.qTable = data.q;
    if (data.v) brain.visitCount = data.v;
    if (typeof data.u === 'number') brain.totalUpdates = data.u;
    if (Array.isArray(data.m)) brain.memory = data.m;
    if (data.p) brain.personality = data.p;
    if (data.e && brain.emotions) brain.emotions.restore(data.e);
}



