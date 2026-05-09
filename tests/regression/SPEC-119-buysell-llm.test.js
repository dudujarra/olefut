// Regression test SPEC-119: LLMBridge buy/sell decision engine.
import { describe, test, expect, beforeEach } from 'vitest';
import { LLMBridge, decideBuyHeuristic, decideSellHeuristic } from '../../src/services/learning/LLMBridge.js';

describe('SPEC-119 — decideBuyHeuristic', () => {
    test('buys when position weak + affordable + upgrade', () => {
        const team = {
            balance: 100_000_000,
            squad: [
                { position: 'ATA', ovr: 50 },
                { position: 'ATA', ovr: 55 }
            ]
        };
        const offer = { player: { position: 'ATA', ovr: 70 }, amount: 10_000_000 };
        const decision = decideBuyHeuristic(team, offer);
        expect(decision.buy).toBe(true);
        expect(decision.source).toBe('heuristic');
    });

    test('rejects when position strong already', () => {
        const team = {
            balance: 100_000_000,
            squad: [
                { position: 'ATA', ovr: 80 },
                { position: 'ATA', ovr: 78 }
            ]
        };
        const offer = { player: { position: 'ATA', ovr: 75 }, amount: 5_000_000 };
        const decision = decideBuyHeuristic(team, offer);
        expect(decision.buy).toBe(false);
    });

    test('rejects when not affordable', () => {
        const team = {
            balance: 1_000_000,
            squad: [{ position: 'ATA', ovr: 50 }]
        };
        const offer = { player: { position: 'ATA', ovr: 75 }, amount: 50_000_000 };
        const decision = decideBuyHeuristic(team, offer);
        expect(decision.buy).toBe(false);
    });

    test('rejects when offer not upgrade', () => {
        const team = {
            balance: 100_000_000,
            squad: [{ position: 'ATA', ovr: 55 }]
        };
        const offer = { player: { position: 'ATA', ovr: 56 }, amount: 1_000_000 };
        const decision = decideBuyHeuristic(team, offer);
        expect(decision.buy).toBe(false);
    });

    test('handles invalid input gracefully', () => {
        expect(decideBuyHeuristic(null, null).buy).toBe(false);
        expect(decideBuyHeuristic({}, {}).buy).toBe(false);
    });
});

describe('SPEC-119 — decideSellHeuristic', () => {
    test('sells reserve when overpay', () => {
        const team = {
            squad: [{ position: 'DEF', isTitular: false }]
        };
        const offer = {
            player: { position: 'DEF', isTitular: false, age: 26, value: 1_000_000 },
            amount: 2_000_000
        };
        const decision = decideSellHeuristic(team, offer);
        expect(decision.sell).toBe(true);
    });

    test('sells old player from deep position', () => {
        const team = {
            squad: Array(6).fill({ position: 'MEI', isTitular: true })
        };
        const offer = {
            player: { position: 'MEI', age: 35, isTitular: true, value: 1_000_000 },
            amount: 1_000_000
        };
        const decision = decideSellHeuristic(team, offer);
        expect(decision.sell).toBe(true);
    });

    test('keeps when no good reason', () => {
        const team = {
            squad: [{ position: 'GOL', isTitular: true }]
        };
        const offer = {
            player: { position: 'GOL', isTitular: true, age: 25, value: 5_000_000 },
            amount: 1_000_000
        };
        const decision = decideSellHeuristic(team, offer);
        expect(decision.sell).toBe(false);
    });
});

describe('SPEC-119 — LLMBridge', () => {
    let bridge;
    beforeEach(() => {
        const store = {};
        global.localStorage = {
            getItem: (k) => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: (k) => { delete store[k]; }
        };
        bridge = new LLMBridge();
    });

    test('default mode is heuristic', () => {
        expect(bridge.mode).toBe('heuristic');
    });

    test('init() noop for heuristic mode', async () => {
        await bridge.init();
        expect(bridge.modelReady).toBe(false);
    });

    test('decideBuy uses heuristic when not webllm-ready', async () => {
        const team = { balance: 100_000_000, squad: [{ position: 'ATA', ovr: 50 }] };
        const offer = { player: { position: 'ATA', ovr: 70 }, amount: 10_000_000 };
        const decision = await bridge.decideBuy(team, offer);
        expect(decision.source).toBe('heuristic');
        expect(decision.buy).toBe(true);
    });

    test('setMode persists', () => {
        bridge.setMode('webllm');
        expect(bridge.mode).toBe('webllm');
        const fresh = new LLMBridge();
        expect(fresh.mode).toBe('webllm');
    });

    test('init() falls back when no WebGPU', async () => {
        bridge.setMode('webllm');
        // navigator.gpu undefined in test env
        await bridge.init();
        expect(bridge.modelReady).toBe(false);
    });

    test('status returns mode + loadStatus', () => {
        const s = bridge.status();
        expect(s.mode).toBeDefined();
        expect(s.loadStatus).toBeDefined();
    });
});
