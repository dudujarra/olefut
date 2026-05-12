/**
 * SPEC-C2: StarPlayerLink harness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    electStarPlayer,
    getStarPlayer,
    getStarPlayerStats,
    applyToStarPlayer,
} from '../../src/engine/StarPlayerLink.js';

const mockPlayer = (id, name, extra = {}) => ({
    id, name, position: 'ATA', ovr: 80, age: 24, energy: 90, moral: 60,
    seasonApps: 15, seasonGoals: 8, avgRating: 7.4, ...extra,
});

const mockEngine = (squad = []) => ({
    starPlayerId: null,
    manager: { teamId: 1 },
    getTeam: (id) => id === 1 ? { id: 1, squad } : null,
});

describe('SPEC-C2: StarPlayerLink', () => {

    describe('electStarPlayer', () => {
        it('valid playerId in squad → success + set starPlayerId', () => {
            const engine = mockEngine([mockPlayer(10, 'Ronaldo')]);
            const r = electStarPlayer(engine, 10);
            expect(r.success).toBe(true);
            expect(engine.starPlayerId).toBe(10);
            expect(r.msg).toContain('Ronaldo');
        });

        it('player not in squad → fail, starPlayerId unchanged', () => {
            const engine = mockEngine([mockPlayer(10, 'Ronaldo')]);
            const r = electStarPlayer(engine, 999);
            expect(r.success).toBe(false);
            expect(engine.starPlayerId).toBe(null);
        });

        it('null playerId clears star', () => {
            const engine = mockEngine([mockPlayer(10, 'X')]);
            engine.starPlayerId = 10;
            const r = electStarPlayer(engine, null);
            expect(r.success).toBe(true);
            expect(engine.starPlayerId).toBe(null);
        });

        it('overwrites previous star', () => {
            const engine = mockEngine([mockPlayer(1, 'A'), mockPlayer(2, 'B')]);
            electStarPlayer(engine, 1);
            electStarPlayer(engine, 2);
            expect(engine.starPlayerId).toBe(2);
        });

        it('null engine → fail gracefully', () => {
            const r = electStarPlayer(null, 1);
            expect(r.success).toBe(false);
        });

        it('engine without team → fail', () => {
            const engine = { starPlayerId: null, manager: { teamId: 99 }, getTeam: () => null };
            const r = electStarPlayer(engine, 1);
            expect(r.success).toBe(false);
        });
    });

    describe('getStarPlayer', () => {
        it('returns player when starPlayerId set + in squad', () => {
            const engine = mockEngine([mockPlayer(5, 'Pelé')]);
            engine.starPlayerId = 5;
            const p = getStarPlayer(engine);
            expect(p?.name).toBe('Pelé');
        });

        it('returns null when starPlayerId unset', () => {
            const engine = mockEngine([mockPlayer(5, 'X')]);
            expect(getStarPlayer(engine)).toBe(null);
        });

        it('returns null when player no longer in squad (sold/retired)', () => {
            const engine = mockEngine([]);
            engine.starPlayerId = 999;
            expect(getStarPlayer(engine)).toBe(null);
        });

        it('null engine → null', () => {
            expect(getStarPlayer(null)).toBe(null);
        });
    });

    describe('getStarPlayerStats', () => {
        it('returns stats object for valid star', () => {
            const engine = mockEngine([mockPlayer(7, 'Garrincha', { ovr: 88, seasonGoals: 12 })]);
            engine.starPlayerId = 7;
            const s = getStarPlayerStats(engine);
            expect(s.name).toBe('Garrincha');
            expect(s.ovr).toBe(88);
            expect(s.goals).toBe(12);
        });

        it('null when no star', () => {
            const engine = mockEngine([]);
            expect(getStarPlayerStats(engine)).toBe(null);
        });
    });

    describe('applyToStarPlayer', () => {
        it('applies moralDelta with clamp 0-100', () => {
            const engine = mockEngine([mockPlayer(1, 'X', { moral: 95 })]);
            engine.starPlayerId = 1;
            applyToStarPlayer(engine, { moralDelta: 20 });
            expect(engine.getTeam(1).squad[0].moral).toBe(100);
        });

        it('applies energyDelta with clamp', () => {
            const engine = mockEngine([mockPlayer(1, 'X', { energy: 10 })]);
            engine.starPlayerId = 1;
            applyToStarPlayer(engine, { energyDelta: -20 });
            expect(engine.getTeam(1).squad[0].energy).toBe(0);
        });

        it('applies xpDelta no upper clamp', () => {
            const engine = mockEngine([mockPlayer(1, 'X', { xp: 50 })]);
            engine.starPlayerId = 1;
            applyToStarPlayer(engine, { xpDelta: 500 });
            expect(engine.getTeam(1).squad[0].xp).toBe(550);
        });

        it('xp clamped to >= 0', () => {
            const engine = mockEngine([mockPlayer(1, 'X', { xp: 10 })]);
            engine.starPlayerId = 1;
            applyToStarPlayer(engine, { xpDelta: -50 });
            expect(engine.getTeam(1).squad[0].xp).toBe(0);
        });

        it('returns changes object', () => {
            const engine = mockEngine([mockPlayer(1, 'X', { moral: 50 })]);
            engine.starPlayerId = 1;
            const r = applyToStarPlayer(engine, { moralDelta: 5 });
            expect(r.applied).toBe(true);
            expect(r.changes.moral.before).toBe(50);
            expect(r.changes.moral.after).toBe(55);
        });

        it('no-op when no star', () => {
            const engine = mockEngine([mockPlayer(1, 'X')]);
            const r = applyToStarPlayer(engine, { moralDelta: 5 });
            expect(r.applied).toBe(false);
        });

        it('null effect → no-op', () => {
            const engine = mockEngine([mockPlayer(1, 'X')]);
            engine.starPlayerId = 1;
            const r = applyToStarPlayer(engine, null);
            expect(r.applied).toBe(false);
        });
    });

    describe('engine init', () => {
        it('engine constructor sets starPlayerId null by default', async () => {
            // Smoke check engine field
            const { Engine } = await import('../../src/engine/engine.js');
            const e = new Engine();
            expect(e.starPlayerId).toBe(null);
        });
    });

});
