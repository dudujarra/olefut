/**
 * Unit tests for PlayerCareer (ProPlayer class)
 * AKITA-411: Top 10 unit test coverage
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ProPlayer, SUB_ATTRIBUTES, ALL_SUB_ATTRS, LIFESTYLE_CATALOG, TRAITS_CATALOG, PERSONALITIES } from '../../src/engine/PlayerCareer.js';

describe('ProPlayer', () => {
    let player;

    beforeEach(() => {
        player = new ProPlayer(1, 'Test Player', 'ATA');
    });

    describe('constructor', () => {
        it('initializes with correct defaults', () => {
            expect(player.id).toBe(1);
            expect(player.name).toBe('Test Player');
            expect(player.position).toBe('ATA');
            expect(player.energy).toBe(100);
            expect(player.money).toBe(0);
            expect(player.actionSlots).toBe(3);
            expect(player.stress).toBe(0);
            expect(player.mentalBreakActive).toBe(false);
            expect(player.starRating).toBe(1);
        });

        it('initializes all 16 sub-attributes', () => {
            expect(Object.keys(player.subAttrs).length).toBe(16);
            ALL_SUB_ATTRS.forEach(attr => {
                expect(player.subAttrs[attr]).toBeGreaterThanOrEqual(1);
                expect(player.subAttrs[attr]).toBeLessThanOrEqual(99);
            });
        });

        it('initializes all NPC relationships at 50', () => {
            expect(player.npcRelationships.coach).toBe(50);
            expect(player.npcRelationships.journalist).toBe(50);
        });
    });

    describe('canAct', () => {
        it('returns true when slots available', () => {
            expect(player.canAct).toBe(true);
        });
        it('returns false when no slots', () => {
            player.actionSlots = 0;
            expect(player.canAct).toBe(false);
        });
    });

    describe('rest()', () => {
        it('restores 30 energy and consumes a slot', () => {
            player.energy = 50;
            const result = player.rest();
            expect(result.success).toBe(true);
            expect(result.msg).toContain('Descansou');
            expect(player.energy).toBe(80);
            expect(player.actionSlots).toBe(2);
        });

        it('caps energy at 100', () => {
            player.energy = 90;
            player.rest();
            expect(player.energy).toBe(100);
        });

        it('fails when no action slots', () => {
            player.actionSlots = 0;
            const result = player.rest();
            expect(result.success).toBe(false);
            expect(result.msg).toContain('Sem ações');
        });
    });

    describe('buyEnergyDrink() / consumeEnergyDrink()', () => {
        it('buys and consumes energy drink', () => {
            player.money = 200;
            const buy = player.buyEnergyDrink();
            expect(buy.success).toBe(true);
            expect(player.energyDrinks).toBe(1);
            expect(player.money).toBe(100);

            player.energy = 50;
            const consume = player.consumeEnergyDrink();
            expect(consume.success).toBe(true);
            expect(player.energy).toBe(90);
            expect(player.energyDrinks).toBe(0);
        });

        it('fails to buy without money', () => {
            expect(player.buyEnergyDrink().success).toBe(false);
        });

        it('fails to consume without stock', () => {
            expect(player.consumeEnergyDrink().success).toBe(false);
        });
    });

    describe('buyLifestyle()', () => {
        beforeEach(() => { player.money = 10_000_000; });

        it('buys a house', () => {
            const result = player.buyLifestyle('apartment_t1');
            expect(result.success).toBe(true);
            expect(player.lifestyle.ownedHouse).toBe('apartment_t1');
        });

        it('prevents duplicate house', () => {
            player.buyLifestyle('apartment_t1');
            const result = player.buyLifestyle('apartment_t1');
            expect(result.success).toBe(false);
        });

        it('prevents wedding if already married', () => {
            player.lifestyle.isMarried = true;
            const result = player.buyLifestyle('wedding');
            expect(result.success).toBe(false);
        });

        it('fails for unknown item', () => {
            expect(player.buyLifestyle('nonexistent').success).toBe(false);
        });
    });

    describe('buyTrait()', () => {
        it('buys a trait successfully', () => {
            player.money = 5000;
            player.relationships.boss = 80;
            const result = player.buyTrait('set_piece_taker');
            expect(result.success).toBe(true);
            expect(player.traits).toContain('set_piece_taker');
        });

        it('fails with insufficient boss approval', () => {
            player.money = 5000;
            player.relationships.boss = 10;
            const result = player.buyTrait('sweeper_keeper'); // requires 70
            expect(result.success).toBe(false);
        });

        it('fails if already owned', () => {
            player.money = 50000;
            player.relationships.boss = 100;
            player.buyTrait('target_man');
            const result = player.buyTrait('target_man');
            expect(result.success).toBe(false);
        });
    });

    describe('stress system', () => {
        it('adds stress and triggers mental break at 75', () => {
            player.addStress(40, 'test');
            expect(player.stress).toBe(40);
            expect(player.mentalBreakActive).toBe(false);

            player.addStress(40, 'test');
            expect(player.stress).toBe(80);
            expect(player.mentalBreakActive).toBe(true);
        });

        it('caps stress at 100', () => {
            player.addStress(200, 'test');
            expect(player.stress).toBe(100);
        });

        it('resolveMentalBreak(party) reduces stress by 40', () => {
            player.stress = 80;
            player.mentalBreakActive = true;
            player.resolveMentalBreak('party');
            expect(player.stress).toBe(40);
            expect(player.mentalBreakActive).toBe(false);
        });

        it('resolveMentalBreak(therapy) costs money', () => {
            player.stress = 80;
            player.money = 5000;
            player.mentalBreakActive = true;
            player.resolveMentalBreak('therapy');
            expect(player.money).toBe(3000);
        });
    });

    describe('stressEfficiency', () => {
        it('returns 1.0 when stress < 25', () => { player.stress = 10; expect(player.stressEfficiency).toBe(1.0); });
        it('returns 0.9 when stress 25-49', () => { player.stress = 30; expect(player.stressEfficiency).toBe(0.9); });
        it('returns 0.8 when stress 50-74', () => { player.stress = 60; expect(player.stressEfficiency).toBe(0.8); });
        it('returns 0.6 when stress >= 75', () => { player.stress = 80; expect(player.stressEfficiency).toBe(0.6); });
    });

    describe('updateStarRating()', () => {
        it('maps renown to correct star tier', () => {
            player.renown = 0; player.updateStarRating(); expect(player.starRating).toBe(1);
            player.renown = 5; player.updateStarRating(); expect(player.starRating).toBe(2);
            player.renown = 15; player.updateStarRating(); expect(player.starRating).toBe(3);
            player.renown = 30; player.updateStarRating(); expect(player.starRating).toBe(4);
            player.renown = 50; player.updateStarRating(); expect(player.starRating).toBe(5);
        });
    });

    describe('playMatch()', () => {
        it('drains energy and updates relationships', () => {
            player.energy = 100;
            player.playMatch(90, 2, true);
            expect(player.energy).toBe(55); // 100 - 90*0.5
            expect(player.seasonGoals).toBe(2);
            expect(player.relationships.fans).toBeGreaterThan(50);
            expect(player.relationships.boss).toBeGreaterThan(50);
        });
    });

    describe('chain event flags', () => {
        it('set/has/clear', () => {
            expect(player.hasFlag('test')).toBe(false);
            player.setFlag('test', { data: true });
            expect(player.hasFlag('test')).toBe(true);
            player.clearFlag('test');
            expect(player.hasFlag('test')).toBe(false);
        });
    });

    describe('processInvestments()', () => {
        it('returns weekly yields from investments', () => {
            player.lifestyle.investments = [
                { id: 'stocks', amount: 100000, returnPercent: 8, weekStart: 0 }
            ];
            const ret = player.processInvestments();
            expect(ret).toBe(Math.floor(100000 * 0.08 / 52));
            expect(player.money).toBe(ret);
        });
    });
});

describe('Constants integrity', () => {
    it('SUB_ATTRIBUTES has 4 groups totaling 16', () => {
        expect(Object.keys(SUB_ATTRIBUTES).length).toBe(4);
        expect(ALL_SUB_ATTRS.length).toBe(16);
    });

    it('PERSONALITIES has valid multipliers', () => {
        Object.values(PERSONALITIES).forEach(p => {
            expect(p.trainXPMultiplier).toBeGreaterThan(0);
            expect(p.fansMultiplier).toBeGreaterThan(0);
        });
    });

    it('TRAITS_CATALOG has valid costs and boss requirements', () => {
        Object.values(TRAITS_CATALOG).forEach(t => {
            expect(t.cost).toBeGreaterThan(0);
            expect(t.requiredBoss).toBeGreaterThanOrEqual(0);
            expect(t.requiredBoss).toBeLessThanOrEqual(100);
        });
    });

    it('LIFESTYLE_CATALOG items have costs', () => {
        Object.values(LIFESTYLE_CATALOG).forEach(item => {
            expect(item.cost).toBeGreaterThan(0);
            expect(item.type).toBeDefined();
        });
    });
});
