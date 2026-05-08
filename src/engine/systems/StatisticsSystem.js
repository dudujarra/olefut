// SPEC-028: Analytics & Statistics System
// 50+ métricas player + team. Form, ranking, season grade.

export class StatisticsSystem {
    constructor() {
        this.playerStats = new Map(); // `${playerId}_${season}` → stats
        this.teamStats = new Map(); // `${teamId}_${season}` → stats
        this.matchHistory = [];
    }

    _playerKey(playerId, season) {
        return `${playerId}_${season}`;
    }

    _teamKey(teamId, season) {
        return `${teamId}_${season}`;
    }

    _initPlayerStats() {
        return {
            matches: 0,
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            tackleSuccess: 0,
            passCompletion: 0,
            possessionAvg: 0,
            shotsOnTarget: 0,
            dribblesCompleted: 0,
            aerialDuelsWon: 0,
            injuryGamesMissed: 0,
            moraleAvg: 50,
            stressAvg: 0,
            recentResults: [], // array of 'win'/'draw'/'loss' for form
        };
    }

    _initTeamStats() {
        return {
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            possessionAvg: 0,
            cleanSheets: 0,
            unbeatenRun: 0,
            currentUnbeaten: 0,
            recentResults: [],
            topScorerId: null,
            topScorerGoals: 0,
        };
    }

    recordMatch({ matchId, season, homeTeamId, awayTeamId, homeGoals, awayGoals, scorers = [], homeScorers = null, awayScorers = null, cards = [] }) {
        // Prefer explicit home/away separation; fallback to old combined scorers (assume home)
        const _homeScorers = homeScorers ?? scorers;
        const _awayScorers = awayScorers ?? [];
        // Team stats
        for (const [teamId, isHome] of [
            [homeTeamId, true],
            [awayTeamId, false],
        ]) {
            const key = this._teamKey(teamId, season);
            const stats = this.teamStats.get(key) || this._initTeamStats();
            const myGoals = isHome ? homeGoals : awayGoals;
            const oppGoals = isHome ? awayGoals : homeGoals;
            stats.goalsFor += myGoals;
            stats.goalsAgainst += oppGoals;
            if (oppGoals === 0) stats.cleanSheets++;
            let result;
            if (myGoals > oppGoals) {
                stats.wins++;
                stats.currentUnbeaten++;
                result = 'win';
            } else if (myGoals === oppGoals) {
                stats.draws++;
                stats.currentUnbeaten++;
                result = 'draw';
            } else {
                stats.losses++;
                stats.unbeatenRun = Math.max(stats.unbeatenRun, stats.currentUnbeaten);
                stats.currentUnbeaten = 0;
                result = 'loss';
            }
            stats.recentResults.push(result);
            if (stats.recentResults.length > 5) stats.recentResults.shift();
            this.teamStats.set(key, stats);
        }

        // Player stats — split por home/away (BUG-007 fix)
        const updateScorer = (playerId, ownerTeam) => {
            const key = this._playerKey(playerId, season);
            const stats = this.playerStats.get(key) || this._initPlayerStats();
            stats.goals++;
            this.playerStats.set(key, stats);
            const teamKey = this._teamKey(ownerTeam, season);
            const tStats = this.teamStats.get(teamKey);
            if (tStats && stats.goals > tStats.topScorerGoals) {
                tStats.topScorerId = playerId;
                tStats.topScorerGoals = stats.goals;
            }
        };
        for (const pid of _homeScorers) updateScorer(pid, homeTeamId);
        for (const pid of _awayScorers) updateScorer(pid, awayTeamId);

        this.matchHistory.push({ matchId, season, homeTeamId, awayTeamId, homeGoals, awayGoals });
    }

    getPlayerStats(playerId, season) {
        const stats = this.playerStats.get(this._playerKey(playerId, season)) || this._initPlayerStats();
        return {
            ...stats,
            form: this._calcForm(stats.recentResults),
        };
    }

    getTeamStats(teamId, season) {
        const stats = this.teamStats.get(this._teamKey(teamId, season)) || this._initTeamStats();
        const totalGames = stats.wins + stats.draws + stats.losses;
        const points = stats.wins * 3 + stats.draws;
        return {
            ...stats,
            totalGames,
            points,
            goalDifference: stats.goalsFor - stats.goalsAgainst,
            form: this._calcForm(stats.recentResults),
            topScorer: { playerId: stats.topScorerId, goals: stats.topScorerGoals },
            seasonGrade: this._calcGrade(points),
            projectedFinish: totalGames > 0 ? Math.floor(points + ((38 - totalGames) * (points / totalGames))) : 0,
        };
    }

    _calcForm(results) {
        if (results.length === 0) return 'Average';
        const score = results.reduce((acc, r) => acc + (r === 'win' ? 2 : r === 'draw' ? 1 : 0), 0);
        const max = results.length * 2;
        const pct = score / max;
        if (pct >= 0.8) return 'Excellent';
        if (pct >= 0.6) return 'Good';
        if (pct >= 0.4) return 'Average';
        if (pct >= 0.2) return 'Poor';
        return 'Terrible';
    }

    _calcGrade(points) {
        if (points >= 90) return 'A+';
        if (points >= 75) return 'A';
        if (points >= 60) return 'B';
        if (points >= 45) return 'C';
        if (points >= 30) return 'D';
        return 'F';
    }

    getComparison(playerId1, playerId2, season) {
        const s1 = this.getPlayerStats(playerId1, season);
        const s2 = this.getPlayerStats(playerId2, season);
        return {
            goals_diff: s1.goals - s2.goals,
            assists_diff: s1.assists - s2.assists,
            matches_diff: s1.matches - s2.matches,
            overall_comparison: s1.goals + s1.assists - (s2.goals + s2.assists),
        };
    }

    archiveSeason(season) {
        // Stats stay (immutable archive)
        return { archived: true, season };
    }
}
