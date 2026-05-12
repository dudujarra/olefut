import { rng as systemRng } from './rng.js';
/**
 * PlayerTraits.js — Habilidades especiais, Career Stats, Mentoring, Morale Events
 * 
 * Traits: perks individuais que modificam performance em situações específicas
 * Career Stats: tracking de gols/assists/appearances por temporada
 * Mentoring: veteranos ensinam jovens
 * Morale Events: eventos narrativos randômicos entre partidas
 */

// ============================================================
// POSITION_TRAITS — Especializações por Posição (SPEC-144)
// São o que cria "estrelas" no jogo. Exclusivos por posição.
// ============================================================
export const POSITION_TRAITS = [
    {
        id: 'poacher',
        name: '🎯 Artilheiro',
        description: '+25% conversão de gols',
        positions: ['ATA'],
        rarity: 0.12,
        goalConversionBonus: 1.25,
    },
    {
        id: 'penalty_stopper',
        name: '🧤 Pegador de Pênalti',
        description: '+35% save em pênalti',
        positions: ['GOL'],
        rarity: 0.10,
        penaltySaveBonus: 1.35,
    },
    {
        id: 'penalty_king',
        name: '⚽ Cobrador Nato',
        description: '+40% conversão em pênalti',
        positions: ['ATA', 'MEI'],
        rarity: 0.10,
        penaltyConversionBonus: 1.40,
    },
    {
        id: 'rockwall',
        name: '🧱 Muralha',
        description: '+15% setor defensivo do time',
        positions: ['DEF', 'GOL'],
        rarity: 0.08,
        defenseSectorBonus: 0.15,
    },
    {
        id: 'set_piece_target',
        name: '🎯 Alvo de Bola Parada',
        description: '+20% gol em escanteio/falta',
        positions: ['ATA', 'DEF'],
        rarity: 0.09,
        setPieceConvBonus: 1.20,
    },
];

// IDs de todos os position traits (para validação de stacking)
const POSITION_TRAIT_IDS = new Set(POSITION_TRAITS.map(t => t.id));

// ============================================================
// TRAITS — Habilidades Genéricas (qualquer posição)
// ============================================================
export const TRAITS = [
    { id: "clutch", name: "🎯 Decisivo", description: "Rende mais nos últimos 15 min", matchEffect: (minute) => minute >= 75 ? 1.25 : 1.0, rarity: 0.08 },
    { id: "freekick", name: "🎯 Cobrador", description: "+20% em bola parada", matchEffect: () => 1.0, setpieceBonus: 1.2, rarity: 0.10 },
    { id: "leader", name: "👔 Líder Nato", description: "+3 moral do time após vitória", postMatchEffect: 'leaderBoost', rarity: 0.06 },
    { id: "glass", name: "🔮 Cristal", description: "2x chance de lesão", injuryMod: 2.0, rarity: 0.08 },
    { id: "ironman", name: "🦾 Cavalo de Aço", description: "50% menos lesão", injuryMod: 0.5, rarity: 0.07 },
    { id: "hothead", name: "🔴 Esquentado", description: "3x chance de cartão", cardMod: 3.0, rarity: 0.09 },
    { id: "speedster", name: "💨 Velocista", description: "+15% em contra-ataque", tacticBonus: { counter: 1.15 }, rarity: 0.10 },
    { id: "playmaker", name: "🎩 Armador", description: "+20% em posse de bola", tacticBonus: { possession: 1.2 }, rarity: 0.08 },
    { id: "targetman", name: "🗼 Pivô", description: "+15% em jogo aéreo/ofensivo", tacticBonus: { offensive: 1.15 }, rarity: 0.09 },
    { id: "workhorse", name: "🐎 Trabalhador", description: "-30% desgaste de energia", energySaveMod: 0.7, rarity: 0.10 },
    { id: "wonderkid", name: "⭐ Joia", description: "+50% crescimento de atributos", growthMod: 1.5, rarity: 0.05 },
    { id: "veteran", name: "🎖️ Veterano", description: "Estabiliza moral do time", postMatchEffect: 'veteranCalm', rarity: 0.07 },
    { id: "bigmatch", name: "🏟️ Jogador de Clássico", description: "+15% em derbies", derbyMod: 1.15, rarity: 0.06 },
    { id: "flop", name: "📉 Inconsistente", description: "-10% quando cold streak", coldPenalty: 0.9, rarity: 0.10 },
    { id: "mentalist", name: "🧠 Mentalidade", description: "Nunca perde moral abaixo de 40", moralFloor: 40, rarity: 0.07 },
];

/**
 * SPEC-144: Assign traits respeitando posição.
 * Máx 1 trait de especialização (posição-específico) + 1 genérico.
 */
export function rollTraits(player) {
    if (player.traits && player.traits.length > 0) return; // already has
    player.traits = [];
    const maxTraits = player.age < 22 ? 1 : 2;

    // 1. Tentar 1 trait de especialização (posição-específico)
    const eligible = POSITION_TRAITS.filter(t => t.positions.includes(player.position));
    const shuffledPos = [...eligible].sort(() => systemRng() - 0.5);
    for (const trait of shuffledPos) {
        if (player.traits.length >= 1) break;
        if (systemRng() < trait.rarity) {
            player.traits.push(trait.id);
            break;
        }
    }

    // 2. Traits genéricos até maxTraits
    const shuffled = [...TRAITS].sort(() => systemRng() - 0.5);
    for (const trait of shuffled) {
        if (player.traits.length >= maxTraits) break;
        if (systemRng() < trait.rarity) {
            player.traits.push(trait.id);
        }
    }
}

export function getPlayerTraits(player) {
    if (!player.traits) return [];
    const all = [...TRAITS, ...POSITION_TRAITS];
    return player.traits.map(id => all.find(t => t.id === id)).filter(Boolean);
}

export function hasTrait(player, traitId) {
    return player.traits && player.traits.includes(traitId);
}

// ============================================================
// SPEC-144: Helpers de bonus para MatchSimulator
// ============================================================

/** ATA com poacher → +25% conversão de gol */
export function getGoalConversionBonus(player) {
    return player?.traits?.includes('poacher') ? 1.25 : 1.0;
}

/** GOL com penalty_stopper → +35% save em pênalti */
export function getPenaltySaveBonus(player) {
    return player?.traits?.includes('penalty_stopper') ? 1.35 : 1.0;
}

/** ATA/MEI com penalty_king → +40% conversão em pênalti */
export function getPenaltyConversionBonus(player) {
    return player?.traits?.includes('penalty_king') ? 1.40 : 1.0;
}

/**
 * Time com DEF/GOL rockwall → +15% por jogador com trait no setor defensivo.
 * @param {Array} squad - squad completo do time
 */
export function getDefenseSectorBonus(squad) {
    if (!squad?.length) return 1.0;
    const defenders = squad.filter(p => p.isTitular && (p.position === 'DEF' || p.position === 'GOL'));
    const rockwalls = defenders.filter(p => p.traits?.includes('rockwall')).length;
    return 1.0 + (rockwalls * 0.15);
}

/** ATA/DEF com set_piece_target → +20% conversão em bola parada */
export function getSetPieceBonus(player) {
    return player?.traits?.includes('set_piece_target') ? 1.20 : 1.0;
}

/** Retorna display name do trait de especialização do jogador (para UI) */
export function getSpecializationDisplay(player) {
    if (!player?.traits) return null;
    const spec = POSITION_TRAITS.find(t => player.traits.includes(t.id));
    return spec ? { id: spec.id, name: spec.name, description: spec.description } : null;
}

/**
 * Get combined match modifier from traits for a given context
 */
export function getTraitMatchModifier(player, minute, tactic, isDerby) {
    if (!player.traits) return 1.0;
    let mod = 1.0;
    for (const traitId of player.traits) {
        const trait = TRAITS.find(t => t.id === traitId);
        if (!trait) continue;
        if (trait.matchEffect) mod *= trait.matchEffect(minute);
        if (trait.tacticBonus && trait.tacticBonus[tactic]) mod *= trait.tacticBonus[tactic];
        if (isDerby && trait.derbyMod) mod *= trait.derbyMod;
        if (player.form?.trend === 'cold' && trait.coldPenalty) mod *= trait.coldPenalty;
    }
    return mod;
}

// ============================================================
// CAREER STATS — Tracking por jogador
// ============================================================
export function initCareerStats(player) {
    if (!player.career) {
        player.career = {
            totalGoals: 0,
            totalAssists: 0,
            totalApps: 0,
            totalCards: 0,
            totalMotm: 0,
            seasonGoals: 0,
            seasonAssists: 0,
            seasonApps: 0,
            seasonCards: 0,
            seasonMotm: 0,
            history: [], // [{season, team, goals, assists, apps}]
        };
    }
}

export function recordMatchStats(player, goals, assists, cards, isMotm) {
    initCareerStats(player);
    player.career.totalGoals += goals;
    player.career.totalAssists += assists;
    player.career.totalApps += 1;
    player.career.totalCards += cards;
    player.career.seasonGoals += goals;
    player.career.seasonAssists += assists;
    player.career.seasonApps += 1;
    player.career.seasonCards += cards;
    if (isMotm) {
        player.career.totalMotm += 1;
        player.career.seasonMotm += 1;
    }
}

export function closeSeasonStats(player, seasonNum, teamName) {
    initCareerStats(player);
    player.career.history.push({
        season: seasonNum,
        team: teamName,
        goals: player.career.seasonGoals,
        assists: player.career.seasonAssists,
        apps: player.career.seasonApps,
        cards: player.career.seasonCards,
        motm: player.career.seasonMotm,
    });
    // Reset season
    player.career.seasonGoals = 0;
    player.career.seasonAssists = 0;
    player.career.seasonApps = 0;
    player.career.seasonCards = 0;
    player.career.seasonMotm = 0;
}

// ============================================================
// SEASON AWARDS
// ============================================================
export function calculateSeasonAwards(squad, teamName, seasonNum) {
    const awards = [];

    // Golden Boot
    const topScorer = [...squad].sort((a, b) => (b.career?.seasonGoals || 0) - (a.career?.seasonGoals || 0))[0];
    if (topScorer && (topScorer.career?.seasonGoals || 0) > 0) {
        awards.push({
            type: 'golden_boot',
            emoji: '👟',
            name: 'Artilheiro',
            player: topScorer.name,
            value: `${topScorer.career.seasonGoals} gols`,
        });
    }

    // Assist King
    const topAssist = [...squad].sort((a, b) => (b.career?.seasonAssists || 0) - (a.career?.seasonAssists || 0))[0];
    if (topAssist && (topAssist.career?.seasonAssists || 0) > 0) {
        awards.push({
            type: 'assist_king',
            emoji: '🎯',
            name: 'Rei das Assistências',
            player: topAssist.name,
            value: `${topAssist.career.seasonAssists} assistências`,
        });
    }

    // MVP (most MOTM)
    const mvp = [...squad].sort((a, b) => (b.career?.seasonMotm || 0) - (a.career?.seasonMotm || 0))[0];
    if (mvp && (mvp.career?.seasonMotm || 0) > 0) {
        awards.push({
            type: 'mvp',
            emoji: '⭐',
            name: 'Melhor Jogador',
            player: mvp.name,
            value: `${mvp.career.seasonMotm}x Craque do Jogo`,
        });
    }

    // Best Young Player (U21)
    const bestYouth = [...squad].filter(p => p.age <= 21)
        .sort((a, b) => (b.career?.seasonGoals || 0) + (b.career?.seasonAssists || 0) - (a.career?.seasonGoals || 0) - (a.career?.seasonAssists || 0))[0];
    if (bestYouth && ((bestYouth.career?.seasonGoals || 0) + (bestYouth.career?.seasonAssists || 0)) > 0) {
        awards.push({
            type: 'best_youth',
            emoji: '🌟',
            name: 'Revelação',
            player: bestYouth.name,
            value: `${bestYouth.career.seasonGoals}G ${bestYouth.career.seasonAssists}A`,
        });
    }

    // Iron Man (most appearances + no injury weeks)
    const ironMan = [...squad].sort((a, b) => (b.career?.seasonApps || 0) - (a.career?.seasonApps || 0))[0];
    if (ironMan && (ironMan.career?.seasonApps || 0) >= 30) {
        awards.push({
            type: 'iron_man',
            emoji: '🦾',
            name: 'Cavalo de Aço',
            player: ironMan.name,
            value: `${ironMan.career.seasonApps} jogos`,
        });
    }

    return awards;
}

// ============================================================
// MORALE EVENTS — Eventos narrativos randômicos
// ============================================================
export const MORALE_EVENTS = [
    // Positive
    { id: "birthday", text: "🎂 {player} fez aniversário! O grupo celebrou no vestiário.", effect: { targetMoral: 5, teamMoral: 1 }, chance: 0.03 },
    { id: "fan_chant", text: "🎵 A torcida criou um canto especial para {player}!", effect: { targetMoral: 8, teamMoral: 0 }, chance: 0.02 },
    { id: "charity", text: "🤝 {player} fez trabalho social na comunidade. Imprensa elogiou.", effect: { targetMoral: 5, teamMoral: 2 }, chance: 0.015 },
    { id: "national_call", text: "🇧🇷 {player} foi convocado para a seleção!", effect: { targetMoral: 10, teamMoral: 2 }, chance: 0.02, req: (p) => p.ovr >= 75 },
    { id: "award_nominee", text: "🏅 {player} foi indicado ao prêmio de melhor do mês!", effect: { targetMoral: 7, teamMoral: 1 }, chance: 0.02, req: (p) => p.form?.trend === 'hot' },
    { id: "team_dinner", text: "🍽️ O elenco saiu para jantar juntos. Clima excelente.", effect: { targetMoral: 0, teamMoral: 3 }, chance: 0.03 },
    { id: "new_boots", text: "👟 {player} ganhou chuteira nova do patrocinador. Animado!", effect: { targetMoral: 4, teamMoral: 0 }, chance: 0.025 },

    // Negative
    { id: "nightclub", text: "🕺 {player} foi flagrado na balada antes do jogo. Diretoria irritada.", effect: { targetMoral: -8, teamMoral: -2, boardConfidence: -3 }, chance: 0.015 },
    { id: "controversy", text: "💬 {player} criticou o treinador nas redes sociais.", effect: { targetMoral: -10, teamMoral: -3 }, chance: 0.01 },
    { id: "homesick", text: "😢 {player} está com saudade de casa. Quer sair.", effect: { targetMoral: -12, teamMoral: 0 }, chance: 0.01, req: (p) => p.age <= 21 },
    { id: "salary_complaint", text: "💰 {player} reclamou do salário para os colegas.", effect: { targetMoral: -5, teamMoral: -2 }, chance: 0.02, req: (p) => (p.moral || 50) < 40 },
    { id: "fight", text: "🥊 {player1} e {player2} brigaram no treino!", effect: { targetMoral: -10, teamMoral: -4 }, chance: 0.008, dual: true },
    { id: "media_leak", text: "📰 Alguém do vestiário vazou informações para a imprensa.", effect: { targetMoral: 0, teamMoral: -5, boardConfidence: -2 }, chance: 0.01 },

    // Neutral/Complex
    { id: "agent_call", text: "📞 O empresário de {player} ligou para sondar mercado.", effect: { targetMoral: -3, teamMoral: 0 }, chance: 0.02, req: (p) => p.ovr >= 70 },
    { id: "rumor_transfer", text: "📰 Rumores: {player} interessa ao exterior.", effect: { targetMoral: -2, teamMoral: -1 }, chance: 0.02, req: (p) => p.ovr >= 72 },
];

/**
 * Process morale events for the week. Returns array of event descriptions.
 */
export function processMoraleEvents(squad, board) {
    const events = [];

    for (const ev of MORALE_EVENTS) {
        if (systemRng() > ev.chance) continue;

        if (ev.dual) {
            // Fight event — pick 2 random players
            if (squad.length < 2) continue;
            const shuffled = [...squad].sort(() => systemRng() - 0.5);
            const p1 = shuffled[0], p2 = shuffled[1];
            p1.moral = Math.max(0, (p1.moral || 50) + ev.effect.targetMoral);
            p2.moral = Math.max(0, (p2.moral || 50) + ev.effect.targetMoral);
            if (ev.effect.teamMoral) squad.forEach(p => { p.moral = Math.max(0, Math.min(100, (p.moral || 50) + ev.effect.teamMoral)); });
            if (ev.effect.boardConfidence && board) board.confidence = Math.max(0, Math.min(100, board.confidence + ev.effect.boardConfidence));
            events.push(ev.text.replace('{player1}', p1.name).replace('{player2}', p2.name));
            continue;
        }

        // Pick a random eligible player
        const eligible = squad.filter(p => !p.injury && (!ev.req || ev.req(p)));
        if (eligible.length === 0) continue;
        const target = eligible[Math.floor(systemRng() * eligible.length)];

        target.moral = Math.max(0, Math.min(100, (target.moral || 50) + ev.effect.targetMoral));
        if (ev.effect.teamMoral) squad.forEach(p => { p.moral = Math.max(0, Math.min(100, (p.moral || 50) + ev.effect.teamMoral)); });
        if (ev.effect.boardConfidence && board) board.confidence = Math.max(0, Math.min(100, board.confidence + ev.effect.boardConfidence));

        events.push(ev.text.replace('{player}', target.name));
        break; // Max 1 event per week (to avoid spam)
    }

    return events;
}

// ============================================================
// MENTORING — Veterano ensina Jovem
// ============================================================
export function processMentoring(squad) {
    const events = [];

    // Find mentors: age 28+, moral 60+, no injury
    const mentors = squad.filter(p => p.age >= 28 && (p.moral || 50) >= 60 && !p.injury);
    // Find mentees: age <= 22, no injury
    const mentees = squad.filter(p => p.age <= 22 && !p.injury);

    if (mentors.length === 0 || mentees.length === 0) return events;

    // SCHEMA-UNIFIED: usa root-level stats
    const STAT_KEYS = ['attacking', 'technical', 'tactical', 'defending', 'creativity'];

    // One mentoring session per week (10% chance per eligible pair)
    for (const mentee of mentees) {
        if (systemRng() > 0.10) continue;
        const mentor = mentors[Math.floor(systemRng() * mentors.length)];

        // Mentee gets a small boost to a random attr
        const attr = STAT_KEYS[Math.floor(systemRng() * STAT_KEYS.length)];
        const boost = 1;
        const oldVal = mentee[attr] || 50;
        mentee[attr] = Math.min(99, oldVal + boost);

        if (mentee[attr] > oldVal) {
            // Mentee moral boost
            mentee.moral = Math.min(100, (mentee.moral || 50) + 3);
            // Mentor feels valued
            mentor.moral = Math.min(100, (mentor.moral || 50) + 1);

            events.push(`📚 ${mentor.name} treinou ${mentee.name}: ${attr} ${oldVal}→${mentee[attr]}`);
        }
        break; // One mentoring per week
    }

    return events;
}

// ============================================================
// RIVALRY SYSTEM
// ============================================================
export const RIVALRIES = {
    // Brazilian derbies — teamId pairs
    // These are generated at runtime by matching teams in same zone/division
};

/**
 * Check if two teams are rivals (same city/zone)
 */
export function isRivalry(team1, team2) {
    if (!team1 || !team2) return false;
    // Same zone = rivalry
    return team1.zone === team2.zone && team1.division === team2.division;
}

/**
 * Transfer Negotiation — counter-offer system
 */
export function generateCounterOffer(player, initialOffer, round) {
    const baseValue = player.value || (player.ovr * 100000);
    const desiredPrice = baseValue * (1.3 + systemRng() * 0.7); // 130-200% of value

    if (round >= 3) {
        // Final offer — take it or leave it
        return {
            round,
            accepted: initialOffer >= desiredPrice * 0.85,
            counterAmount: Math.floor(desiredPrice * 0.9),
            msg: initialOffer >= desiredPrice * 0.85
                ? `${player.name} aceita a proposta!`
                : `${player.name} recusa a oferta final. Negociação encerrada.`,
            final: true,
        };
    }

    if (initialOffer >= desiredPrice) {
        return { round, accepted: true, counterAmount: initialOffer, msg: `Oferta aceita por ${player.name}!`, final: true };
    }

    // Counter with a price between current and desired
    const gap = desiredPrice - initialOffer;
    const counterAmount = Math.floor(initialOffer + gap * (0.4 + round * 0.15));

    return {
        round,
        accepted: false,
        counterAmount,
        msg: `O agente de ${player.name} pede R$ ${(counterAmount / 1000000).toFixed(1)}M.`,
        final: false,
    };
}
