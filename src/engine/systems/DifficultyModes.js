/**
 * DifficultyModes — SPEC-073 (Sprint L)
 *
 * 3 modes affecting economy, board patience, injury rate, training XP.
 * Persisted in localStorage 'elifoot_difficulty'.
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
            economyMult: 0.4,        // -60% receita
            transferCostMult: 2.0,   // +100% custo transferência
            wageBudgetMult: 0.4,     // -60% wage cap
            boardPatience: 0.3,      // 70% menos paciente
            injuryRateMult: 2.0,     // 2× lesões
            trainingXPMult: 0.4,     // -60% XP treino
            scoutAccuracyBonus: -25  // -25% accuracy scout
        }
    }
};

const STORAGE_KEY = 'elifoot_difficulty';

export function getDifficulty() {
    try {
        const id = localStorage.getItem(STORAGE_KEY);
        return DIFFICULTY_MODES[id] || DIFFICULTY_MODES.normal;
    } catch {
        return DIFFICULTY_MODES.normal;
    }
}

export function setDifficulty(modeId) {
    if (!DIFFICULTY_MODES[modeId]) return false;
    try { localStorage.setItem(STORAGE_KEY, modeId); } catch { /* ignore */ }
    return true;
}

export function applyDifficultyToValue(rawValue, modifierKey) {
    const diff = getDifficulty();
    const mult = diff.modifiers[modifierKey] ?? 1.0;
    return Math.round(rawValue * mult);
}
