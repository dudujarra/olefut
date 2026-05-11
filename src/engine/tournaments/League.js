/* eslint-disable no-unused-vars */
import { Tournament } from './Tournament';

export class League extends Tournament {
    constructor(id, name, level) {
        super(id, name);
        this.level = level;
        this.standings = [];
        this.fixtures = [];
    }

    init(teamIds) {
        super.init(teamIds);
        this.standings = teamIds.map(id => ({
            teamId: id, played: 0, won: 0, drawn: 0, lost: 0,
            goalsFor: 0, goalsAgainst: 0, points: 0
        }));
        this.fixtures = this.generateRoundRobin(teamIds);
    }

    generateRoundRobin(teamIds) {
        const teams = [...teamIds];
        if (teams.length % 2 !== 0) teams.push(null); // bye
        const n = teams.length;
        const rounds = (n - 1) * 2; // ida e volta
        const fixtures = [];
        const fixed = teams[0];
        const rotating = teams.slice(1);

        for (let round = 0; round < rounds; round++) {
            const matches = [];
            const isSecondHalf = round >= (n - 1);
            const r = round % (n - 1);
            const current = [fixed, ...rotating];

            for (let i = 0; i < n / 2; i++) {
                const home = current[i];
                const away = current[n - 1 - i];
                if (home === null || away === null) continue;
                if (isSecondHalf) {
                    matches.push({ home: away, away: home, score: null, played: false });
                } else {
                    matches.push({ home, away, score: null, played: false });
                }
            }
            fixtures.push(matches);
            // Rotate
            rotating.push(rotating.shift());
        }
        return fixtures;
    }

    advanceWeek(engine, week) {
        if (week >= this.fixtures.length) return null;
        const matches = this.fixtures[week];
        if (!matches) return null;

        const results = [];
        matches.forEach(m => {
            if (m.played) return;
            const result = engine.playMatch(m.home, m.away);
            m.score = result;
            m.played = true;
            results.push(m);

            // Update standings
            const homeRow = this.standings.find(s => s.teamId === m.home);
            const awayRow = this.standings.find(s => s.teamId === m.away);
            if (!homeRow || !awayRow) return;

            homeRow.played++; awayRow.played++;
            homeRow.goalsFor += result.homeGoals; homeRow.goalsAgainst += result.awayGoals;
            awayRow.goalsFor += result.awayGoals; awayRow.goalsAgainst += result.homeGoals;

            if (result.homeGoals > result.awayGoals) {
                homeRow.won++; homeRow.points += 3;
                awayRow.lost++;
            } else if (result.homeGoals < result.awayGoals) {
                awayRow.won++; awayRow.points += 3;
                homeRow.lost++;
            } else {
                homeRow.drawn++; homeRow.points += 1;
                awayRow.drawn++; awayRow.points += 1;
            }
        });

        // Sort standings
        this.standings.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor);

        return results.length > 0 ? results : null;
    }
}
