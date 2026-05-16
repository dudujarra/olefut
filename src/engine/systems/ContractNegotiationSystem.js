/**
 * Contract Renewal — negociação de renovação
 */
export function generateRenewalOffer(player) {
    const baseSalary = player.salary || 5000;
    const ageFactor = player.age > 30 ? 0.8 : player.age < 22 ? 1.5 : 1.2;
    const formFactor = player.form?.trend === 'hot' ? 1.3 : player.form?.trend === 'cold' ? 0.9 : 1.0;
    const personalityFactor = player.personality === 'Ambicioso' ? 1.4 : player.personality === 'Profissional' ? 1.0 : 1.1;

    // loyalty: 10-20 scale. Loyal players demand less salary, disloyal demand more
    const loyalty = player.loyalty ?? 15;
    const loyaltyFactor = loyalty >= 18 ? 0.9 : loyalty <= 12 ? 1.15 : 1.0;

    const demandedSalary = Math.floor(baseSalary * ageFactor * formFactor * personalityFactor * loyaltyFactor);
    const weeks = player.age > 30 ? 38 : player.age < 22 ? 114 : 76; // 1, 2, or 3 seasons

    // Happiness affects willingness — loyalty lowers the morale threshold
    const moralThreshold = loyalty >= 18 ? 20 : loyalty <= 12 ? 50 : 30;
    const willRenew = (player.moral || 50) > moralThreshold;

    return {
        playerId: player.id,
        playerName: player.name,
        currentSalary: baseSalary,
        demandedSalary,
        weeks,
        willRenew,
        personality: player.personality || 'Normal',
        reason: !willRenew ? `${player.name} está insatisfeito e recusa renovar.` : null,
    };
}

export function acceptRenewal(player, offer) {
    player.contract = { weeksLeft: offer.weeks, salary: offer.demandedSalary };
    player.salary = offer.demandedSalary;
    player.moral = Math.min(100, (player.moral || 50) + 10);
    return { success: true, msg: `${player.name} renovou por ${offer.weeks} semanas (R$ ${(offer.demandedSalary / 1000).toFixed(0)}K/sem)!` };
}
