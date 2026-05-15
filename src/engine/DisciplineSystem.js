export function processMatchCards(cards, team) {
    if (!team || !team.squad || !cards) return;

    cards.forEach(cardEvt => {
        // Filter cards that belong to this team
        if (cardEvt.team === team.name) {
            const p = team.squad.find(player => player.name === cardEvt.player);
            if (p) {
                if (cardEvt.type === 'yellow') {
                    p.seasonYellows = (p.seasonYellows || 0) + 1;
                    // Suspend for 1 match after 3 yellow cards
                    if (p.seasonYellows === 3) {
                        p.suspension = (p.suspension || 0) + 1;
                        p.seasonYellows = 0; // Reset count
                        p.isTitular = false; // Remove from starting XI
                        if (p.setFlag) p.setFlag('suspended', true); // Integration with PlayerCareer
                    }
                } else if (cardEvt.type === 'red') {
                    // Suspend for 1 match (direct red)
                    p.suspension = (p.suspension || 0) + 1;
                    p.isTitular = false; // Remove from starting XI
                    if (p.setFlag) p.setFlag('suspended', true);
                }
            }
        }
    });
}

export function decrementSuspensions(team) {
    if (!team || !team.squad) return;

    team.squad.forEach(p => {
        if (p.suspension > 0) {
            p.suspension -= 1;
            if (p.suspension <= 0) {
                delete p.suspension;
                if (p.clearFlag) p.clearFlag('suspended');
            }
        }
    });
}
