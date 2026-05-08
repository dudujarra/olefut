/**
 * useRelationships — Hook fachada pra RelationshipService.
 *
 * Status: SKELETON (preenchido em AKITA-RFCT-009 / RFCT-017)
 */

import { useGame } from '../context/GameContext';

export function useRelationships() {
    const { getEngine } = useGame();
    const engine = getEngine();

    return {
        getRivalry: (a, b) => engine?._relationshipService?.getRivalry?.(engine, a, b) || 0,
        getCoachReputation: (id) => engine?._relationshipService?.getCoachReputation?.(engine, id) || 0
    };
}
