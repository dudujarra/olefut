/**
 * WinStreakModifierSystem — SPEC-180 implementação
 *
 * Simétrico a LossStreakResponseSystem (SPEC-077). Detecta sequências
 * consecutivas de vitórias por team e aplica modifiers positivos.
 *
 * Thresholds revisados pós-baseline AKITA-288 (baseline winStreakMax
 * média ~5, max overall 9 em 20 saves):
 * - mild: 3W (was 3, mantido)
 * - strong: 5W (was 5, mantido)
 * - phenom: 7W (era 8, abaixado pra hit ~15-20% saves vs 5%)
 *
 * Pure module. Stateful via Map por teamId. Determinístico.
 */

const _winStreaks = new Map();

const SEVERITY_THRESHOLDS = {
    mild: 3,
    strong: 5,
    phenom: 7, // revisado de 8 pra 7 após baseline
};

const MODIFIERS = {
    none:   { attrBoost: 0, moraleDelta: 0,  tensionDelta: 0,   mediaEvent: false, descriptor: 'Sem embalo' },
    mild:   { attrBoost: 2, moraleDelta: 5,  tensionDelta: 0,   mediaEvent: false, descriptor: 'Embalo leve — time confiante' },
    strong: { attrBoost: 4, moraleDelta: 10, tensionDelta: -3,  mediaEvent: false, descriptor: 'Embalo forte — time joga solto' },
    phenom: { attrBoost: 6, moraleDelta: 15, tensionDelta: 5,   mediaEvent: true,  descriptor: 'Fenômeno — imprensa em delírio, board com expectativa alta' },
};

const FEATURE_FLAG = 'ENABLE_WIN_STREAK';

function isFeatureEnabled() {
    // Default OFF — gated via globalThis ou import.meta.env futuro
    if (typeof globalThis !== 'undefined' && globalThis[FEATURE_FLAG] === true) return true;
    return false;
}

/**
 * Computa severity baseado no streak count.
 *
 * @param {number} streak
 * @returns {'none'|'mild'|'strong'|'phenom'}
 */
export function computeSeverity(streak) {
    if (streak >= SEVERITY_THRESHOLDS.phenom) return 'phenom';
    if (streak >= SEVERITY_THRESHOLDS.strong) return 'strong';
    if (streak >= SEVERITY_THRESHOLDS.mild) return 'mild';
    return 'none';
}

/**
 * Registra resultado de partida (W/D/L) atualizando streak interno.
 *
 * @param {{ teamId: number, result: 'W'|'D'|'L' }} opts
 */
export function recordResult({ teamId, result } = {}) {
    if (typeof teamId !== 'number') return;
    if (result === 'W') {
        _winStreaks.set(teamId, (_winStreaks.get(teamId) || 0) + 1);
    } else if (result === 'D' || result === 'L') {
        _winStreaks.set(teamId, 0);
    }
}

/**
 * Retorna streak atual.
 *
 * @param {number} teamId
 * @returns {number}
 */
export function getCurrentStreak(teamId) {
    return _winStreaks.get(teamId) || 0;
}

/**
 * Avalia situação de streak: severity + modifiers aplicáveis.
 *
 * @param {object} opts
 * @returns {object}
 */
export function evaluate({ teamId = 0, streakLength = null, currentMorale = 50, currentTension = 50 } = {}) {
    const streak = streakLength !== null ? streakLength : getCurrentStreak(teamId);
    const severity = computeSeverity(streak);
    const mods = MODIFIERS[severity];

    return {
        streakLength: streak,
        severity,
        attrBoost: mods.attrBoost,
        moraleDelta: mods.moraleDelta,
        tensionDelta: mods.tensionDelta,
        mediaEvent: mods.mediaEvent,
        descriptor: mods.descriptor,
        currentMorale,
        currentTension,
    };
}

/**
 * Modifier ready para aplicar em pré-jogo. Feature-flag gated.
 *
 * @param {number} teamId
 * @returns {{ attrBonus: number, descriptor: string, severity: string }}
 */
export function getModifiersForMatch(teamId) {
    if (!isFeatureEnabled()) {
        return { attrBonus: 0, descriptor: '', severity: 'none' };
    }
    const streak = getCurrentStreak(teamId);
    const severity = computeSeverity(streak);
    return {
        attrBonus: MODIFIERS[severity].attrBoost,
        descriptor: MODIFIERS[severity].descriptor,
        severity,
    };
}

/**
 * Reset streak (test/dev).
 */
export function reset(teamId) {
    if (typeof teamId === 'number') _winStreaks.delete(teamId);
}

export function resetAll() {
    _winStreaks.clear();
}

export { SEVERITY_THRESHOLDS, MODIFIERS, FEATURE_FLAG, isFeatureEnabled };
