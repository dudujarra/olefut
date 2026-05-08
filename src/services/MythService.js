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
    // WRITES — AKITA-RFCT-007 implementation
    // ========================================================================

    /**
     * Adds player to legends list.
     *
     * @param {Engine|object} engineOrSave
     * @param {number} playerId
     * @param {string} slot — must be in MYTH_SLOTS
     * @returns {{success:boolean, msg?:string}}
     */
    addLegend(engineOrSave, playerId, slot) {
        if (!engineOrSave) return { success: false, msg: 'engineOrSave null' };
        if (slot && !MYTH_SLOTS.includes(slot)) {
            return { success: false, msg: `slot inválido: ${slot}` };
        }
        engineOrSave.myth = engineOrSave.myth || {};
        engineOrSave.myth.legends = engineOrSave.myth.legends || [];

        // Avoid duplicates by playerId+slot
        const existing = engineOrSave.myth.legends.find(
            l => l.playerId === playerId && l.slot === slot
        );
        if (existing) return { success: false, msg: 'já é lenda nesse slot' };

        engineOrSave.myth.legends.push({
            playerId,
            slot: slot || null,
            canonizedAt: Date.now()
        });
        return { success: true };
    }

    /**
     * Promotes player to club hall of fame slot. Substitui ocupante anterior se houver.
     */
    promoteToHallOfFame(engineOrSave, playerId, clubId, slot) {
        if (!engineOrSave) return { success: false, msg: 'engineOrSave null' };
        if (!MYTH_SLOTS.includes(slot)) {
            return { success: false, msg: `slot inválido: ${slot}` };
        }
        if (clubId == null) return { success: false, msg: 'clubId obrigatório' };

        engineOrSave.myth = engineOrSave.myth || {};
        engineOrSave.myth.halls = engineOrSave.myth.halls || {};
        engineOrSave.myth.halls[clubId] = engineOrSave.myth.halls[clubId] || {};
        engineOrSave.myth.halls[clubId][slot] = playerId;
        return { success: true };
    }

    /**
     * v1.3 (AKITA-054): Generates regen child with inherited traits.
     *
     * Probabilidade: 1 a cada 3-4 temporadas (rng < 0.30 sample).
     * Idade nascimento: 16-18 anos após auge do parent (parent.peakSeason).
     *
     * @param {object} engineOrSave
     * @param {number} parentPlayerId — id do ex-companheiro pai
     * @param {object} ctx — { rng, currentSeason, inheritanceService }
     * @returns {{success, child?: object}}
     */
    generateRegenChild(engineOrSave, parentPlayerId, ctx = {}) {
        if (!engineOrSave) return { success: false, msg: 'engineOrSave null' };
        const rng = ctx.rng || Math.random;

        // Find parent: squad first, retired second
        let parent = null;
        for (const team of engineOrSave.teams || []) {
            const found = (team.squad || []).find(p => p.id === parentPlayerId);
            if (found) { parent = found; break; }
        }
        if (!parent) {
            parent = (engineOrSave.retiredPlayers || []).find(r => r.playerId === parentPlayerId);
        }
        if (!parent) return { success: false, msg: 'parent não encontrado' };

        // Probabilidade gate: 1/4 temporadas → ~25%
        if (rng() > 0.25) return { success: false, msg: 'no birth this period' };

        // Generate child
        const childId = `regen_${Date.now()}_${Math.floor(rng() * 10000)}`;
        const ageAtDebut = 16 + Math.floor(rng() * 3); // 16-18

        // Inherited traits via injected service
        let traits = { garra: 50, talento_natural: 50, lealdade: 50, frieza: 50 };
        if (ctx.inheritanceService) {
            const clubId = parent.clubsPlayed?.[parent.clubsPlayed.length - 1] || null;
            traits = ctx.inheritanceService.generateInheritedTraits(
                engineOrSave,
                clubId,
                [{ traits: parent.traits || {} }],
                rng
            );
        }

        const child = {
            id: childId,
            name: `Filho de ${parent.name}`, // placeholder name (regen pool decide depois)
            position: parent.position || 'MEI',
            age: ageAtDebut,
            isRegenChild: true,
            parentId: parentPlayerId,
            parentName: parent.name,
            traits,
            ovr: 50 + Math.floor(rng() * 20) // 50-70 (jovem promessa)
        };

        // Persist em regenLineage
        engineOrSave.regenLineage = engineOrSave.regenLineage || [];
        engineOrSave.regenLineage.push({
            childId,
            parentId: parentPlayerId,
            parentName: parent.name,
            bornAt: ctx.currentSeason || 0,
            traits
        });

        return { success: true, child };
    }

    // ========================================================================
    // EVALUATE MYTH — v1.1 (AKITA-051) auto-canonization scan
    // ========================================================================

    /**
     * Function pura: scan all players, identify mythic candidates, auto-promote.
     *
     * Critérios v1.1 MVP:
     * - idoloEterno: 200+ gols carreira + 1+ título + 8+ temps no clube
     * - carrasco: 5+ gols clássicos contra mesmo rival
     * - goleirao: 100+ defesas em finais OU 50+ jogos sem sofrer gol
     * - criaDaBase: revealed via youth + 5+ temps + 50+ jogos
     * - traidor: transferiu pra rival após 5+ temps no clube origem
     * - lendaTragica: morreu em ativa OU lesão definitiva sendo top 3 do clube
     *
     * @param {Engine|object} engineOrSave
     * @returns {{canonized: number, halls: number, snapshot: object}}
     */
    evaluateMyth(engineOrSave) {
        if (!engineOrSave) return { canonized: 0, halls: 0 };

        let canonized = 0;
        let hallsAdded = 0;

        const teams = engineOrSave.teams || [];
        const allPlayers = teams.flatMap(t => (t.squad || []).map(p => ({ player: p, clubId: t.id })));

        // Include retired players too
        const retiredPlayers = engineOrSave.retiredPlayers || [];
        const allCandidates = [
            ...allPlayers,
            ...retiredPlayers.map(snap => ({
                player: { ...snap, retired: true },
                clubId: snap.clubsPlayed?.[snap.clubsPlayed?.length - 1] || null
            }))
        ];

        for (const { player, clubId } of allCandidates) {
            if (!player || !clubId) continue;

            // idoloEterno
            const totalGoals = player.career?.totalGoals || player.careerStats?.totalGoals || 0;
            const titles = player.titles?.length || 0;
            const seasonsAtClub = player.seasonsAtCurrentClub || 0;
            if (totalGoals >= 200 && titles >= 1 && seasonsAtClub >= 8) {
                if (!this.isCanonized(engineOrSave, player.id)) {
                    this.addLegend(engineOrSave, player.id, 'idoloEterno');
                    canonized++;
                }
                if (this.getHallOfFame(engineOrSave, clubId).idoloEterno !== player.id) {
                    this.promoteToHallOfFame(engineOrSave, player.id, clubId, 'idoloEterno');
                    hallsAdded++;
                }
            }

            // criaDaBase
            const isYouth = player.isYouth || player.youthRevealed;
            const seasonsPlayed = player.career?.seasonsPlayed || player.careerStats?.seasonsPlayed || 0;
            const totalAppearances = player.career?.totalAppearances || player.careerStats?.totalAppearances || 0;
            if (isYouth && seasonsPlayed >= 5 && totalAppearances >= 50) {
                if (this.getHallOfFame(engineOrSave, clubId).criaDaBase !== player.id) {
                    this.promoteToHallOfFame(engineOrSave, player.id, clubId, 'criaDaBase');
                    hallsAdded++;
                }
            }

            // goleirao (GOL position + 50+ clean sheets)
            const cleanSheets = player.career?.cleanSheets || 0;
            if (player.position === 'GOL' && cleanSheets >= 50) {
                if (this.getHallOfFame(engineOrSave, clubId).goleirao !== player.id) {
                    this.promoteToHallOfFame(engineOrSave, player.id, clubId, 'goleirao');
                    hallsAdded++;
                }
            }
        }

        return { canonized, hallsAdded };
    }

    /**
     * Returns count total de slots filled across all clubs.
     */
    getTotalCanonized(engineOrSave) {
        const halls = engineOrSave?.myth?.halls || {};
        let count = 0;
        for (const clubId of Object.keys(halls)) {
            for (const slot of MYTH_SLOTS) {
                if (halls[clubId][slot] != null) count++;
            }
        }
        return count;
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
