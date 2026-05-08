/**
 * useRelationships — Hook fachada pra RelationshipService.
 *
 * AKITA-RFCT-008/010: wired up.
 */

import { useGame } from '../context/GameContext';

export function useRelationships() {
    const { getEngine } = useGame();
    const engine = getEngine();
    const svc = engine?._relationshipService;

    return {
        getRivalry: (a, b) => svc?.getRivalry(engine, a, b) ?? 0,
        getAlliance: (a, b) => svc?.getAlliance(engine, a, b) ?? 0,
        getCoachReputation: (id) => svc?.getCoachReputation(engine, id) ?? 60,
        getPresidentPatience: (id) => svc?.getPresidentPatience(engine, id) ?? 70,
        recordDerby: (a, b, result) => svc?.recordDerby(engine, a, b, result),
        adjustTrust: (delta) => svc?.adjustTrust(engine, delta),
        adjustPatience: (delta) => svc?.adjustPatience(engine, delta)
    };
}
