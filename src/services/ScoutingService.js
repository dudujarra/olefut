// AKITA-RFCT-019.3: extract scouting from engine.
//
// Stateless service. Recebe engine como contexto, muta state in-place.
//
// Métodos:
// - scoutLeague: lista candidates de outros times filtrando por posição/OVR/idade
// - doScouting: roda scoutRegion da região + paga custo + atualiza scoutedPlayers
// - signScoutedPlayer: contrata um da lista (BUG-002)

import { Data } from '../engine/data';
import { SCOUT_REGIONS, scoutRegion } from '../engine/StadiumSystem';

export class ScoutingService {
    constructor() {
        // Stateless
    }

    /**
     * SPEC-122: Scout league for buy candidates.
     * Returns array de { team, player, position, ovr, value } sorted by OVR desc.
     * Filtra próprio time + injured + retired + idade > maxAge (BUG-076).
     */
    scoutLeague(engine, targetPosition = null, minOVR = 60, limit = 20, maxAge = 29) {
        const myTeamId = engine.manager?.teamId;
        const candidates = [];
        for (const team of engine.teams) {
            if (team.id === myTeamId) continue;
            for (const player of team.squad || []) {
                if (player._retired || player.injury) continue;
                if (targetPosition && player.position !== targetPosition) continue;
                if ((player.ovr || 0) < minOVR) continue;
                // BUG-076: filter old players — don't buy 34-year-olds
                if ((player.age || 25) > maxAge) continue;
                candidates.push({
                    teamId: team.id,
                    teamName: team.name,
                    player,
                    position: player.position,
                    ovr: player.ovr,
                    value: player.value || 1_000_000
                });
            }
        }
        candidates.sort((a, b) => b.ovr - a.ovr);
        return candidates.slice(0, limit);
    }

    /**
     * Roda scoutRegion da região especificada. Paga custo, atualiza scoutedPlayers.
     */
    doScouting(engine, regionId) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return { success: false, players: [] };
        const region = SCOUT_REGIONS.find(r => r.id === regionId);
        if (region && region.cost > team.balance) {
            return { success: false, msg: `Saldo insuficiente. Custo: R$ ${(region.cost/1000).toFixed(0)}K` };
        }
        if (region) team.balance -= region.cost;
        const result = scoutRegion(regionId, engine.staff.has('scout'), Data);
        engine.scoutedPlayers = result.players;
        return result;
    }

    /**
     * Sign a scouted player by index. BUG-002.
     */
    signScoutedPlayer(engine, index) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };
        if (!engine.scoutedPlayers || index < 0 || index >= engine.scoutedPlayers.length) {
            return { success: false, msg: 'Jogador não encontrado.' };
        }
        const player = engine.scoutedPlayers[index];
        if (player.value && player.value > team.balance) {
            return { success: false, msg: `Saldo insuficiente. Custo: R$ ${((player.value || 0)/1000000).toFixed(1)}M` };
        }
        if (player.value) team.balance -= player.value;
        player.contract = { weeksLeft: 76, salary: Math.floor((player.value || 500000) * 0.001) };
        player.moral = 60;
        player.energy = 100;
        player.isTitular = false;
        team.squad.push(player);
        engine.scoutedPlayers.splice(index, 1);
        return { success: true, msg: `✅ ${player.name} contratado!` };
    }
}
