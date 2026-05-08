/**
 * Regression test for BUG-021: engine.advanceWeek crash após restore from localStorage
 *
 * Root cause: Tournament class instances perdem prototype methods quando JSON.stringify'd
 * + JSON.parse'd. engine.tournaments[i].advanceWeek vira undefined.
 *
 * Fix: GameContext.jsx serializeEngine tags `__class`, restoreEngine re-attaches
 * prototype via Object.create(ClassConstructor.prototype) + property copy.
 *
 * Validação:
 * 1. Engine.tournaments após restore têm método advanceWeek
 * 2. League/KnockoutCup/ContinentalCup mantêm subclass identity
 * 3. SAVE_VERSION = 2 invalidates v1 broken saves
 */

import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '../..');

describe('BUG-021: Tournament prototype restoration', () => {
    test('GameContext.jsx imports tournament classes', () => {
        const file = path.join(projectRoot, 'src/context/GameContext.jsx');
        const c = fs.readFileSync(file, 'utf-8');
        expect(c).toMatch(/from '\.\.\/engine\/tournaments\/Tournament'/);
        expect(c).toMatch(/from '\.\.\/engine\/tournaments\/League'/);
        expect(c).toMatch(/from '\.\.\/engine\/tournaments\/KnockoutCup'/);
        expect(c).toMatch(/from '\.\.\/engine\/tournaments\/ContinentalCup'/);
    });

    test('SAVE_VERSION bumped to 2 (invalidates broken v1 saves)', () => {
        const file = path.join(projectRoot, 'src/context/GameContext.jsx');
        const c = fs.readFileSync(file, 'utf-8');
        expect(c).toMatch(/const SAVE_VERSION = 2/);
    });

    test('serializeEngine tags tournaments with __class', () => {
        const file = path.join(projectRoot, 'src/context/GameContext.jsx');
        const c = fs.readFileSync(file, 'utf-8');
        expect(c).toMatch(/__class:\s*t\?\.constructor\?\.name/);
    });

    test('restoreEngine re-attaches tournament prototype', () => {
        const file = path.join(projectRoot, 'src/context/GameContext.jsx');
        const c = fs.readFileSync(file, 'utf-8');
        expect(c).toMatch(/Object\.create\(ClassConstructor\.prototype\)/);
    });

    test('tournamentClassFromShape heuristics fallback', () => {
        const file = path.join(projectRoot, 'src/context/GameContext.jsx');
        const c = fs.readFileSync(file, 'utf-8');
        expect(c).toMatch(/typeof t\.level === 'number'.*League/s);
        expect(c).toMatch(/Array\.isArray\(t\.groupWeeks\).*ContinentalCup/s);
        expect(c).toMatch(/Array\.isArray\(t\.roundWeeks\).*KnockoutCup/s);
    });
});

describe('BUG-021: Engine + Tournament integration smoke', () => {
    test('Engine.advanceWeek exists on Engine.prototype', async () => {
        const { Engine } = await import('../../src/engine/engine.js');
        expect(typeof Engine.prototype.advanceWeek).toBe('function');
    });

    test('Tournament classes have advanceWeek method', async () => {
        const { Tournament } = await import('../../src/engine/tournaments/Tournament.js');
        const { League } = await import('../../src/engine/tournaments/League.js');
        const { KnockoutCup } = await import('../../src/engine/tournaments/KnockoutCup.js');
        const { ContinentalCup } = await import('../../src/engine/tournaments/ContinentalCup.js');

        expect(typeof Tournament.prototype.advanceWeek).toBe('function');
        expect(typeof League.prototype.advanceWeek).toBe('function');
        expect(typeof KnockoutCup.prototype.advanceWeek).toBe('function');
        expect(typeof ContinentalCup.prototype.advanceWeek).toBe('function');
    });

    test('Tournament prototype lost via plain JSON parse', async () => {
        const { League } = await import('../../src/engine/tournaments/League.js');
        const original = new League('TEST', 'Test League', 1);
        expect(typeof original.advanceWeek).toBe('function');

        // Simulate save/restore cycle
        const serialized = JSON.parse(JSON.stringify(original));
        // Without prototype restore, method is gone
        expect(typeof serialized.advanceWeek).toBe('undefined');

        // Fix simulation: re-attach prototype
        const restored = Object.create(League.prototype);
        for (const [k, v] of Object.entries(serialized)) restored[k] = v;
        expect(typeof restored.advanceWeek).toBe('function');
        expect(restored.id).toBe('TEST');
        expect(restored.name).toBe('Test League');
    });
});
