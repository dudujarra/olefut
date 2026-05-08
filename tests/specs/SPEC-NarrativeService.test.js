/**
 * NarrativeService unit tests — AKITA-RFCT-011/012/013 collapsed
 */

import { describe, test, expect } from 'vitest';
import { NarrativeService } from '../../src/services/NarrativeService.js';
import { MythService } from '../../src/services/MythService.js';
import { RelationshipService } from '../../src/services/RelationshipService.js';
import { EVENT_TYPES } from '../../src/data/eventTypes.js';
import { EVENT_TAGS } from '../../src/data/eventTags.js';

describe('NarrativeService — Camada 1 AGENTE', () => {
    test('recordDecision adiciona em decisions', () => {
        const svc = new NarrativeService();
        const save = {};
        const result = svc.recordDecision(save, 'TACTIC_CHANGED', { from: 'normal', to: 'attacking' });
        expect(result.success).toBe(true);
        expect(save.decisions).toHaveLength(1);
        expect(save.decisions[0].type).toBe('TACTIC_CHANGED');
    });

    test('getDecisions retorna copy', () => {
        const svc = new NarrativeService();
        const save = { decisions: [{ id: 1 }] };
        const result = svc.getDecisions(save);
        result.push({ fake: true });
        expect(save.decisions).toHaveLength(1);
    });
});

describe('NarrativeService — Camada 2 EVENTUAL', () => {
    test('appendEvent rejeita tipo inválido', () => {
        const svc = new NarrativeService();
        const result = svc.appendEvent({}, 'INVALID_TYPE', {});
        expect(result.success).toBe(false);
    });

    test('appendEvent rejeita tags inválidas', () => {
        const svc = new NarrativeService();
        const result = svc.appendEvent({}, EVENT_TYPES.TITLE_WON, { tags: ['invalid_tag'] });
        expect(result.success).toBe(false);
    });

    test('appendEvent aceita tags válidas', () => {
        const svc = new NarrativeService();
        const save = {};
        const result = svc.appendEvent(save, EVENT_TYPES.TITLE_WON, {
            tags: [EVENT_TAGS.TITULO, EVENT_TAGS.EPICO]
        });
        expect(result.success).toBe(true);
        expect(save.events).toHaveLength(1);
    });

    test('appendEvent attribui half-life baseado no tipo', () => {
        const svc = new NarrativeService();
        const save = {};
        svc.appendEvent(save, EVENT_TYPES.TITLE_WON);
        expect(save.events[0].decay.halfLifeDays).toBe(1095);
        expect(save.events[0].decay.floor).toBe(0.20);
    });

    test('getDecayedEvents aplica decay sobre intensity', () => {
        const svc = new NarrativeService();
        const save = {};
        const oldTs = Date.now() - (1095 * 24 * 60 * 60 * 1000); // 1 half-life ago
        svc.appendEvent(save, EVENT_TYPES.TITLE_WON, { intensity: 100, ts: oldTs });

        const decayed = svc.getDecayedEvents(save);
        expect(decayed[0].currentIntensity).toBeLessThan(100);
        expect(decayed[0].currentIntensity).toBeCloseTo(50, 0);
    });

    test('getDecayedEvents respeita floor', () => {
        const svc = new NarrativeService();
        const save = {};
        const veryOldTs = 0; // forever ago
        svc.appendEvent(save, EVENT_TYPES.TITLE_WON, { intensity: 100, ts: veryOldTs });

        const decayed = svc.getDecayedEvents(save);
        // floor 0.20 * intensity 100 = 20 mínimo
        expect(decayed[0].currentIntensity).toBeGreaterThanOrEqual(20);
    });

    test('queryEvents filtra por tipo', () => {
        const svc = new NarrativeService();
        const save = {};
        svc.appendEvent(save, EVENT_TYPES.TITLE_WON);
        svc.appendEvent(save, EVENT_TYPES.PLAYER_RED_CARD);

        const results = svc.queryEvents(save, { type: EVENT_TYPES.TITLE_WON });
        expect(results).toHaveLength(1);
    });

    test('queryEvents filtra por tag', () => {
        const svc = new NarrativeService();
        const save = {};
        svc.appendEvent(save, EVENT_TYPES.TITLE_WON, { tags: [EVENT_TAGS.EPICO] });
        svc.appendEvent(save, EVENT_TYPES.PLAYER_RED_CARD, { tags: [EVENT_TAGS.VERGONHA] });

        const results = svc.queryEvents(save, { tag: EVENT_TAGS.EPICO });
        expect(results).toHaveLength(1);
    });
});

describe('NarrativeService — Camada 3 RELACIONAL integration', () => {
    test('getRelationalContext null sem RelationshipService', () => {
        const svc = new NarrativeService();
        expect(svc.getRelationalContext({}, 1, 2)).toBeNull();
    });

    test('getRelationalContext consulta RelationshipService injected', () => {
        const relSvc = new RelationshipService();
        const save = {};
        relSvc.recordDerby(save, 1, 2, { dramatic: true });

        const narSvc = new NarrativeService({ relationshipService: relSvc });
        const ctx = narSvc.getRelationalContext(save, 1, 2);
        expect(ctx.rivalry).toBe(10);
        expect(ctx.alliance).toBe(0);
    });
});

describe('NarrativeService — Camada 4 NARRATIVA (arcos)', () => {
    test('openArc cria arc novo', () => {
        const svc = new NarrativeService();
        const save = {};
        const result = svc.openArc(save, 'A Maldição dos Aflitos', [1, 2]);
        expect(result.success).toBe(true);
        expect(save.arcs).toHaveLength(1);
        expect(save.arcs[0].status).toBe('open');
    });

    test('openArc rejeita duplicate', () => {
        const svc = new NarrativeService();
        const save = {};
        svc.openArc(save, 'Test Arc', [1, 2]);
        const second = svc.openArc(save, 'Test Arc', [1, 2]);
        expect(second.success).toBe(false);
    });

    test('getOpenArcs retorna apenas status=open', () => {
        const svc = new NarrativeService();
        const save = {};
        const r1 = svc.openArc(save, 'Arc 1', [1]);
        const r2 = svc.openArc(save, 'Arc 2', [2]);
        const arcId1 = save.arcs[0].id;
        svc.closeArc(save, arcId1, { reason: 'finished' });

        const open = svc.getOpenArcs(save);
        expect(open).toHaveLength(1);
        expect(open[0].name).toBe('Arc 2');
    });

    test('addMilestone push to arc.milestones', () => {
        const svc = new NarrativeService();
        const save = {};
        svc.openArc(save, 'Test', [1]);
        const arcId = save.arcs[0].id;
        svc.addMilestone(save, arcId, { type: 'goal', minute: 90 });
        expect(save.arcs[0].milestones).toHaveLength(1);
    });
});

describe('NarrativeService — Camada 5 MITO integration', () => {
    test('canonize delegates to MythService', () => {
        const mythSvc = new MythService();
        const narSvc = new NarrativeService({ mythService: mythSvc });
        const save = {};

        const result = narSvc.canonize(save, 42, 'idoloEterno');
        expect(result.success).toBe(true);
        expect(save.myth.legends).toHaveLength(1);
        expect(save.myth.legends[0].playerId).toBe(42);
    });

    test('canonize falha sem mythService injected', () => {
        const narSvc = new NarrativeService();
        const result = narSvc.canonize({}, 42, 'idoloEterno');
        expect(result.success).toBe(false);
    });

    test('promoteToHall delegates to MythService', () => {
        const mythSvc = new MythService();
        const narSvc = new NarrativeService({ mythService: mythSvc });
        const save = {};

        narSvc.promoteToHall(save, 99, 1, 'goleirao');
        expect(save.myth.halls[1].goleirao).toBe(99);
    });
});

describe('NarrativeService — sem ciclos arquiteturais', () => {
    test('NarrativeService → RelationshipService (one-way)', () => {
        const relSvc = new RelationshipService();
        const narSvc = new NarrativeService({ relationshipService: relSvc });

        // Narrative consulta Relationship, mas Relationship NUNCA chama Narrative
        expect(narSvc._relationshipService).toBe(relSvc);
        expect(relSvc._narrativeService).toBeUndefined();
    });

    test('NarrativeService → MythService (one-way)', () => {
        const mythSvc = new MythService();
        const narSvc = new NarrativeService({ mythService: mythSvc });

        expect(narSvc._mythService).toBe(mythSvc);
        // Myth não importa Narrative
        expect(mythSvc._narrativeService).toBeUndefined();
    });
});
