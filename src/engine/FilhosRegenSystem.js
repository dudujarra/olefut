import { rng as systemRng } from './rng.js';
/**
 * FilhosRegenSystem — SPEC-081: Regens-Filhos de Ex-Companheiros
 *
 * 16-18 anos após o auge de ex-companheiro, emerge regen com linhagem nomeada.
 * Escassez intencional: 1 a cada 3-4 seasons.
 * Cria continuidade temporal — save tem memória.
 *
 * Stateless: recebe contexto, retorna regen se condições satisfeitas.
 */

const SPAWN_CHANCE = 0.25; // 25% chance per check (~1 per 4 seasons)
const LEGACY_DELAY_YEARS = 16; // emerge 16-18 years after companion's prime

/**
 * Verifica se um Filho Regen deve emergir nesta season.
 *
 * @param {object} opts
 * @param {number} opts.managerId
 * @param {number} opts.saveYear — ano atual do save
 * @param {number} opts.season
 * @param {Array<{playerId,name,primeYear,position,ovr,traits}>} opts.formerCompanions
 * @param {number} [opts.seed]
 * @returns {{ regenAvailable, regen? }}
 */
export function evaluate({ managerId = 0, saveYear = 2030, season = 1, formerCompanions = [], seed = null } = {}) {
    const rand = seed !== null ? seededRandom(seed) : systemRng;

    // Check every 4 seasons at earliest
    if (season < 4 || season % 4 !== 0) return { regenAvailable: false };

    const eligible = formerCompanions.filter(c => {
        const elapsed = saveYear - (c.primeYear || saveYear - 20);
        return elapsed >= LEGACY_DELAY_YEARS - 2 && elapsed <= LEGACY_DELAY_YEARS + 2;
    });

    if (eligible.length === 0 || rand() > SPAWN_CHANCE) return { regenAvailable: false };

    const parent = eligible[Math.floor(rand() * eligible.length)];
    const regen = buildRegen(parent, rand);

    return { regenAvailable: true, regen };
}

// ─── helpers ────────────────────────────────────────────────

function buildRegen(parent, rand) {
    const nameParts = parent.name.split(' ');
    const surname = nameParts[nameParts.length - 1];
    const firstNames = ['Mateus', 'Lucas', 'Rafael', 'João', 'Pedro', 'Caio', 'Felipe'];
    const firstName = firstNames[Math.floor(rand() * firstNames.length)];

    const ovrBase = Math.max(50, (parent.ovr || 65) - 15 + Math.floor(rand() * 20));

    return {
        id: `regen-${parent.playerId}-${Date.now()}`,
        name: `${firstName} ${surname}`,
        parentId: parent.playerId,
        parentName: parent.name,
        position: parent.position || 'MEI',
        age: 16 + Math.floor(rand() * 3),
        ovr: ovrBase,
        inheritedTraits: parent.traits || [],
        loreDescription: `Filho de ${parent.name}. A mesma posição. O mesmo sobrenome. A torcida vai comparar.`,
    };
}

function seededRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}
