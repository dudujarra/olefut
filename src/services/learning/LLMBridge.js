/**
 * LLMBridge — SPEC-119
 *
 * Decision engine for AutoPlay bot buy/sell. Two modes:
 * - heuristic: pure function rules (default, always available)
 * - webllm: in-browser LLM via @mlc-ai/web-llm (opt-in, WebGPU required)
 *
 * Bridge falls back to heuristic if WebLLM init fails or model unloaded.
 *
 * Usage:
 *   const bridge = new LLMBridge({ mode: 'heuristic' });
 *   await bridge.init();
 *   const decision = await bridge.decideBuy(team, offer);
 *   // { buy: bool, reason: string, source: 'heuristic'|'llm' }
 */

const STORAGE_KEY = 'elifoot_llm_mode';

import { applyBuyBiases, applySellBiases, applyEndowment } from './CognitiveBiases.js';

/**
 * HEURISTIC: Should bot buy this player?
 * Fase 5: Now modulated by OCEAN personality + cognitive biases.
 *
 * @param {Object} team
 * @param {Object} offer — { player, amount }
 * @param {Object|null} [personality] — OCEAN personality from AdaptiveBrain
 * @param {Object} [biasCtx] — { recentLeagueTransfers, windowWeeksLeft, totalWindowWeeks, lastMatchStats, recentWinRate }
 */
export function decideBuyHeuristic(team, offer, personality = null, biasCtx = {}) {
    if (!team?.squad || !offer?.player || !offer?.amount) {
        return { buy: false, reason: 'invalid input', source: 'heuristic' };
    }
    const position = offer.player.position;
    const positionPlayers = team.squad.filter(p => p.position === position);
    const avgPositionOVR = positionPlayers.length > 0
        ? positionPlayers.reduce((s, p) => s + (p.ovr || 0), 0) / positionPlayers.length
        : 0;
    const offerOVR = offer.player.ovr || 0;

    const isPositionWeak = avgPositionOVR < 60;
    const isUpgrade = offerOVR > avgPositionOVR + 5;
    const squadHasRoom = team.squad.length < 25;

    // Fase 5: Apply cognitive biases to perceived affordability
    let effectiveAmount = offer.amount;
    let biasLog = [];
    if (personality) {
        const biases = applyBuyBiases({
            realValue: offer.amount,
            personality,
            context: {
                ...biasCtx,
                targetPosition: position
            }
        });
        effectiveAmount = biases.perceivedValue;
        biasLog = biases.biasesApplied;

        // Urgency modifier: high urgency → relax affordability check
        const budgetThreshold = biases.urgencyMod > 1.2 ? 1.5 : 2;
        const isAffordable = (team.balance || 0) > effectiveAmount * budgetThreshold;

        const buy = isPositionWeak && isAffordable && isUpgrade && squadHasRoom;
        const reason = !buy
            ? `skip: weak=${isPositionWeak} aff=${isAffordable} up=${isUpgrade} room=${squadHasRoom} biases=[${biasLog.join(',')}]`
            : `${position} weak (avg ${avgPositionOVR.toFixed(0)}) → buy ${offerOVR}OVR [${biasLog.join(',')}]`;

        return { buy, reason, source: 'heuristic', biases: biasLog };
    }

    // Fallback: no personality → pure rational
    const isAffordable = (team.balance || 0) > offer.amount * 2;
    const buy = isPositionWeak && isAffordable && isUpgrade && squadHasRoom;
    const reason = !buy
        ? `skip: weak=${isPositionWeak} aff=${isAffordable} up=${isUpgrade} room=${squadHasRoom}`
        : `${position} weak (avg ${avgPositionOVR.toFixed(0)}) → buy ${offerOVR}OVR`;

    return { buy, reason, source: 'heuristic' };
}

/**
 * HEURISTIC: Should bot sell this player given offer?
 * Fase 5: Now modulated by OCEAN personality + cognitive biases.
 *
 * @param {Object} team
 * @param {Object} offer — { player, amount }
 * @param {Object|null} [personality] — OCEAN personality from AdaptiveBrain
 * @param {Object} [biasCtx] — { lastMatchStats }
 */
export function decideSellHeuristic(team, offer, personality = null, biasCtx = {}) {
    if (!team?.squad || !offer?.player || !offer?.amount) {
        return { sell: false, reason: 'invalid input', source: 'heuristic' };
    }
    const player = offer.player;
    const positionPlayers = team.squad.filter(p => p.position === player.position);
    const isReserve = !player.isTitular;
    const isOld = (player.age || 25) > 32;
    const positionDeep = positionPlayers.length > 4;

    // Fase 5: Apply cognitive biases to sell threshold
    if (personality) {
        const biases = applySellBiases({
            offerAmount: offer.amount,
            playerValue: player.value || 1_000_000,
            purchasePrice: player._purchasePrice || 0,
            personality,
            context: biasCtx
        });

        // Bot rejects if offer < minAcceptable (sunk cost + endowment)
        const isOverpay = offer.amount >= biases.minAcceptable;
        const sell = (isReserve && isOverpay) || (isOld && positionDeep) || isOverpay;
        const reason = sell
            ? `sell: reserve=${isReserve} old=${isOld} overpay=${isOverpay} biases=[${biases.biasesApplied.join(',')}]`
            : `keep: offer ${offer.amount} < min ${biases.minAcceptable} [${biases.biasesApplied.join(',')}]`;

        return { sell, reason, source: 'heuristic', biases: biases.biasesApplied };
    }

    // Fallback: no personality → pure rational
    const isOverpay = offer.amount >= (player.value || 1_000_000) * 1.2;
    const sell = (isReserve && isOverpay) || (isOld && positionDeep) || isOverpay;
    const reason = sell
        ? `sell: reserve=${isReserve} old=${isOld} overpay=${isOverpay} deep=${positionDeep}`
        : 'keep';

    return { sell, reason, source: 'heuristic' };
}

export class LLMBridge {
    constructor({ mode = 'heuristic' } = {}) {
        this.mode = this._restoreMode() || mode;
        this.engine = null;          // WebLLM engine instance
        this.modelReady = false;
        this.loadProgress = 0;
        this.loadStatus = 'idle';
    }

    _restoreMode() {
        try {
            if (typeof localStorage === 'undefined') return null;
            return localStorage.getItem(STORAGE_KEY);
        } catch { return null; }
    }

    setMode(mode) {
        this.mode = mode;
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, mode);
        } catch { /* ignore */ }
    }

    /**
     * Lazy init for WebLLM. No-op for heuristic.
     */
    async init() {
        if (this.mode !== 'webllm') return;
        if (this.modelReady) return;
        if (typeof navigator === 'undefined' || !navigator.gpu) {
            this.loadStatus = 'no-webgpu';
            this.mode = 'heuristic';
            return;
        }
        try {
            this.loadStatus = 'loading';
            const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
            this.engine = await CreateMLCEngine(
                'Llama-3.2-1B-Instruct-q4f32_1-MLC',
                {
                    initProgressCallback: (info) => {
                        this.loadProgress = info.progress || 0;
                        this.loadStatus = info.text || 'loading';
                    }
                }
            );
            this.modelReady = true;
            this.loadStatus = 'ready';
        } catch (err) {
            this.loadStatus = `error: ${err.message}`;
            this.mode = 'heuristic';
            this.modelReady = false;
        }
    }

    /**
     * Decide buy. Optional memoryContext (RAG) for LLM mode.
     */
    async decideBuy(team, offer, memoryContext = '') {
        if (this.mode === 'webllm' && this.modelReady) {
            try {
                return await this._llmDecide('buy', team, offer, memoryContext);
            } catch {
                // fallback heuristic
            }
        }
        return decideBuyHeuristic(team, offer);
    }

    async decideSell(team, offer, memoryContext = '') {
        if (this.mode === 'webllm' && this.modelReady) {
            try {
                return await this._llmDecide('sell', team, offer, memoryContext);
            } catch {
                // fallback heuristic
            }
        }
        return decideSellHeuristic(team, offer);
    }

    async _llmDecide(kind, team, offer, memoryContext = '') {
        const positionPlayers = (team.squad || []).filter(p => p.position === offer.player.position);
        const avgOVR = positionPlayers.length > 0
            ? positionPlayers.reduce((s, p) => s + (p.ovr || 0), 0) / positionPlayers.length
            : 0;

        // SPEC-122 BUG-054: RAG — include episodic memory in prompt
        const memorySection = memoryContext
            ? `\nRecent decisions history:\n${memoryContext}\n`
            : '';

        const prompt = `You are a football manager bot. Decide whether to ${kind === 'buy' ? 'BUY' : 'SELL'} this player.

Squad context:
- Total players: ${team.squad?.length || 0}
- Balance: R$ ${((team.balance || 0) / 1_000_000).toFixed(0)}M
- ${offer.player.position} avg OVR: ${avgOVR.toFixed(0)}

Offer:
- Player: ${offer.player.name || 'Unknown'} (${offer.player.position}, age ${offer.player.age || '?'}, OVR ${offer.player.ovr || '?'})
- Amount: R$ ${(offer.amount / 1_000_000).toFixed(1)}M
${memorySection}
Reply ONLY with JSON: {"${kind}": true|false, "reason": "short string"}`;

        const response = await this.engine.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 100
        });
        const text = response.choices?.[0]?.message?.content || '';
        const match = text.match(/\{[^}]*\}/);
        if (!match) {
            return kind === 'buy'
                ? decideBuyHeuristic(team, offer)
                : decideSellHeuristic(team, offer);
        }
        const parsed = JSON.parse(match[0]);
        return {
            [kind]: !!parsed[kind],
            reason: parsed.reason || 'llm decision',
            source: 'llm'
        };
    }

    status() {
        return {
            mode: this.mode,
            modelReady: this.modelReady,
            loadProgress: this.loadProgress,
            loadStatus: this.loadStatus
        };
    }
}

// ============================================================
// MONOTONY DETECTION + GAMEPLAY SUGGESTIONS
// ============================================================

/**
 * Detects gameplay monotony and returns actionable suggestions.
 *
 * gameState: {
 *   currentTactic, tacticStreak,        // tactic stuck
 *   position, positionStreak,            // standing freeze
 *   streak,                              // win/loss streak
 *   avgOVR, balance, squadSize,
 *   division, seasonNumber,
 *   winRate,                             // overall win %
 * }
 */
export function detectMonotonyHeuristic(gameState) {
    const signals = [];
    const suggestions = [];

    const {
        currentTactic, tacticStreak = 0,
        position = 10, positionStreak = 0,
        streak = 0,
        avgOVR = 60, balance = 0, squadSize = 15,
        division = 4, winRate = 0.33
    } = gameState || {};

    // --- Tactic monotony ---
    if (tacticStreak >= 8) {
        signals.push({ id: 'TACTIC_STUCK', msg: `Mesma tática '${currentTactic}' há ${tacticStreak} sem` });
        const TACTICS = ['attacking', 'defensive', 'counter', 'normal'];
        const alt = TACTICS.find(t => t !== currentTactic) || 'counter';
        suggestions.push({ action: 'CHANGE_TACTIC', value: alt, reason: `tática ${currentTactic} monótona` });
    }

    // --- Standing freeze ---
    if (positionStreak >= 6) {
        signals.push({ id: 'STANDING_FREEZE', msg: `${position}º lugar há ${positionStreak} sem` });
        if (streak <= 0) {
            // Stuck + not winning: go more aggressive
            suggestions.push({ action: 'CHANGE_TACTIC', value: 'attacking', reason: 'parado na tabela' });
        }
        if (position <= 2) {
            // About to promote: strengthen squad
            suggestions.push({ action: 'SCOUT', reason: 'reforçar antes da divisão acima' });
        }
    }

    // --- Long loss streak ---
    if (streak <= -5) {
        signals.push({ id: 'LOSS_STREAK', msg: `${Math.abs(streak)} derrotas seguidas` });
        if (currentTactic !== 'defensive') {
            suggestions.push({ action: 'CHANGE_TACTIC', value: 'defensive', reason: 'série negativa' });
        }
        if (squadSize < 16) {
            suggestions.push({ action: 'BUY', reason: 'elenco curto em série negativa' });
        }
    }

    // --- Squad too weak with money to spend ---
    if (avgOVR < 63 && balance >= 2_000_000) {
        signals.push({ id: 'WEAK_SQUAD_RICH', msg: `OVR médio ${Math.round(avgOVR)} com R$${(balance/1e6).toFixed(1)}M disponível` });
        suggestions.push({ action: 'BUY', reason: 'squad fraco, dinheiro disponível' });
    }

    // --- Win rate too low for division ---
    const expectedWinRate = division === 1 ? 0.30 : division === 2 ? 0.35 : 0.40;
    if (winRate < expectedWinRate * 0.7 && gameState.seasonNumber > 2) {
        signals.push({ id: 'WIN_RATE_LOW', msg: `Aproveitamento ${(winRate*100).toFixed(0)}% (esperado >${(expectedWinRate*100).toFixed(0)}%)` });
        suggestions.push({ action: 'CHANGE_FORMATION', reason: 'aproveitamento abaixo do esperado' });
    }

    return {
        monotonous: signals.length > 0,
        severity: signals.length,
        signals,
        suggestions,
        topSuggestion: suggestions[0] || null
    };
}

/**
 * Generates game design insights from a telemetry SPEC report.
 * Maps low-scoring detectors to actionable engine/design changes.
 *
 * report: the .report object from AutoPlay telemetry
 * Returns array of { spec, score, insight, fix }
 */
export function generateGameDesignInsights(report) {
    if (!report?.results) return [];
    const insights = [];

    const r = report.results;

    if (r['SPEC-100']?.score < 40) {
        const sigs = r['SPEC-100'].signals?.map(s => s.msg).join('; ') || '';
        insights.push({
            spec: 'SPEC-100', score: r['SPEC-100'].score,
            problem: `Monotonia alta. ${sigs}`,
            fix: 'AutoPlay precisa de tática dinâmica: mudar tática automaticamente após 4+ sem sem vitória. Adicionar mais variedade na seleção de formação.'
        });
    }

    if (r['SPEC-102']?.score < 60) {
        insights.push({
            spec: 'SPEC-102', score: r['SPEC-102'].score,
            problem: 'Fun score baixo — partidas previsíveis.',
            fix: 'Aumentar variância nos resultados. Checar se matchSimulator usa aleatoriedade suficiente. Adicionar eventos inesperados (VAR, lesão-chave, penalti controverso).'
        });
    }

    if (r['SPEC-104']?.score < 50) {
        const dead = r['SPEC-104'].signals?.find(s => s.id === 'DEAD_VIEW')?.msg || '';
        insights.push({
            spec: 'SPEC-104', score: r['SPEC-104'].score,
            problem: `Views mortas no AutoPlay. ${dead}`,
            fix: 'AutoPlay deveria visitar mais views: matchView pós-partida, playerProfile quando craque emerge, continental cup view quando Libertadores começa.'
        });
    }

    if (r['SPEC-105']?.score < 80) {
        const top = r['SPEC-105'].topNarrators?.[0];
        insights.push({
            spec: 'SPEC-105', score: r['SPEC-105'].score,
            problem: `Narração repetida. Top: "${top?.[0]}" ×${top?.[1]}`,
            fix: 'Adicionar mais templates de evento vestiário. Variar com número de jogadores e condições específicas. Usar adjetivos dinâmicos.'
        });
    }

    if (r['SPEC-107']?.score < 80) {
        const gini = r['SPEC-107']?.giniCoefficient;
        insights.push({
            spec: 'SPEC-107', score: r['SPEC-107'].score,
            problem: `Identidade de jogador concentrada (GINI ${gini}). Um jogador domina todos os gols.`,
            fix: 'Distribuir gols por mais jogadores. Checar se recordMatchStats está sendo chamado para todos titulares, não só o centroavante.'
        });
    }

    if (r['SPEC-108']?.score < 50) {
        const top = r['SPEC-108']?.topRivals?.[0];
        insights.push({
            spec: 'SPEC-108', score: r['SPEC-108'].score,
            problem: `Rivalidades não emergem. ${top ? `${top.oppName} enfrentado ${top.encounters}× sem rivalidade.` : ''}`,
            fix: 'Implementar SPEC-055: após 20+ confrontos criar tag "rival". Exibir histórico H2H na tela pré-jogo. Adicionar evento narrativo "clássico do botão".'
        });
    }

    if (r['SPEC-111']?.score < 70) {
        insights.push({
            spec: 'SPEC-111', score: r['SPEC-111'].score,
            problem: 'Liquidez de mercado baixa — ofertas não sendo aceitas.',
            fix: 'Revisar threshold de buy offer. Bot oferta value × 1.3 mas AI aceita apenas value × 1.5+? Calibrar aceitação em makeBuyOffer. Verificar se player.value está setado corretamente nos jogadores de AI.'
        });
    }

    return insights.sort((a, b) => a.score - b.score);
}
