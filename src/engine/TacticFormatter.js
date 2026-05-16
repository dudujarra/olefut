/**
 * SPEC-B5: TacticFormatter
 */

const TACTIC_MODIFIERS = {
    offensive: { ata: 1.30, def: 0.70 },
    defensive: { ata: 0.70, def: 1.30 },
    normal: { ata: 1.00, def: 1.00 },
    pressing: { ata: 1.15, def: 0.85 },
    counter: { ata: 1.20, def: 1.10 },
    possession: { ata: 1.05, def: 1.05 }
};

export function getTacticModifierParts(tacticKey) {
    const mods = TACTIC_MODIFIERS[tacticKey];
    if (!mods) {
        return { ata: '', def: '', ataValue: 1.0, defValue: 1.0 };
    }
    return {
        ataValue: mods.ata,
        defValue: mods.def,
        ata: `×${mods.ata.toFixed(2)}`,
        def: `×${mods.def.toFixed(2)}`
    };
}

export function formatTacticModifiers(tacticKey) {
    const mods = TACTIC_MODIFIERS[tacticKey];
    if (!mods) return '';
    return `ATA ×${mods.ata.toFixed(2)} / DEF ×${mods.def.toFixed(2)}`;
}
