/**
 * MythService — Camada 5 (Mito) Hall de Lendas
 *
 * AKITA-RFCT-005: skeleton + read methods stateless.
 * SPEC-049 Camada 5: 6 slots por clube + 4 traits herdáveis.
 *
 * Slots: idoloEterno, carrasco, goleirao, criaDaBase, traidor, lendaTragica
 * Traits: garra, talento_natural, lealdade, frieza (0-100)
 *
 * Princípio 4: stateless. Recebe `engine` ou `save` como contexto.
 */

export const MYTH_SLOTS = Object.freeze([
    'idoloEterno',
    'carrasco',
    'goleirao',
    'criaDaBase',
    'traidor',
    'lendaTragica'
]);

export const INHERITABLE_TRAITS = Object.freeze([
    'garra',
    'talento_natural',
    'lealdade',
    'frieza'
]);

export class MythService {
    constructor() {
        // Stateless — sem instance state
    }

    /**
     * Returns array de jogadores canonizados (cross-club legends).
     * Em v1.0.5 baseline: pulls from engine.legacy?.titles + player career stats.
     *
     * @param {Engine|object} engineOrSave
     * @returns {Array} legends array (vazio em v1.0.5, populado em v1.1)
     */
    getLegends(engineOrSave) {
        if (!engineOrSave) return [];
        // Future v1.1: walk engine.teams[*].squad[*] + filter career.totals > thresholds
        // Por agora retorna empty (placeholder semantics)
        const myth = engineOrSave.myth || engineOrSave;
        if (Array.isArray(myth?.legends)) return [...myth.legends];
        return [];
    }

    /**
     * Returns hall of fame de um clube específico.
     * Schema esperado v1.1: { idoloEterno: playerId, carrasco: playerId, ... }
     *
     * @param {Engine|object} engineOrSave
     * @param {number|string} clubId
     * @returns {object} { [slot]: playerId|null }
     */
    getHallOfFame(engineOrSave, clubId) {
        if (!engineOrSave || clubId == null) return this._emptyHall();
        const halls = engineOrSave.myth?.halls || engineOrSave.halls || {};
        const clubHall = halls[clubId];
        if (!clubHall || typeof clubHall !== 'object') return this._emptyHall();
        // Garantir todos os 6 slots presentes (null se vazio)
        const result = this._emptyHall();
        for (const slot of MYTH_SLOTS) {
            result[slot] = clubHall[slot] ?? null;
        }
        return result;
    }

    /**
     * Returns regen-children de ex-companheiros (v1.3 placeholder).
     *
     * @param {Engine|object} engineOrSave
     * @returns {Array} regenLineage entries
     */
    getRegenChildren(engineOrSave) {
        if (!engineOrSave) return [];
        if (Array.isArray(engineOrSave.regenLineage)) return [...engineOrSave.regenLineage];
        if (Array.isArray(engineOrSave.myth?.regenLineage)) return [...engineOrSave.myth.regenLineage];
        return [];
    }

    /**
     * Helper: returns canonized status of a player (boolean).
     * Cross-checks legends array.
     */
    isCanonized(engineOrSave, playerId) {
        const legends = this.getLegends(engineOrSave);
        return legends.some(l => l.playerId === playerId || l.id === playerId);
    }

    /**
     * Helper: count slots filled in a club's hall (0-6).
     */
    countHallSlots(engineOrSave, clubId) {
        const hall = this.getHallOfFame(engineOrSave, clubId);
        return MYTH_SLOTS.filter(slot => hall[slot] != null).length;
    }

    // ========================================================================
    // WRITES — placeholders (preenchidos em AKITA-RFCT-007)
    // ========================================================================

    /**
     * @placeholder AKITA-RFCT-007
     */
    addLegend(engineOrSave, playerId, slot) {
        // To be implemented in RFCT-007
    }

    /**
     * @placeholder AKITA-RFCT-007
     */
    promoteToHallOfFame(engineOrSave, playerId, clubId, slot) {
        // To be implemented in RFCT-007
    }

    /**
     * @placeholder v1.3 (AKITA-054)
     */
    generateRegenChild(engineOrSave, parentPlayerId) {
        // To be implemented in v1.3
    }

    // ========================================================================
    // PRIVATES
    // ========================================================================

    _emptyHall() {
        const hall = {};
        for (const slot of MYTH_SLOTS) {
            hall[slot] = null;
        }
        return hall;
    }
}
