/**
 * WeekProcessor — Extracted from engine.advanceWeek() (AKITA-RFCT-005)
 *
 * Processa todos os eventos semanais do modo manager:
 * - Energia, finanças, transferências, squad health
 * - Win/Loss tracking + SPEC-072/076/077/080 hooks
 * - Lesões, contratos, board, empréstimos
 * - Player development, growth, view unlocks
 * - Dressing room, morale, mentoring, retirement
 * - Youth intake, calendar events, sponsor
 * - SPEC-073 (Coach Proposal), SPEC-074 (Organic Challenge)
 *
 * Invariante RFCT-005:
 * - Mesma ordem de execução que advanceWeek original
 * - Mutações no engine são feitas via referência (engine é passado como param)
 * - Zero mudança comportamental — golden master preservado
 */

import { calculateWeeklyFinances, rollMatchCondition } from '../engine/ManagerSystems';
import { checkSquadHealth } from '../engine/SquadHealthMonitor';
import { generateRealTransferOffers } from '../engine/MarketPricer';
import { evaluateGrowth } from '../engine/GrowthEventSystem';
import { evaluateNewUnlocks, persistUnlock } from '../engine/ViewUnlockSystem';
import { processMatchInjuries, processTrainingInjuries, healInjury } from '../engine/InjurySystem';
import { processPlayerDevelopment, updateForm, processDressingRoom } from '../engine/PlayerDevelopment';
import { processMoraleEvents, processMentoring } from '../engine/PlayerTraits';
import { processLoans } from '../engine/YouthAcademy';
import { getCalendarEvent } from '../engine/SeasonSystem';
import { apply as applyBoardTension } from '../engine/BoardTensionSystem';
import { evaluate as evaluateHumiliation } from '../engine/HumiliationCascadeSystem';
import { evaluate as evaluateLossStreak, recordResult as recordStreakResult } from '../engine/LossStreakResponseSystem';
import { evaluate as evaluateCoachProposal } from '../engine/CoachProposalSystem';
import { evaluate as evaluateOrganicChallenge } from '../engine/OrganicChallengeSystem';
import { processAmbitionWeekly } from '../engine/AmbitionEngine';

import { rng as systemRng } from '../engine/rng.js';

export class WeekProcessor {
    /**
     * Processa semana do modo manager.
     *
     * @param {Engine} engine — referência mutável para state global
     * @param {object} weekResults — resultados das rodadas dos torneios
     */
    process(engine, weekResults) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return;

        // Energy management based on training
        team.squad.forEach(p => {
            if (p.isTitular) {
                p.energy = Math.max(0, p.energy - (Math.floor(systemRng() * 10) + 12));
            } else {
                p.energy = Math.min(100, p.energy + 12);
            }
        });

        // Finanças detalhadas
        engine.weeklyFinance = calculateWeeklyFinances(team, weekResults, team.id);
        // Staff costs
        const staffCost = engine.staff.getWeeklyCost();
        if (staffCost > 0) {
            engine.weeklyFinance.expenses += staffCost;
            engine.weeklyFinance.details.push({ label: 'Staff', amount: staffCost, type: 'expense' });
        }
        // Loan repayment
        if (engine.activeLoan) {
            const loanResult = engine.processLoanPayment();
            if (loanResult) {
                engine.weeklyFinance.expenses += loanResult.paid;
                engine.weeklyFinance.details.push({ label: '🏦 Parcela Empréstimo', amount: loanResult.paid, type: 'expense' });
                if (loanResult.finished) {
                    engine.weekEvents.push(loanResult.msg);
                }
            }
        }
        team.balance += engine.weeklyFinance.income - engine.weeklyFinance.expenses;

        // Match condition para próxima partida
        engine.matchCondition = rollMatchCondition();

        // Transfer offers (janelas) — SPEC-133: precificação real
        // BUG-084: Limpar ofertas expiradas antes de gerar novas
        if (engine.transferOffers.length > 0) {
            engine.transferOffers = engine.transferOffers.filter(
                o => !o.deadline || o.deadline > engine.currentWeek
            );
        }
        const newOffers = generateRealTransferOffers(team, engine.currentWeek, engine.teams);
        if (newOffers.length > 0) {
            engine.transferOffers.push(...newOffers);
        }

        // SPEC-132: squad emergency check (player-manager)
        const squadAvail = team.squad.filter(p => !p.injury && !p._retired).length;
        const healthCheck = checkSquadHealth({
            teamId: team.id,
            squadSize: squadAvail,
            budget: team.balance,
            isPlayerManager: true,
            week: engine.currentWeek,
            squadAvgOvr: Math.round(team.squad.reduce((s, p) => s + (p.ovr || 50), 0) / (team.squad.length || 1)),
            marketPlayers: engine.marketPlayers,
            _cooldowns: engine._squadMonitorCooldowns,
        });
        if (healthCheck.triggered) {
            engine._squadMonitorCooldowns[team.id] = engine.currentWeek;
            if (healthCheck.alertMessage) {
                engine.weekEvents.push(healthCheck.alertMessage);
            }
        }

        // Win/Loss tracking + narrative hooks
        this._processMatchResult(engine, team, weekResults);

        // Lesões pós-partida
        engine.weekInjuries = processMatchInjuries(team.squad);

        // Lesões de treino — treino dobrado (double) tem risco elevado
        if (engine.currentTraining === 'double') {
            const trainingInjuries = processTrainingInjuries(team.squad, 'double');
            if (trainingInjuries.length > 0) {
                engine.weekInjuries.push(...trainingInjuries);
                engine.weekEvents.push(...trainingInjuries.map(
                    inj => `🏥 ${inj.player} se lesionou no treino dobrado! ${inj.emoji} ${inj.name} (${inj.weeksLeft} semanas)`
                ));
            }
        }

        // Curar lesões em andamento
        team.squad.forEach(p => {
            if (p.injury) healInjury(p);
        });

        // Contratos: reduzir semanas
        team.squad.forEach(p => {
            if (p.contract) p.contract.weeksLeft--;
        });

        // Remover jogadores com contrato vencido (exceto titulares)
        const expiredPlayers = team.squad.filter(p => p.contract && p.contract.weeksLeft <= 0 && !p.isTitular);
        if (expiredPlayers.length > 0) {
            engine.weekEvents.push(...expiredPlayers.map(p => `📋 ${p.name} saiu: contrato encerrado.`));
            team.squad = team.squad.filter(p => !(p.contract && p.contract.weeksLeft <= 0 && !p.isTitular));
        }

        // Board confidence
        if (engine.board) {
            const standings = engine.getStandings(team.zone, team.division);
            const pos = standings.findIndex(s => s.teamId === team.id) + 1;
            const avgMorale = team.squad.reduce((s, p) => s + (p.moral || 50), 0) / (team.squad.length || 1);
            engine.board.updateConfidence(pos, standings.length, engine.managerStats.streak, avgMorale, team.balance, engine.currentWeek);
        }

        // Process loans
        if (engine.loanedOut.length > 0) {
            const returned = processLoans(engine.loanedOut, team);
            returned.forEach(p => {
                engine.weekEvents.push(p.loanResult || `${p.name} voltou do empréstimo.`);
            });
            engine.loanedOut = engine.loanedOut.filter(l => l.weeksLeft > 0);
        }

        // Player Development (weekly growth/decline)
        team.squad.forEach(p => {
            const devChanges = processPlayerDevelopment(p);
            devChanges.forEach(c => {
                if (c.type === 'growth') engine.weekEvents.push(`📈 ${c.player}: ${c.attr} ${c.from}→${c.to}`);
                if (c.type === 'decline') engine.weekEvents.push(`📉 ${c.player}: ${c.attr} ${c.from}→${c.to}`);
            });
        });

        // SPEC-134: growth events (breakthroughs, hot streaks, peak season)
        const recentForm = (() => {
            const streak = engine.managerStats.streak;
            if (streak > 0) return Array(Math.min(streak, 8)).fill('W');
            if (streak < 0) return Array(Math.min(-streak, 8)).fill('L');
            return [];
        })();
        const growthResult = evaluateGrowth({
            teamId: team.id,
            week: engine.currentWeek,
            season: engine.seasonNumber,
            players: team.squad,
            teamRecentResults: recentForm,
        });
        growthResult.growthEvents.forEach(evt => {
            if (evt.type === 'youth_breakthrough') engine.weekEvents.push(`⭐ ${evt.playerName} explodiu! OVR +${evt.ovrDelta}`);
            if (evt.type === 'hot_streak') engine.weekEvents.push(`🔥 ${evt.playerName} em grande fase! (+3 OVR temporário)`);
            if (evt.type === 'peak_season') engine.weekEvents.push(`📈 ${evt.playerName} na melhor fase da carreira! OVR +${evt.ovrDelta}`);
            if (evt.type === 'training_breakthrough') engine.weekEvents.push(`💪 ${evt.playerName} evoluiu no treino! OVR +${evt.ovrDelta}`);
        });

        // SPEC-135: check for newly unlocked views
        const newlyUnlocked = evaluateNewUnlocks(engine.viewUnlockState);
        newlyUnlocked.forEach(({ viewId, reason }) => {
            engine.viewUnlockState = persistUnlock(viewId, engine.viewUnlockState);
            engine.weekEvents.push(`🔓 Novo acesso desbloqueado: ${viewId} — ${reason}`);
        });

        // Dressing Room Dynamics (SPEC-146: pass position context for narrative selection)
        const _drStandings = engine.getStandings(team.zone, team.division);
        const _drPos = _drStandings.findIndex(s => s.teamId === team.id) + 1;
        const dressingRoom = processDressingRoom(team.squad, {
            position: _drPos || undefined,
            totalTeams: _drStandings.length || undefined,
            streak: engine.managerStats?.streak,
        });
        dressingRoom.events.forEach(e => engine.weekEvents.push(e));

        // Morale Events (narrative)
        const moraleEvts = processMoraleEvents(team.squad, engine.board);
        moraleEvts.forEach(e => engine.weekEvents.push(e));

        // Mentoring (veteran teaches youth)
        const mentorEvts = processMentoring(team.squad);
        mentorEvts.forEach(e => engine.weekEvents.push(e));

        // SPEC-200: Ambition Engine — player satisfaction vs club prestige
        try {
            const ambitionEvents = processAmbitionWeekly(team);
            ambitionEvents.forEach(e => {
                engine.weekEvents.push(e.msg || `🔔 ${e.type}: ${e.playerName}`);
                // Armazenar transfer requests no engine para a UI consumir
                if (e.type === 'transfer_request' || e.type === 'relegation_exit') {
                    if (!engine._ambitionTransferRequests) engine._ambitionTransferRequests = [];
                    engine._ambitionTransferRequests.push(e);
                }
            });
        } catch (err) {
            // Defensive: AmbitionEngine não pode quebrar o loop principal
            console.warn('[AmbitionEngine] Error in weekly processing:', err.message);
        }

        // Remove retired players
        const retired = team.squad.filter(p => p._retired);
        retired.forEach(p => {
            engine.weekEvents.push(`👴 ${p.name} (${p.age} anos) anunciou aposentadoria.`);
        });
        team.squad = team.squad.filter(p => !p._retired);

        // Youth intake (1x por temporada, semana 38)
        if (engine.currentWeek > 0 && engine.currentWeek % 38 === 0) {
            const youths = engine.triggerYouthIntake();
            youths.forEach(y => {
                engine.weekEvents.push(`🎓 ${y.name} (${y.position}, ${y.age} anos, OVR ${y.ovr}) promovido da base!`);
            });
        }

        // Calendar events
        const seasonWeek = ((engine.currentWeek - 1) % 38) + 1;
        const calEvent = getCalendarEvent(seasonWeek);
        if (calEvent) {
            engine.weekEvents.push(`📅 ${calEvent.name}: ${calEvent.msg}`);
            if (calEvent.effect) {
                if (calEvent.effect.moral) team.squad.forEach(p => { p.moral = Math.max(0, Math.min(100, (p.moral || 50) + calEvent.effect.moral)); });
                if (calEvent.effect.energy) team.squad.forEach(p => { p.energy = Math.max(0, Math.min(100, p.energy + calEvent.effect.energy)); });
            }
        }

        // Sponsor income
        if (engine.currentSponsor) {
            team.balance += engine.currentSponsor.weeklyPay;
            if (engine.weeklyFinance) {
                engine.weeklyFinance.income += engine.currentSponsor.weeklyPay;
                engine.weeklyFinance.details.push({ label: `Patrocínio (${engine.currentSponsor.name})`, amount: engine.currentSponsor.weeklyPay, type: 'income' });
            }
        }

        // SPEC-073: Coach Proposal evaluation (mid-season or near end)
        try {
            if (engine.currentWeek >= 10 && engine.currentWeek % 8 === 0) {
                const formArr = (() => {
                    const s = engine.managerStats.streak;
                    if (s > 0) return Array(Math.min(s, 4)).fill('W');
                    if (s < 0) return Array(Math.min(-s, 4)).fill('L');
                    return ['D', 'D'];
                })();
                const clubTier = team.division === 1 ? 'big' : team.division === 2 ? 'mid' : 'small';
                const proposal = evaluateCoachProposal({
                    managerId: engine.manager.teamId,
                    currentClubId: team.id,
                    currentClubTier: clubTier,
                    currentContractWeeksLeft: engine.managerContract?.weeksRemaining || 20,
                    managerReputation: engine.manager.reputation || 10,
                    recentForm: formArr,
                    currentObjectiveMet: engine.lastContractResolution?.outcome === 'fulfilled',
                    week: engine.currentWeek,
                    season: engine.seasonNumber,
                });
                if (proposal.proposalAvailable && proposal.proposal) {
                    engine.pendingCoachProposal = proposal.proposal;
                    engine.weekEvents.push(`📨 Proposta: ${proposal.proposal.fromClubName} quer contratá-lo! (${proposal.proposal.reason})`);
                }
            }
        } catch { /* defensive */ }

        // SPEC-074: Organic Challenge evaluation
        try {
            if (engine.currentWeek >= 5 && engine.currentWeek % 10 === 0 && !engine.activeChallenge) {
                const standings = engine.getStandings(team.zone, team.division);
                const relegationZone = standings.slice(-4).map(s => {
                    const t = engine.getTeam(s.teamId);
                    return t ? { id: t.id, name: t.name, division: t.division } : null;
                }).filter(Boolean);
                const challenge = evaluateOrganicChallenge({
                    managerId: engine.manager.teamId,
                    currentClubId: team.id,
                    season: engine.seasonNumber,
                    week: engine.currentWeek,
                    managerReputation: engine.manager.reputation || 10,
                    clubsInRelegationZone: relegationZone,
                });
                if (challenge.challengeAvailable && challenge.challenge) {
                    engine.activeChallenge = challenge.challenge;
                    engine.weekEvents.push(`🎯 Desafio: ${challenge.challenge.description}`);
                }
            }
        } catch { /* defensive */ }
    }

    /**
     * Win/Loss/Draw tracking + SPEC-072/076/077/080 narrative hooks
     * @private
     */
    _processMatchResult(engine, team, weekResults) {
        for (const tId in weekResults) {
            const myMatch = weekResults[tId].find(m => m.home === team.id || m.away === team.id);
            if (myMatch && myMatch.score) {
                const isHome = myMatch.home === team.id;
                const myGoals = isHome ? myMatch.score.homeGoals : myMatch.score.awayGoals;
                const theirGoals = isHome ? myMatch.score.awayGoals : myMatch.score.homeGoals;

                // SPEC-167: post-match narrative (non-blocking, fallback safe).
                this._populateMatchNarrative(engine, team, myMatch, isHome, myGoals, theirGoals);
                engine.managerStats.goalsFor = (engine.managerStats.goalsFor || 0) + myGoals;
                engine.managerStats.goalsAgainst = (engine.managerStats.goalsAgainst || 0) + theirGoals;
                if (myGoals > theirGoals) {
                    engine.managerStats.wins++;
                    engine.managerStats.streak = Math.max(0, engine.managerStats.streak) + 1;
                    engine.managerStats.lossStreak = 0;
                    if (!engine.managerStats.rollingForm) engine.managerStats.rollingForm = [];
                    engine.managerStats.rollingForm.push('W');
                    if (engine.managerStats.rollingForm.length > 10) engine.managerStats.rollingForm.shift();
                    recordStreakResult({ teamId: team.id, result: 'W' });
                    team.squad.forEach(p => {
                        p.moral = Math.min(100, (p.moral || 50) + 3);
                        if (p.isTitular) updateForm(p, 1);
                    });
                    // SPEC-072: board tension — win streak
                    try {
                        if (engine.managerStats.streak >= 3) {
                            const bt = applyBoardTension({ currentTension: engine.boardTension, eventType: 'win_streak' });
                            engine.boardTension = bt.newTension;
                            if (bt.thresholdChanged && bt.boardMessage) engine.weekEvents.push(`🏛️ ${bt.boardMessage}`);
                        }
                    } catch { /* defensive */ }
                } else if (myGoals < theirGoals) {
                    engine.managerStats.losses++;
                    engine.managerStats.streak = Math.min(0, engine.managerStats.streak) - 1;
                    engine.managerStats.lossStreak = (engine.managerStats.lossStreak || 0) + 1;
                    if (!engine.managerStats.rollingForm) engine.managerStats.rollingForm = [];
                    engine.managerStats.rollingForm.push('L');
                    if (engine.managerStats.rollingForm.length > 10) engine.managerStats.rollingForm.shift();
                    recordStreakResult({ teamId: team.id, result: 'L' });
                    team.squad.forEach(p => {
                        p.moral = Math.max(0, (p.moral || 50) - 3);
                        if (p.isTitular) updateForm(p, -1);
                    });

                    // SPEC-076: Humiliation Cascade (goleada diff >= 4)
                    try {
                        const scoreDiff = theirGoals - myGoals;
                        if (scoreDiff >= 4) {
                            const cascade = evaluateHumiliation({
                                teamId: team.id,
                                scoreDiff,
                                managerTension: engine.boardTension,
                                isPlayerManager: true,
                            });
                            cascade.cascadeEvents.forEach(e => {
                                engine.weekEvents.push(`💀 ${e.description}`);
                                if (e.tensionDelta) {
                                    const bt = applyBoardTension({ currentTension: engine.boardTension, eventType: 'loss_streak' });
                                    engine.boardTension = bt.newTension;
                                }
                            });
                            if (cascade.survivalNarrative?.active) {
                                engine.weekEvents.push(`🛡️ ${cascade.survivalNarrative.milestoneDescription}`);
                            }
                        }
                    } catch { /* defensive */ }

                    // SPEC-077: Loss Streak Response
                    try {
                        const streak = engine.managerStats.lossStreak || 0;
                        if (streak >= 3) {
                            const avgMorale = team.squad.reduce((s, p) => s + (p.moral || 50), 0) / (team.squad.length || 1);
                            const lsr = evaluateLossStreak({
                                teamId: team.id,
                                streakLength: streak,
                                currentTension: engine.boardTension,
                                squadMorale: avgMorale,
                                isPlayerManager: true,
                                week: engine.currentWeek,
                            });
                            if (lsr.streakSeverity !== 'none') {
                                engine.weekEvents.push(`🔥 Sequência de ${streak} derrotas — crise ${lsr.streakSeverity}!`);
                            }
                            if (lsr.tensionApplied) {
                                engine.boardTension = Math.max(-100, engine.boardTension + lsr.tensionApplied);
                            }
                            if (lsr.moraleFloorApplied) {
                                team.squad.forEach(p => { p.moral = Math.max(5, p.moral || 50); });
                            }
                        }
                    } catch { /* defensive */ }

                    // SPEC-072: board tension — loss streak
                    try {
                        if ((engine.managerStats.lossStreak || 0) >= 3) {
                            const bt = applyBoardTension({ currentTension: engine.boardTension, eventType: 'loss_streak' });
                            engine.boardTension = bt.newTension;
                            if (bt.thresholdChanged && bt.boardMessage) engine.weekEvents.push(`🏛️ ${bt.boardMessage}`);
                        }
                    } catch { /* defensive */ }
                } else {
                    engine.managerStats.draws++;
                    engine.managerStats.streak = 0;
                    if (!engine.managerStats.rollingForm) engine.managerStats.rollingForm = [];
                    engine.managerStats.rollingForm.push('D');
                    if (engine.managerStats.rollingForm.length > 10) engine.managerStats.rollingForm.shift();
                    recordStreakResult({ teamId: team.id, result: 'D' });
                    team.squad.filter(p => p.isTitular).forEach(p => updateForm(p, 0));
                }

                // SPEC-080: track rivalry H2H
                try {
                    const oppId = isHome ? myMatch.away : myMatch.home;
                    const key = team.id < oppId ? `${team.id}_${oppId}` : `${oppId}_${team.id}`;
                    if (!engine.rivalryHistory[key]) engine.rivalryHistory[key] = [];
                    const aIsHome = team.id < oppId;
                    engine.rivalryHistory[key].push({
                        clubAScore: aIsHome ? myGoals : theirGoals,
                        clubBScore: aIsHome ? theirGoals : myGoals,
                        week: engine.currentWeek,
                        season: engine.seasonNumber,
                        isDecisive: false,
                    });
                    // BUG-093: cap to 20 entries per rivalry to prevent save bloat
                    if (engine.rivalryHistory[key].length > 20) {
                        engine.rivalryHistory[key] = engine.rivalryHistory[key].slice(-20);
                    }
                } catch { /* defensive */ }

                break;
            }
        }
    }

    /**
     * SPEC-167: populate engine.lastMatchNarrative + board reaction on humiliation.
     *
     * Non-blocking. LLMNarrativeService returns a Promise; we fire-and-forget
     * but still set the value synchronously via the template fallback so the UI
     * always has something to show without a render race.
     * @private
     */
    _populateMatchNarrative(engine, team, myMatch, isHome, myGoals, theirGoals) {
        if (!engine.llmNarrative) return;
        const oppId = isHome ? myMatch.away : myMatch.home;
        const oppTeam = engine.getTeam ? engine.getTeam(oppId) : null;
        const homeName = isHome ? (team.name || 'Sua equipe') : (oppTeam?.name || 'Adversário');
        const awayName = isHome ? (oppTeam?.name || 'Adversário') : (team.name || 'Sua equipe');
        const matchData = {
            homeTeam: homeName,
            awayTeam: awayName,
            homeGoals: isHome ? myGoals : theirGoals,
            awayGoals: isHome ? theirGoals : myGoals,
            managerSide: isHome ? 'home' : 'away',
            week: engine.currentWeek,
        };

        // Set template-only narrative synchronously so the UI always has something.
        try {
            const syncText = engine.llmNarrative.postMatchAnalysisSync(matchData);
            if (syncText) engine.lastMatchNarrative = syncText;
        } catch { /* defensive */ }
        // Fire async upgrade attempt (LLM if enabled). Never blocks.
        try {
            engine.llmNarrative.postMatchAnalysis(matchData)
                .then((text) => { if (text) engine.lastMatchNarrative = text; })
                .catch(() => { /* defensive */ });
        } catch { /* defensive */ }

        // Humiliation board reaction: score diff >= 4 against manager.
        // Sync template push so the message is visible in the same advance-week tick.
        const scoreDiff = theirGoals - myGoals;
        if (scoreDiff >= 4) {
            try {
                const text = engine.llmNarrative.boardReactionSync({
                    type: 'humiliation',
                    scoreDiff,
                    managerStats: engine.managerStats,
                });
                if (text && Array.isArray(engine.weekEvents)) {
                    engine.weekEvents.push(`🏛️ Diretoria: ${text}`);
                }
            } catch { /* defensive */ }
        }
    }
}
