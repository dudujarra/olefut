/**
 * Monitor Auto Logger tests — v1.7
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { MonitorService, CATEGORIES } from '../../src/services/MonitorService.js';

class MockEngine {
    constructor() {
        this.currentWeek = 5;
        this.callCount = 0;
    }
    advanceWeek(arg) {
        this.callCount++;
        return { week: this.currentWeek++ };
    }
    setTactic(id) {
        this.callCount++;
        return id;
    }
    nonTracked() {
        return 'not logged';
    }
}

describe('MonitorService.instrumentEngine', () => {
    beforeEach(() => {
        MonitorService.getInstance().clear();
    });

    test('wraps tracked methods', () => {
        const m = MonitorService.getInstance();
        const eng = new MockEngine();
        m.instrumentEngine(eng);

        eng.advanceWeek();

        const entries = m.getByCategory(CATEGORIES.GAMEPLAY);
        expect(entries.some(e => e.action === 'ENGINE.advanceWeek')).toBe(true);
    });

    test('preserva return value', () => {
        const m = MonitorService.getInstance();
        const eng = new MockEngine();
        m.instrumentEngine(eng);

        const result = eng.advanceWeek();
        expect(result.week).toBe(5);
    });

    test('captura erro + re-throw', () => {
        const m = MonitorService.getInstance();
        const eng = {
            currentWeek: 1,
            advanceWeek() { throw new Error('engine fail'); }
        };
        m.instrumentEngine(eng);

        expect(() => eng.advanceWeek()).toThrow('engine fail');

        const bugs = m.getByCategory(CATEGORIES.BUG);
        expect(bugs.some(b => b.message?.includes('engine fail'))).toBe(true);
    });

    test('idempotente (não duplica wrap)', () => {
        const m = MonitorService.getInstance();
        const eng = new MockEngine();
        m.instrumentEngine(eng);
        m.instrumentEngine(eng);
        m.instrumentEngine(eng);

        eng.advanceWeek();
        const entries = m.getByCategory(CATEGORIES.GAMEPLAY);
        expect(entries.filter(e => e.action === 'ENGINE.advanceWeek').length).toBe(1);
    });

    test('tracks setTactic', () => {
        const m = MonitorService.getInstance();
        const eng = new MockEngine();
        m.instrumentEngine(eng);

        eng.setTactic('attacking');
        const entries = m.getByCategory(CATEGORIES.GAMEPLAY);
        expect(entries.some(e => e.action === 'ENGINE.setTactic')).toBe(true);
    });

    test('non-tracked methods não logam', () => {
        const m = MonitorService.getInstance();
        const eng = new MockEngine();
        m.instrumentEngine(eng);

        eng.nonTracked();
        const entries = m.getByCategory(CATEGORIES.GAMEPLAY);
        expect(entries.some(e => e.action === 'ENGINE.nonTracked')).toBe(false);
    });

    test('args são summarizadas', () => {
        const m = MonitorService.getInstance();
        const eng = new MockEngine();
        m.instrumentEngine(eng);

        eng.setTactic('attacking');
        const entries = m.getByCategory(CATEGORIES.GAMEPLAY);
        const log = entries.find(e => e.action === 'ENGINE.setTactic');
        expect(log.ctx.args).toContain('attacking');
    });

    test('elapsedMs registrado', () => {
        const m = MonitorService.getInstance();
        const eng = new MockEngine();
        m.instrumentEngine(eng);

        eng.advanceWeek();
        const entries = m.getByCategory(CATEGORIES.GAMEPLAY);
        const log = entries.find(e => e.action === 'ENGINE.advanceWeek');
        expect(typeof log.ctx.elapsedMs).toBe('number');
    });

    test('engine sem método tracked: skip silently', () => {
        const m = MonitorService.getInstance();
        const eng = { currentWeek: 0 }; // no methods
        expect(() => m.instrumentEngine(eng)).not.toThrow();
    });

    test('null/undefined engine: skip silently', () => {
        const m = MonitorService.getInstance();
        expect(() => m.instrumentEngine(null)).not.toThrow();
        expect(() => m.instrumentEngine(undefined)).not.toThrow();
    });
});

describe('MonitorService — _summarizeArg', () => {
    test('summarize primitives', () => {
        const m = MonitorService.getInstance();
        expect(m._summarizeArg(42)).toBe(42);
        expect(m._summarizeArg('text')).toBe('text');
        expect(m._summarizeArg(true)).toBe(true);
        expect(m._summarizeArg(null)).toBe(null);
        expect(m._summarizeArg(undefined)).toBe(null);
    });

    test('summarize array', () => {
        const m = MonitorService.getInstance();
        expect(m._summarizeArg([1, 2, 3])).toBe('[Array(3)]');
    });

    test('summarize object com id', () => {
        const m = MonitorService.getInstance();
        expect(m._summarizeArg({ id: 42, name: 'X' })).toBe('{id:42}');
    });

    test('summarize object sem id', () => {
        const m = MonitorService.getInstance();
        const result = m._summarizeArg({ a: 1, b: 2, c: 3 });
        expect(result).toContain('a');
    });
});
