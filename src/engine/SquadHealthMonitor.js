/* eslint-disable no-unused-vars */
/**
 * SquadHealthMonitor — SPEC-132: Squad Emergency Market
 *
 * Detecta squad com jogadores insuficientes e aciona resposta.
 * Resolve SQUAD_SHORT (7 players season 44 sem nenhuma reação).
 *
 * Stateless: recebe dados, retorna ação a tomar.
 */

const MIN_SQUAD = 11;
const CRISIS_SQUAD = 8;
const TRIGGER_COOLDOWN_KEY = '_squadMonitorLastWeek';

/**
 * Verifica saúde do squad e retorna ação necessária.
 *
 * @param {object} opts
 * @param {number} opts.teamId
 * @param {number} opts.squadSize — jogadores disponíveis (não lesionados)
 * @param {number} opts.budget
 * @param {boolean} opts.isPlayerManager
 * @param {number} opts.week
 * @param {number} [opts.squadAvgOvr=65]
 * @param {Array} [opts.marketPlayers=[]] — jogadores disponíveis no mercado
 * @param {object} [opts._cooldowns={}] — mapa teamId→última semana de trigger
 * @returns {object} resultado da verificação
 */
export function checkSquadHealth({ teamId, squadSize, budget, isPlayerManager, week, squadAvgOvr = 65, marketPlayers = [], _cooldowns = {} }) {
    // Cooldown: não disparar mais de 1x por semana por time
    if (_cooldowns[teamId] === week) {
        return { triggered: false, action: 'none' };
    }

    if (squadSize >= MIN_SQUAD) {
        return { triggered: false, action: 'none' };
    }

    // Para player-manager: sempre alerta (nunca compra automático)
    if (isPlayerManager) {
        const shortage = MIN_SQUAD - squadSize;
        return {
            triggered: true,
            action: 'alert_player',
            alertMessage: squadSize <= CRISIS_SQUAD
                ? `⚠️ CRISE! Apenas ${squadSize} jogadores disponíveis. Você precisa de ${shortage} reforços urgentes!`
                : `📋 Elenco curto: ${squadSize} jogadores. Considere contratar ${shortage} reforços.`,
            forceMarketOpen: squadSize <= CRISIS_SQUAD,
        };
    }

    // Para NPCs: compra automática se há budget
    if (budget <= 0) {
        return { triggered: true, action: 'auto_buy', playersBought: [], budgetSpent: 0 };
    }

    const needed = MIN_SQUAD - squadSize;
    const bought = buyEmergencyPlayers(needed, squadAvgOvr, budget, marketPlayers);

    return {
        triggered: true,
        action: 'auto_buy',
        playersBought: bought.players,
        budgetSpent: bought.totalCost,
    };
}

// ─── helpers ────────────────────────────────────────────────

function buyEmergencyPlayers(needed, squadAvgOvr, budget, marketPlayers) {
    const maxOvr = squadAvgOvr + 5; // não up-grade em emergência
    const affordable = marketPlayers
        .filter(p => p.ovr <= maxOvr && (p.value || 0) <= budget * 0.5)
        .sort((a, b) => b.ovr - a.ovr);

    const players = [];
    let totalCost = 0;

    for (let i = 0; i < needed && i < affordable.length; i++) {
        const p = affordable[i];
        const cost = p.value || 100000;
        if (totalCost + cost > budget * 0.5) continue;
        players.push({ playerId: p.id, name: p.name, ovr: p.ovr, cost });
        totalCost += cost;
    }

    return { players, totalCost };
}
