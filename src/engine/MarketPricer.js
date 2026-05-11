import { rng as systemRng } from './rng.js';
/**
 * MarketPricer — SPEC-133: Market Liquidity Fix
 *
 * Precificação real de jogadores e geração de ofertas com spread adequado.
 * Resolve Market Liquidity score=50 (966 ofertas, 0% de aceitação — avgSpread=-1).
 *
 * Stateless: funções puras.
 */

/**
 * Calcula valor de mercado de um jogador usando Hedonic Pricing.
 *
 * @param {object} opts
 * @param {number} opts.playerOvr — 0-100
 * @param {number} opts.playerAge
 * @param {number} [opts.playerPotential] — 0-100 (fallback ovr+10)
 * @param {number} [opts.playerContract=26] — semanas de contrato restantes
 * @param {number} [opts.playerForm=0] — performance recente (-5 a 5)
 * @returns {number} valor em unidades do jogo
 */
export function calcMarketValue({ playerOvr, playerAge, playerPotential, playerContract = 26, playerForm = 0 }) {
    // 1. Base Value (Current Ability)
    const base = baseValue(playerOvr);
    
    // 2. Age Premium/Penalty
    const ageMult = ageMultiplier(playerAge);
    
    // 3. Potential Premium (Hedonic)
    const potential = playerPotential || (playerOvr + 10);
    const gap = Math.max(0, potential - playerOvr);
    let potPremium = 1.0;
    if (playerAge <= 24) {
        potPremium += (gap * 0.04); // +4% value per potential point above OVR if young
    } else if (playerAge <= 28) {
        potPremium += (gap * 0.015); // +1.5% value per potential point
    }
    
    // 4. Performance Premium (Form/Trend)
    const formPremium = 1.0 + (playerForm * 0.05);

    // 5. Contract Multiplier (Liquidity)
    const contractMult = contractMultiplier(playerContract);
    
    return Math.max(50000, Math.floor(base * ageMult * potPremium * formPremium * contractMult));
}

/**
 * Gera oferta de transferência com spread real.
 *
 * @param {object} opts
 * @param {number} opts.playerOvr
 * @param {number} opts.playerAge
 * @param {number} [opts.playerPotential]
 * @param {number} [opts.playerContract=26]
 * @param {number} [opts.playerForm=0]
 * @param {'high'|'medium'|'low'} [opts.need='medium'] — urgência do comprador
 * @param {'forced'|'open'|'reluctant'} [opts.sellingWillingness='open'] — disposição do vendedor
 * @param {number} [opts.seed] — seed para determinismo em testes
 * @returns {{ offerPrice: number, marketValue: number, spread: number, accepted: boolean, counterOffer: number|null }}
 */
export function makeOffer({ playerOvr, playerAge, playerPotential, playerContract = 26, playerForm = 0, need = 'medium', sellingWillingness = 'open', seed = null }) {
    const rand = seed !== null ? seededRandom(seed) : systemRng;
    const marketValue = calcMarketValue({ playerOvr, playerAge, playerPotential, playerContract, playerForm });

    const [minSpread, maxSpread] = spreadRange(need);
    const spread = minSpread + rand() * (maxSpread - minSpread);
    const offerPrice = Math.floor(marketValue * spread);

    const accepted = isAccepted(spread, sellingWillingness);

    let counterOffer = null;
    if (!accepted) {
        const counterSpread = 0.9 + rand() * 0.2; // 0.9-1.1
        counterOffer = Math.floor(marketValue * counterSpread);
        if (counterOffer <= offerPrice) counterOffer = Math.ceil(offerPrice * 1.05);
    }

    return {
        offerPrice,
        marketValue,
        spread: Math.round(spread * 1000) / 1000,
        accepted,
        counterOffer,
    };
}

/**
 * Substitui generateTransferOffers do ManagerSystems com precificação real.
 * SPEC-200: Agora aceita allTeams para encontrar compradores contextuais
 * em vez de usar nomes hardcoded de clubes europeus.
 */
export function generateRealTransferOffers(team, currentWeek, allTeams = []) {
    if (currentWeek > 4 && currentWeek < 20) return [];
    if (currentWeek > 24) return [];

    // Lazy import to avoid circular dependency
    let findContextualBuyers;
    try {
        findContextualBuyers = require('./AmbitionEngine').findContextualBuyers;
    } catch { findContextualBuyers = null; }

    const offers = [];
    team.squad.forEach(player => {
        // Jogadores com transfer request têm chance muito maior de receber oferta
        const baseChance = player._transferRequested ? 0.40 : 0.12;
        if (player.ovr >= 65 && systemRng() < baseChance) {
            const need = player._transferRequested ? 'high' : (player.ovr >= 80 ? 'high' : 'medium');
            const willingness = player._transferRequested ? 'forced' : 'open';
            const result = makeOffer({
                playerOvr: player.ovr,
                playerAge: player.age || 25,
                playerPotential: player.potential,
                playerContract: player.contract?.weeksLeft ?? 26,
                playerForm: player.form?.trend || 0,
                need,
                sellingWillingness: willingness,
            });

            // SPEC-200: usar compradores contextuais se disponível
            let buyerClub = getContextualBuyerName(player, allTeams, team, findContextualBuyers);

            // Se tem relegation clause, usar o valor da cláusula como teto
            if (player._relegationClause && player._relegationClauseValue) {
                result.offerPrice = Math.min(result.offerPrice, player._relegationClauseValue);
            }

            offers.push({
                playerId: player.id,
                playerName: player.name,
                playerOvr: player.ovr,
                offerAmount: result.offerPrice,
                marketValue: result.marketValue,
                spread: result.spread,
                buyerClub,
                deadline: currentWeek + 2,
                isTransferRequest: !!player._transferRequested,
                isRelegationClause: !!player._relegationClause,
            });
        }
    });
    return offers;
}

// ─── helpers ────────────────────────────────────────────────

function baseValue(ovr) {
    // AUDIT-FIX #D: Curva EXPONENCIAL — OVR 80 = 10x OVR 60, OVR 90 = 50x OVR 60
    // Resolve mercado flat onde todos custam parecido.
    // Formula: base * 1.12^(ovr-50) — doubling every ~6 OVR points
    if (ovr < 50) return 200_000;
    const exponential = Math.floor(350_000 * Math.pow(1.12, ovr - 50));
    // Cap at R$200M to prevent absurd values
    return Math.min(200_000_000, exponential);
    // OVR50→R$500k | OVR60→R$1.55M | OVR70→R$4.8M | OVR80→R$15.3M | OVR85→R$27M | OVR90→R$48.5M | OVR95→R$85M
}

function ageMultiplier(age) {
    if (age < 23) return 1.4;
    if (age <= 28) return 1.0;
    if (age <= 32) return 0.7;
    return 0.4;
}

function contractMultiplier(weeks) {
    if (weeks >= 26) return 1.0;
    if (weeks >= 13) return 0.8;
    return 0.5;
}

function spreadRange(need) {
    switch (need) {
        case 'high':   return [0.90, 1.10];
        case 'medium': return [0.70, 0.90];
        case 'low':    return [0.50, 0.70];
        default:       return [0.70, 0.90];
    }
}

function isAccepted(spread, willingness) {
    switch (willingness) {
        case 'forced':    return spread >= 0.60;
        case 'open':      return spread >= 0.85;
        case 'reluctant': return spread >= 1.05;
        default:          return spread >= 0.85;
    }
}

function seededRandom(seed) {
    let s = seed;
    return function () {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

/**
 * SPEC-200: Tenta encontrar comprador contextual do mundo do jogo.
 * Fallback para nomes genéricos se allTeams não disponível.
 */
function getContextualBuyerName(player, allTeams, sellerTeam, findContextualBuyers) {
    if (findContextualBuyers && allTeams && allTeams.length > 0) {
        try {
            const buyers = findContextualBuyers(player, allTeams, sellerTeam);
            if (buyers.length > 0) {
                return buyers[0].teamName;
            }
        } catch { /* fallback */ }
    }
    // Fallback: gera nome genérico baseado na divisão
    const FALLBACK_BUYERS = [
        'Clube Internacional', 'Equipe Europeia', 'Time Asiático',
        'Clube da MLS', 'Time Mexicano', 'Equipe Árabe',
    ];
    return FALLBACK_BUYERS[Math.floor(systemRng() * FALLBACK_BUYERS.length)];
}
