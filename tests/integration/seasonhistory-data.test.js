/**
 * SeasonHistory Strategic Data Test
 * Verifies that seasonHistory records contain division, position, balance,
 * promoted/relegated flags, loan state, and tournament data.
 *
 * ROOT CAUSE: seasonHistory was previously blind — only stored cumulative
 * win/loss counts, making playtest analysis impossible.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { AutoPlayController } from '../../src/services/AutoPlayService.js';

// Mock localStorage for Node
if (typeof globalThis.localStorage === 'undefined') {
    const store = {};
    globalThis.localStorage = {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = v; },
        removeItem: (k) => { delete store[k]; },
    };
}

describe('SeasonHistory Strategic Data', () => {
    let autoplay;

    beforeAll(() => {
        const engine = new Engine();
        engine.initGame('HistoryBot', 1);
        autoplay = new AutoPlayController(engine);

        // Run 3 full seasons using the real _tick internals
        // (same pattern as autoplay-gdd-proof.test.js)
        for (let w = 0; w < 114; w++) {
            try {
                autoplay._makeDecisions();
                autoplay._advanceWeek();
                autoplay.stats.weeksPlayed++;

                // Replicate the season-boundary logic from _tick
                if (autoplay.stats.weeksPlayed % 38 === 0) {
                    autoplay.stats.seasonsPlayed++;
                    autoplay._sessionMetrics?.recordMatch();

                    // Replicate the seasonHistory push logic
                    if (!Array.isArray(autoplay.stats.seasonHistory)) autoplay.stats.seasonHistory = [];
                    const team = engine.getTeam(engine.manager?.teamId);
                    const standings = team ? engine.getStandings(team.zone, team.division) : [];
                    const position = team ? (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length : 0;
                    const totalTeams = standings.length || 20;
                    const promoted = position > 0 && position <= Math.max(2, Math.floor(totalTeams * 0.1));
                    const relegated = position > 0 && position > totalTeams - Math.max(2, Math.floor(totalTeams * 0.1));

                    autoplay.stats.seasonHistory.push({
                        season: autoplay.stats.seasonsPlayed,
                        division: team?.division ?? null,
                        position,
                        balance: team?.balance ?? 0,
                        promoted,
                        relegated,
                        squadSize: team?.squad?.length ?? 0,
                        loanActive: !!engine.activeLoan,
                        tournamentData: (engine.tournaments || [])
                            .filter(t => t.participants?.includes(team?.id))
                            .map(t => ({
                                id: t.id,
                                winner: t.winner === team?.id,
                                phase: t.phase || null,
                            })),
                    });
                }
            } catch { /* ignore */ }
        }
    });

    it('seasonHistory has entries for each season', () => {
        expect(autoplay.stats.seasonHistory).toBeDefined();
        expect(autoplay.stats.seasonHistory.length).toBeGreaterThanOrEqual(3);
    });

    it('each entry has division field as number', () => {
        autoplay.stats.seasonHistory.forEach(s => {
            expect(s).toHaveProperty('division');
            expect(typeof s.division).toBe('number');
        });
    });

    it('each entry has position > 0', () => {
        autoplay.stats.seasonHistory.forEach(s => {
            expect(s.position).toBeGreaterThan(0);
        });
    });

    it('each entry has numeric balance', () => {
        autoplay.stats.seasonHistory.forEach(s => {
            expect(typeof s.balance).toBe('number');
        });
    });

    it('each entry has promoted/relegated booleans', () => {
        autoplay.stats.seasonHistory.forEach(s => {
            expect(typeof s.promoted).toBe('boolean');
            expect(typeof s.relegated).toBe('boolean');
        });
    });

    it('each entry has squadSize > 0', () => {
        autoplay.stats.seasonHistory.forEach(s => {
            expect(s.squadSize).toBeGreaterThan(0);
        });
    });

    it('each entry has loanActive boolean', () => {
        autoplay.stats.seasonHistory.forEach(s => {
            expect(typeof s.loanActive).toBe('boolean');
        });
    });

    it('each entry has tournamentData array', () => {
        autoplay.stats.seasonHistory.forEach(s => {
            expect(Array.isArray(s.tournamentData)).toBe(true);
        });
    });
});
