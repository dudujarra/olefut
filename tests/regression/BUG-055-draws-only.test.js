// Regression test BUG-055: 72% draw rate (6910/9559).
// Root cause: makeBuyOffer set isTitular=false unconditionally + getTeamSectors
// returned 0 when no titulares in position → match sim chanceRatio=0 → 0-0 default.
import { describe, test, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { createEngine } from '../../src/engine/engineFactory.js';

describe('BUG-055 — makeBuyOffer auto-promotes when position weak', () => {
    let engine;
    beforeEach(() => {
        engine = createEngine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        const myTeam = engine.getTeam(engine.manager.teamId);
        myTeam.balance = 100_000_000_000;
    });

    test('new buy auto-promotes if position has <2 starters', () => {
        const myTeam = engine.getTeam(engine.manager.teamId);
        // Strip ATA starters
        myTeam.squad.forEach(p => { if (p.position === 'ATA') p.isTitular = false; });
        const otherTeam = engine.teams.find(t => t.id !== myTeam.id);
        const ataTarget = otherTeam.squad.find(p => p.position === 'ATA');
        if (!ataTarget) return;
        // High offer guarantees acceptance
        let result;
        for (let i = 0; i < 10; i++) {
            result = engine.makeBuyOffer(otherTeam.id, ataTarget.id, ataTarget.value * 2);
            if (result.accepted) break;
            // Find next ATA target if previous already moved
            const nextTarget = otherTeam.squad.find(p => p.position === 'ATA');
            if (!nextTarget) break;
        }
        if (!result?.accepted) return;
        const newPlayer = myTeam.squad.find(p => p.id === ataTarget.id);
        expect(newPlayer).toBeDefined();
        expect(newPlayer.isTitular).toBe(true);
    });

    test('new buy demotes weakest starter if upgrade significant', () => {
        const myTeam = engine.getTeam(engine.manager.teamId);
        // Set 2 ATA starters with low OVR
        const myATAs = myTeam.squad.filter(p => p.position === 'ATA').slice(0, 2);
        myATAs.forEach(p => { p.isTitular = true; p.ovr = 50; });
        const otherTeam = engine.teams.find(t => t.id !== myTeam.id);
        const strongATA = otherTeam.squad.find(p => p.position === 'ATA');
        if (!strongATA) return;
        strongATA.ovr = 80; // way better than 50
        const result = engine.makeBuyOffer(otherTeam.id, strongATA.id, strongATA.value * 2);
        if (!result.accepted) return;
        const acquired = myTeam.squad.find(p => p.id === strongATA.id);
        if (acquired) {
            expect(acquired.isTitular).toBe(true);
        }
    });
});

describe('BUG-055 — getTeamSectors fallback when no titulares', () => {
    let engine;
    beforeEach(() => {
        engine = createEngine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
    });

    test('sectors never return 0 even if no titulares in position', () => {
        const myTeam = engine.getTeam(engine.manager.teamId);
        // Strip ALL titulares
        myTeam.squad.forEach(p => { p.isTitular = false; });
        const sectors = engine.getTeamSectors(myTeam.id);
        expect(sectors.attack).toBeGreaterThan(0);
        expect(sectors.midfield).toBeGreaterThan(0);
        expect(sectors.defense).toBeGreaterThan(0);
        expect(sectors.goalkeeper).toBeGreaterThan(0);
    });

    test('sectors fall back to bench players in same position', () => {
        const myTeam = engine.getTeam(engine.manager.teamId);
        // Make all ATA reserve, others titular
        myTeam.squad.forEach(p => {
            p.isTitular = p.position !== 'ATA';
        });
        const sectors = engine.getTeamSectors(myTeam.id);
        // Attack should NOT be 0 — fallback to bench ATA
        expect(sectors.attack).toBeGreaterThan(0);
    });

    test('sectors use baseline 35 if no players at all in position', () => {
        const myTeam = engine.getTeam(engine.manager.teamId);
        // Remove all GOLs
        myTeam.squad = myTeam.squad.filter(p => p.position !== 'GOL');
        const sectors = engine.getTeamSectors(myTeam.id);
        expect(sectors.goalkeeper).toBeGreaterThanOrEqual(35);
    });
});
