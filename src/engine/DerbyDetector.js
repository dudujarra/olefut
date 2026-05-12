/**
 * DerbyDetector — SPEC-C5.2
 *
 * Detecta se próxima partida é derby/rivalidade emergente baseado em
 * engine.rivalryHistory (SPEC-080).
 *
 * Pure helpers. Headless.
 */

const DERBY_THRESHOLD_MATCHES = 3; // rivalidade real após 3 confrontos

/**
 * Lista todos os teamIds com quem o player tem rivalidade ativa.
 *
 * @param {object} engine
 * @returns {Array<{ oppTeamId: number, matchCount: number, level: string }>}
 */
export function getActiveRivals(engine) {
    if (!engine || !engine.rivalryHistory) return [];
    const myId = engine.manager?.teamId;
    if (!myId) return [];

    const rivals = [];
    Object.keys(engine.rivalryHistory).forEach(key => {
        const [aIdStr, bIdStr] = key.split('_');
        const aId = parseInt(aIdStr);
        const bId = parseInt(bIdStr);
        if (aId !== myId && bId !== myId) return;
        const oppId = aId === myId ? bId : aId;
        const matches = engine.rivalryHistory[key] || [];
        if (matches.length === 0) return;
        rivals.push({
            oppTeamId: oppId,
            matchCount: matches.length,
            level: matches.length >= 10 ? 'consolidated'
                 : matches.length >= 6 ? 'classic'
                 : matches.length >= DERBY_THRESHOLD_MATCHES ? 'growing'
                 : 'starting',
        });
    });
    return rivals.sort((a, b) => b.matchCount - a.matchCount);
}

/**
 * Verifica se um teamId específico está em rivalidade ativa.
 *
 * @param {object} engine
 * @param {number} oppTeamId
 * @returns {{ isDerby: boolean, level: string, matchCount: number }}
 */
export function isOpponentRival(engine, oppTeamId) {
    const rivals = getActiveRivals(engine);
    const found = rivals.find(r => r.oppTeamId === oppTeamId);
    if (!found) return { isDerby: false, level: 'none', matchCount: 0 };
    return { isDerby: found.matchCount >= DERBY_THRESHOLD_MATCHES, level: found.level, matchCount: found.matchCount };
}

/**
 * Tenta achar o próximo derby do calendário (próximas N semanas).
 *
 * @param {object} engine
 * @param {number} lookAheadWeeks
 * @returns {{ week: number, oppTeamId: number, level: string, matchCount: number }|null}
 */
export function findNextDerby(engine, lookAheadWeeks = 6) {
    if (!engine || !Array.isArray(engine.tournaments)) return null;
    const myId = engine.manager?.teamId;
    if (!myId) return null;
    const startWeek = engine.currentWeek || 1;

    for (let w = startWeek; w < startWeek + lookAheadWeeks; w++) {
        for (const t of engine.tournaments) {
            const fixtures = t.fixtures?.[w] || t.fixtures?.[String(w)];
            if (!Array.isArray(fixtures)) continue;
            for (const m of fixtures) {
                const oppId = m.home === myId ? m.away : (m.away === myId ? m.home : null);
                if (oppId === null) continue;
                const check = isOpponentRival(engine, oppId);
                if (check.isDerby) {
                    return {
                        week: w,
                        oppTeamId: oppId,
                        level: check.level,
                        matchCount: check.matchCount,
                    };
                }
            }
        }
    }
    return null;
}

export { DERBY_THRESHOLD_MATCHES };
