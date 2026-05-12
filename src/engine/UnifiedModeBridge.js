/**
 * UnifiedModeBridge — SPEC-C2.3
 *
 * Layer adapter para Manager mode com Star Player linkar perspectiva
 * Player sem migration breaking.
 *
 * Pure module. Headless. Backward compat com saves antigos.
 */

import { getStarPlayer } from './StarPlayerLink.js';

/**
 * Avalia se o save está em "unified mode" (Manager + Star).
 *
 * @param {object} engine
 * @returns {boolean}
 */
export function isUnifiedMode(engine) {
    if (!engine || engine.mode !== 'manager') return false;
    if (!engine.starPlayerId) return false;
    return !!getStarPlayer(engine);
}

/**
 * Constrói stub ProPlayer-like a partir de squad player.
 * Não muta player original — cria proxy read-only com defaults.
 *
 * @param {object} squadPlayer
 * @param {object} [opts]
 * @returns {object|null}
 */
export function buildProPlayerStub(squadPlayer, opts = {}) {
    if (!squadPlayer || typeof squadPlayer !== 'object') return null;
    const { saveId = '', clubName = '' } = opts;

    const ovr = squadPlayer.ovr || 50;

    // Maps OVR → skills aproximados (technique/pace/power/vision)
    const skillsFromOvr = {
        technique: ovr,
        pace: Math.max(20, ovr - 5 + Math.floor(((squadPlayer.id || 1) % 7) - 3)),
        power: Math.max(20, ovr - 3),
        vision: Math.max(20, ovr - 2),
    };

    // Squad player pode ter atributos detalhados ou só ovr
    const skills = {
        technique: typeof squadPlayer.technical === 'number' ? squadPlayer.technical : skillsFromOvr.technique,
        pace: typeof squadPlayer.attacking === 'number' ? squadPlayer.attacking : skillsFromOvr.pace,
        power: typeof squadPlayer.defending === 'number' ? squadPlayer.defending : skillsFromOvr.power,
        vision: typeof squadPlayer.creativity === 'number' ? squadPlayer.creativity : skillsFromOvr.vision,
    };

    return {
        // Identidade
        id: squadPlayer.id,
        name: squadPlayer.name || 'Estrela',
        position: squadPlayer.position || 'ATA',
        age: squadPlayer.age || 22,

        // Skills (compatíveis com ProPlayer)
        skills,

        // Stats agregadas
        attacking: skills.pace,
        technical: skills.technique,
        defending: skills.power,
        creativity: skills.vision,
        tactical: 50,

        // Energia
        energy: typeof squadPlayer.energy === 'number' ? squadPlayer.energy : 100,

        // Carreira (agregando de squad player)
        seasonGoals: squadPlayer.seasonGoals || 0,
        seasonApps: squadPlayer.seasonApps || 0,
        avgRating: squadPlayer.avgRating || 7.0,
        careerGoals: squadPlayer.careerGoals || squadPlayer.seasonGoals || 0,
        careerApps: squadPlayer.careerApps || squadPlayer.seasonApps || 0,

        // Relacionamentos default (Manager mode não tracked finely)
        relationships: {
            boss: typeof squadPlayer.bossRel === 'number' ? squadPlayer.bossRel : 50,
            fans: typeof squadPlayer.fansRel === 'number' ? squadPlayer.fansRel : 50,
            teammates: typeof squadPlayer.teammatesRel === 'number' ? squadPlayer.teammatesRel : 50,
            sponsors: typeof squadPlayer.sponsorsRel === 'number' ? squadPlayer.sponsorsRel : 50,
        },

        // Moral
        moral: typeof squadPlayer.moral === 'number' ? squadPlayer.moral : 60,
        stress: typeof squadPlayer.stress === 'number' ? squadPlayer.stress : 20,

        // XP/development
        xp: typeof squadPlayer.xp === 'number' ? squadPlayer.xp : 0,

        // Meta
        _isStub: true,
        _sourceSaveId: saveId,
        _sourceClub: clubName,
    };
}

/**
 * Retorna view consolidada Manager+Star.
 *
 * @param {object} engine
 * @returns {object}
 */
export function getUnifiedView(engine) {
    if (!engine) {
        return { isUnified: false, manager: null, star: null, effectivePerspective: 'manager' };
    }

    const isUnified = isUnifiedMode(engine);
    const star = isUnified ? buildProPlayerStub(getStarPlayer(engine), {
        clubName: engine.getTeam?.(engine.manager?.teamId)?.name || '',
    }) : null;

    return {
        isUnified,
        manager: {
            teamId: engine.manager?.teamId || 0,
            name: engine.manager?.name || '',
            money: engine.manager?.money || 0,
        },
        star,
        effectivePerspective: isUnified ? 'unified' : 'manager',
    };
}

/**
 * Aplica effect de carta player-perspective (boss/fans/teammates) ao
 * squad player real referenciado pelo stub. Bridge bidirecional.
 *
 * @param {object} engine
 * @param {object} effect — { boss, fans, teammates, sponsors, stress, moralDelta, energyDelta }
 * @returns {{ applied: boolean, changes: object }}
 */
export function applyPlayerCardEffectToStar(engine, effect) {
    if (!engine || !engine.starPlayerId || !effect) return { applied: false, changes: {} };
    const player = getStarPlayer(engine);
    if (!player) return { applied: false, changes: {} };

    const changes = {};
    const clamp = (v) => Math.max(0, Math.min(100, v));

    if (typeof effect.boss === 'number') {
        const before = typeof player.bossRel === 'number' ? player.bossRel : 50;
        player.bossRel = clamp(before + effect.boss);
        changes.boss = { before, after: player.bossRel };
    }
    if (typeof effect.fans === 'number') {
        const before = typeof player.fansRel === 'number' ? player.fansRel : 50;
        player.fansRel = clamp(before + effect.fans);
        changes.fans = { before, after: player.fansRel };
    }
    if (typeof effect.teammates === 'number') {
        const before = typeof player.teammatesRel === 'number' ? player.teammatesRel : 50;
        player.teammatesRel = clamp(before + effect.teammates);
        changes.teammates = { before, after: player.teammatesRel };
    }
    if (typeof effect.sponsors === 'number') {
        const before = typeof player.sponsorsRel === 'number' ? player.sponsorsRel : 50;
        player.sponsorsRel = clamp(before + effect.sponsors);
        changes.sponsors = { before, after: player.sponsorsRel };
    }
    if (typeof effect.stress === 'number') {
        const before = typeof player.stress === 'number' ? player.stress : 20;
        player.stress = clamp(before + effect.stress);
        changes.stress = { before, after: player.stress };
    }

    return { applied: Object.keys(changes).length > 0, changes };
}
