/**
 * FormationLayout — Presets posicionais por formação + utilities offsets
 * Coordenadas normalizadas [0,1]:
 *  - x: 0 (esquerda) → 1 (direita)
 *  - y: 0 (topo, ataque) → 1 (fundo, gol nosso)
 *
 * Engine usa offsets pra ajustar sectors:
 *  - DEF avançado (y < 0.6) → +5% midfield, -3% defense
 *  - ATA recuado (y > 0.55) → +4% midfield, -5% finalização
 */

export const FORMATION_PRESETS = {
    '4-3-3': [
        { slot: 0, role: 'GOL', x: 0.5, y: 0.92 },
        { slot: 1, role: 'DEF', x: 0.15, y: 0.72 },  // LE
        { slot: 2, role: 'DEF', x: 0.38, y: 0.74 },
        { slot: 3, role: 'DEF', x: 0.62, y: 0.74 },
        { slot: 4, role: 'DEF', x: 0.85, y: 0.72 },  // LD
        { slot: 5, role: 'MEI', x: 0.25, y: 0.50 },
        { slot: 6, role: 'MEI', x: 0.50, y: 0.55 },
        { slot: 7, role: 'MEI', x: 0.75, y: 0.50 },
        { slot: 8, role: 'ATA', x: 0.20, y: 0.22 },
        { slot: 9, role: 'ATA', x: 0.50, y: 0.18 },
        { slot: 10, role: 'ATA', x: 0.80, y: 0.22 }
    ],
    '4-4-2': [
        { slot: 0, role: 'GOL', x: 0.5, y: 0.92 },
        { slot: 1, role: 'DEF', x: 0.15, y: 0.72 },
        { slot: 2, role: 'DEF', x: 0.38, y: 0.74 },
        { slot: 3, role: 'DEF', x: 0.62, y: 0.74 },
        { slot: 4, role: 'DEF', x: 0.85, y: 0.72 },
        { slot: 5, role: 'MEI', x: 0.18, y: 0.48 },
        { slot: 6, role: 'MEI', x: 0.40, y: 0.50 },
        { slot: 7, role: 'MEI', x: 0.60, y: 0.50 },
        { slot: 8, role: 'MEI', x: 0.82, y: 0.48 },
        { slot: 9, role: 'ATA', x: 0.38, y: 0.20 },
        { slot: 10, role: 'ATA', x: 0.62, y: 0.20 }
    ],
    '4-2-4': [
        { slot: 0, role: 'GOL', x: 0.5, y: 0.92 },
        { slot: 1, role: 'DEF', x: 0.15, y: 0.72 },
        { slot: 2, role: 'DEF', x: 0.38, y: 0.74 },
        { slot: 3, role: 'DEF', x: 0.62, y: 0.74 },
        { slot: 4, role: 'DEF', x: 0.85, y: 0.72 },
        { slot: 5, role: 'MEI', x: 0.35, y: 0.50 },
        { slot: 6, role: 'MEI', x: 0.65, y: 0.50 },
        { slot: 7, role: 'ATA', x: 0.15, y: 0.25 },
        { slot: 8, role: 'ATA', x: 0.40, y: 0.20 },
        { slot: 9, role: 'ATA', x: 0.60, y: 0.20 },
        { slot: 10, role: 'ATA', x: 0.85, y: 0.25 }
    ],
    '3-5-2': [
        { slot: 0, role: 'GOL', x: 0.5, y: 0.92 },
        { slot: 1, role: 'DEF', x: 0.25, y: 0.74 },
        { slot: 2, role: 'DEF', x: 0.50, y: 0.78 },
        { slot: 3, role: 'DEF', x: 0.75, y: 0.74 },
        { slot: 4, role: 'MEI', x: 0.10, y: 0.50 },  // ala esq
        { slot: 5, role: 'MEI', x: 0.30, y: 0.50 },
        { slot: 6, role: 'MEI', x: 0.50, y: 0.55 },
        { slot: 7, role: 'MEI', x: 0.70, y: 0.50 },
        { slot: 8, role: 'MEI', x: 0.90, y: 0.50 },  // ala dir
        { slot: 9, role: 'ATA', x: 0.40, y: 0.20 },
        { slot: 10, role: 'ATA', x: 0.60, y: 0.20 }
    ],
    '5-3-2': [
        { slot: 0, role: 'GOL', x: 0.5, y: 0.92 },
        { slot: 1, role: 'DEF', x: 0.10, y: 0.72 },
        { slot: 2, role: 'DEF', x: 0.30, y: 0.78 },
        { slot: 3, role: 'DEF', x: 0.50, y: 0.80 },
        { slot: 4, role: 'DEF', x: 0.70, y: 0.78 },
        { slot: 5, role: 'DEF', x: 0.90, y: 0.72 },
        { slot: 6, role: 'MEI', x: 0.30, y: 0.52 },
        { slot: 7, role: 'MEI', x: 0.50, y: 0.55 },
        { slot: 8, role: 'MEI', x: 0.70, y: 0.52 },
        { slot: 9, role: 'ATA', x: 0.40, y: 0.22 },
        { slot: 10, role: 'ATA', x: 0.60, y: 0.22 }
    ]
};

export function getPreset(formationId) {
    return FORMATION_PRESETS[formationId] || FORMATION_PRESETS['4-3-3'];
}

/**
 * Compute role offset bonuses based on layout deviation from preset
 * @param {object} layout - { [slot]: {playerId, x, y} }
 * @param {string} formationId
 * @returns {{midBoost, defPenalty, finPenalty}}
 */
export function computeOffsets(layout, formationId) {
    if (!layout) return { midBoost: 0, defPenalty: 0, finPenalty: 0 };
    const preset = getPreset(formationId);
    let midBoost = 0;
    let defPenalty = 0;
    let finPenalty = 0;

    Object.entries(layout).forEach(([slotIdx, pos]) => {
        const presetPos = preset.find(p => p.slot === Number(slotIdx));
        if (!presetPos) return;
        const yDelta = pos.y - presetPos.y; // positive = mais recuado, negative = mais avançado
        if (presetPos.role === 'DEF' && yDelta < -0.1) {
            // DEF avançado
            midBoost += 0.05;
            defPenalty += 0.03;
        } else if (presetPos.role === 'ATA' && yDelta > 0.1) {
            // ATA recuado
            midBoost += 0.04;
            finPenalty += 0.05;
        } else if (presetPos.role === 'MEI' && yDelta < -0.15) {
            // MEI avançado pra ataque
            finPenalty -= 0.02; // bonus finalização
        }
    });

    return { midBoost, defPenalty, finPenalty };
}

export const FORMATION_KEYS = Object.keys(FORMATION_PRESETS);
