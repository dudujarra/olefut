/**
 * ChronicleService tests — AKITA-056 v1.5
 */

import { describe, test, expect } from 'vitest';
import { ChronicleService } from '../../src/services/ChronicleService.js';
import { NarrativeService } from '../../src/services/NarrativeService.js';
import { MythService } from '../../src/services/MythService.js';
import { RelationshipService } from '../../src/services/RelationshipService.js';
import { CareerService } from '../../src/services/CareerService.js';
import { EVENT_TYPES } from '../../src/data/eventTypes.js';

describe('ChronicleService.generateSeasonChronicle', () => {
    test('save vazio retorna estrutura mínima', () => {
        const svc = new ChronicleService();
        const result = svc.generateSeasonChronicle({});
        expect(result).toContain('CRÔNICA');
        expect(result).toContain('TEMPORADA');
    });

    test('save null retorna string vazia', () => {
        const svc = new ChronicleService();
        expect(svc.generateSeasonChronicle(null)).toBe('');
    });

    test('inclui top events com narrativeWeight ≥ 3', () => {
        const narSvc = new NarrativeService();
        const svc = new ChronicleService({ narrativeService: narSvc });
        const save = {};
        narSvc.appendEvent(save, EVENT_TYPES.TITLE_WON, {
            narrativeWeight: 5,
            intensity: 100,
            headline: '🏆 CAMPEÃO BRASILEIRO!'
        });
        const result = svc.generateSeasonChronicle(save);
        expect(result).toContain('🏆 CAMPEÃO BRASILEIRO!');
    });

    test('inclui open arcs', () => {
        const narSvc = new NarrativeService();
        const svc = new ChronicleService({ narrativeService: narSvc });
        const save = {};
        narSvc.openArc(save, 'A Vingança Lenta', [1, 2]);
        const result = svc.generateSeasonChronicle(save);
        expect(result).toContain('A Vingança Lenta');
    });

    test('inclui Hall de Lendas count', () => {
        const mythSvc = new MythService();
        const svc = new ChronicleService({ mythService: mythSvc });
        const save = {};
        mythSvc.promoteToHallOfFame(save, 1, 1, 'idoloEterno');
        const result = svc.generateSeasonChronicle(save);
        expect(result).toContain('1');
    });

    test('inclui diretoria stats', () => {
        const relSvc = new RelationshipService();
        const svc = new ChronicleService({ relationshipService: relSvc });
        const save = {};
        relSvc.adjustTrust(save, 20);
        const result = svc.generateSeasonChronicle(save);
        expect(result).toContain('Confiança');
    });
});

describe('ChronicleService.generateLifetimeChronicle', () => {
    test('save vazio retorna estrutura mínima', () => {
        const svc = new ChronicleService();
        const result = svc.generateLifetimeChronicle({});
        expect(result).toContain('CRÔNICA DO SAVE');
    });

    test('inclui ProPlayer career se existe', () => {
        const careerSvc = new CareerService();
        const svc = new ChronicleService({ careerService: careerSvc });
        const save = {
            proPlayer: {
                name: 'Pelé',
                retired: true,
                careerStats: { totalGoals: 100, totalAppearances: 200 }
            }
        };
        const result = svc.generateLifetimeChronicle(save);
        expect(result).toContain('Pelé');
        expect(result).toContain('100');
    });

    test('inclui manager career se existe', () => {
        const careerSvc = new CareerService();
        const svc = new ChronicleService({ careerService: careerSvc });
        const save = {
            managerCareer: { history: [{ clubId: 1 }, { clubId: 2 }] }
        };
        const result = svc.generateLifetimeChronicle(save);
        expect(result).toContain('CARREIRA TÉCNICO');
        expect(result).toContain('2');
    });
});

describe('ChronicleService.exportSaveJSON', () => {
    test('exporta save como JSON string válido', () => {
        const svc = new ChronicleService();
        const save = { schemaVersion: 10, events: [] };
        const json = svc.exportSaveJSON(save);
        expect(() => JSON.parse(json)).not.toThrow();
        const parsed = JSON.parse(json);
        expect(parsed.schemaVersion).toBe(10);
    });

    test('handles circular gracefully', () => {
        const svc = new ChronicleService();
        const a = {};
        a.self = a;
        const result = svc.exportSaveJSON(a);
        expect(result).toBe('{}'); // fallback
    });
});

describe('ChronicleService.getStatsSummary', () => {
    test('retorna null sem save', () => {
        const svc = new ChronicleService();
        expect(svc.getStatsSummary(null)).toBeNull();
    });

    test('counts em arrays do save', () => {
        const svc = new ChronicleService();
        const save = {
            seasonNumber: 5,
            currentWeek: 38,
            events: [{}, {}, {}],
            arcs: [{ status: 'open' }, { status: 'closed' }],
            decisions: [{}],
            regenLineage: [{}],
            retiredPlayers: [{}, {}]
        };
        const stats = svc.getStatsSummary(save);
        expect(stats.season).toBe(5);
        expect(stats.eventsCount).toBe(3);
        expect(stats.arcsCount).toBe(2);
        expect(stats.openArcsCount).toBe(1);
        expect(stats.regenChildrenCount).toBe(1);
        expect(stats.retiredPlayersCount).toBe(2);
    });
});
