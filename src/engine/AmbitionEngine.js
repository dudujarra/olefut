/**
 * AmbitionEngine.js — SPEC-200: Player Ambition & Club Prestige System
 *
 * O "coração" do realismo de transferências. Implementa:
 * 1. Club Prestige — número 0-100 derivado de division + budget + stadium + squad quality
 * 2. Player Ambition — expectativa do jogador derivada de OVR + personality
 * 3. Satisfaction — delta entre prestige e ambition, com modificadores
 * 4. Transfer Request — trigger probabilístico quando satisfaction < limiar
 * 5. Relegation Cascade — reação imediata ao rebaixamento
 * 6. Contextual Buyers — ofertas de times reais do mundo do jogo
 *
 * Inspired by:
 * - Football Manager: hidden Ambition/Loyalty/Professionalism attributes
 * - Real football: relegation release clauses, wage reduction clauses
 * - Elifoot classic: speed and simplicity of market operations
 *
 * Stateless: funções puras recebem estado e retornam eventos/mutações.
 */

import { rng as systemRng } from './rng.js';

// ============================================================
// CLUB PRESTIGE
// ============================================================

const DIV_PRESTIGE = { 1: 80, 2: 55, 3: 35, 4: 15 };
const DIV_NAMES = { 1: 'Série A', 2: 'Série B', 3: 'Série C', 4: 'Série D' };

/**
 * Calcula o prestígio de um clube (0-100).
 * Combina divisão (base), orçamento, estádio e qualidade média do elenco.
 */
export function calcPrestige(team) {
    const base = DIV_PRESTIGE[team.division] || 15;

    // Budget bonus: R$10M = +5, R$50M = +15 (cap at 15)
    const balance = Math.max(0, team.balance || 0);
    const budgetBonus = Math.min(15, Math.floor(balance / 3_000_000));

    // Stadium bonus: 40k+ = +8, 20k+ = +4, else 0
    const stadium = team.stadium || 5000;
    const stadiumBonus = stadium > 40000 ? 8 : stadium > 20000 ? 4 : stadium > 10000 ? 2 : 0;

    // Squad quality bonus: avg OVR 80+ = +10, 70+ = +6, 60+ = +3
    const avgOvr = team.squad && team.squad.length > 0
        ? team.squad.reduce((s, p) => s + (p.ovr || 50), 0) / team.squad.length
        : 50;
    const squadBonus = avgOvr >= 80 ? 10 : avgOvr >= 70 ? 6 : avgOvr >= 60 ? 3 : 0;

    return Math.min(100, Math.max(0, Math.floor(base + budgetBonus + stadiumBonus + squadBonus)));
}

// ============================================================
// PLAYER AMBITION
// ============================================================

const PERSONALITY_AMBITION_MOD = {
    'Ambicioso': 1.35,       // quer jogar no maior time possível
    'Rebelde': 1.25,         // não aceita mediocridade
    'Profissional': 1.0,     // aceita o nível atual se razoável
    'Determinado': 0.90,     // luta pra melhorar o time de dentro
    'Líder Nato': 0.85,      // fica pra liderar o grupo
    'Tímido': 0.75,          // não pede pra sair facilmente
    'Casual': 0.70,          // tanto faz onde joga
    'Preguiçoso': 0.60,      // conforto > ambição
};

/**
 * Calcula a ambição de um jogador (0-100).
 * Jogadores com alto OVR e personalidade ambiciosa exigem times de alto prestígio.
 */
export function calcAmbition(player) {
    const mod = PERSONALITY_AMBITION_MOD[player.personality] || 1.0;
    // OVR 80 → exige prestige ~64 (com mod 1.0)
    // OVR 90 → exige prestige ~72
    // OVR 60 → exige prestige ~48
    const baseDemand = (player.ovr || 50) * 0.80;
    return Math.min(100, Math.max(0, Math.floor(baseDemand * mod)));
}

// ============================================================
// SATISFACTION
// ============================================================

/**
 * Calcula a satisfação de um jogador com o clube atual (0-100).
 * satisfaction > 60: feliz. 30-60: inquieto. < 30: quer sair.
 */
export function calcSatisfaction(player, team) {
    const ambition = calcAmbition(player);
    const prestige = team._prestige || calcPrestige(team);
    const delta = prestige - ambition; // positivo = feliz, negativo = infeliz

    let satisfaction = 50 + delta * 1.5; // amplifica o efeito

    // Modificadores contextuais
    if (player.isTitular) satisfaction += 8;
    if ((player.moral || 50) > 75) satisfaction += 5;
    if ((player.moral || 50) < 30) satisfaction -= 10;
    if (player.form?.trend === 'hot') satisfaction += 5;
    if (player.form?.trend === 'cold') satisfaction -= 3;

    // Jogadores jovens são mais pacientes (querem crescer)
    if ((player.age || 25) < 22) satisfaction += 10;

    // Jogadores muito velhos são mais conformados
    if ((player.age || 25) > 33) satisfaction += 8;

    // Lealdade por tempo: +2 por temporada no clube (max +10)
    const seasonsAtClub = player._seasonsAtClub || 0;
    satisfaction += Math.min(10, seasonsAtClub * 2);

    return Math.max(0, Math.min(100, Math.floor(satisfaction)));
}

// ============================================================
// WEEKLY AMBITION PROCESSING
// ============================================================

const TRANSFER_REQUEST_REASONS = [
    "Quero jogar em um nível mais alto.",
    "Sinto que mereço um desafio maior.",
    "Preciso de um projeto mais ambicioso.",
    "Quero disputar títulos importantes.",
    "O nível competitivo aqui está abaixo do meu.",
    "Recebi sondagens de times maiores.",
    "Minha carreira está estagnando aqui.",
];

/**
 * Processa a ambição de todos os jogadores de um time semanalmente.
 * Retorna array de eventos (transfer_request, morale_drop, etc.)
 */
export function processAmbitionWeekly(team) {
    const events = [];
    const prestige = calcPrestige(team);
    team._prestige = prestige;

    for (const player of (team.squad || [])) {
        if (player._retired || player.injury) continue;

        const sat = calcSatisfaction(player, team);
        player._satisfaction = sat;

        // Insatisfeito: moral decai
        if (sat < 30) {
            const moralDrop = sat < 15 ? 5 : 3;
            player.moral = Math.max(5, (player.moral || 50) - moralDrop);

            // Transfer request trigger (probabilístico por semana)
            if (!player._transferRequested && sat < 25) {
                // Chance cresce conforme satisfaction diminui: sat 0 = 25%, sat 25 = 0%
                const requestChance = (25 - sat) * 0.01;
                if (systemRng() < requestChance) {
                    player._transferRequested = true;
                    player._transferRequestReason = systemRng.pick
                        ? systemRng.pick(TRANSFER_REQUEST_REASONS)
                        : TRANSFER_REQUEST_REASONS[Math.floor(systemRng() * TRANSFER_REQUEST_REASONS.length)];

                    events.push({
                        type: 'transfer_request',
                        playerId: player.id,
                        playerName: player.name,
                        playerOvr: player.ovr,
                        satisfaction: sat,
                        reason: player._transferRequestReason,
                        msg: `⚠️ ${player.name} (OVR ${player.ovr}) pediu transferência: "${player._transferRequestReason}"`,
                    });
                }
            }

            // Dressing room influence: jogador insatisfeito contamina colegas próximos
            if (sat < 15 && player.ovr >= 75) {
                events.push({
                    type: 'dressing_room_unrest',
                    playerId: player.id,
                    playerName: player.name,
                    msg: `🔥 ${player.name} está causando instabilidade no vestiário!`,
                });
            }
        }

        // Satisfeito: moral recupera
        if (sat > 70) {
            player.moral = Math.min(100, (player.moral || 50) + 1);
        }

        // Se estava pedindo transferência mas agora está satisfeito, retira pedido
        if (player._transferRequested && sat > 60) {
            player._transferRequested = false;
            delete player._transferRequestReason;
            events.push({
                type: 'transfer_request_withdrawn',
                playerId: player.id,
                playerName: player.name,
                msg: `✅ ${player.name} retirou o pedido de transferência. Está satisfeito novamente.`,
            });
        }
    }

    return events;
}

// ============================================================
// RELEGATION CASCADE
// ============================================================

/**
 * Processa o impacto do rebaixamento no elenco.
 * Chamada imediatamente após processPromoRelegation quando team.division SOBE (rebaixou).
 *
 * "Modo Elifoot": Top 3 OVR pedem saída imediata, resto desgasta gradualmente.
 * Aplica relegation clause (pode sair por 40% do valor de mercado).
 */
export function onRelegation(team, fromDiv, toDiv) {
    const events = [];
    const divName = DIV_NAMES[toDiv] || `Divisão ${toDiv}`;

    // Recalcular prestige com nova divisão
    team._prestige = calcPrestige(team);

    // Ordenar por OVR desc — os melhores reagem mais forte
    const sortedByOvr = [...(team.squad || [])].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));

    // Top N jogadores com alta ambição pedem saída imediata
    let requestCount = 0;
    const maxImmediate = 3; // "Modo Elifoot" — até 3 saem de cara

    for (const player of sortedByOvr) {
        if (requestCount >= maxImmediate) break;
        if (player._retired) continue;

        const ambition = calcAmbition(player);

        // Se a ambição do jogador excede muito o novo prestige → saída imediata
        if (ambition > team._prestige + 15) {
            player._transferRequested = true;
            player._relegationClause = true;
            player._relegationClauseValue = Math.floor((player.value || player.marketValue || 1_000_000) * 0.40);
            player.moral = Math.max(10, (player.moral || 50) - 30);
            player._transferRequestReason = `Não aceito jogar na ${divName}.`;

            events.push({
                type: 'relegation_exit',
                playerId: player.id,
                playerName: player.name,
                playerOvr: player.ovr,
                clauseValue: player._relegationClauseValue,
                msg: `💔 ${player.name} (OVR ${player.ovr}) NÃO ACEITA jogar na ${divName}! Cláusula de rebaixamento: R$${(player._relegationClauseValue / 1_000_000).toFixed(1)}M`,
            });

            requestCount++;
        }
    }

    // Todos os outros sofrem moral drop proporcional
    for (const player of team.squad || []) {
        if (!player._transferRequested) {
            const moralDrop = 10 + Math.floor(systemRng() * 15); // -10 a -25
            player.moral = Math.max(15, (player.moral || 50) - moralDrop);
        }
    }

    // Wage reduction automático (real football: 30-50% cut)
    const wageReduction = 0.65; // reduz para 65% do salário
    for (const player of team.squad || []) {
        player.salary = Math.floor((player.salary || 5000) * wageReduction);
    }

    events.push({
        type: 'relegation_financial',
        msg: `📉 Rebaixamento para ${divName}! Salários cortados em 35%. Moral do elenco despencou.`,
    });

    return events;
}

// ============================================================
// PROMOTION BOOST
// ============================================================

/**
 * Processa o impacto da promoção no elenco.
 * Aumenta moral, prestige, e recalibra salários para cima.
 */
export function onPromotion(team, fromDiv, toDiv) {
    const events = [];
    const divName = DIV_NAMES[toDiv] || `Divisão ${toDiv}`;

    team._prestige = calcPrestige(team);

    // Moral boost geral
    for (const player of team.squad || []) {
        player.moral = Math.min(100, (player.moral || 50) + 15 + Math.floor(systemRng() * 10));

        // Jogadores que queriam sair podem reconsiderar
        if (player._transferRequested) {
            const newSat = calcSatisfaction(player, team);
            if (newSat > 50) {
                player._transferRequested = false;
                delete player._transferRequestReason;
                delete player._relegationClause;
                delete player._relegationClauseValue;
                events.push({
                    type: 'transfer_request_withdrawn',
                    playerId: player.id,
                    playerName: player.name,
                    msg: `✅ ${player.name} mudou de ideia após a promoção! Quer ficar e ajudar na ${divName}.`,
                });
            }
        }
    }

    // Budget boost (TV money increases with promotion)
    const promotionBonus = toDiv === 1 ? 15_000_000 : toDiv === 2 ? 5_000_000 : 2_000_000;
    team.balance = (team.balance || 0) + promotionBonus;

    events.push({
        type: 'promotion_boost',
        msg: `🎉 Promoção para ${divName}! Bônus de R$${(promotionBonus / 1_000_000).toFixed(0)}M. Moral do elenco nas alturas!`,
    });

    return events;
}

// ============================================================
// CONTEXTUAL TRANSFER MATCHING (Similarity-based)
// ============================================================

/**
 * Encontra compradores contextuais para um jogador insatisfeito.
 * Em vez de nomes hardcoded ("Manchester City"), busca times REAIS do mundo do jogo
 * que: (1) têm prestige compatível, (2) podem pagar, (3) precisam da posição.
 *
 * @param {object} player — jogador querendo sair
 * @param {Array} allTeams — todos os times do jogo
 * @param {object} sellerTeam — time vendedor
 * @returns {Array<{team, score, offerPrice}>} — top 3 compradores com score de match
 */
export function findContextualBuyers(player, allTeams, sellerTeam) {
    const ambition = calcAmbition(player);
    const playerValue = player._relegationClause
        ? player._relegationClauseValue
        : (player.value || player.marketValue || 1_000_000);

    const candidates = (allTeams || [])
        .filter(t => t.id !== sellerTeam?.id)
        .filter(t => (t.balance || 0) > playerValue * 0.5) // pode pagar pelo menos metade
        .map(t => {
            const prestige = t._prestige || calcPrestige(t);
            const score = matchScore(t, player, prestige, ambition);
            return { team: t, score, prestige };
        })
        .filter(c => c.score > 20) // mínimo de compatibilidade
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    return candidates.map(c => ({
        teamId: c.team.id,
        teamName: c.team.name,
        division: c.team.division,
        prestige: c.prestige,
        matchScore: c.score,
        offerPrice: calcOffer(player, c.team, playerValue),
    }));
}

function matchScore(team, player, teamPrestige, playerAmbition) {
    let score = 0;

    // Prestige fit: time precisa ser bom o bastante pro jogador (±20 de tolerância)
    const prestigeDelta = teamPrestige - playerAmbition;
    if (prestigeDelta >= -10) score += 25;
    else if (prestigeDelta >= -20) score += 10;

    // Position need: time precisa dessa posição?
    const posCount = (team.squad || []).filter(p => p.position === player.position && !p._retired).length;
    const idealCount = player.position === 'GOL' ? 2 : player.position === 'DEF' ? 5 : player.position === 'MEI' ? 5 : 3;
    if (posCount < idealCount) score += 30;
    else if (posCount === idealCount) score += 10;

    // OVR fit: jogador melhora o time?
    const teamAvgOvr = team.squad && team.squad.length > 0
        ? team.squad.reduce((s, p) => s + (p.ovr || 50), 0) / team.squad.length
        : 50;
    if ((player.ovr || 50) > teamAvgOvr + 5) score += 20;
    else if ((player.ovr || 50) > teamAvgOvr) score += 10;

    // Budget fit: pode pagar confortavelmente?
    const value = player.value || player.marketValue || 1_000_000;
    if ((team.balance || 0) > value * 2) score += 15;
    else if ((team.balance || 0) > value) score += 8;

    return score;
}

function calcOffer(player, buyerTeam, baseValue) {
    // Spread baseado no prestígio do comprador (times ricos pagam mais)
    const buyerPrestige = buyerTeam._prestige || calcPrestige(buyerTeam);
    const prestigeSpread = 0.80 + (buyerPrestige / 200); // 0.80 a 1.30
    const randomSpread = 0.90 + systemRng() * 0.20; // 0.90 a 1.10

    return Math.floor(baseValue * prestigeSpread * randomSpread);
}

// ============================================================
// EXPORTS CONSOLIDADOS
// ============================================================

export default {
    calcPrestige,
    calcAmbition,
    calcSatisfaction,
    processAmbitionWeekly,
    onRelegation,
    onPromotion,
    findContextualBuyers,
};
