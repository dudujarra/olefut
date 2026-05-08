/**
 * useMyth — Hook fachada pra MythService.
 *
 * Status: SKELETON (preenchido em AKITA-RFCT-007 / RFCT-017)
 *
 * Substitui chamadas diretas a engine.getLegends() etc nos components.
 */

import { useGame } from '../context/GameContext';

export function useMyth() {
    const { getEngine } = useGame();
    const engine = getEngine();

    // Placeholder — será preenchido quando MythService existir
    return {
        legends: engine?._mythService?.getLegends?.(engine) || [],
        getHallOfFame: (clubId) => engine?._mythService?.getHallOfFame?.(engine, clubId) || [],
        getRegenChildren: () => engine?._mythService?.getRegenChildren?.(engine) || []
    };
}
