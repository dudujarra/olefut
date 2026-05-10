// Regression test for BUG-022 / BUG-077
// Division ecosystem degrades: processPromoRelegation only ran for bot's division,
// so div 2 shrank each season (teams leave, nothing refills from div 1 / div 3).
// Fix: processPromoRelegation runs for ALL zone/division leagues each season.
import { describe, test, expect } from 'vitest';
import { processPromoRelegation } from '../../src/engine/SeasonSystem';

function makeTeams(divMap) {
    return Object.entries(divMap).map(([id, div]) => ({
        id: parseInt(id), zone: 'BRA', division: div, name: `Team${id}`
    }));
}

function countInDiv(teams, div) {
    return teams.filter(t => t.zone === 'BRA' && t.division === div).length;
}

describe('BUG-022 — All divisions process promo/relegation', () => {

    test('promotes top 2 and relegates bottom 2 in a normal 4-team div', () => {
        const teams = makeTeams({ 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 2, 7: 3 });
        const div2Standings = [
            { teamId: 3, points: 30 },
            { teamId: 4, points: 25 },
            { teamId: 5, points: 15 },
            { teamId: 6, points: 10 },
        ];
        processPromoRelegation(teams, div2Standings, 'BRA', 2);
        expect(teams.find(t => t.id === 3).division).toBe(1); // promoted
        expect(teams.find(t => t.id === 4).division).toBe(1); // promoted
        expect(teams.find(t => t.id === 5).division).toBe(3); // relegated
        expect(teams.find(t => t.id === 6).division).toBe(3); // relegated
    });

    test('top 2 of div 1 do NOT get promoted above div 1', () => {
        const teams = makeTeams({ 1: 1, 2: 1, 3: 1, 4: 1 });
        const div1Standings = [
            { teamId: 1, points: 50 },
            { teamId: 2, points: 40 },
            { teamId: 3, points: 20 },
            { teamId: 4, points: 5 },
        ];
        processPromoRelegation(teams, div1Standings, 'BRA', 1);
        expect(teams.find(t => t.id === 1).division).toBe(1);
        expect(teams.find(t => t.id === 2).division).toBe(1);
        expect(teams.find(t => t.id === 3).division).toBe(2); // relegated
        expect(teams.find(t => t.id === 4).division).toBe(2); // relegated
    });

    test('bottom 2 of div 4 do NOT get relegated below div 4', () => {
        const teams = makeTeams({ 10: 4, 11: 4, 12: 4, 13: 4 });
        const div4Standings = [
            { teamId: 10, points: 30 },
            { teamId: 11, points: 25 },
            { teamId: 12, points: 10 },
            { teamId: 13, points: 5 },
        ];
        processPromoRelegation(teams, div4Standings, 'BRA', 4);
        expect(teams.find(t => t.id === 12).division).toBe(4); // cannot go below 4
        expect(teams.find(t => t.id === 13).division).toBe(4); // cannot go below 4
        expect(teams.find(t => t.id === 10).division).toBe(3); // promoted to 3
        expect(teams.find(t => t.id === 11).division).toBe(3); // promoted to 3
    });

    test('BUG-022: all 4 divs processed each season → div counts stay stable', () => {
        // 4 teams per division (16 total) — simulate one full season turn
        // with the fix applied: processPromoRelegation for each division.
        const teams = makeTeams({
            1: 1, 2: 1, 3: 1, 4: 1,  // div 1
            5: 2, 6: 2, 7: 2, 8: 2,  // div 2
            9: 3, 10: 3, 11: 3, 12: 3, // div 3
            13: 4, 14: 4, 15: 4, 16: 4  // div 4
        });

        // Standings for each division (sorted best→worst)
        const standings = {
            1: [{ teamId: 1, points: 30 }, { teamId: 2, points: 25 }, { teamId: 3, points: 10 }, { teamId: 4, points: 5 }],
            2: [{ teamId: 5, points: 30 }, { teamId: 6, points: 25 }, { teamId: 7, points: 10 }, { teamId: 8, points: 5 }],
            3: [{ teamId: 9, points: 30 }, { teamId: 10, points: 25 }, { teamId: 11, points: 10 }, { teamId: 12, points: 5 }],
            4: [{ teamId: 13, points: 30 }, { teamId: 14, points: 25 }, { teamId: 15, points: 10 }, { teamId: 16, points: 5 }],
        };

        // Run ALL divisions (the fix)
        for (let div = 1; div <= 4; div++) {
            processPromoRelegation(teams, standings[div], 'BRA', div);
        }

        // Each division should still have exactly 4 teams after a full turn
        // (2 relegated in + 2 promoted out = net 0 for middle divisions)
        expect(countInDiv(teams, 1)).toBe(4);
        expect(countInDiv(teams, 2)).toBe(4);
        expect(countInDiv(teams, 3)).toBe(4);
        expect(countInDiv(teams, 4)).toBe(4);
    });

    test('BUG-022 regression: without fix, div 2 shrinks each season', () => {
        // Demonstrates the original bug: only processing div 2 causes it to shrink.
        // 4 div1 teams, 4 div2 teams, NO div3 teams (simulating unprocessed div3).
        const teams = makeTeams({
            1: 1, 2: 1, 3: 1, 4: 1,
            5: 2, 6: 2, 7: 2, 8: 2,
        });
        const div2Standings = [
            { teamId: 5, points: 30 },
            { teamId: 6, points: 25 },
            { teamId: 7, points: 10 },
            { teamId: 8, points: 5 },
        ];
        // Old behavior: only div2 processed, div1 never relegates, div3 never promotes
        processPromoRelegation(teams, div2Standings, 'BRA', 2);
        // div2 loses 4 (2 up to div1, 2 down to div3) and gains 0 → shrinks
        expect(countInDiv(teams, 2)).toBe(0); // BUG: div 2 empty after 1 season
    });
});
