/**
 * TacticSuggester — SPEC-A3
 *
 * Sugere tática pré-jogo via comparação de setores. Pure function.
 * Headless (zero React/DOM). Determinístico.
 */

const TACTICS_ENUM = ['Ofensivo', 'Defensivo', 'Contra-Ataque', 'Posse', 'Pressing', 'Normal'];

/**
 * Calcula sugestão tática baseada em diff de setores.
 *
 * @param {object} opts
 * @param {{goalkeeper, defense, midfield, attack}} opts.ourSectors
 * @param {{goalkeeper, defense, midfield, attack}} opts.oppSectors
 * @param {boolean} [opts.isHome=true]
 * @returns {{ tactic: string, rationale: string }}
 */
export function suggestTactic({ ourSectors = {}, oppSectors = {}, isHome = true } = {}) {
    const ourAtk = ourSectors.attack || 50;
    const ourDef = ourSectors.defense || 50;
    const oppAtk = oppSectors.attack || 50;
    const oppDef = oppSectors.defense || 50;

    const ourOvr = (ourAtk + ourDef + (ourSectors.midfield || 50)) / 3;
    const oppOvr = (oppAtk + oppDef + (oppSectors.midfield || 50)) / 3;

    // Diferenças
    const dOppAtkVsOurDef = oppAtk - ourDef;
    const dOurAtkVsOppDef = ourAtk - oppDef;
    const ovrGap = ourOvr - oppOvr;

    // Caso: ambos fortes (gap pequeno + setores altos) → contra-ataque
    if (oppAtk > 70 && oppDef > 70 && Math.abs(ovrGap) < 5) {
        return {
            tactic: 'Contra-Ataque',
            rationale: 'Adversário forte nos dois lados. Contra-ataque explora brechas.',
        };
    }

    // Caso: oponente bem mais forte no ataque que nossa defesa → defensivo
    if (dOppAtkVsOurDef > 10) {
        return {
            tactic: 'Defensivo',
            rationale: `Ataque adversário ${oppAtk} vs nossa defesa ${ourDef}. Segurar o jogo.`,
        };
    }

    // Caso: nosso ataque bem maior que defesa adversária → ofensivo
    if (dOurAtkVsOppDef > 10) {
        return {
            tactic: 'Ofensivo',
            rationale: `Nosso ataque ${ourAtk} vs defesa adversária ${oppDef}. Pressionar e marcar.`,
        };
    }

    // Caso: somos bem mais fortes (vantagem geral) → pressing
    if (ovrGap > 8 && isHome) {
        return {
            tactic: 'Pressing',
            rationale: 'Em casa com vantagem técnica. Marcação alta sufoca.',
        };
    }

    // Caso: equilibrado (gap pequeno) → normal
    if (Math.abs(ovrGap) < 5) {
        return {
            tactic: 'Normal',
            rationale: 'Times equilibrados. Manter postura padrão.',
        };
    }

    // Default: jogo controlado pela posse
    return {
        tactic: 'Posse',
        rationale: 'Manter a bola e controlar o ritmo do jogo.',
    };
}

export { TACTICS_ENUM };
