/**
 * MarketPricer — SPEC-133: Market Liquidity Fix
 *
 * Precificação real de jogadores e geração de ofertas com spread adequado.
 * Resolve Market Liquidity score=50 (966 ofertas, 0% de aceitação — avgSpread=-1).
 *
 * Stateless: funções puras.
 */

/**
 * Calcula valor de mercado de um jogador.
 *
 * @param {object} opts
 * @param {number} opts.playerOvr — 0-100
 * @param {number} opts.playerAge
 * @param {number} [opts.playerContract=26] — semanas de contrato restantes
 * @returns {number} valor em unidades do jogo
 */
export function calcMarketValue({ playerOvr, playerAge, playerContract = 26 }) {
    const base = baseValue(playerOvr);
    const ageMult = ageMultiplier(playerAge);
    const contractMult = contractMultiplier(playerContract);
    return Math.floor(base * ageMult * contractMult);
}

/**
 * Gera oferta de transferência com spread real.
 *
 * @param {object} opts
 * @param {number} opts.playerOvr
 * @param {number} opts.playerAge
 * @param {number} [opts.playerContract=26]
 * @param {'high'|'medium'|'low'} [opts.need='medium'] — urgência do comprador
 * @param {'forced'|'open'|'reluctant'} [opts.sellingWillingness='open'] — disposição do vendedor
 * @param {number} [opts.seed] — seed para determinismo em testes
 * @returns {{ offerPrice: number, marketValue: number, spread: number, accepted: boolean, counterOffer: number|null }}
 */
export function makeOffer({ playerOvr, playerAge, playerContract = 26, need = 'medium', sellingWillingness = 'open', seed = null }) {
    const rand = seed !== null ? seededRandom(seed) : Math.random;
    const marketValue = calcMarketValue({ playerOvr, playerAge, playerContract });

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
 * Retorna ofertas para jogadores do time usando MarketPricer.
 */
export function generateRealTransferOffers(team, currentWeek) {
    if (currentWeek > 4 && currentWeek < 20) return [];
    if (currentWeek > 24) return [];

    const offers = [];
    team.squad.forEach(player => {
        if (player.ovr >= 65 && Math.random() < 0.12) {
            const need = player.ovr >= 80 ? 'high' : 'medium';
            const result = makeOffer({
                playerOvr: player.ovr,
                playerAge: player.age || 25,
                playerContract: player.contract?.weeksLeft ?? 26,
                need,
                sellingWillingness: 'open',
            });
            offers.push({
                playerId: player.id,
                playerName: player.name,
                playerOvr: player.ovr,
                offerAmount: result.offerPrice,
                marketValue: result.marketValue,
                spread: result.spread,
                buyerClub: getRandomBuyer(),
                deadline: currentWeek + 2,
            });
        }
    });
    return offers;
}

// ─── helpers ────────────────────────────────────────────────

function baseValue(ovr) {
    if (ovr < 60) return 50000 + ovr * 500;
    if (ovr < 80) return 100000 + (ovr - 60) * 5000;
    return 200000 + (ovr - 80) * 15000;
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

const BUYERS = [
    'Manchester City', 'PSG', 'Real Madrid', 'Bayern Munich', 'Barcelona',
    'Inter Milan', 'Liverpool', 'Chelsea', 'Juventus', 'Atletico Madrid',
    'Borussia Dortmund', 'AC Milan', 'Arsenal', 'Napoli', 'Tottenham',
];
function getRandomBuyer() {
    return BUYERS[Math.floor(Math.random() * BUYERS.length)];
}
