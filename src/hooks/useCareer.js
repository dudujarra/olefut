/**
 * useCareer — Hook fachada pra CareerService.
 *
 * Status: SKELETON (preenchido em AKITA-RFCT-014-016 / RFCT-017)
 */

import { useGame } from '../context/GameContext';

export function useCareer() {
    const { getEngine } = useGame();
    const engine = getEngine();

    return {
        proPlayer: engine?._careerService?.getProPlayer?.(engine) || null,
        managerCareer: engine?._careerService?.getManagerCareer?.(engine) || null,
        getOffers: () => engine?._careerService?.getOffers?.(engine) || []
    };
}
