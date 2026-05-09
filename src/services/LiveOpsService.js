/**
 * LiveOpsService — SPEC-098
 *
 * Eventos efêmeros baseados em calendário (cultural BR + futebol).
 */

export const LIVE_OPS_EVENTS = [
    {
        id: 'carnaval',
        weekStart: 6,
        weekEnd: 8,
        title: 'Carnaval',
        emoji: '🎉',
        desc: 'Período de Carnaval. Times relaxam, treinos menos eficientes mas moral +.',
        modifiers: { trainingMult: 0.7, moralBonus: 5 }
    },
    {
        id: 'junino',
        weekStart: 23,
        weekEnd: 25,
        title: 'Festa Junina',
        emoji: '🌽',
        desc: 'Tradições nordestinas. +5 fans torcida nordeste.',
        modifiers: { fansBonus: 5 }
    },
    {
        id: 'libertadores_qualifying',
        weekStart: 4,
        weekEnd: 12,
        title: 'Eliminatórias Libertadores',
        emoji: '🌎',
        desc: 'Fase classificatória continental. Bonus prestige por vitórias.',
        modifiers: { prestigePerWin: 2 }
    },
    {
        id: 'natal',
        weekStart: 51,
        weekEnd: 52,
        title: 'Natal + Ano Novo',
        emoji: '🎄',
        desc: 'Feriados. Time descansa, fitness recupera +.',
        modifiers: { fitnessRecovery: 15 }
    },
    {
        id: 'champions_playoffs',
        weekStart: 30,
        weekEnd: 34,
        title: 'Playoffs Champions',
        emoji: '🏆',
        desc: 'Fase eliminatória decisiva. Bonus money +50% em vitórias.',
        modifiers: { winMoneyMult: 1.5 }
    },
    {
        id: 'transfer_window',
        weekStart: 26,
        weekEnd: 30,
        title: 'Janela Transferências (mid-season)',
        emoji: '🔁',
        desc: 'Janela aberta. Mais ofertas, mais movimento.',
        modifiers: { transferOfferRateMult: 2.0 }
    },
    {
        id: 'finais',
        weekStart: 36,
        weekEnd: 38,
        title: 'Reta Final do Brasileirão',
        emoji: '🔥',
        desc: 'Decisões. Pressão alta, board mais exigente.',
        modifiers: { boardPressureMult: 1.5, prestigePerWin: 3 }
    }
];

export function getActiveLiveOps(currentWeek) {
    if (!currentWeek) return [];
    const seasonWeek = ((currentWeek - 1) % 38) + 1;
    return LIVE_OPS_EVENTS.filter(ev =>
        seasonWeek >= ev.weekStart && seasonWeek <= ev.weekEnd
    );
}
