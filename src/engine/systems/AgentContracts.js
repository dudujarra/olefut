/**
 * AgentContracts — SPEC-064
 *
 * Agents + complex contracts: signing bonus, image rights, performance bonus, release clause.
 */

export const AGENT_PERSONALITIES = {
    greedy: { name: 'Ganancioso', emoji: '💸', wageMult: 1.4, signingBonusMult: 2.0, dealHardness: 0.9 },
    loyal: { name: 'Leal', emoji: '🤝', wageMult: 1.0, signingBonusMult: 0.5, dealHardness: 0.4 },
    aggressive: { name: 'Agressivo', emoji: '⚔️', wageMult: 1.3, signingBonusMult: 1.5, dealHardness: 1.0 },
    pragmatic: { name: 'Pragmático', emoji: '🎯', wageMult: 1.1, signingBonusMult: 1.0, dealHardness: 0.6 }
};

export function generateAgent() {
    const personalities = Object.keys(AGENT_PERSONALITIES);
    const personality = personalities[Math.floor(Math.random() * personalities.length)];
    const firstNames = ['Patrícia', 'Fernando', 'Cláudia', 'Roberto', 'Marina', 'Eduardo'];
    const lastNames = ['Lemos', 'Andrade', 'Pereira', 'Costa', 'Silva', 'Mendes'];
    const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
    return {
        id: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: `${fname} ${lname}`,
        personality,
        ...AGENT_PERSONALITIES[personality],
        cut: 0.10 + Math.random() * 0.05 // 10-15% cut
    };
}

/**
 * Build complex contract with all clauses.
 */
export function buildContract({
    weeklyWage,
    duration = 104,         // 2 years default
    signingBonus = 0,
    imageRightsPercent = 0, // 0-30% image revenue
    releaseClauseAmount = 0,
    loyaltyBonus = 0,
    performanceBonus = {    // bonus per achievement
        goalsThreshold: 10,
        goalsBonus: 50000,
        appearancesThreshold: 25,
        appearancesBonus: 30000,
        titleBonus: 200000
    },
    agent = null
}) {
    return {
        weeklyWage,
        duration,
        weeksRemaining: duration,
        signingBonus,
        signingBonusPaid: false,
        imageRightsPercent,
        releaseClauseAmount,
        loyaltyBonus,
        loyaltyBonusPaid: false,
        performanceBonus,
        seasonGoals: 0,
        seasonAppearances: 0,
        agent,
        agentCut: agent ? agent.cut : 0,
        signed: false
    };
}

/**
 * Negotiate contract: agent counter-offers based on personality.
 */
export function negotiateContract(playerValue, baseWageOffer, agent) {
    if (!agent) return { wage: baseWageOffer, signingBonus: 0, releaseClause: 0 };
    const wageRequest = Math.round(baseWageOffer * agent.wageMult);
    const signingBonus = Math.round(playerValue * 0.05 * agent.signingBonusMult);
    const releaseClause = Math.round(playerValue * 1.5 * agent.dealHardness);
    return {
        wage: wageRequest,
        signingBonus,
        releaseClause,
        agentCut: agent.cut
    };
}

/**
 * Apply weekly contract maintenance.
 */
export function processContractWeek(contract, player, team) {
    if (!contract || !contract.signed) return { totalCost: 0 };
    let totalCost = contract.weeklyWage;

    // Pay signing bonus first week
    if (!contract.signingBonusPaid) {
        totalCost += contract.signingBonus;
        if (contract.agentCut) {
            totalCost += Math.round(contract.signingBonus * contract.agentCut);
        }
        contract.signingBonusPaid = true;
    }

    // Performance bonuses (end of season)
    contract.weeksRemaining--;

    return { totalCost };
}
