/**
 * RelationshipService — Camada 3 (Relacional)
 *
 * AKITA-RFCT-008/009/010 collapsed: skeleton + reads + writes.
 *
 * SPEC-049 Camada 3:
 * - v1.2: manager↔presidente (trust, patience)
 * - v1.4: club↔club (rivalry)
 * - v1.4: jogador↔torcida (love)
 *
 * Range universal: -100 a +100.
 * Recompute: a cada 7 dias-de-jogo, não em tempo real.
 *
 * Princípio 4: stateless. Recebe `engineOrSave` como contexto.
 */

export const RELATIONSHIP_RANGE = Object.freeze({ MIN: -100, MAX: 100 });

export const THRESHOLDS = Object.freeze({
    LOW: 30,
    MID: 60,
    HIGH: 80
});

function clamp(v) {
    return Math.max(RELATIONSHIP_RANGE.MIN, Math.min(RELATIONSHIP_RANGE.MAX, v));
}

function pairKey(a, b) {
    // Symmetric key (clubA-clubB === clubB-clubA)
    const [x, y] = [a, b].sort();
    return `${x}_${y}`;
}

export class RelationshipService {
    constructor() {
        // Stateless
    }

    // ========================================================================
    // READS
    // ========================================================================

    /**
     * Returns rivalry vector entre dois clubes (0-100).
     * Symmetric.
     */
    getRivalry(engineOrSave, clubA, clubB) {
        if (!engineOrSave || clubA == null || clubB == null) return 0;
        const map = engineOrSave.relations?.club_club || {};
        const key = pairKey(clubA, clubB);
        return map[key]?.rivalry ?? 0;
    }

    /**
     * Returns alliance vector (placeholder, ainda não modelado).
     */
    getAlliance(engineOrSave, clubA, clubB) {
        if (!engineOrSave || clubA == null || clubB == null) return 0;
        const map = engineOrSave.relations?.club_club || {};
        const key = pairKey(clubA, clubB);
        return map[key]?.alliance ?? 0;
    }

    /**
     * Returns reputação manager perante presidente (-100 a +100).
     */
    getCoachReputation(engineOrSave, coachId) {
        if (!engineOrSave) return 0;
        const map = engineOrSave.relations?.manager_president || {};
        if (coachId == null) {
            // Default to current manager
            return map.trust ?? 60;
        }
        return map[coachId]?.trust ?? 60;
    }

    /**
     * Returns paciência presidente (0-100).
     */
    getPresidentPatience(engineOrSave, coachId) {
        if (!engineOrSave) return 70;
        const map = engineOrSave.relations?.manager_president || {};
        if (coachId == null) return map.patience ?? 70;
        return map[coachId]?.patience ?? 70;
    }

    // ========================================================================
    // WRITES
    // ========================================================================

    /**
     * Records derby outcome impact em rivalry. +intensity vencedor, -intensity perdedor.
     *
     * @param {object} engineOrSave
     * @param {number} clubA — home id
     * @param {number} clubB — away id
     * @param {object} result — { winner, score, dramatic }
     * @returns {{success}}
     */
    recordDerby(engineOrSave, clubA, clubB, result = {}) {
        if (!engineOrSave || clubA == null || clubB == null) return { success: false };
        engineOrSave.relations = engineOrSave.relations || {};
        engineOrSave.relations.club_club = engineOrSave.relations.club_club || {};
        const key = pairKey(clubA, clubB);
        const current = engineOrSave.relations.club_club[key] || { rivalry: 0, alliance: 0 };

        // Each derby +5 rivalry; +10 if dramatic (overtime/penalty/red cards)
        const delta = result.dramatic ? 10 : 5;
        current.rivalry = Math.min(100, (current.rivalry || 0) + delta);
        engineOrSave.relations.club_club[key] = current;
        return { success: true };
    }

    /**
     * Records transfer impact (cliente vai pra rival = +rivalry).
     */
    recordTransfer(engineOrSave, playerId, fromClub, toClub) {
        if (!engineOrSave || fromClub == null || toClub == null) return { success: false };
        if (fromClub === toClub) return { success: false, msg: 'mesmo clube' };
        // Only sour relationship if rivalry already exists
        const currentRivalry = this.getRivalry(engineOrSave, fromClub, toClub);
        if (currentRivalry > 30) {
            engineOrSave.relations = engineOrSave.relations || {};
            engineOrSave.relations.club_club = engineOrSave.relations.club_club || {};
            const key = pairKey(fromClub, toClub);
            const current = engineOrSave.relations.club_club[key] || { rivalry: 0 };
            current.rivalry = Math.min(100, (current.rivalry || 0) + 8);
            engineOrSave.relations.club_club[key] = current;
        }
        return { success: true };
    }

    /**
     * Decay rivalry vector (chamado weekly). Half-life ~540 dias = ~77 weeks.
     */
    decayRivalry(engineOrSave, daysElapsed = 7) {
        if (!engineOrSave?.relations?.club_club) return { success: true };
        const halfLifeDays = 540;
        const decayFactor = Math.pow(0.5, daysElapsed / halfLifeDays);
        const floor = 0.10;

        for (const key of Object.keys(engineOrSave.relations.club_club)) {
            const r = engineOrSave.relations.club_club[key];
            if (r.rivalry > floor * 100) {
                r.rivalry = Math.max(floor * 100, r.rivalry * decayFactor);
            }
        }
        return { success: true };
    }

    /**
     * Adjusts manager trust (-100 to +100).
     */
    adjustTrust(engineOrSave, delta) {
        if (!engineOrSave) return { success: false };
        engineOrSave.relations = engineOrSave.relations || {};
        engineOrSave.relations.manager_president = engineOrSave.relations.manager_president || {
            trust: 60,
            patience: 70
        };
        engineOrSave.relations.manager_president.trust = clamp(
            (engineOrSave.relations.manager_president.trust || 60) + delta
        );
        return { success: true, current: engineOrSave.relations.manager_president.trust };
    }

    /**
     * Adjusts patience (0-100).
     */
    adjustPatience(engineOrSave, delta) {
        if (!engineOrSave) return { success: false };
        engineOrSave.relations = engineOrSave.relations || {};
        engineOrSave.relations.manager_president = engineOrSave.relations.manager_president || {
            trust: 60,
            patience: 70
        };
        const next = (engineOrSave.relations.manager_president.patience || 70) + delta;
        engineOrSave.relations.manager_president.patience = Math.max(0, Math.min(100, next));
        return { success: true, current: engineOrSave.relations.manager_president.patience };
    }
}
