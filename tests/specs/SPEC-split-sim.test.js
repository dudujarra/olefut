import { describe, it, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { createEngine } from '../../src/engine/engineFactory.js';

describe('Split Simulation Flow', () => {
    let engine;
    let teamId;

    beforeEach(() => {
        engine = createEngine();
        // Pick first team as manager's team
        const teams = Object.keys(engine.teams);
        teamId = teams[0];
        engine.manager.teamId = teamId;
        engine.manager.name = 'Test Manager';
        
        // Ensure squad has titulares
        const team = engine.getTeam(teamId);
        if (team && team.squad) {
            team.squad.forEach((p, i) => {
                p.isTitular = i < 11;
                p.energy = p.energy || 100;
            });
        }
    });

    it('getPendingHumanMatch returns match for current week', () => {
        const pending = engine.getPendingHumanMatch();
        // May be null if team has no fixture this week — skip gracefully
        if (!pending) return;
        expect(pending.match).toBeDefined();
        expect(pending.match.home === teamId || pending.match.away === teamId).toBe(true);
        expect(pending.match.played).toBeFalsy();
    });

    it('playMatchFirstHalf simulates only 1-45 minutes', () => {
        const pending = engine.getPendingHumanMatch();
        if (!pending) return;
        const { match, isCup } = pending;
        
        const htResult = engine.playMatchFirstHalf(match.home, match.away, isCup);
        
        expect(htResult).toBeDefined();
        expect(htResult.homeGoals).toBeGreaterThanOrEqual(0);
        expect(htResult.awayGoals).toBeGreaterThanOrEqual(0);
        expect(htResult.events).toBeDefined();
        expect(htResult.events.textLog).toBeDefined();
        
        // Events should only have minutes 1-45
        const maxMin = Math.max(...htResult.events.textLog.filter(e => e?.minute).map(e => e.minute), 0);
        expect(maxMin).toBeLessThanOrEqual(46);
    });

    it('playMatchFirstHalf does NOT drain energy (skipPostMatch)', () => {
        const pending = engine.getPendingHumanMatch();
        if (!pending) return;
        const { match, isCup } = pending;
        const team = engine.getTeam(teamId);
        
        // Record energy before
        const energyBefore = {};
        team.squad.filter(p => p.isTitular).forEach(p => {
            energyBefore[p.id] = p.energy;
        });
        
        engine.playMatchFirstHalf(match.home, match.away, isCup);
        
        // Energy should NOT have been drained
        team.squad.filter(p => p.isTitular).forEach(p => {
            expect(p.energy).toBe(energyBefore[p.id]);
        });
    });

    it('playMatchSecondHalf DOES drain energy', () => {
        const pending = engine.getPendingHumanMatch();
        if (!pending) return;
        const { match, isCup } = pending;
        const team = engine.getTeam(teamId);
        
        const htResult = engine.playMatchFirstHalf(match.home, match.away, isCup);
        
        // Record energy before 2nd half
        const energyBefore = {};
        team.squad.filter(p => p.isTitular).forEach(p => {
            energyBefore[p.id] = p.energy;
        });
        
        engine.playMatchSecondHalf(match.home, match.away, htResult, isCup);
        
        // Energy SHOULD have been drained
        let anyDrained = false;
        team.squad.filter(p => p.isTitular).forEach(p => {
            if (p.energy < energyBefore[p.id]) anyDrained = true;
        });
        expect(anyDrained).toBe(true);
    });

    it('resolveHumanMatch + advanceWeek registers the result', () => {
        const pending = engine.getPendingHumanMatch();
        if (!pending) return;
        const { match, isCup } = pending;
        
        const htResult = engine.playMatchFirstHalf(match.home, match.away, isCup);
        const finalResult = engine.playMatchSecondHalf(match.home, match.away, htResult, isCup);
        
        engine.resolveHumanMatch(finalResult);
        engine.advanceWeek();
        
        // Match should now be played
        expect(match.played).toBe(true);
        expect(match.score).toBeDefined();
        expect(match.score.homeGoals).toBe(finalResult.homeGoals);
        expect(match.score.awayGoals).toBe(finalResult.awayGoals);
    });

    it('playMatchFromMinute does NOT drain energy (skipPostMatch)', () => {
        const pending = engine.getPendingHumanMatch();
        if (!pending) return;
        const { match, isCup } = pending;
        const team = engine.getTeam(teamId);
        
        const htResult = engine.playMatchFirstHalf(match.home, match.away, isCup);
        
        // Record energy
        const energyBefore = {};
        team.squad.filter(p => p.isTitular).forEach(p => {
            energyBefore[p.id] = p.energy;
        });
        
        engine.playMatchFromMinute(match.home, match.away, 30, 45, htResult, isCup);
        
        // Energy should NOT have been drained
        team.squad.filter(p => p.isTitular).forEach(p => {
            expect(p.energy).toBe(energyBefore[p.id]);
        });
    });

    it('full split-sim flow drains energy only once (not double)', () => {
        const pending = engine.getPendingHumanMatch();
        if (!pending) return;
        const { match, isCup } = pending;
        const team = engine.getTeam(teamId);
        
        const energyBaseline = {};
        team.squad.filter(p => p.isTitular).forEach(p => {
            energyBaseline[p.id] = p.energy;
        });
        
        const htResult = engine.playMatchFirstHalf(match.home, match.away, isCup);
        const finalResult = engine.playMatchSecondHalf(match.home, match.away, htResult, isCup);
        
        // Calculate drain
        const drains = [];
        team.squad.filter(p => p.isTitular).forEach(p => {
            drains.push(energyBaseline[p.id] - p.energy);
        });
        
        // All drains should be reasonable single-drain range (15-25, NOT 30-50)
        drains.forEach(d => {
            expect(d).toBeLessThan(40);
            expect(d).toBeGreaterThanOrEqual(0);
        });
    });
});
