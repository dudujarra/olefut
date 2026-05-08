/**
 * useNarrative — Hook fachada pra NarrativeService.
 *
 * AKITA-RFCT-011/013: wired up.
 */

import { useGame } from '../context/GameContext';

export function useNarrative() {
    const { getEngine } = useGame();
    const engine = getEngine();
    const svc = engine?._narrativeService;

    return {
        getDecayedEvents: (now) => svc?.getDecayedEvents(engine, now) || [],
        getOpenArcs: () => svc?.getOpenArcs(engine) || [],
        getDecisions: () => svc?.getDecisions(engine) || [],
        queryEvents: (criteria) => svc?.queryEvents(engine, criteria) || [],
        recordDecision: (type, payload) => svc?.recordDecision(engine, type, payload),
        appendEvent: (type, ctx) => svc?.appendEvent(engine, type, ctx),
        openArc: (name, actors, ctx) => svc?.openArc(engine, name, actors, ctx),
        closeArc: (id, ctx) => svc?.closeArc(engine, id, ctx),
        addMilestone: (arcId, milestone) => svc?.addMilestone(engine, arcId, milestone),
        canonize: (playerId, slot) => svc?.canonize(engine, playerId, slot),
        promoteToHall: (playerId, clubId, slot) => svc?.promoteToHall(engine, playerId, clubId, slot)
    };
}
