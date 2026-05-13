/**
 * ViewUnlockSystem — SPEC-135: Critical Path Unlock
 *
 * Sistema de desbloqueio progressivo de views.
 * Resolve Critical Path score=25 (12/16 views nunca acessadas).
 *
 * Stateless: recebe saveState, retorna se view está desbloqueada + condição.
 * Desbloqueios persistem via saveState.unlockedViews (Set serializado como array).
 */

// Views sempre abertas (núcleo do jogo)
const CORE_VIEWS = new Set(['dashboard', 'squad', 'market', 'standings', 'press']);

// Mapa de condições de desbloqueio
const UNLOCK_CONDITIONS = {
    rivals: {
        check: (s) => s.seasonsCompleted >= 1,
        progress: (s) => Math.min(100, (s.seasonsCompleted / 1) * 100),
        description: 'Complete 1 temporada',
        narrativeHint: 'Primeiro rival emerge após temporada completa',
    },
    academy: {
        check: (s) => s.seasonsCompleted >= 2,
        progress: (s) => Math.min(100, (s.seasonsCompleted / 2) * 100),
        description: 'Complete 2 temporadas',
        narrativeHint: 'Seu trabalho chamou atenção da base',
    },
    analytics: {
        check: (s) => s.titlesWon >= 1,
        progress: (s) => Math.min(100, s.titlesWon >= 1 ? 100 : 0),
        description: 'Conquiste 1 título',
        narrativeHint: 'Vitória abre portas para análise profissional',
    },
    trophy_room: {
        check: (s) => s.titlesWon >= 1,
        progress: (s) => Math.min(100, s.titlesWon >= 1 ? 100 : 0),
        description: 'Conquiste 1 título',
        narrativeHint: 'Primeiro título merece sala de troféus',
    },
    scouting: {
        check: (s) => s.totalTransfers >= 10,
        progress: (s) => Math.min(100, Math.round((s.totalTransfers / 10) * 100)),
        description: 'Realize 10 transferências',
        narrativeHint: 'Experiência no mercado libera rede de scouts',
    },
    media_center: {
        check: (s) => s.seasonsCompleted >= 3,
        progress: (s) => Math.min(100, Math.round((s.seasonsCompleted / 3) * 100)),
        description: 'Complete 3 temporadas',
        narrativeHint: 'Imprensa começa a te seguir de perto',
    },
    board_room: {
        check: (s) => (s.managerReputation || 0) >= 40,
        progress: (s) => Math.min(100, Math.round(((s.managerReputation || 0) / 40) * 100)),
        description: 'Alcance reputação 40',
        narrativeHint: 'Reputação suficiente para reuniões com diretoria',
    },
    youth_watch: {
        // Depende de academy estar desbloqueada
        check: (s) => s.seasonsCompleted >= 2,
        progress: (s) => Math.min(100, (s.seasonsCompleted / 2) * 100),
        description: 'Desbloqueie a academia primeiro',
        narrativeHint: 'Base ativa permite monitorar promessas',
    },
};

/**
 * Verifica se uma view está acessível para o estado do save.
 *
 * @param {string} viewId
 * @param {object} saveState — { seasonsCompleted, titlesWon, totalTransfers, managerReputation, unlockedViews? }
 * @returns {{ unlocked: boolean, reason?: string, unlockCondition?: object }}
 */
export function canAccess(viewId, saveState) {
    // Core views: sempre abertas
    if (CORE_VIEWS.has(viewId)) {
        return { unlocked: true, reason: 'core_view' };
    }

    // Checar persistência (desbloqueio permanente)
    const persisted = saveState.unlockedViews || [];
    if (persisted.includes(viewId)) {
        return { unlocked: true, reason: 'previously_unlocked' };
    }

    const condition = UNLOCK_CONDITIONS[viewId];
    if (!condition) {
        // View desconhecida: bloqueia por segurança
        return {
            unlocked: false,
            unlockCondition: { description: 'Em desenvolvimento', progress: 0, requirement: viewId },
        };
    }

    if (condition.check(saveState)) {
        return { unlocked: true, reason: condition.narrativeHint };
    }

    return {
        unlocked: false,
        unlockCondition: {
            description: condition.description,
            progress: condition.progress(saveState),
            requirement: viewId,
            hint: condition.narrativeHint,
        },
    };
}

/**
 * Persiste desbloqueio de uma view no saveState.
 * Retorna novo saveState com unlockedViews atualizado.
 */
export function persistUnlock(viewId, saveState) {
    const current = saveState.unlockedViews || [];
    if (current.includes(viewId)) return saveState;
    return { ...saveState, unlockedViews: [...current, viewId] };
}

/**
 * Avalia todas as views e retorna as recém-desbloqueadas (para notificação).
 */
export function evaluateNewUnlocks(saveState) {
    const newlyUnlocked = [];
    for (const viewId of Object.keys(UNLOCK_CONDITIONS)) {
        const persisted = (saveState.unlockedViews || []).includes(viewId);
        if (!persisted) {
            const result = canAccess(viewId, saveState);
            if (result.unlocked) {
                newlyUnlocked.push({ viewId, reason: result.reason });
            }
        }
    }
    return newlyUnlocked;
}

// ─── SPEC-A1: Rookie Sidebar (1ª Temporada) ──────────────────

const ROOKIE_CORE_VIEWS = new Set(['dashboard', 'squad', 'standings']);

const ROOKIE_UNLOCK_CONDITIONS = {
    press:        { check: (s) => (s.wins || 0) >= 1,             description: 'Vença 1 partida' },
    market:       { check: (s) => (s.weekNumber || 1) >= 3,       description: 'Jogue até semana 3' },
    achievements: { check: (s) => (s.wins || 0) >= 3,             description: 'Vença 3 partidas' },
    chronicle:    { check: (s) => (s.seasonsCompleted || 0) >= 1, description: 'Complete 1 temporada' },
    rivalries:    { check: (s) => (s.seasonsCompleted || 0) >= 1, description: 'Complete 1 temporada' },
    saves:        { check: (s) => (s.seasonsCompleted || 0) >= 1 || (s.wins || 0) >= 5, description: 'Avance no jogo' },
    autoplay:     { check: (s) => (s.seasonsCompleted || 0) >= 1, description: 'Complete 1 temporada' },
    autoplaylab:  { check: () => true, description: 'Disponível sempre (dev tool)' },
    shop:         { check: (s) => (s.titlesWon || 0) >= 1,        description: 'Conquiste 1 título' },
    lineage:      { check: (s) => (s.seasonsCompleted || 0) >= 2, description: 'Complete 2 temporadas' },
};

/**
 * Define se o save está em "fase rookie" (1ª temporada, pré-5 vitórias).
 * Rookie = sidebar reduzida para reduzir overload UX.
 *
 * @param {object} saveState — { seasonsCompleted, wins }
 * @returns {boolean}
 */
export function isRookie(saveState = {}) {
    const seasons = saveState.seasonsCompleted || 0;
    const wins = saveState.wins || 0;
    return seasons < 1 && wins < 5;
}

/**
 * Variante de canAccess que aplica filtro rookie.
 * Se não-rookie, delega para canAccess (SPEC-135 untouched).
 *
 * @param {string} viewId
 * @param {object} saveState
 * @returns {{ unlocked: boolean, reason?: string, unlockCondition?: object }}
 */
export function canAccessRookie(viewId, saveState = {}) {
    // Tutorial é escape hatch — sempre disponível
    if (viewId === 'tutorial') return { unlocked: true, reason: 'tutorial_always' };

    // Não-rookie: fall-through para sistema padrão
    if (!isRookie(saveState)) return canAccess(viewId, saveState);

    // Rookie core
    if (ROOKIE_CORE_VIEWS.has(viewId)) return { unlocked: true, reason: 'rookie_core' };

    // Rookie milestones
    const cond = ROOKIE_UNLOCK_CONDITIONS[viewId];
    if (cond) {
        if (cond.check(saveState)) return { unlocked: true, reason: 'rookie_milestone' };
        return {
            unlocked: false,
            unlockCondition: { description: cond.description, requirement: viewId },
        };
    }

    // View desconhecida em rookie: fall-through (default-deny via canAccess)
    return canAccess(viewId, saveState);
}

export { CORE_VIEWS, UNLOCK_CONDITIONS, ROOKIE_CORE_VIEWS, ROOKIE_UNLOCK_CONDITIONS };
