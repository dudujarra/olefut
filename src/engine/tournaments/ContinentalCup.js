import { Tournament } from './Tournament';

export class ContinentalCup extends Tournament {
    constructor(id, name, groupScheduleWeeks, knockoutScheduleWeeks) {
        super(id, name);
        this.groupScheduleWeeks = groupScheduleWeeks;
        this.knockoutScheduleWeeks = knockoutScheduleWeeks;
        this.groups = [];
        this.phase = 'GROUPS'; // GROUPS or KNOCKOUT
        this.currentRoundGroup = 0;
        this.knockoutMatches = [];
        this.knockoutPhaseIndex = 0;
    }

    init(teamIds) {
        super.init(teamIds);
        this.groups = this.createGroups(teamIds, 4);
    }

    createGroups(teamIds, teamsPerGroup) {
        const shuffled = [...teamIds].sort(() => 0.5 - Math.random());
        const groups = [];
        const numGroups = Math.ceil(shuffled.length / teamsPerGroup);
        for (let i = 0; i < numGroups; i++) {
            const groupTeams = shuffled.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
            groups.push({
                teams: groupTeams,
                standings: groupTeams.map(id => ({
                    teamId: id, played: 0, won: 0, drawn: 0, lost: 0,
                    goalsFor: 0, goalsAgainst: 0, points: 0
                })),
                fixtures: this.generateGroupFixtures(groupTeams)
            });
        }
        return groups;
    }

    generateGroupFixtures(teams) {
        const rounds = [];
        const n = teams.length;
        // Simple round-robin (single leg for groups)
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                rounds.push({ home: teams[i], away: teams[j], score: null, played: false });
            }
        }
        // Split into rounds of n/2 matches
        const matchesPerRound = Math.floor(n / 2);
        const fixtures = [];
        for (let i = 0; i < rounds.length; i += matchesPerRound) {
            fixtures.push(rounds.slice(i, i + matchesPerRound));
        }
        return fixtures;
    }

    advanceWeek(engine, week) {
        if (this.phase === 'GROUPS') {
            const roundIndex = this.groupScheduleWeeks.indexOf(week);
            if (roundIndex === -1 || roundIndex !== this.currentRoundGroup) return null;

            const allResults = [];
            this.groups.forEach(g => {
                if (this.currentRoundGroup >= g.fixtures.length) return;
                const matches = g.fixtures[this.currentRoundGroup];
                matches.forEach(m => {
                    if (m.played) return;
                    const result = engine.playMatch(m.home, m.away, true);
                    m.score = result;
                    m.played = true;
                    allResults.push(m);

                    const homeRow = g.standings.find(s => s.teamId === m.home);
                    const awayRow = g.standings.find(s => s.teamId === m.away);
                    if (!homeRow || !awayRow) return;
                    homeRow.played++; awayRow.played++;
                    homeRow.goalsFor += result.homeGoals; homeRow.goalsAgainst += result.awayGoals;
                    awayRow.goalsFor += result.awayGoals; awayRow.goalsAgainst += result.homeGoals;
                    if (result.homeGoals > result.awayGoals) { homeRow.won++; homeRow.points += 3; awayRow.lost++; }
                    else if (result.homeGoals < result.awayGoals) { awayRow.won++; awayRow.points += 3; homeRow.lost++; }
                    else { homeRow.drawn++; homeRow.points += 1; awayRow.drawn++; awayRow.points += 1; }
                });
                g.standings.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
            });

            this.currentRoundGroup++;

            // Check if groups finished
            const allGroupsFinished = this.groups.every(g => this.currentRoundGroup >= g.fixtures.length);
            if (allGroupsFinished) {
                this.phase = 'KNOCKOUT';
                const qualifiedTeams = [];
                this.groups.forEach(g => {
                    qualifiedTeams.push(g.standings[0].teamId);
                    if (g.standings.length > 1) qualifiedTeams.push(g.standings[1].teamId);
                });
                this.knockoutMatches = this.createKnockoutRound(qualifiedTeams);
            }

            return allResults.length > 0 ? allResults : null;
        }

        if (this.phase === 'KNOCKOUT') {
            if (this.knockoutPhaseIndex >= this.knockoutScheduleWeeks.length) return null;
            if (this.knockoutScheduleWeeks[this.knockoutPhaseIndex] !== week) return null;

            const results = [];
            const nextPhaseTeams = [];

            this.knockoutMatches.forEach(m => {
                if (m.away === null) {
                    nextPhaseTeams.push(m.home);
                    results.push(m);
                } else {
                    const result = engine.playMatch(m.home, m.away, true);
                    m.score = result;
                    m.played = true;
                    results.push(m);
                    const winnerId = result.homeGoals > result.awayGoals ? m.home :
                        result.awayGoals > result.homeGoals ? m.away :
                            (Math.random() > 0.5 ? m.home : m.away);
                    nextPhaseTeams.push(winnerId);
                }
            });

            this.knockoutPhaseIndex++;
            if (nextPhaseTeams.length === 1) {
                this.winner = nextPhaseTeams[0];
                this.isActive = false;
            } else {
                this.knockoutMatches = this.createKnockoutRound(nextPhaseTeams);
            }

            return results;
        }

        return null;
    }

    createKnockoutRound(teams) {
        const matches = [];
        const shuffled = [...teams].sort(() => 0.5 - Math.random());
        for (let i = 0; i < shuffled.length; i += 2) {
            if (shuffled[i + 1]) {
                matches.push({ home: shuffled[i], away: shuffled[i + 1], score: null, played: false });
            } else {
                matches.push({ home: shuffled[i], away: null, score: null, played: false });
            }
        }
        return matches;
    }
}
