/**
 * SPEC-138: Penalidade de reward por monotonia tática.
 *
 * Quebra o atrator observado no deep soak (Monotony SPEC-100 = 0-22).
 * Não força mudança de tática — apenas torna exploração mais vantajosa.
 *
 * Tiers calibrados com dados de deep soak (rewards entre -13 e +15):
 *   < 6 sem  →  0.0  (aceitável)
 *   6-9 sem  → -0.5  (leve)
 *  10-14 sem → -1.5  (significativo)
 *   ≥ 15 sem → -3.0  (forçar exploração)
 * Exceção: win streak de 3 últimas → sem penalidade (tática funcionando).
 */

const PENALTY_TIERS = [
    { minWeeks: 15, penalty: -3.0 },
    { minWeeks: 10, penalty: -1.5 },
    { minWeeks: 6,  penalty: -0.5 },
    { minWeeks: 0,  penalty:  0.0 },
];

/**
 * @param {object} params
 * @param {number} params.consecutiveWeeks  - semanas com mesma tática
 * @param {Array<'W'|'D'|'L'>} params.recentResults - últimas semanas (rollingForm)
 * @param {number} params.currentReward - reward base antes da penalidade
 * @returns {{ adjustedReward: number, monotonyPenalty: number, shouldExplore: boolean }}
 */
export function applyMonotonyPenalty({ consecutiveWeeks = 0, recentResults = [], currentReward = 0 }) {
    const last3 = recentResults.slice(-3);
    const isWinStreak = last3.length === 3 && last3.every(r => r === 'W' || r === 1);

    if (isWinStreak) {
        return { adjustedReward: currentReward, monotonyPenalty: 0, shouldExplore: false };
    }

    const tier = PENALTY_TIERS.find(t => consecutiveWeeks >= t.minWeeks);
    const monotonyPenalty = tier?.penalty ?? 0;
    const adjustedReward = Math.max(currentReward + monotonyPenalty, -10);

    return {
        adjustedReward,
        monotonyPenalty,
        shouldExplore: monotonyPenalty < 0,
    };
}
