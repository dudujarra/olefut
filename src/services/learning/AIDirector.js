/**
 * AIDirector — MARL Fase 6.4
 *
 * Monitora a experiência do jogador humano e modula sutilmente
 * os bots adversários da divisão dele.
 *
 * Inspirado no AI Director do Left 4 Dead (Valve, 2008):
 *   - Build-Up → Peak → Relax cycle
 *   - Garante que o jogador nunca fique muito confortável NEM muito frustrado
 *
 * REGRA FUNDAMENTAL: O Director NUNCA muda resultados de partidas.
 * Ele apenas influencia decisões de GESTÃO dos bots (compras, táticas,
 * agressividade de mercado). A partida em si é determinística.
 */

import { rng as systemRng } from '../../engine/rng.js';

// ─── DIRECTOR STATE ──────────────────────────────────────────

const PHASES = {
    BUILD_UP: 'BUILD_UP',   // Bots estão se fortalecendo
    PEAK:     'PEAK',       // Bots no máximo de agressividade
    RELAX:    'RELAX'       // Bots dão uma aliviada
};

const PHASE_DURATIONS = {
    BUILD_UP: { min: 6, max: 12 },  // semanas
    PEAK:     { min: 3, max: 6 },
    RELAX:    { min: 4, max: 8 }
};

export class AIDirector {
    constructor() {
        this.phase = PHASES.BUILD_UP;
        this.phaseTicksRemaining = 8;
        this.intensityCurve = []; // últimas 20 semanas
        this.playerFrustrationIndex = 50; // 0-100
        this.tickCount = 0;
    }

    /**
     * Chamado toda semana pelo engine ANTES dos NPC decisions.
     * Retorna modificadores para os bots da divisão do player.
     *
     * @param {Object} playerCtx — {
     *   recentResults: ['W','L',...], // últimos 10 resultados do jogador
     *   position: number,             // posição na tabela
     *   totalTeams: number,
     *   streak: number,               // win/loss streak
     *   balance: number,
     *   division: number
     * }
     * @returns {{
     *   aggressionMod: number,        // 0.5-1.5 (multiplica riskMod dos bots)
     *   transferBudgetMod: number,    // 0.7-1.3 (multiplica budget de compra dos bots)
     *   tacticBias: string|null,      // força tática específica nos bots (null = livre)
     *   phase: string,                // fase atual do Director
     *   frustration: number           // 0-100 frustration index
     * }}
     */
    tick(playerCtx) {
        this.tickCount++;

        // 1. Update frustration index
        this._updateFrustration(playerCtx);

        // 2. Phase transition
        this.phaseTicksRemaining--;
        if (this.phaseTicksRemaining <= 0) {
            this._transitionPhase();
        }

        // 3. Override: if player is very frustrated, force RELAX
        if (this.playerFrustrationIndex > 80 && this.phase !== PHASES.RELAX) {
            this.phase = PHASES.RELAX;
            this.phaseTicksRemaining = PHASE_DURATIONS.RELAX.min;
        }

        // 4. Override: if player is cruising too easily, force BUILD_UP
        if (this.playerFrustrationIndex < 20 && this.phase === PHASES.RELAX) {
            this.phase = PHASES.BUILD_UP;
            this.phaseTicksRemaining = PHASE_DURATIONS.BUILD_UP.min;
        }

        // 5. Calculate modifiers based on phase
        const mods = this._calculateModifiers();

        // 6. Record intensity
        this.intensityCurve.push(mods.aggressionMod);
        if (this.intensityCurve.length > 20) {
            this.intensityCurve = this.intensityCurve.slice(-20);
        }

        return {
            ...mods,
            phase: this.phase,
            frustration: this.playerFrustrationIndex
        };
    }

    // ─── INTERNAL ────────────────────────────────────────────

    _updateFrustration(playerCtx) {
        const results = playerCtx?.recentResults || [];
        if (results.length === 0) return;

        // Recent win rate (last 10)
        const wins = results.slice(0, 10).filter(r => r === 'W').length;
        const losses = results.slice(0, 10).filter(r => r === 'L').length;
        const n = Math.min(10, results.length);

        // Win rate → frustration mapping
        // 0% wins → 100 frustration
        // 50% wins → 50 frustration
        // 80%+ wins → 10 frustration (too easy = bored, not frustrated)
        const winRate = n > 0 ? wins / n : 0.5;
        let targetFrustration;
        if (winRate <= 0.2) targetFrustration = 90;
        else if (winRate <= 0.4) targetFrustration = 70;
        else if (winRate <= 0.5) targetFrustration = 50;
        else if (winRate <= 0.7) targetFrustration = 30;
        else targetFrustration = 15;

        // Streak amplifier
        const streak = playerCtx?.streak || 0;
        if (streak <= -4) targetFrustration = Math.min(100, targetFrustration + 20);
        if (streak >= 5) targetFrustration = Math.max(0, targetFrustration - 15);

        // Position context: player at bottom → more frustrated
        const pos = playerCtx?.position || 10;
        const total = playerCtx?.totalTeams || 20;
        if (pos > total * 0.8) targetFrustration = Math.min(100, targetFrustration + 10);

        // Smooth transition (exponential moving average)
        this.playerFrustrationIndex = Math.round(
            this.playerFrustrationIndex * 0.7 + targetFrustration * 0.3
        );
    }

    _transitionPhase() {
        const transitions = {
            [PHASES.BUILD_UP]: PHASES.PEAK,
            [PHASES.PEAK]:     PHASES.RELAX,
            [PHASES.RELAX]:    PHASES.BUILD_UP
        };

        this.phase = transitions[this.phase] || PHASES.BUILD_UP;

        const dur = PHASE_DURATIONS[this.phase];
        this.phaseTicksRemaining = dur.min + Math.floor(systemRng() * (dur.max - dur.min));
    }

    _calculateModifiers() {
        switch (this.phase) {
            case PHASES.BUILD_UP:
                return {
                    aggressionMod: 0.8 + (1 - this.phaseTicksRemaining / 12) * 0.4,
                    transferBudgetMod: 1.0,
                    tacticBias: null
                };
            case PHASES.PEAK:
                return {
                    aggressionMod: 1.3,
                    transferBudgetMod: 1.2,
                    tacticBias: this.playerFrustrationIndex < 40 ? 'offensive' : null
                };
            case PHASES.RELAX:
                return {
                    aggressionMod: 0.6,
                    transferBudgetMod: 0.8,
                    tacticBias: null
                };
            default:
                return { aggressionMod: 1.0, transferBudgetMod: 1.0, tacticBias: null };
        }
    }

    // ─── PERSISTENCE ─────────────────────────────────────────

    serialize() {
        return {
            phase: this.phase,
            phaseTicksRemaining: this.phaseTicksRemaining,
            intensityCurve: this.intensityCurve,
            playerFrustrationIndex: this.playerFrustrationIndex,
            tickCount: this.tickCount
        };
    }

    restore(data) {
        if (!data) return;
        if (data.phase && Object.values(PHASES).includes(data.phase)) this.phase = data.phase;
        if (typeof data.phaseTicksRemaining === 'number') this.phaseTicksRemaining = data.phaseTicksRemaining;
        if (Array.isArray(data.intensityCurve)) this.intensityCurve = data.intensityCurve;
        if (typeof data.playerFrustrationIndex === 'number') this.playerFrustrationIndex = data.playerFrustrationIndex;
        if (typeof data.tickCount === 'number') this.tickCount = data.tickCount;
    }

    summary() {
        return {
            phase: this.phase,
            phaseTicksRemaining: this.phaseTicksRemaining,
            frustration: this.playerFrustrationIndex,
            tickCount: this.tickCount,
            avgIntensity: this.intensityCurve.length > 0
                ? (this.intensityCurve.reduce((s, v) => s + v, 0) / this.intensityCurve.length).toFixed(2)
                : '—',
            recentIntensity: this.intensityCurve.slice(-5)
        };
    }
}
