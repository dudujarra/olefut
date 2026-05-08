// SPEC-027: News & Announcements System
// Headlines automáticas baseadas em eventos. Afeta morale/prestige.

export const NEWS_TYPES = {
    Vitória: { moralImpact: 5, prestigeImpact: 0, importance: 2 },
    Derrota: { moralImpact: -10, prestigeImpact: 0, importance: 3 },
    'Lesão star': { moralImpact: -15, prestigeImpact: 0, importance: 4 },
    'Gol record': { moralImpact: 8, prestigeImpact: 8, importance: 4 },
    Contratação: { moralImpact: 10, prestigeImpact: 2, importance: 3 },
    'Demissão tech': { moralImpact: -20, prestigeImpact: 0, importance: 5 },
    Rebaixamento: { moralImpact: -50, prestigeImpact: -50, importance: 5 },
    Título: { moralImpact: 30, prestigeImpact: 50, importance: 5 },
    'Transferência saída': { moralImpact: -20, prestigeImpact: 0, importance: 4 },
    Controvérsia: { moralImpact: -15, prestigeImpact: 0, importance: 3 },
    Milestone: { moralImpact: 5, prestigeImpact: 5, importance: 2 },
    'Rival news': { moralImpact: -5, prestigeImpact: 0, importance: 2 },
    'National callup': { moralImpact: 10, prestigeImpact: 0, importance: 3 },
    'Staff hire': { moralImpact: 3, prestigeImpact: 0, importance: 1 },
    'Stadium upgrade': { moralImpact: 5, prestigeImpact: 0, importance: 2 },
    'Sponsor deal': { moralImpact: 5, prestigeImpact: 0, importance: 2 },
    'Youth promotion': { moralImpact: 3, prestigeImpact: 0, importance: 2 },
    'Friendly offer': { moralImpact: 1, prestigeImpact: 0, importance: 1 },
    Awards: { moralImpact: 8, prestigeImpact: 8, importance: 4 },
    'Market rumor': { moralImpact: 0, prestigeImpact: 0, importance: 1 },
};

const HEADLINE_TEMPLATES = {
    Vitória: ({ team, score }) => `${team} vence por ${score}`,
    Derrota: ({ team, rival, score }) => `${team} cai diante de ${rival} (${score})`,
    'Lesão star': ({ player, weeks }) => `${player} sofre lesão e fica fora por ${weeks} weeks`,
    'Gol record': ({ player, goals }) => `${player} bate recorde com ${goals} gols`,
    Contratação: ({ team, player }) => `${team} anuncia ${player}`,
    'Demissão tech': ({ coach, team }) => `${coach} deixa ${team}`,
    Título: ({ team }) => `🏆 ${team} é CAMPEÃO!`,
    Rebaixamento: ({ team }) => `${team} é REBAIXADO`,
    'Transferência saída': ({ player, newTeam }) => `${player} se transfere para ${newTeam}`,
};

let nextNewsId = 1;
const MAX_NEWS_RETAINED = 500; // BUG-014: cap retention para evitar memory leak

export class NewsSystem {
    constructor(maxRetained = MAX_NEWS_RETAINED) {
        this.news = []; // all news (capped)
        this.readSet = new Map(); // playerId → set of newsIds
        this.maxRetained = maxRetained;
    }

    generateNews({ type, teamId, weekOfYear, details = {} }) {
        const config = NEWS_TYPES[type];
        if (!config) return null;

        const headlineFn = HEADLINE_TEMPLATES[type];
        const headline = headlineFn ? headlineFn(details) : `${type} — ${details.team || 'Notícia'}`;

        // Avoid duplicates same week
        const dup = this.news.find(
            (n) => n.headline === headline && n.week === weekOfYear
        );
        if (dup) return dup;

        const item = {
            id: `news_${nextNewsId++}`,
            headline,
            body: details.body || headline,
            type,
            teamId,
            week: weekOfYear,
            moralImpact: config.moralImpact,
            prestigeImpact: config.prestigeImpact,
            importance: config.importance,
            read: false,
            archived: false,
        };
        this.news.push(item);
        // BUG-014: cap array size — descarta archived antigas + se ainda > max, drop oldest
        if (this.news.length > this.maxRetained) {
            this.news = this.news.filter((n) => !n.archived);
            if (this.news.length > this.maxRetained) {
                this.news = this.news.slice(-this.maxRetained);
            }
        }
        return item;
    }

    getNews({ teamId, week, limit = 10, filter = 'team' }) {
        let filtered = this.news.filter((n) => !n.archived);
        if (week !== undefined) {
            filtered = filtered.filter((n) => week - n.week < 4);
        }
        if (filter === 'team' && teamId) {
            filtered = filtered.filter((n) => n.teamId === teamId);
        }
        return filtered.slice(-limit).reverse();
    }

    readNews(newsId, playerId) {
        const item = this.news.find((n) => n.id === newsId);
        if (!item) return 0;
        item.read = true;
        const set = this.readSet.get(playerId) || new Set();
        if (set.has(newsId)) return 0;
        set.add(newsId);
        this.readSet.set(playerId, set);
        return item.moralImpact;
    }

    archiveOldNews(currentWeek) {
        for (const n of this.news) {
            if (currentWeek - n.week >= 4) n.archived = true;
        }
        // BUG-014: prune archived após X weeks (não acumula indefinidamente)
        this.news = this.news.filter((n) => !(n.archived && currentWeek - n.week > 12));
    }
}
