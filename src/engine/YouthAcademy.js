/**
 * YouthAcademy.js — Base de formação + Empréstimos
 * Inspirado em FM (intake anual, personalidade do HoYD) + Elifoot (simplicidade)
 */

import { Data } from './data';

import { rng as systemRng } from './rng.js';

// NPC: Coordenador da Base
export const YOUTH_COORDINATOR = { name: "Roberto Menezes", role: "Coord. da Base", emoji: "🎓" };

const YOUTH_PERSONALITIES = ["Profissional", "Ambicioso", "Casual", "Determinado", "Preguiçoso"];

/**
 * Gera intake anual de jovens. Qualidade depende do nível da base e reputação.
 * @param {number} academyLevel - 1 a 5
 * @param {number} clubReputation - 1 a 100
 * @returns {object[]} array de jovens
 */
export function generateYouthIntake(academyLevel = 1, clubReputation = 50) {
    const count = 1 + Math.floor(systemRng() * academyLevel); // 1 a academyLevel jovens
    const youngsters = [];

    for (let i = 0; i < count; i++) {
        const positions = ['GOL', 'DEF', 'MEI', 'ATA'];
        const pos = positions[Math.floor(systemRng() * positions.length)];

        // Tier baseado no nível da base
        const qualityRoll = systemRng() * (academyLevel + clubReputation / 25);
        const tier = qualityRoll > 4 ? 1 : qualityRoll > 2.5 ? 2 : 3;

        const player = Data.generatePlayer(pos, tier);

        // Sobrescrever dados para jovem
        player.age = 15 + Math.floor(systemRng() * 3); // 15-17
        player.ovr = Math.max(35, player.ovr - 15 - Math.floor(systemRng() * 10));
        player.potential = player.ovr + 10 + Math.floor(systemRng() * 25); // potencial escondido
        player.personality = YOUTH_PERSONALITIES[Math.floor(systemRng() * YOUTH_PERSONALITIES.length)];
        player.isYouth = true;
        player.energy = 100;
        player.moral = 70;
        player.isTitular = false;
        player.injury = null;
        player.contract = { weeksLeft: 76, salary: 2000 }; // 2 temporadas
        player.value = 500000 + Math.floor(systemRng() * 2000000);

        // Ajustar atributos para jovem (mais baixos)
        ['attacking', 'technical', 'tactical', 'defending', 'creativity'].forEach(attr => {
            if (player[attr] !== undefined) {
                player[attr] = Math.max(20, player[attr] - 10 + Math.floor(systemRng() * 5));
            }
        });

        youngsters.push(player);
    }

    return youngsters;
}

/**
 * Custo de upgrade da academia.
 */
export function getAcademyUpgradeCost(currentLevel) {
    const costs = [0, 5000000, 15000000, 40000000, 100000000];
    return costs[currentLevel] || 999999999;
}

// ============================================================
// SISTEMA DE EMPRÉSTIMOS
// ============================================================

/**
 * Empresta um jogador. Ele sai do squad por N semanas e volta com atributos modificados.
 * @param {object} team - time
 * @param {number} playerId - id do jogador
 * @param {number} weeks - duração
 * @returns {object} loan record
 */
export function loanPlayerOut(team, playerId, weeks = 20) {
    const player = team.squad.find(p => p.id === playerId);
    if (!player) return { success: false, msg: "Jogador não encontrado." };
    if (player.isTitular) return { success: false, msg: "Não pode emprestar titular." };
    if (player.injury) return { success: false, msg: "Não pode emprestar jogador lesionado." };

    // Remove do squad e salva no loanedOut
    team.squad = team.squad.filter(p => p.id !== playerId);

    const loanRecord = {
        player: { ...player },
        playerId: player.id,
        playerName: player.name,
        weeksLeft: weeks,
        totalWeeks: weeks,
        destination: getRandomLoanDest(),
    };

    return { success: true, msg: `${player.name} emprestado para ${loanRecord.destination} por ${weeks} semanas.`, loan: loanRecord };
}

/**
 * Processa empréstimos a cada semana. Quando acaba, jogador volta melhorado (ou não).
 * @param {object[]} loans - array de loanRecords
 * @param {object} team - time do manager
 * @returns {object[]} jogadores que voltaram
 */
export function processLoans(loans, team) {
    const returning = [];

    loans.forEach(loan => {
        loan.weeksLeft--;
        if (loan.weeksLeft <= 0) {
            const player = loan.player;

            // Desenvolvimento: jovens melhoram mais
            const isYoung = player.age < 21;
            const growthChance = isYoung ? 0.7 : 0.3;

            if (systemRng() < growthChance) {
                // Sucesso: atributos melhoram +1 a +3
                const boost = 1 + Math.floor(systemRng() * 3);
                ['attacking', 'technical', 'tactical', 'defending', 'creativity'].forEach(attr => {
                    if (player[attr] !== undefined) {
                        player[attr] = Math.min(99, player[attr] + Math.floor(systemRng() * (boost + 1)));
                    }
                });
                // BUG-FIX: recalculate OVR from attributes (position-weighted) instead of naive += boost
                const oldOvr = player.ovr;
                const a = player;
                switch (player.position) {
                    case "GOL": player.ovr = Math.floor((a.defending * 0.4) + (a.tactical * 0.3) + (a.technical * 0.3)); break;
                    case "DEF": player.ovr = Math.floor((a.defending * 0.6) + (a.tactical * 0.25) + (a.technical * 0.15)); break;
                    case "MEI": player.ovr = Math.floor((a.creativity * 0.5) + (a.tactical * 0.2) + (a.attacking * 0.15) + (a.defending * 0.15)); break;
                    case "ATA": player.ovr = Math.floor((a.attacking * 0.5) + (a.technical * 0.25) + (a.creativity * 0.25)); break;
                    default: player.ovr = Math.floor((a.attacking + a.defending + a.creativity + a.technical + a.tactical) / 5);
                }
                const actualBoost = player.ovr - oldOvr;
                player.loanResult = `✅ ${player.name} voltou de ${loan.destination} melhorado (+${Math.max(0, actualBoost)} OVR)!`;
            } else {
                // Fracasso: atributos FIS -1, moral baixa
                if (player.tactical) player.tactical = Math.max(20, player.tactical - 1);
                const a = player;
                switch (player.position) {
                    case "GOL": player.ovr = Math.floor((a.defending * 0.4) + (a.tactical * 0.3) + (a.technical * 0.3)); break;
                    case "DEF": player.ovr = Math.floor((a.defending * 0.6) + (a.tactical * 0.25) + (a.technical * 0.15)); break;
                    case "MEI": player.ovr = Math.floor((a.creativity * 0.5) + (a.tactical * 0.2) + (a.attacking * 0.15) + (a.defending * 0.15)); break;
                    case "ATA": player.ovr = Math.floor((a.attacking * 0.5) + (a.technical * 0.25) + (a.creativity * 0.25)); break;
                    default: player.ovr = Math.floor((a.attacking + a.defending + a.creativity + a.technical + a.tactical) / 5);
                }
                player.moral = Math.max(20, (player.moral || 50) - 10);
                player.loanResult = `⚠️ ${player.name} voltou de ${loan.destination} sem evolução.`;
            }

            player.energy = 80;
            player.isTitular = false;
            team.squad.push(player);
            returning.push(player);
        }
    });

    return returning;
}

function getRandomLoanDest() {
    const dests = [
        "Ponte Preta", "Guarani", "Chapecoense", "Avaí", "CRB",
        "Vila Nova", "Tombense", "Operário", "Brusque", "Novorizontino",
        "Londrina", "ABC", "Sampaio Corrêa", "CSA", "Juventude",
    ];
    return dests[Math.floor(systemRng() * dests.length)];
}
