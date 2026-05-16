import { EngineLogger } from '../engine/EngineLogger.js';
/**
 * AutoPlayPacing — Human-Parity Interactions
 * RFCT-018 Phase 2: Extracted from AutoPlayService._tick()
 *
 * Simulates what a human player would do in the UI between weeks:
 * team talks, contract renewals, coach proposals, scout regions,
 * narrative events, season awards, challenges, board tension,
 * hall of legends, scouted players, staff management, loans,
 * and live substitutions.
 *
 * All methods are static and receive the controller instance (ctx)
 * to maintain backward-compatible behavior.
 */

import { TEAM_TALKS } from '../engine/ManagerSystems';

export class AutoPlayPacing {
    /**
     * Run all human-parity interaction checks for the current tick.
     * Each sub-block is independently try/caught — failures are non-critical.
     * @param {AutoPlayController} ctx - The AutoPlayController instance
     */
    static runAll(ctx) {
        AutoPlayPacing.teamTalk(ctx);
        AutoPlayPacing.contractRenewals(ctx);
        AutoPlayPacing.coachProposals(ctx);
        AutoPlayPacing.scoutRegions(ctx);
        AutoPlayPacing.narrativeEvents(ctx);
        AutoPlayPacing.seasonAwards(ctx);
        AutoPlayPacing.activeChallenge(ctx);
        AutoPlayPacing.boardTension(ctx);
        AutoPlayPacing.hallOfLegends(ctx);
        AutoPlayPacing.signScoutedPlayers(ctx);
        AutoPlayPacing.staffManagement(ctx);
        AutoPlayPacing.loanPlayers(ctx);
        AutoPlayPacing.liveSubstitutions(ctx);
    }

    /** Team Talk — ML via Thompson Sampling (was random pick) */
    static teamTalk(ctx) {
        try {
            if (typeof ctx.engine.doTeamTalk === 'function' && ctx.stats.weeksPlayed % 2 === 0) {
                const talks = TEAM_TALKS || [];
                if (talks.length > 0) {
                    const ctxKey = ctx._banditContextKey();
                    const talkIds = talks.map(t => t.id).filter(Boolean);
                    const pickedId = ctx.bandits.teamTalk.pick(ctxKey, talkIds);
                    const result = ctx.engine.doTeamTalk(pickedId);
                    if (result?.success) {
                        ctx._logDecision('TEAM_TALK', { talkId: pickedId, source: 'thompson' }, 0);
                        ctx._lastBanditActions = ctx._lastBanditActions || {};
                        ctx._lastBanditActions.teamTalk = { ctxKey, action: pickedId };
                    }
                }
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'team talk non-critical'); }
    }

    /** Contract Renewals — human renews expiring contracts in SquadView */
    static contractRenewals(ctx) {
        try {
            const team = ctx.engine.getTeam(ctx.engine.manager?.teamId);
            if (team?.squad && typeof ctx.engine.renewContract === 'function') {
                const expiring = team.squad.filter(p =>
                    p.contract && p.contract.endSeason <= (ctx.engine.seasonNumber || 1) + 1
                );
                for (const p of expiring.slice(0, 3)) {
                    const result = ctx.engine.renewContract(p.id);
                    if (result?.success) {
                        ctx._logDecision('RENEW_CONTRACT', {
                            playerId: p.id, name: p.name, ovr: p.ovr
                        }, 0);
                    }
                }
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'contract non-critical'); }
    }

    /** Coach Proposals — bot decides based on context */
    static coachProposals(ctx) {
        try {
            if (ctx.engine.pendingCoachProposal) {
                const proposal = ctx.engine.pendingCoachProposal;
                const team = ctx.engine.getTeam(ctx.engine.manager?.teamId);
                const standings = team ? ctx.engine.getStandings(team.zone, team.division) : [];
                const pos = standings.length > 0
                    ? (standings.findIndex(s => s.teamId === team?.id) + 1) || standings.length
                    : 10;
                const totalTeams = standings.length || 20;
                const isRelegationZone = pos >= totalTeams - 3;
                const contractEnding = (ctx.engine.managerContract?.weeksRemaining || 20) <= 8;
                const tierMap = { big: 3, mid: 2, small: 1 };
                const currentTier = tierMap[team?.division === 1 ? 'big' : team?.division === 2 ? 'mid' : 'small'] || 1;
                const proposalTier = tierMap[proposal.fromClubTier] || 1;
                const isBetterClub = proposalTier > currentTier;
                const emotion = ctx.brain?.emotions?.state || 'CALM';
                const isTilted = emotion === 'TILTED' || emotion === 'DESPERATE';

                const shouldAccept = isBetterClub || isRelegationZone || contractEnding || isTilted;

                if (typeof ctx.engine.respondCoachProposal === 'function') {
                    const result = ctx.engine.respondCoachProposal(shouldAccept);
                    if (shouldAccept && result.success) {
                        ctx._logDecision('COACH_PROPOSAL_ACCEPTED', {
                            from: proposal.fromClubName,
                            newTeamId: result.newTeamId,
                            reason: isRelegationZone ? 'relegation_zone' : isBetterClub ? 'better_club' : contractEnding ? 'contract_ending' : 'tilted',
                        }, 0);
                        ctx._logSuccess('TRANSFER_SOLD', `✈️ Técnico mudou para ${proposal.fromClubName}`, {});
                    } else {
                        ctx._logDecision('COACH_PROPOSAL_REFUSED', { from: proposal.fromClubName, reason: 'staying' }, 0);
                    }
                } else {
                    ctx.engine.pendingCoachProposal = null;
                }
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'proposal non-critical'); }
    }

    /** Scout Regions — ML via Thompson Sampling */
    static scoutRegions(ctx) {
        try {
            if (typeof ctx.engine.scoutRegionAction === 'function' && ctx.stats.weeksPlayed % 6 === 0) {
                const regions = ctx.engine.scoutRegions || [];
                if (regions.length > 0) {
                    const ctxKey = ctx._banditContextKey();
                    const regionIds = regions.map(r => r.id || r.name).filter(Boolean);
                    const pickedRegion = ctx.bandits.scoutRegion.pick(ctxKey, regionIds);
                    const result = ctx.engine.scoutRegionAction(pickedRegion);
                    if (result?.players?.length > 0) {
                        ctx._logDecision('SCOUT_REGION', {
                            region: pickedRegion,
                            found: result.players.length,
                            source: 'thompson'
                        }, 0);
                        const quality = result.players.reduce((s, p) => s + (p.ovr || 50), 0) / result.players.length;
                        const reward = quality > 60 ? 2 : (quality > 50 ? 1 : 0.5);
                        ctx.bandits.scoutRegion.update(ctxKey, pickedRegion, reward);
                    } else {
                        ctx.bandits.scoutRegion.update(ctxKey, pickedRegion, -0.5);
                    }
                }
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'scout non-critical'); }
    }

    /** Week Events — human reads narrative events in DashboardView */
    static narrativeEvents(ctx) {
        try {
            const events = ctx.engine.weekEvents;
            if (Array.isArray(events) && events.length > 0) {
                for (const ev of events) {
                    ctx._logDecision('NARRATIVE_EVENT', {
                        type: ev.type || 'unknown',
                        text: (ev.text || ev.msg || '').slice(0, 80)
                    }, 0);
                }
                if (!ctx.stats._eventTypes) ctx.stats._eventTypes = {};
                events.forEach(ev => {
                    const t = ev.type || 'unknown';
                    ctx.stats._eventTypes[t] = (ctx.stats._eventTypes[t] || 0) + 1;
                });
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'events non-critical'); }
    }

    /** Season Awards — human sees awards banner in DashboardView */
    static seasonAwards(ctx) {
        try {
            if (Array.isArray(ctx.engine.seasonAwards) && ctx.engine.seasonAwards.length > 0) {
                for (const award of ctx.engine.seasonAwards) {
                    ctx._logSuccess('SEASON_AWARD', `🏅 ${award.title || award.name || 'Prêmio'}`, {
                        award: award.title || award.name,
                        player: award.playerName || award.player
                    });
                }
                ctx.engine.seasonAwards = [];
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'awards non-critical'); }
    }

    /** Active Challenge — human tracks in DashboardView */
    static activeChallenge(ctx) {
        try {
            if (ctx.engine.activeChallenge) {
                const ch = ctx.engine.activeChallenge;
                if (ch.completed) {
                    ctx._logSuccess('CHALLENGE_COMPLETED', `🎯 ${ch.description}`, {
                        reward: ch.reward
                    });
                }
                if (!ctx.stats._challengesSeen) ctx.stats._challengesSeen = 0;
                ctx.stats._challengesSeen++;
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'challenge non-critical'); }
    }

    /** Board Tension — human reads in DashboardView */
    static boardTension(ctx) {
        try {
            if (typeof ctx.engine.boardTension === 'number') {
                if (!ctx.stats._boardTensionHistory) ctx.stats._boardTensionHistory = [];
                ctx.stats._boardTensionHistory.push(ctx.engine.boardTension);
                if (ctx.stats._boardTensionHistory.length > 200) {
                    ctx.stats._boardTensionHistory = ctx.stats._boardTensionHistory.slice(-100);
                }
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'board non-critical'); }
    }

    /** Hall of Legends — human views in DashboardView */
    static hallOfLegends(ctx) {
        try {
            if (ctx.engine.hallOfLegends?.filledCount > 0) {
                if (!ctx.stats._hallOfLegendsCount) ctx.stats._hallOfLegendsCount = 0;
                if (ctx.engine.hallOfLegends.filledCount > ctx.stats._hallOfLegendsCount) {
                    ctx._logSuccess('HALL_OF_LEGENDS', `⭐ ${ctx.engine.hallOfLegends.filledCount} lendas`, {
                        count: ctx.engine.hallOfLegends.filledCount
                    });
                    ctx.stats._hallOfLegendsCount = ctx.engine.hallOfLegends.filledCount;
                }
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'hall non-critical'); }
    }

    /** Sign Scouted Players — human signs in MarketView/DashboardView */
    static signScoutedPlayers(ctx) {
        try {
            if (Array.isArray(ctx.engine.scoutedPlayers) && ctx.engine.scoutedPlayers.length > 0
                && typeof ctx.engine.signScoutedPlayer === 'function') {
                const team = ctx.engine.getTeam(ctx.engine.manager?.teamId);
                const avgOVR = team?.squad?.length
                    ? team.squad.reduce((s, p) => s + (p.ovr || 0), 0) / (team.squad.length || 1) : 50;
                for (let i = ctx.engine.scoutedPlayers.length - 1; i >= 0; i--) {
                    const sp = ctx.engine.scoutedPlayers[i];
                    const isUpgrade = (sp.ovr || 0) >= avgOVR;
                    const needsPlayers = (team?.squad?.length || 0) < 22;
                    if (isUpgrade || needsPlayers) {
                        const result = ctx.engine.signScoutedPlayer(i);
                        if (result?.success) {
                            ctx._logDecision('SIGN_SCOUTED', {
                                name: sp.name, ovr: sp.ovr, position: sp.position
                            }, 0);
                            ctx.stats.transfers++;
                            break; // one per tick max
                        }
                    }
                }
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'sign non-critical'); }
    }

    /** Staff Management — ML via Thompson Sampling */
    static staffManagement(ctx) {
        try {
            if (typeof ctx.engine.hireStaff === 'function' && ctx.stats.weeksPlayed % 38 === 1) {
                const team = ctx.engine.getTeam(ctx.engine.manager?.teamId);
                if (team && (team.balance || 0) > 2_000_000) {
                    const staff = ctx.engine.staff || {};
                    const availableRoles = ['scout', 'physio', 'assistant', 'fitness']
                        .filter(role => !staff[role]);
                    if (availableRoles.length > 0) {
                        const ctxKey = ctx._banditContextKey();
                        const pickedRole = ctx.bandits.staffHire.pick(ctxKey, availableRoles);
                        const result = ctx.engine.hireStaff(pickedRole);
                        if (result?.success) {
                            ctx._logDecision('HIRE_STAFF', { role: pickedRole, source: 'thompson' }, 0);
                            ctx.bandits.staffHire.update(ctxKey, pickedRole, 1);
                        }
                    }
                }
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'staff non-critical'); }
    }

    /** Loan Players — human loans bench in SquadView */
    static loanPlayers(ctx) {
        try {
            if (typeof ctx.engine.loanPlayer === 'function' && ctx.stats.weeksPlayed % 19 === 0) {
                const team = ctx.engine.getTeam(ctx.engine.manager?.teamId);
                if (team?.squad?.length > 22) {
                    const bench = team.squad.filter(p => !p.isTitular && !p.injury && (p.ovr || 0) < 60);
                    bench.sort((a, b) => (a.ovr || 0) - (b.ovr || 0));
                    if (bench.length > 0) {
                        const p = bench[0];
                        const result = ctx.engine.loanPlayer(p.id, 20);
                        if (result?.success) {
                            ctx._logDecision('LOAN_OUT', {
                                name: p.name, ovr: p.ovr, weeks: 20
                            }, 0);
                        }
                    }
                }
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'loan non-critical'); }
    }

    /** Live Substitutions — human subs during MatchView */
    static liveSubstitutions(ctx) {
        try {
            if (typeof ctx.engine.applyLiveSubstitution === 'function') {
                const team = ctx.engine.getTeam(ctx.engine.manager?.teamId);
                if (team?.squad) {
                    const tired = team.squad.filter(p => p.isTitular && (p.energy || 100) < 40);
                    const fresh = team.squad.filter(p => !p.isTitular && !p.injury && (p.energy || 0) > 70);
                    if (tired.length > 0 && fresh.length > 0) {
                        fresh.sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
                        const out = tired[0];
                        const inP = fresh[0];
                        try {
                            ctx.engine.applyLiveSubstitution(out.id, inP.id, 65);
                            ctx._logDecision('SUBSTITUTION', {
                                out: out.name, in: inP.name,
                                outEnergy: out.energy, inOvr: inP.ovr
                            }, 0);
                        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'sub may fail if not mid-match'); }
                    }
                }
            }
        } catch (err) { EngineLogger.capture(err, 'AutoPlayPacing.js', 'sub non-critical'); }
    }
}
