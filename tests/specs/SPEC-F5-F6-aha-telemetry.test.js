/**
 * SPEC-F5.2 + F6.1: AhaMoments + Telemetry harness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    evaluateAhaMoments,
    markAhaSeen,
    resetAhaSeen,
    AHA_TEMPLATES,
} from '../../src/engine/AhaMomentsSystem.js';
import * as Telemetry from '../../src/utils/telemetry.js';

describe('SPEC-F5.2: AhaMoments', () => {

    beforeEach(() => resetAhaSeen());

    it('trigger home_advantage at 5 matches', () => {
        const moments = evaluateAhaMoments({ matchesPlayed: 5 });
        const found = moments.find(m => m.id === 'aha_home_advantage');
        expect(found).toBeDefined();
        expect(found.title).toContain('VANTAGEM');
    });

    it('trigger first_injury when firstInjuryDetected true', () => {
        const moments = evaluateAhaMoments({ firstInjuryDetected: true });
        expect(moments.find(m => m.id === 'aha_first_injury')).toBeDefined();
    });

    it('low balance triggers finance warning', () => {
        const moments = evaluateAhaMoments({ balance: 5000 });
        expect(moments.find(m => m.id === 'aha_finance_warning')).toBeDefined();
    });

    it('seen ID not returned again', () => {
        markAhaSeen('aha_home_advantage');
        const moments = evaluateAhaMoments({ matchesPlayed: 5 });
        expect(moments.find(m => m.id === 'aha_home_advantage')).toBeUndefined();
    });

    it('at least 6 templates available', () => {
        expect(AHA_TEMPLATES.length).toBeGreaterThanOrEqual(6);
    });

    it('no triggers → empty array', () => {
        expect(evaluateAhaMoments({})).toEqual([]);
    });

    it('multiple triggers possible', () => {
        const moments = evaluateAhaMoments({ matchesPlayed: 5, firstInjuryDetected: true });
        expect(moments.length).toBeGreaterThanOrEqual(2);
    });
});

describe('SPEC-F6.1: Telemetry', () => {

    beforeEach(() => {
        Telemetry.setOptIn(false); // reset
        Telemetry.reset();
    });

    it('default opt-out', () => {
        expect(Telemetry.isOptedIn()).toBe(false);
    });

    it('event no-op when opt-out', () => {
        Telemetry.event('test_event');
        expect(Telemetry.aggregate()).toEqual({});
    });

    it('event records when opt-in', () => {
        Telemetry.setOptIn(true);
        Telemetry.event('match_played');
        const agg = Telemetry.aggregate();
        expect(agg.match_played).toBe(1);
    });

    it('multiple events same type counted', () => {
        Telemetry.setOptIn(true);
        Telemetry.event('view_opened', { view: 'market' });
        Telemetry.event('view_opened', { view: 'squad' });
        Telemetry.event('match_played');
        const agg = Telemetry.aggregate();
        expect(agg.view_opened).toBe(2);
        expect(agg.match_played).toBe(1);
    });

    it('opt-out clears data', () => {
        Telemetry.setOptIn(true);
        Telemetry.event('test');
        expect(Telemetry.aggregate().test).toBe(1);
        Telemetry.setOptIn(false);
        expect(Telemetry.aggregate()).toEqual({});
    });

    it('invalid type → no-op', () => {
        Telemetry.setOptIn(true);
        Telemetry.event(null);
        Telemetry.event('');
        Telemetry.event(42);
        expect(Telemetry.aggregate()).toEqual({});
    });

    it('raw events available with timestamps', () => {
        Telemetry.setOptIn(true);
        Telemetry.event('test', { foo: 'bar' });
        const raw = Telemetry.getRawEvents();
        expect(raw.length).toBe(1);
        expect(raw[0].type).toBe('test');
        expect(raw[0].payload.foo).toBe('bar');
        expect(typeof raw[0].ts).toBe('number');
    });

    it('FIFO cap at MAX_EVENTS', () => {
        Telemetry.setOptIn(true);
        for (let i = 0; i < 1500; i++) {
            Telemetry.event('spam');
        }
        const raw = Telemetry.getRawEvents();
        expect(raw.length).toBe(Telemetry.MAX_EVENTS);
    });
});
