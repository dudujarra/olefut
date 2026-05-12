/**
 * MatchEventClassifier — SPEC-B1
 *
 * Classifica eventos da partida em tiers visuais para hierarquia de render.
 * Pure function. Headless.
 */

const TIER_MAP = {
    // Highlights — pause/modal candidates, full-screen visual treatment
    goal: 'highlight',
    red: 'highlight',
    'red-card': 'highlight',

    // Tactical — importantes para gestão, surface mas sem cinematic
    substitution: 'tactical',
    sub: 'tactical',
    injury: 'tactical',
    'tactic-change': 'tactical',

    // Minor — narrativa de fluxo, pass-through rápido
    yellow: 'minor',
    'yellow-card': 'minor',
    chance: 'minor',
    corner: 'minor',
    'free-kick': 'minor',
    foul: 'minor',
    narration: 'minor',
    save: 'minor',
    miss: 'minor',
};

const VALID_TIERS = ['highlight', 'tactical', 'minor'];

/**
 * Classifica um event type. Retorna 'minor' para tipo desconhecido (default safe).
 *
 * @param {string} eventType
 * @returns {'highlight'|'tactical'|'minor'}
 */
export function getEventTier(eventType) {
    if (!eventType || typeof eventType !== 'string') return 'minor';
    return TIER_MAP[eventType] || 'minor';
}

/**
 * Para arrays de eventos: retorna apenas highlights.
 *
 * @param {Array<{type:string}>} events
 * @returns {Array}
 */
export function filterHighlights(events) {
    if (!Array.isArray(events)) return [];
    return events.filter(e => getEventTier(e?.type) === 'highlight');
}

/**
 * Para arrays de eventos: agrupa por tier.
 *
 * @param {Array<{type:string}>} events
 * @returns {{ highlight: Array, tactical: Array, minor: Array }}
 */
export function groupByTier(events) {
    const groups = { highlight: [], tactical: [], minor: [] };
    if (!Array.isArray(events)) return groups;
    events.forEach(e => {
        const tier = getEventTier(e?.type);
        groups[tier].push(e);
    });
    return groups;
}

export { VALID_TIERS, TIER_MAP };
