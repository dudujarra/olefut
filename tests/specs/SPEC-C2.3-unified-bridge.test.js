/**
 * SPEC-C2.3: UnifiedModeBridge harness
 */

import { describe, it, expect } from 'vitest';
import {
    isUnifiedMode,
    buildProPlayerStub,
    getUnifiedView,
    applyPlayerCardEffectToStar,
} from '../../src/engine/UnifiedModeBridge.js';

const mockPlayer = (id, name, extra = {}) => ({
    id, name, position: 'ATA', ovr: 80, age: 24, energy: 90,
    seasonApps: 15, seasonGoals: 8, avgRating: 7.4, ...extra,
});

const mockEngine = ({ mode = 'manager', starPlayerId = null, squad = [] } = {}) => ({
    mode,
    starPlayerId,
    manager: { teamId: 1, name: 'Dudu', money: 100000 },
    getTeam: (id) => id === 1 ? { id: 1, name: 'Cruzeiro', squad } : null,
});

describe('SPEC-C2.3: UnifiedModeBridge', () => {

    describe('isUnifiedMode', () => {
        it('returns true when manager + star set + in squad', () => {
            const engine = mockEngine({ starPlayerId: 1, squad: [mockPlayer(1, 'Ronaldo')] });
            expect(isUnifiedMode(engine)).toBe(true);
        });

        it('returns false in player mode', () => {
            const engine = mockEngine({ mode: 'player', starPlayerId: 1, squad: [mockPlayer(1, 'X')] });
            expect(isUnifiedMode(engine)).toBe(false);
        });

        it('returns false without starPlayerId', () => {
            const engine = mockEngine({ squad: [mockPlayer(1, 'X')] });
            expect(isUnifiedMode(engine)).toBe(false);
        });

        it('returns false when star no longer in squad', () => {
            const engine = mockEngine({ starPlayerId: 999, squad: [mockPlayer(1, 'X')] });
            expect(isUnifiedMode(engine)).toBe(false);
        });

        it('null engine → false', () => {
            expect(isUnifiedMode(null)).toBe(false);
        });
    });

    describe('buildProPlayerStub', () => {
        it('maps squad player to ProPlayer-like interface', () => {
            const stub = buildProPlayerStub(mockPlayer(1, 'Pelé', { ovr: 95 }));
            expect(stub.name).toBe('Pelé');
            expect(stub.skills.technique).toBeGreaterThan(0);
            expect(stub.skills.pace).toBeGreaterThan(0);
            expect(stub._isStub).toBe(true);
        });

        it('preserves detailed attrs if present', () => {
            const player = mockPlayer(1, 'X', { technical: 88, attacking: 90 });
            const stub = buildProPlayerStub(player);
            expect(stub.skills.technique).toBe(88);
            expect(stub.skills.pace).toBe(90);
        });

        it('uses defaults for missing relationships', () => {
            const stub = buildProPlayerStub(mockPlayer(1, 'X'));
            expect(stub.relationships.boss).toBe(50);
            expect(stub.relationships.fans).toBe(50);
            expect(stub.relationships.teammates).toBe(50);
        });

        it('reads relationships from squad player when present', () => {
            const player = mockPlayer(1, 'X', { bossRel: 80, fansRel: 65 });
            const stub = buildProPlayerStub(player);
            expect(stub.relationships.boss).toBe(80);
            expect(stub.relationships.fans).toBe(65);
        });

        it('aggregates career stats', () => {
            const player = mockPlayer(1, 'X', { seasonGoals: 25, seasonApps: 38, careerGoals: 200, careerApps: 350 });
            const stub = buildProPlayerStub(player);
            expect(stub.careerGoals).toBe(200);
            expect(stub.seasonGoals).toBe(25);
        });

        it('null player → null stub', () => {
            expect(buildProPlayerStub(null)).toBe(null);
        });

        it('does not mutate source player', () => {
            const player = mockPlayer(1, 'X', { ovr: 80 });
            const before = { ...player };
            buildProPlayerStub(player);
            expect(player).toEqual(before);
        });
    });

    describe('getUnifiedView', () => {
        it('isUnified true when star elected', () => {
            const engine = mockEngine({ starPlayerId: 1, squad: [mockPlayer(1, 'X')] });
            const view = getUnifiedView(engine);
            expect(view.isUnified).toBe(true);
            expect(view.star).not.toBe(null);
        });

        it('returns manager info', () => {
            const engine = mockEngine({ starPlayerId: 1, squad: [mockPlayer(1, 'X')] });
            const view = getUnifiedView(engine);
            expect(view.manager.teamId).toBe(1);
            expect(view.manager.name).toBe('Dudu');
        });

        it('effectivePerspective = manager when classic', () => {
            const engine = mockEngine({ squad: [mockPlayer(1, 'X')] });
            const view = getUnifiedView(engine);
            expect(view.effectivePerspective).toBe('manager');
            expect(view.star).toBe(null);
        });

        it('null engine → safe default', () => {
            const view = getUnifiedView(null);
            expect(view.isUnified).toBe(false);
            expect(view.manager).toBe(null);
        });
    });

    describe('applyPlayerCardEffectToStar', () => {
        it('updates boss relationship via squadPlayer.bossRel', () => {
            const player = mockPlayer(1, 'X', { bossRel: 50 });
            const engine = mockEngine({ starPlayerId: 1, squad: [player] });
            const r = applyPlayerCardEffectToStar(engine, { boss: 10 });
            expect(r.applied).toBe(true);
            expect(player.bossRel).toBe(60);
            expect(r.changes.boss.before).toBe(50);
            expect(r.changes.boss.after).toBe(60);
        });

        it('clamps relationships 0-100', () => {
            const player = mockPlayer(1, 'X', { fansRel: 95 });
            const engine = mockEngine({ starPlayerId: 1, squad: [player] });
            applyPlayerCardEffectToStar(engine, { fans: 20 });
            expect(player.fansRel).toBe(100);
        });

        it('stress field updated', () => {
            const player = mockPlayer(1, 'X', { stress: 30 });
            const engine = mockEngine({ starPlayerId: 1, squad: [player] });
            applyPlayerCardEffectToStar(engine, { stress: 10 });
            expect(player.stress).toBe(40);
        });

        it('multiple effects in one call', () => {
            const player = mockPlayer(1, 'X', { bossRel: 50, fansRel: 50, teammatesRel: 50 });
            const engine = mockEngine({ starPlayerId: 1, squad: [player] });
            const r = applyPlayerCardEffectToStar(engine, { boss: 5, fans: 3, teammates: -2 });
            expect(player.bossRel).toBe(55);
            expect(player.fansRel).toBe(53);
            expect(player.teammatesRel).toBe(48);
            expect(Object.keys(r.changes).length).toBe(3);
        });

        it('no star → no-op', () => {
            const engine = mockEngine({ squad: [mockPlayer(1, 'X')] });
            const r = applyPlayerCardEffectToStar(engine, { boss: 5 });
            expect(r.applied).toBe(false);
        });

        it('null effect → no-op', () => {
            const engine = mockEngine({ starPlayerId: 1, squad: [mockPlayer(1, 'X')] });
            const r = applyPlayerCardEffectToStar(engine, null);
            expect(r.applied).toBe(false);
        });
    });

});
