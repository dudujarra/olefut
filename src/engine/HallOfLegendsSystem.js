/**
 * HallOfLegendsSystem — SPEC-078: Canonização de Mitos do Clube
 *
 * 6 slots permanentes por clube que capturam figuras históricas do save.
 * Base para Traits Herdáveis (SPEC-079).
 *
 * Stateless: recebe dados históricos, retorna hall atualizado.
 */

export const SLOTS = ['idoloEterno', 'carrasco', 'goleirao', 'criaDaBase', 'traidor', 'lendaTragica'];

const SLOT_META = {
    idoloEterno:   { label: 'Ídolo Eterno',   criteria: 'Mais jogos + maior amor da torcida' },
    carrasco:      { label: 'Carrasco',        criteria: 'Mais gols contra este clube (rival)' },
    goleirao:      { label: 'Goleador',        criteria: 'Maior número de gols' },
    criaDaBase:    { label: 'Cria da Base',    criteria: 'Formado internamente com maior impacto' },
    traidor:       { label: 'Traidor',         criteria: 'Saiu para rival direto' },
    lendaTragica:  { label: 'Lenda Trágica',  criteria: 'Lesão longa ou carreira interrompida' },
};

/**
 * Computa o Hall de Lendas para um clube.
 *
 * @param {object} opts
 * @param {number} opts.clubId
 * @param {Array<{id,name,apps,goals,morale,fromBase,soldToRival,hadLongInjury}>} opts.players
 * @param {Array<{id,name,goalsVsThisClub}>} [opts.rivalPlayers=[]]
 * @returns {{ clubId, slots: object, filledCount: number }}
 */
export function compute({ clubId, players = [], rivalPlayers = [] } = {}) {
    const slots = {};

    // idoloEterno: most apps
    const byApps = [...players].sort((a, b) => (b.apps || 0) - (a.apps || 0));
    if (byApps[0]) slots.idoloEterno = canonize(byApps[0], 'idoloEterno');

    // goleirao: most goals
    const byGoals = [...players].sort((a, b) => (b.goals || 0) - (a.goals || 0));
    if (byGoals[0] && byGoals[0].goals > 0) slots.goleirao = canonize(byGoals[0], 'goleirao');

    // carrasco: rival player with most goals vs this club
    const byCarrasco = [...rivalPlayers].sort((a, b) => (b.goalsVsThisClub || 0) - (a.goalsVsThisClub || 0));
    if (byCarrasco[0] && byCarrasco[0].goalsVsThisClub > 0) slots.carrasco = canonize(byCarrasco[0], 'carrasco');

    // criaDaBase: from base + highest goals
    const baseKids = players.filter(p => p.fromBase).sort((a, b) => (b.goals || 0) - (a.goals || 0));
    if (baseKids[0]) slots.criaDaBase = canonize(baseKids[0], 'criaDaBase');

    // traidor: sold to rival
    const traitors = players.filter(p => p.soldToRival).sort((a, b) => (b.apps || 0) - (a.apps || 0));
    if (traitors[0]) slots.traidor = canonize(traitors[0], 'traidor');

    // lendaTragica: long injury or career cut short
    const tragics = players.filter(p => p.hadLongInjury).sort((a, b) => (b.apps || 0) - (a.apps || 0));
    if (tragics[0]) slots.lendaTragica = canonize(tragics[0], 'lendaTragica');

    const filledCount = Object.keys(slots).length;
    return { clubId, slots, filledCount };
}

/**
 * Verifica se um jogador está em algum slot do hall.
 */
export function isCanonized(hall, playerId) {
    return Object.values(hall.slots || {}).some(s => s.playerId === playerId);
}

// ─── helpers ────────────────────────────────────────────────

function canonize(player, slot) {
    return {
        playerId: player.id,
        playerName: player.name,
        slot,
        slotLabel: SLOT_META[slot]?.label || slot,
        stats: {
            apps: player.apps || 0,
            goals: player.goals || 0,
            goalsVsThisClub: player.goalsVsThisClub || 0,
        },
    };
}
