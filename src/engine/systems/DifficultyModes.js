/**
 * DifficultyModes — SPEC-073 (Sprint L)
 *
 * 3 modes affecting economy, board patience, injury rate, training XP.
 * Persisted in localStorage 'olefut_difficulty'.
 */

export const DIFFICULTY_MODES = {
    easy: {
        id: 'easy',
        name: 'Fácil',
        emoji: '🟢',
        description: 'Para quem quer relaxar. Dinheiro fácil, board paciente.',
        modifiers: {
            economyMult: 1.3,        // +30% receita
            transferCostMult: 0.7,   // -30% custo transferência
            wageBudgetMult: 1.5,     // +50% wage cap
            boardPatience: 1.5,      // 50% mais paciente
            injuryRateMult: 0.7,     // 30% menos lesões
            trainingXPMult: 1.3,     // +30% XP treino
            scoutAccuracyBonus: 10   // +10% accuracy scout
        }
    },
    normal: {
        id: 'normal',
        name: 'Normal',
        emoji: '🟡',
        description: 'Experiência balanceada. Default.',
        modifiers: {
            economyMult: 1.0,
            transferCostMult: 1.0,
            wageBudgetMult: 1.0,
            boardPatience: 1.0,
            injuryRateMult: 1.0,
            trainingXPMult: 1.0,
            scoutAccuracyBonus: 0
        }
    },
    hard: {
        id: 'hard',
        name: 'Difícil',
        emoji: '🔴',
        description: 'Veterano. Economia apertada, board exige resultados.',
        modifiers: {
            economyMult: 0.7,        // -30% receita
            transferCostMult: 1.3,   // +30% custo
            wageBudgetMult: 0.7,     // -30% wage cap
            boardPatience: 0.7,      // 30% menos paciente
            injuryRateMult: 1.3,     // +30% lesões
            trainingXPMult: 0.7,     // -30% XP
            scoutAccuracyBonus: -10  // -10% accuracy
        }
    },
    sinistro: {
        id: 'sinistro',
        name: 'Sinistro',
        emoji: '💀',
        description: 'Modo inferno. Receita mínima, board implacável, lesões constantes.',
        modifiers: {
            economyMult: 0.15,       // -85% receita (bilheteria, TV, prêmios, promoção)
            transferCostMult: 3.0,   // +200% custo transferência
            wageBudgetMult: 0.3,     // -70% wage cap
            boardPatience: 0.2,      // 80% menos paciente
            boardFireCooldown: 20,   // mínimo 20 semanas entre demissões
            injuryRateMult: 3.0,     // 3× lesões
            trainingXPMult: 0.25,    // -75% XP treino
            scoutAccuracyBonus: -30, // -30% accuracy scout
            matchStrengthPenalty: 0.42, // -58% força em partidas (compensa winStreak/DDA parciais)
            maintenanceMult: 3.5,    // 3.5× custos de manutenção
            winStreakMult: 0.3,      // win streak bonus existe mas a 30% do normal
            ddaLossMult: 0.5         // DDA ajuda em loss streaks, mas pela metade
        }
    }
};

const STORAGE_KEY = 'olefut_difficulty';
let _memoryFallback = null; // in-memory fallback for headless/Node/test envs

export function getDifficulty() {
    try {
        const id = localStorage.getItem(STORAGE_KEY);
        if (id && DIFFICULTY_MODES[id]) return DIFFICULTY_MODES[id];
    } catch { /* localStorage unavailable (Node/test) */ }
    // Fallback: in-memory state (set by setDifficulty in headless mode)
    if (_memoryFallback && DIFFICULTY_MODES[_memoryFallback]) {
        return DIFFICULTY_MODES[_memoryFallback];
    }
    return DIFFICULTY_MODES.normal;
}

export function setDifficulty(modeId) {
    if (!DIFFICULTY_MODES[modeId]) return false;
    _memoryFallback = modeId; // always set in-memory
    try { localStorage.setItem(STORAGE_KEY, modeId); } catch { /* ignore */ }
    return true;
}

export function applyDifficultyToValue(rawValue, modifierKey) {
    const diff = getDifficulty();
    const mult = diff.modifiers[modifierKey] ?? 1.0;
    return Math.round(rawValue * mult);
}

// SPEC-147: DDA calibrated boost curve (data: deep soak max win streak 18, max loss 11)
export function calcOpponentBoost(streak) {
    if (streak <= 0) {
        const severity = Math.min(11, Math.abs(streak));
        return 1.0 - (severity / 11) * 0.18; // min 0.82 em streak -11
    }
    const severity = Math.min(18, streak);
    return 1.0 + (severity / 18) * 0.35; // max 1.35 em streak +18
}
