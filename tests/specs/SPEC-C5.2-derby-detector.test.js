/**
 * SPEC-C5.2: DerbyDetector harness
 */

import { describe, it, expect } from 'vitest';
import {
    getActiveRivals,
    isOpponentRival,
    findNextDerby,
    DERBY_THRESHOLD_MATCHES,
} from '../../src/engine/DerbyDetector.js';

const mockMatch = (clubAScore, clubBScore, week = 1) => ({ clubAScore, clubBScore, week, season: 1 });

const mockEngine = ({ rivalryHistory = {}, tournaments = [], currentWeek = 1 } = {}) => ({
    manager: { teamId: 1 },
    rivalryHistory,
    tournaments,
    currentWeek,
});

describe('SPEC-C5.2: DerbyDetector', () => {

    describe('getActiveRivals', () => {
        it('returns empty for empty rivalryHistory', () => {
            const engine = mockEngine();
            expect(getActiveRivals(engine)).toEqual([]);
        });

        it('lists rivals only for player team', () => {
            const engine = mockEngine({
                rivalryHistory: {
                    '1_2': [mockMatch(1, 0), mockMatch(0, 1), mockMatch(2, 2)],
                    '3_4': [mockMatch(1, 1)], // not player
                },
            });
            const rivals = getActiveRivals(engine);
            expect(rivals.length).toBe(1);
            expect(rivals[0].oppTeamId).toBe(2);
            expect(rivals[0].matchCount).toBe(3);
        });

        it('classifies levels correctly', () => {
            const make = (count) => Array(count).fill(mockMatch(1, 0));
            const engine = mockEngine({
                rivalryHistory: {
                    '1_5':  make(2),   // starting
                    '1_6':  make(4),   // growing
                    '1_7':  make(7),   // classic
                    '1_8':  make(11),  // consolidated
                },
            });
            const rivals = getActiveRivals(engine);
            const levels = rivals.reduce((acc, r) => { acc[r.oppTeamId] = r.level; return acc; }, {});
            expect(levels[5]).toBe('starting');
            expect(levels[6]).toBe('growing');
            expect(levels[7]).toBe('classic');
            expect(levels[8]).toBe('consolidated');
        });

        it('sorts by matchCount desc', () => {
            const engine = mockEngine({
                rivalryHistory: {
                    '1_5':  [mockMatch(1, 0)],
                    '1_10': Array(8).fill(mockMatch(1, 0)),
                    '1_3':  Array(3).fill(mockMatch(1, 0)),
                },
            });
            const rivals = getActiveRivals(engine);
            expect(rivals[0].matchCount).toBe(8);
            expect(rivals[2].matchCount).toBe(1);
        });

        it('null engine → empty array', () => {
            expect(getActiveRivals(null)).toEqual([]);
        });
    });

    describe('isOpponentRival', () => {
        it('threshold respected', () => {
            const engine = mockEngine({
                rivalryHistory: {
                    '1_2': Array(DERBY_THRESHOLD_MATCHES).fill(mockMatch(1, 0)),
                    '1_3': Array(DERBY_THRESHOLD_MATCHES - 1).fill(mockMatch(1, 0)),
                },
            });
            expect(isOpponentRival(engine, 2).isDerby).toBe(true);
            expect(isOpponentRival(engine, 3).isDerby).toBe(false);
        });

        it('unknown opp → not derby', () => {
            const engine = mockEngine();
            expect(isOpponentRival(engine, 99).isDerby).toBe(false);
        });
    });

    describe('findNextDerby', () => {
        it('finds derby in upcoming fixtures', () => {
            const engine = mockEngine({
                rivalryHistory: {
                    '1_2': Array(5).fill(mockMatch(1, 0)),
                },
                tournaments: [{
                    fixtures: {
                        3: [{ home: 1, away: 2 }],
                    },
                }],
                currentWeek: 2,
            });
            const found = findNextDerby(engine);
            expect(found).not.toBe(null);
            expect(found.oppTeamId).toBe(2);
            expect(found.week).toBe(3);
        });

        it('returns null when no derby in lookAhead window', () => {
            const engine = mockEngine({
                rivalryHistory: { '1_2': Array(5).fill(mockMatch(1, 0)) },
                tournaments: [{
                    fixtures: {
                        10: [{ home: 1, away: 2 }], // outside default lookAhead 6
                    },
                }],
                currentWeek: 1,
            });
            expect(findNextDerby(engine)).toBe(null);
        });

        it('returns null when no rivals at all', () => {
            const engine = mockEngine({
                tournaments: [{ fixtures: { 2: [{ home: 1, away: 5 }] } }],
                currentWeek: 1,
            });
            expect(findNextDerby(engine)).toBe(null);
        });

        it('ignores opponents below threshold', () => {
            const engine = mockEngine({
                rivalryHistory: { '1_2': [mockMatch(1, 0)] }, // only 1 match, below threshold
                tournaments: [{ fixtures: { 2: [{ home: 1, away: 2 }] } }],
                currentWeek: 1,
            });
            expect(findNextDerby(engine)).toBe(null);
        });

        it('null engine → null', () => {
            expect(findNextDerby(null)).toBe(null);
        });
    });

});
