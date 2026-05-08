/**
 * saveSerializer unit tests — AKITA-RFCT-007
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { register, serialize, deserialize, getRegisteredTypes, _clearRegistry } from '../../src/services/saveSerializer.js';

class MockTournament {
    constructor(id) {
        this.id = id;
    }
    advanceWeek() {
        return 'tournament-tick';
    }
}

class MockLeague extends MockTournament {
    constructor(id, level) {
        super(id);
        this.level = level;
    }
    isLeague() {
        return true;
    }
}

describe('saveSerializer (RFCT-007)', () => {
    beforeEach(() => {
        _clearRegistry();
    });

    test('register adds class to registry', () => {
        register('MockTournament', MockTournament);
        expect(getRegisteredTypes()).toContain('MockTournament');
    });

    test('serialize plain object preserves shape', () => {
        const obj = { a: 1, b: 'string', c: [1, 2, 3] };
        const result = serialize(obj);
        expect(result).toEqual(obj);
    });

    test('serialize tags class instances with __class', () => {
        register('MockTournament', MockTournament);
        const instance = new MockTournament('t1');
        const serialized = serialize(instance);
        expect(serialized.__class).toBe('MockTournament');
        expect(serialized.id).toBe('t1');
    });

    test('serialize skips functions', () => {
        const obj = { a: 1, fn: () => 'hi' };
        const result = serialize(obj);
        expect(result.fn).toBeUndefined();
        expect(result.a).toBe(1);
    });

    test('deserialize restores prototype from __class', () => {
        register('MockTournament', MockTournament);
        const instance = new MockTournament('t1');
        const json = JSON.stringify(serialize(instance));
        const restored = deserialize(JSON.parse(json));
        expect(typeof restored.advanceWeek).toBe('function');
        expect(restored.advanceWeek()).toBe('tournament-tick');
        expect(restored.id).toBe('t1');
    });

    test('deserialize handles unregistered class as plain object', () => {
        const data = { __class: 'Unregistered', x: 1 };
        const restored = deserialize(data);
        expect(restored.x).toBe(1);
        expect(restored.advanceWeek).toBeUndefined();
    });

    test('serialize + deserialize round-trip nested arrays of instances', () => {
        register('MockTournament', MockTournament);
        register('MockLeague', MockLeague);
        const data = {
            tournaments: [
                new MockTournament('a'),
                new MockLeague('b', 1)
            ]
        };
        const json = JSON.stringify(serialize(data));
        const restored = deserialize(JSON.parse(json));
        expect(restored.tournaments).toHaveLength(2);
        expect(typeof restored.tournaments[0].advanceWeek).toBe('function');
        expect(typeof restored.tournaments[1].advanceWeek).toBe('function');
        expect(restored.tournaments[1].isLeague()).toBe(true);
        expect(restored.tournaments[1].level).toBe(1);
    });

    test('handles null + undefined', () => {
        expect(serialize(null)).toBe(null);
        expect(serialize(undefined)).toBe(undefined);
        expect(deserialize(null)).toBe(null);
    });

    test('cycle protection (no infinite loop)', () => {
        const a = { name: 'a' };
        const b = { name: 'b', ref: a };
        a.ref = b; // cycle
        expect(() => serialize(a)).not.toThrow();
    });
});

describe('MythService writes (RFCT-007)', () => {
    test('addLegend appends to legends array', () => {
        const { MythService } = require('../../src/services/MythService.js');
        const svc = new MythService();
        const save = {};
        const result = svc.addLegend(save, 42, 'idoloEterno');
        expect(result.success).toBe(true);
        expect(save.myth.legends).toHaveLength(1);
        expect(save.myth.legends[0].playerId).toBe(42);
    });

    test('addLegend rejects invalid slot', async () => {
        const { MythService } = await import('../../src/services/MythService.js');
        const svc = new MythService();
        const result = svc.addLegend({}, 1, 'invalidSlot');
        expect(result.success).toBe(false);
    });

    test('addLegend prevents duplicate', async () => {
        const { MythService } = await import('../../src/services/MythService.js');
        const svc = new MythService();
        const save = {};
        svc.addLegend(save, 1, 'idoloEterno');
        const second = svc.addLegend(save, 1, 'idoloEterno');
        expect(second.success).toBe(false);
        expect(save.myth.legends).toHaveLength(1);
    });

    test('promoteToHallOfFame writes to club hall', async () => {
        const { MythService } = await import('../../src/services/MythService.js');
        const svc = new MythService();
        const save = {};
        const result = svc.promoteToHallOfFame(save, 42, 1, 'idoloEterno');
        expect(result.success).toBe(true);
        expect(save.myth.halls[1].idoloEterno).toBe(42);
    });

    test('promoteToHallOfFame replaces existing slot', async () => {
        const { MythService } = await import('../../src/services/MythService.js');
        const svc = new MythService();
        const save = {};
        svc.promoteToHallOfFame(save, 1, 1, 'idoloEterno');
        svc.promoteToHallOfFame(save, 99, 1, 'idoloEterno');
        expect(save.myth.halls[1].idoloEterno).toBe(99);
    });
});
