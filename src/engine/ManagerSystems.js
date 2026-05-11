import { rng as systemRng } from './rng.js';
/**
 * ManagerSystems.js — Sistemas avançados do Modo Treinador
 * 
 * Contém:
 * - Formações e táticas
 * - Team Talks (preleção)
 * - Treino do plantel
 * - Finanças (salários, bilheteria, premiação)
 * - Transfer AI (ofertas geradas)
 * - Moral do elenco
 * - Condições de jogo (clima)
 */

// ============================================================
// FORMAÇÕES
// ============================================================
export const FORMATIONS = {
    "4-3-3": { DEF: 4, MEI: 3, ATA: 3, style: "balanced", moralBonus: 0 },
    "4-4-2": { DEF: 4, MEI: 4, ATA: 2, style: "balanced", moralBonus: 0 },
    "3-5-2": { DEF: 3, MEI: 5, ATA: 2, style: "offensive", moralBonus: 0 },
    "5-3-2": { DEF: 5, MEI: 3, ATA: 2, style: "defensive", moralBonus: 0 },
    "4-2-3-1": { DEF: 4, MEI: 5, ATA: 1, style: "possession", moralBonus: 0 },
    "4-1-4-1": { DEF: 4, MEI: 5, ATA: 1, style: "counter", moralBonus: 0 },
    "3-4-3": { DEF: 3, MEI: 4, ATA: 3, style: "ultra_offensive", moralBonus: -5 },
    "5-4-1": { DEF: 5, MEI: 4, ATA: 1, style: "park_the_bus", moralBonus: -5 },
};

// ============================================================
// TÁTICAS DE JOGO
// ============================================================
export const TACTICS = {
    normal:    { name: "Normal",       ataModifier: 1.0, defModifier: 1.0, description: "Jogo equilibrado." },
    offensive: { name: "Ofensivo",     ataModifier: 1.3, defModifier: 0.7, description: "Ataque total. Defesa exposta." },
    defensive: { name: "Defensivo",    ataModifier: 0.7, defModifier: 1.3, description: "Retranca. Contra-ataque." },
    pressing:  { name: "Pressão Alta", ataModifier: 1.1, defModifier: 0.9, description: "Pressão no campo adversário. Gasta energia." },
    counter:   { name: "Contra-Ataque",ataModifier: 1.2, defModifier: 1.1, description: "Espera e explode. Eficiente mas previsível." },
    possession:{ name: "Posse de Bola",ataModifier: 0.9, defModifier: 1.1, description: "Controle. Menos chances mas mais seguras." },
};

// ============================================================
// TEAM TALKS (Preleção pré-jogo)
// ============================================================
export const TEAM_TALKS = [
    {
        id: "motivational",
        name: "💪 Motivacional",
        text: "Hoje é tudo ou nada! Vamos mostrar quem somos!",
        effect: { moralBoost: 5, energyCost: 5, ataModifier: 1.1, defModifier: 1.0 },
        bestWhen: "losing_streak"  // funciona melhor quando time está em má fase
    },
    {
        id: "calm",
        name: "🧘 Calma e Foco",
        text: "Sem pânico. Joguem o que treinamos. Confiança.",
        effect: { moralBoost: 2, energyCost: 0, ataModifier: 1.0, defModifier: 1.05 },
        bestWhen: "winning_streak"
    },
    {
        id: "aggressive",
        name: "🔥 Agressivo",
        text: "Eu quero sangue nos olhos! Sem desculpas!",
        effect: { moralBoost: -3, energyCost: 10, ataModifier: 1.2, defModifier: 0.9 },
        bestWhen: "big_match"
    },
    {
        id: "threatening",
        name: "⚠️ Ameaçador",
        text: "Quem não render vai pro banco. Simples assim.",
        effect: { moralBoost: -8, energyCost: 0, ataModifier: 1.15, defModifier: 1.15 },
        bestWhen: "complacent"
    },
    {
        id: "tactical",
        name: "📋 Tático",
        text: "Explorar o lado direito deles. Marca encaixada no 9.",
        effect: { moralBoost: 0, energyCost: 0, ataModifier: 1.05, defModifier: 1.1 },
        bestWhen: "always"
    },
    {
        id: "relaxed",
        name: "😎 Descontraído",
        text: "Jogo fácil. Aproveitem e divirtam-se.",
        effect: { moralBoost: 3, energyCost: -5, ataModifier: 0.95, defModifier: 0.95 },
        bestWhen: "easy_match"
    }
];

// ============================================================
// TREINO DO PLANTEL
// ============================================================
// SCHEMA-UNIFIED: attrBoost usa chaves root-level
export const TRAINING_TYPES = [
    {
        id: "fitness",
        name: "🏃 Preparação Física",
        description: "Foco em resistência e recuperação.",
        effect: { energyRecovery: 20, attrBoost: "attacking", attrAmount: 1, moralCost: -2 }
    },
    {
        id: "tactical",
        name: "📋 Treino Tático",
        description: "Ensaios de jogadas e posicionamento.",
        effect: { energyRecovery: 5, attrBoost: "tactical", attrAmount: 1, moralCost: 0 }
    },
    {
        id: "technical",
        name: "⚽ Treino Técnico",
        description: "Passe, controle de bola e visão de jogo.",
        effect: { energyRecovery: 5, attrBoost: "technical", attrAmount: 1, moralCost: 0 }
    },
    {
        id: "attack",
        name: "🎯 Treino de Ataque",
        description: "Movimentação ofensiva e finalização.",
        effect: { energyRecovery: 5, attrBoost: "attacking", attrAmount: 1, moralCost: -1 }
    },
    {
        id: "creativity",
        name: "🧠 Treino Criativo",
        description: "Passes decisivos, dribles e improviso.",
        effect: { energyRecovery: 5, attrBoost: "creativity", attrAmount: 1, moralCost: 0 }
    },
    {
        id: "defense",
        name: "🛡️ Treino Defensivo",
        description: "Marcação, posicionamento e desarmes.",
        effect: { energyRecovery: 5, attrBoost: "defending", attrAmount: 1, moralCost: 0 }
    },
    {
        id: "rest",
        name: "😴 Folga Total",
        description: "Sem treino. Recuperação máxima.",
        effect: { energyRecovery: 35, attrBoost: null, attrAmount: 0, moralCost: 3 }
    },
    {
        id: "double",
        name: "💀 Treino Dobrado",
        description: "Dois períodos. Ganho máximo mas desgasta.",
        effect: { energyRecovery: -15, attrBoost: "ALL", attrAmount: 1, moralCost: -8 }
    }
];

// ============================================================
// CONDIÇÕES DE JOGO
// ============================================================
export const MATCH_CONDITIONS = [
    { id: "normal", name: "☀️ Tempo bom", ataModifier: 1.0, defModifier: 1.0, energyModifier: 1.0, probability: 0.40 },
    { id: "rain", name: "🌧️ Chuva forte", ataModifier: 0.9, defModifier: 0.9, energyModifier: 1.2, probability: 0.15 },
    { id: "heat", name: "🔥 Calor intenso", ataModifier: 1.0, defModifier: 1.0, energyModifier: 1.5, probability: 0.10 },
    { id: "packed", name: "🏟️ Estádio lotado", ataModifier: 1.1, defModifier: 1.1, energyModifier: 1.0, probability: 0.15 },
    { id: "night", name: "🌙 Jogo noturno", ataModifier: 1.05, defModifier: 1.0, energyModifier: 0.9, probability: 0.10 },
    { id: "derby", name: "⚡ Clássico!", ataModifier: 1.15, defModifier: 1.15, energyModifier: 1.3, probability: 0.05 },
    { id: "tv", name: "📺 Transmissão nacional", ataModifier: 1.05, defModifier: 1.0, energyModifier: 1.0, probability: 0.05 },
];

export function rollMatchCondition() {
    const roll = systemRng();
    let cumulative = 0;
    for (const cond of MATCH_CONDITIONS) {
        cumulative += cond.probability;
        if (roll < cumulative) return cond;
    }
    return MATCH_CONDITIONS[0];
}

// ============================================================
// FINANÇAS
// ============================================================
export function calculateWeeklyFinances(team, weekResults, teamId) {
    const finance = { income: 0, expenses: 0, details: [] };

    // ── DESPESAS ─────────────────────────────────────

    // 1. Salários do plantel (AUDIT-FIX #C: escalar por divisão)
    // Div 1 players earn 5x more than Div 3-4 players on average
    const divMultiplier = team.division === 1 ? 5.0 : team.division === 2 ? 2.5 : team.division === 3 ? 1.2 : 1.0;
    const totalWages = team.squad.reduce((sum, p) => {
        const baseSalary = p.salary || 5000;
        return sum + Math.floor(baseSalary * divMultiplier);
    }, 0);
    finance.expenses += totalWages;
    finance.details.push({ type: "expense", label: "Salários", amount: totalWages });

    // 2. AUDIT-FIX #E: Infrastructure costs (money sinks)
    // Stadium maintenance scales with capacity
    const stadiumMaintenance = Math.floor((team.stadium || 5000) * 3);
    finance.expenses += stadiumMaintenance;
    finance.details.push({ type: "expense", label: "Manutenção do Estádio", amount: stadiumMaintenance });

    // Youth academy costs (fixed by division)
    const academyCost = team.division === 1 ? 50000 : team.division === 2 ? 25000 : 10000;
    finance.expenses += academyCost;
    finance.details.push({ type: "expense", label: "Base / CT", amount: academyCost });

    // Medical department (scales with squad size)
    const medicalCost = Math.floor((team.squad?.length || 18) * 1500);
    finance.expenses += medicalCost;
    finance.details.push({ type: "expense", label: "Depto. Médico", amount: medicalCost });

    // ── RECEITAS ─────────────────────────────────────

    // Bilheteria (jogos em casa)
    for (const tId in weekResults) {
        const myMatch = weekResults[tId].find(m => m.home === teamId);
        if (myMatch) {
            // AUDIT-FIX: ticket price scales with division
            const ticketPrice = team.division === 1 ? 60 : team.division === 2 ? 35 : 15;
            const attendance = Math.floor((team.stadium || 5000) * (0.5 + systemRng() * 0.5));
            const ticketIncome = attendance * ticketPrice;
            finance.income += ticketIncome;
            finance.details.push({ type: "income", label: `Bilheteria (${attendance} torcedores)`, amount: ticketIncome });
        }
    }

    // TV (semanal fixa baseada na divisão)
    const tvMoney = team.division === 1 ? 200000 : team.division === 2 ? 80000 : 30000;
    finance.income += tvMoney;
    finance.details.push({ type: "income", label: "Cota de TV", amount: tvMoney });

    return finance;
}

// ============================================================
// TRANSFER AI (propostas automáticas)
// ============================================================
export function generateTransferOffers(team, currentWeek) {
    // Ofertas só aparecem nas janelas: semanas 1-4 e 20-24
    if (currentWeek > 4 && currentWeek < 20) return [];
    if (currentWeek > 24) return [];

    const offers = [];
    // Chance de receber oferta por jogadores bons
    team.squad.forEach(player => {
        if (player.ovr >= 70 && systemRng() < 0.15) {
            const multiplier = 1 + systemRng() * 2; // 1x a 3x do valor
            offers.push({
                playerId: player.id,
                playerName: player.name,
                playerOvr: player.ovr,
                offerAmount: Math.floor((player.value || 5000000) * multiplier),
                buyerClub: getRandomBuyer(),
                deadline: currentWeek + 2
            });
        }
    });
    return offers;
}

function getRandomBuyer() {
    const clubs = [
        "Manchester City", "PSG", "Real Madrid", "Bayern Munich", "Barcelona",
        "Inter Milan", "Liverpool", "Chelsea", "Juventus", "Atletico Madrid",
        "Borussia Dortmund", "AC Milan", "Arsenal", "Napoli", "Tottenham"
    ];
    return clubs[Math.floor(systemRng() * clubs.length)];
}

// ============================================================
// MORAL DO ELENCO
// ============================================================
export function calculateSquadMoral(team) {
    if (!team.squad || team.squad.length === 0) return 50;
    const avg = team.squad.reduce((sum, p) => sum + (p.moral || 50), 0) / (team.squad.length || 1);
    return Math.round(avg);
}

// SCHEMA-UNIFIED: Training opera direto nas chaves root-level do player
const STAT_KEYS_TRAINING = ['attacking', 'technical', 'tactical', 'defending', 'creativity'];

export function applyTraining(team, trainingType) {
    const training = TRAINING_TYPES.find(t => t.id === trainingType);
    if (!training) return { success: false, msg: "Tipo de treino inválido.", improvements: [] };

    const improvements = [];

    team.squad.forEach(player => {
        // SCHEMA-UNIFIED: garantir atributos root-level
        for (const k of STAT_KEYS_TRAINING) {
            if (player[k] === undefined) player[k] = player.ovr || 50;
        }
        // Energy
        player.energy = Math.max(0, Math.min(100, player.energy + training.effect.energyRecovery));
        // Moral
        player.moral = Math.max(0, Math.min(100, (player.moral || 50) + training.effect.moralCost));
        // Attribute boost
        if (training.effect.attrBoost === "ALL") {
            const boosted = [];
            STAT_KEYS_TRAINING.forEach(attr => {
                const old = player[attr] || 50;
                player[attr] = Math.min(99, old + training.effect.attrAmount);
                if (player[attr] > old) boosted.push({ attr, old, now: player[attr] });
            });
            if (boosted.length > 0) improvements.push({ name: player.name, changes: boosted });
        } else if (training.effect.attrBoost) {
            const attr = training.effect.attrBoost;
            const old = player[attr] || 50;
            player[attr] = Math.min(99, old + training.effect.attrAmount);
            if (player[attr] > old) {
                improvements.push({ name: player.name, changes: [{ attr, old, now: player[attr] }] });
            }
        }
    });

    // Recalculate OVR — SCHEMA-UNIFIED: weighted average por posição
    team.squad.forEach(p => {
        for (const k of STAT_KEYS_TRAINING) {
            if (p[k] === undefined) p[k] = p.ovr || 50;
        }
        switch (p.position) {
            case 'GOL': p.ovr = Math.floor(p.defending * 0.45 + p.tactical * 0.25 + p.technical * 0.20 + p.creativity * 0.05 + p.attacking * 0.05); break;
            case 'DEF': p.ovr = Math.floor(p.defending * 0.50 + p.tactical * 0.25 + p.attacking * 0.10 + p.technical * 0.10 + p.creativity * 0.05); break;
            case 'MEI': p.ovr = Math.floor(p.creativity * 0.30 + p.technical * 0.25 + p.tactical * 0.20 + p.defending * 0.10 + p.attacking * 0.15); break;
            case 'ATA': p.ovr = Math.floor(p.attacking * 0.45 + p.technical * 0.20 + p.creativity * 0.20 + p.tactical * 0.10 + p.defending * 0.05); break;
            default: p.ovr = Math.floor((p.attacking + p.technical + p.tactical + p.defending + p.creativity) / 5);
        }
    });

    const impText = improvements.slice(0, 5).map(i =>
        `${i.name}: ${i.changes.map(c => `${c.attr} ${c.old}→${c.now}`).join(', ')}`
    ).join(' | ');

    return {
        success: true,
        msg: `Treino "${training.name}" aplicado.${impText ? ' 📈 ' + impText : ''}`,
        improvements,
    };
}

export function applyTeamTalk(team, talkId) {
    const talk = TEAM_TALKS.find(t => t.id === talkId);
    if (!talk) return { success: false, talk: null };

    team.squad.forEach(p => {
        p.moral = Math.max(0, Math.min(100, (p.moral || 50) + talk.effect.moralBoost));
        p.energy = Math.max(0, Math.min(100, p.energy - talk.effect.energyCost));
    });

    return { success: true, talk, modifiers: { ata: talk.effect.ataModifier, def: talk.effect.defModifier } };
}
