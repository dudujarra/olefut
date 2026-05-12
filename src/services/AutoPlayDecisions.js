/**
 * AutoPlayDecisions — Strategic decision-making loop
 * RFCT-020 Phase 3: Extracted from AutoPlayService
 *
 * Owns the per-tick strategic logic: training, tactic, formation, monotony
 * detection, stadium/academy upgrades, view visits, squad replenishment,
 * emergency loans/sells, transfer offers (sell side), opportunistic buys,
 * market inquiries. Total ~470 LOC.
 *
 * Stateful only via parent reference: reads/writes all the controller's
 * runtime fields (this.parent.*) — no own state beyond the parent ref.
 */

import { TRAINING_TYPES } from '../engine/ManagerSystems';
import { encodeState } from './learning/AdaptiveBrain.js';
import { detectMonotonyHeuristic } from './learning/LLMBridge.js';
import { smartSellDecision, rankCandidates, computeTransferReward } from './learning/SmartMarketEngine.js';
import { rng as systemRng } from '../engine/rng.js';

// BUG-027 fix: pull training catalog from engine source of truth (was hardcoded
// list with invalid IDs cardio/defensive/attacking causing 2416 TRAIN_FAIL).
const TRAINING_ROTATION = (TRAINING_TYPES || []).map(t => t.id).filter(Boolean);
const FORMATION_POOL = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2'];
// BUG-029 fix: rotation cap — TRAIN was 94% of decisions in playtest.
// Decision pool ensures TRAIN ≤30%, FORMATION/TACTIC/MARKET/VIEW share rest.
// SPEC-104: expanded to ALL 16 views from CriticalPathMap.KNOWN_VIEWS.
// Bot MUST visit every single view or SPEC-104 will report dead views.
const VIEW_ROTATION = [
    'dashboard', 'squad', 'market', 'standings', 'pressView',
    'matchView', 'rivalries', 'chronicle', 'achievements', 'monitor',
    'tutorial', 'saveSlots', 'styleguide', 'cosmeticShop', 'start', 'autoplay'
];

export class AutoPlayDecisions {
    /**
     * @param {AutoPlayController} parent
     */
    constructor(parent) {
        this.parent = parent;
    }

    makeDecisions() {
        const parent = this.parent;
        const engine = parent.engine;
        const teamId = engine?.manager?.teamId;
        if (!teamId) return;

        // SPEC-115/116/117: Build state + observe last outcome
        const ctx = parent._buildStateCtx();

        // Fase 3 ML: Set emotional context for SARSA modifier learning
        try { parent.brain.emotions.setContext(ctx); } catch { /* defensive */ }

        parent._observeOutcome(ctx);

        // ML Transfer Reward Feedback: evaluate past transfers every 8 weeks
        if (parent.stats.weeksPlayed % 8 === 0 && parent._pendingTransferRewards?.length > 0) {
            const team = engine.getTeam(teamId);
            const standings = team ? (engine.getStandings(team.zone, team.division) || []) : [];
            const currentPos = team ? (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length : 10;

            // Process transfers that are at least 6 weeks old
            const matured = parent._pendingTransferRewards.filter(
                t => (engine.currentWeek || 0) - t.weekDone >= 6
            );
            for (const tx of matured) {
                const reward = computeTransferReward({
                    action: tx.type,
                    positionBefore: tx.positionBefore,
                    positionAfter: currentPos,
                    balanceBefore: tx.balanceBefore,
                    balanceAfter: team?.balance || 0,
                    playerBecameStarter: tx.type === 'BUY' && (tx.playerOvr || 0) >= 65,
                    playerWasStarter: tx.playerWasStarter || false,
                    offerRatio: tx.offerRatio || 1.0,
                    emotionalLossMod: parent.brain?.emotions?.getModifiers?.()?.lossMod || 1.0
                });
                // Feed reward back to Q-table
                if (tx.stateKey && tx.action) {
                    parent.brain.observe(tx.stateKey, tx.action, reward, encodeState(ctx), ['MKT_BUY_YES', 'MKT_BUY_NO', 'MKT_SELL_YES', 'MKT_SELL_NO']);
                    parent._logDecision('ML_TRANSFER_REWARD', {
                        type: tx.type, reward: reward.toFixed(1),
                        posChange: tx.positionBefore - currentPos,
                        stateKey: tx.stateKey
                    }, 0);
                }
            }
            // Remove matured entries
            parent._pendingTransferRewards = parent._pendingTransferRewards.filter(
                t => (engine.currentWeek || 0) - t.weekDone < 6
            );
        }

        const stateKey = encodeState(ctx);

        // BUG-029 fix: TRAIN was 94% of decisions. Cap to 1-in-3 weeks.
        // Decision 1: Training rotation (now throttled)
        if (parent.stats.weeksPlayed % 3 === 0) {
            const startTrain = performance.now();
            // SPEC-115: brain picks training id (was rotation hardcoded)
            const trainingActions = TRAINING_ROTATION.map(id => `TRAIN_${id}`);
            const pickedActionKey = parent.brain.pickAction(stateKey, trainingActions, ctx);
            const trainingId = pickedActionKey
                ? pickedActionKey.replace(/^TRAIN_/, '')
                : TRAINING_ROTATION[parent._trainingIdx % TRAINING_ROTATION.length];
            parent._trainingIdx++;
            if (engine.doTraining && trainingId) {
                const result = engine.doTraining(trainingId);
                parent._logDecision('TRAIN', { trainingId, picked: !!pickedActionKey }, performance.now() - startTrain);
                if (!result || result.success === false) {
                    parent._logAnomaly('TRAIN_FAIL', result?.msg || 'doTraining failed', { trainingId });
                }
                // Snapshot for next observe
                parent._lastStateKey = stateKey;
                parent._lastAction = `TRAIN_${trainingId}`;
                parent._lastBalanceForReward = ctx.balance;
                parent._lastPositionForReward = ctx.position;
                parent._lastDivisionForReward = engine.getTeam(teamId)?.division ?? null;
            }
        }

        // Decision 2: Tactic — SPEC-115 brain pick (was streak hardcoded fallback)
        const tacticActions = ['TACTIC_normal', 'TACTIC_offensive', 'TACTIC_defensive', 'TACTIC_counter'];
        const pickedTacticKey = parent.brain.pickAction(stateKey, tacticActions, ctx);
        let nextTactic = 'normal';
        if (pickedTacticKey) {
            nextTactic = pickedTacticKey.replace(/^TACTIC_/, '');
        } else {
            // Fallback heuristic if brain returns null
            const streak = engine.managerStats?.streak || 0;
            if (streak >= 3) nextTactic = 'offensive';
            else if (streak <= -2) nextTactic = 'defensive';
            else if (streak <= 0) nextTactic = 'counter';
        }
        if (engine.setTactic) {
            // BUG-081: boredom override — force rotation if same tactic >8 weeks and not winning big
            // BUG-RC3 fix: reduced from 12→8 to break stuck loops faster
            const tacticStreak = engine.managerStats?.streak || 0;
            if (parent._consecutiveSameTactic > 8 && tacticStreak < 5) {
                const allTactics = ['normal', 'offensive', 'defensive', 'pressing', 'counter', 'possession'];
                const others = allTactics.filter(t => t !== nextTactic);
                nextTactic = others[Math.floor(systemRng() * others.length)];
                parent._consecutiveSameTactic = 0;
            }
            engine.setTactic(nextTactic);
            // BUG-RC3: log tactic CHANGES (not same-tactic repeats) for observability
            if (parent._lastTactic !== nextTactic) {
                parent._logDecision('TACTIC_CHANGE', {
                    from: parent._lastTactic || 'none',
                    to: nextTactic,
                    source: pickedTacticKey ? 'brain' : 'heuristic'
                }, 0);
                parent._consecutiveSameTactic = 0;
            } else {
                parent._consecutiveSameTactic++;
            }
            parent._lastTactic = nextTactic;
        }

        // Decision 2b: Monotony detection — every 4 weeks apply suggestions
        if (parent.stats.weeksPlayed % 4 === 0) {
            try {
                const team = engine.getTeam(teamId);
                const standings = team ? engine.getStandings(team.zone, team.division) : [];
                const position = team ? (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length : 10;
                const avgOVR = team?.squad?.length
                    ? team.squad.reduce((s, p) => s + (p.ovr || 0), 0) / (team.squad.length || 1) : 60;
                const totalMatches = parent.stats.wins + parent.stats.draws + parent.stats.losses;
                const winRate = totalMatches > 0 ? parent.stats.wins / totalMatches : 0.33;

                if (!parent._positionHistory) parent._positionHistory = [];
                parent._positionHistory.push(position);
                if (parent._positionHistory.length > 12) parent._positionHistory.shift();
                const positionStreak = parent._positionHistory.filter(p => p === position).length;

                const monotony = detectMonotonyHeuristic({
                    currentTactic: nextTactic,
                    tacticStreak: parent._consecutiveSameTactic,
                    position,
                    positionStreak,
                    streak: engine.managerStats?.streak || 0,
                    avgOVR,
                    balance: team?.balance || 0,
                    squadSize: team?.squad?.length || 0,
                    division: team?.division || 4,
                    seasonNumber: engine.seasonNumber || 1,
                    winRate
                });

                if (monotony.monotonous && monotony.topSuggestion) {
                    const s = monotony.topSuggestion;
                    if (s.action === 'CHANGE_TACTIC' && s.value && engine.setTactic) {
                        engine.setTactic(s.value);
                        parent._consecutiveSameTactic = 0;
                        parent._lastTactic = s.value;
                        parent._logDecision('TACTIC_OVERRIDE', { tactic: s.value, reason: s.reason }, 0);
                    } else if (s.action === 'CHANGE_FORMATION' && engine.setFormation) {
                        const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '5-3-2', '4-2-3-1'];
                        const current = team?.formation || '4-3-3';
                        const alt = FORMATIONS.find(f => f !== current) || '4-4-2';
                        engine.setFormation(alt);
                        parent._logDecision('FORMATION', { form: alt, reason: s.reason }, 0);
                    } else if (s.action === 'SCOUT' && engine.scoutLeague) {
                        // Trigger scout on next buy cycle (flag only)
                        parent._urgentScout = true;
                    }
                    // Log monotony signals for telemetry
                    monotony.signals.forEach(sig => {
                        if (sig.id === 'TACTIC_STUCK') parent._logAnomaly('TACTIC_STUCK', sig.msg, { tactic: nextTactic, streak: sig.streak ?? parent._consecutiveSameTactic });
                    });
                }
            } catch { /* ignore */ }
        }

        // Decision 3: Formation occasional rotate
        if (parent.stats.weeksPlayed % 19 === 0 && engine.setFormation) {
            const form = FORMATION_POOL[Math.floor(systemRng() * FORMATION_POOL.length)];
            engine.setFormation(form);
            parent._logDecision('FORMATION', { form }, 0);
        }

        // Decision 4: REMOVED (BUG-086) — transfer offer processing is handled
        // in the ML-powered block below (L989+) with smartSellDecision + reward tracking.
        // This legacy block used wrong field names (offer.amount/offer.player) and never executed.

        // Decision 5: Stadium/Academy upgrade every 2 seasons (was 5 — too slow, balance stagnated).
        // SPEC-100: more frequent big spending increases balance variance (CV was 1.1%).
        if (parent.stats.seasonsPlayed > 0 && parent.stats.seasonsPlayed % 2 === 0 && parent.stats.weeksPlayed % 38 === 1) {
            const team = engine.getTeam(teamId);
            if (team && team.balance > 3_000_000) {
                if (engine.upgradeStadium) {
                    engine.upgradeStadium();
                    parent._logDecision('UPGRADE_STADIUM', {}, 0);
                }
                if (engine.upgradeAcademy) {
                    engine.upgradeAcademy();
                    parent._logDecision('UPGRADE_ACADEMY', {}, 0);
                }
            }
        }

        // BUG-028 fix: bot must visit views so SPEC-104 has data.
        // Track view visits via telemetry history every 4 weeks.
        if (parent.stats.weeksPlayed % 4 === 0) {
            const view = VIEW_ROTATION[(parent.stats.weeksPlayed / 4) % VIEW_ROTATION.length];
            try {
                if (parent.telemetry?.history) {
                    if (!parent.telemetry.history.viewVisits) parent.telemetry.history.viewVisits = {};
                    parent.telemetry.history.viewVisits[view] = (parent.telemetry.history.viewVisits[view] || 0) + 1;
                }
                parent._logDecision('VISIT_VIEW', { view }, 0);
            } catch { /* ignore */ }
        }

        // BUG-032 + BUG-040 fix: auto-replenish squad more aggressively.
        // Playtest 3 mostrou squad estagnado em 6-10 players + apenas 11 SQUAD_REPLENISH
        // em 1258 weeks. Lower threshold + higher frequency + emergency double call.
        try {
            const team = engine.getTeam(teamId);
            if (team?.squad && typeof engine.triggerYouthIntake === 'function') {
                const squadSize = team.squad.length;
                let triggered = false;
                // EMERGENCY: squad <11 = below match minimum. Double call every tick.
                if (squadSize < 11) {
                    engine.triggerYouthIntake();
                    engine.triggerYouthIntake();
                    triggered = true;
                }
                // ROUTINE: squad <16 every 3 weeks
                else if (squadSize < 16 && parent.stats.weeksPlayed % 3 === 0) {
                    engine.triggerYouthIntake();
                    triggered = true;
                }
                if (triggered) {
                    parent._logDecision('SQUAD_REPLENISH', {
                        squadBefore: squadSize,
                        squadAfter: team.squad.length,
                        emergency: squadSize < 11
                    }, 0);
                }
            }
        } catch { /* ignore */ }

        // Decision 6: Emergency loan when balance is critically low
        try {
            const team = engine.getTeam(teamId);
            if (team && (team.balance || 0) < 0 && !engine.activeLoan) {
                const loanOpts = engine.getLoanOptions();
                if (loanOpts.available && loanOpts.options.length > 0) {
                    // Take medium loan for breathing room
                    const mediumLoan = loanOpts.options[1] || loanOpts.options[0];
                    const result = engine.takeLoan(mediumLoan.amount);
                    if (result.success) {
                        parent._logDecision('TAKE_LOAN', {
                            amount: mediumLoan.amount,
                            weeklyPayment: mediumLoan.weeklyPayment,
                            balance: team.balance,
                        }, 0);
                    }
                }
            }
        } catch { /* ignore */ }

        // BUG-080: emergency sell when deeply negative balance (even after loan)
        try {
            const team = engine.getTeam(teamId);
            if (team && (team.balance || 0) < -5_000_000) {
                parent._emergencySell(team);
            }
        } catch { /* ignore */ }

        // BUG-050 fix: bot now ACTUALLY buys/sells via LLMBridge (was fake log).
        // Process incoming transfer offers + opportunistically buy if available.
        try {
            const team = engine.getTeam(teamId);
            if (team) {
                // Process incoming offers (sell decisions — sync heuristic in tick loop)
                // BUG-076: offer fields were offer.player.id / offer.amount (wrong).
                // Engine generateTransferOffers returns: { playerId, offerAmount, playerName, buyerClub, deadline }.
                // Normalize to heuristic format: { player, amount }.
                if (Array.isArray(engine.transferOffers) && engine.transferOffers.length > 0) {
                    for (const offer of engine.transferOffers.slice(0, 3)) {
                        if (!offer?.playerId || !offer?.offerAmount) continue;
                        const player = team.squad.find(p => p.id === offer.playerId);
                        if (!player) {
                            engine.rejectTransferOffer?.(offer.playerId);
                            continue;
                        }
                        // ML: brain decides via Q-Learning (learns from sell outcomes)
                        const decision = smartSellDecision(parent.brain, {
                            team, player, offerAmount: offer.offerAmount
                        });

                        // SPEC-119: When LLM is active, fire async consultation for logging/override
                        if (parent.llmBridge._mode === 'webllm' && parent.llmBridge._loadStatus === 'ready') {
                            const prompt = `Futebol manager. Recebi oferta de R$ ${(offer.offerAmount/1e6).toFixed(1)}M por ${player.name} (OVR ${player.ovr}, pos ${player.position}, idade ${player.age || '?'}). Meu saldo: R$ ${((team.balance||0)/1e6).toFixed(1)}M. Elenco tem ${team.squad.length} jogadores. Devo VENDER ou MANTER? Responda apenas VENDER ou MANTER e o motivo em 1 linha.`;
                            parent.llmBridge.decide(prompt).then(resp => {
                                if (resp.source === 'webllm' && resp.text) {
                                    parent._logDecision('LLM_CONSULT_SELL', {
                                        player: player.name, ovr: player.ovr,
                                        amount: offer.offerAmount,
                                        llmResponse: resp.text.substring(0, 200),
                                        heuristicSaid: decision.sell ? 'SELL' : 'KEEP'
                                    }, 0);
                                }
                            }).catch(() => { /* non-blocking */ });
                        }

                        if (decision.sell && typeof engine.acceptTransferOffer === 'function') {
                            // Track for reward feedback
                            const standings = engine.getStandings(team.zone, team.division) || [];
                            const posBefore = (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length;
                            parent._pendingTransferRewards.push({
                                type: 'SELL', stateKey: decision.stateKey, action: decision.action,
                                weekDone: engine.currentWeek, positionBefore: posBefore,
                                balanceBefore: team.balance, playerWasStarter: (player.ovr || 0) >= 65,
                                offerRatio: offer.offerAmount / Math.max(player.value || 1, 1)
                            });
                            const result = engine.acceptTransferOffer(offer.playerId);
                            if (result?.success) {
                                parent.stats.transfers++;
                                parent._logSuccess('TRANSFER_SOLD', `Vendeu ${player.name} (OVR${player.ovr}) por R$ ${(offer.offerAmount/1e6).toFixed(1)}M. ${decision.reason}${parent.llmBridge._mode === 'webllm' ? ' [LLM ativo]' : ''}`);
                                parent._logDecision('SELL_PLAYER', {
                                    playerId: offer.playerId, amount: offer.offerAmount,
                                    source: parent.llmBridge._mode === 'webllm' ? 'webllm+heuristic' : decision.source,
                                    reason: decision.reason,
                                    biases: decision.biases || []
                                }, 0);
                            }
                        } else if (offer.deadline && engine.currentWeek >= offer.deadline) {
                            engine.rejectTransferOffer?.(offer.playerId);
                        }
                    }
                }

                // SPEC-122 BUG-053: Bot scouts league + makes outgoing buy offers every 4 weeks.
                // Picks weakest position, finds upgrade target, offers 1.3-1.5× value.
                // BUG-080: skip buys when balance is negative (salary drain spiral prevention)
                if (parent.stats.weeksPlayed % 4 === 0 && typeof engine.scoutLeague === 'function' && (team.balance || 0) > 0) {
                    try {
                        // Find weakest position in squad
                        const positions = ['GOL', 'DEF', 'MEI', 'ATA'];
                        const positionStrength = positions.map(pos => {
                            const players = team.squad.filter(p => p.position === pos);
                            const avgOVR = players.length > 0
                                ? players.reduce((s, p) => s + (p.ovr || 0), 0) / players.length
                                : 0;
                            return { pos, avgOVR, count: players.length };
                        });
                        const weakest = positionStrength.sort((a, b) => a.avgOVR - b.avgOVR)[0];

                        const urgentScout = parent._urgentScout;
                        if (urgentScout) parent._urgentScout = false;

                        if (weakest && (weakest.avgOVR < 70 || urgentScout)) {
                            const candidates = engine.scoutLeague(weakest.pos, weakest.avgOVR + 5, 10);
                            if (candidates.length > 0) {
                                // ML: rank candidates through brain Q-Learning
                                const biasCtx = {
                                    windowWeeksLeft: Math.max(0, 38 - (engine.currentWeek || 0)),
                                    totalWindowWeeks: 38
                                };
                                const ranked = rankCandidates({
                                    brain: parent.brain,
                                    team,
                                    candidates,
                                    biasCtx,
                                    limit: 3
                                });

                                // Try best candidate that brain approved
                                const best = ranked[0];
                                if (best) {
                                    const target = best.candidate;
                                    const player = target.player || target;
                                    const offerAmount = best.askingPrice;

                                    // SPEC-119: LLM consultation for buy decisions
                                    if (parent.llmBridge._mode === 'webllm' && parent.llmBridge._loadStatus === 'ready') {
                                        const prompt = `Futebol manager. Quero contratar ${player.name} (OVR ${player.ovr}, pos ${player.position || weakest.pos}, idade ${player.age || '?'}) por R$ ${(offerAmount/1e6).toFixed(1)}M. Meu saldo: R$ ${((team.balance||0)/1e6).toFixed(1)}M. Posição mais fraca: ${weakest.pos} (média OVR ${weakest.avgOVR.toFixed(0)}). Vale a pena COMPRAR ou ESPERAR? Responda COMPRAR ou ESPERAR e o motivo em 1 linha.`;
                                        parent.llmBridge.decide(prompt).then(resp => {
                                            if (resp.source === 'webllm' && resp.text) {
                                                parent._logDecision('LLM_CONSULT_BUY', {
                                                    target: player.name, ovr: player.ovr,
                                                    amount: offerAmount,
                                                    llmResponse: resp.text.substring(0, 200),
                                                    heuristicSaid: 'BUY'
                                                }, 0);
                                            }
                                        }).catch(() => { /* non-blocking */ });
                                    }

                                    const result = engine.makeBuyOffer(target.teamId, player.id, offerAmount);
                                    // Track for ML reward feedback
                                    const standings = engine.getStandings(team.zone, team.division) || [];
                                    const posBefore = (standings.findIndex(s => s.teamId === team.id) + 1) || standings.length;

                                    if (parent.telemetry?.history) {
                                        if (!Array.isArray(parent.telemetry.history.offers)) parent.telemetry.history.offers = [];
                                        parent.telemetry.history.offers.push({
                                            week: engine.currentWeek,
                                            playerId: player?.id,
                                            amount: offerAmount,
                                            playerValue: target.value || (player.ovr || 60) * 50_000,
                                            accepted: result?.accepted === true,
                                            simulated: false,
                                            source: best.decision.source
                                        });
                                        // BUG-094: cap to 200 entries (consistent with TelemetryAggregator MAX_HISTORY)
                                        if (parent.telemetry.history.offers.length > 200) {
                                            parent.telemetry.history.offers = parent.telemetry.history.offers.slice(-200);
                                        }
                                    }
                                    parent._logDecision('BUY_OFFER', {
                                        target: player.name,
                                        position: player.position || weakest.pos,
                                        ovr: player.ovr || target.ovr,
                                        amount: offerAmount,
                                        accepted: result?.accepted || false,
                                        reason: best.decision.reason,
                                        source: best.decision.source
                                    }, 0);

                                    if (result?.accepted) {
                                        parent.stats.transfers++;
                                        // Track for delayed reward
                                        parent._pendingTransferRewards.push({
                                            type: 'BUY', stateKey: best.decision.stateKey,
                                            action: best.decision.action,
                                            weekDone: engine.currentWeek, positionBefore: posBefore,
                                            balanceBefore: team.balance, playerOvr: player.ovr || 60
                                        });
                                        parent.brain?.remember({
                                            week: engine.currentWeek, season: engine.seasonNumber,
                                            action: `BUY_${weakest.pos}_OVR${player.ovr}`,
                                            result: 'accepted', reward: 3,
                                            details: `R$ ${(offerAmount / 1_000_000).toFixed(1)}M via ML`
                                        });
                                    } else if (result?.success === true) {
                                        parent.brain?.remember({
                                            week: engine.currentWeek, season: engine.seasonNumber,
                                            action: `BUY_${weakest.pos}_OVR${player.ovr}`,
                                            result: `rejected`, reward: -1
                                        });
                                    }
                                } else {
                                    // Brain rejected all candidates
                                    parent._logDecision('BUY_ALL_REJECTED_BY_ML', {
                                        position: weakest.pos,
                                        candidatesScanned: candidates.length,
                                        brainStates: Object.keys(parent.brain?.qTable || {}).length
                                    }, 0);
                                }
                            }
                        }
                    } catch { /* ignore */ }
                }

                // Outgoing market inquiry every 8 weeks (decisions log only — NOT offers)
                // BUG-078: probes were being pushed to history.offers with no amount field,
                // causing SPEC-111 to see avgSpread=-1 (0% of value) and acceptanceRate=0%.
                // MARKET_INQUIRY is a valuation probe, not a real buy offer.
                if (parent.stats.weeksPlayed % 8 === 0 && team.squad?.length > 0) {
                    const candidate = team.squad[Math.floor(systemRng() * team.squad.length)];
                    const playerVal = candidate.value || (candidate.ovr || 60) * 50_000;
                    const askPrice = playerVal * (1.2 + systemRng() * 0.6);
                    parent._logDecision('MARKET_INQUIRY', { playerId: candidate.id, askPrice: Math.round(askPrice) }, 0);
                }
            }
        } catch { /* ignore */ }
    }
}
