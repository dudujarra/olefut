/**
 * Unit tests for MatchSimulator (public API contracts)
 * AKITA-411: Top 10 unit test coverage
 */
import { describe, it, expect } from 'vitest';
import { MatchSimulator } from '../../src/services/MatchSimulator.js';

function makeSquad(base) {
    return Array.from({ length: 15 }, (_, i) => ({
        id: base + i,
        name: `P${base + i}`,
        position: ['GOL', 'DEF', 'DEF', 'DEF', 'DEF', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA', 'GOL', 'DEF', 'MEI', 'ATA'][i],
        ovr: 60 + i, isTitular: i < 11, energy: 80, moral: 60,
        injury: null, suspension: null, _retired: false,
        form: { value: 50, trend: 0, last5: [] },
        attributes: {
            physical: { pace: 55, stamina: 60, strength: 50 },
            technical: { dribbling: 50, finishing: 50, passing: 55 },
            mental: { decisions: 50, composure: 50, positioning: 55 },
            goalkeeping: { reflexes: i === 0 ? 70 : 20, handling: i === 0 ? 65 : 15 },
        },
        traits: [],
    }));
}

function makeEngine() {
    return {
        teams: [
            { id: 1, name: 'Home FC', zone: 'SE', division: 1, squad: makeSquad(1), formation: '4-3-3' },
            { id: 2, name: 'Away FC', zone: 'SE', division: 1, squad: makeSquad(100), formation: '4-4-2' },
        ],
        manager: { teamId: 1, tacticHistory: {} },
        currentWeek: 10,
        currentTactic: 'normal',
        teamTalkModifiers: { ata: 1.0, def: 1.0 },
        lastTeamTalk: null,
        weekEvents: [],
        matchHistory: [],
        pendingMatchBonus: null,
        _liveSubsLog: [],
        managerStats: { streak: 0, rollingForm: [], cleanSheets: 0, wins: 0, losses: 0 },
        formerCompanions: [],
        transferOffers: [],
        boardTension: 0,
        rivalryHistory: {},
        lastMatchNarrative: null,
        seasonNumber: 0,
        viewUnlockState: { totalTransfers: 0 },
        getTeam(id) { return this.teams.find(t => t.id === id); },
        getTeamSectors() { return { attack: 50, defense: 50, midfield: 50 }; },
        getStandings() { return [{ teamId: 1 }, { teamId: 2 }]; },
        staff: new Map(),
    };
}

describe('MatchSimulator', () => {
    it('instantiates without error', () => {
        const sim = new MatchSimulator();
        expect(sim).toBeDefined();
    });

    describe('simulate()', () => {
        it('returns valid match result structure', () => {
            const sim = new MatchSimulator();
            const engine = makeEngine();
            const result = sim.simulate(engine, 1, 2);

            expect(result).toBeDefined();
            expect(typeof result.homeGoals).toBe('number');
            expect(typeof result.awayGoals).toBe('number');
            expect(result.homeGoals).toBeGreaterThanOrEqual(0);
            expect(result.awayGoals).toBeGreaterThanOrEqual(0);
        });

        it('goals are within reasonable range (0-15)', () => {
            const sim = new MatchSimulator();
            const engine = makeEngine();
            const result = sim.simulate(engine, 1, 2);

            expect(result.homeGoals).toBeLessThanOrEqual(15);
            expect(result.awayGoals).toBeLessThanOrEqual(15);
        });

        it('returns events object with textLog', () => {
            const sim = new MatchSimulator();
            const engine = makeEngine();
            const result = sim.simulate(engine, 1, 2);

            expect(result.events).toBeDefined();
            expect(Array.isArray(result.events.textLog)).toBe(true);
        });
    });
});
