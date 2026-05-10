import { describe, test, expect } from 'vitest';
import { checkSquadHealth } from '../../src/engine/SquadHealthMonitor';

const base = { teamId: 1, budget: 5000000, week: 10, squadAvgOvr: 65, marketPlayers: [], _cooldowns: {} };

describe('SPEC-132: SquadHealthMonitor', () => {
    test('squad ≥ 11 → no trigger', () => {
        const r = checkSquadHealth({ ...base, squadSize: 11, isPlayerManager: false });
        expect(r.triggered).toBe(false);
    });

    test('squad < 11 → triggers alert for player-manager', () => {
        const r = checkSquadHealth({ ...base, squadSize: 10, isPlayerManager: true });
        expect(r.triggered).toBe(true);
        expect(r.action).toBe('alert_player');
    });

    test('squad < 8 → forceMarketOpen for player-manager', () => {
        const r = checkSquadHealth({ ...base, squadSize: 7, isPlayerManager: true });
        expect(r.forceMarketOpen).toBe(true);
        expect(r.alertMessage).toBeTruthy();
    });

    test('NPC squad < 8 → auto_buy action', () => {
        const market = [
            { id: 'm1', name: 'João', ovr: 62, value: 100000, salary: 5000 },
            { id: 'm2', name: 'Pedro', ovr: 60, value: 80000, salary: 4000 },
            { id: 'm3', name: 'Paulo', ovr: 63, value: 120000, salary: 5500 },
            { id: 'm4', name: 'Carlos', ovr: 61, value: 90000, salary: 4500 },
        ];
        const r = checkSquadHealth({ ...base, squadSize: 7, isPlayerManager: false, marketPlayers: market });
        expect(r.triggered).toBe(true);
        expect(r.action).toBe('auto_buy');
    });

    test('NPC budget=0 → triggered but no players bought', () => {
        const r = checkSquadHealth({ ...base, squadSize: 7, isPlayerManager: false, budget: 0 });
        expect(r.triggered).toBe(true);
        expect(r.playersBought.length).toBe(0);
    });

    test('player-manager: no auto_buy (no playersBought field)', () => {
        const r = checkSquadHealth({ ...base, squadSize: 9, isPlayerManager: true });
        expect(r.playersBought).toBeUndefined();
    });

    test('cooldown: same team same week → no second trigger', () => {
        const cooldowns = {};
        checkSquadHealth({ ...base, squadSize: 9, isPlayerManager: false, week: 5, _cooldowns: cooldowns });
        cooldowns[1] = 5; // simula cooldown aplicado
        const r2 = checkSquadHealth({ ...base, squadSize: 9, isPlayerManager: false, week: 5, _cooldowns: cooldowns });
        expect(r2.triggered).toBe(false);
    });

    test('alert message contains squad size', () => {
        const r = checkSquadHealth({ ...base, squadSize: 8, isPlayerManager: true });
        expect(r.alertMessage).toContain('8');
    });
});
