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
import { processPlayerDevelopment } from '../engine/PlayerDevelopment.js';
import { processDressingRoom } from '../engine/systems/DressingRoomSystem.js';
import { processMoraleEvents, processMentoring } from '../engine/PlayerTraits';
import { processLoans } from '../engine/YouthAcademy';
import { getCalendarEvent } from '../engine/SeasonSystem';
import { getSeasonalEvent } from '../engine/SeasonalBREvents';
import { processAmbitionWeekly } from '../engine/AmbitionEngine';
import { getTicketMoralBoost } from '../engine/TicketPricingSystem.js';
import { resolveAuctions } from '../engine/StarAuctionSystem.js';
import { pickInterruptEvent } from '../engine/InterruptEvents.js';
import { evaluate as evaluateCoachProposal } from '../engine/CoachProposalSystem';
import { evaluate as evaluateOrganicChallenge } from '../engine/OrganicChallengeSystem';
import { processMatchResult } from './WeekMatchResult.js';
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

        // GAME RULE: Squad MUST be >= 16 players (11 + 5). Immediate game over if it drops below 16.
        if (team.squad.length < 16) {
            engine.isGameOver = true;
            engine.gameOverReason = 'bankruptcy';
            engine.weekEvents.push(`💀 GAME OVER: Plantel do ${team.name} caiu para menos de 16 jogadores (${team.squad.length}). Falência decretada.`);
            if (engine.board) engine.board.isFired = true;
            return;
        }

        // SPEC-C6: surface seasonal BR event if currentWeek matches trigger
        try {
            const seasonalEvent = getSeasonalEvent(engine.currentWeek);
            if (seasonalEvent) {
                engine.pendingSeasonalEvent = seasonalEvent;
                engine.weekEvents.push(`[Evento BR] ${seasonalEvent.title}: ${seasonalEvent.text}`);
            }
        } catch { /* defensive */ }

        // Energy management based on training
        team.squad.forEach(p => {
            if (p.isTitular) {
                p.energy = Math.max(0, p.energy - (Math.floor(systemRng() * 10) + 12));
            } else {
                p.energy = Math.min(100, p.energy + 12);
            }
        });

        // Finanças detalhadas (agora passando engine)
        engine.weeklyFinance = calculateWeeklyFinances(team, weekResults, team.id, engine);
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

        // Elifoot Classic: Ticket Pricing — moral semanal da torcida
        const ticketMoralDelta = getTicketMoralBoost(engine);
        if (ticketMoralDelta !== 0) {
            team.squad.forEach(p => {
                p.moral = Math.max(0, Math.min(100, (p.moral || 50) + ticketMoralDelta));
            });
        }

        // Elifoot Classic: Star Auction — resolver leilões vencidos
        const auctionResults = resolveAuctions(engine);
        auctionResults.forEach(r => {
            engine.weekEvents.push(r.msg);
            if (r.won && r.playerId) {
                let player = null;

                if (r.source === 'league' && r.sourceTeamId) {
                    // BUG-AUDIT-3: League source — player is in seller's squad
                    const seller = engine.getTeam(r.sourceTeamId);
                    if (seller) {
                        player = (seller.squad || []).find(p => p.id === r.playerId);
                        if (player) {
                            seller.squad = seller.squad.filter(p => p.id !== r.playerId);
                            seller.balance = (seller.balance || 0) + r.bid;
                        }
                    }
                } else {
                    // Market source — player is in engine.marketPlayers
                    player = (engine.marketPlayers || []).find(p => p.id === r.playerId);
                    if (player) {
                        engine.marketPlayers = engine.marketPlayers.filter(p => p.id !== r.playerId);
                    }
                }

                if (player) {
                    player.isTitular = false;
                    player.energy = 100;
                    player.injury = null;
                    delete player.suspension;
                    if (player.clearFlag) player.clearFlag('suspended');
                    team.balance -= r.bid;
                    team.squad.push(player);
                }
            }
        });

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
        const squadAvail = team.squad.filter(p => !p.injury && !p.suspension && !p._retired).length;
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

        // Win/Loss tracking + narrative hooks (delegated to WeekMatchResult)
        processMatchResult(engine, team, weekResults);

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

        // SPEC-068: InterruptEvents — forced decision events (~10%/week)
        try {
            const interrupt = pickInterruptEvent(engine, team);
            if (interrupt) {
                engine.pendingInterrupt = {
                    id: interrupt.id,
                    type: interrupt.type,
                    title: interrupt.title,
                    text: interrupt.text,
                    options: interrupt.options,
                };
                engine.weekEvents.push(`⚡ ${interrupt.title}`);
            }
        } catch (_e) { /* defensive — interrupt system must never crash tick */ }

        // SPEC-200: Ambition Engine — player satisfaction vs club prestige
        try {
            const ambitionEvents = processAmbitionWeekly(team);
            ambitionEvents.forEach(e => {
                engine.weekEvents.push(e.msg || `🔔 ${e.type}: ${e.playerName}`);
                // Armazenar transfer requests no engine para a UI consumir
                if (e.type === 'transfer_request' || e.type === 'relegation_exit') {
                    if (!engine._ambitionTransferRequests) engine._ambitionTransferRequests = [];
                    engine._ambitionTransferRequests.push(e);
                    // BUG-F2-03: cap to prevent save bloat over a 38-week season
                    if (engine._ambitionTransferRequests.length > 20) {
                        engine._ambitionTransferRequests = engine._ambitionTransferRequests.slice(-20);
                    }
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

        // ═══ MEMORY GUARD: cap weekEvents to prevent unbounded growth ═══
        // In soak tests (10k+ seasons), weekEvents can accumulate 30-50 per week.
        // Hard cap at 50 keeps the last (most important) events.
        const WEEK_EVENTS_CAP = 50;
        if (engine.weekEvents.length > WEEK_EVENTS_CAP) {
            engine.weekEvents = engine.weekEvents.slice(-WEEK_EVENTS_CAP);
        }
    }
}
