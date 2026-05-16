/**
 * MatchPostMatch — Extracted from MatchSimulator (AKITA-RFCT-004b)
 *
 * Responsabilidade: toda lógica PÓS-MATCH (energy drain, career stats,
 * discipline, leader morale, bicho settlement, NPC result feeding).
 *
 * Stateless: recebe engine + result por parâmetro.
 */

import { hasTrait, initCareerStats, recordMatchStats } from '../engine/PlayerTraits';
import { settleMatchBonus } from '../engine/MatchBonusSystem.js';

import { recordNpcResult } from '../engine/NpcTacticAdvisor';
import { npcFeedMatchResult } from './learning/NpcManagerAI.js';
import { emitGameEvent, GameEvents } from '../audio/EventBus.js';
import { MATCH_BASE_DRAIN_MIN, MATCH_BASE_DRAIN_RANGE, WORKHORSE_ENERGY_SAVE, LEADER_WIN_MORAL_BOOST } from '../engine/constants.js';
import { rng as systemRng } from '../engine/rng.js';

/**
 * Process MOTM (Man of the Match) from performance map.
 * @returns {{ name, team, score } | null}
 */
export function resolveMOTM(homeTeam, awayTeam, performanceMap, isManagerMatch, rawEvents) {
    const homeTitulares = (homeTeam.squad || []).filter(p => p.isTitular);
    const awayTitulares = (awayTeam.squad || []).filter(p => p.isTitular);
    let bestPerf = -1, motm = null;
    [...homeTitulares, ...awayTitulares].forEach(p => {
        const perf = (performanceMap[p.id] || 0);
        if (perf > bestPerf) { bestPerf = perf; motm = p; }
    });
    if (motm && bestPerf > 0) {
        const result = { name: motm.name, team: homeTeam.squad?.includes(motm) ? homeTeam.name : awayTeam.name, score: bestPerf };
        if (isManagerMatch) rawEvents.push({ minute: 90, type: 'motm', name: motm.name });
        return result;
    }
    return null;
}

/**
 * Energy drain for all titulares post-match.
 */
export function applyEnergyDrain(homeTeam, awayTeam, cond, weatherDrainMod) {
    const baseDrain = Math.floor(MATCH_BASE_DRAIN_MIN + systemRng() * MATCH_BASE_DRAIN_RANGE) * (cond.energyModifier || 1);
    const energyDrain = Math.floor(baseDrain * weatherDrainMod);
    [...(homeTeam.squad || []), ...(awayTeam.squad || [])].filter(p => p.isTitular).forEach(p => {
        const saveMod = hasTrait(p, 'workhorse') ? WORKHORSE_ENERGY_SAVE : 1.0;
        p.energy = Math.max(0, p.energy - Math.floor(energyDrain * saveMod));
    });
}

/**
 * Record career stats (goals, assists, cards, MOTM) for manager's team players.
 */
export function recordCareerStats(engine, events) {
    const managerTeam = engine.getTeam(engine.manager.teamId);
    if (!managerTeam) return;

    managerTeam.squad.forEach(p => {
        if (!p.isTitular && !(p._matchGoals > 0)) return;
        initCareerStats(p);
        const goals = p._matchGoals || 0;
        const assists = 0; // tracked via scorers below
        const cards = events.cards?.filter(c => c.player === p.name).length || 0;
        const isMotm = events.motm?.name === p.name;
        recordMatchStats(p, goals, assists, cards, isMotm);
        delete p._matchGoals;
    });

    // Record assists from scorers
    (events.scorers || []).forEach(s => {
        if (s.assist) {
            const assistP = managerTeam.squad.find(p => p.name === s.assist);
            if (assistP) {
                initCareerStats(assistP);
                assistP.career.totalAssists++;
                assistP.career.seasonAssists++;
            }
        }
    });
}

/**
 * Apply leader trait morale boost on win.
 */
export function applyLeaderBoost(engine, homeId, awayId, homeGoals, awayGoals, isManagerMatch, rawEvents) {
    const managerTeam = engine.getTeam(engine.manager.teamId);
    if (!managerTeam || homeGoals === awayGoals) return;

    const isWin = (homeId === engine.manager.teamId && homeGoals > awayGoals) ||
                  (awayId === engine.manager.teamId && awayGoals > homeGoals);
    if (isWin) {
        const leaders = managerTeam.squad.filter(p => hasTrait(p, 'leader'));
        if (leaders.length > 0) {
            managerTeam.squad.forEach(p => { p.moral = Math.min(100, (p.moral || 50) + LEADER_WIN_MORAL_BOOST); });
            if (isManagerMatch) rawEvents.push({ minute: 90, type: 'leader', name: leaders[0].name });
        }
    }
}

/**
 * Settle Bicho (match bonus).
 */
export function settleBicho(engine, homeId, homeGoals, awayGoals, isManagerMatch, rawEvents) {
    if (!isManagerMatch || !engine.pendingMatchBonus) return;
    const managerIsHome = homeId === engine.manager.teamId;
    const didWin = managerIsHome ? homeGoals > awayGoals : awayGoals > homeGoals;
    const bonusResult = settleMatchBonus(engine, didWin);
    if (bonusResult) {
        if (isManagerMatch) rawEvents.push({ minute: 90, type: 'bicho', ...bonusResult });
        engine.weekEvents = engine.weekEvents || [];
        engine.weekEvents.push(bonusResult.msg);
    }
}

/**
 * Feed NPC tactic advisor + MARL emotional engine with match results.
 */
export function feedNpcResults(engine, homeTeam, awayTeam, homeId, awayId, homeGoals, awayGoals) {
    const homeResult = homeGoals > awayGoals ? 'W' : homeGoals < awayGoals ? 'L' : 'D';
    const awayResult = awayGoals > homeGoals ? 'W' : awayGoals < homeGoals ? 'L' : 'D';

    if (homeTeam && homeId !== engine.manager.teamId && homeTeam.npcTacticState) {
        homeTeam.npcTacticState = recordNpcResult(homeTeam.npcTacticState, homeResult);
        try { npcFeedMatchResult(homeTeam, homeResult, engine); } catch { /* defensive */ }
    }
    if (awayTeam && awayId !== engine.manager.teamId && awayTeam.npcTacticState) {
        awayTeam.npcTacticState = recordNpcResult(awayTeam.npcTacticState, awayResult);
        try { npcFeedMatchResult(awayTeam, awayResult, engine); } catch { /* defensive */ }
    }

    if (!engine._lastNpcOpponent) engine._lastNpcOpponent = {};
    if (homeId !== engine.manager.teamId) engine._lastNpcOpponent[homeId] = awayId;
    if (awayId !== engine.manager.teamId) engine._lastNpcOpponent[awayId] = homeId;
}

/**
 * Emit match end audio event.
 */
export function emitMatchEnd(isManagerHome, isManagerAway, homeGoals, awayGoals) {
    try {
        const managerResult = isManagerHome
            ? (homeGoals > awayGoals ? 'victory' : homeGoals < awayGoals ? 'defeat' : 'draw')
            : isManagerAway
                ? (awayGoals > homeGoals ? 'victory' : awayGoals < homeGoals ? 'defeat' : 'draw')
                : 'neutral';
        emitGameEvent(GameEvents.MATCH_ENDED, { result: managerResult, homeGoals, awayGoals });
    } catch { /* event emit - non-critical */ }
}
