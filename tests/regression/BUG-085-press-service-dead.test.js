// Regression test — BUG-085
// Audit AKITA-233 + brutal audit sugeriram que `src/services/PressService.js` é morto
// porque PressView importa direto de `src/engine/PressConference.js`.
//
// Decisão (BUG-085): PressService **está vivo e é load-bearing**. Há 5 métodos
// (`checkPressConference`, `answerPress`, `getRenewalOffer`, `renewContract`,
// `respondCoachProposal`) chamados via engine por DashboardView, AutoPlayService,
// AutoPlayPacing, MonitorService, e tests de integration. PressView bypassa apenas
// porque precisa de reactividade React; caminho UI manual e caminho headless são
// separados intencionalmente.
//
// Este teste falha se:
//   - alguém deletar PressService.js (audit cego)
//   - alguém remover algum dos 5 métodos
//   - engine.js parar de delegar para PressService

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PressService } from '../../src/services/PressService.js';

const ENGINE_SRC = readFileSync(resolve('src/engine/engine.js'), 'utf-8');
const DASHBOARD_SRC = readFileSync(resolve('src/components/DashboardView.jsx'), 'utf-8');
const AUTOPLAY_SRC = readFileSync(resolve('src/services/AutoPlayService.js'), 'utf-8');
const PACING_SRC = readFileSync(resolve('src/services/AutoPlayPacing.js'), 'utf-8');

describe('BUG-085 — PressService is alive (audit confirmed not dead)', () => {
    test('PressService class exists and is exportable', () => {
        expect(typeof PressService).toBe('function');
        const instance = new PressService();
        expect(instance).toBeInstanceOf(PressService);
    });

    test('PressService exposes 5 load-bearing methods', () => {
        const instance = new PressService();
        expect(typeof instance.checkPressConference).toBe('function');
        expect(typeof instance.answerPress).toBe('function');
        expect(typeof instance.getRenewalOffer).toBe('function');
        expect(typeof instance.renewContract).toBe('function');
        expect(typeof instance.respondCoachProposal).toBe('function');
    });

    test('engine.js instantiates and delegates to PressService', () => {
        expect(ENGINE_SRC).toContain('new PressService()');
        expect(ENGINE_SRC).toContain('this._pressService.checkPressConference(this)');
        expect(ENGINE_SRC).toContain('this._pressService.answerPress(this');
        expect(ENGINE_SRC).toContain('this._pressService.getRenewalOffer(this');
        expect(ENGINE_SRC).toContain('this._pressService.renewContract(this');
        expect(ENGINE_SRC).toContain('this._pressService.respondCoachProposal(this');
    });

    test('DashboardView consumes engine.checkPressConference + engine.answerPress', () => {
        expect(DASHBOARD_SRC).toContain('engine.checkPressConference()');
        expect(DASHBOARD_SRC).toContain('engine.answerPress(');
    });

    test('AutoPlayService consumes engine.checkPressConference + engine.answerPress (headless flow)', () => {
        expect(AUTOPLAY_SRC).toContain('engine.checkPressConference');
        expect(AUTOPLAY_SRC).toContain('engine.answerPress');
    });

    test('AutoPlayPacing consumes engine.renewContract + engine.respondCoachProposal', () => {
        expect(PACING_SRC).toContain('engine.renewContract');
        expect(PACING_SRC).toContain('engine.respondCoachProposal');
    });

    test('PressService.js carries explanatory architecture header (rationale)', () => {
        const src = readFileSync(resolve('src/services/PressService.js'), 'utf-8');
        expect(src).toMatch(/ARQUITETURA|architecture|consumers|PressView/i);
    });
});
