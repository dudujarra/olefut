// AKITA-RFCT-019.9: extract getTeamSectors + getPacingEvents from engine.
//
// Stateless. Engine context.

export class SectorService {
    constructor() {
        // Stateless
    }

    /**
     * Compute team sector ratings (attack/midfield/defense/goalkeeper).
     * SPEC-080: pentagon-based effective rating when available.
     * BUG-055: fallback to ANY squad player at position when no titulares.
     * SPEC-125: baseline 45 when no pentagon nor fallback.
     */
    getTeamSectors(engine, teamId) {
        const team = engine.getTeam(teamId);
        if (!team) return { attack: 0, midfield: 0, defense: 0, goalkeeper: 0 };
        const titulares = team.squad.filter(p => p.isTitular);

        const computeRating = (player) => {
            if (player.attacking !== undefined && player.naturalPosition) {
                // Pentagon-based: position-specific weights
                const weights = { ATA: 0, TEC: 0, TAC: 0, DEF: 0, CRI: 0 };
                if (player.position === 'ATA') { weights.ATA = 3; weights.TEC = 2; }
                else if (player.position === 'MEI') { weights.TEC = 3; weights.CRI = 3; weights.TAC = 2; }
                else if (player.position === 'DEF') { weights.DEF = 3; weights.TAC = 3; }
                else if (player.position === 'GOL') { weights.TAC = 3; weights.DEF = 3; }
                const total = weights.ATA + weights.TEC + weights.TAC + weights.DEF + weights.CRI;
                if (total === 0) return 50;
                return Math.floor((
                    player.attacking * weights.ATA +
                    player.technical * weights.TEC +
                    player.tactical * weights.TAC +
                    player.defending * weights.DEF +
                    player.creativity * weights.CRI
                ) / total);
            }
            return null; // fallback signal
        };

        const avgPentagon = (arr) => {
            if (arr.length === 0) return null;
            const ratings = arr.map(computeRating).filter(r => r !== null);
            if (ratings.length === 0) return null;
            return Math.floor(ratings.reduce((s, r) => s + r, 0) / ratings.length);
        };

        // SCHEMA-UNIFIED: avg reads root-level stat keys
        const avg = (arr, attr) => arr.length === 0 ? 0 : Math.floor(arr.reduce((s, p) => {
            return s + (p[attr] || 50);
        }, 0) / arr.length);

        // BUG-055 fix: when 0 titulares in position, fallback to ANY squad player
        const pickPosition = (pos) => {
            const starters = titulares.filter(p => p.position === pos);
            if (starters.length > 0) return starters;
            return team.squad.filter(p => p.position === pos && !p.injury);
        };

        const ataPlayers = pickPosition('ATA');
        const meiPlayers = pickPosition('MEI');
        const defPlayers = pickPosition('DEF');
        const golPlayers = pickPosition('GOL');

        // SPEC-125: baseline 45
        const finalSector = (pentagon, fallback, baseline = 45) => {
            if (pentagon != null && pentagon > 0) return pentagon;
            if (fallback != null && fallback > 0) return fallback;
            return baseline;
        };

        return {
            attack:     finalSector(avgPentagon(ataPlayers), avg(ataPlayers, 'attacking')),
            midfield:   finalSector(avgPentagon(meiPlayers), avg(meiPlayers, 'creativity')),
            defense:    finalSector(avgPentagon(defPlayers), avg(defPlayers, 'defending')),
            goalkeeper: finalSector(avgPentagon(golPlayers), avg(golPlayers, 'defending'))
        };
    }

    /**
     * Pacing friction events para UI human bloquear (AUDIT-FIX #17).
     * Cada evento: { type, severity, title, body, action? }
     */
    getPacingEvents(engine) {
        if (engine.mode !== 'manager') return [];
        const events = [];
        const team = engine.getTeam(engine.manager?.teamId);
        if (!team) return [];

        // 1. Board ultimatum — critical pacing stop
        if (engine.board && engine.board.confidence < 20) {
            events.push({
                type: 'BOARD_ULTIMATUM',
                severity: 'critical',
                title: '⚠️ ULTIMATO DA DIRETORIA',
                body: `A diretoria perdeu a confiança (${engine.board.confidence}%). Mais derrotas levarão à demissão. Considere ajustar tática e reforçar o elenco.`,
                action: 'tactics'
            });
        }

        // 2. Contract emergency — players about to leave for free
        const expiringNow = team.squad.filter(p => p.contract && p.contract.weeksLeft <= 2 && p.ovr >= 60);
        if (expiringNow.length > 0) {
            const names = expiringNow.map(p => p.name).join(', ');
            events.push({
                type: 'CONTRACT_EMERGENCY',
                severity: 'warning',
                title: '📋 CONTRATOS EXPIRANDO',
                body: `${expiringNow.length} jogador(es) sairão DE GRAÇA em 2 semanas: ${names}. Renove agora ou perca-os.`,
                action: 'squad'
            });
        }

        // 3. Financial crisis
        if (team.balance < -500000) {
            events.push({
                type: 'FINANCIAL_CRISIS',
                severity: 'critical',
                title: '💸 CRISE FINANCEIRA',
                body: `Balanço em R$ ${(team.balance / 1000000).toFixed(1)}M. Venda jogadores ou reduza custos para evitar colapso.`,
                action: 'market'
            });
        }

        // 4. Squad too thin
        const available = team.squad.filter(p => !p.injury && !p._retired);
        if (available.length <= 13) {
            events.push({
                type: 'SQUAD_THIN',
                severity: 'warning',
                title: '🚨 ELENCO CURTO',
                body: `Apenas ${available.length} jogadores disponíveis. Contrate reforços ou arrisque W.O.`,
                action: 'market'
            });
        }

        // 5. Milestone celebrations
        const seasonWeek = ((engine.currentWeek - 1) % 38) + 1;
        if (seasonWeek === 19) {
            const standings = engine.getStandings(team.zone, team.division);
            const pos = standings.findIndex(s => s.teamId === team.id) + 1;
            events.push({
                type: 'MID_SEASON_REVIEW',
                severity: 'info',
                title: '📊 BALANÇO DO 1º TURNO',
                body: `Metade da temporada! Posição: ${pos}º lugar. V${engine.managerStats.wins} E${engine.managerStats.draws} D${engine.managerStats.losses}. Mantenha o foco para o 2º turno.`
            });
        }

        // 6. Big win/loss streak pause
        if (Math.abs(engine.managerStats.streak) >= 5 && engine.currentWeek > 3) {
            const isWin = engine.managerStats.streak > 0;
            events.push({
                type: 'STREAK_PAUSE',
                severity: 'info',
                title: isWin ? '🔥 SEQUÊNCIA HISTÓRICA' : '❄️ MOMENTO DIFÍCIL',
                body: isWin
                    ? `${engine.managerStats.streak} vitórias consecutivas! A torcida está empolgada. Continue o bom trabalho!`
                    : `${Math.abs(engine.managerStats.streak)} derrotas seguidas. Considere mudanças táticas e de formação.`,
                action: isWin ? null : 'tactics'
            });
        }

        return events;
    }
}
