/**
 * AhaMomentsSystem — SPEC-F5.2
 *
 * Cards estratégicos surgindo contextualmente baseado em milestones
 * da carreira do player.
 *
 * Pure module. Determinístico via contexto.
 */

const AHA_TEMPLATES = [
    {
        id: 'aha_home_advantage',
        trigger: ctx => (ctx.matchesPlayed || 0) === 5,
        title: 'VANTAGEM DE CASA',
        body: 'Você notou que vencer em casa é mais fácil? Considere táticas diferentes pra jogos fora.',
        once: true,
    },
    {
        id: 'aha_first_injury',
        trigger: ctx => (ctx.firstInjuryDetected || false),
        title: 'BANCO EXISTE POR ISSO',
        body: 'Reservas não são decoração. Veja PLANTEL pra ajustar antes do próximo jogo.',
        once: true,
    },
    {
        id: 'aha_offer_expired',
        trigger: ctx => (ctx.offerExpiredCount || 0) >= 1,
        title: 'OFERTAS TÊM PRAZO',
        body: 'Cada oferta de transferência tem deadline. Não procrastine, decida.',
        once: true,
    },
    {
        id: 'aha_morale_drop',
        trigger: ctx => (ctx.lowMoraleStreak || 0) >= 3,
        title: 'MORAL EM QUEDA',
        body: 'Time perdeu 3+ jogos seguidos. Faça PRELEÇÃO motivadora antes do próximo.',
        once: true,
    },
    {
        id: 'aha_market_inactive',
        trigger: ctx => (ctx.weeksSinceLastTransfer || 0) >= 8,
        title: 'PLANTEL ESTAGNADO',
        body: '8 semanas sem contratação. MERCADO tem ofertas — vale dar uma olhada.',
        once: true,
    },
    {
        id: 'aha_tactic_unchanged',
        trigger: ctx => (ctx.matchesWithSameTactic || 0) >= 10,
        title: 'TÁTICA PREVISÍVEL',
        body: '10 jogos com mesma tática. Adversários estão te lendo. Varia.',
        once: true,
    },
    {
        id: 'aha_youth_neglect',
        trigger: ctx => (ctx.weeksWithoutYouthCheck || 0) >= 15,
        title: 'BASE ABANDONADA',
        body: '15 semanas sem checar BASE. Promessas estão crescendo sem você ver.',
        once: true,
    },
    {
        id: 'aha_finance_warning',
        trigger: ctx => (ctx.balance || 100000) < 20000,
        title: 'COFRE BAIXO',
        body: 'Saldo abaixo de 20k. Considere vender reservas ou cortar staff.',
        once: true,
    },
];

const STORAGE_KEY = 'elifoot_aha_seen';

/**
 * Carrega set de IDs já vistos do localStorage.
 *
 * @returns {Set<string>}
 */
export function loadSeenIds() {
    if (typeof localStorage === 'undefined') return new Set();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return new Set();
        return new Set(arr);
    } catch {
        return new Set();
    }
}

function persistSeenIds(set) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
    } catch { /* noop */ }
}

/**
 * Avalia contexto e retorna lista de aha moments triggered + não vistos.
 *
 * @param {object} context
 * @returns {Array<{ id, title, body }>}
 */
export function evaluateAhaMoments(context = {}) {
    const seen = loadSeenIds();
    const triggered = [];
    for (const template of AHA_TEMPLATES) {
        if (template.once && seen.has(template.id)) continue;
        try {
            if (template.trigger(context)) {
                triggered.push({
                    id: template.id,
                    title: template.title,
                    body: template.body,
                });
            }
        } catch { /* defensive — trigger function may throw */ }
    }
    return triggered;
}

/**
 * Marca um aha id como visto (não aparece de novo).
 *
 * @param {string} ahaId
 */
export function markAhaSeen(ahaId) {
    const seen = loadSeenIds();
    seen.add(ahaId);
    persistSeenIds(seen);
}

/**
 * Reset (dev/test).
 */
export function resetAhaSeen() {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

export { AHA_TEMPLATES, STORAGE_KEY };
