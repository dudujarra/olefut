// SPEC-019: NPC AI harness
import { describe, test, expect, beforeEach } from 'vitest';
import { NPCAISystem, NPC_GOALS } from '../../src/engine/systems/NPCAISystem.js';

describe('SPEC-019: NPC AI System', () => {
    let ai;
    beforeEach(() => {
        ai = new NPCAISystem();
    });

    test('Goals defined', () => {
        expect(NPC_GOALS.title).toBeDefined();
        expect(NPC_GOALS.survival).toBeDefined();
    });

    test('Infer goal from ranking', () => {
        expect(ai.inferGoal({ ranking: 1, lastSeasonRanking: 2 })).toBe('title');
        expect(ai.inferGoal({ ranking: 20, lastSeasonRanking: 18 })).toBe('survival');
    });

    test('Set NPC goal', () => {
        ai.setNPCGoal(1, 'title');
        const decision = ai.weeklyDecision({ teamId: 1, weekOfYear: 5, ranking: 2, money: 50000000, results: {} });
        expect(decision.goal).toBe('title');
    });

    test('Bid mul respects goal', () => {
        ai.setNPCGoal(1, 'title');
        const bid = ai.getNPCBid({ teamId: 1, marketValue: 1000000 });
        expect(bid).toBeGreaterThanOrEqual(900000);
        expect(bid).toBeLessThanOrEqual(1100000);
    });

    test('3 losses trigger tactic change', () => {
        ai.setNPCGoal(1, 'renovation');
        ai.weeklyDecision({ teamId: 1, weekOfYear: 1, ranking: 10, money: 5e6, results: { lastResult: 'loss' } });
        ai.weeklyDecision({ teamId: 1, weekOfYear: 2, ranking: 10, money: 5e6, results: { lastResult: 'loss' } });
        const dec = ai.weeklyDecision({ teamId: 1, weekOfYear: 3, ranking: 10, money: 5e6, results: { lastResult: 'loss' } });
        const tacticChange = dec.decisions.find((d) => d.type === 'tactic_change');
        expect(tacticChange).toBeDefined();
    });

    test('Survival: sells stars', () => {
        ai.setNPCGoal(1, 'survival');
        const dec = ai.weeklyDecision({ teamId: 1, weekOfYear: 5, ranking: 20, money: 1e6, results: {} });
        const sell = dec.decisions.find((d) => d.target === 'sell_stars');
        expect(sell).toBeDefined();
    });

    test('Stadium upgrade only with cash', () => {
        const decPoor = ai.seasonDecision({ teamId: 1, finalRanking: 3, budget: 5e6 });
        const decRich = ai.seasonDecision({ teamId: 2, finalRanking: 3, budget: 50e6 });
        const upgradePoor = decPoor.decisions.find((d) => d.type === 'stadium_upgrade');
        const upgradeRich = decRich.decisions.find((d) => d.type === 'stadium_upgrade');
        expect(upgradePoor).toBeUndefined();
        expect(upgradeRich).toBeDefined();
    });

    test('Deterministic with seed', () => {
        ai.setSeed(42);
        const b1 = ai.getNPCBid({ teamId: 1, marketValue: 1000000 });
        ai.setSeed(42);
        const b2 = ai.getNPCBid({ teamId: 1, marketValue: 1000000 });
        expect(b1).toBe(b2);
    });

    test('Utility Scoring evaluates player based on weakness', () => {
        const player = { position: 'DEF', ovr: 75, age: 25, potential: 80 };
        const strongDefSectors = { defense: 85, midfield: 50 };
        const weakDefSectors = { defense: 50, midfield: 50 };
        
        const utilityStrong = ai.evaluatePlayerUtility(player, strongDefSectors, 70);
        const utilityWeak = ai.evaluatePlayerUtility(player, weakDefSectors, 70);
        
        expect(utilityWeak).toBeGreaterThan(utilityStrong);
    });
});
