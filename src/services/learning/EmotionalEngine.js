/**
 * EmotionalEngine — Fase 2
 *
 * Máquina de Estados Emocionais (FSM) que modula o comportamento
 * do AdaptiveBrain em tempo real.
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

const STATES = {
    CALM:      { epsilonMod: 1.0, lossMod: 1.0, riskMod: 0.40, tacticOverride: null },
    CONFIDENT: { epsilonMod: 0.3, lossMod: 0.8, riskMod: 0.50, tacticOverride: null },
    EUPHORIC:  { epsilonMod: 0.2, lossMod: 0.5, riskMod: 0.80, tacticOverride: null },
    ANXIOUS:   { epsilonMod: 1.5, lossMod: 2.0, riskMod: 0.30, tacticOverride: null },
    TILTED:    { epsilonMod: 3.0, lossMod: 2.5, riskMod: 0.60, tacticOverride: null },
    DESPERATE: { epsilonMod: 4.0, lossMod: 3.0, riskMod: 0.90, tacticOverride: 'attacking' }
};

/**
 * Transition rules: currentState × event → nextState
 * Events: WIN, DRAW, LOSS, TITLE, PROMOTION, RELEGATION_RISK, STREAK_BROKEN
 */
const TRANSITIONS = {
    CALM: {
        WIN:             (streak) => streak >= 3 ? 'CONFIDENT' : 'CALM',
        DRAW:            () => 'CALM',
        LOSS:            (streak) => Math.abs(streak) >= 2 ? 'ANXIOUS' : 'CALM',
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
        DRAW:            () => 'ANXIOUS',
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
     * @returns {{ epsilonMod, lossMod, riskMod, tacticOverride, state }}
     */
    getModifiers() {
        const base = STATES[this.state] || STATES.CALM;
        return {
            ...base,
            state: this.state
        };
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
     * Resumo para telemetria/debug.
     */
    summary() {
        return {
            currentState: this.state,
            modifiers: this.getModifiers(),
            ticksSinceChange: this.ticksSinceChange,
            recentTransitions: this.history.slice(-5)
        };
    }
}
