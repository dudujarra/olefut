/**
 * Unit tests for FormationService
 * AKITA-411: Top 10 unit test coverage
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { FormationService } from '../../src/services/FormationService.js';

function makeEngine(overrides = {}) {
    const team = {
        id: 1, name: 'Test FC', formation: '4-3-3', zone: 'SE', division: 1,
        squad: [
            { id: 1, name: 'GK', position: 'GOL', ovr: 70, isTitular: true, energy: 80, moral: 60 },
            { id: 2, name: 'DEF1', position: 'DEF', ovr: 68, isTitular: true, energy: 80, moral: 60 },
            { id: 3, name: 'DEF2', position: 'DEF', ovr: 66, isTitular: true, energy: 80, moral: 60 },
            { id: 4, name: 'DEF3', position: 'DEF', ovr: 65, isTitular: true, energy: 80, moral: 60 },
            { id: 5, name: 'DEF4', position: 'DEF', ovr: 64, isTitular: true, energy: 80, moral: 60 },
            { id: 6, name: 'MEI1', position: 'MEI', ovr: 72, isTitular: true, energy: 80, moral: 60 },
            { id: 7, name: 'MEI2', position: 'MEI', ovr: 70, isTitular: true, energy: 80, moral: 60 },
            { id: 8, name: 'MEI3', position: 'MEI', ovr: 69, isTitular: true, energy: 80, moral: 60 },
            { id: 9, name: 'ATA1', position: 'ATA', ovr: 75, isTitular: true, energy: 80, moral: 60 },
            { id: 10, name: 'ATA2', position: 'ATA', ovr: 73, isTitular: true, energy: 80, moral: 60 },
            { id: 11, name: 'ATA3', position: 'ATA', ovr: 71, isTitular: true, energy: 80, moral: 60 },
            // Subs
            { id: 12, name: 'SUB_GK', position: 'GOL', ovr: 60, isTitular: false, energy: 90, moral: 60 },
            { id: 13, name: 'SUB_DEF', position: 'DEF', ovr: 62, isTitular: false, energy: 90, moral: 60 },
            { id: 14, name: 'SUB_MEI', position: 'MEI', ovr: 63, isTitular: false, energy: 90, moral: 60 },
            { id: 15, name: 'SUB_ATA', position: 'ATA', ovr: 65, isTitular: false, energy: 90, moral: 60 },
        ],
    };

    return {
        teams: [team],
        manager: { teamId: 1, tacticHistory: {} },
        currentTactic: 'normal',
        currentWeek: 10,
        matchHistory: [],
        tournaments: [],
        _liveSubsLog: [],
        getTeam(id) { return this.teams.find(t => t.id === id); },
        getStandings() { return [{ teamId: 1 }, { teamId: 99 }]; },
        getUpcomingMatch() { return null; },
        getTeamSectors() { return null; },
        ...overrides,
    };
}

describe('FormationService', () => {
    let svc;
    let engine;

    beforeEach(() => {
        svc = new FormationService();
        engine = makeEngine();
    });

    describe('setTactic()', () => {
        it('sets valid tactic', () => {
            svc.setTactic(engine, 'offensive');
            expect(engine.currentTactic).toBe('offensive');
        });

        it('tracks tactic usage history', () => {
            svc.setTactic(engine, 'defensive');
            expect(engine.manager.tacticHistory.defensive).toBe(1);
            svc.setTactic(engine, 'defensive');
            expect(engine.manager.tacticHistory.defensive).toBe(2);
        });
    });

    describe('setFormation()', () => {
        it('sets valid formation', () => {
            svc.setFormation(engine, '4-4-2');
            expect(engine.getTeam(1).formation).toBe('4-4-2');
        });
    });

    describe('saveFormationLayout()', () => {
        it('saves layout on team', () => {
            const layout = { slots: [1, 2, 3] };
            const result = svc.saveFormationLayout(engine, { formation: '3-5-2', layout });
            expect(result.success).toBe(true);
            expect(engine.getTeam(1).formation).toBe('3-5-2');
            expect(engine.getTeam(1).formationLayout).toEqual(layout);
        });

        it('fails without team', () => {
            engine.manager.teamId = 999;
            const result = svc.saveFormationLayout(engine, { layout: {} });
            expect(result.success).toBe(false);
            expect(result.msg).toBeDefined();
        });
    });

    describe('applyLiveSubstitution()', () => {
        it('swaps titular and sub correctly', () => {
            const result = svc.applyLiveSubstitution(engine, 9, 15, 60);
            expect(result.success).toBe(true);
            expect(result.msg).toContain('sai');
            expect(engine.getTeam(1).squad.find(p => p.id === 9).isTitular).toBe(false);
            expect(engine.getTeam(1).squad.find(p => p.id === 15).isTitular).toBe(true);
        });

        it('logs the substitution', () => {
            svc.applyLiveSubstitution(engine, 9, 15, 75);
            expect(engine._liveSubsLog.length).toBe(1);
            expect(engine._liveSubsLog[0].minute).toBe(75);
        });

        it('blocks injured sub', () => {
            engine.getTeam(1).squad.find(p => p.id === 15).injury = { weeks: 2 };
            const result = svc.applyLiveSubstitution(engine, 9, 15, 60);
            expect(result.success).toBe(false);
        });

        it('blocks non-titular out', () => {
            const result = svc.applyLiveSubstitution(engine, 15, 12, 60);
            expect(result.success).toBe(false);
        });
    });

    describe('autoPickSquad()', () => {
        it('picks 11 titulares', () => {
            // Reset all to false
            engine.getTeam(1).squad.forEach(p => p.isTitular = false);
            const result = svc.autoPickSquad(engine);
            expect(result.success).toBe(true);
            const titulares = engine.getTeam(1).squad.filter(p => p.isTitular);
            expect(titulares.length).toBe(11);
        });

        it('fails without team', () => {
            engine.manager.teamId = 999;
            const result = svc.autoPickSquad(engine);
            expect(result.success).toBe(false);
        });
    });

    describe('getMatchContext()', () => {
        it('returns null without team', () => {
            engine.manager.teamId = 999;
            expect(svc.getMatchContext(engine)).toBeNull();
        });
    });
});
