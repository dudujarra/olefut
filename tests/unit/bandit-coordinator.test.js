/**
 * Unit tests for AutoPlayBanditCoordinator
 * AKITA-411: Top 10 unit test coverage
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AutoPlayBanditCoordinator } from '../../src/services/AutoPlayBanditCoordinator.js';

function makeParent(overrides = {}) {
    const team = {
        id: 1, name: 'Player FC', zone: 'SE', division: 2,
        balance: 2_000_000,
        squad: Array.from({ length: 15 }, (_, i) => ({
            id: i, name: `P${i}`, ovr: 60 + i, position: 'MEI',
            form: { value: 50 + i, trend: 0 },
        })),
    };

    const engine = {
        teams: [team],
        manager: { teamId: 1 },
        currentWeek: 15,
        managerStats: { streak: 0, rollingForm: [] },
        getTeam(id) { return this.teams.find(t => t.id === id); },
        getStandings() {
            return [
                { teamId: 99 }, { teamId: 98 }, { teamId: 1 },
                { teamId: 97 }, { teamId: 96 },
            ];
        },
    };

    return {
        engine,
        brain: {
            observe: () => {},
            emotions: {
                feedReward: () => {},
                getModifiers: () => ({ lossMod: 1.0 }),
            },
        },
        bandits: {
            teamTalk: { update: () => {} },
        },
        _lastStateKey: null,
        _lastAction: null,
        _lastMatchResult: null,
        _lastBalanceForReward: 2_000_000,
        _lastPositionForReward: 3,
        _lastDivisionForReward: 2,
        _lastMatchGoalsScored: 0,
        _lastMatchGoalsAllowed: 0,
        _lastMatchScoreDiff: 0,
        _lastBanditActions: null,
        ...overrides,
    };
}

describe('AutoPlayBanditCoordinator', () => {
    let coord;
    let parent;

    beforeEach(() => {
        parent = makeParent();
        coord = new AutoPlayBanditCoordinator(parent);
    });

    describe('banditContextKey()', () => {
        it('returns string with 3 pipe-separated dimensions', () => {
            const key = coord.banditContextKey();
            const parts = key.split('|');
            expect(parts.length).toBe(3);
        });

        it('position tiers map correctly', () => {
            // Position 3 → mid
            const key = coord.banditContextKey();
            expect(key).toMatch(/^(top4|mid|bottom|rele)\|/);
        });

        it('balance tiers map correctly', () => {
            parent.engine.getTeam(1).balance = 10_000_000;
            const key = coord.banditContextKey();
            expect(key).toContain('rich');
        });

        it('season phase tiers map correctly', () => {
            parent.engine.currentWeek = 5; // early
            let key = coord.banditContextKey();
            expect(key).toContain('early');

            parent.engine.currentWeek = 20; // mid
            key = coord.banditContextKey();
            expect(key).toContain('mid');

            parent.engine.currentWeek = 35; // late
            key = coord.banditContextKey();
            expect(key).toContain('late');
        });
    });

    describe('buildStateCtx()', () => {
        it('returns all required fields', () => {
            const ctx = coord.buildStateCtx();
            expect(ctx.position).toBeDefined();
            expect(ctx.totalTeams).toBeDefined();
            expect(ctx.balance).toBeDefined();
            expect(ctx.formAvg).toBeDefined();
            expect(ctx.week).toBeDefined();
            expect(ctx.squadSize).toBeDefined();
            expect(ctx.lastResult).toBeDefined();
            expect(ctx.lossStreak).toBeDefined();
            expect(ctx.division).toBeDefined();
        });

        it('computes correct position from standings', () => {
            const ctx = coord.buildStateCtx();
            expect(ctx.position).toBe(3); // index 2 + 1
        });

        it('handles missing team gracefully', () => {
            parent.engine.manager.teamId = 999;
            const ctx = coord.buildStateCtx();
            expect(ctx.position).toBe(20); // fallback
            expect(ctx.balance).toBe(0);
        });
    });

    describe('observeOutcome()', () => {
        it('does nothing without lastStateKey', () => {
            parent._lastStateKey = null;
            // Should not throw
            coord.observeOutcome(coord.buildStateCtx());
        });

        it('calls brain.observe when state exists', () => {
            let observeCalled = false;
            parent._lastStateKey = 'test';
            parent._lastAction = 'TACTIC_normal';
            parent.brain.observe = () => { observeCalled = true; };

            coord.observeOutcome(coord.buildStateCtx());
            expect(observeCalled).toBe(true);
        });

        it('feeds reward to emotions', () => {
            let feedCalled = false;
            parent._lastStateKey = 'test';
            parent._lastAction = 'TACTIC_normal';
            parent.brain.emotions.feedReward = () => { feedCalled = true; };

            coord.observeOutcome(coord.buildStateCtx());
            expect(feedCalled).toBe(true);
        });

        it('processes Thompson feedback when teamTalk action exists', () => {
            let updateCalled = false;
            parent._lastStateKey = 'test';
            parent._lastAction = 'TACTIC_normal';
            parent._lastBanditActions = {
                teamTalk: { ctxKey: 'test', action: 'motivational' },
            };
            parent.bandits.teamTalk.update = () => { updateCalled = true; };

            const ctx = coord.buildStateCtx();
            ctx.lastResult = 'W';
            coord.observeOutcome(ctx);
            expect(updateCalled).toBe(true);
            expect(parent._lastBanditActions.teamTalk).toBeNull(); // consumed
        });
    });
});
