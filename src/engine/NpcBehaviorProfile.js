/**
 * SPEC-137: NPC Behavior Profiles — 4 levels de dificuldade.
 *
 * PLAYER MODE ONLY (today) — see SPEC-179
 * Decision A (Promote parcial). Currently consumed by NpcTacticAdvisor for AI
 * tactic pivots; named NPCs aparecem nos decks de Player Career.
 * Future plan: surface NPC names + behavior labels in Manager Mode dialogs
 * (TransferOffer rival manager, PressConference). High ROI — names already exist.
 *
 * Perfis extraídos diretamente de dados de deep soak (5 runs, 104-216 temporadas):
 *   Level 1 (Noob)     — run-1 (1778458660022): defensiva, crashes, DREAD alto
 *   Level 2 (Amador)   — run-2 (1778459078831): ofensiva rígida, instável
 *   Level 3 (Veterano) — run-4 (1778460065428): counter-lock, robusto, monótono
 *   Level 4 (Expert)   — run-5 (1778460495249): ofensiva adaptativa, squad proativo
 */

export const NPC_PROFILES = {
    1: {
        name: 'Noob',
        tacticPreference: 'defensive',
        tacticFlexibility: 0.10,    // 10% chance de mudar tática por semana
        squadReplenishThreshold: 8, // reabastece só se elenco < 8
        dreadThreshold: 5,          // DREAD após 5 derrotas seguidas
        marketActivity: 0.10,       // baixa atividade de mercado
        decisionErrorRate: 0.15,    // 15% decisões subótimas
    },
    2: {
        name: 'Amador',
        tacticPreference: 'offensive',
        tacticFlexibility: 0.15,
        squadReplenishThreshold: 10,
        dreadThreshold: 4,
        marketActivity: 0.20,
        decisionErrorRate: 0.10,
    },
    3: {
        name: 'Veterano',
        tacticPreference: 'counter',
        tacticFlexibility: 0.08,    // muda pouco — replica counter-lock run-4
        squadReplenishThreshold: 12,
        dreadThreshold: 7,          // quase nunca entra em pânico
        marketActivity: 0.30,
        decisionErrorRate: 0.05,
    },
    4: {
        name: 'Expert',
        tacticPreference: 'offensive',
        tacticFlexibility: 0.35,    // muda tática proativamente
        squadReplenishThreshold: 15,// elenco sempre cheio
        dreadThreshold: Infinity,   // nunca entra em DREAD
        marketActivity: 0.50,
        decisionErrorRate: 0.02,
    },
};

/**
 * Retorna profile de NPC para o level dado.
 * @param {1|2|3|4} level
 * @returns {object} profile
 */
export function getNpcProfile(level) {
    return NPC_PROFILES[level] ?? NPC_PROFILES[2];
}
