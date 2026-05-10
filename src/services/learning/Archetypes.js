import { rng as systemRng } from '../../engine/rng.js';

/**
 * MARL Personalities — Fase 1 (Completa)
 *
 * Define o "DNA psicológico" de cada treinador-bot no Elifoot.
 *
 * Modelo OCEAN (Big Five) adaptado:
 *   O — openness:         0-1  Abertura a novas táticas/formações
 *   C — conscientiousness: 0-1  Disciplina financeira e planejamento
 *   E — extraversion:      0-1  Agressividade tática e de mercado
 *   A — agreeableness:     0-1  Lealdade a jogadores e obediência à diretoria
 *   N — neuroticism:       0-1  Suscetibilidade a tilt/pânico (INVERSO de temperament)
 *
 * Traços derivados (calculados a partir do OCEAN):
 *   ambition      = (E + (1 - A)) / 2   — foco em títulos a qualquer custo
 *   riskAppetite  = (O + E - C) / 2     — disposição pra gastar tudo
 *   loyalty       = A                    — apego a ídolos
 *   temperament   = 1 - N               — resistência ao tilt
 *   tacticalFlex  = O                    — variedade tática
 */

// ─── 8 ARQUÉTIPOS PRÉ-DEFINIDOS ──────────────────────────────

export const ARCHETYPES = {
    GUARDIOLA: {
        id: 'GUARDIOLA',
        label: 'O Estrategista',
        ocean: { O: 0.9, C: 0.9, E: 0.6, A: 0.5, N: 0.1 },
        tacticalBias: 'possession',
        preferredFormations: ['4-3-3', '4-2-3-1', '3-4-3'],
        description: 'Tático, disciplinado, roda elenco, finanças equilibradas'
    },
    MERCENARY: {
        id: 'MERCENARY',
        label: 'O Mercenário',
        ocean: { O: 0.7, C: 0.4, E: 0.9, A: 0.0, N: 0.4 },
        tacticalBias: 'attacking',
        preferredFormations: ['4-3-3', '4-4-2'],
        description: 'Compra barato, vende caro, zero lealdade'
    },
    DESPERATE: {
        id: 'DESPERATE',
        label: 'O Desesperado',
        ocean: { O: 0.2, C: 0.2, E: 0.5, A: 0.7, N: 0.9 },
        tacticalBias: 'defensive',
        preferredFormations: ['5-4-1', '4-4-2'],
        description: 'Pânico fácil, curto-prazista, se apega a veteranos'
    },
    BALANCED: {
        id: 'BALANCED',
        label: 'O Equilibrado',
        ocean: { O: 0.5, C: 0.5, E: 0.5, A: 0.5, N: 0.5 },
        tacticalBias: 'normal',
        preferredFormations: ['4-4-2', '4-3-3'],
        description: 'Previsível, sem extremos, meio de tabela perpétuo'
    },
    GALACTICO: {
        id: 'GALACTICO',
        label: 'O Galáctico',
        ocean: { O: 0.8, C: 0.2, E: 1.0, A: 0.3, N: 0.3 },
        tacticalBias: 'attacking',
        preferredFormations: ['4-3-3', '3-4-3'],
        description: 'Gasta tudo em estrelas, ignora base, quer espetáculo'
    },
    FORMADOR: {
        id: 'FORMADOR',
        label: 'O Formador',
        ocean: { O: 0.6, C: 0.8, E: 0.3, A: 0.9, N: 0.2 },
        tacticalBias: 'normal',
        preferredFormations: ['4-4-2', '4-2-3-1'],
        description: 'Aposta na base, não compra caro, paciência infinita'
    },
    RETRANCEIRO: {
        id: 'RETRANCEIRO',
        label: 'O Retranceiro',
        ocean: { O: 0.1, C: 0.7, E: 0.2, A: 0.6, N: 0.6 },
        tacticalBias: 'defensive',
        preferredFormations: ['5-4-1', '5-3-2', '4-5-1'],
        description: 'Resultado acima de tudo, 0x0 é vitória moral'
    },
    KAMIKAZE: {
        id: 'KAMIKAZE',
        label: 'O Kamikaze',
        ocean: { O: 1.0, C: 0.1, E: 1.0, A: 0.2, N: 0.7 },
        tacticalBias: 'attacking',
        preferredFormations: ['3-4-3', '3-3-4', '4-3-3'],
        description: 'Ataque total, gasta tudo, muda tática toda semana, caótico'
    }
};

// ─── TRAÇOS DERIVADOS ─────────────────────────────────────────

/**
 * Calcula traços derivados a partir do OCEAN bruto.
 * @param {{ O: number, C: number, E: number, A: number, N: number }} ocean
 * @returns {{ ambition, riskAppetite, loyalty, temperament, tacticalFlex }}
 */
export function deriveTraits(ocean) {
    return {
        ambition:      clamp((ocean.E + (1 - ocean.A)) / 2),
        riskAppetite:  clamp((ocean.O + ocean.E - ocean.C) / 2),
        loyalty:       ocean.A,
        temperament:   clamp(1 - ocean.N),
        tacticalFlex:  ocean.O
    };
}

function clamp(v, min = 0, max = 1) {
    return Math.max(min, Math.min(max, v));
}

// ─── GERAÇÃO PROCEDURAL ───────────────────────────────────────

/**
 * Gera personalidade procedural com variação contínua.
 * Usa um arquétipo-base como seed e aplica ruído gaussiano.
 * Resultado: cada bot é ÚNICO, mesmo dois "Guardiolas" são levemente diferentes.
 *
 * @param {string} [archetypeId] — seed. Se null, sorteia.
 * @param {Function} [rng] — gerador de números aleatórios.
 * @returns {{ id, label, ocean, traits, tacticalBias, preferredFormations }}
 */
export function generatePersonality(archetypeId = null, rng = systemRng) {
    const keys = Object.keys(ARCHETYPES);
    const baseId = archetypeId && ARCHETYPES[archetypeId]
        ? archetypeId
        : keys[Math.floor(rng() * keys.length)];

    const base = ARCHETYPES[baseId];

    // Ruído gaussiano leve (Box-Muller)
    const noise = () => {
        const u1 = rng() || 0.001;
        const u2 = rng();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 0.08;
    };

    const ocean = {
        O: clamp(base.ocean.O + noise()),
        C: clamp(base.ocean.C + noise()),
        E: clamp(base.ocean.E + noise()),
        A: clamp(base.ocean.A + noise()),
        N: clamp(base.ocean.N + noise())
    };

    const traits = deriveTraits(ocean);

    return {
        id: baseId,
        label: base.label,
        ocean,
        traits,
        tacticalBias: base.tacticalBias,
        preferredFormations: [...base.preferredFormations]
    };
}

/**
 * Shortcut para gerar uma personalidade aleatória (backwards compat).
 */
export function generateRandomPersonality(rng = systemRng) {
    return generatePersonality(null, rng);
}

// ─── TILT CHECK ───────────────────────────────────────────────

/**
 * Checa se o bot entrou em colapso mental.
 * Usa o temperament derivado do OCEAN.N.
 *
 * @param {Object} personality — resultado de generatePersonality()
 * @param {number} lossStreak — sequência atual de derrotas
 * @returns {boolean}
 */
export function checkIsTilted(personality, lossStreak) {
    if (lossStreak <= 0) return false;
    const temperament = personality?.traits?.temperament
        ?? personality?.temperament
        ?? 0.5;
    const stress = lossStreak * 0.12;
    return (temperament - stress) < 0.15;
}

// ─── CLUB-ARCHETYPE MAPPING ──────────────────────────────────

/**
 * Mapeia perfis ideais para tipos de clube.
 * Usado no newGame() para dar personalidades coerentes.
 *
 * @param {{ budget: number, division: number, reputation: number }} clubProfile
 * @returns {string} archetypeId
 */
export function suggestArchetypeForClub(clubProfile) {
    const { budget = 0, division = 4, reputation = 50 } = clubProfile;

    // Clube grande e rico → Galáctico ou Guardiola
    if (reputation > 80 && budget > 50_000_000) {
        return Math.random() < 0.5 ? 'GALACTICO' : 'GUARDIOLA';
    }
    // Clube médio com boa base → Formador ou Equilibrado
    if (reputation > 50 && division <= 2) {
        return Math.random() < 0.5 ? 'FORMADOR' : 'BALANCED';
    }
    // Clube pequeno na luta contra rebaixamento → Retranceiro ou Desesperado
    if (division >= 3 && budget < 5_000_000) {
        return Math.random() < 0.4 ? 'RETRANCEIRO' : 'DESPERATE';
    }
    // Clube outsider ambicioso → Mercenário ou Kamikaze
    if (budget > 20_000_000 && reputation < 60) {
        return Math.random() < 0.5 ? 'MERCENARY' : 'KAMIKAZE';
    }
    // Fallback
    return 'BALANCED';
}
