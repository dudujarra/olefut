import { rng as systemRng } from './rng.js';
/**
 * InjurySystem.js — Lesões e recuperação
 * Inspirado em FM (severity tiers) + OléFUT (simplicidade)
 */

const INJURY_TYPES = [
    { id: "muscle", name: "Lesão muscular", minWeeks: 1, maxWeeks: 3, emoji: "🦵" },
    { id: "ankle", name: "Torção no tornozelo", minWeeks: 2, maxWeeks: 4, emoji: "🦶" },
    { id: "knee", name: "Lesão no joelho", minWeeks: 3, maxWeeks: 8, emoji: "🦿" },
    { id: "hamstring", name: "Estiramento na coxa", minWeeks: 1, maxWeeks: 3, emoji: "🩹" },
    { id: "fracture", name: "Fratura", minWeeks: 6, maxWeeks: 15, emoji: "🏥" },
    { id: "concussion", name: "Concussão", minWeeks: 1, maxWeeks: 2, emoji: "🤕" },
];

/**
 * Rola chance de lesão para um jogador.
 * @param {object} player - jogador do squad
 * @param {string} context - 'match' | 'training_double' | 'training'
 * @returns {object|null} injury object ou null
 */
export function rollInjury(player, context = 'match') {
    let chance = 0;

    // Base chance por contexto
    if (context === 'match') chance = 0.04; // 4% por jogo
    else if (context === 'training_double') chance = 0.06;
    else chance = 0.02;

    // Modificadores
    if (player.energy < 30) chance *= 2.0; // cansaço dobra risco
    if (player.energy < 15) chance *= 3.0;
    if (player.age > 32) chance *= 1.5; // veterano
    if (player.age < 20) chance *= 0.7; // jovem

    if (systemRng() > chance) return null;

    // Severidade: energia baixa = lesão mais grave
    const severityPool = player.energy < 30
        ? INJURY_TYPES // todas possíveis
        : INJURY_TYPES.filter(t => t.maxWeeks <= 4); // só leves

    const type = severityPool[Math.floor(systemRng() * severityPool.length)];
    const weeks = type.minWeeks + Math.floor(systemRng() * (type.maxWeeks - type.minWeeks + 1));

    return {
        type: type.id,
        name: type.name,
        emoji: type.emoji,
        weeksLeft: weeks,
        totalWeeks: weeks,
    };
}

/**
 * Avança recuperação de lesão.
 * @returns {boolean} true se curou
 */
export function healInjury(player) {
    if (!player.injury) return false;
    player.injury.weeksLeft--;
    if (player.injury.weeksLeft <= 0) {
        player.injury = null;
        player.energy = 60; // volta com energia parcial
        return true;
    }
    return false;
}

/**
 * Aplica lesões ao plantel após partida.
 */
export function processMatchInjuries(squad) {
    const injuries = [];
    squad.filter(p => p.isTitular && !p.injury).forEach(player => {
        const injury = rollInjury(player, 'match');
        if (injury) {
            player.injury = injury;
            player.isTitular = false; // sai do time titular
            injuries.push({ player: player.name, ...injury });
        }
    });
    return injuries;
}

/**
 * Aplica lesões ao plantel no treino.
 */
export function processTrainingInjuries(squad, trainingType) {
    const context = trainingType === 'double' ? 'training_double' : 'training';
    const injuries = [];
    squad.filter(p => !p.injury).forEach(player => {
        const injury = rollInjury(player, context);
        if (injury) {
            player.injury = injury;
            player.isTitular = false;
            injuries.push({ player: player.name, ...injury });
        }
    });
    return injuries;
}
