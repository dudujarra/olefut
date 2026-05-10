import { describe, test, expect } from 'vitest';
import { canAccess, persistUnlock, evaluateNewUnlocks, CORE_VIEWS } from '../../src/engine/ViewUnlockSystem';

const empty = { seasonsCompleted: 0, titlesWon: 0, totalTransfers: 0, managerReputation: 0, unlockedViews: [] };

describe('SPEC-135: ViewUnlockSystem', () => {
    test('core views always accessible', () => {
        [...CORE_VIEWS].forEach(viewId => {
            expect(canAccess(viewId, empty).unlocked).toBe(true);
        });
    });

    test('academy locked until season 2', () => {
        expect(canAccess('academy', { ...empty, seasonsCompleted: 1 }).unlocked).toBe(false);
        expect(canAccess('academy', { ...empty, seasonsCompleted: 2 }).unlocked).toBe(true);
    });

    test('trophy_room locked until first title', () => {
        expect(canAccess('trophy_room', { ...empty, titlesWon: 0 }).unlocked).toBe(false);
        expect(canAccess('trophy_room', { ...empty, titlesWon: 1 }).unlocked).toBe(true);
    });

    test('blocked view returns unlockCondition with progress 0-100', () => {
        const r = canAccess('analytics', { ...empty, titlesWon: 0 });
        expect(r.unlocked).toBe(false);
        expect(r.unlockCondition).toBeDefined();
        expect(r.unlockCondition.progress).toBeGreaterThanOrEqual(0);
        expect(r.unlockCondition.progress).toBeLessThanOrEqual(100);
        expect(r.unlockCondition.description).toBeTruthy();
    });

    test('scouting progress = 50% at 5 transfers (needs 10)', () => {
        const r = canAccess('scouting', { ...empty, totalTransfers: 5 });
        expect(r.unlockCondition.progress).toBe(50);
    });

    test('persistUnlock makes view accessible permanently', () => {
        let state = { ...empty };
        state = persistUnlock('academy', state);
        // Even with 0 seasons, should be unlocked via persisted list
        expect(canAccess('academy', state).unlocked).toBe(true);
    });

    test('persistUnlock does not duplicate entries', () => {
        let state = { ...empty };
        state = persistUnlock('academy', state);
        state = persistUnlock('academy', state);
        expect(state.unlockedViews.filter(v => v === 'academy').length).toBe(1);
    });

    test('coverage ≥ 10/16 after 3 seasons + 1 title + 12 transfers + rep 45', () => {
        const richState = { seasonsCompleted: 3, titlesWon: 1, totalTransfers: 12, managerReputation: 45, unlockedViews: [] };
        const allViews = [...CORE_VIEWS, 'academy', 'analytics', 'trophy_room', 'scouting', 'media_center', 'rivals', 'board_room', 'youth_watch', 'start', 'autoplay', 'matchView'];
        const unlocked = allViews.filter(v => canAccess(v, richState).unlocked);
        expect(unlocked.length).toBeGreaterThanOrEqual(10);
    });

    test('evaluateNewUnlocks finds newly met conditions', () => {
        const state = { seasonsCompleted: 2, titlesWon: 0, totalTransfers: 0, managerReputation: 0, unlockedViews: [] };
        const newUnlocks = evaluateNewUnlocks(state);
        // academy requires seasons ≥ 2, rivals requires ≥ 1 — both should appear
        expect(newUnlocks.length).toBeGreaterThanOrEqual(1);
    });
});
