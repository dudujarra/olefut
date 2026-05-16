// SPEC-001: Match Engine Simulation harness
import { describe, test, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { createEngine } from '../../src/engine/engineFactory.js';

describe('SPEC-001: Match Engine Simulation', () => {
    let engine;
    beforeEach(() => {
        engine = createEngine();
    });

    test('Engine instantiates with default state', () => {
        expect(engine.teams).toBeDefined();
        expect(engine.tournaments).toBeDefined();
        expect(engine.currentWeek).toBe(0);
    });

    test('Manager mode initializes state', () => {
        expect(engine.manager).toBeDefined();
        expect(engine.manager.salary).toBe(5000);
    });

    test('Manager stats initialized', () => {
        expect(engine.managerStats.wins).toBe(0);
        expect(engine.managerStats.draws).toBe(0);
        expect(engine.managerStats.losses).toBe(0);
    });

    test('Scouted players starts empty', () => {
        expect(engine.scoutedPlayers).toEqual([]);
    });

    test('Stadium level defaults to 1', () => {
        expect(engine.stadiumLevel).toBe(1);
    });

    test('Academy level defaults to 1', () => {
        expect(engine.academyLevel).toBe(1);
    });

    test('Season number starts at 1', () => {
        expect(engine.seasonNumber).toBe(1);
    });

    test('Current tactic defaults to normal', () => {
        expect(engine.currentTactic).toBe('normal');
    });
});
