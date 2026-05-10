import { describe, test, expect } from 'vitest';
import { compute, isCanonized, SLOTS } from '../../src/engine/HallOfLegendsSystem.js';

const mkPlayer = (overrides) => ({ id: 1, name: 'Pelé', apps: 100, goals: 50, fromBase: false, soldToRival: false, hadLongInjury: false, ...overrides });

describe('SPEC-078: Hall of Legends System', () => {

    test('6 slot keys defined', () => {
        expect(SLOTS.length).toBe(6);
    });

    test('idoloEterno = player with most apps', () => {
        const result = compute({
            clubId: 1,
            players: [mkPlayer({ id: 1, name: 'A', apps: 200 }), mkPlayer({ id: 2, name: 'B', apps: 100 })],
        });
        expect(result.slots.idoloEterno.playerName).toBe('A');
    });

    test('goleirao = player with most goals', () => {
        const result = compute({
            clubId: 1,
            players: [mkPlayer({ id: 1, name: 'Artilheiro', goals: 80, apps: 50 }), mkPlayer({ id: 2, name: 'Operário', goals: 5, apps: 200 })],
        });
        expect(result.slots.goleirao.playerName).toBe('Artilheiro');
    });

    test('criaDaBase = best base player', () => {
        const result = compute({
            clubId: 1,
            players: [mkPlayer({ id: 1, name: 'Externo', fromBase: false, goals: 100 }), mkPlayer({ id: 2, name: 'Cria', fromBase: true, goals: 40 })],
        });
        expect(result.slots.criaDaBase.playerName).toBe('Cria');
    });

    test('traidor = player sold to rival', () => {
        const result = compute({
            clubId: 1,
            players: [mkPlayer({ id: 1, name: 'Honesto', soldToRival: false }), mkPlayer({ id: 2, name: 'Judas', soldToRival: true, apps: 50 })],
        });
        expect(result.slots.traidor.playerName).toBe('Judas');
    });

    test('lendaTragica = player with long injury', () => {
        const result = compute({
            clubId: 1,
            players: [mkPlayer({ id: 1, name: 'Azarado', hadLongInjury: true, apps: 30 })],
        });
        expect(result.slots.lendaTragica.playerName).toBe('Azarado');
    });

    test('carrasco = rival player with most goals vs this club', () => {
        const result = compute({
            clubId: 1,
            players: [],
            rivalPlayers: [{ id: 99, name: 'Carrasco', goalsVsThisClub: 15 }],
        });
        expect(result.slots.carrasco.playerName).toBe('Carrasco');
    });

    test('isCanonized returns true for canonized player', () => {
        const result = compute({ clubId: 1, players: [mkPlayer({ id: 42, name: 'Lenda', apps: 200 })] });
        expect(isCanonized(result, 42)).toBe(true);
    });

    test('isCanonized returns false for unknown player', () => {
        const result = compute({ clubId: 1, players: [mkPlayer({ id: 1, name: 'A', apps: 200 })] });
        expect(isCanonized(result, 999)).toBe(false);
    });

    test('filledCount reflects actual filled slots', () => {
        const result = compute({ clubId: 1, players: [mkPlayer({ id: 1, apps: 100, goals: 0 })] });
        expect(result.filledCount).toBeGreaterThanOrEqual(1);
    });

    test('goleirao not filled if all players have 0 goals', () => {
        const result = compute({ clubId: 1, players: [mkPlayer({ id: 1, goals: 0 })] });
        expect(result.slots.goleirao).toBeUndefined();
    });
});
