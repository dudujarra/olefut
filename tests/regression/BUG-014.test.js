// Regression test for BUG-014
// NewsSystem.news array crescia indefinidamente (memory leak)
// archiveOldNews só marcava archived=true, não removia
// Issue: https://github.com/dudujarra/elifoot-web/issues/10
import { describe, test, expect, beforeEach } from 'vitest';
import { NewsSystem } from '../../src/engine/systems/NewsSystem.js';

describe('BUG-014 regression: news array bounded', () => {
    let news;
    beforeEach(() => {
        news = new NewsSystem(50); // cap baixo pra teste
    });

    test('Array nunca passa maxRetained', () => {
        for (let i = 0; i < 200; i++) {
            news.generateNews({
                type: 'Vitória',
                teamId: 1,
                weekOfYear: i,
                details: { team: `Team${i}`, score: '1-0' },
            });
        }
        expect(news.news.length).toBeLessThanOrEqual(50);
    });

    test('Archive remove news muito antigas (> 12 weeks após archived)', () => {
        // Cria news week 1
        news.generateNews({
            type: 'Vitória',
            teamId: 1,
            weekOfYear: 1,
            details: { team: 'X', score: '1-0' },
        });
        const before = news.news.length;

        // Archive em week 5 (4 weeks ago) — só marca archived
        news.archiveOldNews(5);
        expect(news.news.length).toBe(before);

        // Archive em week 20 (19 weeks ago > 12) — remove
        news.archiveOldNews(20);
        expect(news.news.length).toBe(0);
    });

    test('Default cap = 500', () => {
        const defaultNews = new NewsSystem();
        expect(defaultNews.maxRetained).toBe(500);
    });

    test('Cap configurable via constructor', () => {
        const small = new NewsSystem(10);
        for (let i = 0; i < 50; i++) {
            small.generateNews({
                type: 'Derrota',
                teamId: 1,
                weekOfYear: i,
                details: { team: 'X', rival: 'Y', score: '0-1' },
            });
        }
        expect(small.news.length).toBeLessThanOrEqual(10);
    });
});
