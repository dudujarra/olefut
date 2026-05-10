/**
 * NpcTacticAdvisor — SPEC-131: AI Tactic Pivot
 *
 * Detecta tática ineficaz em times NPC e sugere adaptação.
 * Resolve TACTIC_STUCK (100+ eventos em 203 seasons, Monotony score=11).
 *
 * Stateless: não muta nada, retorna sugestão.
 */

const TACTIC_KEYS = ['normal', 'offensive', 'defensive', 'pressing', 'counter', 'possession'];

/**
 * Sugere tática para time NPC baseada em resultados recentes e OVR mismatch.
 *
 * @param {object} opts
 * @param {string} opts.currentTactic — tática atual do time
 * @param {Array<string>} opts.recentResults — array de 'W'|'D'|'L' recentes (mais novo primeiro)
 * @param {number} opts.squadOvr — OVR médio do time
 * @param {number} opts.opponentOvr — OVR médio do adversário (semana atual)
 * @param {number} [opts.tacticAge=0] — semanas usando tática atual
 * @param {number} [opts.seed] — seed para determinismo em testes
 * @returns {{ tactic: string, changed: boolean, reason: string|null }}
 */
export function adviseTactic({ currentTactic, recentResults = [], squadOvr = 65, opponentOvr = 65, tacticAge = 0, seed = null }) {
    const rand = seed !== null ? seededRandom(seed) : Math.random;

    const losses = countTrailingLosses(recentResults);
    const ovrDiff = squadOvr - opponentOvr;

    // BUG-081: boredom rotation — prevent stagnation even for winning teams
    if (tacticAge >= 10 && rand() < 0.30) {
        const newTactic = selectNewTactic(currentTactic, ovrDiff, rand);
        return { tactic: newTactic, changed: true, reason: 'boredom_rotation' };
    }

    // Stabilize after 2+ wins with current tactic (don't change a winning formula)
    const recentWins = recentResults.slice(0, 2).filter(r => r === 'W').length;
    if (recentWins >= 2 && tacticAge >= 2) {
        return { tactic: currentTactic, changed: false, reason: null };
    }

    // Determine pivot probability based on losing streak
    let pivotChance = 0;
    if (losses >= 5) pivotChance = 0.95;
    else if (losses >= 3) pivotChance = 0.70;
    else if (losses >= 2) pivotChance = 0.30;

    if (pivotChance === 0 || rand() > pivotChance) {
        return { tactic: currentTactic, changed: false, reason: null };
    }

    // Pick new tactic (not current one, considering OVR mismatch)
    const newTactic = selectNewTactic(currentTactic, ovrDiff, rand);
    const reason = losses >= 5 ? 'losing_streak' : losses >= 3 ? 'losing_streak' : 'ovr_mismatch';

    return { tactic: newTactic, changed: true, reason };
}

/**
 * Inicializa estado de tática para um time NPC.
 */
export function initNpcTacticState() {
    return {
        currentTactic: 'normal',
        tacticAge: 0,
        recentResults: [],
    };
}

/**
 * Atualiza estado após partida (registra resultado).
 */
export function recordNpcResult(state, result) {
    const updated = { ...state };
    updated.recentResults = [result, ...state.recentResults].slice(0, 10);
    updated.tacticAge = state.tacticAge + 1;
    return updated;
}

/**
 * Aplica sugestão de tática ao estado.
 */
export function applyNpcTacticAdvice(state, advice) {
    if (!advice.changed) return { ...state, tacticAge: state.tacticAge };
    return { ...state, currentTactic: advice.tactic, tacticAge: 0 };
}

// ─── helpers ────────────────────────────────────────────────

function countTrailingLosses(results) {
    let count = 0;
    for (const r of results) {
        if (r === 'L') count++;
        else break;
    }
    return count;
}

function selectNewTactic(current, ovrDiff, rand) {
    // OVR underdog: prefer defensive or counter
    let preferred;
    if (ovrDiff <= -10) {
        preferred = ['defensive', 'counter'];
    } else if (ovrDiff >= 10) {
        // OVR dominant: prefer offensive or pressing
        preferred = ['offensive', 'pressing'];
    } else {
        // Balanced: rotate through all except current
        preferred = TACTIC_KEYS.filter(t => t !== current);
    }

    const candidates = preferred.filter(t => t !== current);
    if (candidates.length === 0) {
        // Fallback: any tactic except current
        const fallback = TACTIC_KEYS.filter(t => t !== current);
        return fallback[Math.floor(rand() * fallback.length)];
    }
    return candidates[Math.floor(rand() * candidates.length)];
}

function seededRandom(seed) {
    let s = seed;
    return function () {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}
