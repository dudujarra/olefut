/**
 * InheritanceService — v1.1.5 (AKITA-052)
 *
 * Aplica bias de traits herdáveis em regens baseado em:
 * 1. Pais biológicos (regen-filhos via regenLineage v1.3)
 * 2. Hall de Lendas do clube (mito ambiente)
 *
 * 4 traits range 0-100:
 * - garra: determinação/intensidade
 * - talento_natural: dom raro
 * - lealdade: vínculo com clube
 * - frieza: clutch/decisivo
 *
 * SPEC-049 Camada 5: bias deterministic via clube + parents.
 */

import { INHERITABLE_TRAITS, MYTH_SLOTS } from './MythService';

const SLOT_BIAS = Object.freeze({
    idoloEterno: { garra: +10, talento_natural: +15, lealdade: +20, frieza: +5 },
    carrasco: { garra: +15, talento_natural: +5, lealdade: 0, frieza: +20 },
    goleirao: { garra: +10, talento_natural: +10, lealdade: +5, frieza: +25 },
    criaDaBase: { garra: +5, talento_natural: +15, lealdade: +30, frieza: +5 },
    traidor: { garra: 0, talento_natural: +5, lealdade: -25, frieza: 0 },
    lendaTragica: { garra: +20, talento_natural: +10, lealdade: +15, frieza: -10 }
});

const PARENT_INHERITANCE_RATIO = 0.4; // 40% do parent
const HALL_INFLUENCE_RATIO = 0.15; // 15% do hall total

function clamp(v) {
    return Math.max(0, Math.min(100, v));
}

export class InheritanceService {
    constructor({ mythService = null } = {}) {
        this._mythService = mythService;
    }

    /**
     * Initialize default traits para regen sem parents.
     * Random baseline 30-70.
     */
    initializeBaseTraits(rng = Math.random) {
        const traits = {};
        for (const t of INHERITABLE_TRAITS) {
            traits[t] = 30 + Math.floor(rng() * 40);
        }
        return traits;
    }

    /**
     * Apply hall bias from a club's Hall de Lendas.
     * Cada slot preenchido contribui via SLOT_BIAS table * HALL_INFLUENCE_RATIO.
     */
    applyHallBias(traits, save, clubId) {
        if (!this._mythService || !clubId) return traits;
        const hall = this._mythService.getHallOfFame(save, clubId);

        const result = { ...traits };
        for (const slot of MYTH_SLOTS) {
            if (hall[slot] != null) {
                const bias = SLOT_BIAS[slot] || {};
                for (const trait of INHERITABLE_TRAITS) {
                    const delta = (bias[trait] || 0) * HALL_INFLUENCE_RATIO;
                    result[trait] = clamp((result[trait] || 50) + delta);
                }
            }
        }
        return result;
    }

    /**
     * Apply parent inheritance: averages parent traits with PARENT_INHERITANCE_RATIO weight.
     * Parents = array of player objects with .traits.
     */
    applyParentInheritance(traits, parents = []) {
        if (parents.length === 0) return traits;

        const parentAvg = {};
        for (const t of INHERITABLE_TRAITS) {
            const sum = parents.reduce((acc, p) => acc + (p.traits?.[t] ?? 50), 0);
            parentAvg[t] = sum / parents.length;
        }

        const result = {};
        for (const t of INHERITABLE_TRAITS) {
            // Mix: own traits * (1-ratio) + parent avg * ratio
            const own = traits[t] ?? 50;
            const parent = parentAvg[t];
            result[t] = clamp(own * (1 - PARENT_INHERITANCE_RATIO) + parent * PARENT_INHERITANCE_RATIO);
        }
        return result;
    }

    /**
     * Full pipeline: initialize → hall bias → parent inheritance.
     */
    generateInheritedTraits(save, clubId, parents = [], rng = Math.random) {
        let traits = this.initializeBaseTraits(rng);
        traits = this.applyHallBias(traits, save, clubId);
        traits = this.applyParentInheritance(traits, parents);
        // Round to integer
        const final = {};
        for (const t of INHERITABLE_TRAITS) {
            final[t] = Math.round(traits[t]);
        }
        return final;
    }

    /**
     * Returns dominant trait in a player (highest value).
     * Useful pra manchetes "garoto tem X de [ídolo]".
     */
    getDominantTrait(traits) {
        if (!traits) return null;
        let max = -1;
        let dominant = null;
        for (const t of INHERITABLE_TRAITS) {
            if ((traits[t] || 0) > max) {
                max = traits[t];
                dominant = t;
            }
        }
        return { trait: dominant, value: max };
    }

    /**
     * Compares regen traits vs hall slot's typical bias.
     * Returns slot whose bias most resembles the regen (manchete generation).
     */
    findClosestHallMatch(traits, save, clubId) {
        if (!this._mythService) return null;
        const hall = this._mythService.getHallOfFame(save, clubId);

        let bestMatch = null;
        let bestScore = -Infinity;
        for (const slot of MYTH_SLOTS) {
            if (hall[slot] == null) continue;
            const bias = SLOT_BIAS[slot] || {};
            // Score = sum of (regen trait × slot bias) (positive correlation)
            let score = 0;
            for (const t of INHERITABLE_TRAITS) {
                score += (traits[t] || 0) * (bias[t] || 0);
            }
            if (score > bestScore) {
                bestScore = score;
                bestMatch = { slot, playerId: hall[slot], score };
            }
        }
        return bestMatch;
    }
}
