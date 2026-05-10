import { rng as systemRng } from '../../engine/rng.js';

/**
 * MARL Personalities (Fase 1)
 * Define os arquétipos ("DNA") para cada bot ou cérebro no jogo.
 */

export const ARCHETYPES = {
    GUARDIOLA: {
        id: 'GUARDIOLA',
        ambition: 0.9,      // Foco altíssimo em títulos e escalar a tabela
        temperament: 0.9,   // Calmo, altíssima resistência a tilt e rage-quits
        loyalty: 0.6,       // Lealdade moderada (vende se necessário, mas mantém base)
        riskAversion: 0.7,  // Cuidadoso com finanças, não faz loucuras
        tacticalBias: 'possession'
    },
    MERCENARY: {
        id: 'MERCENARY',
        ambition: 0.8,      // Alta ambição financeira e de posição
        temperament: 0.6,   // Normal, tilta às vezes
        loyalty: 0.0,       // Nenhuma lealdade, vende ídolos por lucro imediato
        riskAversion: 0.3,  // Gosta de arriscar no mercado (comprar barato/vender caro)
        tacticalBias: 'attacking'
    },
    DESPERATE: {
        id: 'DESPERATE',
        ambition: 0.4,      // Só quer não cair
        temperament: 0.1,   // Tilta muito fácil, entra em pânico com 2 derrotas
        loyalty: 0.8,       // Se apega a jogadores velhos por segurança
        riskAversion: 0.1,  // Pânico: gasta tudo o que não tem em transferências ruins
        tacticalBias: 'defensive'
    },
    BALANCED: {
        id: 'BALANCED',
        ambition: 0.5,
        temperament: 0.5,
        loyalty: 0.5,
        riskAversion: 0.5,
        tacticalBias: 'normal'
    }
};

export function generateRandomPersonality(rng = systemRng) {
    const keys = Object.keys(ARCHETYPES);
    return ARCHETYPES[keys[Math.floor(rng() * keys.length)]];
}

/**
 * Calcula se a IA entrou em colapso mental (Tilt) baseado na sua série de derrotas.
 */
export function checkIsTilted(personality, lossStreak) {
    if (lossStreak <= 0) return false;
    
    // O stress aumenta conforme as derrotas.
    // Ex: 3 derrotas = 0.3 stress.
    const stress = lossStreak * 0.15;
    
    // Se o temperamento (0 a 1) menos o stress ficar muito baixo, a IA "tilta".
    return (personality.temperament - stress) < 0.2;
}
