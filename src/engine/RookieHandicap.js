/**
 * RookieHandicap — SPEC-A5
 *
 * Aplica handicap suave nas 3 primeiras partidas da 1ª temporada.
 * Reduz attrs do oponente para aumentar retention do novato.
 *
 * Pure function. Determinístico. Headless.
 */

const HANDICAP_CURVE = [0.90, 0.93, 0.97]; // matches 1, 2, 3
const HANDICAP_NEUTRAL = 1.0;

/**
 * Calcula multiplicador rookie handicap.
 *
 * @param {object} opts
 * @param {number} opts.seasonNumber
 * @param {number} opts.matchesPlayedSeason  — total wins+draws+losses na temporada atual
 * @returns {number} multiplier 0.90..1.0
 */
export function getRookieHandicap({ seasonNumber = 1, matchesPlayedSeason = 0 } = {}) {
    // Só aplica em temporada 1
    if (seasonNumber !== 1) return HANDICAP_NEUTRAL;

    // Só nas 3 primeiras partidas
    if (matchesPlayedSeason >= HANDICAP_CURVE.length) return HANDICAP_NEUTRAL;

    return HANDICAP_CURVE[matchesPlayedSeason];
}

/**
 * Conveniência: extrai contadores do engine e retorna multiplicador.
 *
 * @param {object} engine
 * @returns {number}
 */
export function getRookieHandicapFromEngine(engine) {
    if (!engine) return HANDICAP_NEUTRAL;
    const stats = engine.managerStats || {};
    const played = (stats.wins || 0) + (stats.draws || 0) + (stats.losses || 0);
    return getRookieHandicap({
        seasonNumber: engine.seasonNumber || 1,
        matchesPlayedSeason: played,
    });
}

export { HANDICAP_CURVE, HANDICAP_NEUTRAL };
