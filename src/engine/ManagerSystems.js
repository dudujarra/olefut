import { rng as systemRng } from './rng.js';
import { calculateOvrFromAttributes } from './PlayerAttributes.js';
import { getDifficulty } from './systems/DifficultyModes.js';
import { getTicketFinanceModifiers } from './TicketPricingSystem.js';
import Morphocycle from './training/Morphocycle.js';
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
        id: "RECOVERY",
        name: "🏃 MD+1 Recuperação (Tática)",
        description: "Baixo impacto neuromuscular. Foco na organização defensiva/ofensiva.",
        effect: { moralCost: 0 }
    },
    {
        id: "TENSION",
        name: "💪 MD-4 Tensão (Espaços Curtos)",
        description: "Jogos 3v3 / 4v4. Foco em força excêntrica e aceleração.",
        effect: { moralCost: -1 }
    },
    {
        id: "DURATION",
        name: "🫁 MD-3 Duração (Campo Aberto)",
        description: "11v11 ou 8v8. Foco em stamina, visão e posicionamento inter-setorial.",
        effect: { moralCost: -2 }
    },
    {
        id: "SPEED",
        name: "⚡ MD-2 Velocidade",
        description: "Ações sem oposição forte. Sprints e finalização.",
        effect: { moralCost: 0 }
    },
    {
        id: "ACTIVATION",
        name: "🧠 MD-1 Ativação",
        description: "Bolas paradas e ajustes finos (Quiet Eye). Carga reduzida.",
        effect: { moralCost: 1 }
    },
    {
        id: "REST",
        name: "😴 Folga Total",
        description: "Dia livre. Recuperação muscular plena.",
        effect: { moralCost: 3 }
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
export function calculateWeeklyFinances(team, weekResults, teamId, engine) {
    const finance = { income: 0, expenses: 0, details: [] };
    const diffMods = getDifficulty().modifiers;
    const econMult = diffMods.economyMult ?? 1.0;
    const maintenanceMult = diffMods.maintenanceMult ?? 1.0;

    // ── DESPESAS ─────────────────────────────────────

    // 1. Salários do plantel (Não afeta maintenanceMult)
    const divMultiplier = team.division === 1 ? 5.0 : team.division === 2 ? 2.5 : team.division === 3 ? 1.2 : 1.0;
    const totalWages = team.squad.reduce((sum, p) => {
        const baseSalary = p.salary || 5000;
        return sum + Math.floor(baseSalary * divMultiplier);
    }, 0);
    finance.expenses += totalWages;
    finance.details.push({ type: "expense", label: "Salários", amount: totalWages });

    // 2. AUDIT-FIX #E: Infrastructure costs (money sinks)
    let stadiumMaintenance = Math.floor((team.stadium || 5000) * 3);
    let academyCost = team.division === 1 ? 50000 : team.division === 2 ? 25000 : 10000;
    let medicalCost = Math.floor((team.squad?.length || 18) * 1500);

    // SPEC-NEW: Sistema de Redução de Custos (Modo Austeridade)
    // Se saldo baixo (<500k) mas não completamente falido (>= -100k)
    // "não acontecer com times quase falidos"
    if (team.balance < 500000 && team.balance >= -100000) {
        stadiumMaintenance = Math.floor(stadiumMaintenance * 0.3);
        academyCost = Math.floor(academyCost * 0.3);
        medicalCost = Math.floor(medicalCost * 0.3);
        
        team._lowMaintenanceWeeks = (team._lowMaintenanceWeeks || 0) + 1;
        
        // Risco de desastre estrutural após longo uso de austeridade
        if (team.balance >= 0 && team._lowMaintenanceWeeks > 10 && systemRng() < 0.05) {
            const multa = 200000 + Math.floor(systemRng() * 300000);
            finance.expenses += multa;
            finance.details.push({ type: "expense", label: "⚠️ Desastre Estrutural (Multa)", amount: multa });
            if (engine && engine.weekEvents) {
                engine.weekEvents.push(`⚠️ Desastre! Infraestrutura sucateada gerou multa de R$ ${(multa/1000).toFixed(0)}K para o ${team.name}`);
            }
            team._lowMaintenanceWeeks = 0;
        }
    } else {
        team._lowMaintenanceWeeks = 0;
    }

    // Aplica multiplicador apenas na infraestrutura! (Evita espiral de salários em Sinistro)
    stadiumMaintenance = Math.floor(stadiumMaintenance * maintenanceMult);
    academyCost = Math.floor(academyCost * maintenanceMult);
    medicalCost = Math.floor(medicalCost * maintenanceMult);

    finance.expenses += stadiumMaintenance;
    finance.details.push({ type: "expense", label: "Manutenção do Estádio", amount: stadiumMaintenance });
    finance.expenses += academyCost;
    finance.details.push({ type: "expense", label: "Base / CT", amount: academyCost });
    finance.expenses += medicalCost;
    finance.details.push({ type: "expense", label: "Depto. Médico", amount: medicalCost });

    // ── RECEITAS (scaled by economyMult) ─────────────────────────────────────

    // Bilheteria (jogos em casa)
    // Elifoot Classic: Ticket Pricing modifiers
    const ticketMods = engine ? getTicketFinanceModifiers(engine) : { priceMultiplier: 1.0, attendanceMultiplier: 1.0 };
    for (const tId in weekResults) {
        const myMatch = weekResults[tId].find(m => m.home === teamId);
        if (myMatch) {
            // AUDIT-FIX: ticket price scales with division
            const baseTicketPrice = team.division === 1 ? 60 : team.division === 2 ? 35 : 15;
            const ticketPrice = Math.floor(baseTicketPrice * ticketMods.priceMultiplier);
            const baseAttendance = Math.floor((team.stadium || 5000) * (0.5 + systemRng() * 0.5));
            const attendance = Math.floor(baseAttendance * ticketMods.attendanceMultiplier);
            const ticketIncome = Math.floor(attendance * ticketPrice * econMult);
            finance.income += ticketIncome;
            finance.details.push({ type: "income", label: `Bilheteria (${attendance} torcedores)`, amount: ticketIncome });
        }
    }

    // TV (semanal fixa baseada na divisão)
    const tvMoney = Math.floor((team.division === 1 ? 200000 : team.division === 2 ? 80000 : 30000) * econMult);
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

export function applyTraining(team, trainingType) {
    const training = TRAINING_TYPES.find(t => t.id === trainingType);
    if (!training) return { success: false, msg: "Tipo de treino inválido.", improvements: [] };

    const improvements = [];

    team.squad.forEach(player => {
        if (!player.attributes) return;

        // Apply Morphocycle Load
        const loadResult = Morphocycle.calculateDailyLoad(player, trainingType);
        
        // Energy drain based on sRPE Load
        const energyDrain = Math.round(loadResult.load / 30);
        if (trainingType === "REST") {
            player.energy = Math.min(100, player.energy + 30);
        } else if (trainingType === "RECOVERY" || trainingType === "ACTIVATION") {
            player.energy = Math.min(100, player.energy + 10 - energyDrain);
        } else {
            player.energy = Math.max(0, player.energy - energyDrain);
        }

        player.moral = Math.max(0, Math.min(100, (player.moral || 50) + training.effect.moralCost));

        // Training Growth
        const deltas = Morphocycle.applyTrainingGrowth(player, trainingType);
        let boosted = [];
        
        for (const cat in deltas) {
            for (const attr in deltas[cat]) {
                const growth = deltas[cat][attr];
                if (growth > 0 && player.attributes[cat][attr]) {
                    // Use systemRng to keep deterministic consistency
                    if (systemRng() < growth) {
                        const old = player.attributes[cat][attr];
                        if (old < 20) {
                            player.attributes[cat][attr] = Math.min(20, old + 1);
                            boosted.push({ attr, old, now: player.attributes[cat][attr] });
                        }
                    }
                }
            }
        }
        
        if (boosted.length > 0) {
            improvements.push({ name: player.name, changes: boosted });
        }
    });

    // Recalculate OVR — SCHEMA-UNIFIED: weighted average por posição
    team.squad.forEach(p => {
        if (p.attributes) {
            const macroPos = ['GOL', 'DEF', 'MEI', 'ATA'].includes(p.position) ? p.position : 'MEI';
            p.ovr = calculateOvrFromAttributes(p.attributes, macroPos);
        }
    });

    const impText = improvements.slice(0, 5).map(i =>
        `${i.name}: ${i.changes.map(c => `+1 ${c.attr}`).join(', ')}`
    ).join(' | ');

    return {
        success: true,
        msg: `Treino Morfociclo "${training.name}" aplicado.${impText ? ' 📈 ' + impText : ''}`,
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
