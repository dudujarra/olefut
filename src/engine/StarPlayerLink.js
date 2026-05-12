/**
 * StarPlayerLink — SPEC-C2 (groundwork)
 *
 * Layer opcional sobre Manager mode: player elege 1 jogador como estrela.
 * Outros sistemas podem amplificar narrativa via getStarPlayer.
 *
 * Pure helpers. Engine state apenas armazena ID nullable.
 */

/**
 * Elege um player do squad atual como estrela.
 *
 * @param {object} engine
 * @param {number|null} playerId
 * @returns {{ success: boolean, msg: string }}
 */
export function electStarPlayer(engine, playerId) {
    if (!engine) return { success: false, msg: 'Engine inválido' };

    // Clear
    if (playerId === null || playerId === undefined) {
        engine.starPlayerId = null;
        return { success: true, msg: 'Estrela removida' };
    }

    const team = engine.getTeam?.(engine.manager?.teamId);
    if (!team || !Array.isArray(team.squad)) {
        return { success: false, msg: 'Time não encontrado' };
    }

    const player = team.squad.find(p => p.id === playerId);
    if (!player) {
        return { success: false, msg: 'Jogador não está no seu plantel' };
    }

    engine.starPlayerId = playerId;
    return { success: true, msg: `${player.name} eleito estrela do clube` };
}

/**
 * Retorna o player estrela ou null.
 *
 * @param {object} engine
 * @returns {object|null}
 */
export function getStarPlayer(engine) {
    if (!engine || engine.starPlayerId === null || engine.starPlayerId === undefined) {
        return null;
    }
    const team = engine.getTeam?.(engine.manager?.teamId);
    if (!team || !Array.isArray(team.squad)) return null;
    return team.squad.find(p => p.id === engine.starPlayerId) || null;
}

/**
 * Stats agregadas do star player. Null se inexistente.
 *
 * @param {object} engine
 * @returns {object|null}
 */
export function getStarPlayerStats(engine) {
    const p = getStarPlayer(engine);
    if (!p) return null;
    return {
        id: p.id,
        name: p.name,
        position: p.position,
        ovr: p.ovr || 0,
        apps: p.seasonApps || 0,
        goals: p.seasonGoals || 0,
        rating: p.avgRating || 0,
        age: p.age || 0,
        energy: typeof p.energy === 'number' ? p.energy : 100,
        moral: typeof p.moral === 'number' ? p.moral : 50,
    };
}

/**
 * Aplica effect ao star player (moralDelta, energyDelta, xpDelta).
 *
 * @param {object} engine
 * @param {object} effect
 * @returns {{ applied: boolean, changes: object }}
 */
export function applyToStarPlayer(engine, effect) {
    const p = getStarPlayer(engine);
    if (!p || !effect || typeof effect !== 'object') {
        return { applied: false, changes: {} };
    }
    const changes = {};
    if (typeof effect.moralDelta === 'number') {
        const before = typeof p.moral === 'number' ? p.moral : 50;
        const after = Math.max(0, Math.min(100, before + effect.moralDelta));
        p.moral = after;
        changes.moral = { before, after };
    }
    if (typeof effect.energyDelta === 'number') {
        const before = typeof p.energy === 'number' ? p.energy : 100;
        const after = Math.max(0, Math.min(100, before + effect.energyDelta));
        p.energy = after;
        changes.energy = { before, after };
    }
    if (typeof effect.xpDelta === 'number') {
        const before = typeof p.xp === 'number' ? p.xp : 0;
        const after = Math.max(0, before + effect.xpDelta);
        p.xp = after;
        changes.xp = { before, after };
    }
    return { applied: true, changes };
}
