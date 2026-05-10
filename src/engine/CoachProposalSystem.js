import { rng as systemRng } from './rng.js';
/**
 * CoachProposalSystem — SPEC-073: Propostas Orgânicas de Clubes
 *
 * Gera propostas de outros clubes para contratar o técnico.
 * Baseado em reputação + forma recente + objetivo cumprido.
 *
 * Stateless: recebe contexto, retorna proposta + efeitos de decisão.
 */

const TIER_ORDER = { small: 0, mid: 1, big: 2 };

/**
 * Avalia se uma proposta de clube deve aparecer.
 *
 * @param {object} opts
 * @param {number} [opts.managerId]
 * @param {number} [opts.currentClubId]
 * @param {'big'|'mid'|'small'} [opts.currentClubTier='mid']
 * @param {number} [opts.currentContractWeeksLeft=20]
 * @param {number} [opts.managerReputation=10]
 * @param {Array<'W'|'D'|'L'>} [opts.recentForm=[]]
 * @param {boolean} [opts.currentObjectiveMet=false]
 * @param {number} [opts.week=1]
 * @param {number} [opts.season=1]
 * @param {Array<{id,name,tier}>} [opts.availableClubs=[]]
 * @returns {{ proposalAvailable, proposal?, decisionRequired }}
 */
export function evaluate({ managerId = 0, currentClubId = 0, currentClubTier = 'mid', currentContractWeeksLeft = 20, managerReputation = 10, recentForm = [], currentObjectiveMet = false, week = 1, season = 1, availableClubs = [] } = {}) {
    // Proposals only appear after week 5 and mid-season or near end
    if (week < 5) return { proposalAvailable: false, decisionRequired: false };

    const recentWins = recentForm.slice(0, 4).filter(r => r === 'W').length;

    // Conditions
    const formBonus = recentWins >= 3;
    const highRep = managerReputation >= 70 && currentObjectiveMet;
    const midRep = managerReputation >= 50 && formBonus;

    if (!formBonus && !highRep && !midRep) {
        return { proposalAvailable: false, decisionRequired: false };
    }

    // Determine what tier club would offer
    let targetTier;
    if (highRep) {
        targetTier = 'big';
    } else if (midRep) {
        targetTier = TIER_ORDER[currentClubTier] >= 1 ? 'big' : 'mid';
    } else {
        targetTier = currentClubTier;
    }

    // Filter available clubs (tier ≥ current, not current club)
    const candidates = availableClubs.filter(c => c.id !== currentClubId && TIER_ORDER[c.tier] >= TIER_ORDER[currentClubTier]);
    const fromClub = candidates.length > 0
        ? candidates[Math.floor(systemRng() * candidates.length)]
        : { id: -1, name: 'Clube Rival', tier: targetTier };

    const reputationBoost = targetTier === 'big' ? 12 : targetTier === 'mid' ? 7 : 4;
    const exitFee = currentContractWeeksLeft > 10 ? 500_000 : 0;

    const proposal = {
        proposalId: `prop-${managerId}-${week}-${season}`,
        fromClubId: fromClub.id,
        fromClubName: fromClub.name,
        fromClubTier: fromClub.tier || targetTier,
        contractObjective: targetTier === 'big' ? 'title' : targetTier === 'mid' ? 'top_4' : 'avoid_relegation',
        reputationBoost,
        exitFee,
        deadline: week + 3,
        reason: highRep ? 'Impressionados com sua campanha e reputação.' : 'Sua forma recente chamou atenção.',
    };

    return { proposalAvailable: true, proposal, decisionRequired: false };
}

/**
 * Processa decisão do manager sobre uma proposta.
 *
 * @param {object} opts
 * @param {'accept'|'wait_contract_end'|'refuse'} opts.decision
 * @param {number} [opts.exitFee=0]
 * @param {number} [opts.reputationBoost=8]
 * @param {number} [opts.currentContractWeeksLeft=20]
 * @returns {{ reputationDelta, moralImpact, exitFeeCharged, consequence }}
 */
export function decide({ decision, exitFee = 0, reputationBoost = 8, currentContractWeeksLeft = 20 } = {}) {
    if (decision === 'accept') {
        const exitFeeCharged = currentContractWeeksLeft > 10 ? exitFee : 0;
        return {
            reputationDelta: reputationBoost,
            moralImpact: -10, // squad unhappy with mid-season departure
            exitFeeCharged,
            consequence: 'club_change',
        };
    }

    if (decision === 'wait_contract_end') {
        return {
            reputationDelta: +3, // honoring contract = rep boost
            moralImpact: 0,
            exitFeeCharged: 0,
            consequence: 'wait',
        };
    }

    // refuse
    return {
        reputationDelta: 0,
        moralImpact: 0,
        exitFeeCharged: 0,
        consequence: 'rival_hires_alternative',
    };
}
