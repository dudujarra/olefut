/**
 * SPEC-168 harness — State Championships wire-up
 *
 * Verifica que estaduais brasileiros são instanciados pelo GameInitializer
 * e rodam paralelo ao Brasileirão nas semanas 1-16.
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

describe('SPEC-168: State Championships wire-up', () => {
    it('GameInitializer cria pelo menos um estadual brasileiro', () => {
        const e = createEngine();
        const states = getStateTournaments(e);
        expect(states.length).toBeGreaterThan(0);
    });

    it('cada estadual ativo tem >= 8 participantes (mandamento #5)', () => {
        const e = createEngine();
        const states = getStateTournaments(e);
        for (const t of states) {
            expect(t.participants.length).toBeGreaterThanOrEqual(8);
        }
    });

    it('participantes pertencem ao estado correto (cross-check CLUB_STATE_MAP)', () => {
        const e = createEngine();
        const states = getStateTournaments(e);
        for (const t of states) {
            for (const teamId of t.participants) {
                const team = e.getTeam(teamId);
                expect(team).toBeTruthy();
                expect(CLUB_STATE_MAP[team.name]).toBe(t.state);
            }
        }
    });

    it('janela de calendário: weekStart=1, weekEnd=16', () => {
        const e = createEngine();
        const states = getStateTournaments(e);
        for (const t of states) {
            expect(t.weekStart).toBe(1);
            expect(t.weekEnd).toBe(16);
        }
    });

    it('estaduais não rodam fora da janela (week 17 = []) ', () => {
        const e = createEngine();
        const states = getStateTournaments(e);
        if (states.length === 0) return; // defensive — sem estaduais, nada a testar
        const t = states[0];
        // currentWeek = 17 está fora da janela 1-16
        const results = t.advanceWeek(e, 17);
        expect(results).toEqual([]);
    });

    it('estaduais simulam partidas durante semanas 1-16 (standings se movem)', () => {
        const e = createEngine();
        const states = getStateTournaments(e);
        if (states.length === 0) return;

        // Avança ~5 semanas para popular standings
        for (let i = 0; i < 5; i++) {
            try { e.advanceWeek(); } catch { /* defensive */ }
        }

        const t = states[0];
        const someMatchPlayed = t.standings.some(s => s.played > 0);
        expect(someMatchPlayed).toBe(true);
    });

    it('estadual sem >= 8 clubes mapeados não é instanciado', () => {
        const e = createEngine();
        const states = getStateTournaments(e);
        const wiredIds = new Set(states.map(t => t.id));

        // Para cada config de STATE_CHAMPIONSHIPS, conta clubes elegíveis
        for (const config of Object.values(STATE_CHAMPIONSHIPS)) {
            const pool = e.teams.filter(
                t => t.zone === 'BRA' && CLUB_STATE_MAP[t.name] === config.state
            );
            if (pool.length < 8) {
                expect(wiredIds.has(config.id)).toBe(false);
            }
        }
    });

    it('golden master: tournaments principais continuam presentes', () => {
        const e = createEngine();
        const ids = e.tournaments.map(t => t.id);
        expect(ids).toContain('COPA_BR');
        expect(ids).toContain('LIBERTADORES');
        expect(ids).toContain('SULA');
        expect(ids).toContain('CHAMPIONS');
        // Pelo menos uma liga BRA
        expect(ids.some(id => id.startsWith('BRA_'))).toBe(true);
    });

    it('re-init no rollover de temporada reseta phase e mantém participantes', () => {
        const e = createEngine();
        const states = getStateTournaments(e);
        if (states.length === 0) return;
        const t = states[0];
        const participantsBefore = [...t.participants];

        // Força phase manual + re-init
        t.phase = 'done';
        t.init(participantsBefore);

        expect(t.phase).toBe('group');
        expect(t.winner).toBeNull();
        expect(t.participants).toEqual(participantsBefore);
        expect(t.standings.every(s => s.played === 0)).toBe(true);
    });
});
