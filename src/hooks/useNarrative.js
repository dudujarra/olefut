/**
 * useNarrative — Hook fachada pra NarrativeService.
 *
 * Status: SKELETON (preenchido em AKITA-RFCT-011-013 / RFCT-017)
 */

import { useGame } from '../context/GameContext';

export function useNarrative() {
    const { getEngine } = useGame();
    const engine = getEngine();

    return {
        getDecayedEvents: (now) => engine?._narrativeService?.getDecayedEvents?.(engine, now) || [],
        getOpenArcs: () => engine?._narrativeService?.getOpenArcs?.(engine) || []
    };
}
