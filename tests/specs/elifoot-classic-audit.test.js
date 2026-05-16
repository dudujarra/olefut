/**
 * elifoot-classic-audit.test.js
 * 
 * Comprehensive tests for the 4 Elifoot Classic mechanics:
 * - MatchBonusSystem (Bicho)
 * - TicketPricingSystem (Ingresso)
 * - StarAuctionSystem (Leilão)
 * - DisciplineSystem (Cartões)
 *
 * Follows AKITA Mandamento #2: Regra 0 — harness executável no mesmo PR.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { createEngine } from '../../src/engine/engineFactory.js';
import { MATCH_BONUS_TIERS, setMatchBonus, settleMatchBonus, getMatchBonusBuff } from '../../src/engine/MatchBonusSystem.js';
import { TICKET_POLICIES, setTicketPolicy, getActiveTicketPolicy, getHomeAdvantageFromTickets, getTicketFinanceModifiers, getTicketMoralBoost } from '../../src/engine/TicketPricingSystem.js';
import { requiresAuction, startAuction, raiseBid, resolveAuctions, getActiveAuctions } from '../../src/engine/StarAuctionSystem.js';
import { processMatchCards, decrementSuspensions } from '../../src/engine/DisciplineSystem.js';

// Helper: create a minimal engine with a manager team
function createTestEngine() {
    const engine = createEngine();
    engine.teams = [
        {
            id: 1, name: 'Palmeiras', balance: 50_000_000,
            squad: Array.from({ length: 18 }, (_, i) => ({
                id: i + 1,
                name: `Player ${i + 1}`,
                position: i < 3 ? 'ATA' : i < 8 ? 'MEI' : i < 14 ? 'DEF' : 'GOL',
                ovr: 70 + Math.floor(i / 2),
                value: 5_000_000,
                moral: 50,
                energy: 100,
                isTitular: i < 11,
                injury: null,
                suspension: undefined,
            })),
        },
        {
            id: 2, name: 'Flamengo', balance: 80_000_000,
            squad: Array.from({ length: 18 }, (_, i) => ({
                id: 100 + i,
                name: `FLA Player ${i + 1}`,
                position: 'MEI',
                ovr: 72,
                value: 4_000_000,
                moral: 50,
                energy: 100,
                isTitular: i < 11,
                injury: null,
            })),
        },
        {
            id: 3, name: 'Vasco', balance: 15_000_000,
            squad: Array.from({ length: 11 }, (_, i) => ({
                id: 200 + i,
                name: `VAS Player ${i + 1}`,
                position: 'DEF',
                ovr: 60,
                value: 1_000_000,
                moral: 50,
                energy: 100,
                isTitular: true,
                injury: null,
            })),
        },
    ];
    engine.manager = { teamId: 1, name: 'Test Manager', money: 0, salary: 5000, reputation: 10 };
    engine.mode = 'manager';
    engine.currentWeek = 5;
    engine.pendingMatchBonus = null;
    engine.ticketPolicy = 'normal';
    engine.activeAuctions = [];
    engine.marketPlayers = [];
    return engine;
}

// ============================================================
// BICHO (Match Bonus System)
// ============================================================
describe('MatchBonusSystem (Bicho)', () => {
    let engine;
    beforeEach(() => { engine = createTestEngine(); });

    it('has 4 tiers (none, small, medium, large)', () => {
        expect(MATCH_BONUS_TIERS).toHaveLength(4);
        expect(MATCH_BONUS_TIERS.map(t => t.id)).toEqual(['none', 'small', 'medium', 'large']);
    });

    it('setMatchBonus("none") sets null pending', () => {
        const result = setMatchBonus(engine, 'none');
        expect(result.success).toBe(true);
        expect(engine.pendingMatchBonus).toBeNull();
    });

    it('setMatchBonus("small") sets pending and applies moral boost', () => {
        const prevMorals = engine.teams[0].squad.filter(p => p.isTitular).map(p => p.moral);
        const result = setMatchBonus(engine, 'small');
        expect(result.success).toBe(true);
        expect(engine.pendingMatchBonus.tierId).toBe('small');

        const newMorals = engine.teams[0].squad.filter(p => p.isTitular).map(p => p.moral);
        const boost = MATCH_BONUS_TIERS.find(t => t.id === 'small').moralBoostPre;
        newMorals.forEach((m, i) => {
            expect(m).toBe(Math.min(100, prevMorals[i] + boost));
        });
    });

    it('rejects bicho if balance insufficient', () => {
        engine.teams[0].balance = 100; // not enough for any tier
        const result = setMatchBonus(engine, 'large');
        expect(result.success).toBe(false);
        expect(result.msg).toContain('insuficiente');
    });

    it('getMatchBonusBuff returns 1.0 when no bicho', () => {
        expect(getMatchBonusBuff(engine)).toBe(1.0);
    });

    it('getMatchBonusBuff returns > 1.0 when bicho active', () => {
        setMatchBonus(engine, 'medium');
        expect(getMatchBonusBuff(engine)).toBeGreaterThan(1.0);
    });

    it('settleMatchBonus on WIN debits balance', () => {
        setMatchBonus(engine, 'small');
        const prevBalance = engine.teams[0].balance;
        const result = settleMatchBonus(engine, true);
        expect(result.paid).toBe(true);
        expect(engine.teams[0].balance).toBeLessThan(prevBalance);
        expect(engine.pendingMatchBonus).toBeNull();
    });

    it('settleMatchBonus on LOSS applies frustration but does NOT debit', () => {
        setMatchBonus(engine, 'medium');
        const prevBalance = engine.teams[0].balance;
        const result = settleMatchBonus(engine, false);
        expect(result.paid).toBe(false);
        expect(engine.teams[0].balance).toBe(prevBalance);
        expect(result.moralChange).toBeLessThan(0);
    });

    // BUG-F1-03: moral reversion when switching tiers
    it('reverts previous moral boost when switching tiers', () => {
        // All titulares start at moral 50
        const titulares = engine.teams[0].squad.filter(p => p.isTitular);
        const initialMorals = titulares.map(p => p.moral);

        // Set small bicho (+3 moral)
        setMatchBonus(engine, 'small');
        const afterSmall = titulares.map(p => p.moral);
        afterSmall.forEach((m, i) => expect(m).toBe(initialMorals[i] + 3));

        // Switch to medium (+6 moral) — should revert small's +3, then apply +6
        setMatchBonus(engine, 'medium');
        const afterMedium = titulares.map(p => p.moral);
        afterMedium.forEach((m, i) => expect(m).toBe(initialMorals[i] + 6));

        // Switch to none — should revert medium's +6
        setMatchBonus(engine, 'none');
        const afterNone = titulares.map(p => p.moral);
        afterNone.forEach((m, i) => expect(m).toBe(initialMorals[i]));
    });
});

// ============================================================
// TICKET PRICING SYSTEM
// ============================================================
describe('TicketPricingSystem', () => {
    let engine;
    beforeEach(() => { engine = createTestEngine(); });

    it('has 3 policies (cheap, normal, expensive)', () => {
        expect(TICKET_POLICIES).toHaveLength(3);
        expect(TICKET_POLICIES.map(p => p.id)).toEqual(['cheap', 'normal', 'expensive']);
    });

    it('default policy is normal', () => {
        const policy = getActiveTicketPolicy(engine);
        expect(policy.id).toBe('normal');
        expect(policy.priceMultiplier).toBe(1.0);
    });

    it('setTicketPolicy changes policy', () => {
        const result = setTicketPolicy(engine, 'cheap');
        expect(result.success).toBe(true);
        expect(engine.ticketPolicy).toBe('cheap');
        expect(getActiveTicketPolicy(engine).id).toBe('cheap');
    });

    it('cheap policy increases attendance and home advantage', () => {
        setTicketPolicy(engine, 'cheap');
        const modifiers = getTicketFinanceModifiers(engine);
        expect(modifiers.attendanceMultiplier).toBeGreaterThan(1.0);
        expect(modifiers.priceMultiplier).toBeLessThan(1.0);
        expect(getHomeAdvantageFromTickets(engine)).toBeGreaterThan(1.0);
    });

    it('expensive policy increases revenue but decreases attendance', () => {
        setTicketPolicy(engine, 'expensive');
        const modifiers = getTicketFinanceModifiers(engine);
        expect(modifiers.priceMultiplier).toBeGreaterThan(1.0);
        expect(modifiers.attendanceMultiplier).toBeLessThan(1.0);
        expect(getHomeAdvantageFromTickets(engine)).toBeLessThan(1.0);
    });

    it('moral boost: cheap=+1, normal=0, expensive=-1', () => {
        setTicketPolicy(engine, 'cheap');
        expect(getTicketMoralBoost(engine)).toBe(1);
        setTicketPolicy(engine, 'normal');
        expect(getTicketMoralBoost(engine)).toBe(0);
        setTicketPolicy(engine, 'expensive');
        expect(getTicketMoralBoost(engine)).toBe(-1);
    });

    it('rejects invalid policy', () => {
        const result = setTicketPolicy(engine, 'vip_gold');
        expect(result.success).toBe(false);
    });
});

// ============================================================
// STAR AUCTION SYSTEM
// ============================================================
describe('StarAuctionSystem', () => {
    let engine;
    beforeEach(() => { engine = createTestEngine(); });

    it('requiresAuction for OVR >= 78', () => {
        expect(requiresAuction({ ovr: 78 })).toBe(true);
        expect(requiresAuction({ ovr: 77 })).toBe(false);
        expect(requiresAuction({ ovr: 90 })).toBe(true);
    });

    it('requiresAuction for isSuper or isWonderkid', () => {
        expect(requiresAuction({ ovr: 60, isSuper: true })).toBe(true);
        expect(requiresAuction({ ovr: 50, isWonderkid: true })).toBe(true);
    });

    it('starts auction successfully', () => {
        const player = { id: 999, name: 'Star', ovr: 85, position: 'ATA', value: 20_000_000 };
        engine.marketPlayers.push(player);
        const result = startAuction(engine, player, 20_000_000);
        expect(result.success).toBe(true);
        expect(engine.activeAuctions).toHaveLength(1);
        expect(engine.activeAuctions[0].playerName).toBe('Star');
    });

    it('rejects auction if already at max', () => {
        const p1 = { id: 999, name: 'Star1', ovr: 85, value: 10_000_000 };
        engine.marketPlayers.push(p1);
        startAuction(engine, p1, 10_000_000);
        const p2 = { id: 998, name: 'Star2', ovr: 86, value: 12_000_000 };
        engine.marketPlayers.push(p2);
        const result = startAuction(engine, p2, 12_000_000);
        expect(result.success).toBe(false);
    });

    it('raiseBid increases manager bid', () => {
        const player = { id: 999, name: 'Star', ovr: 85, value: 10_000_000 };
        engine.marketPlayers.push(player);
        startAuction(engine, player, 10_000_000);
        const auction = engine.activeAuctions[0];
        const result = raiseBid(engine, auction.id, 15_000_000);
        expect(result.success).toBe(true);
        expect(auction.managerBid).toBe(15_000_000);
    });

    it('raiseBid rejects lower bid', () => {
        const player = { id: 999, name: 'Star', ovr: 85, value: 10_000_000 };
        engine.marketPlayers.push(player);
        startAuction(engine, player, 10_000_000);
        const auction = engine.activeAuctions[0];
        const result = raiseBid(engine, auction.id, 5_000_000);
        expect(result.success).toBe(false);
    });

    it('resolveAuctions does nothing before deadline', () => {
        const player = { id: 999, name: 'Star', ovr: 85, value: 10_000_000 };
        engine.marketPlayers.push(player);
        startAuction(engine, player, 10_000_000);
        const results = resolveAuctions(engine);
        expect(results).toHaveLength(0);
    });

    it('resolveAuctions resolves after deadline', () => {
        const player = { id: 999, name: 'Star', ovr: 85, value: 10_000_000 };
        engine.marketPlayers.push(player);
        startAuction(engine, player, 10_000_000);
        // Fast-forward past deadline
        engine.currentWeek = engine.activeAuctions[0].weekResolves + 1;
        const results = resolveAuctions(engine);
        expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('getActiveAuctions returns list', () => {
        expect(getActiveAuctions(engine)).toEqual([]);
        const player = { id: 999, name: 'Star', ovr: 85, value: 10_000_000 };
        engine.marketPlayers.push(player);
        startAuction(engine, player, 10_000_000);
        expect(getActiveAuctions(engine)).toHaveLength(1);
    });
});

// ============================================================
// DISCIPLINE SYSTEM
// ============================================================
describe('DisciplineSystem', () => {
    let team;
    beforeEach(() => {
        team = {
            name: 'TestFC',
            squad: [
                { name: 'Player A', moral: 50, isTitular: true, seasonYellows: 0 },
                { name: 'Player B', moral: 50, isTitular: true, seasonYellows: 0 },
                { name: 'Player C', moral: 50, isTitular: true, seasonYellows: 2 },
            ],
        };
    });

    it('increments yellow cards', () => {
        const cards = [{ team: 'TestFC', player: 'Player A', type: 'yellow' }];
        processMatchCards(cards, team);
        expect(team.squad[0].seasonYellows).toBe(1);
    });

    it('suspends after 3 yellows', () => {
        const cards = [{ team: 'TestFC', player: 'Player C', type: 'yellow' }];
        processMatchCards(cards, team);
        expect(team.squad[2].suspension).toBe(1);
        expect(team.squad[2].isTitular).toBe(false);
        expect(team.squad[2].seasonYellows).toBe(0); // reset
    });

    it('suspends on red card', () => {
        const cards = [{ team: 'TestFC', player: 'Player B', type: 'red' }];
        processMatchCards(cards, team);
        expect(team.squad[1].suspension).toBe(1);
        expect(team.squad[1].isTitular).toBe(false);
    });

    it('ignores cards for other teams', () => {
        const cards = [{ team: 'OtherFC', player: 'Player A', type: 'red' }];
        processMatchCards(cards, team);
        expect(team.squad[0].suspension).toBeUndefined();
    });

    it('decrementSuspensions reduces count', () => {
        team.squad[0].suspension = 2;
        decrementSuspensions(team);
        expect(team.squad[0].suspension).toBe(1);
        decrementSuspensions(team);
        expect(team.squad[0].suspension).toBeUndefined();
    });

    it('handles null/empty input gracefully', () => {
        processMatchCards(null, team);
        processMatchCards([], null);
        decrementSuspensions(null);
        // No throw
    });
});

// ============================================================
// CROSS-SYSTEM INTEGRATION
// ============================================================
describe('Elifoot Classic Cross-System Integration', () => {
    let engine;
    beforeEach(() => { engine = createTestEngine(); });

    it('engine exposes all classic APIs', () => {
        expect(typeof engine.setMatchBonus).toBe('function');
        expect(typeof engine.getMatchBonusTiers).toBe('function');
        expect(typeof engine.setTicketPolicy).toBe('function');
        expect(typeof engine.getTicketPolicies).toBe('function');
        expect(typeof engine.getActiveTicketPolicy).toBe('function');
        expect(typeof engine.startAuction).toBe('function');
        expect(typeof engine.raiseBid).toBe('function');
        expect(typeof engine.getActiveAuctions).toBe('function');
        expect(typeof engine.requiresAuction).toBe('function');
    });

    it('classic state fields initialized', () => {
        const fresh = createEngine();
        expect(fresh.pendingMatchBonus).toBeNull();
        expect(fresh.ticketPolicy).toBe('normal');
        expect(fresh.activeAuctions).toEqual([]);
    });

    it('bicho + ticket can coexist', () => {
        engine.setMatchBonus('medium');
        engine.setTicketPolicy('cheap');
        expect(engine.pendingMatchBonus.tierId).toBe('medium');
        expect(engine.ticketPolicy).toBe('cheap');
    });
});
