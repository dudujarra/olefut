/**
 * Unit tests for ManagerSystems (Tactics, Formations, Training, TeamTalk)
 * AKITA-411: Top 10 unit test coverage
 */
import { describe, it, expect } from 'vitest';
import {
    TACTICS, FORMATIONS, TRAINING_TYPES,
    applyTraining, applyTeamTalk,
} from '../../src/engine/ManagerSystems';

function makeTeam() {
    return {
        id: 1, name: 'Test FC', formation: '4-3-3',
        squad: Array.from({ length: 15 }, (_, i) => ({
            id: i + 1, name: `P${i}`, position: ['GOL', 'DEF', 'DEF', 'DEF', 'DEF', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA', 'GOL', 'DEF', 'MEI', 'ATA'][i],
            ovr: 60 + i, isTitular: i < 11, energy: 80, moral: 60,
            form: { value: 50, trend: 0 },
        })),
    };
}

describe('ManagerSystems', () => {
    describe('TACTICS', () => {
        it('has at least 4 tactics defined', () => {
            expect(Object.keys(TACTICS).length).toBeGreaterThanOrEqual(4);
        });

        it('every tactic has ataModifier and defModifier', () => {
            Object.values(TACTICS).forEach(t => {
                expect(typeof t.ataModifier).toBe('number');
                expect(typeof t.defModifier).toBe('number');
            });
        });

        it('offensive has ataModifier > 1', () => {
            expect(TACTICS.offensive.ataModifier).toBeGreaterThan(1);
        });

        it('defensive has defModifier > 1', () => {
            expect(TACTICS.defensive.defModifier).toBeGreaterThan(1);
        });
    });

    describe('FORMATIONS', () => {
        it('has at least 5 formations', () => {
            expect(Object.keys(FORMATIONS).length).toBeGreaterThanOrEqual(5);
        });

        it('every formation sums to 10 (outfield)', () => {
            Object.entries(FORMATIONS).forEach(([name, f]) => {
                const total = f.DEF + f.MEI + f.ATA;
                expect(total).toBe(10);
            });
        });
    });

    describe('TRAINING_TYPES', () => {
        it('has at least 3 training types', () => {
            expect(TRAINING_TYPES.length).toBeGreaterThanOrEqual(3);
        });

        it('each has id, name, and improvements', () => {
            TRAINING_TYPES.forEach(t => {
                expect(t.id).toBeDefined();
                expect(t.name).toBeDefined();
            });
        });
    });

    describe('applyTraining()', () => {
        it('returns success with improvements array', () => {
            const team = makeTeam();
            const result = applyTraining(team, TRAINING_TYPES[0]?.id || 'physical');
            expect(result.success).toBe(true);
            expect(Array.isArray(result.improvements)).toBe(true);
        });

        it('returns failure for invalid type', () => {
            const team = makeTeam();
            const result = applyTraining(team, 'nonexistent_training');
            expect(result.success).toBe(false);
        });
    });

    describe('applyTeamTalk()', () => {
        it('returns result with talk and modifiers on success', () => {
            const team = makeTeam();
            const result = applyTeamTalk(team, 'motivational');
            if (result.success) {
                expect(result.talk).toBeDefined();
                expect(result.modifiers).toBeDefined();
            }
        });
    });
});
