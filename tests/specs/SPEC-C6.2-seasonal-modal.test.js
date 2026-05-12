/**
 * SPEC-C6.2: SeasonalEventModal — pure helpers
 */

import { describe, it, expect } from 'vitest';
import {
    applyEventEffectToTeam,
    formatSeasonalChip,
    SeasonalEventModal,
} from '../../src/components/SeasonalEventModal.jsx';

describe('SPEC-C6.2: SeasonalEventModal', () => {

    describe('applyEventEffectToTeam', () => {
        it('moralDelta apply to team.moral with clamp', () => {
            const team = { moral: 50, squad: [] };
            const r = applyEventEffectToTeam({ moralDelta: 8 }, team);
            expect(team.moral).toBe(58);
            expect(r.applied).toBe(true);
            expect(r.changes.moral.before).toBe(50);
            expect(r.changes.moral.after).toBe(58);
        });

        it('moralDelta clamped to 100', () => {
            const team = { moral: 95, squad: [] };
            applyEventEffectToTeam({ moralDelta: 20 }, team);
            expect(team.moral).toBe(100);
        });

        it('moralDelta clamped to 0', () => {
            const team = { moral: 5, squad: [] };
            applyEventEffectToTeam({ moralDelta: -20 }, team);
            expect(team.moral).toBe(0);
        });

        it('energyDelta apply to each squad player', () => {
            const team = { moral: 50, squad: [
                { energy: 50 },
                { energy: 30 },
            ] };
            applyEventEffectToTeam({ energyDelta: 5 }, team);
            expect(team.squad[0].energy).toBe(55);
            expect(team.squad[1].energy).toBe(35);
        });

        it('energy clamp up to 100', () => {
            const team = { moral: 50, squad: [{ energy: 95 }] };
            applyEventEffectToTeam({ energyDelta: 20 }, team);
            expect(team.squad[0].energy).toBe(100);
        });

        it('energy clamp down to 0', () => {
            const team = { moral: 50, squad: [{ energy: 5 }] };
            applyEventEffectToTeam({ energyDelta: -20 }, team);
            expect(team.squad[0].energy).toBe(0);
        });

        it('null team → applied false', () => {
            const r = applyEventEffectToTeam({ moralDelta: 5 }, null);
            expect(r.applied).toBe(false);
        });

        it('null effect → applied false', () => {
            const r = applyEventEffectToTeam(null, { moral: 50, squad: [] });
            expect(r.applied).toBe(false);
        });
    });

    describe('formatSeasonalChip', () => {
        it('moralDelta positive', () => {
            expect(formatSeasonalChip({ moralDelta: 5 })).toBe('Moral +5');
        });

        it('moralDelta negative', () => {
            expect(formatSeasonalChip({ moralDelta: -3 })).toBe('Moral -3');
        });

        it('energyDelta', () => {
            expect(formatSeasonalChip({ energyDelta: 10 })).toBe('Energia +10');
        });

        it('multiple effects joined com ·', () => {
            const r = formatSeasonalChip({ moralDelta: 5, energyDelta: -3 });
            expect(r).toContain('Moral +5');
            expect(r).toContain('Energia -3');
            expect(r).toContain('·');
        });

        it('empty/null → empty string', () => {
            expect(formatSeasonalChip({})).toBe('');
            expect(formatSeasonalChip(null)).toBe('');
            expect(formatSeasonalChip(undefined)).toBe('');
        });
    });

    describe('module integrity', () => {
        it('SeasonalEventModal exported as function', () => {
            expect(typeof SeasonalEventModal).toBe('function');
        });
    });

});
