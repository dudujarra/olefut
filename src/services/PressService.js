// AKITA-RFCT-019.7: extract press conference + contract renewal + coach proposal response.
//
// Stateless. Engine como contexto.
//
// ARQUITETURA — Por que PressService existe (auditoria BUG-085 confirmou: LIVE, não morto):
//   - Engine.checkPressConference / answerPress / getRenewalOffer / renewContract /
//     respondCoachProposal delegam para esta classe.
//   - Consumers reais:
//       * DashboardView.jsx (manager UI: pergunta + respostas via engine.checkPressConference / answerPress)
//       * AutoPlayService.js (headless: triggera coletiva no autoplay)
//       * AutoPlayPacing.js (headless: renewContract + respondCoachProposal automáticos)
//       * MonitorService.js (registra renewContract entre métodos monitorados)
//       * tests/integration/autoplay-gdd-proof.test.js
//   - PressView.jsx NÃO usa este service (acessa engine/PressConference.js direto via useState
//     initializer pra reatividade React). Caminho UI manual vs caminho headless/autoplay são
//     intencionalmente separados.

import { shouldTriggerPress, generateQuestion, applyPressEffect } from '../engine/PressConference';
import { generateRenewalOffer, acceptRenewal } from '../engine/PlayerDevelopment';

export class PressService {
    constructor() {
        // Stateless
    }

    /**
     * Press conference trigger check. Returns pressQuestion ou null.
     */
    checkPressConference(engine) {
        if (engine.mode !== 'manager') return null;
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return null;
        const standings = engine.getStandings(team.zone, team.division);
        const pos = standings.findIndex(s => s.teamId === team.id) + 1;
        if (shouldTriggerPress(engine.managerStats.streak, engine.currentWeek, pos, standings.length)) {
            const avgMorale = team.squad.reduce((s, p) => s + (p.moral || 50), 0) / (team.squad.length || 1);
            engine.pressQuestion = generateQuestion(engine.managerStats.streak, pos, standings.length, avgMorale);
            return engine.pressQuestion;
        }
        return null;
    }

    /**
     * Answer a press question via optionId.
     */
    answerPress(engine, optionId) {
        if (!engine.pressQuestion) return null;
        const option = engine.pressQuestion.options.find(o => o.id === optionId);
        if (!option) return null;
        const team = engine.getTeam(engine.manager.teamId);
        applyPressEffect(team, engine.board, option.effect);
        const result = { answer: option.text, effect: option.effect };
        engine.pressQuestion = null;
        return result;
    }

    /**
     * Get renewal offer for a player.
     */
    getRenewalOffer(engine, playerId) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return null;
        const player = team.squad.find(p => p.id === playerId);
        if (!player) return null;
        return generateRenewalOffer(player);
    }

    /**
     * Renew contract.
     */
    renewContract(engine, playerId) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };
        const player = team.squad.find(p => p.id === playerId);
        if (!player) return { success: false, msg: 'Jogador não encontrado.' };
        const offer = generateRenewalOffer(player);
        if (!offer.willRenew) return { success: false, msg: offer.reason };
        return acceptRenewal(player, offer);
    }

    /**
     * Respond to coach proposal (accept ou decline). Includes club transition.
     */
    respondCoachProposal(engine, accept) {
        const proposal = engine.pendingCoachProposal;
        if (!proposal) return { success: false, msg: 'Sem proposta pendente' };

        engine.pendingCoachProposal = null;

        if (!accept) {
            return { success: false, msg: `Recusou proposta de ${proposal.fromClubName}` };
        }

        // Validar clube destino
        const newTeamId = proposal.fromClubId;
        const newTeam = engine.getTeam(newTeamId);
        if (!newTeam) {
            return { success: false, msg: `Clube destino não encontrado: ${newTeamId}` };
        }

        // Cobrar exit fee se aplicável
        const currentTeam = engine.getTeam(engine.manager?.teamId);
        if (proposal.exitFee > 0 && currentTeam) {
            currentTeam.balance = (currentTeam.balance || 0) - proposal.exitFee;
        }

        // Mudar manager para novo clube
        const oldTeamId = engine.manager.teamId;
        engine.manager.teamId = newTeam.id;

        // Boost de reputação
        if (proposal.reputationBoost) {
            engine.manager.reputation = Math.min(100, (engine.manager.reputation || 10) + proposal.reputationBoost);
        }

        // Resetar stats de temporada
        engine.managerStats = { wins: 0, draws: 0, losses: 0, streak: 0, lossStreak: 0, rollingForm: [], goalsFor: 0, goalsAgainst: 0 };

        // Limpar estado contextual do clube anterior
        engine.boardTension = 0;
        engine.lastContractResolution = null;

        // Log na carreira do manager
        if (!Array.isArray(engine.manager.careerHistory)) engine.manager.careerHistory = [];
        engine.manager.careerHistory.push({
            clubName: currentTeam?.name || 'Clube Anterior',
            leftFor: newTeam.name,
            season: engine.seasonNumber,
        });

        engine.weekEvents.push(`✈️ ${engine.manager.name} assina com ${newTeam.name}! (saiu de ${currentTeam?.name || oldTeamId})`);

        return { success: true, newTeamId: newTeam.id, msg: `Aceitou proposta de ${newTeam.name}` };
    }
}
