/**
 * SeasonSystem.js — Patrocínio, Calendário de Eventos, Promoção/Rebaixamento e Legado
 * AKITA-011 + AKITA-012 consolidados
 */

// ============================================================
// PATROCÍNIO
// ============================================================
// SPEC-125 BUG-071: cut sponsor pay 50% — bot accumulating R$ 4.7B+ peak
// because sponsor income > all expenses combined. Realistic football economy.
export const SPONSOR_TIERS = [
    { id: "bronze", name: "🥉 Loja do Bairro", weeklyPay: 25000, reqDivision: 4, reqPosition: 99 },
    { id: "silver", name: "🥈 Rede Regional", weeklyPay: 100000, reqDivision: 3, reqPosition: 10 },
    { id: "gold", name: "🥇 Marca Nacional", weeklyPay: 300000, reqDivision: 2, reqPosition: 6 },
    { id: "diamond", name: "💎 Multinacional", weeklyPay: 750000, reqDivision: 1, reqPosition: 4 },
    { id: "platinum", name: "👑 Patrocinador Master", weeklyPay: 1500000, reqDivision: 1, reqPosition: 1 },
];

export function evaluateSponsor(division, position) {
    let best = SPONSOR_TIERS[0];
    for (const tier of SPONSOR_TIERS) {
        if (division <= tier.reqDivision && position <= tier.reqPosition) {
            best = tier;
        }
    }
    return best;
}

// ============================================================
// CALENDÁRIO DE EVENTOS
// ============================================================
export const CALENDAR_EVENTS = [
    { week: 1, name: "🏁 Início da Temporada", effect: { moral: 5 }, msg: "Nova temporada! O elenco está motivado." },
    { week: 5, name: "🏆 Sorteio da Copa", effect: null, msg: "Sorteio da copa realizado." },
    { week: 10, name: "📊 Avaliação Trimestral", effect: null, msg: "A diretoria avalia seu desempenho." },
    { week: 15, name: "🔄 Janela de Transferências Aberta", effect: null, msg: "Janela de transferências aberta! Aproveite." },
    { week: 19, name: "⚡ Derby da Cidade", effect: { moral: 3, energy: -5 }, msg: "O clássico está chegando! Tensão no ar." },
    { week: 20, name: "🔒 Janela de Transferências Fechada", effect: null, msg: "Janela de transferências fechou." },
    { week: 25, name: "📊 Avaliação Semestral", effect: null, msg: "Metade da temporada. A diretoria está de olho." },
    { week: 30, name: "🔥 Reta Final", effect: { moral: -3, energy: -5 }, msg: "Reta final! Pressão total sobre o elenco." },
    { week: 34, name: "🎓 Revelação da Base", effect: null, msg: "Novos jovens serão promovidos em breve." },
    { week: 38, name: "🏁 Fim da Temporada", effect: { moral: 0 }, msg: "Temporada encerrada!" },
];

export function getCalendarEvent(week) {
    return CALENDAR_EVENTS.find(e => e.week === week) || null;
}

// ============================================================
// PROMOÇÃO / REBAIXAMENTO
// ============================================================
export function calculateSeasonEnd(standings) {
    // Top 2 sobem, bottom 2 descem
    const promoted = standings.slice(0, 2).map(s => s.teamId);
    const relegated = standings.slice(-2).map(s => s.teamId);
    return { promoted, relegated };
}

export function processPromoRelegation(teams, standings, zone, division) {
    const { promoted, relegated } = calculateSeasonEnd(standings);
    const changes = [];

    promoted.forEach(teamId => {
        const team = teams.find(t => t.id === teamId);
        if (team && division > 1) {
            team.division--;
            changes.push({ teamId, name: team.name, action: 'promoted', from: division, to: division - 1 });
        }
    });

    relegated.forEach(teamId => {
        const team = teams.find(t => t.id === teamId);
        if (team && division < 4) {
            team.division++;
            changes.push({ teamId, name: team.name, action: 'relegated', from: division, to: division + 1 });
        }
    });

    return changes;
}

// ============================================================
// LEGADO DO TREINADOR
// ============================================================
export class ManagerLegacy {
    constructor(managerName) {
        this.managerName = managerName;
        this.reputation = 30; // 0-100
        this.seasons = [];
        this.titles = [];
        this.totalWins = 0;
        this.totalMatches = 0;
    }

    closeSeason(teamName, division, position, wins, draws, losses) {
        const season = {
            teamName,
            division,
            position,
            wins,
            draws,
            losses,
            record: `${wins}V ${draws}E ${losses}D`,
        };

        // Titles
        if (position === 1) {
            season.title = `Campeão da Série ${['A','B','C','D'][division - 1]}`;
            this.titles.push(season.title);
            this.reputation = Math.min(100, this.reputation + 15);
        } else if (position <= 2 && division > 1) {
            season.title = "Promovido";
            this.reputation = Math.min(100, this.reputation + 8);
        } else if (position >= 19) {
            season.title = "Rebaixado";
            this.reputation = Math.max(0, this.reputation - 10);
        }

        this.totalWins += wins;
        this.totalMatches += wins + draws + losses;
        this.seasons.push(season);

        // Base reputation from win rate
        const winRate = this.totalMatches > 0 ? this.totalWins / this.totalMatches : 0;
        this.reputation = Math.max(this.reputation, Math.floor(winRate * 60));

        return season;
    }

    getLevel() {
        if (this.reputation >= 80) return { label: "Lendário", emoji: "👑" };
        if (this.reputation >= 60) return { label: "Renomado", emoji: "⭐" };
        if (this.reputation >= 40) return { label: "Reconhecido", emoji: "📈" };
        if (this.reputation >= 20) return { label: "Iniciante", emoji: "🌱" };
        return { label: "Desconhecido", emoji: "❓" };
    }
}
