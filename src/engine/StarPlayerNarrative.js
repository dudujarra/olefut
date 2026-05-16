/**
 * SPEC-F4.2 + F4.3: StarPlayerNarrative
 * Pure logic for generating star player quotes and detecting narrative moments.
 */

export const WEEKLY_QUOTE_TEMPLATES = [
    "O {PLAYER} esta treinando forte, o foco e absoluto na proxima partida.",
    "{PLAYER} foi o ultimo a sair do campo no treino de hoje.",
    "Jornalistas elogiam a forma fisica de {PLAYER} nesta semana.",
    "{PLAYER} deu entrevista garantindo raca no proximo jogo.",
    "Clima bom: {PLAYER} comandou as brincadeiras no vestiario.",
    "Rumores sobre {PLAYER} sao ignorados pelo elenco.",
    "{PLAYER} fez trabalho de recuperacao intenso no DM.",
    "Torcida fez faixa especial para {PLAYER} na porta do CT.",
    "A precisao de {PLAYER} nos passes impressionou o tecnico hoje.",
    "{PLAYER} e um lider nato dentro e fora de campo."
];

export const MOMENT_TEMPLATES = {
    first_goal: "Primeiro gol na temporada para {PLAYER}!",
    hat_trick: "Hat-trick espetacular de {PLAYER}!",
    fifty_apps: "{PLAYER} completa 50 jogos pelo clube!",
    hundred_apps: "Marca historica: 100 jogos de {PLAYER}!",
    long_injury: "Drama: {PLAYER} sofre lesao e para por {WEEKS} semanas.",
    derby_winner: "{PLAYER} decide o classico e consagra a vitoria!",
    title_winner: "{PLAYER} levanta a taca do {TROPHY} com a equipe!"
};

/**
 * Retorna uma quote aleatoria baseada em seed deterministica.
 * @param {object} player 
 * @param {number} seed 
 * @returns {string}
 */
export function getWeeklyQuote(player, seed = 0) {
    if (!player || !player.name) return '';
    const idx = Math.abs(seed) % WEEKLY_QUOTE_TEMPLATES.length;
    return WEEKLY_QUOTE_TEMPLATES[idx].replace('{PLAYER}', player.name);
}

/**
 * Detecta um momento narrativo na partida.
 * Ordem de prioridade (highest first):
 * 1. title_winner
 * 2. long_injury
 * 3. hat_trick
 * 4. derby_winner
 * 5. hundred_apps
 * 6. fifty_apps
 * 7. first_goal
 * 
 * @param {object} player 
 * @param {object} context 
 * @returns {object|null}
 */
export function detectStarMoment(player, context = {}) {
    if (!player) return null;

    if (context.trophyWon) {
        return {
            type: 'title_winner',
            text: MOMENT_TEMPLATES.title_winner.replace('{PLAYER}', player.name).replace('{TROPHY}', context.trophyWon)
        };
    }

    if (context.injuryWeeks >= 6) {
        return {
            type: 'long_injury',
            text: MOMENT_TEMPLATES.long_injury.replace('{PLAYER}', player.name).replace('{WEEKS}', context.injuryWeeks.toString())
        };
    }

    if (context.goalsThisMatch >= 3) {
        return {
            type: 'hat_trick',
            text: MOMENT_TEMPLATES.hat_trick.replace('{PLAYER}', player.name)
        };
    }

    if (context.isDerby && context.goalsThisMatch >= 1 && context.matchResult === 'W') {
        return {
            type: 'derby_winner',
            text: MOMENT_TEMPLATES.derby_winner.replace('{PLAYER}', player.name)
        };
    }

    if (player.seasonApps >= 100 && context.previousApps < 100) {
        return {
            type: 'hundred_apps',
            text: MOMENT_TEMPLATES.hundred_apps.replace('{PLAYER}', player.name)
        };
    }

    if (player.seasonApps >= 50 && context.previousApps < 50) {
        return {
            type: 'fifty_apps',
            text: MOMENT_TEMPLATES.fifty_apps.replace('{PLAYER}', player.name)
        };
    }

    if (player.seasonGoals >= 1 && context.previousGoals === 0) {
        return {
            type: 'first_goal',
            text: MOMENT_TEMPLATES.first_goal.replace('{PLAYER}', player.name)
        };
    }

    return null;
}
