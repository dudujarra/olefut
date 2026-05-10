/**
 * NpcManagerAI — MARL Fase 6
 *
 * Orquestra decisões de IA para todos os clubes NPC.
 * Cada time NPC com brain instanciado recebe decisões de:
 *   - Tática (via brain.pickAction)
 *   - Treinamento (via personality bias)
 *   - Compra/Venda (via CognitiveBiases + LLMBridge heuristics)
 *
 * Este módulo é chamado pelo engine.js no loop semanal dos NPCs,
 * substituindo o NpcTacticAdvisor para times com brain.
 */

import { encodeState, detectGoals, computeReward } from './AdaptiveBrain.js';
import { decideBuyHeuristic, decideSellHeuristic } from './LLMBridge.js';
import { rng as systemRng } from '../../engine/rng.js';

// ─── STATE CONTEXT BUILDER ───────────────────────────────────

/**
 * Constrói contexto de estado para um time NPC.
 * Equivalente ao _buildStateCtx() do AutoPlayService, mas genérico.
 *
 * @param {Object} team — objeto do time (engine.teams[i])
 * @param {Object} engine — instância do Engine
 * @returns {Object} ctx compatível com encodeState()
 */
export function buildNpcStateCtx(team, engine) {
    const standings = engine.getStandings(team.zone, team.division) || [];
    const position = standings.findIndex(s => s.teamId === team.id) + 1 || standings.length || 10;
    const balance = team.balance || 0;
    const formAvg = team.squad?.length
        ? team.squad.reduce((s, p) => s + (p.form?.value ?? 50), 0) / team.squad.length
        : 50;
    const lastResult = team.npcTacticState?.recentResults?.[0] || '-';
    const lossStreak = Math.abs(countStreak(team.npcTacticState?.recentResults || [], 'L'));

    return {
        position,
        totalTeams: standings.length || 20,
        balance,
        formAvg,
        week: engine.currentWeek || 0,
        squadSize: team.squad?.length || 0,
        lastResult,
        lossStreak
    };
}

// ─── TACTIC DECISION ─────────────────────────────────────────

/**
 * NPC brain decide tática para a semana.
 * Retorna a tática escolhida (string) e se mudou.
 *
 * @param {Object} team
 * @param {Object} engine
 * @returns {{ tactic: string, changed: boolean, source: string }}
 */
export function npcTacticDecision(team, engine) {
    const brain = team.brain;
    if (!brain) {
        return { tactic: team.npcTacticState?.currentTactic || 'normal', changed: false, source: 'fallback' };
    }

    const ctx = buildNpcStateCtx(team, engine);
    const stateKey = encodeState(ctx);
    const tacticActions = ['TACTIC_normal', 'TACTIC_attacking', 'TACTIC_defensive', 'TACTIC_counter'];
    const picked = brain.pickAction(stateKey, tacticActions, ctx);
    const newTactic = picked ? picked.replace('TACTIC_', '') : 'normal';
    const oldTactic = team.npcTacticState?.currentTactic || 'normal';

    return {
        tactic: newTactic,
        changed: newTactic !== oldTactic,
        source: 'brain'
    };
}

// ─── TRAINING DECISION ───────────────────────────────────────

/**
 * NPC decide treinamento baseado em personality + contexto.
 * Formador → prioriza youth. Guardiola → tactical. Kamikaze → attacking.
 *
 * @param {Object} team
 * @param {Array<string>} availableTrainings — IDs de treino disponíveis
 * @returns {string} trainingId
 */
export function npcTrainingDecision(team, availableTrainings = []) {
    if (!availableTrainings.length) return 'fitness';
    const brain = team.brain;
    if (!brain) return availableTrainings[Math.floor(systemRng() * availableTrainings.length)];

    const personality = brain.personality;
    const bias = personality?.tacticalBias || 'normal';

    // Map personality bias → preferred training
    const preferenceMap = {
        'possession': ['tactical', 'technical', 'fitness'],
        'attacking': ['attack', 'technical', 'fitness'],
        'defensive': ['defensive', 'tactical', 'fitness'],
        'normal': ['fitness', 'tactical', 'technical'],
        'counter': ['tactical', 'defensive', 'attack'],
        'pressing': ['fitness', 'tactical', 'attack']
    };

    const preferred = preferenceMap[bias] || preferenceMap.normal;

    // Pick first available from preference list
    for (const pref of preferred) {
        const match = availableTrainings.find(t => t.includes(pref));
        if (match) return match;
    }

    return availableTrainings[0];
}

// ─── TRANSFER DECISIONS ──────────────────────────────────────

/**
 * NPC avalia se deve comprar alguém nesta rodada.
 * Usa personality + CognitiveBiases para modular.
 *
 * @param {Object} team
 * @param {Object} engine
 */
export function npcBuyDecision(team, engine) {
    const brain = team.brain;
    if (!brain || (team.balance || 0) <= 0) return;

    const personality = brain.personality;
    const riskMod = brain.emotions?.getModifiers()?.riskMod ?? 0.4;

    // Scout weakest position
    const positions = ['GOL', 'DEF', 'MEI', 'ATA'];
    const positionStrength = positions.map(pos => {
        const players = (team.squad || []).filter(p => p.position === pos);
        const avgOVR = players.length > 0
            ? players.reduce((s, p) => s + (p.ovr || 0), 0) / players.length
            : 0;
        return { pos, avgOVR, count: players.length };
    });
    const weakest = positionStrength.sort((a, b) => a.avgOVR - b.avgOVR)[0];
    if (!weakest || weakest.avgOVR >= 75) return; // squad strong enough

    // Scout league for candidates
    if (typeof engine.scoutLeague !== 'function') return;
    const candidates = engine.scoutLeague(weakest.pos, weakest.avgOVR + 3, 5);
    if (candidates.length === 0) return;

    // Budget: personality riskMod determines how much of balance to risk
    const maxBudget = (team.balance || 0) * riskMod;

    const target = candidates.find(c => {
        const v = c.value || (c.ovr || 60) * 50_000;
        return v * 1.4 <= maxBudget;
    });
    if (!target) return;

    const playerVal = target.value || (target.ovr || 60) * 50_000;
    const offerAmount = Math.round(playerVal * (1.3 + systemRng() * 0.3));

    // Apply cognitive biases to buy decision
    const decision = decideBuyHeuristic(
        team,
        { player: target.player || target, amount: offerAmount },
        personality
    );

    if (decision.buy && typeof engine.makeBuyOffer === 'function') {
        engine.makeBuyOffer(target.teamId, (target.player || target).id, offerAmount);
    }
}

/**
 * NPC avalia oferta de compra recebida.
 * Usa personality + sunk cost + endowment effect.
 *
 * @param {Object} team
 * @param {Object} offer — { player, amount }
 * @param {Object} engine
 * @returns {{ sell: boolean, reason: string }}
 */
export function npcEvaluateIncomingOffer(team, offer, engine) {
    const brain = team.brain;
    if (!brain) {
        // No brain: accept if overpay 1.5x
        const isOverpay = offer.amount >= (offer.player?.value || 1_000_000) * 1.5;
        return { sell: isOverpay, reason: isOverpay ? 'overpay (no-brain)' : 'keep (no-brain)' };
    }

    return decideSellHeuristic(team, offer, brain.personality);
}

// ─── EMOTIONAL FEED ──────────────────────────────────────────

/**
 * Alimenta o EmotionalEngine do NPC com o resultado de uma partida.
 *
 * @param {Object} team
 * @param {'W'|'D'|'L'} result
 * @param {Object} engine
 */
export function npcFeedMatchResult(team, result, engine) {
    const brain = team.brain;
    if (!brain) return;

    const recentResults = team.npcTacticState?.recentResults || [];
    const streak = countStreak([result, ...recentResults]);
    const standings = engine.getStandings(team.zone, team.division) || [];
    const pos = standings.findIndex(s => s.teamId === team.id) + 1;
    const isRelRisk = pos > standings.length * 0.75;

    brain.processMatchResult(result, streak, isRelRisk);
}

// ─── Q-TABLE REWARD OBSERVATION ──────────────────────────────

/**
 * Observe reward for NPC brain (lighter than AutoPlayService's version).
 * Only runs for teams in player's division ±1 for performance.
 *
 * @param {Object} team
 * @param {Object} ctx — from buildNpcStateCtx
 * @param {string} lastAction — e.g. 'TACTIC_defensive'
 * @param {string} lastStateKey — previous stateKey
 */
export function npcObserveReward(team, ctx, lastAction, lastStateKey) {
    const brain = team.brain;
    if (!brain || !lastAction || !lastStateKey) return;

    const emoMods = brain.emotions?.getModifiers() || { lossMod: 1.0 };
    const reward = computeReward({
        matchResult: ctx.lastResult,
        balanceDelta: 0, // NPCs don't track balance delta per-tick
        positionDelta: 0,
        promoted: false,
        relegated: false,
        title: false,
        emotionalLossMod: emoMods.lossMod
    });

    const nextStateKey = encodeState(ctx);
    brain.observe(lastStateKey, lastAction, reward, nextStateKey, []);
}

// ─── HELPERS ─────────────────────────────────────────────────

/**
 * Conta streak consecutiva (positiva para vitórias, negativa para derrotas).
 * @param {string[]} results — ['W','W','L','D',...]
 * @param {string} [type] — se fornecido, conta só esse tipo
 * @returns {number}
 */
export function countStreak(results, type = null) {
    if (!Array.isArray(results) || results.length === 0) return 0;

    if (type) {
        let count = 0;
        for (const r of results) {
            if (r === type) count++;
            else break;
        }
        return count;
    }

    // Auto-detect: positive for W streak, negative for L streak
    const first = results[0];
    if (first !== 'W' && first !== 'L') return 0;

    let count = 0;
    for (const r of results) {
        if (r === first) count++;
        else break;
    }
    return first === 'W' ? count : -count;
}

/**
 * Determina se um time NPC deve usar brain completo ou heurística leve.
 * Performance: brain completo só para times da mesma divisão ±1 do jogador.
 *
 * @param {Object} team
 * @param {number} playerDivision — divisão do jogador humano
 * @returns {boolean}
 */
export function shouldUseFullBrain(team, playerDivision) {
    return Math.abs((team.division || 4) - playerDivision) <= 1;
}
