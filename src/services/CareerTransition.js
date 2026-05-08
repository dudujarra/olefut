/**
 * CareerTransition — Replace Method with Method Object (AKITA-RFCT-016)
 *
 * Encapsula a transição complexa ProPlayer → Manager.
 * 5 private steps: validate, snapshot, promote, inheritRelations, calculateReputation.
 *
 * Cada step é mutável independente, testável isoladamente.
 */

export class CareerTransition {
    constructor(save, services = {}) {
        this._save = save;
        this._mythService = services.mythService;
        this._relationshipService = services.relationshipService;
        this._narrativeService = services.narrativeService;
        this._snapshot = null;
        this._initialReputation = 50;
    }

    execute() {
        if (!this._validateRetirementEligible()) {
            return { success: false, msg: 'jogador não elegível pra aposentadoria' };
        }
        this._snapshotPlayerCareer();
        this._promoteToManager();
        this._inheritRelationships();
        this._calculateInitialReputation();
        return {
            success: true,
            snapshot: this._snapshot,
            initialReputation: this._initialReputation
        };
    }

    // ========================================================================
    // STEPS — privates
    // ========================================================================

    _validateRetirementEligible() {
        const proPlayer = this._save?.proPlayer;
        if (!proPlayer) return false;
        // Aposentadoria padrão: idade >= 35 OU >12 temps de carreira
        const age = proPlayer.age || 0;
        const seasonsPlayed = proPlayer.seasonsPlayed || 0;
        return age >= 35 || seasonsPlayed >= 12;
    }

    _snapshotPlayerCareer() {
        const proPlayer = this._save.proPlayer;
        this._snapshot = {
            playerId: proPlayer.id,
            name: proPlayer.name,
            position: proPlayer.position,
            careerStats: { ...(proPlayer.careerStats || {}) },
            titles: [...(proPlayer.titles || [])],
            clubsPlayed: [...(proPlayer.clubsPlayed || [])],
            traits: [...(proPlayer.traits || [])],
            retiredAt: Date.now()
        };
        // Persiste em save.retiredPlayers (Camada 5 mito source)
        this._save.retiredPlayers = this._save.retiredPlayers || [];
        this._save.retiredPlayers.push(this._snapshot);
    }

    _promoteToManager() {
        // Inicializa managerCareer baseado em ProPlayer career
        this._save.managerCareer = this._save.managerCareer || {};
        this._save.managerCareer = {
            ...this._save.managerCareer,
            startedAt: Date.now(),
            originalPlayerId: this._snapshot.playerId,
            originalPlayerName: this._snapshot.name,
            currentClubId: null,
            history: []
        };
        // ProPlayer flag aposentado (mantém como mito no save)
        this._save.proPlayer = {
            ...this._save.proPlayer,
            retired: true
        };
    }

    _inheritRelationships() {
        if (!this._relationshipService) return;
        // Ex-companheiros: clubes onde jogou ficam com bias positivo
        for (const clubId of this._snapshot.clubsPlayed || []) {
            this._relationshipService.adjustTrust(this._save, 5);
        }
        // Hall slots de clubes onde jogou geram bonus extra
        if (this._mythService) {
            for (const clubId of this._snapshot.clubsPlayed || []) {
                const slots = this._mythService.countHallSlots(this._save, clubId);
                if (slots >= 2) {
                    this._relationshipService.adjustTrust(this._save, 10);
                }
            }
        }
    }

    _calculateInitialReputation() {
        // Reputation baseada em conquistas Tier S/A/B
        const titles = this._snapshot.titles || [];
        const careerStats = this._snapshot.careerStats || {};

        let reputation = 30; // baseline veterano

        // Tier S conquests: +20 each
        const tierSCount = titles.filter(t => t.tier === 'S').length;
        reputation += tierSCount * 20;
        // Tier A: +10 each
        const tierACount = titles.filter(t => t.tier === 'A').length;
        reputation += tierACount * 10;
        // Tier B: +5 each
        const tierBCount = titles.filter(t => t.tier === 'B').length;
        reputation += tierBCount * 5;

        // Career goals bonus
        if ((careerStats.totalGoals || 0) >= 200) reputation += 10;
        if ((careerStats.totalAssists || 0) >= 100) reputation += 5;

        // Cap at 100
        this._initialReputation = Math.min(100, reputation);
    }
}
