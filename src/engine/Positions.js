/**
 * Positions.js — SPEC-080
 *
 * 18 posições granulares ELIFOOT (BR Portuguese + FIFA codes).
 * Cobre todo futebol moderno: 1 GK + 7 DEF + 7 MID + 3 ATA.
 */

export const POSITIONS = {
    // Goalkeeper (1)
    GK: {
        code: 'GK',
        name: 'Goleiro',
        nameEn: 'Goalkeeper',
        macro: 'GOL',
        family: 'GK',
        side: 'C',
        line: 0
    },

    // Defenders (7)
    CB: {
        code: 'CB',
        name: 'Zagueiro Central',
        nameEn: 'Center Back',
        macro: 'DEF',
        family: 'CB',
        side: 'C',
        line: 1
    },
    CBR: {
        code: 'CBR',
        name: 'Zagueiro Direito',
        nameEn: 'Right Center Back',
        macro: 'DEF',
        family: 'CB',
        side: 'R',
        line: 1
    },
    CBL: {
        code: 'CBL',
        name: 'Zagueiro Esquerdo',
        nameEn: 'Left Center Back',
        macro: 'DEF',
        family: 'CB',
        side: 'L',
        line: 1
    },
    RB: {
        code: 'RB',
        name: 'Lateral Direito',
        nameEn: 'Right Back',
        macro: 'DEF',
        family: 'FB',
        side: 'R',
        line: 1
    },
    LB: {
        code: 'LB',
        name: 'Lateral Esquerdo',
        nameEn: 'Left Back',
        macro: 'DEF',
        family: 'FB',
        side: 'L',
        line: 1
    },
    RWB: {
        code: 'RWB',
        name: 'Ala Direito',
        nameEn: 'Right Wing-Back',
        macro: 'DEF',
        family: 'WB',
        side: 'R',
        line: 2
    },
    LWB: {
        code: 'LWB',
        name: 'Ala Esquerdo',
        nameEn: 'Left Wing-Back',
        macro: 'DEF',
        family: 'WB',
        side: 'L',
        line: 2
    },

    // Midfielders (7)
    DM: {
        code: 'DM',
        name: 'Volante',
        nameEn: 'Defensive Midfielder',
        macro: 'MEI',
        family: 'DM',
        side: 'C',
        line: 2
    },
    CM: {
        code: 'CM',
        name: 'Meia Centro',
        nameEn: 'Central Midfielder',
        macro: 'MEI',
        family: 'CM',
        side: 'C',
        line: 3
    },
    CMR: {
        code: 'CMR',
        name: 'Meia Direita',
        nameEn: 'Right Central Midfielder',
        macro: 'MEI',
        family: 'CM',
        side: 'R',
        line: 3
    },
    CML: {
        code: 'CML',
        name: 'Meia Esquerda',
        nameEn: 'Left Central Midfielder',
        macro: 'MEI',
        family: 'CM',
        side: 'L',
        line: 3
    },
    AM: {
        code: 'AM',
        name: 'Meia Atacante',
        nameEn: 'Attacking Midfielder',
        macro: 'MEI',
        family: 'AM',
        side: 'C',
        line: 4
    },
    RM: {
        code: 'RM',
        name: 'Meia Direita Avançada',
        nameEn: 'Right Midfielder',
        macro: 'MEI',
        family: 'WM',
        side: 'R',
        line: 4
    },
    LM: {
        code: 'LM',
        name: 'Meia Esquerda Avançada',
        nameEn: 'Left Midfielder',
        macro: 'MEI',
        family: 'WM',
        side: 'L',
        line: 4
    },

    // Forwards (3)
    RW: {
        code: 'RW',
        name: 'Ponta Direita',
        nameEn: 'Right Winger',
        macro: 'ATA',
        family: 'WG',
        side: 'R',
        line: 5
    },
    LW: {
        code: 'LW',
        name: 'Ponta Esquerda',
        nameEn: 'Left Winger',
        macro: 'ATA',
        family: 'WG',
        side: 'L',
        line: 5
    },
    CF: {
        code: 'CF',
        name: 'Centroavante',
        nameEn: 'Center Forward',
        macro: 'ATA',
        family: 'FW',
        side: 'C',
        line: 6
    }
};

export const ALL_POSITION_CODES = Object.keys(POSITIONS);

// Position families (for fit calculations)
export const POSITION_FAMILIES = {
    GK: ['GK'],
    CB: ['CB', 'CBR', 'CBL'],
    FB: ['LB', 'RB'],
    WB: ['LWB', 'RWB'],
    DM: ['DM'],
    CM: ['CM', 'CMR', 'CML'],
    AM: ['AM'],
    WM: ['LM', 'RM'],
    WG: ['LW', 'RW'],
    FW: ['CF']
};

// Adjacent families (60% fit when player plays in adjacent)
export const ADJACENT_FAMILIES = {
    GK: ['CB'],
    CB: ['GK', 'FB', 'DM'],
    FB: ['CB', 'WB', 'WM'],
    WB: ['FB', 'WM', 'WG'],
    DM: ['CB', 'CM'],
    CM: ['DM', 'AM', 'WM'],
    AM: ['CM', 'FW', 'WG'],
    WM: ['CM', 'WB', 'WG'],
    WG: ['WM', 'WB', 'AM', 'FW'],
    FW: ['AM', 'WG']
};

// Position-Attribute Relevance Matrix (0-3 per attribute)
export const POSITION_ATTR_WEIGHTS = {
    GK:  { ATA: 0, TEC: 1, TAC: 3, DEF: 3, CRI: 0 },
    CB:  { ATA: 0, TEC: 1, TAC: 3, DEF: 3, CRI: 1 },
    CBR: { ATA: 0, TEC: 1, TAC: 3, DEF: 3, CRI: 1 },
    CBL: { ATA: 0, TEC: 1, TAC: 3, DEF: 3, CRI: 1 },
    RB:  { ATA: 1, TEC: 2, TAC: 3, DEF: 2, CRI: 2 },
    LB:  { ATA: 1, TEC: 2, TAC: 3, DEF: 2, CRI: 2 },
    RWB: { ATA: 2, TEC: 2, TAC: 2, DEF: 1, CRI: 2 },
    LWB: { ATA: 2, TEC: 2, TAC: 2, DEF: 1, CRI: 2 },
    DM:  { ATA: 0, TEC: 2, TAC: 3, DEF: 3, CRI: 2 },
    CM:  { ATA: 1, TEC: 3, TAC: 3, DEF: 2, CRI: 2 },
    CMR: { ATA: 1, TEC: 3, TAC: 3, DEF: 2, CRI: 2 },
    CML: { ATA: 1, TEC: 3, TAC: 3, DEF: 2, CRI: 2 },
    AM:  { ATA: 3, TEC: 3, TAC: 3, DEF: 0, CRI: 3 },
    RM:  { ATA: 2, TEC: 2, TAC: 2, DEF: 2, CRI: 2 },
    LM:  { ATA: 2, TEC: 2, TAC: 2, DEF: 2, CRI: 2 },
    RW:  { ATA: 3, TEC: 3, TAC: 2, DEF: 1, CRI: 2 },
    LW:  { ATA: 3, TEC: 3, TAC: 2, DEF: 1, CRI: 2 },
    CF:  { ATA: 3, TEC: 2, TAC: 2, DEF: 0, CRI: 1 }
};

/**
 * Get family of a position.
 */
export function getFamily(positionCode) {
    return POSITIONS[positionCode]?.family || null;
}

/**
 * Calculate fit (0.3 - 1.0) of a player playing position X.
 */
export function calculatePositionFit(playerNaturalPos, requiredPos) {
    if (!playerNaturalPos || !requiredPos) return 0.3;
    if (playerNaturalPos === requiredPos) return 1.0;

    const naturalFamily = getFamily(playerNaturalPos);
    const requiredFamily = getFamily(requiredPos);
    if (!naturalFamily || !requiredFamily) return 0.3;

    if (naturalFamily === requiredFamily) return 0.85;

    const adjacents = ADJACENT_FAMILIES[naturalFamily] || [];
    if (adjacents.includes(requiredFamily)) return 0.6;

    return 0.3;
}

/**
 * Calculate rating 0-100 for a player playing a specific position.
 * Uses pentagon attrs (attacking, technical, tactical, defending, creativity).
 */
export function calculateRatingForPosition(player, positionCode) {
    const weights = POSITION_ATTR_WEIGHTS[positionCode];
    if (!weights || !player) return 0;

    const atk = player.attacking ?? 50;
    const tec = player.technical ?? 50;
    const tac = player.tactical ?? 50;
    const def = player.defending ?? 50;
    const cri = player.creativity ?? 50;

    const totalWeights = weights.ATA + weights.TEC + weights.TAC + weights.DEF + weights.CRI;
    if (totalWeights === 0) return 50;

    const weightedSum = (
        atk * weights.ATA +
        tec * weights.TEC +
        tac * weights.TAC +
        def * weights.DEF +
        cri * weights.CRI
    );

    return Math.round(weightedSum / totalWeights);
}

/**
 * Calculate effective rating considering position fit.
 */
export function calculateEffectiveRating(player, requiredPos) {
    const baseRating = calculateRatingForPosition(player, requiredPos);
    const fit = calculatePositionFit(player.naturalPosition, requiredPos);
    return Math.round(baseRating * fit);
}

/**
 * Get macro position (legacy compat: GOL/DEF/MEI/ATA).
 */
export function getMacroPosition(positionCode) {
    return POSITIONS[positionCode]?.macro || 'MEI';
}

/**
 * Migrate legacy 4-position to granular 18.
 */
export function migrateLegacyPosition(legacyPos, attrs = {}) {
    switch (legacyPos) {
        case 'GOL':
        case 'GK':
            return 'GK';
        case 'DEF':
        case 'ZAG':
            // Random sub-pos based on attrs
            if ((attrs.def ?? 50) >= 75) {
                return ['CB', 'CBR', 'CBL'][Math.floor(Math.random() * 3)];
            }
            return ['RB', 'LB'][Math.floor(Math.random() * 2)];
        case 'LAT':
            return Math.random() < 0.5 ? 'RB' : 'LB';
        case 'MEI':
        case 'VOL':
            const r = Math.random();
            if (legacyPos === 'VOL' || (attrs.def ?? 50) > (attrs.atk ?? 50)) return 'DM';
            if (r < 0.3) return 'CM';
            if (r < 0.5) return 'AM';
            if (r < 0.7) return 'RM';
            return 'LM';
        case 'ATA':
            const ra = Math.random();
            if (ra < 0.4) return 'CF';
            if (ra < 0.7) return 'RW';
            return 'LW';
        case 'PON':
            return Math.random() < 0.5 ? 'RW' : 'LW';
        default:
            return 'CM';
    }
}

/**
 * SofaScore code → ELIFOOT 18-position map.
 */
export const SOFASCORE_TO_ELIFOOT = {
    'G': 'GK',
    'GK': 'GK',
    'D': 'CB',
    'DC': 'CB',
    'DCR': 'CBR',
    'DCL': 'CBL',
    'DR': 'RB',
    'DL': 'LB',
    'DMR': 'RWB',
    'DML': 'LWB',
    'WBR': 'RWB',
    'WBL': 'LWB',
    'M': 'CM',
    'MC': 'CM',
    'MCR': 'CMR',
    'MCL': 'CML',
    'DMC': 'DM',
    'DM': 'DM',
    'MR': 'RM',
    'ML': 'LM',
    'AMC': 'AM',
    'AM': 'AM',
    'AMR': 'RW',
    'AML': 'LW',
    'F': 'CF',
    'FW': 'CF',
    'ST': 'CF',
    'CF': 'CF',
    'LW': 'LW',
    'RW': 'RW',
    'LWF': 'LW',
    'RWF': 'RW'
};

export function mapSofaScorePosition(sofaScoreCode) {
    return SOFASCORE_TO_ELIFOOT[sofaScoreCode] || 'CM';
}
