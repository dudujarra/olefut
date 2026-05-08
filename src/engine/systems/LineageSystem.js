/**
 * LineageSystem — SPEC-075 Sprint O
 *
 * NG+ across saves: filhos-regens 16-18 anos pós-aposentadoria parent.
 * Prestige bonus carry-over.
 */

const LINEAGE_KEY = 'elifoot_lineage';

export function readLineage() {
    try {
        const raw = localStorage.getItem(LINEAGE_KEY);
        return raw ? JSON.parse(raw) : { dynasties: [] };
    } catch {
        return { dynasties: [] };
    }
}

export function saveLineage(data) {
    try {
        localStorage.setItem(LINEAGE_KEY, JSON.stringify(data));
        return true;
    } catch {
        return false;
    }
}

/**
 * Save a retired player as ancestor of new dynasty.
 */
export function recordAncestor(player, achievements = []) {
    const data = readLineage();
    const dynasty = {
        id: `dyn_${Date.now()}`,
        ancestor: {
            name: player.name,
            position: player.position,
            personality: player.personality,
            careerGoals: player.career?.totalGoals || 0,
            careerMatches: player.career?.totalMatches || 0,
            achievements,
            retiredAt: new Date().toISOString()
        },
        descendants: []
    };
    data.dynasties.push(dynasty);
    saveLineage(data);
    return dynasty.id;
}

/**
 * Generate descendant 16 anos depois.
 * Inherits 30% of ancestor attrs.
 */
export function generateDescendant(dynastyId, currentYear = 2026) {
    const data = readLineage();
    const dynasty = data.dynasties.find(d => d.id === dynastyId);
    if (!dynasty) return null;

    const ancestor = dynasty.ancestor;
    const descendant = {
        id: `desc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: ancestor.name.split(' ')[0] + ' ' + (ancestor.name.split(' ').slice(-1)[0] + ' Jr.'),
        position: Math.random() < 0.6 ? ancestor.position : pickRandomPosition(),
        age: 16 + Math.floor(Math.random() * 3),
        bornYear: currentYear,
        ancestorName: ancestor.name,
        ancestorAchievements: ancestor.achievements,
        attrs: {
            // Inherit 30% of ancestor performance + variance
            atk: Math.min(99, Math.max(40, 50 + Math.floor((ancestor.careerGoals / 50) * 10) + Math.random() * 20 - 10)),
            def: 50 + Math.floor(Math.random() * 30),
            mid: 50 + Math.floor(Math.random() * 30)
        },
        potential: 70 + Math.floor(Math.random() * 25),
        traits: Math.random() < 0.4 ? ['filho_de_lenda'] : [],
        prestige_bonus: Math.min(50, Math.floor(ancestor.careerGoals / 5))
    };

    dynasty.descendants.push(descendant);
    saveLineage(data);
    return descendant;
}

function pickRandomPosition() {
    const positions = ['GOL', 'DEF', 'MEI', 'ATA'];
    return positions[Math.floor(Math.random() * positions.length)];
}

/**
 * Get NG+ bonuses based on saved dynasties.
 */
export function getNGPlusBonuses() {
    const data = readLineage();
    const totalAncestors = data.dynasties.length;
    const totalAchievements = data.dynasties.reduce((s, d) => s + (d.ancestor.achievements?.length || 0), 0);

    return {
        startingMoney: totalAncestors * 50000, // R$ 50k per dynasty
        startingPrestige: totalAchievements * 5,
        unlockSpecialTrait: totalAncestors >= 3, // 3 dynasties unlock "Filho de Lenda"
        descendantsAvailable: data.dynasties.flatMap(d => d.descendants)
    };
}

/**
 * Reset lineage (debug / fresh start).
 */
export function resetLineage() {
    try {
        localStorage.removeItem(LINEAGE_KEY);
        return true;
    } catch {
        return false;
    }
}
