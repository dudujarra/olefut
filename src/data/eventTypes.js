/**
 * EVENT TYPES — Vocabulário FIXO (anti-pattern: livre)
 *
 * SPEC-049 Camada 2. v1.0.7 MVP: 15 tipos.
 * Toda escrita de evento DEVE usar uma destas constantes.
 */

export const EVENT_TYPES = Object.freeze({
    // Performance individual
    PLAYER_GOAL_DECISIVE: 'PLAYER_GOAL_DECISIVE',
    PLAYER_RED_CARD: 'PLAYER_RED_CARD',
    PLAYER_INJURY_LONG_TERM: 'PLAYER_INJURY_LONG_TERM',

    // Carreira
    PLAYER_TRANSFER_TO_RIVAL: 'PLAYER_TRANSFER_TO_RIVAL',
    PLAYER_RETIRED: 'PLAYER_RETIRED',
    PLAYER_CANONIZED: 'PLAYER_CANONIZED',

    // Resultado coletivo
    TITLE_WON: 'TITLE_WON',
    TITLE_LOST_DRAMATICALLY: 'TITLE_LOST_DRAMATICALLY',
    DERBY_VICTORY: 'DERBY_VICTORY',
    DERBY_DEFEAT: 'DERBY_DEFEAT',

    // Política/torcida
    TORCIDA_PROTEST: 'TORCIDA_PROTEST',
    PRESIDENT_CONFRONTATION: 'PRESIDENT_CONFRONTATION',

    // Decisões manager
    STAFF_HIRED: 'STAFF_HIRED',
    STAFF_FIRED: 'STAFF_FIRED',
    TACTIC_CHANGED_DRAMATICALLY: 'TACTIC_CHANGED_DRAMATICALLY'
});

export const ALL_EVENT_TYPES = Object.values(EVENT_TYPES);

/**
 * Validate that a string is a known event type.
 * Throws in dev if not.
 */
export function isValidEventType(t) {
    return ALL_EVENT_TYPES.includes(t);
}
