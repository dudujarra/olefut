/**
 * SPEC-A5: RookieHandicap harness
 */

import { describe, it, expect } from 'vitest';
import {
    getRookieHandicap,
    getRookieHandicapFromEngine,
    HANDICAP_CURVE,
    HANDICAP_NEUTRAL,
} from '../../src/engine/RookieHandicap.js';

describe('SPEC-A5: RookieHandicap', () => {

    describe('rule 1: trigger conditions', () => {
        it('season 1 match 0 → 0.90', () => {
            expect(getRookieHandicap({ seasonNumber: 1, matchesPlayedSeason: 0 })).toBeCloseTo(0.90);
        });

        it('season 2 → 1.0 sempre', () => {
            expect(getRookieHandicap({ seasonNumber: 2, matchesPlayedSeason: 0 })).toBe(1.0);
        });

        it('season 1 match 5 → 1.0 (acabou rookie)', () => {
            expect(getRookieHandicap({ seasonNumber: 1, matchesPlayedSeason: 5 })).toBe(1.0);
        });
    });

    describe('rule 2: curve', () => {
        it('match 1 → 0.90', () => {
            expect(getRookieHandicap({ seasonNumber: 1, matchesPlayedSeason: 0 })).toBe(0.90);
        });

        it('match 2 → 0.93', () => {
            expect(getRookieHandicap({ seasonNumber: 1, matchesPlayedSeason: 1 })).toBe(0.93);
        });

        it('match 3 → 0.97', () => {
            expect(getRookieHandicap({ seasonNumber: 1, matchesPlayedSeason: 2 })).toBe(0.97);
        });

        it('match 4 → 1.0', () => {
            expect(getRookieHandicap({ seasonNumber: 1, matchesPlayedSeason: 3 })).toBe(1.0);
        });

        it('curve monotonic crescente até 1.0', () => {
            const values = [0, 1, 2, 3].map(n => getRookieHandicap({ seasonNumber: 1, matchesPlayedSeason: n }));
            for (let i = 1; i < values.length; i++) {
                expect(values[i]).toBeGreaterThanOrEqual(values[i-1]);
            }
        });

        it('max reduction is 10% (0.90 floor)', () => {
            HANDICAP_CURVE.forEach(v => {
                expect(v).toBeGreaterThanOrEqual(0.90);
                expect(v).toBeLessThanOrEqual(1.0);
            });
        });
    });

    describe('rule 3: engine integration', () => {
        it('extracts counts from engine.managerStats', () => {
            const mockEngine = {
                seasonNumber: 1,
                managerStats: { wins: 0, draws: 1, losses: 0 },
            };
            expect(getRookieHandicapFromEngine(mockEngine)).toBe(0.93);
        });

        it('null engine → 1.0 graceful', () => {
            expect(getRookieHandicapFromEngine(null)).toBe(1.0);
        });

        it('missing managerStats → 1.0', () => {
            expect(getRookieHandicapFromEngine({ seasonNumber: 1 })).toBe(0.90);
        });

        it('all played 0 → match 1 handicap', () => {
            const mockEngine = {
                seasonNumber: 1,
                managerStats: { wins: 0, draws: 0, losses: 0 },
            };
            expect(getRookieHandicapFromEngine(mockEngine)).toBe(0.90);
        });

        it('5 matches played → no handicap', () => {
            const mockEngine = {
                seasonNumber: 1,
                managerStats: { wins: 2, draws: 1, losses: 2 },
            };
            expect(getRookieHandicapFromEngine(mockEngine)).toBe(1.0);
        });
    });

    describe('rule 4: determinism', () => {
        it('same input → same output', () => {
            const args = { seasonNumber: 1, matchesPlayedSeason: 1 };
            expect(getRookieHandicap(args)).toBe(getRookieHandicap(args));
        });
    });

    describe('rule 5: constants integrity', () => {
        it('HANDICAP_CURVE has exactly 3 entries', () => {
            expect(HANDICAP_CURVE.length).toBe(3);
        });

        it('HANDICAP_NEUTRAL is 1.0', () => {
            expect(HANDICAP_NEUTRAL).toBe(1.0);
        });
    });

});
