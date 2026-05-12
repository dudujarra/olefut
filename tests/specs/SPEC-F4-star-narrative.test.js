/**
 * SPEC-F4.2 + F4.3: StarPlayerNarrative harness
 */

import { describe, it, expect } from 'vitest';
import {
    getWeeklyQuote,
    detectStarMoment,
    WEEKLY_QUOTE_TEMPLATES,
    MOMENT_TEMPLATES,
} from '../../src/engine/StarPlayerNarrative.js';

const player = { name: 'Pelé', seasonGoals: 0, seasonApps: 0 };

describe('SPEC-F4.2: getWeeklyQuote', () => {

    it('returns string with player name', () => {
        const q = getWeeklyQuote(player, 0);
        expect(q).toContain('Pelé');
    });

    it('determinism via seed', () => {
        expect(getWeeklyQuote(player, 7)).toBe(getWeeklyQuote(player, 7));
    });

    it('different seeds different quotes', () => {
        const quotes = new Set();
        for (let s = 0; s < 10; s++) quotes.add(getWeeklyQuote(player, s));
        expect(quotes.size).toBeGreaterThan(1);
    });

    it('null player → empty', () => {
        expect(getWeeklyQuote(null)).toBe('');
    });

    it('at least 10 templates available', () => {
        expect(WEEKLY_QUOTE_TEMPLATES.length).toBeGreaterThanOrEqual(10);
    });

    it('no emoji in templates', () => {
        const all = WEEKLY_QUOTE_TEMPLATES.join(' ');
        // eslint-disable-next-line no-misleading-character-class
        expect(/[\u{1F300}-\u{1FAFF}]/u.test(all)).toBe(false);
    });
});

describe('SPEC-F4.3: detectStarMoment', () => {

    it('first_goal detected', () => {
        const r = detectStarMoment({ name: 'Pelé', seasonGoals: 1 }, { previousGoals: 0 });
        expect(r?.type).toBe('first_goal');
        expect(r?.text).toContain('Pelé');
    });

    it('hat_trick detected via goalsThisMatch', () => {
        const r = detectStarMoment({ name: 'Pelé', seasonGoals: 5 }, { goalsThisMatch: 3 });
        expect(r?.type).toBe('hat_trick');
    });

    it('fifty_apps milestone', () => {
        const r = detectStarMoment({ name: 'Pelé', seasonApps: 50 }, { previousApps: 49 });
        expect(r?.type).toBe('fifty_apps');
    });

    it('hundred_apps milestone', () => {
        const r = detectStarMoment({ name: 'Pelé', seasonApps: 100 }, { previousApps: 99 });
        expect(r?.type).toBe('hundred_apps');
    });

    it('long_injury detected', () => {
        const r = detectStarMoment({ name: 'Pelé' }, { injuryWeeks: 6 });
        expect(r?.type).toBe('long_injury');
        expect(r?.text).toContain('6');
    });

    it('derby_winner detected', () => {
        const r = detectStarMoment({ name: 'Pelé' }, { isDerby: true, goalsThisMatch: 1, matchResult: 'W' });
        expect(r?.type).toBe('derby_winner');
    });

    it('title_winner detected with trophy', () => {
        const r = detectStarMoment({ name: 'Pelé' }, { trophyWon: 'Brasileirão Série A' });
        expect(r?.type).toBe('title_winner');
        expect(r?.text).toContain('Brasileirão');
    });

    it('no moment returns null', () => {
        const r = detectStarMoment({ name: 'Pelé', seasonGoals: 5, seasonApps: 20 }, { previousGoals: 4, previousApps: 19 });
        expect(r).toBe(null);
    });

    it('null player → null', () => {
        expect(detectStarMoment(null)).toBe(null);
    });

    it('priority: hat_trick over first_goal', () => {
        const r = detectStarMoment({ name: 'Pelé', seasonGoals: 3 }, { previousGoals: 0, goalsThisMatch: 3 });
        expect(r?.type).toBe('hat_trick');
    });
});
