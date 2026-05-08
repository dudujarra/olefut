/**
 * useCareer — Hook fachada pra CareerService.
 *
 * AKITA-RFCT-014/016: wired up.
 */

import { useGame } from '../context/GameContext';

export function useCareer() {
    const { getEngine } = useGame();
    const engine = getEngine();
    const svc = engine?._careerService;

    return {
        proPlayer: svc?.getProPlayer(engine) || null,
        managerCareer: svc?.getManagerCareer(engine) || null,
        getOffers: () => svc?.getOffers(engine) || [],
        advanceCareer: (weeks) => svc?.advanceCareer(engine, weeks),
        retireProPlayer: () => svc?.retireProPlayer(engine),
        signWithClub: (clubId, contract) => svc?.signWithClub(engine, clubId, contract),
        addOffer: (offer) => svc?.addOffer(engine, offer)
    };
}
