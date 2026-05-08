/**
 * useMyth — Hook fachada pra MythService.
 *
 * AKITA-RFCT-007: wired up. Components usam ao invés de acessar engine.legendary direto.
 */

import { useGame } from '../context/GameContext';

export function useMyth() {
    const { getEngine } = useGame();
    const engine = getEngine();
    const svc = engine?._mythService;

    return {
        legends: svc?.getLegends(engine) || [],
        getHallOfFame: (clubId) => svc?.getHallOfFame(engine, clubId) || {},
        getRegenChildren: () => svc?.getRegenChildren(engine) || [],
        isCanonized: (playerId) => svc?.isCanonized(engine, playerId) || false,
        countHallSlots: (clubId) => svc?.countHallSlots(engine, clubId) || 0,
        addLegend: (playerId, slot) => svc?.addLegend(engine, playerId, slot),
        promoteToHallOfFame: (playerId, clubId, slot) => svc?.promoteToHallOfFame(engine, playerId, clubId, slot)
    };
}
