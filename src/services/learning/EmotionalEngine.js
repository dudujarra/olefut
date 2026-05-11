/**
 * EmotionalEngine — Fase 2 + Fase 3 (SARSA(λ) Learned Modifiers)
 *
 * Máquina de Estados Emocionais (FSM) que modula o comportamento
 * do AdaptiveBrain em tempo real.
 *
 * Fase 2 (original): FSM transitions between emotional states.
 * Fase 3 (ML upgrade): SARSA(λ) learns optimal modifier values
 *   per (emotion, game-context) instead of hardcoded table.
 *
 * Ref: Rummery & Niranjan (1994) — SARSA
 *      Sutton & Barto (2018) — Ch.12 Eligibility Traces
 *
 * Estados:
 *   CALM       → estado default, decisões racionais
 *   CONFIDENT  → série de vitórias, epsilon baixo (explora pouco)
 *   EUPHORIC   → ganhou título/promoção, risk appetite máximo
 *   ANXIOUS    → derrotas recentes, loss aversion aumenta
 *   TILTED     → muitas derrotas, decisões irracionais (epsilon alto)
 *   DESPERATE  → risco de rebaixamento + tilted, pânico total
 *
 * Cada estado exporta modificadores que o AdaptiveBrain consome:
 *   epsilonMod     — multiplica o epsilon (exploração)
 *   lossMod        — multiplica a dor das derrotas (Prospect Theory)
 *   riskMod        — fração do caixa que aceita gastar
 *   tacticOverride — força tática específica (ou null)
 */

import { LearnedEmotionalModifiers } from './LearnedEmotionalModifiers.js';

const STATES = {
    CALM:      { epsilonMod: 1.0, lossMod: 1.0, riskMod: 0.40, tacticOverride: null },
    CONFIDENT: { epsilonMod: 0.3, lossMod: 0.8, riskMod: 0.50, tacticOverride: null },
    EUPHORIC:  { epsilonMod: 0.2, lossMod: 0.5, riskMod: 0.80, tacticOverride: null },
    ANXIOUS:   { epsilonMod: 1.5, lossMod: 2.0, riskMod: 0.30, tacticOverride: null },
    TILTED:    { epsilonMod: 3.0, lossMod: 2.5, riskMod: 0.60, tacticOverride: null },
    DESPERATE: { epsilonMod: 4.0, lossMod: 3.0, riskMod: 0.90, tacticOverride: 'offensive' }
};

/**
 * Transition rules: currentState × event → nextState
 * Events: WIN, DRAW, LOSS, TITLE, PROMOTION, RELEGATION_RISK, STREAK_BROKEN
 */
const TRANSITIONS = {
    CALM: {
        WIN:             (streak) => streak >= 3 ? 'CONFIDENT' : 'CALM',
        DRAW:            () => 'CALM',
        LOSS:            (streak) => Math.abs(streak) >= 3 ? 'ANXIOUS' : 'CALM',
        TITLE:           () => 'EUPHORIC',
        PROMOTION:       () => 'EUPHORIC',
        RELEGATION_RISK: () => 'ANXIOUS'
    },
    CONFIDENT: {
        WIN:             (streak) => streak >= 6 ? 'EUPHORIC' : 'CONFIDENT',
        DRAW:            () => 'CALM',
        LOSS:            () => 'CALM',
        TITLE:           () => 'EUPHORIC',
        PROMOTION:       () => 'EUPHORIC',
        RELEGATION_RISK: () => 'ANXIOUS'
    },
    EUPHORIC: {
        WIN:             () => 'EUPHORIC',
        DRAW:            () => 'CONFIDENT',
        LOSS:            () => 'CALM',
        TITLE:           () => 'EUPHORIC',
        PROMOTION:       () => 'EUPHORIC',
        RELEGATION_RISK: () => 'ANXIOUS'
    },
    ANXIOUS: {
        WIN:             () => 'CALM',
        DRAW:            () => 'CALM',  // SPEC-139: empate é suficiente pra sair do pânico
        LOSS:            (streak) => Math.abs(streak) >= 4 ? 'TILTED' : 'ANXIOUS',
        TITLE:           () => 'EUPHORIC',
        PROMOTION:       () => 'EUPHORIC',
        RELEGATION_RISK: () => 'TILTED'
    },
    TILTED: {
        WIN:             () => 'ANXIOUS',
        DRAW:            () => 'TILTED',
        LOSS:            (_s, isRelegationRisk) => isRelegationRisk ? 'DESPERATE' : 'TILTED',
        TITLE:           () => 'EUPHORIC',
        PROMOTION:       () => 'EUPHORIC',
        RELEGATION_RISK: () => 'DESPERATE',
        STREAK_BROKEN:   () => 'CALM'
    },
    DESPERATE: {
        WIN:             () => 'ANXIOUS',
        DRAW:            () => 'DESPERATE',
        LOSS:            () => 'DESPERATE',
        TITLE:           () => 'EUPHORIC',
        PROMOTION:       () => 'EUPHORIC',
        STREAK_BROKEN:   () => 'CALM'
    }
};

export class EmotionalEngine {
    /**
     * @param {Object} personality — resultado de generatePersonality()
     */
    constructor(personality = null) {
        this.state = 'CALM';
        this.personality = personality;
        this.history = []; // últimas 20 transições
        this.ticksSinceChange = 0;

        // Neuroticism do OCEAN amplifica as transições negativas
        this._neuroticismFactor = personality?.ocean?.N ?? 0.5;

        // Fase 3 ML: SARSA(λ) learned modifiers
        // Replaces hardcoded STATES table with contextual learned values
        this.sarsaModifiers = new LearnedEmotionalModifiers();
        this._currentCtx = null;        // game context for SARSA state encoding
        this._lastSarsaActionId = null;  // last SARSA action for feedback
    }

    /**
     * Processa um evento e faz a transição de estado.
     *
     * @param {'WIN'|'DRAW'|'LOSS'|'TITLE'|'PROMOTION'|'RELEGATION_RISK'|'STREAK_BROKEN'} event
     * @param {number} [streak=0] — streak atual (positivo = vitórias, negativo = derrotas)
     * @param {boolean} [isRelegationRisk=false]
     * @returns {{ from: string, to: string, changed: boolean }}
     */
    processEvent(event, streak = 0, isRelegationRisk = false) {
        const from = this.state;
        const transitionMap = TRANSITIONS[from];
        if (!transitionMap || !transitionMap[event]) {
            return { from, to: from, changed: false };
        }

        let to = transitionMap[event](streak, isRelegationRisk);

        // Neuroticism amplification: bots neuróticos caem mais rápido
        // para estados negativos e sobem mais devagar para positivos
        if (this._neuroticismFactor > 0.6) {
            // Alta neuroticismo: se caindo, pula um nível
            if (event === 'LOSS' && to === 'ANXIOUS' && Math.abs(streak) >= 3) {
                to = 'TILTED';
            }
            // Alta neuroticismo: demora mais pra se recuperar
            if (event === 'WIN' && from === 'TILTED') {
                to = 'TILTED'; // precisa de 2 vitórias (override)
                if (this.ticksSinceChange > 3) to = 'ANXIOUS'; // ok, já sofreu bastante
            }
        }

        if (this._neuroticismFactor < 0.3) {
            // Baixa neuroticismo (calmo): resiste mais
            if (event === 'LOSS' && to === 'TILTED') {
                to = 'ANXIOUS'; // downgrade de TILTED pra ANXIOUS
            }
        }

        const changed = from !== to;
        if (changed) {
            this.state = to;
            this.ticksSinceChange = 0;
            this.history.push({ from, to, event, streak, ts: Date.now() });
            if (this.history.length > 20) {
                this.history = this.history.slice(-20);
            }
        } else {
            this.ticksSinceChange++;
        }

        return { from, to, changed };
    }

    /**
     * Retorna os modificadores ativos do estado emocional atual.
     * Fase 3: if game context is available, uses SARSA(λ) learned modifiers.
     * Falls back to hardcoded STATES table if SARSA hasn't learned yet.
     * @returns {{ epsilonMod, lossMod, riskMod, tacticOverride, state, source }}
     */
    getModifiers() {
        const base = STATES[this.state] || STATES.CALM;

        // Fase 3: Try SARSA learned modifiers if context available
        if (this._currentCtx && this.sarsaModifiers.totalUpdates > 10) {
            const sarsaState = this.sarsaModifiers.encodeState(this.state, this._currentCtx);
            const { actionId, modifiers } = this.sarsaModifiers.pickResponse(sarsaState);
            this._lastSarsaActionId = actionId;
            this._lastSarsaState = sarsaState;
            return {
                epsilonMod: modifiers.epsilonMod,
                lossMod: modifiers.lossMod,
                riskMod: modifiers.riskMod,
                tacticOverride: modifiers.tacticOverride,
                state: this.state,
                source: 'sarsa',
                sarsaAction: actionId
            };
        }

        // Fallback: hardcoded modifiers (cold start)
        return {
            ...base,
            state: this.state,
            source: 'hardcoded'
        };
    }

    /**
     * Fase 3: Set game context for SARSA state encoding.
     * Call this every tick before getModifiers().
     * @param {Object} ctx — from AutoPlayService._buildStateCtx()
     */
    setContext(ctx) {
        this._currentCtx = ctx;
    }

    /**
     * Fase 3: Feed reward to SARSA after observing match outcome.
     * Closes the learning loop: pick response → play → observe → update.
     * @param {number} reward — from computeReward()
     */
    feedReward(reward) {
        if (!this._lastSarsaState || !this._lastSarsaActionId) return;
        // Encode current state for the SARSA update
        const currentSarsaState = this._currentCtx
            ? this.sarsaModifiers.encodeState(this.state, this._currentCtx)
            : this._lastSarsaState;
        // Pick what SARSA would choose NOW (on-policy — needed for SARSA update)
        const { actionId: nextActionId } = this.sarsaModifiers.pickResponse(currentSarsaState);
        this.sarsaModifiers.observe(currentSarsaState, nextActionId, reward);
    }

    /**
     * Força um estado (debug/testing).
     */
    forceState(state) {
        if (STATES[state]) {
            this.state = state;
            this.ticksSinceChange = 0;
        }
    }

    /**
     * Serializa para persistência.
     */
    serialize() {
        return {
            state: this.state,
            history: this.history,
            ticksSinceChange: this.ticksSinceChange
            // Note: SARSA has its own persistence via localStorage
        };
    }

    /**
     * Restaura de dados persistidos.
     */
    restore(data) {
        if (!data) return;
        if (data.state && STATES[data.state]) this.state = data.state;
        if (Array.isArray(data.history)) this.history = data.history;
        if (typeof data.ticksSinceChange === 'number') this.ticksSinceChange = data.ticksSinceChange;
    }

    /**
     * Fase 3: Clear SARSA traces at episode boundary.
     */
    clearSarsaTraces() {
        this.sarsaModifiers.clearTraces();
    }

    /**
     * Resumo para telemetria/debug.
     */
    summary() {
        return {
            currentState: this.state,
            modifiers: this.getModifiers(),
            ticksSinceChange: this.ticksSinceChange,
            recentTransitions: this.history.slice(-5),
            sarsa: this.sarsaModifiers.summary()
        };
    }
}
