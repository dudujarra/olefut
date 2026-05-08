/**
 * RelationshipService — Camada 3 (Relacional)
 *
 * Status: SKELETON (preenchido em AKITA-RFCT-008 a RFCT-010)
 * Stateless.
 *
 * SPEC-049 Camada 3:
 * - v1.2: manager↔presidente (trust, patience)
 * - v1.4: club↔club (rivalry)
 * - v1.4: jogador↔torcida (love)
 *
 * Range universal: -100 a +100.
 * Recompute: a cada 7 dias-de-jogo, não em tempo real.
 */

export class RelationshipService {
    constructor() {
        // Stateless
    }

    /**
     * @placeholder AKITA-RFCT-008
     * Returns rivalry vector entre dois clubes (0-100).
     */
    getRivalry(save, clubA, clubB) {
        return 0;
    }

    /**
     * @placeholder v1.4
     * Returns alliance vector (placeholder, ainda não modelado).
     */
    getAlliance(save, clubA, clubB) {
        return 0;
    }

    /**
     * @placeholder v1.2
     * Returns reputação manager perante presidente (-100 a +100).
     */
    getCoachReputation(save, coachId) {
        return 0;
    }

    /**
     * @placeholder AKITA-RFCT-010
     * Records derby outcome impact em rivalry.
     */
    recordDerby(save, clubA, clubB, result) {
        // To be implemented
    }

    /**
     * @placeholder AKITA-RFCT-010
     * Records transfer impact (cliente vai pra rival = +rivalry).
     */
    recordTransfer(save, playerId, fromClub, toClub) {
        // To be implemented
    }

    /**
     * @placeholder AKITA-RFCT-010
     * Decay rivalry vector (chamado weekly).
     */
    decayRivalry(save, daysElapsed) {
        // To be implemented
    }
}
