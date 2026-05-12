// Regression test — BUG-086
// Audit AKITA-233 + brutal audit apontam que achievements declarados em
// `src/engine/systems/AchievementsSystem.js` (Hat_trick, Iron_man, etc) não têm
// callsites reais durante a partida — `player.career.hatTricks` é lido por
// `AchievementsView.computeProgress` mas **nunca era escrito** antes deste fix.
//
// Fix (parcial — Hat_trick):
//   - `PlayerTraits.initCareerStats` agora inicializa `hatTricks: 0` (com backfill).
//   - `PlayerTraits.recordMatchStats` incrementa `player.career.hatTricks` quando
//     `goals >= 3` numa partida (caminho squad, via MatchSimulator).
//   - `CareerService` (proPlayer mode) acumula `matchGoals` por partida e
//     incrementa `proPlayer.career.hatTricks`.
//
// Demais achievements (~15) ficam documentados em BUGS.md como backlog — a tela
// `AchievementsView` mostra progress 0% (default) para eles.

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initCareerStats, recordMatchStats } from '../../src/engine/PlayerTraits.js';
import { ACHIEVEMENTS } from '../../src/engine/systems/AchievementsSystem.js';

const ACHIEVEMENTS_VIEW_SRC = readFileSync(resolve('src/components/AchievementsView.jsx'), 'utf-8');
const CAREER_SERVICE_SRC = readFileSync(resolve('src/services/CareerService.js'), 'utf-8');

function makePlayer() {
    return { id: 't1', name: 'Test Striker', position: 'ATA', ovr: 80, age: 24 };
}

describe('BUG-086 — Hat_trick callsite (squad, via recordMatchStats)', () => {
    test('initCareerStats initializes hatTricks: 0', () => {
        const p = makePlayer();
        initCareerStats(p);
        expect(p.career.hatTricks).toBe(0);
    });

    test('initCareerStats backfills hatTricks on existing career sub-tree', () => {
        const p = makePlayer();
        p.career = { totalGoals: 50, seasonGoals: 10 };
        initCareerStats(p);
        expect(p.career.hatTricks).toBe(0);
    });

    test('recordMatchStats(goals=3) increments hatTricks', () => {
        const p = makePlayer();
        initCareerStats(p);
        recordMatchStats(p, 3, 0, 0, false);
        expect(p.career.hatTricks).toBe(1);
        expect(p.career.totalGoals).toBe(3);
    });

    test('recordMatchStats(goals=2) does NOT increment hatTricks', () => {
        const p = makePlayer();
        initCareerStats(p);
        recordMatchStats(p, 2, 0, 0, false);
        expect(p.career.hatTricks).toBe(0);
    });

    test('recordMatchStats(goals=5) increments hatTricks by 1 (not by 5)', () => {
        const p = makePlayer();
        initCareerStats(p);
        recordMatchStats(p, 5, 0, 0, false);
        expect(p.career.hatTricks).toBe(1);
    });

    test('multiple hat-tricks accumulate', () => {
        const p = makePlayer();
        initCareerStats(p);
        recordMatchStats(p, 3, 0, 0, false);
        recordMatchStats(p, 1, 0, 0, false);
        recordMatchStats(p, 4, 0, 0, false);
        expect(p.career.hatTricks).toBe(2);
        expect(p.career.totalGoals).toBe(8);
    });
});

describe('BUG-086 — Hat_trick callsite (proPlayer, via CareerService)', () => {
    test('CareerService increments proPlayer.career.hatTricks on matchGoals >= 3', () => {
        // Sanity: the code path exists in CareerService.js
        expect(CAREER_SERVICE_SRC).toMatch(/matchGoals\s*>=\s*3/);
        expect(CAREER_SERVICE_SRC).toMatch(/career\.hatTricks\+\+|career\.hatTricks\s*\+=\s*1/);
        expect(CAREER_SERVICE_SRC).toContain('HAT-TRICK');
    });

    test('AchievementsView reads engine.proPlayer?.career?.hatTricks for Hat_trick progress', () => {
        expect(ACHIEVEMENTS_VIEW_SRC).toContain('hatTricks');
        expect(ACHIEVEMENTS_VIEW_SRC).toMatch(/case 'Hat_trick'/);
    });
});

describe('BUG-086 — Backlog of achievements without real callsite (consciousness test)', () => {
    // This list documents which achievements still resolve to default 0% in
    // AchievementsView.computeProgress. It exists so a future PR that fixes
    // them has to update this list, forcing re-audit.
    const ACHIEVEMENTS_WITHOUT_CALLSITE = [
        'Golden_boot',
        'Overhead',
        'National_hero',
        'Club_legend',
        'Perfect_season',
        'Cinderella',
        'Comeback',
        'Defensive_masterclass',
        'Flawless_match',
        'From_zero',
        'Winter_champion',
        'Spring_winner',
        'Rival_slayer',
        'Underdog',
        'Rivalry_master',
    ];

    test('all declared achievements without callsite are still in ACHIEVEMENTS dict (proves the gap is real)', () => {
        for (const id of ACHIEVEMENTS_WITHOUT_CALLSITE) {
            expect(ACHIEVEMENTS[id], `${id} should still exist (backlog).`).toBeDefined();
        }
    });

    test('AchievementsView.computeProgress switch has no case for unhooked achievements (gap is observable)', () => {
        for (const id of ACHIEVEMENTS_WITHOUT_CALLSITE) {
            expect(ACHIEVEMENTS_VIEW_SRC, `${id} should NOT have a switch case yet (would mean it was fixed without updating this list).`)
                .not.toContain(`case '${id}'`);
        }
    });
});
