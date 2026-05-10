/**
 * ContractGoalSystem — SPEC-071: Contratos com Metas Explícitas
 *
 * Cada season tem um objetivo explícito. Cumprir → bônus de reputação.
 * Falhar → demissão (com buffer de proteção contratual).
 *
 * Stateless: recebe contexto, retorna contrato ou resolução.
 */

const OBJECTIVES = {
    avoid_relegation: 'Não ser rebaixado',
    top_half:         'Terminar na metade de cima',
    top_4:            'Terminar no top 4',
    title:            'Ser campeão',
    promotion:        'Subir de divisão',
};

/**
 * Gera contrato para novo técnico ou renovação.
 *
 * @param {object} opts
 * @param {number} [opts.managerId]
 * @param {number} [opts.clubId]
 * @param {'big'|'mid'|'small'} [opts.clubTier='mid']
 * @param {number} [opts.managerReputation=10] — 0-100
 * @param {'new_hire'|'renewal'} [opts.contractType='new_hire']
 * @param {boolean} [opts.clubInCrisis=false]
 * @param {number} [opts.clubDivision=1] — 1=top, 2=second, etc.
 * @returns {object} contrato gerado
 */
export function generate({ managerId = 0, clubId = 0, clubTier = 'mid', managerReputation = 10, contractType = 'new_hire', clubInCrisis = false, clubDivision = 1 } = {}) {
    const objective = pickObjective({ clubTier, managerReputation, clubInCrisis, clubDivision });
    const objectiveDescription = OBJECTIVES[objective] || objective;
    const minWeeks = 10; // proteção contratual: não pode ser demitido nas primeiras 10 semanas

    const bonusReputation  = clamp(5 + Math.round(difficultyOf(objective) * 10), 5, 15);
    const penaltyReputation = clamp(5 + Math.round(difficultyOf(objective) * 15), 5, 20);
    const expiresAfterSeasons = contractType === 'renewal' ? Math.min(3, 2) : 1;

    return {
        contractId: `c-${managerId}-${clubId}-${Date.now()}`,
        managerId,
        clubId,
        objective,
        objectiveDescription,
        minWeeks,
        bonusReputation,
        penaltyReputation,
        expiresAfterSeasons,
    };
}

/**
 * Resolve contrato ao fim da season.
 *
 * @param {object} opts
 * @param {string} opts.contractId
 * @param {boolean} opts.objectiveMet
 * @param {number} opts.weeksManaged
 * @param {number} [opts.minWeeks=10]
 * @param {number} [opts.managerReputation=10]
 * @param {number} [opts.bonusReputation=8]
 * @param {number} [opts.penaltyReputation=10]
 * @returns {object} resultado + consequence
 */
export function resolve({ contractId, objectiveMet, weeksManaged = 38, minWeeks = 10, managerReputation = 10, bonusReputation = 8, penaltyReputation = 10 } = {}) {
    // Buffer protection: can't be fired if within minWeeks
    const inBuffer = weeksManaged < minWeeks;

    if (objectiveMet) {
        // Fulfilled: reputation bonus + possible bigger club interest
        const biggerClubChance = managerReputation >= 70 ? 0.35 : 0.10;
        const consequence = Math.random() < biggerClubChance ? 'bigger_club_interested' : 'renewal_offered';
        return {
            contractId,
            outcome: 'fulfilled',
            reputationDelta: +bonusReputation,
            consequence,
        };
    }

    // Failed
    if (inBuffer) {
        return {
            contractId,
            outcome: 'failed',
            reputationDelta: 0, // no penalty while in buffer
            consequence: 'nothing', // board complains but can't fire yet
        };
    }

    return {
        contractId,
        outcome: 'failed',
        reputationDelta: -penaltyReputation,
        consequence: 'fired',
    };
}

// ─── helpers ────────────────────────────────────────────────

function pickObjective({ clubTier, managerReputation, clubInCrisis, clubDivision }) {
    if (clubInCrisis) return 'avoid_relegation';

    if (clubTier === 'small') {
        if (managerReputation < 40) return 'avoid_relegation';
        if (clubDivision > 1) return 'promotion';
        return 'top_half';
    }

    if (clubTier === 'mid') {
        if (clubInCrisis || managerReputation < 30) return 'avoid_relegation';
        return 'top_4';
    }

    // big club
    if (managerReputation >= 60) return 'title';
    return 'top_4';
}

function difficultyOf(objective) {
    const map = { avoid_relegation: 0.2, top_half: 0.4, top_4: 0.6, promotion: 0.7, title: 1.0 };
    return map[objective] ?? 0.5;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}
