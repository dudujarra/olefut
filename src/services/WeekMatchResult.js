/**
 * WeekMatchResult — Extracted from WeekProcessor (AKITA-RFCT-006)
 *
 * Handles post-match result processing:
 * - W/D/L stat tracking + rolling form
 * - SPEC-072: Board tension adjustments
 * - SPEC-076: Humiliation cascade (goal diff >= 4)
 * - SPEC-077: Loss streak response
 * - SPEC-080: Rivalry H2H tracking
 * - SPEC-167: Post-match narrative (LLM + template fallback)
 *
 * Stateless module: receives engine + team + weekResults as args.
 */

import { recordResult as recordWinStreak } from '../engine/WinStreakModifierSystem';
import { apply as applyBoardTension } from '../engine/BoardTensionSystem';
import { evaluate as evaluateHumiliation } from '../engine/HumiliationCascadeSystem';
import { evaluate as evaluateLossStreak, recordResult as recordStreakResult } from '../engine/LossStreakResponseSystem';
import { updateForm } from '../engine/systems/FormSystem.js';

/**
 * Process the match result for the manager's team this week.
 * Updates stats, triggers narrative hooks, and adjusts board tension.
 *
 * @param {Engine} engine
 * @param {object} team
 * @param {object} weekResults
 */
export function processMatchResult(engine, team, weekResults) {
    for (const tId in weekResults) {
        const myMatch = weekResults[tId].find(m => m.home === team.id || m.away === team.id);
        if (myMatch && myMatch.score) {
            const isHome = myMatch.home === team.id;
            const myGoals = isHome ? myMatch.score.homeGoals : myMatch.score.awayGoals;
            const theirGoals = isHome ? myMatch.score.awayGoals : myMatch.score.homeGoals;

            // SPEC-167: post-match narrative (non-blocking, fallback safe).
            populateMatchNarrative(engine, team, myMatch, isHome, myGoals, theirGoals);
            engine.managerStats.goalsFor = (engine.managerStats.goalsFor || 0) + myGoals;
            engine.managerStats.goalsAgainst = (engine.managerStats.goalsAgainst || 0) + theirGoals;
            if (myGoals > theirGoals) {
                _handleWin(engine, team, myGoals, theirGoals);
            } else if (myGoals < theirGoals) {
                _handleLoss(engine, team, myGoals, theirGoals);
            } else {
                _handleDraw(engine, team);
            }

            // SPEC-080: track rivalry H2H
            _trackRivalry(engine, team, myMatch, isHome, myGoals, theirGoals);

            break;
        }
    }
}

// ─── Win ────────────────────────────────────────────────────

function _handleWin(engine, team) {
    engine.managerStats.wins++;
    engine.managerStats.streak = Math.max(0, engine.managerStats.streak) + 1;
    engine.managerStats.lossStreak = 0;
    if (!engine.managerStats.rollingForm) engine.managerStats.rollingForm = [];
    engine.managerStats.rollingForm.push('W');
    if (engine.managerStats.rollingForm.length > 10) engine.managerStats.rollingForm.shift();
    recordStreakResult({ teamId: team.id, result: 'W' });
    recordWinStreak({ teamId: team.id, result: 'W' });
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
}

// ─── Loss ───────────────────────────────────────────────────

function _handleLoss(engine, team, myGoals, theirGoals) {
    engine.managerStats.losses++;
    engine.managerStats.streak = Math.min(0, engine.managerStats.streak) - 1;
    engine.managerStats.lossStreak = (engine.managerStats.lossStreak || 0) + 1;
    if (!engine.managerStats.rollingForm) engine.managerStats.rollingForm = [];
    engine.managerStats.rollingForm.push('L');
    recordWinStreak({ teamId: team.id, result: 'L' });
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
}

// ─── Draw ───────────────────────────────────────────────────

function _handleDraw(engine, team) {
    engine.managerStats.draws++;
    engine.managerStats.streak = 0;
    if (!engine.managerStats.rollingForm) engine.managerStats.rollingForm = [];
    engine.managerStats.rollingForm.push('D');
    recordWinStreak({ teamId: team.id, result: 'D' });
    if (engine.managerStats.rollingForm.length > 10) engine.managerStats.rollingForm.shift();
    recordStreakResult({ teamId: team.id, result: 'D' });
    team.squad.filter(p => p.isTitular).forEach(p => updateForm(p, 0));
}

// ─── Rivalry H2H ────────────────────────────────────────────

function _trackRivalry(engine, team, myMatch, isHome, myGoals, theirGoals) {
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
}

// ─── Narrative ──────────────────────────────────────────────

/**
 * SPEC-167: populate engine.lastMatchNarrative + board reaction on humiliation.
 *
 * Non-blocking. LLMNarrativeService returns a Promise; we fire-and-forget
 * but still set the value synchronously via the template fallback so the UI
 * always has something to show without a render race.
 */
export function populateMatchNarrative(engine, team, myMatch, isHome, myGoals, theirGoals) {
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
