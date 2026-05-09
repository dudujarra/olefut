/**
 * FormationLayout18 — SPEC-080
 *
 * Mapping 11 slots × formação → códigos BR 18-pos.
 * Complementa FormationLayout.js (role macro), adiciona role18 per slot.
 */

export const FORMATION_LAYOUTS_18 = {
    '4-3-3': [
        'GOL',                          // 0 - Goleiro
        'LAE', 'ZAE', 'ZAD', 'LAD',     // 1-4 - Defesa
        'VOL', 'MEC', 'MEA',            // 5-7 - Meio
        'POE', 'CTA', 'POD'             // 8-10 - Ataque
    ],
    '4-4-2': [
        'GOL',
        'LAE', 'ZAE', 'ZAD', 'LAD',
        'MPE', 'MCE', 'MCD', 'MPD',
        'CTA', 'CTA'                    // 2 atacantes
    ],
    '4-2-4': [
        'GOL',
        'LAE', 'ZAE', 'ZAD', 'LAD',
        'VOL', 'VOL',
        'POE', 'CTA', 'CTA', 'POD'
    ],
    '3-5-2': [
        'GOL',
        'ZAE', 'ZAG', 'ZAD',
        'ALE', 'VOL', 'MEA', 'MCD', 'ALD',
        'CTA', 'CTA'
    ],
    '5-3-2': [
        'GOL',
        'LAE', 'ZAE', 'ZAG', 'ZAD', 'LAD',
        'VOL', 'MEC', 'MEA',
        'CTA', 'CTA'
    ],
    '4-2-3-1': [
        'GOL',
        'LAE', 'ZAE', 'ZAD', 'LAD',
        'VOL', 'VOL',
        'POE', 'MEA', 'POD',
        'CTA'
    ],
    '4-1-4-1': [
        'GOL',
        'LAE', 'ZAE', 'ZAD', 'LAD',
        'VOL',
        'MPE', 'MCE', 'MCD', 'MPD',
        'CTA'
    ],
    '3-4-3': [
        'GOL',
        'ZAE', 'ZAG', 'ZAD',
        'ALE', 'MCE', 'MCD', 'ALD',
        'POE', 'CTA', 'POD'
    ],
    '5-4-1': [
        'GOL',
        'LAE', 'ZAE', 'ZAG', 'ZAD', 'LAD',
        'MPE', 'MCE', 'MCD', 'MPD',
        'CTA'
    ]
};

/**
 * Get 18-position code for a slot in a formation.
 */
export function getSlot18Position(formationId, slotIdx) {
    const layout = FORMATION_LAYOUTS_18[formationId] || FORMATION_LAYOUTS_18['4-3-3'];
    return layout[slotIdx] || 'MEC';
}

/**
 * Get all 18-pos slots for a formation as array of {slot, code}.
 */
export function getFormationSlots18(formationId) {
    const layout = FORMATION_LAYOUTS_18[formationId] || FORMATION_LAYOUTS_18['4-3-3'];
    return layout.map((code, slot) => ({ slot, code }));
}

export const FORMATION_18_KEYS = Object.keys(FORMATION_LAYOUTS_18);
