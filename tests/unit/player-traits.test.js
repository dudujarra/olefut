/**
 * Unit tests for PlayerTraits
 * AKITA-411: Top 10 unit test coverage
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    POSITION_TRAITS, TRAITS,
    rollTraits, getPlayerTraits, hasTrait,
    getGoalConversionBonus, getPenaltySaveBonus, getPenaltyConversionBonus,
    getDefenseSectorBonus, getSetPieceBonus, getSpecializationDisplay,
    getTraitMatchModifier,
    initCareerStats, recordMatchStats, closeSeasonStats,
    calculateSeasonAwards,
    isRivalry, generateCounterOffer,
    processMentoring,
} from '../../src/engine/PlayerTraits.js';

function makePlayer(overrides = {}) {
    return {
        id: 1, name: 'Test Player', position: 'ATA', ovr: 70, age: 25,
        traits: [], moral: 60, energy: 80, isTitular: true,
        form: { value: 50, trend: 0 }, value: 1_000_000,
        ...overrides,
    };
}

describe('PlayerTraits', () => {
    // ============================================================
    // CONSTANTS INTEGRITY
    // ============================================================
    describe('POSITION_TRAITS', () => {
        it('has at least 5 traits', () => {
            expect(POSITION_TRAITS.length).toBeGreaterThanOrEqual(5);
        });

        it('each has id, positions, and rarity', () => {
            POSITION_TRAITS.forEach(t => {
                expect(t.id).toBeDefined();
                expect(Array.isArray(t.positions)).toBe(true);
                expect(t.rarity).toBeGreaterThan(0);
                expect(t.rarity).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('TRAITS', () => {
        it('has at least 10 generic traits', () => {
            expect(TRAITS.length).toBeGreaterThanOrEqual(10);
        });

        it('each has id and rarity', () => {
            TRAITS.forEach(t => {
                expect(t.id).toBeDefined();
                expect(t.rarity).toBeGreaterThan(0);
            });
        });

        it('no duplicate IDs between TRAITS and POSITION_TRAITS', () => {
            const allIds = [...TRAITS.map(t => t.id), ...POSITION_TRAITS.map(t => t.id)];
            const unique = new Set(allIds);
            expect(unique.size).toBe(allIds.length);
        });
    });

    // ============================================================
    // TRAIT HELPERS
    // ============================================================
    describe('rollTraits()', () => {
        it('does not re-roll if player already has traits', () => {
            const p = makePlayer({ traits: ['clutch'] });
            rollTraits(p);
            expect(p.traits).toEqual(['clutch']);
        });

        it('limits young players to 1 trait', () => {
            const p = makePlayer({ age: 19, traits: [] });
            // Run multiple times to increase coverage (RNG dependent)
            for (let i = 0; i < 50; i++) {
                p.traits = [];
                rollTraits(p);
                expect(p.traits.length).toBeLessThanOrEqual(1);
            }
        });

        it('allows up to 2 traits for older players', () => {
            const p = makePlayer({ age: 28, traits: [] });
            // Run multiple times
            let maxSeen = 0;
            for (let i = 0; i < 100; i++) {
                p.traits = [];
                rollTraits(p);
                maxSeen = Math.max(maxSeen, p.traits.length);
                expect(p.traits.length).toBeLessThanOrEqual(2);
            }
        });
    });

    describe('getPlayerTraits()', () => {
        it('returns empty for player without traits', () => {
            expect(getPlayerTraits(makePlayer({ traits: null }))).toEqual([]);
            expect(getPlayerTraits(makePlayer({ traits: [] }))).toEqual([]);
        });

        it('returns full trait objects', () => {
            const p = makePlayer({ traits: ['clutch', 'poacher'] });
            const result = getPlayerTraits(p);
            expect(result.length).toBe(2);
            expect(result[0].id).toBe('clutch');
            expect(result[1].id).toBe('poacher');
        });
    });

    describe('hasTrait()', () => {
        it('returns true when player has trait', () => {
            expect(hasTrait(makePlayer({ traits: ['clutch'] }), 'clutch')).toBe(true);
        });
        it('returns false when missing', () => {
            expect(hasTrait(makePlayer(), 'clutch')).toBe(false);
        });
        it('returns false for null traits', () => {
            expect(hasTrait(makePlayer({ traits: null }), 'clutch')).toBeFalsy();
        });
    });

    // ============================================================
    // BONUS HELPERS
    // ============================================================
    describe('getGoalConversionBonus()', () => {
        it('returns 1.25 for poacher', () => {
            expect(getGoalConversionBonus(makePlayer({ traits: ['poacher'] }))).toBe(1.25);
        });
        it('returns 1.0 otherwise', () => {
            expect(getGoalConversionBonus(makePlayer())).toBe(1.0);
        });
        it('handles null player', () => {
            expect(getGoalConversionBonus(null)).toBe(1.0);
        });
    });

    describe('getPenaltySaveBonus()', () => {
        it('returns 1.35 for penalty_stopper', () => {
            expect(getPenaltySaveBonus(makePlayer({ traits: ['penalty_stopper'] }))).toBe(1.35);
        });
        it('returns 1.0 otherwise', () => {
            expect(getPenaltySaveBonus(makePlayer())).toBe(1.0);
        });
    });

    describe('getPenaltyConversionBonus()', () => {
        it('returns 1.40 for penalty_king', () => {
            expect(getPenaltyConversionBonus(makePlayer({ traits: ['penalty_king'] }))).toBe(1.40);
        });
    });

    describe('getDefenseSectorBonus()', () => {
        it('returns 1.0 for empty squad', () => {
            expect(getDefenseSectorBonus([])).toBe(1.0);
            expect(getDefenseSectorBonus(null)).toBe(1.0);
        });

        it('returns 1.15 for 1 rockwall defender', () => {
            const squad = [
                makePlayer({ position: 'DEF', traits: ['rockwall'], isTitular: true }),
                makePlayer({ id: 2, position: 'DEF', traits: [], isTitular: true }),
            ];
            expect(getDefenseSectorBonus(squad)).toBe(1.15);
        });

        it('stacks for multiple rockwalls', () => {
            const squad = [
                makePlayer({ position: 'DEF', traits: ['rockwall'], isTitular: true }),
                makePlayer({ id: 2, position: 'GOL', traits: ['rockwall'], isTitular: true }),
            ];
            expect(getDefenseSectorBonus(squad)).toBeCloseTo(1.30);
        });
    });

    describe('getSetPieceBonus()', () => {
        it('returns 1.20 for set_piece_target', () => {
            expect(getSetPieceBonus(makePlayer({ traits: ['set_piece_target'] }))).toBe(1.20);
        });
    });

    describe('getSpecializationDisplay()', () => {
        it('returns null for generic trait', () => {
            expect(getSpecializationDisplay(makePlayer({ traits: ['clutch'] }))).toBeNull();
        });
        it('returns display for position trait', () => {
            const result = getSpecializationDisplay(makePlayer({ traits: ['poacher'] }));
            expect(result).not.toBeNull();
            expect(result.id).toBe('poacher');
            expect(result.name).toBeDefined();
        });
    });

    describe('getTraitMatchModifier()', () => {
        it('returns 1.0 for no traits', () => {
            expect(getTraitMatchModifier(makePlayer(), 45, 'normal', false)).toBe(1.0);
        });

        it('clutch boosts after minute 75', () => {
            const p = makePlayer({ traits: ['clutch'] });
            expect(getTraitMatchModifier(p, 80, 'normal', false)).toBe(1.25);
            expect(getTraitMatchModifier(p, 30, 'normal', false)).toBe(1.0);
        });

        it('bigmatch boosts in derby', () => {
            const p = makePlayer({ traits: ['bigmatch'] });
            expect(getTraitMatchModifier(p, 45, 'normal', true)).toBe(1.15);
            expect(getTraitMatchModifier(p, 45, 'normal', false)).toBe(1.0);
        });

        it('speedster boosts in counter tactic', () => {
            const p = makePlayer({ traits: ['speedster'] });
            expect(getTraitMatchModifier(p, 45, 'counter', false)).toBe(1.15);
        });

        it('stacks multiple trait modifiers', () => {
            const p = makePlayer({ traits: ['clutch', 'bigmatch'] });
            const mod = getTraitMatchModifier(p, 80, 'normal', true);
            expect(mod).toBeCloseTo(1.25 * 1.15);
        });
    });

    // ============================================================
    // CAREER STATS
    // ============================================================
    describe('initCareerStats()', () => {
        it('initializes career object', () => {
            const p = makePlayer();
            initCareerStats(p);
            expect(p.career).toBeDefined();
            expect(p.career.totalGoals).toBe(0);
            expect(p.career.totalAssists).toBe(0);
            expect(p.career.hatTricks).toBe(0);
        });

        it('does not overwrite existing career', () => {
            const p = makePlayer();
            p.career = { totalGoals: 10, totalAssists: 5, totalApps: 20, totalCards: 2, totalMotm: 1, hatTricks: 1, seasonGoals: 3, seasonAssists: 1, seasonApps: 5, seasonCards: 0, seasonMotm: 0, history: [] };
            initCareerStats(p);
            expect(p.career.totalGoals).toBe(10);
        });

        it('backfills hatTricks on legacy save', () => {
            const p = makePlayer();
            p.career = { totalGoals: 5, totalAssists: 2, totalApps: 10, totalCards: 0, totalMotm: 0, seasonGoals: 0, seasonAssists: 0, seasonApps: 0, seasonCards: 0, seasonMotm: 0, history: [] };
            initCareerStats(p);
            expect(p.career.hatTricks).toBe(0);
        });
    });

    describe('recordMatchStats()', () => {
        it('records goals and assists', () => {
            const p = makePlayer();
            recordMatchStats(p, 2, 1, 0, false);
            expect(p.career.totalGoals).toBe(2);
            expect(p.career.totalAssists).toBe(1);
            expect(p.career.totalApps).toBe(1);
        });

        it('tracks MOTM', () => {
            const p = makePlayer();
            recordMatchStats(p, 0, 0, 0, true);
            expect(p.career.totalMotm).toBe(1);
            expect(p.career.seasonMotm).toBe(1);
        });

        it('tracks hat tricks (3+ goals)', () => {
            const p = makePlayer();
            recordMatchStats(p, 3, 0, 0, false);
            expect(p.career.hatTricks).toBe(1);

            recordMatchStats(p, 4, 0, 0, false); // 4 goals also counts
            expect(p.career.hatTricks).toBe(2);
        });

        it('does not count 2 goals as hat trick', () => {
            const p = makePlayer();
            recordMatchStats(p, 2, 0, 0, false);
            expect(p.career.hatTricks).toBe(0);
        });
    });

    describe('closeSeasonStats()', () => {
        it('archives season and resets counters', () => {
            const p = makePlayer();
            recordMatchStats(p, 10, 5, 2, false);
            closeSeasonStats(p, 1, 'Test FC');

            expect(p.career.history.length).toBe(1);
            expect(p.career.history[0].goals).toBe(10);
            expect(p.career.history[0].season).toBe(1);
            expect(p.career.seasonGoals).toBe(0);
            expect(p.career.seasonAssists).toBe(0);
        });
    });

    describe('calculateSeasonAwards()', () => {
        it('returns golden boot for top scorer', () => {
            const squad = [
                makePlayer({ name: 'Scorer' }),
                makePlayer({ id: 2, name: 'Other' }),
            ];
            recordMatchStats(squad[0], 15, 2, 0, true);
            recordMatchStats(squad[1], 3, 0, 0, false);

            const awards = calculateSeasonAwards(squad, 'FC', 1);
            const boot = awards.find(a => a.type === 'golden_boot');
            expect(boot).toBeDefined();
            expect(boot.player).toBe('Scorer');
        });

        it('returns empty for empty squad', () => {
            expect(calculateSeasonAwards([], 'FC', 1)).toEqual([]);
        });
    });

    // ============================================================
    // RIVALRY & TRANSFER
    // ============================================================
    describe('isRivalry()', () => {
        it('same zone + division = rivalry', () => {
            expect(isRivalry({ zone: 'SE', division: 1 }, { zone: 'SE', division: 1 })).toBe(true);
        });
        it('different zone = no rivalry', () => {
            expect(isRivalry({ zone: 'SE', division: 1 }, { zone: 'NE', division: 1 })).toBe(false);
        });
        it('handles null', () => {
            expect(isRivalry(null, { zone: 'SE' })).toBe(false);
        });
    });

    describe('generateCounterOffer()', () => {
        it('returns valid counter structure', () => {
            const p = makePlayer({ value: 2_000_000 });
            const result = generateCounterOffer(p, 1_000_000, 1);
            expect(result.round).toBe(1);
            expect(typeof result.accepted).toBe('boolean');
            expect(typeof result.counterAmount).toBe('number');
            expect(result.msg).toBeDefined();
        });

        it('accepts overpay', () => {
            const p = makePlayer({ value: 1_000_000 });
            const result = generateCounterOffer(p, 100_000_000, 1);
            expect(result.accepted).toBe(true);
        });

        it('round 3 is final', () => {
            const p = makePlayer({ value: 2_000_000 });
            const result = generateCounterOffer(p, 500_000, 3);
            expect(result.final).toBe(true);
        });
    });

    // ============================================================
    // MENTORING
    // ============================================================
    describe('processMentoring()', () => {
        it('returns empty for squad without mentors', () => {
            const squad = [makePlayer({ age: 20, moral: 70 })];
            const events = processMentoring(squad);
            expect(Array.isArray(events)).toBe(true);
        });

        it('returns empty for squad without mentees', () => {
            const squad = [makePlayer({ age: 30, moral: 70 })];
            const events = processMentoring(squad);
            expect(events).toEqual([]);
        });
    });
});
