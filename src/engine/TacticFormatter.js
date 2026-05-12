/**
 * TacticFormatter — SPEC-B5
 *
 * Helpers PURE pra formatar modifiers táticos para UI.
 * Zero React/DOM. Determinístico.
 */

import { TACTICS } from './ManagerSystems.js';

/**
 * Retorna string formatada "ATA ×N.NN / DEF ×N.NN" para uma tática.
 *
 * @param {string} tacticKey
 * @returns {string}
 */
export function formatTacticModifiers(tacticKey) {
    const t = TACTICS[tacticKey];
    if (!t) return '';
    const ata = (t.ataModifier ?? 1.0).toFixed(2);
    const def = (t.defModifier ?? 1.0).toFixed(2);
    return `ATA ×${ata} / DEF ×${def}`;
}

/**
 * Retorna objeto separado (útil para coloração UI).
 *
 * @param {string} tacticKey
 * @returns {{ ata: string, def: string, ataValue: number, defValue: number }}
 */
export function getTacticModifierParts(tacticKey) {
    const t = TACTICS[tacticKey];
    if (!t) return { ata: '', def: '', ataValue: 1.0, defValue: 1.0 };
    const ataValue = t.ataModifier ?? 1.0;
    const defValue = t.defModifier ?? 1.0;
    return {
        ata: `×${ataValue.toFixed(2)}`,
        def: `×${defValue.toFixed(2)}`,
        ataValue,
        defValue,
    };
}
