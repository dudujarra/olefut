/**
 * StarPlayerNarrative — SPEC-F4.2 + F4.3
 *
 * Geração de frases semanais + detecção de moments especiais
 * pro Star Player. Templates PT-BR + integração futura LLM.
 *
 * Pure module. Determinístico via seed.
 */

const WEEKLY_QUOTE_TEMPLATES = [
    '{name} treinou pesado essa semana. Foco total no próximo jogo.',
    '{name} reclamou da escalação no vestiário. Tensão no ar.',
    '{name} celebrou contrato extendido. Mostrou comprometimento.',
    '{name} foi visto saindo de boate de madrugada. Imprensa especula.',
    '{name} disse em coletiva: "Vamos honrar o manto." Profissional.',
    '{name} estava cabisbaixo no treino. Algo o incomoda.',
    '{name} foi tietado por crianças na saída do CT. Carismático.',
    '{name} reuniu o elenco pra discurso motivacional. Capitão de fato.',
    '{name} fechou parceria com nova marca de chuteira. Visibilidade alta.',
    '{name} foi convocado pra seleção. Orgulho do clube.',
    '{name} declarou amor à torcida em rede social. Hype subiu.',
    '{name} treinou separado, individual. Recuperação fisica.',
];

const MOMENT_TEMPLATES = {
    first_goal: '{name} marca seu PRIMEIRO gol pelo clube!',
    fifty_apps: '{name} alcança 50 jogos pela camisa! Meio centenário.',
    hundred_apps: '{name} atinge 100 jogos. Marca histórica!',
    hat_trick: '{name} faz HAT-TRICK! Show da estrela.',
    long_injury: '{name} sai de maca. Lesão grave. {weeks} semanas fora.',
    title_winner: '{name} entra pra história! Conquistou {trophy} pelo clube.',
    derby_winner: '{name} marca em CLÁSSICO! Decisivo no derby.',
    contract_extension: '{name} estende contrato. Promessa de fidelidade.',
    transfer_offer_rejected: '{name} recusou proposta milionária. "Aqui é meu lugar."',
    matchwinner_streak: '{name} é decisivo pela 3ª partida seguida. Em momento mágico.',
};

const MOMENT_THRESHOLDS = {
    fifty_apps: 50,
    hundred_apps: 100,
};

/**
 * Gera frase semanal pra star player baseado em seed (week + playerId).
 *
 * @param {object} player — squad player ou stub
 * @param {number} seed
 * @returns {string}
 */
export function getWeeklyQuote(player, seed = 0) {
    if (!player || !player.name) return '';
    const idx = Math.abs(seed) % WEEKLY_QUOTE_TEMPLATES.length;
    return WEEKLY_QUOTE_TEMPLATES[idx].replace('{name}', player.name);
}

/**
 * Detecta moment qualificável dado state do player + contexto.
 *
 * @param {object} player
 * @param {object} [context] — { previousGoals, previousApps, isDerby, trophyWon, etc }
 * @returns {{ type: string, text: string } | null}
 */
export function detectStarMoment(player, context = {}) {
    if (!player || !player.name) return null;

    const goals = player.seasonGoals || player.careerGoals || 0;
    const apps = player.seasonApps || player.careerApps || 0;
    const prevGoals = context.previousGoals || 0;
    const prevApps = context.previousApps || 0;

    // Hat-trick (3+ gols em 1 jogo)
    if (typeof context.goalsThisMatch === 'number' && context.goalsThisMatch >= 3) {
        return { type: 'hat_trick', text: MOMENT_TEMPLATES.hat_trick.replace('{name}', player.name) };
    }

    // First goal (era 0, agora 1+)
    if (prevGoals === 0 && goals >= 1) {
        return { type: 'first_goal', text: MOMENT_TEMPLATES.first_goal.replace('{name}', player.name) };
    }

    // 50 apps
    if (prevApps < MOMENT_THRESHOLDS.fifty_apps && apps >= MOMENT_THRESHOLDS.fifty_apps) {
        return { type: 'fifty_apps', text: MOMENT_TEMPLATES.fifty_apps.replace('{name}', player.name) };
    }

    // 100 apps
    if (prevApps < MOMENT_THRESHOLDS.hundred_apps && apps >= MOMENT_THRESHOLDS.hundred_apps) {
        return { type: 'hundred_apps', text: MOMENT_TEMPLATES.hundred_apps.replace('{name}', player.name) };
    }

    // Long injury (4+ semanas)
    if (typeof context.injuryWeeks === 'number' && context.injuryWeeks >= 4) {
        return {
            type: 'long_injury',
            text: MOMENT_TEMPLATES.long_injury
                .replace('{name}', player.name)
                .replace('{weeks}', String(context.injuryWeeks)),
        };
    }

    // Derby winner (gol em derby + venceu)
    if (context.isDerby && context.goalsThisMatch >= 1 && context.matchResult === 'W') {
        return {
            type: 'derby_winner',
            text: MOMENT_TEMPLATES.derby_winner.replace('{name}', player.name),
        };
    }

    // Title winner
    if (context.trophyWon) {
        return {
            type: 'title_winner',
            text: MOMENT_TEMPLATES.title_winner
                .replace('{name}', player.name)
                .replace('{trophy}', context.trophyWon),
        };
    }

    return null;
}

export { WEEKLY_QUOTE_TEMPLATES, MOMENT_TEMPLATES, MOMENT_THRESHOLDS };
