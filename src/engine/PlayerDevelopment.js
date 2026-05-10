/**
 * PlayerDevelopment.js — Aging, Form, Development, Retirement
 * 
 * §3 do Game Design Document — Player Development Science:
 * - Crescimento: CA → PA asymptotic (últimos 5% são os mais difíceis)
 * - Curvas de idade DIFERENTES por posição (§3.1)
 * - Physical stats declinam rápido; mental stats podem SUBIR após 30
 * - Individual variance (σ = 1-3 anos around peak)
 * - Aposentadoria: 35-40 com chance crescente (goleiros até 38)
 * - Form: hot/cold streaks baseado em performance
 */

import { rng } from './rng';
import { calcMarketValue } from './MarketPricer.js';

const PERSONALITY_GROWTH = {
    "Profissional": 1.3,     // treina mais, cresce mais
    "Ambicioso": 1.2,        // quer jogar, cresce se titular
    "Determinado": 1.15,     // constante
    "Casual": 0.9,           // não se esforça tanto
    "Preguiçoso": 0.7,       // mínimo esforço
};

/**
 * §3.1: Position-specific age curves.
 * peak = center of peak zone, declineOnset = when physical decline begins
 * retireMin = earliest retirement age, peakVariance = σ individual spread
 */
const POSITION_AGE_CURVES = {
    ATA: { peak: 27, declineOnset: 31, retireMin: 34, peakVariance: 2 },
    MEI: { peak: 28, declineOnset: 31, retireMin: 34, peakVariance: 2 },
    DEF: { peak: 29, declineOnset: 32, retireMin: 35, peakVariance: 2 },
    GOL: { peak: 30, declineOnset: 34, retireMin: 36, peakVariance: 3 },
};

/**
 * Attribute categories — physical decline fast, mental can improve.
 * §3.1: "Physical stats decline sharply after peak; Mental stats can IMPROVE past 30"
 */
const PHYSICAL_ATTRS = ['FIS'];        // speed, stamina, acceleration
const TECHNICAL_ATTRS = ['FIN', 'REF']; // finishing, reflexes — slow decline
const MENTAL_ATTRS = ['CRI'];           // creativity, vision, positioning — can grow
const DEFENSIVE_ATTR = 'DEF';           // depends on position

/**
 * §3.2: Processa desenvolvimento semanal de um jogador.
 * CA approaches PA asymptotically — the last 5% is hardest.
 * Not every player reaches their potential.
 *
 * Retorna um array de mensagens de mudança.
 */
export function processPlayerDevelopment(player) {
    const changes = [];
    const personalityMod = PERSONALITY_GROWTH[player.personality] || 1.0;
    const curve = POSITION_AGE_CURVES[player.position] || POSITION_AGE_CURVES.MEI;

    // Individual variance: cada jogador tem ±variance anos de offset
    // Deterministic per player using id hash (não muda entre semanas)
    const playerVariance = player._peakVariance ?? 0;

    const effectivePeak = curve.peak + playerVariance;
    const effectiveDecline = curve.declineOnset + playerVariance;

    // === CRESCIMENTO NATURAL (pre-peak) ===
    if (player.age < effectivePeak) {
        // §3.2: Gap entre PA e CA determina growth rate (asymptotic)
        const potential = player.potential || (player.ovr + 15);
        const gap = Math.max(0, potential - (player.ovr || 50));

        // Growth chance scales with gap: big gap = easier, small gap = very hard
        // Asymptotic formula: chance = base × (gap / maxGap) × personalityMod
        const ageBonus = player.age < 20 ? 1.5 : player.age < 23 ? 1.2 : 1.0;
        const gapFactor = gap > 20 ? 0.30 : gap > 10 ? 0.18 : gap > 5 ? 0.10 : 0.04;
        const growthChance = gapFactor * personalityMod * ageBonus;

        if (rng.chance(growthChance)) {
            const attrs = Object.keys(player.attributes);
            const attr = rng.pick(attrs);
            const boost = player.age < 20 ? 2 : 1;
            const oldVal = player.attributes[attr];
            // Cap at potential-derived ceiling
            const ceiling = Math.min(99, Math.floor(potential * 1.05));
            player.attributes[attr] = Math.min(ceiling, oldVal + boost);
            if (player.attributes[attr] > oldVal) {
                changes.push({ type: 'growth', player: player.name, attr, from: oldVal, to: player.attributes[attr] });
            }
        }
    }

    // === DECLÍNIO (post-peak, position-specific) ===
    if (player.age >= effectiveDecline) {
        const yearsOverDecline = player.age - effectiveDecline;

        // Physical attributes: decline sharply (§3.1)
        const physDeclineChance = yearsOverDecline * 0.06; // 6% per year
        PHYSICAL_ATTRS.forEach(attr => {
            if (player.attributes[attr] !== undefined && rng.chance(physDeclineChance)) {
                const oldVal = player.attributes[attr];
                const drop = yearsOverDecline >= 3 ? 2 : 1;
                player.attributes[attr] = Math.max(20, oldVal - drop);
                if (player.attributes[attr] < oldVal) {
                    changes.push({ type: 'decline', player: player.name, attr, from: oldVal, to: player.attributes[attr] });
                }
            }
        });

        // Technical attributes: decline slowly (§3.1)
        const techDeclineChance = yearsOverDecline * 0.03; // 3% per year
        TECHNICAL_ATTRS.forEach(attr => {
            if (player.attributes[attr] !== undefined && rng.chance(techDeclineChance)) {
                const oldVal = player.attributes[attr];
                player.attributes[attr] = Math.max(25, oldVal - 1);
                if (player.attributes[attr] < oldVal) {
                    changes.push({ type: 'decline', player: player.name, attr, from: oldVal, to: player.attributes[attr] });
                }
            }
        });

        // DEF attribute: position-dependent decline
        // Centerbacks/GKs lose defensive awareness slower (cognitive compensates)
        if (player.attributes[DEFENSIVE_ATTR] !== undefined) {
            const defDeclineRate = (player.position === 'DEF' || player.position === 'GOL')
                ? yearsOverDecline * 0.02  // very slow — experience compensates
                : yearsOverDecline * 0.04; // moderate for other positions
            if (rng.chance(defDeclineRate)) {
                const oldVal = player.attributes[DEFENSIVE_ATTR];
                player.attributes[DEFENSIVE_ATTR] = Math.max(25, oldVal - 1);
                if (player.attributes[DEFENSIVE_ATTR] < oldVal) {
                    changes.push({ type: 'decline', player: player.name, attr: DEFENSIVE_ATTR, from: oldVal, to: player.attributes[DEFENSIVE_ATTR] });
                }
            }
        }

        // Mental attributes: can IMPROVE past peak! (§3.1)
        // Creativity/positioning grows from experience — 5% chance per year
        const mentalGrowthChance = 0.05 * personalityMod;
        MENTAL_ATTRS.forEach(attr => {
            if (player.attributes[attr] !== undefined && rng.chance(mentalGrowthChance)) {
                const oldVal = player.attributes[attr];
                player.attributes[attr] = Math.min(99, oldVal + 1);
                if (player.attributes[attr] > oldVal) {
                    changes.push({ type: 'growth', player: player.name, attr, from: oldVal, to: player.attributes[attr] });
                }
            }
        });
    }

    // === APOSENTADORIA (position-aware) ===
    if (player.age >= curve.retireMin) {
        const yearsOverRetireMin = player.age - curve.retireMin;
        const retireChance = (yearsOverRetireMin + 1) * 0.12;
        if (rng.chance(retireChance)) {
            player._retired = true;
            changes.push({ type: 'retirement', player: player.name, age: player.age });
        }
    }
    // BUG-079: safety cap — force-retire if age > 42 (probability of reaching this
    // naturally is ~0, so any player here escaped the stochastic retirement system).
    if (!player._retired && player.age > 42) {
        player._retired = true;
        changes.push({ type: 'retirement', player: player.name, age: player.age });
    }

    // Assign individual peak variance on first run (deterministic from id)
    if (player._peakVariance === undefined) {
        // Hash player id to get ±variance consistently
        const hash = typeof player.id === 'string'
            ? player.id.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
            : (player.id || 0);
        player._peakVariance = (Math.abs(hash) % (curve.peakVariance * 2 + 1)) - curve.peakVariance;
    }

    // Recalc OVR
    recalcOvr(player);

    return changes;
}

/**
 * Envelhece jogadores 1 ano. Chamar 1x por temporada.
 */
export function ageSquad(squad) {
    const events = [];
    squad.forEach(p => {
        p.age++;
        if (p.age >= 35) {
            events.push(`🎂 ${p.name} fez ${p.age} anos. A aposentadoria se aproxima.`);
        }
    });
    return events;
}

/**
 * Form system — tracks últimas 5 participações em jogos
 * Cada jogador tem player.form = { last5: [1,0,-1,1,0], trend: 'hot'|'cold'|'normal' }
 */
export function initForm(player) {
    if (!player.form) {
        player.form = { last5: [], trend: 'normal' };
    }
}

export function updateForm(player, result) {
    initForm(player);
    // result: 1 = bom (titular em vitória/gol), 0 = neutro, -1 = ruim (derrota)
    player.form.last5.push(result);
    if (player.form.last5.length > 5) player.form.last5.shift();

    const avg = player.form.last5.reduce((s, v) => s + v, 0) / player.form.last5.length;
    if (avg >= 0.6) player.form.trend = 'hot';
    else if (avg <= -0.4) player.form.trend = 'cold';
    else player.form.trend = 'normal';
}

export function getFormEmoji(trend) {
    if (trend === 'hot') return '🔥';
    if (trend === 'cold') return '❄️';
    return '';
}

export function getFormModifier(trend) {
    if (trend === 'hot') return 1.08;   // +8% em performance
    if (trend === 'cold') return 0.92;  // -8%
    return 1.0;
}

/**
 * Dressing Room Dynamics — relações no vestiário
 * - Cliques: jogadores com alta moral formam grupo positivo
 * - Cancers: jogadores insatisfeitos contaminam moral
 * - Leader: jogador mais velho com moral alta estabiliza o grupo
 */
export function processDressingRoom(squad) {
    const events = [];

    // Find leader
    const candidates = squad
        .filter(p => p.age >= 28 && (p.moral || 50) >= 65 && !p.injury)
        .sort((a, b) => (b.moral || 50) - (a.moral || 50));
    const leader = candidates[0] || null;

    // Count unhappy players
    const unhappy = squad.filter(p => (p.moral || 50) < 30 && !p.injury);
    const happy = squad.filter(p => (p.moral || 50) > 75);

    // Leader stabilizes
    if (leader && unhappy.length > 0 && unhappy.length <= 3) {
        unhappy.forEach(p => {
            p.moral = Math.min(100, (p.moral || 50) + 3);
        });
        events.push(`👔 ${leader.name} conversou com jogadores insatisfeitos. Moral melhorou.`);
    }

    // Cancer effect: if 4+ unhappy, they drag others down
    if (unhappy.length >= 4) {
        squad.forEach(p => {
            if ((p.moral || 50) > 40) {
                p.moral = Math.max(0, (p.moral || 50) - 2);
            }
        });
        events.push(`☠️ Vestiário em crise! ${unhappy.length} jogadores insatisfeitos contaminam o grupo.`);
    }

    // Good vibes: if 6+ happy, slight boost to everyone
    if (happy.length >= 6) {
        squad.forEach(p => {
            p.moral = Math.min(100, (p.moral || 50) + 1);
        });
        events.push(`🎉 Clima excelente no vestiário! ${happy.length} jogadores em alta moral.`);
    }

    // Captain system: highest OVR veteran gets +2 moral stability
    if (leader) {
        leader._isCaptain = true;
    }

    return { events, leader };
}

/**
 * Contract Renewal — negociação de renovação
 */
export function generateRenewalOffer(player) {
    const baseSalary = player.salary || 5000;
    const ageFactor = player.age > 30 ? 0.8 : player.age < 22 ? 1.5 : 1.2;
    const formFactor = player.form?.trend === 'hot' ? 1.3 : player.form?.trend === 'cold' ? 0.9 : 1.0;
    const personalityFactor = player.personality === 'Ambicioso' ? 1.4 : player.personality === 'Profissional' ? 1.0 : 1.1;

    const demandedSalary = Math.floor(baseSalary * ageFactor * formFactor * personalityFactor);
    const weeks = player.age > 30 ? 38 : player.age < 22 ? 114 : 76; // 1, 2, or 3 seasons

    // Happiness affects willingness
    const willRenew = (player.moral || 50) > 30;

    return {
        playerId: player.id,
        playerName: player.name,
        currentSalary: baseSalary,
        demandedSalary,
        weeks,
        willRenew,
        personality: player.personality || 'Normal',
        reason: !willRenew ? `${player.name} está insatisfeito e recusa renovar.` : null,
    };
}

export function acceptRenewal(player, offer) {
    player.contract = { weeksLeft: offer.weeks, salary: offer.demandedSalary };
    player.salary = offer.demandedSalary;
    player.moral = Math.min(100, (player.moral || 50) + 10);
    return { success: true, msg: `${player.name} renovou por ${offer.weeks} semanas (R$ ${(offer.demandedSalary / 1000).toFixed(0)}K/sem)!` };
}

/**
 * Tactic Counter System — rock-paper-scissors
 * Returns effectiveness modifier for attacker's tactic vs defender's tactic
 */
export const TACTIC_COUNTERS = {
    // [attacker][defender] = modifier
    normal:     { normal: 1.0, offensive: 1.0, defensive: 1.0, pressing: 1.0, counter: 1.0, possession: 1.0 },
    offensive:  { normal: 1.1, offensive: 1.0, defensive: 0.7, pressing: 1.15, counter: 0.8, possession: 1.1 },
    defensive:  { normal: 0.9, offensive: 1.3, defensive: 1.0, pressing: 0.9, counter: 1.1, possession: 0.85 },
    pressing:   { normal: 1.05, offensive: 0.85, defensive: 1.1, pressing: 1.0, counter: 0.7, possession: 1.2 },
    counter:    { normal: 1.0, offensive: 1.2, defensive: 0.9, pressing: 1.3, counter: 1.0, possession: 0.9 },
    possession: { normal: 1.0, offensive: 0.9, defensive: 1.15, pressing: 0.8, counter: 1.1, possession: 1.0 },
};

/**
 * Narração contextual por tática
 */
// P1-5: Variedade narração 5x — cada categoria 10-15+ templates únicos
export const TACTIC_NARRATION = {
    normal: {
        chance: [
            "{atk} arma jogada pelo meio!", "{atk} tenta triangulação!", "{atk} avança pela intermediária!",
            "{atk} cria oportunidade!", "{atk} chega com perigo!", "{atk} acelera o jogo!",
            "{atk} tabela e abre espaço!", "{atk} infiltra na área!", "{atk} encontra brecha na defesa!",
            "{atk} testa o goleiro do {def}!", "{atk} cruza com perigo!", "{atk} chega na linha de fundo!"
        ],
        goal: [
            "{atk} marca um belo gol!", "{atk} balança as redes!", "{atk} abre o placar com categoria!",
            "{atk} GOL! Bola no fundo da rede!", "{atk} converte a chance!", "{atk} faz o que tinha que fazer!",
            "{atk} bate forte e marca!", "{atk} de placa!", "{atk} explode pra rede!",
            "{atk} marca em jogada ensaiada!", "GOOOL DO {atk}!", "{atk} acerta o canto!"
        ],
        miss: [
            "{atk} arrisca mas passa por cima!", "{atk} chuta e o goleiro segura!", "{atk} desperdiça!",
            "{atk} pra fora! Quase!", "{atk} no travessão!", "{atk} chuta na rede pelo lado de fora!",
            "{atk} tenta de cabeça mas erra o alvo!", "{atk} chuta torto!", "{atk} pega mal na bola!",
            "{atk} bate na trave!", "{atk} isolado!"
        ],
        save: [
            "Defesaça do goleiro do {def}!", "O goleiro do {def} se estica e salva!", "Grande defesa!",
            "Defesa milagrosa!", "Goleiro do {def} no lugar certo!", "Salva o {def}!",
            "Que defesa!", "O goleiro do {def} agarra firme!", "Defesa em dois tempos!",
            "Goleiro do {def} espalma!", "Defesona!"
        ],
        filler: [
            "{atk} roda a bola no meio.", "Jogo equilibrado no momento.", "{def} recua e espera.",
            "Posse de bola dividida.", "Jogo cadenciado.", "{atk} controla o ritmo.",
            "Disputa de meio-campo.", "{def} marca com atenção.", "Bola no meio de campo.",
            "{atk} estuda a defesa do {def}.", "Pegada forte de ambos os lados.", "Jogo morno."
        ]
    },
    offensive: {
        chance: [
            "{atk} sobe em bloco! Pressão total!", "{atk} ataca com 4 jogadores!", "{atk} joga no abafa!",
            "{atk} avança em ataque maciço!", "{atk} massacra a defesa adversária!", "{atk} joga linha alta!",
            "{atk} ataca com tudo!", "{atk} parte pra cima!", "{atk} cerca a área do {def}!",
            "{atk} bombardeia o gol!", "{atk} ataca com volume!", "{atk} mantém pressão alta!"
        ],
        goal: [
            "{atk} marca de goleada! O jogo é ataque!", "{atk} GOOOL! O jogo ofensivo funciona!", "{atk} explode na frente!",
            "{atk} marca de bandeja!", "{atk} GOL após pressão constante!", "{atk} converte com facilidade!",
            "{atk} GOOOL! Ataque imparável!", "{atk} arrasa! Que gol!", "{atk} faz parecer fácil!",
            "{atk} cravar o gol!", "{atk} ataque-relâmpago!", "{atk} GOOOL espetacular!"
        ],
        miss: [
            "{atk} se lança ao ataque mas perde a bola!", "{atk} arrisca de longe! Passou!",
            "{atk} cabeceia e tira tinta!", "{atk} chuta forte mas erra o alvo!", "{atk} desperdiça gol feito!",
            "{atk} pega mal e a bola sobe!", "{atk} arrisca chute torto!", "{atk} perde gol incrível!"
        ],
        save: [
            "Milagre do goleiro do {def}! Quase gol!", "O goleiro do {def} salva o time!",
            "Defesaça espetacular do {def}!", "{def} se segura no goleiro!", "O goleiro do {def} evita o pior!",
            "Defesa heróica do {def}!", "{def} está vivo graças ao goleiro!"
        ],
        filler: [
            "{atk} mantém pressão ofensiva. {def} sofre.", "Jogo aberto, {atk} domina o campo de ataque.",
            "{atk} ataca incessantemente.", "{def} se defende como pode.", "{atk} põe muita gente no ataque.",
            "Festival ofensivo do {atk}!", "{def} encurralado.", "{atk} não dá trégua.",
            "Pressão sufocante do {atk}.", "{def} respira mal."
        ]
    },
    defensive: {
        chance: [
            "{atk} sai em contra-ataque rápido!", "{atk} rouba a bola e sai correndo!", "{atk} lança na velocidade!",
            "{atk} explora espaço deixado!", "{atk} corre no contragolpe!", "{atk} aproveita brecha!",
            "{atk} surpreende com velocidade!", "{atk} dispara em transição!", "{atk} pega o {def} desligado!"
        ],
        goal: [
            "{atk} marca no contra-ataque! Mortal!", "{atk} GOOOL de contra! Eficiência pura!", "{atk} letal na saída!",
            "{atk} GOL fulminante na transição!", "{atk} converte contragolpe!", "{atk} mata na velocidade!",
            "{atk} GOOOL! Contra-ataque cirúrgico!", "{atk} marca em jogada relâmpago!"
        ],
        miss: [
            "{atk} tenta o contra mas perde o timing!", "{atk} chega mas finaliza mal!",
            "{atk} sai rápido mas erra a conclusão!", "{atk} dispara mas chuta isolado!"
        ],
        save: [
            "O goleiro do {def} fecha o ângulo!", "Salvou! {def} sobrevive!",
            "Defesaça do {def}!", "{def} agarra no contra!"
        ],
        filler: [
            "{atk} recua e fecha os espaços.", "Jogo truncado. {atk} espera o momento certo.",
            "{def} tenta furar a retranca.", "{atk} compacto na defesa.", "Marcação cerrada.",
            "{def} bate na muralha do {atk}.", "{atk} sufoca o jogo.", "Cadência baixa.",
            "{def} sem espaço pra criar."
        ]
    },
    pressing: {
        chance: [
            "{atk} rouba na saída de bola do {def}!", "{atk} pressiona e recupera!", "{atk} não deixa {def} respirar!",
            "{atk} ataca em cima da marcação!", "{atk} encurta espaços!", "{atk} sufoca o adversário!",
            "{atk} rouba alta e parte!", "{atk} marca por pressão!"
        ],
        goal: [
            "{atk} marca após pressão alta! Asfixiou!", "{atk} GOOOL! Pressionou e converteu!", "{atk} rouba e marca!",
            "{atk} GOL após roubada!", "{atk} pressiona e mata!", "{atk} converte erro do {def}!"
        ],
        miss: [
            "{atk} pressiona mas se desgasta!", "{atk} erra na pressão e abre espaço!",
            "{atk} cansa e perde objetivo!"
        ],
        save: [
            "O goleiro do {def} segura firme!", "Pressão do {atk} não consegue furar!",
            "Defesaça! Ataque parou na trave!"
        ],
        filler: [
            "{atk} mantém marcação altíssima. {def} sem ar.", "Intensidade do {atk} é impressionante.",
            "{def} não consegue sair jogando.", "{atk} sufoca!", "Pressão alta funcionando!",
            "{def} sem espaço.", "{atk} não dá tempo de pensar.", "Jogo intenso!"
        ]
    },
    counter: {
        chance: [
            "{atk} absorve e sai em velocidade!", "{atk} arma o contra-ataque mortal!", "{atk} espera, rouba e lança!",
            "{atk} segura e dispara!", "{atk} aguarda momento e parte!", "{atk} explora vazio!"
        ],
        goal: [
            "{atk} fulmina no contra-ataque! GOOOL!", "{atk} mata o jogo na transição!", "{atk} eficiente como sempre!",
            "{atk} GOOOL letal de contra!", "{atk} converte na primeira chance!"
        ],
        miss: [
            "{atk} tenta o contra mas isolou!", "{atk} sai rápido mas errou o passe final!",
            "{atk} dispara mas perde a bola!"
        ],
        save: [
            "Defesaça! O goleiro do {def} estava preparado!", "O contra do {atk} é barrado!",
            "{def} agarra no contragolpe!"
        ],
        filler: [
            "{atk} espera pacientemente.", "{def} tem a bola mas não acha espaço.", "Jogo de xadrez tático.",
            "{atk} retraído estuda momento.", "{def} ataca mas {atk} segura.", "Disputa estratégica.",
            "{atk} aguarda o erro do {def}."
        ]
    },
    possession: {
        chance: [
            "{atk} troca passes e acha o espaço!", "{atk} desfaz a marcação com posse!", "{atk} cansa o {def} com toques!",
            "{atk} circula a bola e penetra!", "{atk} chega após paciente armação!", "{atk} cria com posse!"
        ],
        goal: [
            "{atk} marca após 25 toques! Posse letal!", "{atk} GOOOL! A paciência pagou!", "{atk} perfura com maestria!",
            "{atk} GOL após posse longa!", "{atk} converte armação minuciosa!"
        ],
        miss: [
            "{atk} tenta mas falta objetividade!", "{atk} troca muitos passes e perde!",
            "{atk} demora demais e perde a chance!"
        ],
        save: [
            "O goleiro do {def} faz a leitura!", "Boa defesa! {def} resiste à posse!",
            "Defesaça! {def} aguenta!"
        ],
        filler: [
            "{atk} domina 65% da posse.", "Toque, toque, toque... {def} corre atrás.", "{atk} não se apressa.",
            "{atk} mantém o ritmo.", "{def} cansa de correr.", "{atk} dita o tempo.",
            "Posse imensa do {atk}.", "{def} sem a bola."
        ]
    }
};

function recalcOvr(player) {
    const a = player.attributes;
    switch (player.position) {
        case "GOL": player.ovr = Math.floor(a.REF * 0.5 + a.DEF * 0.2 + a.FIS * 0.3); break;
        case "DEF": player.ovr = Math.floor(a.DEF * 0.6 + a.FIS * 0.25 + a.CRI * 0.15); break;
        case "MEI": player.ovr = Math.floor(a.CRI * 0.5 + a.FIS * 0.2 + a.FIN * 0.15 + a.DEF * 0.15); break;
        case "ATA": player.ovr = Math.floor(a.FIN * 0.5 + a.FIS * 0.25 + a.CRI * 0.25); break;
        default: player.ovr = Math.floor((a.FIS + a.DEF + a.CRI + a.FIN + (a.REF || 50)) / 5);
    }

    // Hedonic Pricing recalculation upon OVR change
    player.marketValue = calcMarketValue({
        playerOvr: player.ovr,
        playerAge: player.age || 25,
        playerPotential: player.potential,
        playerContract: player.contract?.weeksLeft ?? 26,
        playerForm: player.form?.trend || 0
    });
}
