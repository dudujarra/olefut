/**
 * MatchInstructions — SPEC-067 Mid-Match Tactics (simplified)
 *
 * Instructions applied next-match (engine sync limitation v1.0).
 * Real-time application aguarda RFCT-005 generator refactor.
 */

export const MATCH_INSTRUCTIONS = {
    pressure_high: {
        id: 'pressure_high',
        name: 'Pressão Alta',
        emoji: '🔥',
        description: 'Sobe linha defesa, pressiona saída de bola',
        effect: { ataModifier: 1.10, defModifier: 0.95, fitnessLoss: 5 }
    },
    pressure_low: {
        id: 'pressure_low',
        name: 'Pressão Baixa',
        emoji: '🛡️',
        description: 'Recua, espera erro adversário',
        effect: { ataModifier: 0.95, defModifier: 1.05, fitnessLoss: -2 }
    },
    long_ball: {
        id: 'long_ball',
        name: 'Bola Longa',
        emoji: '🚀',
        description: 'Lançamentos pra área, joga vertical',
        effect: { ataModifier: 1.05, longShotBoost: 0.15 }
    },
    short_pass: {
        id: 'short_pass',
        name: 'Posse Curta',
        emoji: '🎯',
        description: 'Triangulação, controle, paciência',
        effect: { ataModifier: 0.95, possessionBoost: 0.20, defModifier: 1.05 }
    },
    mark_individual: {
        id: 'mark_individual',
        name: 'Marcação Individual',
        emoji: '🎯',
        description: 'Marca homem-a-homem (top 3 adversários)',
        effect: { ataModifier: 0.95, defModifier: 1.10, foulRisk: 0.10 }
    },
    time_down: {
        id: 'time_down',
        name: 'Cera (Time Down)',
        emoji: '⏰',
        description: 'Lentifica jogo, segura resultado',
        effect: { fitnessLoss: -3, goalsExpected: -0.15 }
    },
    time_up: {
        id: 'time_up',
        name: 'Aceleração',
        emoji: '⚡',
        description: 'Tudo no ataque, busca gol',
        effect: { ataModifier: 1.20, defModifier: 0.85, fitnessLoss: 8 }
    }
};

export function applyInstruction(team, instructionId) {
    const inst = MATCH_INSTRUCTIONS[instructionId];
    if (!inst) return false;
    if (!team.activeInstructions) team.activeInstructions = [];
    if (!team.activeInstructions.includes(instructionId)) {
        team.activeInstructions.push(instructionId);
    }
    return true;
}

export function clearInstruction(team, instructionId) {
    if (!team.activeInstructions) return;
    team.activeInstructions = team.activeInstructions.filter(id => id !== instructionId);
}

export function getActiveInstructions(team) {
    return (team.activeInstructions || []).map(id => MATCH_INSTRUCTIONS[id]).filter(Boolean);
}
