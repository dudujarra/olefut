// AKITA-RFCT-019.6: extract formation + tactic + training + team talk + live substitution.
//
// Stateless. Engine como contexto.

import { TACTICS, FORMATIONS, applyTeamTalk, applyTraining } from '../engine/ManagerSystems';
import { rng as systemRng } from '../engine/rng.js';

export class FormationService {
    constructor() {
        // Stateless
    }

    setTactic(engine, tacticId) {
        if (TACTICS[tacticId]) {
            engine.currentTactic = tacticId;
            // SPEC-070: track tactic usage for manager identity
            if (!engine.manager.tacticHistory) engine.manager.tacticHistory = {};
            engine.manager.tacticHistory[tacticId] = (engine.manager.tacticHistory[tacticId] || 0) + 1;
        }
    }

    setFormation(engine, formationId) {
        const team = engine.getTeam(engine.manager.teamId);
        if (team && FORMATIONS[formationId]) team.formation = formationId;
    }

    /**
     * A2 — Save formation layout (custom positions per slot).
     */
    saveFormationLayout(engine, { formation, layout }) {
        const team = engine.getTeam(engine.manager?.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };
        if (formation) team.formation = formation;
        team.formationLayout = layout;
        return { success: true };
    }

    /**
     * A3 — Pre-match context: opponent info, location, h2h.
     */
    getMatchContext(engine) {
        const team = engine.getTeam(engine.manager?.teamId);
        if (!team) return null;

        const upcoming = engine.getUpcomingMatch ? engine.getUpcomingMatch(team.id) : null;
        let opponent = null;
        let isHome = true;
        const tournamentName = `Brasileirão Série ${['A','B','C','D'][team.division - 1] || 'A'}`;

        if (upcoming) {
            isHome = upcoming.home === team.id;
            opponent = engine.getTeam(isHome ? upcoming.away : upcoming.home);
        } else {
            // Fallback: any team in same zone/division
            const peers = (engine.teams || []).filter(t =>
                t.id !== team.id && t.zone === team.zone && t.division === team.division
            );
            opponent = peers[Math.floor(systemRng() * peers.length)] || null;
        }

        if (!opponent) return null;

        let h2h = [];
        if (engine.matchHistory) {
            h2h = engine.matchHistory.filter(m =>
                (m.home === team.id && m.away === opponent.id) ||
                (m.home === opponent.id && m.away === team.id)
            ).slice(-5);
        }

        const oppSectors = engine.getTeamSectors ? engine.getTeamSectors(opponent.id) : null;
        const oppTactic = opponent.preferredTactic || 'balanced';
        const styleMap = {
            'defensive': 'Defensivo',
            'pressing': 'Pressão Alta',
            'counter': 'Contra-Ataque',
            'attacking': 'Ofensivo',
            'balanced': 'Equilibrado',
            'park_the_bus': 'Retranca'
        };
        const opponentStyle = styleMap[oppTactic] || 'Equilibrado';

        return {
            opponent,
            isHome,
            location: isHome ? 'CASA' : 'FORA',
            tournament: tournamentName,
            seasonWeek: ((engine.currentWeek - 1) % 38) + 1,
            h2h,
            oppSectors,
            opponentStyle,
            oppTactic
        };
    }

    applyLiveSubstitution(engine, outId, inId, currentMinute) {
        const team = engine.getTeam(engine.manager?.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado' };

        const out = team.squad.find(p => p.id === outId);
        const inPlayer = team.squad.find(p => p.id === inId);
        if (!out || !inPlayer) return { success: false, msg: 'Jogador não encontrado' };
        if (!out.isTitular) return { success: false, msg: 'Só titulares podem sair' };
        if (inPlayer.isTitular) return { success: false, msg: 'Reserva já está em campo' };
        if (inPlayer.injury) return { success: false, msg: 'Jogador lesionado' };
        if (inPlayer.suspension) return { success: false, msg: 'Jogador suspenso' };

        // Flip titular flags
        out.isTitular = false;
        inPlayer.isTitular = true;
        inPlayer.energy = Math.min(100, (inPlayer.energy || 70) + 10);
        out.energy = Math.max(out.energy || 50, 30);

        if (currentMinute > 0) {
            if (!engine._liveSubsLog) engine._liveSubsLog = [];
            engine._liveSubsLog.push({
                minute: currentMinute,
                outId,
                inId,
                outName: out.name,
                inName: inPlayer.name
            });
            // BUG-091: cap to 50 entries
            if (engine._liveSubsLog.length > 50) {
                engine._liveSubsLog = engine._liveSubsLog.slice(-50);
            }
        }

        return {
            success: true,
            msg: currentMinute > 0 ? `🔄 ${currentMinute}': ${out.name} sai, ${inPlayer.name} entra.` : `✅ ${inPlayer.name} entrou na equipe titular.`
        };
    }

    /**
     * A4 — Auto-escalar: Escolhe 11 titulares e 5 reservas baseados na tática
     */
    autoPickSquad(engine) {
        const team = engine.getTeam(engine.manager?.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };

        const formation = FORMATIONS[team.formation] || FORMATIONS['4-3-3'];
        
        // 1. Limpa todos
        team.squad.forEach(p => p.isTitular = false);
        
        // Separa disponíveis (sem lesão/suspensão) e ordena por OVR
        let available = team.squad.filter(p => !p.injury && !p.suspension).sort((a,b) => b.ovr - a.ovr);
        
        // 2. Escolher 11 titulares
        const titularPositions = [
            'GOL',
            ...Array(formation.DEF).fill('DEF'),
            ...Array(formation.MEI).fill('MEI'),
            ...Array(formation.ATA).fill('ATA'),
        ];
        
        titularPositions.forEach(pos => {
            const index = available.findIndex(p => p.position === pos);
            if (index !== -1) {
                const p = available.splice(index, 1)[0];
                p.isTitular = true;
            } else if (available.length > 0) {
                // Improviso
                const p = available.shift();
                p.isTitular = true;
            }
        });
        
        // 3. Escolher 5 reservas inteligentes baseadas na tática
        const benchPositions = [
            'GOL',
            ...Array(Math.max(1, Math.floor(formation.DEF / 2))).fill('DEF'),
            ...Array(Math.max(1, Math.floor(formation.MEI / 2))).fill('MEI'),
            ...Array(Math.max(1, Math.floor(formation.ATA / 2))).fill('ATA'),
        ];
        
        const bench = [];
        benchPositions.forEach(pos => {
            if (bench.length >= 5) return;
            const index = available.findIndex(p => p.position === pos);
            if (index !== -1) {
                const p = available.splice(index, 1)[0];
                bench.push(p.id);
            }
        });
        
        // Preencher até 5 se faltar jogadores
        while(bench.length < 5 && available.length > 0) {
            bench.push(available.shift().id);
        }
        
        return { success: true, bench };
    }

    /**
     * Team talk action.
     */
    doTeamTalk(engine, talkId) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return null;
        const result = applyTeamTalk(team, talkId);
        if (result.success) {
            engine.lastTeamTalk = result.talk;
            engine.teamTalkModifiers = result.modifiers;
        }
        return result;
    }

    /**
     * Training action.
     */
    doTraining(engine, trainingId) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return null;
        engine.currentTraining = trainingId;
        return applyTraining(team, trainingId);
    }
}
