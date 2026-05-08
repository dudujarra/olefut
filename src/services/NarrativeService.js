/**
 * NarrativeService — Camadas 1 (Agente), 2 (Eventual), 3-4 narrativa
 *
 * Status: SKELETON (preenchido em AKITA-RFCT-011 a RFCT-013)
 * Stateless. Recebe outros services via constructor injection.
 *
 * Princípio 5: chamadas diretas síncronas. SEM EventBus por padrão.
 */

import { isValidEventType } from '../data/eventTypes';
import { validateTags } from '../data/eventTags';

export class NarrativeService {
    /**
     * Constructor injection. Outros services chamados diretamente.
     */
    constructor({ relationshipService, mythService } = {}) {
        this._relationshipService = relationshipService;
        this._mythService = mythService;
    }

    /**
     * @placeholder AKITA-RFCT-011 (Camada 1)
     * Records player decision (TRANSFER_OUT, TACTIC_CHANGED, FIRED_STAFF, etc.)
     */
    recordDecision(save, decisionType, payload) {
        // To be implemented
    }

    /**
     * @placeholder AKITA-RFCT-011 (Camada 2)
     * Appends event to save.events with schema:
     * { id, ts, type, valence, intensity, tags, actors, witnesses, decay, narrativeWeight }
     */
    appendEvent(save, eventType, ctx) {
        if (!isValidEventType(eventType)) {
            throw new Error(`appendEvent: tipo inválido "${eventType}"`);
        }
        if (ctx?.tags && !validateTags(ctx.tags)) {
            throw new Error('appendEvent: tags fora vocabulário fixo');
        }
        // To be implemented (push to save.events)
    }

    /**
     * @placeholder AKITA-RFCT-011 (Camada 2)
     * Returns events com decay aplicado.
     */
    getDecayedEvents(save, now) {
        return [];
    }

    /**
     * @placeholder AKITA-RFCT-012 (Camada 3 integration)
     */
    getRelationalContext(save, actorA, actorB) {
        if (!this._relationshipService) return null;
        return this._relationshipService.getRivalry(save, actorA, actorB);
    }

    /**
     * @placeholder AKITA-RFCT-012 (Camada 4)
     * Opens narrative arc (rivalidade, "Sombra do Pai", etc.)
     */
    openArc(save, arcType, actors) {
        // To be implemented
    }

    /**
     * @placeholder AKITA-RFCT-012 (Camada 4)
     */
    getOpenArcs(save) {
        return [];
    }

    /**
     * @placeholder AKITA-RFCT-013 (Camada 5 integration)
     * Promotes player → legend canonization (delegates to MythService).
     */
    canonize(save, playerId, mythSlot) {
        if (!this._mythService) return;
        this._mythService.addLegend(save, playerId, mythSlot);
    }
}
