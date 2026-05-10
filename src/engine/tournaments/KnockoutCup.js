import { Tournament } from './Tournament';

import { rng as systemRng } from '../rng.js';

export class KnockoutCup extends Tournament {
    constructor(id, name, scheduleWeeks) {
        super(id, name);
        this.scheduleWeeks = scheduleWeeks;
        this.currentPhaseIndex = 0;
        this.currentMatches = [];
    }

    init(teamIds) {
        super.init(teamIds);
        // BUG-FIX: reset phase state so tournament restarts each season
        this.currentPhaseIndex = 0;
        this.winner = null;
        this.currentMatches = this.createKnockoutRound(teamIds);
    }

    createKnockoutRound(teams) {
        const matches = [];
        const shuffled = [...teams].sort(() => 0.5 - systemRng());
        for (let i = 0; i < shuffled.length; i += 2) {
            if (shuffled[i + 1]) {
                matches.push({ home: shuffled[i], away: shuffled[i + 1], score: null, played: false });
            } else {
                matches.push({ home: shuffled[i], away: null, score: null, played: false }); // bye
            }
        }
        return matches;
    }

    advanceWeek(engine, week) {
        if (this.currentPhaseIndex >= this.scheduleWeeks.length) return null;
        if (this.scheduleWeeks[this.currentPhaseIndex] !== week) return null;

        const results = [];
        const nextPhaseTeams = [];

        this.currentMatches.forEach(m => {
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
                        (systemRng() > 0.5 ? m.home : m.away); // penalties
                nextPhaseTeams.push(winnerId);
            }
        });

        this.currentPhaseIndex++;
        if (nextPhaseTeams.length === 1) {
            this.winner = nextPhaseTeams[0];
            this.isActive = false;
        } else {
            this.currentMatches = this.createKnockoutRound(nextPhaseTeams);
        }

        return results;
    }
}
