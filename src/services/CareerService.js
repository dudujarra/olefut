/**
 * CareerService — Player Career + Manager Career + Transição
 *
 * AKITA-RFCT-014/015/016 collapsed.
 *
 * Constructor injection. Stateless service.
 * Transição complexa delegada a CareerTransition class (Replace Method with Method Object).
 */

import { CareerTransition } from './CareerTransition';

export class CareerService {
    constructor({ mythService = null, relationshipService = null, narrativeService = null } = {}) {
        this._mythService = mythService;
        this._relationshipService = relationshipService;
        this._narrativeService = narrativeService;
    }

    // ========================================================================
    // RFCT-014: ProPlayer career
    // ========================================================================

    /**
     * Returns ProPlayer state.
     */
    getProPlayer(engineOrSave) {
        return engineOrSave?.proPlayer || null;
    }

    /**
     * Advance ProPlayer career N weeks (Player mode).
     * Placeholder — full impl em v1.2.
     */
    advanceCareer(engineOrSave, weeks = 1) {
        const proPlayer = this.getProPlayer(engineOrSave);
        if (!proPlayer || proPlayer.retired) return { success: false };
        proPlayer.weeksPlayed = (proPlayer.weeksPlayed || 0) + weeks;
        return { success: true, weeksPlayed: proPlayer.weeksPlayed };
    }

    /**
     * Retire ProPlayer + transition to Manager (mesmo save).
     * Uses Replace Method with Method Object pattern.
     */
    retireProPlayer(engineOrSave) {
        const transition = new CareerTransition(engineOrSave, {
            mythService: this._mythService,
            relationshipService: this._relationshipService,
            narrativeService: this._narrativeService
        });
        return transition.execute();
    }

    // ========================================================================
    // RFCT-015: Manager career
    // ========================================================================

    /**
     * Returns manager career state.
     */
    getManagerCareer(engineOrSave) {
        return engineOrSave?.managerCareer || null;
    }

    /**
     * Sign manager with club.
     */
    signWithClub(engineOrSave, clubId, contract = {}) {
        if (!engineOrSave) return { success: false };
        engineOrSave.managerCareer = engineOrSave.managerCareer || {
            history: [],
            startedAt: Date.now()
        };

        // Close current club entry if exists
        if (engineOrSave.managerCareer.currentClubId) {
            const last = engineOrSave.managerCareer.history.find(
                h => h.clubId === engineOrSave.managerCareer.currentClubId && !h.endedAt
            );
            if (last) last.endedAt = Date.now();
        }

        engineOrSave.managerCareer.currentClubId = clubId;
        engineOrSave.managerCareer.history.push({
            clubId,
            signedAt: Date.now(),
            contractWeeks: contract.weeks || 38,
            salary: contract.salary || 5000,
            endedAt: null
        });
        return { success: true };
    }

    /**
     * Returns active offers (placeholder — preenchido com gameplay logic em v1.2).
     */
    getOffers(engineOrSave) {
        if (!engineOrSave) return [];
        return Array.isArray(engineOrSave.managerCareer?.offers)
            ? [...engineOrSave.managerCareer.offers]
            : [];
    }

    /**
     * Adds offer to manager career.
     */
    addOffer(engineOrSave, offer) {
        if (!engineOrSave) return { success: false };
        engineOrSave.managerCareer = engineOrSave.managerCareer || { history: [], offers: [] };
        engineOrSave.managerCareer.offers = engineOrSave.managerCareer.offers || [];
        engineOrSave.managerCareer.offers.push({
            id: `offer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            ...offer,
            createdAt: Date.now()
        });
        return { success: true };
    }
}
