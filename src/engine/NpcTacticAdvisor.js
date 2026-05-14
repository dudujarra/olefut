import { rng as systemRng } from './rng.js';
import { getNpcProfile } from './NpcBehaviorProfile.js';

/**
 * NpcTacticAdvisor — SPEC-131: AI Tactic Pivot
 *
 * Detecta tática ineficaz em times NPC e sugere adaptação.
 * Resolve TACTIC_STUCK (100+ eventos em 203 seasons, Monotony score=11).
 * SPEC-137: suporta 4 levels de dificuldade via NpcBehaviorProfile.
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
export function adviseTactic({ currentTactic, recentResults = [], squadOvr = 65, opponentOvr = 65, tacticAge = 0, seed = null, npcLevel = null, isHome = true, position = 10, totalTeams = 20 }) {
    const rand = seed !== null ? seededRandom(seed) : systemRng;
    const profile = npcLevel ? getNpcProfile(npcLevel) : null;

    const losses = countTrailingLosses(recentResults);
    const ovrDiff = squadOvr - opponentOvr;

    // SPEC-137: usar tacticFlexibility do profile se fornecido
    const boredomThreshold = profile ? Math.round(1 / (profile.tacticFlexibility || 0.10)) : 10;
    const boredomChance = profile ? profile.tacticFlexibility * 3 : 0.30;

    if (tacticAge >= boredomThreshold && rand() < boredomChance) {
        const newTactic = selectNewTactic(currentTactic, ovrDiff, rand, { isHome, losses, position, totalTeams });
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

    // Pick new tactic (not current one, considering context)
    const newTactic = selectNewTactic(currentTactic, ovrDiff, rand, { isHome, losses, position, totalTeams });
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

function selectNewTactic(current, ovrDiff, rand, context = {}) {
    const { isHome = true, losses = 0, position = 10, totalTeams = 20 } = context;
    let preferred = [];

    const isRelegationZone = position > totalTeams - 4;
    const isEqual = Math.abs(ovrDiff) <= 3;
    const needsResult = isHome && (losses === 1 || losses === 2); // perdeu recente e agora joga em casa

    if (losses >= 3 || isRelegationZone) {
        // "Se perdendo ou ruim no campeonato, ele joga na defesa"
        preferred = ['defensive', 'counter'];
    } else if (isEqual || needsResult) {
        // "Se ele tiver no igual ele joga solto" / "Se ele precisa de resultado joga solto"
        preferred = isHome ? ['offensive', 'pressing'] : ['normal', 'counter'];
    } else if (ovrDiff <= -8) {
        // Muito mais fraco
        preferred = isHome ? ['defensive', 'counter'] : ['defensive'];
    } else if (ovrDiff >= 8) {
        // Muito mais forte
        preferred = isHome ? ['offensive', 'possession'] : ['normal', 'offensive'];
    } else {
        // Balanced/fallback
        preferred = isHome ? ['normal', 'offensive'] : ['normal', 'defensive'];
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
