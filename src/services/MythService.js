/**
 * MythService — Camada 5 (Mito) Hall de Lendas
 *
 * Status: SKELETON (será preenchido em AKITA-RFCT-005 a RFCT-007)
 * Stateless. Recebe `save` como contexto.
 *
 * SPEC-049: 6 slots por clube (idoloEterno, carrasco, goleirao, criaDaBase, traidor, lendaTragica).
 */

export class MythService {
    constructor() {
        // Stateless — sem instance state
    }

    /**
     * @placeholder AKITA-RFCT-005
     * Returns array de jogadores canonizados.
     */
    getLegends(save) {
        return [];
    }

    /**
     * @placeholder AKITA-RFCT-005
     * Returns hall of fame de um clube específico.
     */
    getHallOfFame(save, clubId) {
        return [];
    }

    /**
     * @placeholder AKITA-RFCT-005
     * Returns regen-children de ex-companheiros (v1.3).
     */
    getRegenChildren(save) {
        return [];
    }

    /**
     * @placeholder AKITA-RFCT-007
     * Adds player to legends list.
     */
    addLegend(save, playerId, slot) {
        // To be implemented
    }

    /**
     * @placeholder AKITA-RFCT-007
     * Promotes player to club hall of fame slot.
     */
    promoteToHallOfFame(save, playerId, clubId, slot) {
        // To be implemented
    }

    /**
     * @placeholder v1.3 (AKITA-054)
     * Generates regen child with inherited traits.
     */
    generateRegenChild(save, parentPlayerId) {
        // To be implemented
    }
}
