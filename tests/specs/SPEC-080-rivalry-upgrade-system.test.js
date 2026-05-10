import { describe, test, expect } from 'vitest';
import { evaluate, markCritical } from '../../src/engine/RivalryUpgradeSystem.js';

const mkMatch = (aScore, bScore, isDecisive = false) => ({ clubAScore: aScore, clubBScore: bScore, isDecisive });

describe('SPEC-080: Rivalry Upgrade System', () => {

    test('no history → rivalryScore 0', () => {
        const result = evaluate({ clubAId: 1, clubBId: 2, history: [] });
        expect(result.rivalryScore).toBe(0);
        expect(result.criticalCount).toBe(0);
    });

    test('criticalCount counts only decisive matches', () => {
        const history = [mkMatch(2,1,true), mkMatch(1,2,false), mkMatch(0,0,true)];
        const result = evaluate({ clubAId: 1, clubBId: 2, history });
        expect(result.criticalCount).toBe(2);
    });

    test('rivalryScore increases with total matches', () => {
        const h10 = Array(10).fill(mkMatch(1,0));
        const h20 = Array(20).fill(mkMatch(1,0));
        const r10 = evaluate({ clubAId: 1, clubBId: 2, history: h10 });
        const r20 = evaluate({ clubAId: 1, clubBId: 2, history: h20 });
        expect(r20.rivalryScore).toBeGreaterThan(r10.rivalryScore);
    });

    test('namedRivalry true when rivalryScore ≥ 40', () => {
        const history = Array(10).fill(mkMatch(1,0)); // 10*4=40
        const result = evaluate({ clubAId: 1, clubBId: 2, history });
        expect(result.namedRivalry).toBe(true);
    });

    test('classico_eterno arc at 10+ balanced matches', () => {
        // Mix wins/losses so no dominance triggers
        const history = [...Array(5).fill(mkMatch(1,0)), ...Array(5).fill(mkMatch(0,1))];
        const result = evaluate({ clubAId: 1, clubBId: 2, history });
        expect(result.activeArc?.id).toBe('classico_eterno');
    });

    test('batalha_das_geracoes arc at 20+ balanced matches', () => {
        const history = [...Array(10).fill(mkMatch(1,0)), ...Array(10).fill(mkMatch(0,1))];
        const result = evaluate({ clubAId: 1, clubBId: 2, history });
        expect(result.activeArc?.id).toBe('batalha_das_geracoes');
    });

    test('dominio_absoluto when one side wins 70%+ (fewer than 10 matches)', () => {
        // 8 matches: A wins 7, B wins 1 → A winRate 0.875 ≥ 0.7
        const history = [...Array(7).fill(mkMatch(3,0)), mkMatch(0,1)];
        const result = evaluate({ clubAId: 1, clubBId: 2, history });
        expect(result.activeArc?.id).toBe('dominio_absoluto');
    });

    test('confronto_titulo when both in title race', () => {
        const result = evaluate({ clubAId: 1, clubBId: 2, history: Array(5).fill(mkMatch(1,0)), bothInTitleRace: true });
        expect(result.activeArc?.id).toBe('confronto_titulo');
    });

    test('h2h stats are correct', () => {
        const history = [mkMatch(2,1), mkMatch(0,1), mkMatch(1,1)];
        const result = evaluate({ clubAId: 1, clubBId: 2, history });
        expect(result.h2h.aWins).toBe(1);
        expect(result.h2h.bWins).toBe(1);
        expect(result.h2h.draws).toBe(1);
    });

    test('markCritical sets isDecisive=true', () => {
        const m = markCritical({ clubAScore: 2, clubBScore: 1 });
        expect(m.isDecisive).toBe(true);
    });
});
