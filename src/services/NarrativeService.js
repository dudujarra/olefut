/**
 * NarrativeService — Camadas 1 (Agente), 2 (Eventual), 3-4 (Relacional/Narrativa), 5 (Mito integration)
 *
 * AKITA-RFCT-011/012/013 collapsed.
 *
 * Princípios:
 * - 4: stateless. State vive no save.
 * - 5: chamadas diretas síncronas. SEM EventBus.
 *
 * SPEC-049:
 * - Camada 1 AGENTE: registro estruturado de TODA decisão do jogador
 * - Camada 2 EVENTUAL: 12-15 tipos evento + 20-25 tags + half-life decay + 80 templates
 * - Camada 3 RELACIONAL: integration via RelationshipService
 * - Camada 4 NARRATIVA: arcos nomeados (rivalidade, "Sombra do Pai")
 * - Camada 5 MITO: integration via MythService (canonize)
 */

import { isValidEventType, EVENT_TYPES } from '../data/eventTypes';
import { validateTags } from '../data/eventTags';
import { getEventTemplate, pickRandomTemplate } from '../data/eventTemplates';

const HALF_LIFE_DAYS = Object.freeze({
    PLAYER_TRANSFER_TO_RIVAL: { days: 730, floor: 0.15 },
    PLAYER_GOAL_DECISIVE: { days: 365, floor: 0.05 },
    TORCIDA_PROTEST: { days: 540, floor: 0.10 },
    TITLE_WON: { days: 1095, floor: 0.20 },
    PLAYER_RED_CARD: { days: 90, floor: 0.0 },
    DEFAULT: { days: 365, floor: 0.05 }
});

let _eventCounter = 0;
function nextEventId() {
    return `evt_${Date.now()}_${++_eventCounter}`;
}

export class NarrativeService {
    constructor({ relationshipService = null, mythService = null } = {}) {
        this._relationshipService = relationshipService;
        this._mythService = mythService;
    }

    // ========================================================================
    // CAMADA 1 — AGENTE
    // ========================================================================

    /**
     * Records player decision (TRANSFER_OUT, TACTIC_CHANGED, FIRED_STAFF, etc.)
     */
    recordDecision(engineOrSave, decisionType, payload = {}) {
        if (!engineOrSave) return { success: false, msg: 'engineOrSave null' };
        engineOrSave.decisions = engineOrSave.decisions || [];
        engineOrSave.decisions.push({
            id: nextEventId(),
            ts: Date.now(),
            type: decisionType,
            payload
        });
        return { success: true };
    }

    /**
     * Returns decisions array.
     */
    getDecisions(engineOrSave) {
        if (!engineOrSave) return [];
        return Array.isArray(engineOrSave.decisions) ? [...engineOrSave.decisions] : [];
    }

    // ========================================================================
    // CAMADA 2 — EVENTUAL
    // ========================================================================

    /**
     * Appends event to save.events.
     * Schema: { id, ts, type, valence, intensity, tags, actors, witnesses, decay, narrativeWeight }
     */
    appendEvent(engineOrSave, eventType, ctx = {}) {
        if (!engineOrSave) return { success: false, msg: 'engineOrSave null' };
        if (!isValidEventType(eventType)) {
            return { success: false, msg: `tipo inválido: ${eventType}` };
        }
        if (ctx.tags && !validateTags(ctx.tags)) {
            return { success: false, msg: 'tags fora vocabulário fixo' };
        }

        engineOrSave.events = engineOrSave.events || [];
        const halfLife = HALF_LIFE_DAYS[eventType] || HALF_LIFE_DAYS.DEFAULT;
        const evt = {
            id: nextEventId(),
            ts: ctx.ts ?? Date.now(),
            type: eventType,
            valence: ctx.valence ?? 0,
            intensity: ctx.intensity ?? 50,
            tags: ctx.tags ?? [],
            actors: ctx.actors ?? [],
            witnesses: ctx.witnesses ?? [],
            decay: { halfLifeDays: halfLife.days, floor: halfLife.floor },
            narrativeWeight: ctx.narrativeWeight ?? 1
        };
        // Optional fields from template-based append
        if (ctx.headline) evt.headline = ctx.headline;
        if (ctx.templateId) evt.templateId = ctx.templateId;
        engineOrSave.events.push(evt);
        return { success: true };
    }

    /**
     * Returns events com decay aplicado (intensity scaled by elapsed time).
     */
    getDecayedEvents(engineOrSave, now = Date.now()) {
        if (!engineOrSave?.events) return [];
        return engineOrSave.events.map(evt => {
            const elapsedDays = (now - evt.ts) / (1000 * 60 * 60 * 24);
            const decayFactor = Math.pow(0.5, elapsedDays / evt.decay.halfLifeDays);
            const decayed = Math.max(evt.decay.floor, decayFactor);
            return {
                ...evt,
                currentIntensity: Math.round(evt.intensity * decayed)
            };
        });
    }

    /**
     * Append event using a handwritten template (RFCT-007 v1.0.7).
     * Looks up template, applies defaults, fills slots in headline.
     *
     * @param {object} engineOrSave
     * @param {string} templateId — id from EVENT_TEMPLATES
     * @param {object} ctx — { actors, witnesses, ts, slots: {chave:valor} }
     */
    appendEventFromTemplate(engineOrSave, templateId, ctx = {}) {
        const tpl = getEventTemplate(templateId);
        if (!tpl) return { success: false, msg: `template inválido: ${templateId}` };

        const slots = ctx.slots || {};
        const headline = tpl.headline.replace(/\{(\w+)\}/g, (_, k) => slots[k] ?? `[${k}]`);

        const fullCtx = {
            ...tpl.defaults,
            ...ctx,
            templateId,
            headline
        };

        return this.appendEvent(engineOrSave, tpl.type, fullCtx);
    }

    /**
     * Pick random template + append (auto-headline).
     *
     * @param {object} engineOrSave
     * @param {string} eventType
     * @param {object} ctx — { actors, witnesses, slots, rng }
     */
    appendRandomEvent(engineOrSave, eventType, ctx = {}) {
        const rng = ctx.rng || Math.random;
        const tpl = pickRandomTemplate(eventType, rng);
        if (!tpl) return { success: false, msg: `sem templates pra tipo: ${eventType}` };
        return this.appendEventFromTemplate(engineOrSave, tpl.id, ctx);
    }

    /**
     * Filter events by criteria (type/tags/actor).
     */
    queryEvents(engineOrSave, criteria = {}) {
        const events = this.getDecayedEvents(engineOrSave);
        return events.filter(evt => {
            if (criteria.type && evt.type !== criteria.type) return false;
            if (criteria.tag && !evt.tags.includes(criteria.tag)) return false;
            if (criteria.actor && !evt.actors.includes(criteria.actor)) return false;
            return true;
        });
    }

    // ========================================================================
    // CAMADA 3 — RELACIONAL (integration)
    // ========================================================================

    /**
     * Returns relational context entre dois atores via RelationshipService.
     */
    getRelationalContext(engineOrSave, actorA, actorB) {
        if (!this._relationshipService) return null;
        return {
            rivalry: this._relationshipService.getRivalry(engineOrSave, actorA, actorB),
            alliance: this._relationshipService.getAlliance(engineOrSave, actorA, actorB)
        };
    }

    // ========================================================================
    // CAMADA 4 — NARRATIVA (arcos nomeados)
    // ========================================================================

    /**
     * Opens narrative arc (rivalidade, "Sombra do Pai", etc.)
     */
    openArc(engineOrSave, arcName, actors = [], context = {}) {
        if (!engineOrSave) return { success: false };
        engineOrSave.arcs = engineOrSave.arcs || [];

        // Avoid duplicates by name + same actors
        const key = `${arcName}_${[...actors].sort().join('-')}`;
        const existing = engineOrSave.arcs.find(a => a.status === 'open' && a._key === key);
        if (existing) return { success: false, msg: 'arc já aberta' };

        engineOrSave.arcs.push({
            id: nextEventId(),
            name: arcName,
            status: 'open',
            openedAt: context.ts ?? Date.now(),
            triggerEvents: context.triggerEvents ?? [],
            actors,
            milestones: [],
            expiresAt: context.expiresAt ?? null,
            closureCondition: context.closureCondition ?? null,
            _key: key
        });
        return { success: true };
    }

    /**
     * Returns open arcs (status === 'open').
     */
    getOpenArcs(engineOrSave) {
        if (!engineOrSave?.arcs) return [];
        return engineOrSave.arcs.filter(a => a.status === 'open');
    }

    /**
     * Closes an arc by id.
     */
    closeArc(engineOrSave, arcId, closureContext = {}) {
        if (!engineOrSave?.arcs) return { success: false };
        const arc = engineOrSave.arcs.find(a => a.id === arcId);
        if (!arc) return { success: false, msg: 'arc não encontrado' };
        arc.status = 'closed';
        arc.closedAt = closureContext.ts ?? Date.now();
        arc.closureReason = closureContext.reason || 'unknown';
        return { success: true };
    }

    /**
     * Adds milestone to existing arc.
     */
    addMilestone(engineOrSave, arcId, milestone) {
        if (!engineOrSave?.arcs) return { success: false };
        const arc = engineOrSave.arcs.find(a => a.id === arcId);
        if (!arc) return { success: false };
        arc.milestones = arc.milestones || [];
        arc.milestones.push({ ...milestone, ts: milestone.ts ?? Date.now() });
        return { success: true };
    }

    // ========================================================================
    // CAMADA 5 — MITO (integration)
    // ========================================================================

    /**
     * Promotes player → legend canonization (delegates to MythService).
     */
    canonize(engineOrSave, playerId, mythSlot) {
        if (!this._mythService) return { success: false, msg: 'mythService not injected' };
        return this._mythService.addLegend(engineOrSave, playerId, mythSlot);
    }

    /**
     * Promotes to club hall via MythService.
     */
    promoteToHall(engineOrSave, playerId, clubId, slot) {
        if (!this._mythService) return { success: false, msg: 'mythService not injected' };
        return this._mythService.promoteToHallOfFame(engineOrSave, playerId, clubId, slot);
    }
}
