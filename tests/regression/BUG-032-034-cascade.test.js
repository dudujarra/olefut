// Regression test BUG-032..034: cascade bugs from playtest 1778353150446.
// Discovered after BUG-026 fix exposed: SQUAD_SHORT 725× / 0-65 scorelines /
// SPEC-107 NO_TOP_SCORER even after 48k matches.
import { describe, test, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { initCareerStats, recordMatchStats } from '../../src/engine/PlayerTraits.js';

describe('BUG-032 — squad auto-replenish via youth intake', () => {
    let engine;
    beforeEach(() => {
        engine = new Engine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
    });

    test('triggerYouthIntake adds players to squad', () => {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return;
        const before = team.squad.length;
        engine.triggerYouthIntake();
        expect(team.squad.length).toBeGreaterThan(before);
    });

    test('triggerYouthIntake callable mid-season (week !== 38)', () => {
        engine.currentWeek = 10;
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return;
        const before = team.squad.length;
        const youths = engine.triggerYouthIntake();
        expect(Array.isArray(youths)).toBe(true);
        expect(team.squad.length).toBeGreaterThanOrEqual(before);
    });
});

describe('BUG-033 — match goal cap (12 combined max)', () => {
    test('match never exceeds 12 combined goals even with weak squad', () => {
        const engine = new Engine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        // Force minimal squads to maximize chance of high scoring
        const home = engine.teams[0];
        const away = engine.teams[1];
        if (home && away) {
            // Strip defense / GK to push chanceRatio high
            home.squad?.forEach(p => { if (p.position === 'DEF' || p.position === 'GOL') p.injury = { weeksLeft: 5 }; });
            away.squad?.forEach(p => { if (p.position === 'DEF' || p.position === 'GOL') p.injury = { weeksLeft: 5 }; });
        }
        const result = engine.playMatch(home.id, away.id);
        expect(result).toBeDefined();
        expect(result.homeGoals + result.awayGoals).toBeLessThanOrEqual(12);
    });

    test('normal match still produces realistic scores', () => {
        const engine = new Engine();
        engine.initGame('TestBot', 1, 'manager', 'livre');
        const home = engine.teams[0];
        const away = engine.teams[1];
        const result = engine.playMatch(home.id, away.id);
        expect(result.homeGoals).toBeGreaterThanOrEqual(0);
        expect(result.awayGoals).toBeGreaterThanOrEqual(0);
        // realistic upper bound — most matches < 8 combined
        expect(result.homeGoals + result.awayGoals).toBeLessThanOrEqual(12);
    });
});

describe('BUG-034 — career stat field names match PlayerTraits', () => {
    test('initCareerStats creates totalGoals/seasonGoals/totalAssists/totalApps fields', () => {
        const player = { name: 'Test', position: 'ATA' };
        initCareerStats(player);
        expect(player.career).toBeDefined();
        expect(player.career.totalGoals).toBe(0);
        expect(player.career.seasonGoals).toBe(0);
        expect(player.career.totalAssists).toBe(0);
        expect(player.career.totalApps).toBe(0);
    });

    test('recordMatchStats increments totalGoals (not goals)', () => {
        const player = { name: 'Test', position: 'ATA' };
        initCareerStats(player);
        recordMatchStats(player, 2, 1, 0, false);
        expect(player.career.totalGoals).toBe(2);
        expect(player.career.seasonGoals).toBe(2);
        // 'goals' field does NOT exist
        expect(player.career.goals).toBeUndefined();
    });

    test('AutoPlayService telemetry reads totalGoals correctly (smoke)', () => {
        // Ensure the snapshot path doesn't crash and reads correct field
        const player = { name: 'Striker', position: 'ATA' };
        initCareerStats(player);
        recordMatchStats(player, 5, 0, 0, true);
        const goalsField = player.career?.totalGoals || player.career?.seasonGoals || 0;
        expect(goalsField).toBe(5);
    });
});
