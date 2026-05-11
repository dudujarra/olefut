/* eslint-disable no-unused-vars */
/**
 * StarProtectionSystem — SPEC-075: Craque Protegido pelo Técnico
 *
 * Técnico declara proteção a 1 jogador. Board tentando vender → tensão spike.
 * narrativeState calculado a partir de performance real do protegido.
 *
 * Stateful: armazena proteção ativa por managerId.
 */

const _protected = new Map(); // managerId → protectionState

/**
 * Declara proteção a um jogador.
 * @throws 'AlreadyProtecting' se já há protegido
 * @throws 'PlayerUnavailableLongTerm' se injuryWeeksLeft > 8
 */
export function protect({ managerId, playerId, playerName = 'Jogador', playerOvr = 70, publicDeclaration = false, injuryWeeksLeft = 0 } = {}) {
    if (_protected.has(managerId)) throw new Error('AlreadyProtecting');
    if (injuryWeeksLeft > 8) throw new Error('PlayerUnavailableLongTerm');

    const state = {
        protectedPlayerId: playerId,
        protectedPlayerName: playerName,
        active: true,
        declaredPublicly: publicDeclaration,
        performanceSince: { games: 0, goals: 0, assists: 0, avgRating: 7.0 },
        narrativeState: 'neutral',
    };
    _protected.set(managerId, state);

    const result = { protection: state };
    if (publicDeclaration) {
        result.pressEvent = {
            type: 'manager_protects_player',
            description: `Técnico declara apoio público a ${playerName}. A cidade inteira vai acompanhar.`,
            sentiment: 'neutral',
        };
    }
    return result;
}

/**
 * Retorna estado de proteção atual (ou null).
 */
export function getProtected(managerId) {
    return _protected.get(managerId) || null;
}

/**
 * Revoga proteção atual.
 */
export function revoke({ managerId } = {}) {
    const current = _protected.get(managerId);
    if (!current) return { narrativeEvent: { type: 'nothing' } };
    _protected.delete(managerId);
    return {
        narrativeEvent: {
            type: 'manager_revoked_protection',
            description: `Técnico encerrou a proteção pública a ${current.protectedPlayerName}.`,
            sentiment: 'neutral',
        },
    };
}

/**
 * Board tenta vender jogador protegido → tensão spike.
 */
export function onBoardSellAttempt({ managerId, playerId } = {}) {
    const current = _protected.get(managerId);
    if (!current || current.protectedPlayerId !== playerId) return null;
    return {
        type: 'board_threatened_protected',
        tensionDelta: -30,
        publicReaction: 'Torcida apoia técnico. Diretoria sob pressão.',
        managerChoice: 'defend',
    };
}

/**
 * Computa narrativeState a partir da performance registrada.
 */
export function computeState({ performanceSince } = {}) {
    const { games = 0, avgRating = 7.0 } = performanceSince;
    let narrativeState = 'neutral';
    if (games >= 5) {
        if (avgRating >= 7.5) narrativeState = 'hero';
        else if (avgRating < 6.0) narrativeState = 'villain';
    }
    return { narrativeState };
}

/**
 * Gera eventos narrativos baseados no state atual.
 */
export function generateNarrativeEvents({ narrativeState, playerName = 'Jogador' } = {}) {
    if (narrativeState === 'hero') {
        return [{ type: 'press_headline', sentiment: 'positive', text: `${playerName} confirma genialidade do técnico.` }];
    }
    if (narrativeState === 'villain') {
        return [{ type: 'press_headline', sentiment: 'negative', text: `Mídia questiona escolha do técnico por ${playerName}.` }];
    }
    return [];
}

/** Update performance stats for protected player */
export function updatePerformance({ managerId, goals = 0, assists = 0, rating = 7.0 } = {}) {
    const current = _protected.get(managerId);
    if (!current) return;
    const p = current.performanceSince;
    p.games++;
    p.goals += goals;
    p.assists += assists;
    p.avgRating = (p.avgRating * (p.games - 1) + rating) / p.games;
    current.narrativeState = computeState({ performanceSince: p }).narrativeState;
}
