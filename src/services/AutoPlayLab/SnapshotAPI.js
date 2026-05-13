/**
 * SnapshotAPI — AutoPlayLab F1
 *
 * Captura state coerente do engine como JSON portátil. Headless.
 */

export function captureSnapshot(engine) {
    if (!engine) return null;
    const stats = engine.managerStats || {};
    const team = engine.getTeam?.(engine.manager?.teamId);
    let finalPosition = 0;
    try {
        if (team && typeof engine.getStandings === 'function') {
            const standings = engine.getStandings(team.zone, team.division);
            const row = standings.findIndex(s => s.teamId === team.id);
            if (row >= 0) finalPosition = row + 1;
        }
    } catch { /* defensive */ }

    return {
        // Identity
        seasonNumber: engine.seasonNumber || 1,
        currentWeek: engine.currentWeek || 0,
        managerName: engine.manager?.name || '',
        teamId: engine.manager?.teamId || 0,
        teamName: team?.name || '',

        // Manager stats
        wins: stats.wins || 0,
        draws: stats.draws || 0,
        losses: stats.losses || 0,
        streak: stats.streak || 0,
        lossStreak: stats.lossStreak || 0,
        goalsFor: stats.goalsFor || 0,
        goalsAgainst: stats.goalsAgainst || 0,
        rollingForm: [...(stats.rollingForm || [])],

        // Finance
        balance: engine.manager?.money || team?.balance || 0,

        // Position
        finalPosition,

        // Star Player
        starPlayerId: engine.starPlayerId || null,

        // Chronicles + Pending
        chroniclesCount: (engine.chronicles || []).length,
        hasPendingChronicle: !!engine.pendingChronicleSeason,
        hasPendingSeasonalEvent: !!engine.pendingSeasonalEvent,

        // Squad summary
        squadSize: team?.squad?.length || 0,
        injuredCount: (team?.squad || []).filter(p => p.injury).length,
        avgOvr: team?.squad?.length
            ? Math.round((team.squad.reduce((s, p) => s + (p.ovr || 0), 0) / team.squad.length))
            : 0,

        // Trophies
        titlesWon: engine.viewUnlockState?.titlesWon || 0,

        // Board
        boardTension: engine.boardTension || 50,

        // Rivalries
        rivalryCount: Object.keys(engine.rivalryHistory || {}).length,

        // Performance proxy
        weekEventsCount: (engine.weekEvents || []).length,
    };
}

/**
 * Captura streak max overall durante simulação (helper auxiliar).
 */
export function trackStreaks(engine) {
    const stats = engine.managerStats || {};
    return {
        currentWinStreak: stats.streak || 0,
        currentLossStreak: stats.lossStreak || 0,
        formWindow: [...(stats.rollingForm || [])],
    };
}
