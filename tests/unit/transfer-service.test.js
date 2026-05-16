/**
 * Unit tests for TransferService
 * AKITA-411: Top 10 unit test coverage
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TransferService } from '../../src/services/TransferService.js';

function makeEngine() {
    const teams = [
        {
            id: 1, name: 'Player FC', balance: 5_000_000, zone: 'SE', division: 1,
            squad: [
                { id: 101, name: 'Star', position: 'ATA', ovr: 85, isTitular: true, value: 2_000_000, traits: [], salary: 10000 },
                { id: 102, name: 'Bench', position: 'MEI', ovr: 60, isTitular: false, value: 500_000, traits: [], salary: 3000 },
            ],
        },
        {
            id: 2, name: 'NPC FC', balance: 3_000_000, zone: 'SE', division: 1,
            squad: [
                { id: 201, name: 'NPC Star', position: 'ATA', ovr: 78, isTitular: true, value: 1_500_000, traits: [], salary: 8000 },
            ],
        },
    ];

    return {
        teams,
        manager: { teamId: 1 },
        transferOffers: [],
        formerCompanions: [],
        boardTension: 0,
        weekEvents: [],
        marketPlayers: [],
        currentWeek: 10,
        viewUnlockState: { totalTransfers: 0 },
        getTeam(id) { return this.teams.find(t => t.id === id); },
    };
}

describe('TransferService', () => {
    let svc;
    let engine;

    beforeEach(() => {
        svc = new TransferService();
        engine = makeEngine();
    });

    describe('generateMarket()', () => {
        it('populates 20 market players', () => {
            svc.generateMarket(engine);
            expect(engine.marketPlayers.length).toBe(20);
        });

        it('each player has position and name', () => {
            svc.generateMarket(engine);
            engine.marketPlayers.forEach(p => {
                expect(p.name).toBeDefined();
                expect(['GOL', 'DEF', 'MEI', 'ATA']).toContain(p.position);
            });
        });
    });

    describe('acceptTransferOffer()', () => {
        it('returns fail for non-existent offer', () => {
            const result = svc.acceptTransferOffer(engine, 999);
            expect(result.success).toBe(false);
            expect(result.msg).toContain('não encontrada');
        });

        it('accepts valid offer and transfers player', () => {
            engine.transferOffers = [
                { playerId: 102, playerName: 'Bench', offerAmount: 800_000, buyerClub: 'NPC FC', buyerTeamId: 2 },
            ];
            const result = svc.acceptTransferOffer(engine, 102);
            expect(result.success).toBe(true);
            expect(result.msg).toContain('vendido');

            const playerTeam = engine.getTeam(1);
            expect(playerTeam.squad.find(p => p.id === 102)).toBeUndefined();
            expect(playerTeam.balance).toBe(5_000_000 + 800_000);
        });

        it('tracks former companion on sale', () => {
            engine.transferOffers = [
                { playerId: 102, playerName: 'Bench', offerAmount: 500_000, buyerClub: 'Other' },
            ];
            svc.acceptTransferOffer(engine, 102);
            expect(engine.formerCompanions.length).toBe(1);
            expect(engine.formerCompanions[0].name).toBe('Bench');
        });
    });

    describe('rejectTransferOffer()', () => {
        it('removes offer from queue', () => {
            engine.transferOffers = [
                { playerId: 102, playerName: 'Bench', offerAmount: 500_000, buyerClub: 'NPC FC' },
            ];
            const result = svc.rejectTransferOffer(engine, 102);
            expect(result.success).toBe(true);
            expect(engine.transferOffers.length).toBe(0);
        });
    });

    describe('makeBuyOffer()', () => {
        it('fails when player not found', () => {
            const result = svc.makeBuyOffer(engine, 2, 999, 1_000_000);
            expect(result.success).toBe(false);
        });

        it('fails with insufficient balance', () => {
            engine.getTeam(1).balance = 100;
            const result = svc.makeBuyOffer(engine, 2, 201, 1_000_000);
            expect(result.success).toBe(false);
            expect(result.msg).toContain('insuficiente');
        });

        it('fails when buying from own team', () => {
            const result = svc.makeBuyOffer(engine, 1, 101, 500_000);
            expect(result.success).toBe(false);
        });

        it('returns result with success and msg', () => {
            const result = svc.makeBuyOffer(engine, 2, 201, 3_000_000);
            expect(result.success).toBe(true);
            expect(result.msg).toBeDefined();
            expect(typeof result.accepted).toBe('boolean');
        });
    });

    describe('npcMakeBuyOffer()', () => {
        it('generates human-pending offer when target is player team', () => {
            const result = svc.npcMakeBuyOffer(engine, 2, 1, 102, 600_000);
            expect(result.pendingHuman).toBe(true);
            expect(engine.transferOffers.length).toBe(1);
        });

        it('fails for non-existent teams', () => {
            const result = svc.npcMakeBuyOffer(engine, 999, 888, 102, 600_000);
            expect(result.success).toBe(false);
        });
    });

    describe('sellPlayer()', () => {
        it('sells a non-titular player', () => {
            const result = svc.sellPlayer(engine, 102, 400_000);
            expect(result.success).toBe(true);
            expect(engine.getTeam(1).balance).toBe(5_400_000);
            expect(engine.viewUnlockState.totalTransfers).toBe(1);
        });

        it('blocks selling a titular', () => {
            const result = svc.sellPlayer(engine, 101, 1_000_000);
            expect(result.success).toBe(false);
            expect(result.msg).toContain('Tire da titularidade');
        });
    });
});
