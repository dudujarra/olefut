// AKITA-RFCT-019.9: extract getTeamSectors + getPacingEvents from engine.
//
// Stateless. Engine context.

import { evaluateAhaMoments, markAhaSeen } from '../engine/AhaMomentsSystem.js';

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

        const computeRating = (player, macroPos) => {
            let base;
            if (player.attributes) {
                // Calculate effective rating for the sector based on key attributes
                const a = player.attributes;
                if (macroPos === 'ATA') {
                    base = Math.floor((a.technical.finishing * 0.4 + a.mental.offTheBall * 0.3 + a.physical.pace * 0.3) * 5);
                } else if (macroPos === 'MEI') {
                    base = Math.floor((a.technical.passing * 0.4 + a.mental.vision * 0.3 + a.technical.technique * 0.3) * 5);
                } else if (macroPos === 'DEF') {
                    base = Math.floor((a.technical.tackling * 0.4 + a.technical.marking * 0.3 + a.mental.positioning * 0.3) * 5);
                } else if (macroPos === 'GOL') {
                    base = Math.floor((a.goalkeeping.handling * 0.4 + a.goalkeeping.reflexes * 0.3 + a.mental.positioning * 0.3) * 5);
                } else {
                    base = player.ovr || 50;
                }
            } else {
                base = player.ovr || 50;
            }

            // consistency: 10-20 scale. 20 = rock solid, 10 = wildly inconsistent
            // Low consistency = ±15% swing, high consistency = ±3% swing
            if (player.consistency != null) {
                const maxSwing = 0.15 - (player.consistency - 10) * 0.012; // 10→0.15, 20→0.03
                // Use player id + energy as poor-man's per-match seed (deterministic per match state)
                const hash = ((player.id || 0) * 31 + (player.energy || 50)) % 1000 / 1000;
                const swing = (hash - 0.5) * 2 * maxSwing; // -maxSwing to +maxSwing
                base = Math.round(base * (1 + swing));
            }

            return base;
        };

        const avgSector = (arr, macroPos) => {
            if (arr.length === 0) return null;
            const ratings = arr.map(p => computeRating(p, macroPos)).filter(r => r !== null);
            if (ratings.length === 0) return null;
            return Math.floor(ratings.reduce((s, r) => s + r, 0) / ratings.length);
        };

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
        const finalSector = (val, fallback, baseline = 45) => {
            if (val != null && val > 0) return val;
            if (fallback != null && fallback > 0) return fallback;
            return baseline;
        };

        return {
            attack:     finalSector(avgSector(ataPlayers, 'ATA'), null),
            midfield:   finalSector(avgSector(meiPlayers, 'MEI'), null),
            defense:    finalSector(avgSector(defPlayers, 'DEF'), null),
            goalkeeper: finalSector(avgSector(golPlayers, 'GOL'), null)
        };
    }

    /**
     * Pacing friction events para UI human bloquear (AUDIT-FIX #17).
     * Cada evento: { type, severity, title, body, action? }
     * AKITA-404: AhaMoments logic moved here from engine.js (was inline).
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
                title: '[!] ULTIMATO DA DIRETORIA',
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
                title: 'CONTRATOS EXPIRANDO',
                body: `${expiringNow.length} jogador(es) sairão DE GRAÇA em 2 semanas: ${names}. Renove agora ou perca-os.`,
                action: 'squad'
            });
        }

        // 3. Financial crisis
        if (team.balance < -500000) {
            events.push({
                type: 'FINANCIAL_CRISIS',
                severity: 'critical',
                title: 'CRISE FINANCEIRA',
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
                title: 'ELENCO CURTO',
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
                title: 'BALANÇO DO 1o TURNO',
                body: `Metade da temporada! Posição: ${pos}o lugar. V${engine.managerStats.wins} E${engine.managerStats.draws} D${engine.managerStats.losses}. Mantenha o foco para o 2o turno.`
            });
        }

        // 6. Big win/loss streak pause
        if (Math.abs(engine.managerStats.streak) >= 5 && engine.currentWeek > 3) {
            const isWin = engine.managerStats.streak > 0;
            events.push({
                type: 'STREAK_PAUSE',
                severity: 'info',
                title: isWin ? 'SEQUENCIA HISTORICA' : 'MOMENTO DIFICIL',
                body: isWin
                    ? `${engine.managerStats.streak} vitórias consecutivas! A torcida está empolgada. Continue o bom trabalho!`
                    : `${Math.abs(engine.managerStats.streak)} derrotas seguidas. Considere mudanças táticas e de formação.`,
                action: isWin ? null : 'tactics'
            });
        }

        // 7. AhaMoments: tutorial/onboarding cards based on career milestones
        // AKITA-404: moved from engine.getPacingEvents() inline logic
        const ahaCtx = {
            matchesPlayed: (engine.managerStats?.wins || 0) + (engine.managerStats?.draws || 0) + (engine.managerStats?.losses || 0),
            firstInjuryDetected: team?.squad?.some(p => p.injury) || false,
            lowMoraleStreak: Math.abs(Math.min(0, engine.managerStats?.streak || 0)),
            weeksSinceLastTransfer: engine._weeksSinceTransfer || 0,
            matchesWithSameTactic: engine.tacticStreak || 0,
            weeksWithoutYouthCheck: engine._weeksWithoutYouth || 0,
            balance: team?.balance || 100000,
        };
        const ahaMoments = evaluateAhaMoments(ahaCtx);
        ahaMoments.forEach(aha => {
            events.push({
                type: 'AHA_MOMENT',
                severity: 'info',
                title: aha.title,
                body: aha.body,
            });
            markAhaSeen(aha.id);
        });

        return events;
    }
}
