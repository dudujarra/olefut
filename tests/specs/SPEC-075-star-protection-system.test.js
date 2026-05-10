import { describe, test, expect, beforeEach } from 'vitest';
import { protect, getProtected, revoke, onBoardSellAttempt, computeState, generateNarrativeEvents } from '../../src/engine/StarProtectionSystem.js';

const MID = 100; // use unique managerId per test via beforeEach offset

describe('SPEC-075: Star Player Protection', () => {
    let mid;

    beforeEach(() => {
        mid = Math.floor(Math.random() * 900000) + 100000;
    });

    test('protect sets active protection', () => {
        protect({ managerId: mid, playerId: 10, playerName: 'Neymar' });
        const p = getProtected(mid);
        expect(p.protectedPlayerId).toBe(10);
        expect(p.active).toBe(true);
    });

    test('only 1 protected player at a time', () => {
        protect({ managerId: mid, playerId: 10 });
        expect(() => protect({ managerId: mid, playerId: 20 })).toThrow('AlreadyProtecting');
    });

    test('public declaration creates press event', () => {
        const result = protect({ managerId: mid, playerId: 10, publicDeclaration: true });
        expect(result.pressEvent).toBeDefined();
        expect(result.pressEvent.type).toBe('manager_protects_player');
    });

    test('board sell attempt → tensionDelta -30', () => {
        protect({ managerId: mid, playerId: 10 });
        const event = onBoardSellAttempt({ managerId: mid, playerId: 10 });
        expect(event.tensionDelta).toBe(-30);
    });

    test('board sell non-protected → null', () => {
        protect({ managerId: mid, playerId: 10 });
        const event = onBoardSellAttempt({ managerId: mid, playerId: 99 });
        expect(event).toBeNull();
    });

    test('narrativeState hero when avgRating ≥ 7.5 and 5+ games', () => {
        const state = computeState({ performanceSince: { games: 6, avgRating: 7.8 } });
        expect(state.narrativeState).toBe('hero');
    });

    test('narrativeState villain when avgRating < 6 and 5+ games', () => {
        const state = computeState({ performanceSince: { games: 6, avgRating: 5.5 } });
        expect(state.narrativeState).toBe('villain');
    });

    test('narrativeState neutral when < 5 games', () => {
        const state = computeState({ performanceSince: { games: 3, avgRating: 9.0 } });
        expect(state.narrativeState).toBe('neutral');
    });

    test('hero generates positive press event', () => {
        const events = generateNarrativeEvents({ narrativeState: 'hero', playerName: 'Pelé' });
        expect(events.some(e => e.sentiment === 'positive')).toBe(true);
    });

    test('revoke removes protection', () => {
        protect({ managerId: mid, playerId: 10 });
        const r = revoke({ managerId: mid });
        expect(r.narrativeEvent.type).toBe('manager_revoked_protection');
        expect(getProtected(mid)).toBeNull();
    });

    test('protect injured player 8+ weeks throws', () => {
        expect(() => protect({ managerId: mid, playerId: 10, injuryWeeksLeft: 9 })).toThrow('PlayerUnavailableLongTerm');
    });

    test('protect injured player ≤8 weeks is ok', () => {
        expect(() => protect({ managerId: mid, playerId: 10, injuryWeeksLeft: 8 })).not.toThrow();
    });
});
