/**
 * §14.2 Challenge Modes — Pre-set constrained scenarios
 *
 * Each mode applies constraints to initGame that force new strategies.
 * Modes are unlockable via MetaProgression.
 */

export const CHALLENGE_MODES = {
    giant_killer: {
        id: 'giant_killer',
        name: 'Gigante Killer',
        emoji: '🐜',
        description: 'Vença a liga com o time de menor orçamento',
        constraint: 'Orçamento reduzido a 10%',
        bartle: 'achiever',
        octalysis: [2, 6], // Accomplishment + Scarcity
        applyConstraints: (engine) => {
            const team = engine.getTeam(engine.manager?.teamId);
            if (team) {
                team.balance = Math.floor(team.balance * 0.1);
                team.squad.forEach(p => { p.ovr = Math.max(30, p.ovr - 15); });
            }
        },
        winCondition: (engine) => {
            const standings = engine.getStandings(
                engine.getTeam(engine.manager?.teamId)?.zone,
                engine.getTeam(engine.manager?.teamId)?.division
            );
            return standings?.[0]?.teamId === engine.manager?.teamId;
        },
    },
    youth_only: {
        id: 'youth_only',
        name: 'Prata da Casa',
        emoji: '🌱',
        description: 'Apenas jogadores da base — zero transferências',
        constraint: 'Transferências bloqueadas',
        bartle: 'explorer',
        octalysis: [3, 6], // Empowerment + Scarcity
        applyConstraints: (engine) => {
            engine._challengeBlockTransfers = true;
        },
        winCondition: (engine) => {
            const standings = engine.getStandings(
                engine.getTeam(engine.manager?.teamId)?.zone,
                engine.getTeam(engine.manager?.teamId)?.division
            );
            const pos = standings?.findIndex(s => s.teamId === engine.manager?.teamId);
            return pos !== undefined && pos <= 3;
        },
    },
    firefighter: {
        id: 'firefighter',
        name: 'Bombeiro',
        emoji: '🧯',
        description: 'Assuma na semana 20 — salve do rebaixamento',
        constraint: 'Começa na zona de rebaixamento',
        bartle: 'achiever',
        octalysis: [2, 8], // Accomplishment + Loss Avoidance
        applyConstraints: (engine) => {
            engine.currentWeek = 20;
            const team = engine.getTeam(engine.manager?.teamId);
            if (team) {
                team.balance = Math.floor(team.balance * 0.3);
                team.squad.forEach(p => { p.moral = Math.max(10, (p.moral || 50) - 30); });
            }
        },
        winCondition: (engine) => {
            const team = engine.getTeam(engine.manager?.teamId);
            const standings = engine.getStandings(team?.zone, team?.division);
            const pos = standings?.findIndex(s => s.teamId === engine.manager?.teamId);
            const total = standings?.length || 20;
            return pos !== undefined && pos < total - 4; // survive relegation
        },
    },
    invincible: {
        id: 'invincible',
        name: 'Invencível',
        emoji: '🛡️',
        description: 'Termine a temporada sem nenhuma derrota',
        constraint: 'Nenhuma derrota permitida',
        bartle: 'achiever',
        octalysis: [2, 8], // Accomplishment + Loss Avoidance
        applyConstraints: () => {},
        winCondition: (engine) => {
            const stats = engine.managerStats || {};
            return (stats.losses || 0) === 0 && (stats.wins || 0) > 0;
        },
    },
    moneyball: {
        id: 'moneyball',
        name: 'Moneyball',
        emoji: '💰',
        description: 'Vença gastando o mínimo possível',
        constraint: 'Pontuação por eficiência financeira',
        bartle: 'explorer',
        octalysis: [3, 6], // Empowerment + Scarcity
        applyConstraints: (engine) => {
            engine._moneyballStartBalance = engine.getTeam(engine.manager?.teamId)?.balance || 0;
        },
        winCondition: (engine) => {
            const standings = engine.getStandings(
                engine.getTeam(engine.manager?.teamId)?.zone,
                engine.getTeam(engine.manager?.teamId)?.division
            );
            return standings?.[0]?.teamId === engine.manager?.teamId;
        },
    },
    one_club_man: {
        id: 'one_club_man',
        name: 'Um Clube Só',
        emoji: '❤️',
        description: 'Construa uma dinastia — 10 temporadas no mesmo clube',
        constraint: 'Nunca aceite proposta de outro clube',
        bartle: 'achiever',
        octalysis: [1, 4], // Epic Meaning + Ownership
        applyConstraints: () => {},
        winCondition: (engine) => {
            return (engine.seasonNumber || 1) >= 10;
        },
    },
};

/**
 * Apply challenge mode constraints to engine after initGame.
 */
export function applyChallengeMode(engine, modeId) {
    const mode = CHALLENGE_MODES[modeId];
    if (!mode) return false;
    engine._activeChallengeMode = mode;
    mode.applyConstraints(engine);
    return true;
}

/**
 * Check if challenge win condition is met.
 */
export function checkChallengeWin(engine) {
    if (!engine._activeChallengeMode) return null;
    const won = engine._activeChallengeMode.winCondition(engine);
    return won ? engine._activeChallengeMode : null;
}

export function getAllChallengeModes() {
    return Object.values(CHALLENGE_MODES);
}
