/**
 * InterruptEvents — SPEC-068
 *
 * Forced events que interrompem fluxo (não dismissable).
 * Disparam baseado em conditions engine state.
 * Categories: medical / legal / familial / boardroom / media / opportunity
 */

export const INTERRUPT_EVENT_TYPES = {
    MEDICAL: 'medical',
    LEGAL: 'legal',
    FAMILIAL: 'familial',
    BOARDROOM: 'boardroom',
    MEDIA: 'media',
    OPPORTUNITY: 'opportunity'
};

export const INTERRUPT_EVENTS = [
    // === MEDICAL ===
    {
        id: 'star_serious_injury',
        type: 'medical',
        weight: 0.15,
        trigger: ({ team }) => team.squad.some(p => (p.attrs?.atk ?? 70) >= 80 && !p.injury),
        title: 'Lesão Grave do Craque',
        text: 'Seu artilheiro {playerName} sofreu lesão de {weeks} semanas em treino.',
        options: [
            { label: 'Departamento médico', effect: { boss: 0, fans: -3, reputation: 0 } },
            { label: 'Investir tratamento intensivo (R$ 200k)', effect: { boss: 5, fans: 5, money: -200000 } },
            { label: 'Forçar volta antecipada (risco)', effect: { boss: -3, injury_risk: 0.5 } }
        ]
    },
    {
        id: 'epidemic_flu',
        type: 'medical',
        weight: 0.1,
        trigger: () => true,
        title: 'Surto de Gripe',
        text: 'Vestiário com gripe forte. Vários jogadores afetados próximas 2 semanas.',
        options: [
            { label: 'Cancelar treinos pesados', effect: { fans: -2, fitness: +5 } },
            { label: 'Manter rotina normal', effect: { fitness: -10, energy_loss: 20 } }
        ]
    },

    // === LEGAL ===
    {
        id: 'player_arrested',
        type: 'legal',
        weight: 0.05,
        trigger: ({ team }) => team.squad.some(p => p.age > 22),
        title: 'Jogador Detido',
        text: '{playerName} foi detido em escândalo. Mídia em cima.',
        options: [
            { label: 'Demitir imediatamente', effect: { boss: 5, fans: -10, money: -500000 } },
            { label: 'Defender publicamente', effect: { boss: -5, fans: 3, sponsors: -10 } },
            { label: 'Suspender 4 semanas', effect: { boss: 2, fans: 0, sponsors: 0 } }
        ]
    },

    // === FAMILIAL ===
    {
        id: 'player_paternity',
        type: 'familial',
        weight: 0.08,
        trigger: ({ team }) => team.squad.some(p => p.age >= 23 && p.age <= 32),
        title: 'Paternidade',
        text: '{playerName} virou pai. Quer 2 semanas de licença.',
        options: [
            { label: 'Conceder com bônus', effect: { boss: 3, money: -50000, fans: 2 } },
            { label: 'Conceder sem bônus', effect: { boss: 0, fans: 0 } },
            { label: 'Negar (precisa do jogador)', effect: { boss: -8, fans: -3 } }
        ]
    },

    // === BOARDROOM ===
    {
        id: 'board_demand_top4',
        type: 'boardroom',
        weight: 0.12,
        trigger: ({ engine, team }) => {
            const standings = engine.getStandings(team.zone, team.division);
            const pos = standings.findIndex(s => s.teamId === team.id) + 1;
            return pos <= 6 && pos >= 4;
        },
        title: 'Pressão da Diretoria',
        text: 'Diretoria exige Top 4 ao final da temporada. Ou demissão.',
        options: [
            { label: 'Aceitar desafio', effect: { boardConfidence: 5, board_demand: 'top4' } },
            { label: 'Negociar Top 6', effect: { boardConfidence: 0, board_demand: 'top6' } },
            { label: 'Recusar pressão (risco)', effect: { boardConfidence: -10 } }
        ]
    },
    {
        id: 'sponsor_threats_pull',
        type: 'boardroom',
        weight: 0.08,
        trigger: ({ engine }) => engine.currentSponsor && engine.managerStats?.streak < -3,
        title: 'Patrocínio em Risco',
        text: '{sponsorName} ameaça encerrar contrato se não vencermos próximo jogo.',
        options: [
            { label: 'Reunião apaziguadora', effect: { sponsors: 5, money: 0 } },
            { label: 'Contra-atacar com mídia', effect: { sponsors: -10, fans: 5 } }
        ]
    },

    // === MEDIA ===
    {
        id: 'media_scandal_personal',
        type: 'media',
        weight: 0.06,
        trigger: () => true,
        title: 'Escândalo Pessoal Vaza',
        text: 'Foto íntima sua vazou na imprensa. Coletiva amanhã.',
        options: [
            { label: 'Pedir desculpas', effect: { fans: 3, sponsors: -5, dignity: -3 } },
            { label: 'Negar tudo', effect: { fans: -3, sponsors: -3, journalist: -10 } },
            { label: 'Ignorar', effect: { fans: -5, sponsors: -8 } }
        ]
    },

    // === OPPORTUNITY ===
    {
        id: 'mega_offer_top_club',
        type: 'opportunity',
        weight: 0.04,
        trigger: ({ engine, team }) => team.division <= 2 && engine.legacy?.prestige >= 200,
        title: 'Proposta de Clube Grande',
        text: 'Clube europeu oferece contrato 3x maior. Quer assumir.',
        options: [
            { label: 'Aceitar (sai do clube)', effect: { quit_to_new_club: true } },
            { label: 'Recusar lealdade', effect: { fans: 15, boardConfidence: 10 } },
            { label: 'Usar pra renegociar', effect: { wage_x: 1.5, fans: -5 } }
        ]
    }
];

export function pickInterruptEvent(engine, team) {
    const eligible = INTERRUPT_EVENTS.filter(ev => {
        try {
            return ev.trigger({ engine, team });
        } catch {
            return false;
        }
    });

    if (eligible.length === 0) return null;

    const totalWeight = eligible.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * totalWeight;

    // Apply interrupt rate (3-5/season target = ~10% chance/week)
    if (Math.random() > 0.10) return null;

    for (const ev of eligible) {
        roll -= ev.weight;
        if (roll <= 0) return ev;
    }
    return eligible[0];
}
