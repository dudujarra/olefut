/**
 * PlayerDevelopment.js — Aging, Form, Development, Retirement
 * 
 * Ciclo de vida completo do jogador:
 * - Crescimento (16-24): atributos sobem gradualmente
 * - Pico (25-30): estável
 * - Declínio (31+): atributos começam a cair
 * - Aposentadoria (35-40): chance crescente de se aposentar
 * - Form: hot/cold streaks baseado em performance
 */

const PERSONALITY_GROWTH = {
    "Profissional": 1.3,     // treina mais, cresce mais
    "Ambicioso": 1.2,        // quer jogar, cresce se titular
    "Determinado": 1.15,     // constante
    "Casual": 0.9,           // não se esforça tanto
    "Preguiçoso": 0.7,       // mínimo esforço
};

/**
 * Processa desenvolvimento semanal de um jogador.
 * Retorna um array de mensagens de mudança.
 */
export function processPlayerDevelopment(player) {
    const changes = [];
    const personalityMod = PERSONALITY_GROWTH[player.personality] || 1.0;

    // === CRESCIMENTO NATURAL (jovens) ===
    if (player.age <= 24) {
        const growthChance = player.age < 20 ? 0.25 : 0.12;
        if (Math.random() < growthChance * personalityMod) {
            const attrs = Object.keys(player.attributes);
            const attr = attrs[Math.floor(Math.random() * attrs.length)];
            const boost = player.age < 20 ? 2 : 1;
            const oldVal = player.attributes[attr];
            player.attributes[attr] = Math.min(99, oldVal + boost);
            if (player.attributes[attr] > oldVal) {
                changes.push({ type: 'growth', player: player.name, attr, from: oldVal, to: player.attributes[attr] });
            }
        }
    }

    // === DECLÍNIO (veteranos) ===
    if (player.age >= 31) {
        const declineChance = (player.age - 30) * 0.04; // 4% per year over 30
        if (Math.random() < declineChance) {
            // Physical first
            const physAttrs = ['FIS', 'DEF'];
            const attr = physAttrs[Math.floor(Math.random() * physAttrs.length)];
            const oldVal = player.attributes[attr];
            player.attributes[attr] = Math.max(20, oldVal - 1);
            if (player.attributes[attr] < oldVal) {
                changes.push({ type: 'decline', player: player.name, attr, from: oldVal, to: player.attributes[attr] });
            }
        }
    }

    // === APOSENTADORIA ===
    if (player.age >= 35) {
        const retireChance = (player.age - 34) * 0.15;
        if (Math.random() < retireChance) {
            player._retired = true;
            changes.push({ type: 'retirement', player: player.name, age: player.age });
        }
    }

    // === AGING (1x por temporada, semana 38 — chamado externamente) ===

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
export const TACTIC_NARRATION = {
    normal: {
        chance:     ["{atk} arma jogada pelo meio!", "{atk} tenta triangulação!", "{atk} avança pela intermediária!"],
        goal:       ["{atk} marca um belo gol!", "{atk} balança as redes!", "{atk} abre o placar com categoria!"],
        miss:       ["{atk} arrisca mas passa por cima!", "{atk} chuta e o goleiro segura!", "{atk} desperdiça!"],
        save:       ["Defesaça do goleiro do {def}!", "O goleiro do {def} se estica e salva!", "Grande defesa!"],
        filler:     ["{atk} roda a bola no meio.", "Jogo equilibrado no momento.", "{def} recua e espera."],
    },
    offensive: {
        chance:     ["{atk} sobe em bloco! Pressão total!", "{atk} ataca com 4 jogadores!", "{atk} joga no abafa!"],
        goal:       ["{atk} marca de goleada! O jogo é ataque!", "{atk} GOOOL! O jogo ofensivo funciona!", "{atk} explode na frente!"],
        miss:       ["{atk} se lança ao ataque mas perde a bola!", "{atk} arrisca de longe! Passou!"],
        save:       ["Milagre do goleiro do {def}! Quase gol!", "O goleiro do {def} salva o time!"],
        filler:     ["{atk} mantém pressão ofensiva. {def} sofre.", "Jogo aberto, {atk} domina o campo de ataque."],
    },
    defensive: {
        chance:     ["{atk} sai em contra-ataque rápido!", "{atk} rouba a bola e sai correndo!", "{atk} lança na velocidade!"],
        goal:       ["{atk} marca no contra-ataque! Mortal!", "{atk} GOOOL de contra! Eficiência pura!", "{atk} letal na saída!"],
        miss:       ["{atk} tenta o contra mas perde o timing!", "{atk} chega mas finaliza mal!"],
        save:       ["O goleiro do {def} fecha o ângulo!", "Salvou! {def} sobrevive!"],
        filler:     ["{atk} recua e fecha os espaços.", "Jogo truncado. {atk} espera o momento certo.", "{def} tenta furar a retranca."],
    },
    pressing: {
        chance:     ["{atk} rouba na saída de bola do {def}!", "{atk} pressiona e recupera!", "{atk} não deixa {def} respirar!"],
        goal:       ["{atk} marca após pressão alta! Asfixiou!", "{atk} GOOOL! Pressionou e converteu!", "{atk} rouba e marca!"],
        miss:       ["{atk} pressiona mas se desgasta!", "{atk} erra na pressão e abre espaço!"],
        save:       ["O goleiro do {def} segura firme!", "Pressão do {atk} não consegue furar!"],
        filler:     ["{atk} mantém marcação altíssima. {def} sem ar.", "Intensidade do {atk} é impressionante.", "{def} não consegue sair jogando."],
    },
    counter: {
        chance:     ["{atk} absorve e sai em velocidade!", "{atk} arma o contra-ataque mortal!", "{atk} espera, rouba e lança!"],
        goal:       ["{atk} fulmina no contra-ataque! GOOOL!", "{atk} mata o jogo na transição!", "{atk} eficiente como sempre!"],
        miss:       ["{atk} tenta o contra mas isolou!", "{atk} sai rápido mas errou o passe final!"],
        save:       ["Defesaça! O goleiro do {def} estava preparado!", "O contra do {atk} é barrado!"],
        filler:     ["{atk} espera pacientemente.", "{def} tem a bola mas não acha espaço.", "Jogo de xadrez tático."],
    },
    possession: {
        chance:     ["{atk} troca passes e acha o espaço!", "{atk} desfaz a marcação com posse!", "{atk} cansa o {def} com toques!"],
        goal:       ["{atk} marca após 25 toques! Posse letal!", "{atk} GOOOL! A paciência pagou!", "{atk} perfura com maestria!"],
        miss:       ["{atk} tenta mas falta objetividade!", "{atk} troca muitos passes e perde!"],
        save:       ["O goleiro do {def} faz a leitura!", "Boa defesa! {def} resiste à posse!"],
        filler:     ["{atk} domina 65% da posse.", "Toque, toque, toque... {def} corre atrás.", "{atk} não se apressa."],
    },
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
}
