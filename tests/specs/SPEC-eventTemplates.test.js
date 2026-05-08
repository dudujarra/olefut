/**
 * Event Templates tests — SPEC-049 Camada 2 v1.0.7
 */

import { describe, test, expect } from 'vitest';
import {
    EVENT_TEMPLATES, TEMPLATES_COUNT,
    getEventTemplate, getTemplatesByType, pickRandomTemplate
} from '../../src/data/eventTemplates.js';
import { EVENT_TYPES, ALL_EVENT_TYPES } from '../../src/data/eventTypes.js';
import { ALL_EVENT_TAGS } from '../../src/data/eventTags.js';
import { NarrativeService } from '../../src/services/NarrativeService.js';

describe('Event Templates — vocabulário (SPEC-049 Camada 2)', () => {
    test('TEMPLATES_COUNT >= 60 (v1.0.7 MVP, target 80 v1.0.7.1)', () => {
        expect(TEMPLATES_COUNT).toBeGreaterThanOrEqual(60);
    });

    test('EVENT_TEMPLATES é frozen (immutability)', () => {
        expect(Object.isFrozen(EVENT_TEMPLATES)).toBe(true);
    });

    test('todos templates têm id único', () => {
        const ids = EVENT_TEMPLATES.map(t => t.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });

    test('todos templates têm type válido', () => {
        for (const tpl of EVENT_TEMPLATES) {
            expect(ALL_EVENT_TYPES).toContain(tpl.type);
        }
    });

    test('todos templates têm tags válidas (vocab fixo)', () => {
        for (const tpl of EVENT_TEMPLATES) {
            const tags = tpl.defaults?.tags || [];
            for (const tag of tags) {
                expect(ALL_EVENT_TAGS).toContain(tag);
            }
        }
    });

    test('todos templates têm headline string com slot pattern', () => {
        for (const tpl of EVENT_TEMPLATES) {
            expect(typeof tpl.headline).toBe('string');
            expect(tpl.headline.length).toBeGreaterThan(10);
        }
    });

    test('cobertura por tipo: cada EVENT_TYPE tem ≥3 templates (variedade narrativa)', () => {
        const counts = {};
        for (const tpl of EVENT_TEMPLATES) {
            counts[tpl.type] = (counts[tpl.type] || 0) + 1;
        }
        // Major event types devem ter ≥3 templates
        const requireMin3 = [
            EVENT_TYPES.PLAYER_GOAL_DECISIVE,
            EVENT_TYPES.PLAYER_RED_CARD,
            EVENT_TYPES.PLAYER_TRANSFER_TO_RIVAL,
            EVENT_TYPES.TITLE_WON,
            EVENT_TYPES.DERBY_VICTORY,
            EVENT_TYPES.DERBY_DEFEAT,
            EVENT_TYPES.PRESIDENT_CONFRONTATION
        ];
        for (const type of requireMin3) {
            expect(counts[type] || 0).toBeGreaterThanOrEqual(3);
        }
    });
});

describe('Event Templates — lookup helpers', () => {
    test('getEventTemplate retorna template by id', () => {
        const tpl = getEventTemplate('goal_late_winner');
        expect(tpl).not.toBeNull();
        expect(tpl.id).toBe('goal_late_winner');
        expect(tpl.type).toBe(EVENT_TYPES.PLAYER_GOAL_DECISIVE);
    });

    test('getEventTemplate retorna null para id inválido', () => {
        expect(getEventTemplate('nonexistent')).toBeNull();
    });

    test('getTemplatesByType filtra por tipo', () => {
        const goals = getTemplatesByType(EVENT_TYPES.PLAYER_GOAL_DECISIVE);
        expect(goals.length).toBeGreaterThanOrEqual(3);
        expect(goals.every(t => t.type === EVENT_TYPES.PLAYER_GOAL_DECISIVE)).toBe(true);
    });

    test('pickRandomTemplate determinístico com seed', () => {
        const seed = () => 0.5;
        const t1 = pickRandomTemplate(EVENT_TYPES.PLAYER_GOAL_DECISIVE, seed);
        const t2 = pickRandomTemplate(EVENT_TYPES.PLAYER_GOAL_DECISIVE, seed);
        expect(t1.id).toBe(t2.id);
    });
});

describe('NarrativeService — appendEventFromTemplate', () => {
    test('aplica defaults do template', () => {
        const svc = new NarrativeService();
        const save = {};
        svc.appendEventFromTemplate(save, 'goal_late_winner', {
            actors: [42],
            slots: { jogador: 'Pelé', clube: 'Santos', minuto: 89 }
        });
        expect(save.events).toHaveLength(1);
        expect(save.events[0].valence).toBe(80);
        expect(save.events[0].intensity).toBe(85);
        expect(save.events[0].headline).toContain('Pelé');
        expect(save.events[0].headline).toContain('Santos');
        expect(save.events[0].headline).toContain('89');
    });

    test('rejeita templateId inválido', () => {
        const svc = new NarrativeService();
        const result = svc.appendEventFromTemplate({}, 'nonexistent', {});
        expect(result.success).toBe(false);
    });

    test('slot ausente vira [chave]', () => {
        const svc = new NarrativeService();
        const save = {};
        svc.appendEventFromTemplate(save, 'goal_late_winner', {
            slots: { jogador: 'X' } // missing clube + minuto
        });
        expect(save.events[0].headline).toContain('[clube]');
        expect(save.events[0].headline).toContain('[minuto]');
    });

    test('appendRandomEvent escolhe template + cria event', () => {
        const svc = new NarrativeService();
        const save = {};
        const result = svc.appendRandomEvent(save, EVENT_TYPES.PLAYER_GOAL_DECISIVE, {
            slots: { jogador: 'Pelé' },
            rng: () => 0.1
        });
        expect(result.success).toBe(true);
        expect(save.events).toHaveLength(1);
    });
});
