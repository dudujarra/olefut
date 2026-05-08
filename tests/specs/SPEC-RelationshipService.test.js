/**
 * RelationshipService unit tests — AKITA-RFCT-008/009/010
 */

import { describe, test, expect } from 'vitest';
import { RelationshipService, RELATIONSHIP_RANGE, THRESHOLDS } from '../../src/services/RelationshipService.js';

describe('RelationshipService — vocabulário (SPEC-049 Camada 3)', () => {
    test('RELATIONSHIP_RANGE imutável', () => {
        expect(RELATIONSHIP_RANGE.MIN).toBe(-100);
        expect(RELATIONSHIP_RANGE.MAX).toBe(100);
        expect(Object.isFrozen(RELATIONSHIP_RANGE)).toBe(true);
    });

    test('THRESHOLDS imutável', () => {
        expect(THRESHOLDS.LOW).toBe(30);
        expect(THRESHOLDS.MID).toBe(60);
        expect(THRESHOLDS.HIGH).toBe(80);
        expect(Object.isFrozen(THRESHOLDS)).toBe(true);
    });
});

describe('RelationshipService — reads', () => {
    test('getRivalry retorna 0 default', () => {
        const svc = new RelationshipService();
        expect(svc.getRivalry({}, 1, 2)).toBe(0);
    });

    test('getRivalry symmetric (clubA-clubB === clubB-clubA)', () => {
        const svc = new RelationshipService();
        const save = {};
        svc.recordDerby(save, 1, 2);
        expect(svc.getRivalry(save, 1, 2)).toBe(svc.getRivalry(save, 2, 1));
    });

    test('getCoachReputation retorna default 60', () => {
        const svc = new RelationshipService();
        expect(svc.getCoachReputation({})).toBe(60);
    });

    test('getPresidentPatience retorna default 70', () => {
        const svc = new RelationshipService();
        expect(svc.getPresidentPatience({})).toBe(70);
    });
});

describe('RelationshipService — recordDerby', () => {
    test('derby normal +5 rivalry', () => {
        const svc = new RelationshipService();
        const save = {};
        svc.recordDerby(save, 1, 2);
        expect(svc.getRivalry(save, 1, 2)).toBe(5);
    });

    test('derby dramatic +10 rivalry', () => {
        const svc = new RelationshipService();
        const save = {};
        svc.recordDerby(save, 1, 2, { dramatic: true });
        expect(svc.getRivalry(save, 1, 2)).toBe(10);
    });

    test('múltiplos derbys acumulam até 100 max', () => {
        const svc = new RelationshipService();
        const save = {};
        for (let i = 0; i < 30; i++) {
            svc.recordDerby(save, 1, 2, { dramatic: true });
        }
        expect(svc.getRivalry(save, 1, 2)).toBe(100);
    });

    test('falha com clubId null', () => {
        const svc = new RelationshipService();
        const result = svc.recordDerby({}, null, 2);
        expect(result.success).toBe(false);
    });
});

describe('RelationshipService — recordTransfer', () => {
    test('transfer entre clubes sem rivalry: no-op (success mas sem mudança)', () => {
        const svc = new RelationshipService();
        const save = {};
        svc.recordTransfer(save, 99, 1, 2);
        expect(svc.getRivalry(save, 1, 2)).toBe(0);
    });

    test('transfer pra rival existente: +8 rivalry', () => {
        const svc = new RelationshipService();
        const save = {};
        // Buildup rivalry primeiro
        for (let i = 0; i < 8; i++) svc.recordDerby(save, 1, 2);
        const before = svc.getRivalry(save, 1, 2);
        svc.recordTransfer(save, 99, 1, 2);
        expect(svc.getRivalry(save, 1, 2)).toBe(before + 8);
    });

    test('mesmo clube: rejeita', () => {
        const svc = new RelationshipService();
        const result = svc.recordTransfer({}, 1, 1, 1);
        expect(result.success).toBe(false);
    });
});

describe('RelationshipService — decayRivalry', () => {
    test('decay aplica half-life', () => {
        const svc = new RelationshipService();
        const save = {};
        for (let i = 0; i < 10; i++) svc.recordDerby(save, 1, 2, { dramatic: true });
        const before = svc.getRivalry(save, 1, 2);

        // Decay 540 days (1 half-life)
        svc.decayRivalry(save, 540);
        const after = svc.getRivalry(save, 1, 2);
        expect(after).toBeLessThan(before);
        expect(after).toBeCloseTo(before / 2, 0);
    });

    test('decay não cai abaixo do floor quando inicialmente acima', () => {
        const svc = new RelationshipService();
        const save = {};
        // Buildup rivalry acima do floor (10)
        for (let i = 0; i < 10; i++) svc.recordDerby(save, 1, 2, { dramatic: true });
        expect(svc.getRivalry(save, 1, 2)).toBeGreaterThan(10);

        // Decay enormous (vários half-lives)
        svc.decayRivalry(save, 100000);
        expect(svc.getRivalry(save, 1, 2)).toBeGreaterThanOrEqual(10);
    });
});

describe('RelationshipService — manager↔presidente', () => {
    test('adjustTrust dentro range -100..+100', () => {
        const svc = new RelationshipService();
        const save = {};
        const r1 = svc.adjustTrust(save, 200); // overflow
        expect(r1.current).toBe(100);

        const save2 = {};
        const r2 = svc.adjustTrust(save2, -200);
        expect(r2.current).toBe(-100);
    });

    test('adjustPatience dentro range 0..100', () => {
        const svc = new RelationshipService();
        const save = {};
        const r1 = svc.adjustPatience(save, 200);
        expect(r1.current).toBe(100);

        const save2 = {};
        const r2 = svc.adjustPatience(save2, -200);
        expect(r2.current).toBe(0);
    });

    test('trust default 60, patience default 70', () => {
        const svc = new RelationshipService();
        const save = {};
        svc.adjustTrust(save, 0);
        svc.adjustPatience(save, 0);
        expect(save.relations.manager_president.trust).toBe(60);
        expect(save.relations.manager_president.patience).toBe(70);
    });
});
