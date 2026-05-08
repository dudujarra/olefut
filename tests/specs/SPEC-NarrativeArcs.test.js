/**
 * Narrative Arcs tests — AKITA-055 v1.4
 */

import { describe, test, expect } from 'vitest';
import { NARRATIVE_ARCS, ARCS_COUNT, getArc } from '../../src/data/narrativeArcs.js';
import { NarrativeService } from '../../src/services/NarrativeService.js';
import { RelationshipService } from '../../src/services/RelationshipService.js';

describe('Narrative Arcs — vocabulário', () => {
    test('ARCS_COUNT >= 6 (v1.4 MVP)', () => {
        expect(ARCS_COUNT).toBeGreaterThanOrEqual(6);
    });

    test('NARRATIVE_ARCS frozen (immutability)', () => {
        expect(Object.isFrozen(NARRATIVE_ARCS)).toBe(true);
    });

    test('todos arcs têm id único', () => {
        const ids = NARRATIVE_ARCS.map(a => a.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('todos arcs têm name + description + headline', () => {
        for (const arc of NARRATIVE_ARCS) {
            expect(typeof arc.name).toBe('string');
            expect(arc.name.length).toBeGreaterThan(0);
            expect(typeof arc.description).toBe('string');
            expect(typeof arc.headline).toBe('string');
        }
    });

    test('arcs canonicos presentes', () => {
        const names = NARRATIVE_ARCS.map(a => a.name);
        expect(names).toContain('A Maldição dos Aflitos');
        expect(names).toContain('Os Anos de Chumbo');
        expect(names).toContain('A Vingança Lenta');
        expect(names).toContain('A Sombra do Pai');
    });
});

describe('Narrative Arcs — getArc helper', () => {
    test('retorna arc por id', () => {
        const arc = getArc('arc_maldicao_aflitos');
        expect(arc).not.toBeNull();
        expect(arc.name).toBe('A Maldição dos Aflitos');
    });

    test('retorna null pra id inválido', () => {
        expect(getArc('nonexistent')).toBeNull();
    });
});

describe('NarrativeService.evaluateArcs — auto-trigger', () => {
    test('sem RelationshipService: zero opened', () => {
        const svc = new NarrativeService();
        expect(svc.evaluateArcs({}).opened).toBe(0);
    });

    test('rivalry < 70: não abre arc', () => {
        const relSvc = new RelationshipService();
        const svc = new NarrativeService({ relationshipService: relSvc });
        const save = {};
        relSvc.recordDerby(save, 1, 2, { dramatic: true }); // +10 só
        const result = svc.evaluateArcs(save);
        expect(result.opened).toBe(0);
    });

    test('rivalry >= 70: abre A Vingança Lenta', () => {
        const relSvc = new RelationshipService();
        const svc = new NarrativeService({ relationshipService: relSvc });
        const save = {};
        // Buildup rivalry to >=70
        for (let i = 0; i < 10; i++) relSvc.recordDerby(save, 1, 2, { dramatic: true });
        const result = svc.evaluateArcs(save);
        expect(result.opened).toBeGreaterThanOrEqual(1);
        expect(save.arcs.some(a => a.name === 'A Vingança Lenta')).toBe(true);
    });

    test('idempotente: re-rodar não duplica arc', () => {
        const relSvc = new RelationshipService();
        const svc = new NarrativeService({ relationshipService: relSvc });
        const save = {};
        for (let i = 0; i < 10; i++) relSvc.recordDerby(save, 1, 2, { dramatic: true });
        svc.evaluateArcs(save);
        const firstCount = save.arcs.length;
        svc.evaluateArcs(save);
        expect(save.arcs.length).toBe(firstCount);
    });
});
