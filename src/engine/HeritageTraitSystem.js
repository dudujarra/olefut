/**
 * HeritageTraitSystem — SPEC-079: Traits Herdáveis de Lendas
 *
 * Regens herdam traits do Hall de Lendas do clube onde emergem.
 * Continuidade narrativa: DNA de ídolos ressurge em jovens talentos.
 *
 * Stateless: recebe hall, retorna traits gerados.
 */

const INHERITABLE_TRAITS = ['garra', 'talento_natural', 'lealdade', 'frieza'];
const TRAIT_FLOOR = 0;
const TRAIT_CAP   = 100;

/**
 * Gera traits herdáveis para um regen baseado no Hall de Lendas.
 *
 * @param {object} opts
 * @param {number} opts.clubId
 * @param {object} opts.hall — resultado de HallOfLegendsSystem.compute()
 * @param {number} [opts.baseChance=0.6] — chance de herdar de um slot preenchido
 * @param {number} [opts.seed] — seed para determinismo
 * @returns {{ traits: object, inheritedFrom: Array<string>, inheritanceNarrative: string }}
 */
export function inherit({ clubId, hall, baseChance = 0.6, seed = null } = {}) {
    const rand = seed !== null ? seededRandom(seed) : Math.random;
    const slots = hall?.slots || {};
    const filledSlots = Object.keys(slots);

    const traits = {};
    const inheritedFrom = [];

    // Each filled slot contributes to one trait
    const slotTraitMap = {
        idoloEterno:  'garra',
        goleirao:     'talento_natural',
        criaDaBase:   'lealdade',
        carrasco:     'frieza',
        lendaTragica: 'garra',   // tragic legend → determination
        traidor:      null,       // traitors don't pass traits
    };

    INHERITABLE_TRAITS.forEach(t => { traits[t] = 30; }); // base value

    for (const slot of filledSlots) {
        const traitKey = slotTraitMap[slot];
        if (!traitKey) continue;
        if (rand() < baseChance) {
            // Inherit: bump trait by 20-40 points
            const bonus = Math.floor(rand() * 20) + 20;
            traits[traitKey] = clamp(traits[traitKey] + bonus);
            inheritedFrom.push(slot);
        }
    }

    const topSlot = inheritedFrom[0];
    const legend = topSlot ? slots[topSlot]?.playerName : null;
    const inheritanceNarrative = legend
        ? `Tem o espírito de ${legend} — a torcida sente desde o primeiro treino.`
        : 'Chega sem história, mas com potencial para criar a sua.';

    return { traits, inheritedFrom, inheritanceNarrative };
}

// ─── helpers ────────────────────────────────────────────────

function clamp(v) {
    return Math.max(TRAIT_FLOOR, Math.min(TRAIT_CAP, v));
}

function seededRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}
