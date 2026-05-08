/**
 * CareerService — Player Career + Manager Career + Transição
 *
 * Status: SKELETON (preenchido em AKITA-RFCT-014 a RFCT-016)
 * Stateless. Constructor injection.
 *
 * Transição usa Replace Method with Method Object (CareerTransition class).
 */

export class CareerService {
    constructor({ mythService, relationshipService, narrativeService } = {}) {
        this._mythService = mythService;
        this._relationshipService = relationshipService;
        this._narrativeService = narrativeService;
    }

    /**
     * @placeholder AKITA-RFCT-014
     */
    getProPlayer(save) {
        return save?.proPlayer || null;
    }

    /**
     * @placeholder AKITA-RFCT-014
     * Advance ProPlayer career N weeks.
     */
    advanceCareer(save, weeks) {
        // To be implemented
    }

    /**
     * @placeholder AKITA-RFCT-016
     * Retire ProPlayer + transition to Manager (mesmo save).
     */
    retireProPlayer(save) {
        // Will instantiate CareerTransition class internally
        // (Replace Method with Method Object pattern)
        // To be implemented
    }

    /**
     * @placeholder AKITA-RFCT-015
     */
    getManagerCareer(save) {
        return save?.managerCareer || null;
    }

    /**
     * @placeholder AKITA-RFCT-015
     * Sign manager with club (player career → manager career).
     */
    signWithClub(save, clubId) {
        // To be implemented
    }

    /**
     * @placeholder AKITA-RFCT-015
     * Returns offers de outros clubes pro manager.
     */
    getOffers(save) {
        return [];
    }
}
