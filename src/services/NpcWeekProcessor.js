// AKITA-RFCT-019.1: extract NPC squad/tactic/buy + AI Director from engine.advanceWeek.
//
// Stateless processor. Recebe engine + weekResults, muta engine state in-place
// (preserva comportamento original — golden master deve ser idêntico).
//
// Razão: engine.advanceWeek tinha 160 LOC fazendo NPC management + AI Director.
// Mover pra cá libera engine pra ser orchestrator puro.

import { adviseTactic, initNpcTacticState, applyNpcTacticAdvice } from '../engine/NpcTacticAdvisor';
import { checkSquadHealth } from '../engine/SquadHealthMonitor';
import { npcTacticDecision, npcBuyDecision, npcFormationDecision, shouldUseFullBrain } from './learning/NpcManagerAI.js';

export class NpcWeekProcessor {
    constructor() {
        // Stateless
    }

    /**
     * Processa NPC management na semana.
     * Inclui: squad health check, tactic decision (brain ou legacy), buy decisions,
     * AI Director tick.
     *
     * @param {Engine} engine
     * @param {object} weekResults — não usado mas mantém assinatura consistente
     */
    process(engine, _weekResults) {
        this._processNpcManagement(engine);
        this._processAiDirector(engine);
    }

    /**
     * SPEC-131 + SPEC-132: NPC tactic pivot + squad emergency para TODOS os times NPC.
     */
    _processNpcManagement(engine) {
        engine.teams.forEach(t => {
            if (t.id === engine.manager?.teamId) return; // skip player team

            this._processNpcSquadHealth(engine, t);
            this._processNpcTactic(engine, t);
        });
    }

    _processNpcSquadHealth(engine, t) {
        const npcSquadAvail = t.squad.filter(p => !p.injury && !p._retired).length;
        if (npcSquadAvail >= 11) return;

        const npcHealth = checkSquadHealth({
            teamId: t.id,
            squadSize: npcSquadAvail,
            budget: t.balance,
            isPlayerManager: false,
            week: engine.currentWeek,
            squadAvgOvr: Math.round(t.squad.reduce((s, p) => s + (p.ovr || 50), 0) / (t.squad.length || 1)),
            marketPlayers: engine.marketPlayers,
            _cooldowns: engine._squadMonitorCooldowns,
        });

        if (!npcHealth.triggered) return;

        engine._squadMonitorCooldowns[t.id] = engine.currentWeek;
        // Apply purchased players to NPC squad
        npcHealth.playersBought?.forEach(bought => {
            const mkt = engine.marketPlayers.find(p => p.id === bought.playerId);
            if (mkt) {
                mkt.contract = { weeksLeft: 26, salary: mkt.salary || 5000 };
                mkt.injury = null;
                mkt.moral = 50;
                mkt.isTitular = true;
                t.squad.push(mkt);
                t.balance -= bought.cost;
                engine.marketPlayers = engine.marketPlayers.filter(p => p.id !== bought.playerId);
            }
        });
    }

    _processNpcTactic(engine, t) {
        // MARL Fase 6: NPC brain-driven tactic + emotional feed
        if (!t.npcTacticState) t.npcTacticState = initNpcTacticState();

        if (t.brain) {
            // Brain-driven decision (replaces NpcTacticAdvisor)
            const tacticResult = npcTacticDecision(t, engine);
            t.npcTacticState.currentTactic = tacticResult.tactic;
            if (tacticResult.changed) t.npcTacticState.tacticAge = 0;
            else t.npcTacticState.tacticAge = (t.npcTacticState.tacticAge || 0) + 1;

            const formationResult = npcFormationDecision(t, engine);
            if (formationResult.changed) {
                if (engine._formationService) {
                    engine._formationService.setFormation(t, formationResult.formation);
                } else {
                    t.formation = formationResult.formation;
                }
            }

            // NPC buy decisions every 4 weeks (only if near player's division for perf)
            const playerDiv = engine.getTeam(engine.manager?.teamId)?.division || 1;
            if (engine.currentWeek % 4 === 0 && shouldUseFullBrain(t, playerDiv)) {
                try { npcBuyDecision(t, engine); } catch { /* defensive */ }
            }
            return;
        }

        // Legacy fallback: NpcTacticAdvisor
        const oppId = engine._lastNpcOpponent?.[t.id];
        const oppTeam = oppId ? engine.getTeam(oppId) : null;
        const npcOvr = Math.round(t.squad.reduce((s, p) => s + (p.ovr || 50), 0) / (t.squad.length || 1));
        const oppOvr = oppTeam ? Math.round(oppTeam.squad.reduce((s, p) => s + (p.ovr || 50), 0) / (oppTeam.squad.length || 1)) : npcOvr;
        // Contexto para tática profunda (Home/Away, Posição no campeonato)
        const nextMatch = engine.schedule[engine.currentWeek]?.find(m => m.home === t.id || m.away === t.id);
        const isHome = nextMatch ? nextMatch.home === t.id : true;
        const standings = engine.getStandings(t.zone, t.division) || [];
        const position = (standings.findIndex(s => s.teamId === t.id) + 1) || 10;
        const totalTeams = standings.length || 20;

        const advice = adviseTactic({
            currentTactic: t.npcTacticState.currentTactic,
            recentResults: t.npcTacticState.recentResults,
            squadOvr: npcOvr,
            opponentOvr: oppOvr,
            tacticAge: t.npcTacticState.tacticAge,
            isHome,
            position,
            totalTeams,
        });
        t.npcTacticState = applyNpcTacticAdvice(t.npcTacticState, advice);
    }

    /**
     * MARL Fase 6: AI Director tick — modulates NPC difficulty near player.
     */
    _processAiDirector(engine) {
        if (!engine._aiDirector || engine.mode !== 'manager') return;

        try {
            const playerTeam = engine.getTeam(engine.manager.teamId);
            if (!playerTeam) return;

            const standings = engine.getStandings(playerTeam.zone, playerTeam.division);
            const position = (standings.findIndex(s => s.teamId === playerTeam.id) + 1) || standings.length;
            const recentResults = (engine.managerStats?.rollingForm || []).map(r =>
                r === 'W' ? 'W' : r === 'D' ? 'D' : 'L'
            );
            const dirMods = engine._aiDirector.tick({
                recentResults,
                position,
                totalTeams: standings.length || 20,
                streak: engine.managerStats?.streak || 0
            });
            // Apply aggression modifier to same-division NPC brains
            const playerDiv = playerTeam.division;
            for (const t of engine.teams) {
                if (t.id === playerTeam.id || !t.brain || t.division !== playerDiv) continue;
                t.brain._aiDirectorMod = dirMods.aggressionMod;
            }
        } catch { /* defensive — never break advanceWeek */ }
    }
}
