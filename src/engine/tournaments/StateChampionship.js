/**
 * StateChampionship — SPEC-061 / SPEC-168 (wire-up)
 *
 * Estaduais brasileiros (jan-abril). 4 torneios principais:
 * - Paulistão (16 clubes SP)
 * - Carioca (12 clubes RJ)
 * - Mineiro (12 clubes MG)
 * - Gaúcho (16 clubes RS)
 *
 * Calendário: weeks 1-16 (16 semanas, jan-abril). Roda paralelo Brasileirão.
 * Formato: liga ida-volta (15-31 jogos), top 4 → semis, final ida-volta.
 *
 * SPEC-168: estaduais agora são instanciados pelo GameInitializer e o mapping
 * clube→estado mora aqui (brazil.js não tem campo `state`).
 */

import { Tournament } from './Tournament';

/**
 * SPEC-168: mapa estático clube→estado.
 * Cobre todos os 88 clubes brasileiros em src/engine/db/brazil.js.
 * Clube ausente do mapa = sem estadual (ignorado pelo GameInitializer).
 */
export const CLUB_STATE_MAP = {
    // SP
    'Palmeiras': 'SP', 'São Paulo': 'SP', 'Corinthians': 'SP', 'Santos': 'SP',
    'Ponte Preta': 'SP', 'Guarani': 'SP', 'Mirassol': 'SP', 'Novorizontino': 'SP',
    'Botafogo-SP': 'SP', 'Ituano': 'SP', 'Inter de Limeira': 'SP',
    'Ferroviária': 'SP', 'São Bernardo': 'SP',
    // RJ
    'Flamengo': 'RJ', 'Fluminense': 'RJ', 'Botafogo': 'RJ', 'Vasco da Gama': 'RJ',
    'Bangu': 'RJ', 'Nova Iguaçu': 'RJ', 'Portuguesa-RJ': 'RJ', 'Volta Redonda': 'RJ',
    // MG
    'Atlético-MG': 'MG', 'Cruzeiro': 'MG', 'América-MG': 'MG',
    'Tombense': 'MG', 'Athletic Club': 'MG', 'Caldense': 'MG',
    'Pouso Alegre': 'MG', 'Villa Nova-MG': 'MG',
    'Uberlândia': 'MG', 'Democrata-GV': 'MG',
    // RS
    'Grêmio': 'RS', 'Internacional': 'RS', 'Juventude': 'RS',
    'Caxias': 'RS', 'São José-RS': 'RS', 'Ypiranga': 'RS',
    'Brasil de Pelotas': 'RS', 'Esportivo': 'RS',
    'Pelotas': 'RS', 'Veranópolis': 'RS',
    // PR
    'Athletico-PR': 'PR', 'Coritiba': 'PR', 'Operário-PR': 'PR',
    'Paraná Clube': 'PR', 'Londrina': 'PR', 'Cianorte': 'PR',
    // SC
    'Criciúma': 'SC', 'Chapecoense': 'SC', 'Avaí': 'SC',
    'Figueirense': 'SC', 'Brusque': 'SC',
    // BA
    'Bahia': 'BA', 'Vitória': 'BA',
    // CE
    'Fortaleza': 'CE', 'Ceará': 'CE', 'Ferroviário': 'CE',
    'Floresta': 'CE', 'Iguatu': 'CE',
    // PE
    'Sport Recife': 'PE', 'Náutico': 'PE', 'Santa Cruz': 'PE', 'Retrô': 'PE',
    // GO
    'Goiás': 'GO', 'Atlético-GO': 'GO', 'Vila Nova': 'GO',
    'Aparecidense': 'GO', 'Anápolis': 'GO',
    // AL
    'CRB': 'AL', 'CSA': 'AL',
    // MA
    'Sampaio Corrêa': 'MA', 'Moto Club': 'MA',
    // PA
    'Paysandu': 'PA', 'Remo': 'PA',
    // AM
    'Amazonas': 'AM', 'Manaus': 'AM', 'Nacional-AM': 'AM',
    // PB
    'Botafogo-PB': 'PB', 'Campinense': 'PB', 'Treze': 'PB', 'Sousa': 'PB',
    // RN
    'ABC': 'RN', 'América-RN': 'RN',
    // SE
    'Confiança': 'SE', 'Sergipe': 'SE',
    // PI
    'Altos': 'PI',
    // ES
    'Rio Branco-ES': 'ES',
    // DF
    'Brasiliense': 'DF',
};

/**
 * SPEC-168: helper para obter estado de um time.
 * Retorna null se o clube não está mapeado (não-brasileiro ou clube novo).
 */
export function getClubState(teamName) {
    return CLUB_STATE_MAP[teamName] || null;
}

export const STATE_CHAMPIONSHIPS = {
    paulistao: {
        id: 'paulistao',
        name: 'Paulistão Série A1',
        state: 'SP',
        size: 16,
        prizeChampion: 5000000,
        prizeRunnerUp: 2000000,
        rivalries: ['cor_pal', 'san_sao', 'cor_san', 'pal_san']
    },
    carioca: {
        id: 'carioca',
        name: 'Campeonato Carioca',
        state: 'RJ',
        size: 12,
        prizeChampion: 4500000,
        prizeRunnerUp: 1800000,
        rivalries: ['fla_flu', 'fla_vas', 'fla_bot', 'flu_vas']
    },
    mineiro: {
        id: 'mineiro',
        name: 'Campeonato Mineiro',
        state: 'MG',
        size: 12,
        prizeChampion: 3500000,
        prizeRunnerUp: 1500000,
        rivalries: ['atletiba_mg', 'cru_atl', 'ame_atl']
    },
    gaucho: {
        id: 'gaucho',
        name: 'Campeonato Gaúcho',
        state: 'RS',
        size: 16,
        prizeChampion: 3500000,
        prizeRunnerUp: 1500000,
        rivalries: ['gre_int', 'cax_juv']
    }
};

export class StateChampionship extends Tournament {
    constructor(id, name, state) {
        super(id, name);
        this.state = state;
        this.standings = [];
        this.fixtures = [];
        this.phase = 'group'; // 'group' | 'semi' | 'final' | 'done'
        this.weekStart = 1;
        this.weekEnd = 16;
        this.startWeek = 1;
        this.metadata = STATE_CHAMPIONSHIPS[id] || {};
    }

    init(teamIds) {
        super.init(teamIds);
        this.standings = teamIds.map(id => ({
            teamId: id, played: 0, won: 0, drawn: 0, lost: 0,
            goalsFor: 0, goalsAgainst: 0, points: 0
        }));
        this.fixtures = this.generateRoundRobin(teamIds);
        // SPEC-168: re-init must reset phase for new season
        this.phase = 'group';
        this.winner = null;
    }

    generateRoundRobin(teamIds) {
        const teams = [...teamIds];
        if (teams.length % 2 !== 0) teams.push(null);
        const n = teams.length;
        const rounds = n - 1; // turno único (jan-abril)
        const fixtures = [];
        const fixed = teams[0];
        const rotating = teams.slice(1);

        for (let round = 0; round < rounds; round++) {
            const matches = [];
            const allTeams = [fixed, ...rotating];
            for (let i = 0; i < n / 2; i++) {
                const home = allTeams[i];
                const away = allTeams[n - 1 - i];
                if (home !== null && away !== null) {
                    matches.push({ home, away, round: round + 1, played: false });
                }
            }
            fixtures.push(matches);
            rotating.unshift(rotating.pop());
        }
        return fixtures;
    }

    advanceWeek(engine, currentWeek) {
        const seasonWeek = ((currentWeek - 1) % 38) + 1;
        // Estadual roda apenas weeks 1-16
        if (seasonWeek < this.weekStart || seasonWeek > this.weekEnd) {
            return [];
        }
        if (this.phase === 'done') return [];

        const round = seasonWeek - this.weekStart;
        if (round >= this.fixtures.length) {
            // Acabou rodadas, vai pra fase final
            if (this.phase === 'group') {
                this.phase = 'semi';
                return [`${this.metadata.name}: Fase de grupos encerrada. Semifinais começam.`];
            }
            return [];
        }

        const matches = this.fixtures[round] || [];
        const results = [];
        for (const m of matches) {
            if (!m.played) {
                const homeT = engine.getTeam(m.home);
                const awayT = engine.getTeam(m.away);
                if (!homeT || !awayT) continue;

                // Use engine playMatch infrastructure
                const result = engine.playMatch ? engine.playMatch(m.home, m.away, false) : null;
                if (result) {
                    m.played = true;
                    m.result = result;
                    this.updateStanding(m.home, result.homeGoals, result.awayGoals);
                    this.updateStanding(m.away, result.awayGoals, result.homeGoals);
                    results.push(`⚽ ${homeT.name} ${result.homeGoals} x ${result.awayGoals} ${awayT.name} (${this.metadata.name})`);
                }
            }
        }
        return results;
    }

    updateStanding(teamId, gf, ga) {
        const s = this.standings.find(x => x.teamId === teamId);
        if (!s) return;
        s.played++;
        s.goalsFor += gf;
        s.goalsAgainst += ga;
        if (gf > ga) { s.won++; s.points += 3; }
        else if (gf === ga) { s.drawn++; s.points += 1; }
        else { s.lost++; }
    }

    getStandings() {
        return [...this.standings].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const gdA = a.goalsFor - a.goalsAgainst;
            const gdB = b.goalsFor - b.goalsAgainst;
            if (gdB !== gdA) return gdB - gdA;
            return b.goalsFor - a.goalsFor;
        });
    }

    getChampion() {
        if (this.phase !== 'done') return null;
        return this.getStandings()[0];
    }
}
