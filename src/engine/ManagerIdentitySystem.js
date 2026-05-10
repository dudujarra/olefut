/**
 * ManagerIdentitySystem — SPEC-070: Técnico como Personagem
 *
 * Transforma o técnico em personagem com reputação, estilo tático, ranking.
 * Base para SPEC-071 (metas de contrato) e SPEC-073 (propostas orgânicas).
 *
 * Stateless: recebe dados, retorna identidade calculada.
 */

const REP_EVENTS = {
    national_title:  +10,
    regional_title:  +5,
    promotion:       +5,
    relegation:      -8,
    fired:           -3,
};

const REP_FLOOR = 0;
const REP_CAP   = 100;

/**
 * Computa identidade completa de um técnico.
 *
 * @param {object} opts
 * @param {number} [opts.managerId]
 * @param {string} [opts.name]
 * @param {boolean} [opts.isPlayerManager=false]
 * @param {Array<{tactic:string, gamesUsed:number, winRate:number}>} [opts.tacticHistory=[]]
 * @param {Array<{clubName:string, seasonsManaged:number, titlesWon:number, promoted:boolean, relegated:boolean}>} [opts.careerHistory=[]]
 * @param {number} [opts.currentReputation=10]
 * @returns {object} identidade calculada
 */
export function compute({ managerId = 0, name = 'Técnico', isPlayerManager = false, tacticHistory = [], careerHistory = [], currentReputation = 10 } = {}) {
    const reputation = clampRep(currentReputation);
    const reputationTier = computeTier(reputation);
    const { dominantStyle, styleConfidence } = computeStyle(tacticHistory);
    const careerHighlight = computeHighlight(name, careerHistory);
    const attractiveness = computeAttractiveness(reputation, isPlayerManager);

    return {
        managerId,
        name,
        reputation,
        reputationTier,
        dominantStyle,
        styleConfidence,
        careerHighlight,
        attractiveness,
        ranking: null, // assigned by computeLeagueRankings
    };
}

/**
 * Aplica evento de carreira e retorna novo valor de reputação.
 *
 * @param {object} opts
 * @param {string} opts.event — 'national_title'|'regional_title'|'promotion'|'relegation'|'fired'
 * @param {number} opts.currentReputation
 * @returns {{ reputation: number }}
 */
export function applyEvent({ event, currentReputation = 10 }) {
    const delta = REP_EVENTS[event] ?? 0;
    return { reputation: clampRep(currentReputation + delta) };
}

/**
 * Computa ranking ordinal entre todos os técnicos (sem empates).
 *
 * @param {Array<{managerId, reputation}>} managers
 * @returns {Array<{managerId, ranking}>} — mesmo tamanho, ordenados por ranking
 */
export function computeLeagueRankings(managers) {
    const sorted = [...managers].sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
    return sorted.map((m, i) => ({ ...m, ranking: i + 1 }));
}

// ─── helpers ────────────────────────────────────────────────

function clampRep(v) {
    return Math.max(REP_FLOOR, Math.min(REP_CAP, Math.round(v)));
}

function computeTier(rep) {
    if (rep >= 80) return 'lenda';
    if (rep >= 50) return 'experiente';
    if (rep >= 20) return 'promissor';
    return 'iniciante';
}

function computeStyle(tacticHistory) {
    if (!tacticHistory || tacticHistory.length === 0) {
        return { dominantStyle: 'balanced', styleConfidence: 0 };
    }

    const totalGames = tacticHistory.reduce((s, t) => s + (t.gamesUsed || 0), 0);
    if (totalGames === 0) return { dominantStyle: 'balanced', styleConfidence: 0 };

    const sorted = [...tacticHistory].sort((a, b) => (b.gamesUsed || 0) - (a.gamesUsed || 0));
    const top = sorted[0];
    const topPct = Math.round((top.gamesUsed / totalGames) * 100);

    if (topPct >= 40) {
        return { dominantStyle: top.tactic, styleConfidence: topPct };
    }
    return { dominantStyle: 'balanced', styleConfidence: topPct };
}

function computeHighlight(name, careerHistory) {
    if (!careerHistory || careerHistory.length === 0) {
        return 'Estreia como técnico';
    }

    // Best highlight: most recent title, then best promotion, then tenure
    const titles = careerHistory.filter(c => c.titlesWon > 0);
    if (titles.length > 0) {
        const last = titles[titles.length - 1];
        return `Campeão pelo ${last.clubName}`;
    }

    const promos = careerHistory.filter(c => c.promoted);
    if (promos.length > 0) {
        const last = promos[promos.length - 1];
        return `Promoveu o ${last.clubName}`;
    }

    const last = careerHistory[careerHistory.length - 1];
    const seasons = last.seasonsManaged || 1;
    return `${seasons} ${seasons === 1 ? 'temporada' : 'temporadas'} no ${last.clubName}`;
}

function computeAttractiveness(reputation, isPlayerManager) {
    if (isPlayerManager) {
        // Player-manager: always available to all club sizes
        if (reputation >= 81) return { smallClub: 5, midClub: 30, bigClub: 80 };
        if (reputation >= 61) return { smallClub: 20, midClub: 60, bigClub: 40 };
        if (reputation >= 31) return { smallClub: 50, midClub: 70, bigClub: 10 };
        return { smallClub: 80, midClub: 20, bigClub: 0 };
    }
    // NPC managers: same scale
    if (reputation >= 81) return { smallClub: 5, midClub: 30, bigClub: 80 };
    if (reputation >= 61) return { smallClub: 20, midClub: 60, bigClub: 40 };
    if (reputation >= 31) return { smallClub: 50, midClub: 70, bigClub: 10 };
    return { smallClub: 80, midClub: 20, bigClub: 0 };
}
