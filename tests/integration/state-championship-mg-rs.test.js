/**
 * SPEC-168 harness extra — Mineiro + Gaúcho ativados pós-expansion brazil.js
 *
 * Após expandir src/engine/db/brazil.js com clubes MG/RS adicionais, os 4
 * estaduais brasileiros principais (Paulistão, Carioca, Mineiro, Gaúcho) devem
 * todos ser instanciados pelo GameInitializer (cada um com >= 8 clubes pool).
 */
import { describe, it, expect } from 'vitest';
import { Engine } from '../../src/engine/engine';
import {
    CLUB_STATE_MAP,
    STATE_CHAMPIONSHIPS,
    StateChampionship,
} from '../../src/engine/tournaments/StateChampionship';

function createEngine() {
    const e = new Engine();
    e.initGame('TestManager', 1, 'manager', 'livre');
    return e;
}

function getStateTournaments(engine) {
    return engine.tournaments.filter(t => t instanceof StateChampionship);
}

function poolForState(engine, state) {
    return engine.teams.filter(
        t => t.zone === 'BRA' && CLUB_STATE_MAP[t.name] === state
    );
}

describe('SPEC-168 expansion: Mineiro + Gaúcho ATIVOS pós-brazil.js expand', () => {
    it('pool MG tem >= 8 clubes (era 6, agora 10+)', () => {
        const e = createEngine();
        const mgPool = poolForState(e, 'MG');
        expect(mgPool.length).toBeGreaterThanOrEqual(8);
    });

    it('pool RS tem >= 8 clubes (era 6, agora 10+)', () => {
        const e = createEngine();
        const rsPool = poolForState(e, 'RS');
        expect(rsPool.length).toBeGreaterThanOrEqual(8);
    });

    it('os 4 estaduais brasileiros (Paulistão, Carioca, Mineiro, Gaúcho) estão ATIVOS', () => {
        const e = createEngine();
        const states = getStateTournaments(e);
        const wiredIds = new Set(states.map(t => t.id));
        expect(wiredIds.has('paulistao')).toBe(true);
        expect(wiredIds.has('carioca')).toBe(true);
        expect(wiredIds.has('mineiro')).toBe(true);
        expect(wiredIds.has('gaucho')).toBe(true);
        expect(states.length).toBeGreaterThanOrEqual(4);
    });

    it('Mineiro tem participants e cada um é clube MG', () => {
        const e = createEngine();
        const mineiro = getStateTournaments(e).find(t => t.id === 'mineiro');
        expect(mineiro).toBeTruthy();
        expect(mineiro.participants.length).toBeGreaterThanOrEqual(8);
        for (const teamId of mineiro.participants) {
            const team = e.getTeam(teamId);
            expect(team).toBeTruthy();
            expect(CLUB_STATE_MAP[team.name]).toBe('MG');
        }
    });

    it('Gaúcho tem participants e cada um é clube RS', () => {
        const e = createEngine();
        const gaucho = getStateTournaments(e).find(t => t.id === 'gaucho');
        expect(gaucho).toBeTruthy();
        expect(gaucho.participants.length).toBeGreaterThanOrEqual(8);
        for (const teamId of gaucho.participants) {
            const team = e.getTeam(teamId);
            expect(team).toBeTruthy();
            expect(CLUB_STATE_MAP[team.name]).toBe('RS');
        }
    });

    it('config sizes respeitadas (Mineiro <= 12, Gaúcho <= 16)', () => {
        const e = createEngine();
        const mineiro = getStateTournaments(e).find(t => t.id === 'mineiro');
        const gaucho = getStateTournaments(e).find(t => t.id === 'gaucho');
        expect(mineiro.participants.length).toBeLessThanOrEqual(STATE_CHAMPIONSHIPS.mineiro.size);
        expect(gaucho.participants.length).toBeLessThanOrEqual(STATE_CHAMPIONSHIPS.gaucho.size);
    });

    it('Mineiro + Gaúcho rodam standings nas primeiras semanas', () => {
        const e = createEngine();
        for (let i = 0; i < 5; i++) {
            try { e.advanceWeek(); } catch { /* defensive */ }
        }
        const mineiro = getStateTournaments(e).find(t => t.id === 'mineiro');
        const gaucho = getStateTournaments(e).find(t => t.id === 'gaucho');
        expect(mineiro.standings.some(s => s.played > 0)).toBe(true);
        expect(gaucho.standings.some(s => s.played > 0)).toBe(true);
    });
});
